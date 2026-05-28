import uuid
from pathlib import Path

from fastapi import FastAPI, File, UploadFile, HTTPException, Form
from fastapi.middleware.cors import CORSMiddleware

from app.config import TMP_DIR, MAX_UPLOAD_BYTES, MAX_CELLS
from app.schemas import UploadResponse, ProcessResponse, Point, SharedDataset, SharedDatasetDetail
from app.biology.bio_io import load_csv, load_h5ad, SUPPORTED_EXTENSIONS
from app.biology.bio_clean import clean_bio_dataframe
from app.biology.scanpy_pipeline import run_scanpy_embedding, run_scanpy_embedding_from_adata
from app.biology.clustering import kmeans_cluster
from app.projections.registry import PROJECTORS
from app.storage.datasets_repo import list_datasets, get_dataset, lookup_dataset

app = FastAPI(title="Embeddings API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
async def health():
    return {"status": "ok"}


@app.post("/upload", response_model=UploadResponse)
async def upload_file(file: UploadFile = File(...)):
    suffix = Path(file.filename or "").suffix.lower()
    if suffix not in SUPPORTED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file type. Supported: {sorted(SUPPORTED_EXTENSIONS)}",
        )

    content = await file.read()
    if len(content) > MAX_UPLOAD_BYTES:
        raise HTTPException(
            status_code=413,
            detail=f"File too large. User uploads are limited to {MAX_UPLOAD_BYTES // (1024 * 1024)} MB.",
        )

    file_id = str(uuid.uuid4())
    dest = TMP_DIR / f"{file_id}{suffix}"
    dest.write_bytes(content)
    return UploadResponse(file_id=file_id)


@app.post("/process", response_model=ProcessResponse)
async def process_file(
    file_id: str = Form(...),
    projection_method: str = Form(...),
    n_clusters: int = Form(8),
):
    if projection_method not in PROJECTORS:
        raise HTTPException(
            status_code=400,
            detail=f"Unknown projection method. Choose from: {list(PROJECTORS.keys())}",
        )

    matches = list(TMP_DIR.glob(f"{file_id}.*"))
    if not matches:
        raise HTTPException(status_code=404, detail="File not found")
    file_path = matches[0]

    try:
        ext = file_path.suffix.lower()
        if ext == ".h5ad":
            adata = load_h5ad(file_path)
            if adata.n_obs > MAX_CELLS:
                raise HTTPException(
                    status_code=422,
                    detail=f"Dataset has {adata.n_obs:,} cells. User uploads are limited to {MAX_CELLS:,} cells. Use a shared dataset instead.",
                )
            try:
                latent_embedding, metadata_df = run_scanpy_embedding_from_adata(adata)
            except ValueError as e:
                raise HTTPException(status_code=422, detail=str(e))
            cleaning_report: dict = {"source": "h5ad", "shape": list(adata.shape)}
        else:
            df = load_csv(file_path)
            if len(df) > MAX_CELLS:
                raise HTTPException(
                    status_code=422,
                    detail=f"Dataset has {len(df):,} rows. User uploads are limited to {MAX_CELLS:,} cells.",
                )
            cleaned_matrix, metadata_df, cleaning_report = clean_bio_dataframe(df)
            latent_embedding = run_scanpy_embedding(cleaned_matrix)

        cluster_labels = kmeans_cluster(latent_embedding, n_clusters=n_clusters)
        projector = PROJECTORS[projection_method]
        coords = projector(latent_embedding)

        points = []
        for i, row in enumerate(coords):
            x, y, z = float(row[0]), float(row[1]), float(row[2])
            cell_id = str(metadata_df.index[i]) if i < len(metadata_df) else f"cell_{i}"
            meta = metadata_df.iloc[i].to_dict() if i < len(metadata_df) else {}
            points.append(Point(id=cell_id, x=x, y=y, z=z, cluster=int(cluster_labels[i]), metadata=meta))

        return ProcessResponse(points=points, cleaning_report=cleaning_report)
    finally:
        file_path.unlink(missing_ok=True)


@app.get("/datasets", response_model=list[SharedDataset])
async def get_datasets():
    try:
        return list_datasets()
    except Exception as e:
        raise HTTPException(status_code=503, detail=f"Storage unavailable: {e}")


@app.get("/datasets/{dataset_id}", response_model=SharedDatasetDetail)
async def get_dataset_by_id(dataset_id: str):
    try:
        data = get_dataset(dataset_id)
    except Exception as e:
        raise HTTPException(status_code=503, detail=f"Storage unavailable: {e}")
    if not data:
        raise HTTPException(status_code=404, detail="Dataset not found")
    return data


@app.get("/datasets/lookup/by-params", response_model=SharedDatasetDetail)
async def lookup_dataset_by_params(name: str, projection_method: str, n_clusters: int):
    try:
        data = lookup_dataset(name, projection_method, n_clusters)
    except Exception as e:
        raise HTTPException(status_code=503, detail=f"Storage unavailable: {e}")
    if not data:
        raise HTTPException(status_code=404, detail="No dataset found for these parameters")
    return data
