from pydantic import BaseModel


class ConflictCheckRequest(BaseModel):
    """Standalone check — draw a shape, get conflicts, before even submitting a work order."""
    polygon_geojson: dict


class ConflictCheckResponse(BaseModel):
    has_conflict: bool
    conflicts: list[dict]   # same shape as ConflictItem in work_order.py


class RAGQueryRequest(BaseModel):
    question: str


class RAGQueryResponse(BaseModel):
    answer: str
    sources: list[str]   # document filenames cited
