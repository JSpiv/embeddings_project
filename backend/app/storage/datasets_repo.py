from typing import Any
from app.storage.supabase_client import get_client
from app.schemas import Point

TABLE = "shared_datasets"


def save_dataset(
    name: str,
    description: str,
    projection_method: str,
    n_clusters: int,
    points: list[Point],
    cleaning_report: dict[str, Any],
) -> str:
    client = get_client()
    result = (
        client.table(TABLE)
        .insert({
            "name": name,
            "description": description,
            "projection_method": projection_method,
            "n_clusters": n_clusters,
            "points": [p.model_dump() for p in points],
            "cleaning_report": cleaning_report,
        })
        .execute()
    )
    return result.data[0]["id"]


def list_datasets() -> list[dict[str, Any]]:
    client = get_client()
    result = (
        client.table(TABLE)
        .select("id, name, description, projection_method, n_clusters, created_at")
        .order("created_at", desc=True)
        .execute()
    )
    return result.data


def get_dataset(dataset_id: str) -> dict[str, Any] | None:
    client = get_client()
    result = (
        client.table(TABLE)
        .select("*")
        .eq("id", dataset_id)
        .single()
        .execute()
    )
    return result.data
