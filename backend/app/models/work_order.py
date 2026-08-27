import enum
from datetime import datetime

from sqlalchemy import Column, Integer, String, DateTime, Enum, ForeignKey, JSON
from geoalchemy2 import Geometry
from sqlalchemy.orm import relationship
from app.core.db import Base


class WorkOrderStatus(str, enum.Enum):
    pending = "pending"          # submitted, conflict check not yet run
    conflict = "conflict"        # conflicts found, awaiting coordination
    coordinating = "coordinating"  # depts notified, acknowledging
    approved = "approved"        # cleared to dig
    completed = "completed"
    rejected = "rejected"


class WorkOrder(Base):
    __tablename__ = "work_orders"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)                      # "Repair Road X"
    requesting_dept_slug = Column(String, nullable=False)
    polygon = Column(Geometry(geometry_type="POLYGON", srid=4326), nullable=False)  # drawn area
    start_date = Column(DateTime, nullable=False)
    end_date = Column(DateTime, nullable=False)
    status = Column(Enum(WorkOrderStatus), default=WorkOrderStatus.pending, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    # cached last conflict-check result, so the UI can render without re-querying PostGIS
    # shape: [{ "asset_id": 4, "layer": "water", "severity": "red", "distance_m": 1.2, "name": "Water Main A" }, ...]
    last_conflict_result = Column(JSON, nullable=True)

    conflicts = relationship("ConflictLog", back_populates="work_order")


class ConflictLog(Base):
    """
    Audit trail: every conflict check we've ever run for a work order, kept
    even after resolution, so there's a paper trail for the demo/pitch
    ("system caught this, department X acknowledged on this date").
    """
    __tablename__ = "conflict_logs"

    id = Column(Integer, primary_key=True, index=True)
    work_order_id = Column(Integer, ForeignKey("work_orders.id"), nullable=False)
    asset_id = Column(Integer, ForeignKey("infrastructure_assets.id"), nullable=False)
    severity = Column(String, nullable=False)   # "red" | "yellow"
    distance_meters = Column(Integer, nullable=False)
    acknowledged_by_dept = Column(String, nullable=True)
    acknowledged_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    work_order = relationship("WorkOrder", back_populates="conflicts")
