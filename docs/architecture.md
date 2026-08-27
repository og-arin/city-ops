# Architecture — CityOps AI

## Flow

```
User draws polygon on Mapbox (frontend)
        ↓
POST /conflicts/check  (live preview, no persistence)
        ↓
FastAPI -> PostGIS ST_DWithin/ST_Intersects against infrastructure_assets
        ↓
Returns 🔴/🟡 conflicts + owning departments
        ↓
User fills form, submits -> POST /work-orders
        ↓
Same conflict check runs again server-side, gets persisted
        ↓
If conflicts found: ConflictLog rows created + Resend email to affected depts
        ↓
Officer can later query RAG: "Can we dig Road X tomorrow?"
        ↓
LangChain retrieves relevant permit/schedule PDF chunks -> Gemini answers grounded in them
```

## Why these pieces

- **PostGIS over app-level distance math** — spatial indexing means `ST_DWithin`
  is fast even with thousands of assets. Doing this in Python would mean
  loading every asset into memory and looping — fine for a demo, terrible
  past a few hundred rows.
- **`infrastructure_assets` as one table, not four** — conflict detection is
  one query against one table instead of a UNION across four. Add a `layer`
  column, filter/group by it.
- **RAG kept separate from conflict detection** — the spatial engine is
  deterministic and demo-safe. RAG depends on an external API (Gemini) and
  can flake under demo pressure — it's additive, not load-bearing.
- **`last_conflict_result` cached as JSON on WorkOrder** — avoids re-running
  PostGIS every time the UI just wants to render a status badge.

## Deployment

- Backend: FastAPI on Railway/Render
- DB: Supabase (Postgres + PostGIS already enabled)
- Frontend: Vercel
- Vector store: local Chroma dir (fine for hackathon scale; swap for a
  hosted vector DB only if you actually need to scale past the demo)

## Known gaps / next steps

- Auth is not implemented — work orders don't check who's submitting.
  Fine for a demo, not for production.
- `acknowledge-conflict` expects `conflict_log_id`, but the work-order
  detail page currently only has `asset_id` — the list endpoint needs to
  return conflict_log_id per conflict for the acknowledge button to work.
- RAG ingestion (`POST /rag/ingest`) needs to be called manually after
  dropping new PDFs — no file-watcher automation yet.
