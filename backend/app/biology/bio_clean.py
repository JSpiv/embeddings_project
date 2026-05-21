import numpy as np
import pandas as pd
from typing import Any


def clean_bio_dataframe(
    df: pd.DataFrame,
) -> tuple[pd.DataFrame, pd.DataFrame, dict[str, Any]]:
    report: dict[str, Any] = {}
    original_shape = df.shape

    df = df.dropna(how="all").dropna(axis=1, how="all")
    report["dropped_empty_rows"] = original_shape[0] - df.shape[0]
    report["dropped_empty_cols"] = original_shape[1] - df.shape[1]

    # Separate numeric feature columns from metadata
    numeric_cols = []
    metadata_cols = []
    for col in df.columns:
        converted = pd.to_numeric(df[col], errors="coerce")
        if converted.notna().sum() / max(len(df), 1) >= 0.5:
            df[col] = converted
            numeric_cols.append(col)
        else:
            metadata_cols.append(col)

    metadata_df = df[metadata_cols].copy()
    feature_df = df[numeric_cols].copy().astype(float)

    # Replace inf values
    inf_count = np.isinf(feature_df.values).sum()
    feature_df.replace([np.inf, -np.inf], np.nan, inplace=True)
    report["inf_replaced"] = int(inf_count)

    # Median imputation
    missing_count = int(feature_df.isna().sum().sum())
    feature_df.fillna(feature_df.median(), inplace=True)
    report["missing_imputed"] = missing_count

    # Remove zero-variance columns
    variances = feature_df.var()
    zero_var_cols = variances[variances == 0].index.tolist()
    feature_df.drop(columns=zero_var_cols, inplace=True)
    report["zero_variance_cols_dropped"] = len(zero_var_cols)

    report["final_shape"] = feature_df.shape
    return feature_df, metadata_df, report
