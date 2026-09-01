import asyncio
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from app.core.config import settings
from app.routers import work_orders, infrastructure, conflicts, rag
from app.services.rag_engine import ingest_documents

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Run ingest on startup
    # We do it asynchronously or in a thread to not block if needed, but for simplicity here we just call it
    try:
        ingest_documents()
    except Exception as e:
        print(f"Failed to ingest documents on startup: {e}")
    yield
    # Shutdown

app = FastAPI(title="CityOps AI", version="0.1.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:3001",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:3001"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(work_orders.router)
app.include_router(infrastructure.router)
app.include_router(conflicts.router)
app.include_router(rag.router)


@app.get("/health")
def health():
    return {"status": "ok", "env": settings.ENV}
