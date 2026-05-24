from pydantic import BaseModel
from typing import Any


class UploadResponse(BaseModel):
    file_id: str


class Point(BaseModel):
    id: str
    x: float
    y: float
    z: float
    cluster: int
    metadata: dict[str, Any]


class ProcessResponse(BaseModel):
    model_id: str | None = None
    points: list[Point]
    cleaning_report: dict[str, Any]


class SavedModel(BaseModel):
    id: str
    name: str
    projection_method: str
    n_clusters: int
    created_at: str


class SavedModelDetail(SavedModel):
    points: list[Point]
    cleaning_report: dict[str, Any]
