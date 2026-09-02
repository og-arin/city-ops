import json

from fastapi import APIRouter, Depends, Query
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.core.db import get_db
from app.models.infrastructure import InfrastructureAsset

router = APIRouter(prefix="/infrastructure", tags=["infrastructure"])


@router.get("")
def get_infrastructure(
    layer: str | None = Query(None, description="Filter by layer: road|water|electric|telecom"),
    db: Session = Depends(get_db),
):
    """
    Returns a GeoJSON FeatureCollection — frontend can feed this straight into
    a Mapbox/Leaflet source with zero transformation.

    Geometry is serialized to GeoJSON by PostGIS (ST_AsGeoJSON) instead of
    round-tripping every row through shapely in Python — for a few thousand
    road/drainage segments the Python loop was taking 6-11s and losing the
    race against the frontend's request timeout.
    """
    q = db.query(
        InfrastructureAsset.id,
        InfrastructureAsset.layer,
        InfrastructureAsset.name,
        InfrastructureAsset.owner_dept_slug,
        InfrastructureAsset.depth_meters,
        func.ST_AsGeoJSON(InfrastructureAsset.geom).label("geom"),
    )
    if layer:
        q = q.filter(InfrastructureAsset.layer == layer)

    features = [
        {
            "type": "Feature",
            "geometry": json.loads(row.geom),
            "properties": {
                "id": row.id,
                "layer": row.layer,
                "name": row.name,
                "owner_dept_slug": row.owner_dept_slug,
                "depth_meters": row.depth_meters,
            },
        }
        for row in q.all()
    ]

    return {"type": "FeatureCollection", "features": features}
