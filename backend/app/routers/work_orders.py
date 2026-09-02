import json
import logging
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from geoalchemy2.shape import from_shape
from shapely.geometry import shape

from app.core.db import get_db
from app.models.work_order import WorkOrder, WorkOrderStatus, ConflictLog
from app.models.department import Department
from app.models.infrastructure import InfrastructureAsset
from app.schemas.work_order import WorkOrderCreate, WorkOrderResponse, AcknowledgeConflictRequest
from app.services.spatial import check_conflicts
from app.services.notifications import notify_conflict

router = APIRouter(prefix="/work-orders", tags=["work-orders"])
logger = logging.getLogger(__name__)


def _serialize_conflicts(db: Session, work_order_id: int) -> list[dict]:
    rows = (
        db.query(ConflictLog, InfrastructureAsset)
        .join(InfrastructureAsset, ConflictLog.asset_id == InfrastructureAsset.id)
        .filter(ConflictLog.work_order_id == work_order_id)
        .order_by(ConflictLog.distance_meters.asc())
        .all()
    )
    return [
        {
            "asset_id": asset.id,
            "layer": asset.layer,
            "name": asset.name,
            "owner_dept_slug": asset.owner_dept_slug,
            "severity": log.severity,
            "distance_meters": log.distance_meters,
            "conflict_log_id": log.id,
            "acknowledged": log.acknowledged_at is not None,
        }
        for log, asset in rows
    ]


@router.post("", response_model=WorkOrderResponse)
def create_work_order(payload: WorkOrderCreate, db: Session = Depends(get_db)):
    """
    The killer-feature endpoint. Submit a polygon -> get conflicts back
    immediately, in the same response. No separate "check then submit" round
    trip needed, though POST /conflicts/check exists for a pre-submit preview.
    """
    geom = from_shape(shape(payload.polygon_geojson), srid=4326)

    work_order = WorkOrder(
        title=payload.title,
        requesting_dept_slug=payload.requesting_dept_slug,
        polygon=geom,
        start_date=payload.start_date,
        end_date=payload.end_date,
    )
    db.add(work_order)
    db.flush()  # get work_order.id before commit

    conflicts = check_conflicts(db, payload.polygon_geojson)

    if conflicts:
        work_order.status = WorkOrderStatus.conflict
        work_order.last_conflict_result = conflicts
        for c in conflicts:
            db.add(ConflictLog(
                work_order_id=work_order.id,
                asset_id=c["asset_id"],
                severity=c["severity"],
                distance_meters=c["distance_meters"],
            ))

        # notify affected departments
        affected_depts = {c["owner_dept_slug"] for c in conflicts}
        recipients = [
            d.contact_email for d in db.query(Department).filter(Department.slug.in_(affected_depts)).all()
            if d.contact_email
        ]
        try:
            notify_conflict(work_order.title, work_order.requesting_dept_slug, conflicts, recipients)
        except Exception:
            # Best-effort alert — a Resend outage or bad API key must not
            # roll back a work order that was already correctly created.
            logger.exception("notify_conflict failed for work order %s", work_order.id)
    else:
        work_order.status = WorkOrderStatus.approved

    db.commit()
    db.refresh(work_order)

    return WorkOrderResponse(
        id=work_order.id,
        title=work_order.title,
        requesting_dept_slug=work_order.requesting_dept_slug,
        status=work_order.status.value,
        start_date=work_order.start_date,
        end_date=work_order.end_date,
        created_at=work_order.created_at,
        conflicts=_serialize_conflicts(db, work_order.id) if conflicts else [],
    )


@router.get("", response_model=list[WorkOrderResponse])
def list_work_orders(db: Session = Depends(get_db)):
    orders = db.query(WorkOrder).order_by(WorkOrder.created_at.desc()).all()
    return [
        WorkOrderResponse(
            id=o.id, title=o.title, requesting_dept_slug=o.requesting_dept_slug,
            status=o.status.value, start_date=o.start_date, end_date=o.end_date,
            created_at=o.created_at, conflicts=_serialize_conflicts(db, o.id),
        ) for o in orders
    ]


@router.get("/{work_order_id}", response_model=WorkOrderResponse)
def get_work_order(work_order_id: int, db: Session = Depends(get_db)):
    o = db.query(WorkOrder).filter(WorkOrder.id == work_order_id).first()
    if not o:
        raise HTTPException(status_code=404, detail="Work order not found")
    return WorkOrderResponse(
        id=o.id, title=o.title, requesting_dept_slug=o.requesting_dept_slug,
        status=o.status.value, start_date=o.start_date, end_date=o.end_date,
        created_at=o.created_at, conflicts=_serialize_conflicts(db, o.id),
    )


@router.post("/acknowledge-conflict")
def acknowledge_conflict(payload: AcknowledgeConflictRequest, db: Session = Depends(get_db)):
    """
    Closes the loop the architecture doc calls out as missing: a dept
    acknowledges a flagged conflict -> log gets timestamped -> once all
    conflicts on a work order are acknowledged, status flips to coordinating.
    """
    log = db.query(ConflictLog).filter(ConflictLog.id == payload.conflict_log_id).first()
    if not log:
        raise HTTPException(status_code=404, detail="Conflict log not found")

    log.acknowledged_by_dept = payload.dept_slug
    log.acknowledged_at = datetime.utcnow()
    db.commit()

    remaining = db.query(ConflictLog).filter(
        ConflictLog.work_order_id == log.work_order_id,
        ConflictLog.acknowledged_at.is_(None),
    ).count()

    if remaining == 0:
        wo = db.query(WorkOrder).filter(WorkOrder.id == log.work_order_id).first()
        wo.status = WorkOrderStatus.coordinating
        db.commit()

    return {"ok": True, "remaining_unacknowledged": remaining}