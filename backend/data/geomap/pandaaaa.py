import json
import pandas as pd
from shapely.geometry import LineString, mapping

xl = pd.ExcelFile("BRT and NON BRT route details.xls")
stops = xl.parse("376  Rout name, Stage & LL")

# Coerce LAT/LONG to numeric — turns bad/header rows into NaN instead of crashing
stops["LAT"] = pd.to_numeric(stops["LAT"], errors="coerce")
stops["LONG"] = pd.to_numeric(stops["LONG"], errors="coerce")
stops["Stop Seq"] = pd.to_numeric(stops["Stop Seq"], errors="coerce")

stops = stops.dropna(subset=["LAT", "LONG", "Route", "Stop Seq"])

road_features = []
for route_id, group in stops.groupby("Route"):
    group = group.sort_values("Stop Seq")
    coords = list(zip(group["LONG"], group["LAT"]))
    if len(coords) < 2:
        continue
    road_features.append({
        "type": "Feature",
        "properties": {
            "name": f"Route {route_id}",
            "owner_dept_slug": "road",
        },
        "geometry": mapping(LineString(coords)),
    })

with open("roads.geojson", "w", encoding="utf-8") as f:
    json.dump({"type": "FeatureCollection", "features": road_features}, f)

print(f"Roads: {len(road_features)} route lines written")

with open("drainage_system_combined.geojson", encoding="utf-8") as f:
    drainage_data = json.load(f)

for feat in drainage_data["features"]:
    feat["properties"]["owner_dept_slug"] = "drainage"
    feat["properties"].setdefault("name", feat["properties"].get("route", "Drain"))

with open("drainage.geojson", "w", encoding="utf-8") as f:
    json.dump(drainage_data, f)

print(f"Drainage: {len(drainage_data['features'])} features written")

with open("synthetic_telecom_fiber.geojson", encoding="utf-8") as f:
    telecom_data = json.load(f)

for feat in telecom_data["features"]:
    feat["properties"]["owner_dept_slug"] = "telecom"
    feat["properties"].setdefault("name", feat["properties"].get("route", "Fiber Line"))

with open("telecom.geojson", "w", encoding="utf-8") as f:
    json.dump(telecom_data, f)

print(f"Telecom: {len(telecom_data['features'])} features written")