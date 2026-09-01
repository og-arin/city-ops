"""
Run with: python -m app.seed.seed_data
"""
import os
import requests
import json
import time
from shapely.geometry import shape, LineString
from geoalchemy2.shape import from_shape

from app.core.db import SessionLocal, engine, Base, init_postgis
from app.models.infrastructure import InfrastructureAsset
from app.models.department import Department

GEOMAP_DIR = os.path.join(os.path.dirname(__file__), "../../data/geomap")
WARDS_FILE = os.path.join(GEOMAP_DIR, "pune-admin-wards.geojson")

DEPARTMENTS = [
    ("Road Department", "road"),
    ("Drainage Department", "drainage"),
    ("Municipal Corporation", "municipal"),
]

def seed_departments(db):
    for name, slug in DEPARTMENTS:
        if not db.query(Department).filter(Department.slug == slug).first():
            db.add(Department(name=name, slug=slug, contact_email=f"{slug}@cityops.demo"))
    db.commit()
    print(f"✅ Departments ready.")

def build_osm_features():
    print("🌍 Downloading FULL Pune street grid using endpoint roulette...")
    
    # 4 distinct Overpass mirrors to bypass 429 Rate Limits
    endpoints = [
        "https://lz4.overpass-api.de/api/interpreter",
        "https://overpass-api.de/api/interpreter",
        "https://overpass.kumi.systems/api/interpreter",
        "https://overpass.openstreetmap.fr/api/interpreter"
    ]
    
    bboxes = [
        (18.5000, 73.7500, 18.6000, 73.8500), # NW
        (18.5000, 73.8500, 18.6000, 73.9500), # NE
        (18.4000, 73.7500, 18.5000, 73.8500), # SW
        (18.4000, 73.8500, 18.5000, 73.9500)  # SE
    ]
    
    headers = {"User-Agent": "CityOpsAI-Project/2.0"}
    features = []
    
    for i, bbox in enumerate(bboxes):
        print(f"  -> Fetching chunk {i+1} of 4...")
        # Dropped 'service' to prevent downloading private driveways
        overpass_query = f"""
        [out:json][timeout:90];
        (
          way["highway"~"motorway|trunk|primary|secondary|tertiary|residential"]({bbox[0]},{bbox[1]},{bbox[2]},{bbox[3]});
        );
        out geom;
        """
        
        chunk_success = False
        for url in endpoints:
            try:
                response = requests.post(url, data=overpass_query, headers=headers, timeout=90)
                if response.status_code == 200:
                    data = response.json()
                    for element in data.get("elements", []):
                        if element["type"] == "way" and "geometry" in element:
                            coords = [(node["lon"], node["lat"]) for node in element["geometry"]]
                            if len(coords) > 1:
                                name = element.get("tags", {}).get("name", "Unnamed Street")
                                features.append({
                                    "geom": LineString(coords),
                                    "name": name
                                })
                    print(f"  ✅ Chunk {i+1} success!")
                    chunk_success = True
                    time.sleep(3) # Gentle pause before next chunk
                    break # Break out of the mirror loop, move to next chunk
            except Exception:
                continue # Try the next mirror
                
        if not chunk_success:
            print(f"  ❌ Chunk {i+1} failed on all mirrors.")

    return features

def load_ward_features(path):
    if not os.path.exists(path):
        return []
    with open(path, encoding="utf-8") as f:
        data = json.load(f)

    features = []
    for feat in data.get("features", []):
        try:
            geom = shape(feat["geometry"])
            name = feat.get("properties", {}).get("ward_name", "Ward")
            features.append({
                "geom": geom, "name": name, "layer": "ward", "owner_dept_slug": "municipal",
            })
        except Exception:
            continue
    return features

def seed_infrastructure(db):
    print("🗑️ Purging database...")
    db.query(InfrastructureAsset).delete()
    db.commit()

    all_features = []
    real_osm_data = build_osm_features()
    
    print("🛣️ Building Road layer...")
    all_features += [{"geom": f["geom"], "name": f["name"], "layer": "road", "owner_dept_slug": "road"} for f in real_osm_data]
    
    print("💧 Building cloned Drainage layer for visibility...")
    all_features += [{"geom": f["geom"], "name": f["name"] + " (Storm Drain)", "layer": "drainage", "owner_dept_slug": "drainage"} for f in real_osm_data]

    print("🏢 Loading Pune Admin Wards...")
    all_features += load_ward_features(WARDS_FILE)

    print("🚀 Uploading geometries via GeoAlchemy2...")
    for f in all_features:
        db.add(InfrastructureAsset(
            layer=f["layer"], name=f["name"], owner_dept_slug=f["owner_dept_slug"], depth_meters=None, geom=from_shape(f["geom"], srid=4326)
        ))

    db.commit()
    print(f"🎉 Fully loaded {len(all_features)} assets into CityOps AI!")

if __name__ == "__main__":
    init_postgis()
    Base.metadata.create_all(bind=engine)

    db = SessionLocal()
    try:
        seed_departments(db)
        seed_infrastructure(db)
    finally:
        db.close()