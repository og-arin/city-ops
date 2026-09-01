"""
Run with: python -m app.seed.seed_data

Reads real GIS data and seeds the DB:
  - roads: Real OSM network (motorway, primary, secondary, residential) -> LineStrings
  - drainage: real Swachh Bharat Mission stormwater data (geojson, used as-is)
  - telecom: synthetic fiber layer (geojson, used as-is, clearly labeled)
  - water: SKIPPED for now.
"""
import os
import requests
import json
import pandas as pd
from shapely.geometry import shape, LineString
from geoalchemy2.shape import from_shape

from app.core.db import SessionLocal, engine, Base, init_postgis
from app.models.infrastructure import InfrastructureAsset
from app.models.department import Department

GEOMAP_DIR = os.path.join(os.path.dirname(__file__), "../../data/geomap")
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
    """Download actual drivable roads from OpenStreetMap and convert to LineStrings."""
    print("🌍 Requesting OPTIMIZED road network for Pune from OpenStreetMap...")
    overpass_url = "https://lz4.overpass-api.de/api/interpreter"
    overpass_query = """
    [out:json][timeout:90];
    (
      way["highway"~"motorway|trunk|primary|secondary|tertiary|residential"](18.5000,73.8300,18.5400,73.8700);
    );
    out geom;
    """
    headers = {"User-Agent": "CityOpsAI-Project/1.0"}
    
    try:
        response = requests.post(overpass_url, data=overpass_query, headers=headers, timeout=90)
        response.raise_for_status()
        data = response.json()
    except Exception as e:
        print(f"❌ Failed to fetch from OSM: {e}")
        return []

    features = []
    for element in data.get("elements", []):
        if element["type"] == "way" and "geometry" in element:
            coords = [(node["lon"], node["lat"]) for node in element["geometry"]]
            if len(coords) > 1:
                # OSM provides street names, fallback to "Unnamed Road"
                name = element.get("tags", {}).get("name", "Unnamed Road")
                features.append({
                    "geom": LineString(coords),
                    "name": name,
                    "owner_dept_slug": "road",
                })

    print(f"Roads: {len(features)} actual OSM road segments loaded")
    return features

def load_geojson_features(path, layer_name):
    if not os.path.exists(path):
        print(f"  skip {layer_name} (file not found: {path})")
        return []

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
    print("🗑️ Clearing old infrastructure data...")
    db.query(InfrastructureAsset).delete()
    db.commit()

    all_features = []
    all_features += [{**f, "layer": "road"} for f in build_road_features()]
    all_features += [{**f, "layer": "drainage"} for f in load_geojson_features(DRAINAGE_FILE, "drainage")]
    all_features += [{**f, "layer": "telecom"} for f in load_geojson_features(TELECOM_FILE, "telecom")]

    print("🚀 Uploading geometries via GeoAlchemy2...")
    for f in all_features:
        db.add(InfrastructureAsset(
            layer=f["layer"],
            name=f["name"],
            owner_dept_slug=f["owner_dept_slug"],
            depth_meters=None,
            geom=from_shape(f["geom"], srid=4326),
        ))

    db.commit()
    print(f"🎉 Infrastructure assets successfully seeded: {len(all_features)}")

if __name__ == "__main__":
    init_postgis()
    Base.metadata.create_all(bind=engine)

    db = SessionLocal()
    try:
        seed_departments(db)
        seed_infrastructure(db)
    finally:
        db.close()