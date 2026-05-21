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

1. Upload a CSV file (rows = cells/samples, columns = features/genes)
2. Select a projection method: PCA, UMAP, or t-SNE
3. Click Process
4. Explore the embedding — click any point to inspect its metadata

## API

- `POST /upload` — upload a CSV, returns `{ file_id }`
- `POST /process` — process with `file_id` + `projection_method` form fields, returns points
