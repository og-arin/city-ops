"""
Central settings. Everything env-driven so local/dev/prod never touch code.
Fill in backend/.env (copy from .env.example) before running.
"""
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    # --- Database (Supabase Postgres + PostGIS) ---
    DATABASE_URL: str = "postgresql://postgres:postgres@localhost:5432/cityops"

    # --- AI / RAG ---
    GOOGLE_API_KEY: str = ""
    CHROMA_PERSIST_DIR: str = "./chroma_store"

    # --- Notifications ---
    RESEND_API_KEY: str = ""
    ALERT_FROM_EMAIL: str = "alerts@cityops.local"

    # --- App ---
    ENV: str = "development"
    CORS_ORIGINS: list[str] = ["http://localhost:3000"]

    # Conflict detection tuning
    CONFLICT_BUFFER_METERS: float = 5.0  # how close counts as "conflict"

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


settings = Settings()
