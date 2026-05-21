import numpy as np
from umap import UMAP


def project_umap(embedding: np.ndarray) -> np.ndarray:
    n_neighbors = min(15, embedding.shape[0] - 1)
    reducer = UMAP(n_components=3, n_neighbors=max(2, n_neighbors), random_state=42)
    return reducer.fit_transform(embedding)
