from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.core.db import get_db
from app.models.infrastructure import InfrastructureAsset
from app.models.work_order import WorkOrder

router = APIRouter(prefix="/stats", tags=["Stats"])

@router.get("")
def get_stats(db: Session = Depends(get_db)):
    active_assets = db.query(func.count(InfrastructureAsset.id)).scalar() or 0
    
    depts_coordinating = db.query(func.count(func.distinct(WorkOrder.requesting_dept_slug)))\
        .filter(WorkOrder.joint_trench_status.in_(["proposed", "accepted"])).scalar() or 0
        
    live_conflicts = db.query(func.count(WorkOrder.id))\
        .filter(WorkOrder.status == "conflict").scalar() or 0
        
    return {
        "active_assets": active_assets,
        "departments_coordinating": depts_coordinating,
        "live_conflicts": live_conflicts
    }
