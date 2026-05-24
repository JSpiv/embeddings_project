"""
Admin script to process a dataset and push it to Supabase as a shared dataset.
No cell limit — intended for pre-loading curated datasets only.

Usage:
  cd backend
  uv run python scripts/load_dataset.py \
    --file path/to/file.h5ad \
    --name "PBMC 3k" \
    --description "2,700 PBMCs from a healthy donor (10x Genomics)" \
    --projection umap \
    --n-clusters 8
"""

import argparse
import sys
from pathlib import Path

# Allow imports from app/
sys.path.insert(0, str(Path(__file__).parent.parent))

from app.config import SUPABASE_URL, SUPABASE_KEY
from app.biology.bio_io import load_csv, load_h5ad
from app.biology.bio_clean import clean_bio_dataframe
from app.biology.scanpy_pipeline import run_scanpy_embedding, run_scanpy_embedding_from_adata
from app.biology.clustering import kmeans_cluster
from app.projections.registry import PROJECTORS
from app.schemas import Point
from app.storage.datasets_repo import save_dataset


def main():
    parser = argparse.ArgumentParser(description="Load a shared dataset into Supabase")
    parser.add_argument("--file", required=True, help="Path to CSV or H5AD file")
    parser.add_argument("--name", required=True, help="Display name for the dataset")
    parser.add_argument("--description", default="", help="Short description")
    parser.add_argument("--projection", default="umap", choices=list(PROJECTORS.keys()))
    parser.add_argument("--n-clusters", type=int, default=8)
    args = parser.parse_args()

    if not SUPABASE_URL or not SUPABASE_KEY:
        print("ERROR: SUPABASE_URL and SUPABASE_KEY must be set in your environment or .env file")
        sys.exit(1)

    file_path = Path(args.file)
    if not file_path.exists():
        print(f"ERROR: File not found: {file_path}")
        sys.exit(1)

    print(f"Loading {file_path.name}...")
    ext = file_path.suffix.lower()

    if ext == ".h5ad":
        adata = load_h5ad(file_path)
        print(f"  {adata.n_obs:,} cells × {adata.n_vars:,} genes")
        pca_embedding, metadata_df = run_scanpy_embedding_from_adata(adata)
        cleaning_report = {"source": "h5ad", "shape": list(adata.shape)}
    else:
        df = load_csv(file_path)
        print(f"  {len(df):,} rows × {len(df.columns):,} columns")
        cleaned_matrix, metadata_df, cleaning_report = clean_bio_dataframe(df)
        pca_embedding = run_scanpy_embedding(cleaned_matrix)

    print(f"Running k-means (k={args.n_clusters})...")
    cluster_labels = kmeans_cluster(pca_embedding, n_clusters=args.n_clusters)

    print(f"Running {args.projection.upper()} projection...")
    projector = PROJECTORS[args.projection]
    coords = projector(pca_embedding)

    points = []
    for i, row in enumerate(coords):
        x, y, z = float(row[0]), float(row[1]), float(row[2])
        cell_id = str(metadata_df.index[i]) if i < len(metadata_df) else f"cell_{i}"
        meta = metadata_df.iloc[i].to_dict() if i < len(metadata_df) else {}
        points.append(Point(id=cell_id, x=x, y=y, z=z, cluster=int(cluster_labels[i]), metadata=meta))

    print(f"Saving {len(points):,} points to Supabase...")
    dataset_id = save_dataset(
        name=args.name,
        description=args.description,
        projection_method=args.projection,
        n_clusters=args.n_clusters,
        points=points,
        cleaning_report=cleaning_report,
    )
    print(f"Done. Dataset ID: {dataset_id}")


if __name__ == "__main__":
    main()
