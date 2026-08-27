"""
RAG over department PDFs (permits, schedules, work-order history).

Flow:
  1. ingest_documents() — run once (or whenever data/documents/ changes) to
     chunk + embed every PDF into the Chroma vector store.
  2. answer_question() — takes an officer's question, retrieves relevant
     chunks, asks Gemini to answer grounded in them, returns answer + sources.

Kept deliberately separate from spatial.py — this is the "sprinkle on top"
AI layer, not the core mechanism. If this breaks under demo pressure, the
conflict-detection engine still stands on its own.
"""
import os
import glob

from langchain_community.document_loaders import PyPDFLoader
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain_groq import ChatGroq
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_community.vectorstores import Chroma

from app.core.config import settings

# Embeddings run locally (no API, no rate limit) — only the answer-generation
# step hits an external API. First call downloads the model (~80MB), then
# it's cached — expect a one-time delay on first ingest.
_embeddings = HuggingFaceEmbeddings(model_name="sentence-transformers/all-MiniLM-L6-v2")
_llm = ChatGroq(model=settings.GROQ_MODEL, groq_api_key=settings.GROQ_API_KEY, temperature=0)


def _get_vectorstore() -> Chroma:
    return Chroma(persist_directory=settings.CHROMA_PERSIST_DIR, embedding_function=_embeddings)


def ingest_documents(docs_dir: str = "../data/documents") -> int:
    """Run this after dropping new PDFs in data/documents/. Returns chunk count."""
    splitter = RecursiveCharacterTextSplitter(chunk_size=800, chunk_overlap=100)
    all_chunks = []

    for pdf_path in glob.glob(os.path.join(docs_dir, "*.pdf")):
        pages = PyPDFLoader(pdf_path).load()
        chunks = splitter.split_documents(pages)
        for c in chunks:
            c.metadata["source"] = os.path.basename(pdf_path)
        all_chunks.extend(chunks)

    if not all_chunks:
        return 0

    store = _get_vectorstore()
    store.add_documents(all_chunks)
    return len(all_chunks)


def answer_question(question: str) -> dict:
    """Returns {"answer": str, "sources": [filename, ...]}."""
    store = _get_vectorstore()
    results = store.similarity_search(question, k=4)

    if not results:
        return {"answer": "No relevant permits or schedules found for this.", "sources": []}

    context = "\n\n".join(f"[{r.metadata.get('source', 'unknown')}] {r.page_content}" for r in results)
    sources = sorted(set(r.metadata.get("source", "unknown") for r in results))

    prompt = f"""You are CityOps AI, answering a municipal officer's question using
only the permit/schedule excerpts below. Be direct — "Yes", "No", or the
specific conflicting date/dept — then a one-line reason. If the excerpts
don't answer it, say so plainly.

Excerpts:
{context}

Question: {question}
"""
    response = _llm.invoke(prompt)
    return {"answer": response.content, "sources": sources}