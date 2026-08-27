# Setup — Local Dev

## 1. Database (Postgres + PostGIS)

```bash
docker-compose up -d
```

This starts Postgres with PostGIS already baked in, on `localhost:5432`.

## 2. Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt

cp .env.example .env
# edit .env: add GOOGLE_API_KEY (for RAG) and RESEND_API_KEY (for alerts)
# DATABASE_URL default already matches docker-compose

python -m app.seed.seed_data     # creates tables, enables PostGIS, loads demo data
uvicorn app.main:app --reload --port 8000
```

Check it's alive: `curl http://localhost:8000/health`

To enable the RAG demo:
```bash
curl -X POST http://localhost:8000/rag/ingest
```

## 3. Frontend

```bash
cd frontend
npm install

cp .env.local.example .env.local
# edit .env.local: add NEXT_PUBLIC_MAPBOX_TOKEN (free at mapbox.com)
# NEXT_PUBLIC_API_URL defaults to http://localhost:8000

npm run dev
```

Open `http://localhost:3000`.

## 4. Try the demo flow

1. Go to `/work-orders/new`
2. Draw a polygon over "Road X - Sector 12" (roughly `73.856, 18.520` to
   `73.863, 18.525` on the map) — this is deliberately laid out to cross
   Water Main A and pass close to Power Feeder Line 3
3. Watch the live conflict preview populate as you draw
4. Fill in title/dept/dates, submit
5. Check the work order detail page — conflicts + status should show

## Production deploy (when ready)

- Swap `DATABASE_URL` in backend `.env` to your Supabase connection string
  (Supabase already has PostGIS enabled — no need to run `init_postgis()`
  again, just re-run `seed_data.py` once pointed at it)
- Deploy backend to Railway/Render, frontend to Vercel
- Set `NEXT_PUBLIC_API_URL` on Vercel to your deployed backend URL
- Set `CORS_ORIGINS` in backend `.env` to your Vercel frontend URL
