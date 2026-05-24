# Biological Embedding Visualization Platform

Interactive visualization platform for biological datasets using dimensionality reduction.

## Quick Start

### Backend

```bash
cd backend
uv sync
uv run uvicorn app.main:app --reload
```

Backend runs at http://localhost:8000

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend runs at http://localhost:3000

## Docker (Backend)

```bash
cd backend
docker build -t embeddings-backend .
docker run -p 8000:8000 embeddings-backend
```

## Usage

1. Upload a CSV or H5AD file (rows = cells/samples, columns = features/genes)
2. Select a projection method: PCA, UMAP, or t-SNE
3. Click Process
4. Explore the embedding — click any point to inspect its metadata

## Known Limitations

**H5AD pre-processing detection is biology-specific and incomplete.** The current fix for pre-processed H5AD files (checking for `X_pca` in `adata.obsm`) is a heuristic that works for standard scanpy-processed datasets. It does not cover all cases:

- Files with PCA stored under a non-standard key will still be re-processed
- Files that are partially processed (e.g. normalized but no PCA) will run the full pipeline, which may fail or produce unexpected results
- No validation is done to check whether the existing PCA is compatible with the requested projection
- This logic is only implemented for H5AD — CSV files always run the full pipeline regardless of content

A complete fix would require explicit metadata about the processing state of the file.

## API

- `POST /upload` — upload a CSV, returns `{ file_id }`
- `POST /process` — process with `file_id` + `projection_method` form fields, returns points
