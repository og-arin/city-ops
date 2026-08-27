"""
Run with: python -m app.seed.seed_data
Loads data/geojson/*.geojson into infrastructure_assets, and creates the 8
standard departments. Safe to re-run (clears + reloads infra assets each time,
skips departments that already exist).
"""
import json
import os

from geoalchemy2.shape import from_shape
from shapely.geometry import shape

from app.core.db import SessionLocal, engine, Base, init_postgis
from app.models.infrastructure import InfrastructureAsset
from app.models.department import Department

DATA_DIR = os.path.join(os.path.dirname(__file__), "../../../data/geojson")

LAYER_FILES = {
    "road": "roads.geojson",
    "water": "water_pipes.geojson",
    "electric": "electric_cables.geojson",
    "telecom": "telecom.geojson",
}

DEPARTMENTS = [
    ("Water Department", "water"),
    ("Electricity Department", "electric"),
    ("Road Department", "road"),
    ("Traffic Police", "traffic"),
    ("Waste Management", "waste"),
    ("Municipal Corporation", "municipal"),
    ("Telecom", "telecom"),
    ("Emergency Services", "emergency"),
]


def seed_departments(db):
    for name, slug in DEPARTMENTS:
        if not db.query(Department).filter(Department.slug == slug).first():
            db.add(Department(name=name, slug=slug, contact_email=f"{slug}@cityops.demo"))
    db.commit()
    print(f"Departments ready: {len(DEPARTMENTS)}")


def seed_infrastructure(db):
    db.query(InfrastructureAsset).delete()
    db.commit()

    total = 0
    for layer, filename in LAYER_FILES.items():
        path = os.path.join(DATA_DIR, filename)
        if not os.path.exists(path):
            print(f"  skip {filename} (not found)")
            continue

        with open(path) as f:
            geojson = json.load(f)

        for feature in geojson["features"]:
            geom = from_shape(shape(feature["geometry"]), srid=4326)
            props = feature.get("properties", {})
            db.add(InfrastructureAsset(
                layer=layer,
                name=props.get("name", f"{layer}-unnamed"),
                owner_dept_slug=props.get("owner_dept_slug", layer),
                depth_meters=props.get("depth_meters"),
                geom=geom,
            ))
            total += 1

    db.commit()
    print(f"Infrastructure assets seeded: {total}")


if __name__ == "__main__":
    init_postgis()
    Base.metadata.create_all(bind=engine)

    db = SessionLocal()
    try:
        seed_departments(db)
        seed_infrastructure(db)
    finally:
        db.close()
