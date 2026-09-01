from fastapi import APIRouter
from pydantic import BaseModel

from app.services.rag_engine import ask_regulation, ingest_documents

router = APIRouter(prefix="/rag", tags=["rag"])

class AskRequest(BaseModel):
    query: str

class AskResponse(BaseModel):
    answer: str

@router.post("/ask", response_model=AskResponse)
def ask(payload: AskRequest):
    result = ask_regulation(payload.query)
    return AskResponse(answer=result["answer"])

@router.post("/ingest")
def ingest():
    """Call once after dropping new PDFs into data/documents/."""
    count = ingest_documents()
    return {"chunks_ingested": count}

