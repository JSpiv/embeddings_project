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
    points: list[Point]
    cleaning_report: dict[str, Any]


class SharedDataset(BaseModel):
    id: str
    name: str
    description: str | None
    projection_method: str
    n_clusters: int
    created_at: str


class SharedDatasetDetail(SharedDataset):
    points: list[Point]
    cleaning_report: dict[str, Any]
