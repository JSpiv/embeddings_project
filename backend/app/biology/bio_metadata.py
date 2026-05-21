import pandas as pd
from typing import Any


def summarize_metadata(metadata_df: pd.DataFrame) -> dict[str, Any]:
    summary: dict[str, Any] = {}
    for col in metadata_df.columns:
        unique_vals = metadata_df[col].dropna().unique()
        summary[col] = {
            "unique_count": len(unique_vals),
            "sample_values": list(unique_vals[:5]),
        }
    return summary
