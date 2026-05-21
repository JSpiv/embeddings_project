from app.projections.pca import project_pca
from app.projections.umap_proj import project_umap
from app.projections.tsne import project_tsne
import numpy as np
from typing import Callable

PROJECTORS: dict[str, Callable[[np.ndarray], np.ndarray]] = {
    "pca": project_pca,
    "umap": project_umap,
    "tsne": project_tsne,
}
