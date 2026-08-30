"""
Run with: python -m app.seed.seed_data

Reads real GIS data directly from backend/data/geomap/ and seeds the DB:
  - roads: derived from BRT/Non-BRT bus stop sequences (Excel) -> LineStrings
  - drainage: real Swachh Bharat Mission stormwater data (geojson, used as-is)
  - telecom: synthetic fiber layer (geojson, used as-is, clearly labeled)
  - water: SKIPPED for now -- no public dataset exists; add back once the
    team decides on a synthetic layer.

Safe to re-run: clears + reloads infrastructure_assets and departments each time.
"""
import os

import pandas as pd
from shapely.geometry import shape, LineString, mapping
from geoalchemy2.shape import from_shape

from app.core.db import SessionLocal, engine, Base, init_postgis
from app.models.infrastructure import InfrastructureAsset
from app.models.department import Department

GEOMAP_DIR = os.path.join(os.path.dirname(__file__), "../../data/geomap")

BUS_STOPS_XLS = os.path.join(GEOMAP_DIR, "BRT and NON BRT route details.xls")
BUS_STOPS_SHEET = "376  Rout name, Stage & LL"
DRAINAGE_FILE = os.path.join(GEOMAP_DIR, "drainage_system_combined.geojson")
TELECOM_FILE = os.path.join(GEOMAP_DIR, "synthetic_telecom_fiber.geojson")

DEPARTMENTS = [
    ("Water Department", "water"),
    ("Electricity Department", "electric"),
    ("Road Department", "road"),
    ("Traffic Police", "traffic"),
    ("Waste Management", "waste"),
    ("Municipal Corporation", "municipal"),
    ("Telecom", "telecom"),
    ("Emergency Services", "emergency"),
    ("Drainage Department", "drainage"),
]


def seed_departments(db):
    for name, slug in DEPARTMENTS:
        if not db.query(Department).filter(Department.slug == slug).first():
            db.add(Department(name=name, slug=slug, contact_email=f"{slug}@cityops.demo"))
    db.commit()
    print(f"Departments ready: {len(DEPARTMENTS)}")


def build_road_features():
    """Derive road-corridor LineStrings from bus stop sequences per route."""
    if not os.path.exists(BUS_STOPS_XLS):
        print(f"  skip roads (file not found: {BUS_STOPS_XLS})")
        return []

    xl = pd.ExcelFile(BUS_STOPS_XLS)
    stops = xl.parse(BUS_STOPS_SHEET)

    stops["LAT"] = pd.to_numeric(stops["LAT"], errors="coerce")
    stops["LONG"] = pd.to_numeric(stops["LONG"], errors="coerce")
    stops["Stop Seq"] = pd.to_numeric(stops["Stop Seq"], errors="coerce")
    stops = stops.dropna(subset=["LAT", "LONG", "Route", "Stop Seq"])

    features = []
    for route_id, group in stops.groupby("Route"):
        group = group.sort_values("Stop Seq")
        coords = list(zip(group["LONG"], group["LAT"]))
        if len(coords) < 2:
            continue
        features.append({
            "geom": LineString(coords),
            "name": f"Route {route_id}",
            "owner_dept_slug": "road",
        })

    print(f"Roads: {len(features)} route lines derived from bus stop data")
    return features


def load_geojson_features(path, layer_name):
    """Load a real/synthetic geojson file as-is, tagging owner_dept_slug."""
    if not os.path.exists(path):
        print(f"  skip {layer_name} (file not found: {path})")
        return []

    import json
    with open(path, encoding="utf-8") as f:
        data = json.load(f)

    features = []
    for feat in data.get("features", []):
        try:
            geom = shape(feat["geometry"])
        except Exception:
            continue
        props = feat.get("properties", {})
        name = props.get("name") or props.get("route") or f"{layer_name}-unnamed"
        features.append({
            "geom": geom,
            "name": name,
            "owner_dept_slug": layer_name,
        })

    print(f"{layer_name.capitalize()}: {len(features)} features loaded")
    return features


def seed_infrastructure(db):
    db.query(InfrastructureAsset).delete()
    db.commit()

    all_features = []
    all_features += [{**f, "layer": "road"} for f in build_road_features()]
    all_features += [{**f, "layer": "drainage"} for f in load_geojson_features(DRAINAGE_FILE, "drainage")]
    all_features += [{**f, "layer": "telecom"} for f in load_geojson_features(TELECOM_FILE, "telecom")]
    # water: intentionally skipped -- no dataset yet

    for f in all_features:
        db.add(InfrastructureAsset(
            layer=f["layer"],
            name=f["name"],
            owner_dept_slug=f["owner_dept_slug"],
            depth_meters=None,
            geom=from_shape(f["geom"], srid=4326),
        ))

    db.commit()
    print(f"Infrastructure assets seeded: {len(all_features)}")


if __name__ == "__main__":
    init_postgis()
    Base.metadata.create_all(bind=engine)

    db = SessionLocal()
    try:
        seed_departments(db)
        seed_infrastructure(db)
    finally:
        db.close()