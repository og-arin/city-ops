from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field


class WorkOrderCreate(BaseModel):
    title: str
    requesting_dept_slug: str
    polygon_geojson: dict = Field(
        ..., description="GeoJSON Polygon geometry, e.g. {'type': 'Polygon', 'coordinates': [[[lng,lat],...]]}"
    )
    start_date: datetime
    end_date: datetime


class ConflictItem(BaseModel):
    asset_id: int
    layer: str            # water | electric | telecom | road
    name: str
    severity: str          # red | yellow
    distance_meters: float
    owner_dept_slug: str


class WorkOrderResponse(BaseModel):
    id: int
    title: str
    requesting_dept_slug: str
    status: str
    start_date: datetime
    end_date: datetime
    created_at: datetime
    conflicts: list[ConflictItem] = []

    class Config:
        from_attributes = True


class AcknowledgeConflictRequest(BaseModel):
    conflict_log_id: int
    dept_slug: str
