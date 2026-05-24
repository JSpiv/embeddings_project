from typing import Any
from app.storage.supabase_client import get_client
from app.schemas import Point

TABLE = "models"


def save_model(
    name: str,
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
            "projection_method": projection_method,
            "n_clusters": n_clusters,
            "points": [p.model_dump() for p in points],
            "cleaning_report": cleaning_report,
        })
        .execute()
    )
    return result.data[0]["id"]


def list_models() -> list[dict[str, Any]]:
    client = get_client()
    result = (
        client.table(TABLE)
        .select("id, name, projection_method, n_clusters, created_at")
        .order("created_at", desc=True)
        .execute()
    )
    return result.data


def get_model(model_id: str) -> dict[str, Any] | None:
    client = get_client()
    result = (
        client.table(TABLE)
        .select("*")
        .eq("id", model_id)
        .single()
        .execute()
    )
    return result.data


def delete_model(model_id: str) -> None:
    client = get_client()
    client.table(TABLE).delete().eq("id", model_id).execute()
