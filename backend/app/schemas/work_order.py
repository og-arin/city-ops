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
    layer: str
    name: str
    severity: str
    distance_meters: float
    owner_dept_slug: str
    conflict_log_id: Optional[int] = None
    acknowledged: bool = False


class CoDigOpportunity(BaseModel):
    work_order_id: int
    title: str
    department: str
    target_start_date: datetime
    target_end_date: datetime


class WorkOrderResponse(BaseModel):
    id: int
    title: str
    requesting_dept_slug: str
    status: str
    start_date: datetime
    end_date: datetime
    created_at: datetime
    conflicts: list[ConflictItem] = []
    co_dig_opportunities: list[CoDigOpportunity] = []
    
    joint_trench_status: Optional[str] = None
    initiator_work_order_id: Optional[int] = None
    linked_work_order_id: Optional[int] = None
    proposed_joint_start_date: Optional[datetime] = None
    proposed_joint_end_date: Optional[datetime] = None

    class Config:
        from_attributes = True


class AcknowledgeConflictRequest(BaseModel):
    conflict_log_id: int
    dept_slug: str


class ProposeJointTrenchRequest(BaseModel):
    target_work_order_id: int
    proposed_start_date: datetime
    proposed_end_date: datetime


class RespondJointTrenchRequest(BaseModel):
    action: str  # "accept" or "reject"
