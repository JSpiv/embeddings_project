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
