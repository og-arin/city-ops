from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.routers import work_orders, infrastructure, conflicts, rag

app = FastAPI(title="CityOps AI", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
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
