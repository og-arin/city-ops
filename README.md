# CityOps AI

Inter-department city coordination platform — SIH problem statement.

Catches infrastructure conflicts (water pipes, electric cables, telecom)
before a road gets dug and re-dug by different departments.

## Quick links

- [`docs/architecture.md`](docs/architecture.md) — how the pieces connect
- [`docs/api-contract.md`](docs/api-contract.md) — every endpoint, request/response shapes
- [`docs/setup.md`](docs/setup.md) — get it running locally

## Stack

- Frontend: Next.js + Tailwind + Mapbox GL JS
- Backend: FastAPI
- DB: PostgreSQL + PostGIS (Supabase in prod)
- RAG: LangChain + Gemini + Chroma
- Alerts: Resend

## Team split

- Dev 1: `backend/` — API, spatial conflict engine, RAG, DB
- Dev 2: `frontend/` — map UI, work-order forms, conflict display
- Shared contract: `frontend/lib/types.ts` mirrors `backend/app/schemas/`
  — update both together when a field changes.
