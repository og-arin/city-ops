from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from geoalchemy2.shape import to_shape
from shapely.geometry import mapping

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
    """
    q = db.query(InfrastructureAsset)
    if layer:
        q = q.filter(InfrastructureAsset.layer == layer)
    assets = q.all()

    features = []
    for a in assets:
        geom = to_shape(a.geom)
        features.append({
            "type": "Feature",
            "geometry": mapping(geom),
            "properties": {
                "id": a.id,
                "layer": a.layer,
                "name": a.name,
                "owner_dept_slug": a.owner_dept_slug,
                "depth_meters": a.depth_meters,
            },
        })

    return {"type": "FeatureCollection", "features": features}
