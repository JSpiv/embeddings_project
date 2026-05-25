"""
Admin script to process a dataset and push all projection/cluster combinations to Supabase.
Runs all 3 projections (PCA, UMAP, t-SNE) × clusters 2-6 = 15 rows per dataset.
No cell limit — intended for pre-loading curated datasets only.

Usage:
  cd backend
  uv run python scripts/load_dataset.py \
    --file path/to/file.h5ad \
    --name "PBMC 3k" \
    --description "2,700 PBMCs from a healthy donor (10x Genomics)"
"""

import argparse
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))

from app.config import SUPABASE_URL, SUPABASE_KEY
from app.biology.bio_io import load_csv, load_h5ad
from app.biology.bio_clean import clean_bio_dataframe
from app.biology.scanpy_pipeline import run_scanpy_embedding, run_scanpy_embedding_from_adata
from app.biology.clustering import kmeans_cluster
from app.projections.registry import PROJECTORS
from app.schemas import Point
from app.storage.datasets_repo import save_dataset

CLUSTER_RANGE = range(2, 7)  # 2, 3, 4, 5, 6


def main():
    parser = argparse.ArgumentParser(description="Load all projection/cluster combinations into Supabase")
    parser.add_argument("--file", required=True, help="Path to CSV or H5AD file")
    parser.add_argument("--name", required=True, help="Display name for the dataset")
    parser.add_argument("--description", default="", help="Short description")
    args = parser.parse_args()

    if not SUPABASE_URL or not SUPABASE_KEY:
        print("ERROR: SUPABASE_URL and SUPABASE_KEY must be set in your environment")
        sys.exit(1)

    file_path = Path(args.file)
    if not file_path.exists():
        print(f"ERROR: File not found: {file_path}")
        sys.exit(1)

    # Load and compute PCA embedding once — reused for all combinations
    print(f"Loading {file_path.name}...")
    ext = file_path.suffix.lower()
    if ext == ".h5ad":
        adata = load_h5ad(file_path)
        print(f"  {adata.n_obs:,} cells × {adata.n_vars:,} genes")
        try:
            latent_embedding, metadata_df = run_scanpy_embedding_from_adata(adata)
        except ValueError as e:
            print(f"ERROR: {e}")
            sys.exit(1)
        cleaning_report = {"source": "h5ad", "shape": list(adata.shape)}
    else:
        df = load_csv(file_path)
        print(f"  {len(df):,} rows × {len(df.columns):,} columns")
        cleaned_matrix, metadata_df, cleaning_report = clean_bio_dataframe(df)
        latent_embedding = run_scanpy_embedding(cleaned_matrix)

    total = len(PROJECTORS) * len(CLUSTER_RANGE)
    done = 0

    # Compute all projections once (expensive), then loop clusters
    projection_coords: dict[str, any] = {}
    for projection_name in PROJECTORS:
        print(f"Running {projection_name.upper()} projection...")
        projection_coords[projection_name] = PROJECTORS[projection_name](latent_embedding)

    for projection_name, coords in projection_coords.items():
        for k in CLUSTER_RANGE:
            done += 1
            print(f"[{done}/{total}] {projection_name.upper()} k={k}...")

            cluster_labels = kmeans_cluster(latent_embedding, n_clusters=k)

            points = []
            for i, row in enumerate(coords):
                x, y, z = float(row[0]), float(row[1]), float(row[2])
                cell_id = str(metadata_df.index[i]) if i < len(metadata_df) else f"cell_{i}"
                meta = metadata_df.iloc[i].to_dict() if i < len(metadata_df) else {}
                points.append(Point(id=cell_id, x=x, y=y, z=z, cluster=int(cluster_labels[i]), metadata=meta))

            dataset_id = save_dataset(
                name=args.name,
                description=args.description,
                projection_method=projection_name,
                n_clusters=k,
                points=points,
                cleaning_report=cleaning_report,
            )
            print(f"  Saved → {dataset_id}")

    print(f"\nDone. {total} combinations saved for '{args.name}'.")


if __name__ == "__main__":
    main()
