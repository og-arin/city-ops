from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.db import get_db
from app.schemas.conflict import ConflictCheckRequest, ConflictCheckResponse
from app.services.spatial import check_conflicts

router = APIRouter(prefix="/conflicts", tags=["conflicts"])


@router.post("/check", response_model=ConflictCheckResponse)
def check(payload: ConflictCheckRequest, db: Session = Depends(get_db)):
    """
    Pre-submit preview: user draws a polygon, sees conflicts live, BEFORE
    filling out the rest of the work-order form. Same engine as the one
    baked into POST /work-orders — this just doesn't persist anything.
    """
    conflicts = check_conflicts(db, payload.polygon_geojson)
    return ConflictCheckResponse(has_conflict=len(conflicts) > 0, conflicts=conflicts)
