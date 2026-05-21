from pathlib import Path
import pandas as pd
import anndata as ad

SUPPORTED_EXTENSIONS = {".csv", ".h5ad"}


def load_csv(path: Path) -> pd.DataFrame:
    return pd.read_csv(path, index_col=0)


def load_h5ad(path: Path) -> ad.AnnData:
    return ad.read_h5ad(path)
