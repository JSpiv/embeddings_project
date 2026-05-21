import numpy as np
import pandas as pd
import scanpy as sc
import anndata as ad
from scipy.sparse import issparse


def run_scanpy_embedding(feature_df: pd.DataFrame) -> np.ndarray:
    adata = ad.AnnData(X=feature_df.values.astype(np.float32))
    adata.obs_names = [str(i) for i in feature_df.index]
    adata.var_names = [str(c) for c in feature_df.columns]
    return _run_pipeline(adata)


def run_scanpy_embedding_from_adata(adata: ad.AnnData) -> tuple[np.ndarray, pd.DataFrame]:
    # Densify sparse matrices
    if issparse(adata.X):
        adata.X = adata.X.toarray()
    adata.X = adata.X.astype(np.float32)
    pca = _run_pipeline(adata)
    return pca, adata.obs.copy()


def _run_pipeline(adata: ad.AnnData) -> np.ndarray:
    num_cells, num_features = adata.shape

    sc.pp.normalize_total(adata, target_sum=1e4)
    sc.pp.log1p(adata)

    n_top_genes = min(2000, num_features)
    if num_features > 1:
        sc.pp.highly_variable_genes(adata, n_top_genes=n_top_genes)
        if adata.var["highly_variable"].any():
            adata = adata[:, adata.var["highly_variable"]]

    sc.pp.scale(adata, max_value=10)

    n_comps = min(50, adata.n_vars - 1, num_cells - 1)
    if n_comps < 1:
        n_comps = 1
    sc.tl.pca(adata, n_comps=n_comps)

    return adata.obsm["X_pca"]
