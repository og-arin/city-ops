"""
The Brain. Everything else in this app is plumbing around this file.

Core idea: a work order's polygon gets checked against every infrastructure
asset using PostGIS's ST_DWithin (buffer distance) rather than raw
ST_Intersects, because in real life "0.5m away" is still a conflict — pipes
aren't drawn perfectly to scale, and you want a safety margin.

Severity rule (tune this for your demo):
  - red    : asset physically intersects the polygon (distance ~0)
  - yellow : asset is within CONFLICT_BUFFER_METERS but doesn't intersect
"""
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.core.config import settings


def check_conflicts(db: Session, polygon_geojson: dict) -> list[dict]:
    """
    polygon_geojson: a GeoJSON Polygon dict, e.g.
        {"type": "Polygon", "coordinates": [[[lng, lat], [lng, lat], ...]]}

    Returns a list of dicts matching ConflictItem shape, ordered worst-first.
    """
    import json

    geojson_str = json.dumps(polygon_geojson)
    buffer_m = settings.CONFLICT_BUFFER_METERS

    # ST_GeomFromGeoJSON assumes SRID 4326 (lng/lat) — matches our column SRID.
    # We cast to geography for ST_DWithin/ST_Distance so units are METERS, not
    # degrees — this is the single most common PostGIS footgun, don't skip it.
    query = text("""
        SELECT
            id AS asset_id,
            layer,
            name,
            owner_dept_slug,
            ST_Distance(
                geom::geography,
                ST_GeomFromGeoJSON(:polygon)::geography
            ) AS distance_meters,
            ST_Intersects(geom, ST_GeomFromGeoJSON(:polygon)) AS intersects
        FROM infrastructure_assets
        WHERE ST_DWithin(
            geom::geography,
            ST_GeomFromGeoJSON(:polygon)::geography,
            :buffer_m
        )
        ORDER BY distance_meters ASC
    """)

    rows = db.execute(query, {"polygon": geojson_str, "buffer_m": buffer_m}).mappings().all()

    conflicts = []
    for row in rows:
        severity = "red" if row["intersects"] or row["distance_meters"] < 0.5 else "yellow"
        conflicts.append({
            "asset_id": row["asset_id"],
            "layer": row["layer"],
            "name": row["name"],
            "owner_dept_slug": row["owner_dept_slug"],
            "severity": severity,
            "distance_meters": round(float(row["distance_meters"]), 2),
        })

    return conflicts
