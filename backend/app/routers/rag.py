from fastapi import APIRouter

from app.schemas.conflict import RAGQueryRequest, RAGQueryResponse
from app.services.rag_engine import answer_question, ingest_documents

router = APIRouter(prefix="/rag", tags=["rag"])


@router.post("/query", response_model=RAGQueryResponse)
def query(payload: RAGQueryRequest):
    result = answer_question(payload.question)
    return RAGQueryResponse(**result)


@router.post("/ingest")
def ingest():
    """Call once after dropping new PDFs into data/documents/."""
    count = ingest_documents()
    return {"chunks_ingested": count}
