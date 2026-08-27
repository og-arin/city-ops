# API Contract — CityOps AI

Backend base URL (local): `http://localhost:8000`

Both devs: if you change a request/response shape, update this file +
`backend/app/schemas/` + `frontend/lib/types.ts` in the same commit.

---

## GET /infrastructure?layer={road|water|electric|telecom}

Returns a GeoJSON FeatureCollection. `layer` query param optional (omit = all layers).

```json
{
  "type": "FeatureCollection",
  "features": [
    {
      "type": "Feature",
      "geometry": { "type": "LineString", "coordinates": [[73.85, 18.52], ...] },
      "properties": {
        "id": 1,
        "layer": "water",
        "name": "Water Main A",
        "owner_dept_slug": "water",
        "depth_meters": 2
      }
    }
  ]
}
```

---

## POST /conflicts/check

Pre-submit live preview — call this as the user draws a polygon.

Request:
```json
{ "polygon_geojson": { "type": "Polygon", "coordinates": [[[lng,lat], ...]] } }
```

Response:
```json
{
  "has_conflict": true,
  "conflicts": [
    { "asset_id": 3, "layer": "water", "name": "Water Main A", "severity": "red", "distance_meters": 0.0, "owner_dept_slug": "water" }
  ]
}
```

---

## POST /work-orders

Submits a work order — runs the same conflict check server-side, persists it,
fires email alerts if conflicts found.

Request:
```json
{
  "title": "Repair Road X",
  "requesting_dept_slug": "road",
  "polygon_geojson": { "type": "Polygon", "coordinates": [[[lng,lat], ...]] },
  "start_date": "2026-09-01T00:00:00Z",
  "end_date": "2026-09-03T00:00:00Z"
}
```

Response: `WorkOrderResponse` (see below)

---

## GET /work-orders

Returns `WorkOrderResponse[]`, newest first.

## GET /work-orders/{id}

Returns one `WorkOrderResponse`:
```json
{
  "id": 1,
  "title": "Repair Road X",
  "requesting_dept_slug": "road",
  "status": "conflict",
  "start_date": "2026-09-01T00:00:00Z",
  "end_date": "2026-09-03T00:00:00Z",
  "created_at": "2026-08-26T10:00:00Z",
  "conflicts": [ /* same shape as ConflictCheckResponse.conflicts */ ]
}
```

`status` is one of: `pending | conflict | coordinating | approved | completed | rejected`

---

## POST /work-orders/acknowledge-conflict

Request:
```json
{ "conflict_log_id": 5, "dept_slug": "water" }
```

Response:
```json
{ "ok": true, "remaining_unacknowledged": 1 }
```

---

## POST /rag/query

Request:
```json
{ "question": "Can we start construction on Road X tomorrow?" }
```

Response:
```json
{
  "answer": "No. Water Main A has scheduled maintenance on this segment tomorrow, 08:00-17:00.",
  "sources": ["water_dept_schedule.pdf"]
}
```

## POST /rag/ingest

No body. Re-embeds everything in `data/documents/`. Call once after adding new PDFs.

---

## GET /health

Returns `{ "status": "ok", "env": "development" }` — use to sanity-check the deploy.
