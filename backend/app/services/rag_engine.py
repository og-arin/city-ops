"""
RAG over department PDFs (permits, schedules, work-order history).
"""
import os
import glob
import shutil

from langchain_community.document_loaders import PyPDFLoader
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain_groq import ChatGroq
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_community.vectorstores import Chroma

from app.core.config import settings

_embeddings = HuggingFaceEmbeddings(model_name="sentence-transformers/all-MiniLM-L6-v2")
_llm = ChatGroq(model=settings.GROQ_MODEL, groq_api_key=settings.GROQ_API_KEY, temperature=0)


def _get_vectorstore() -> Chroma:
    return Chroma(persist_directory=settings.CHROMA_PERSIST_DIR, embedding_function=_embeddings)


def ingest_documents(docs_dir: str = "data/documents") -> int:
    """Chunks and embeds all PDFs in data/documents. Clears old store first."""
    splitter = RecursiveCharacterTextSplitter(chunk_size=700, chunk_overlap=120)
    all_chunks = []

    for pdf_path in glob.glob(os.path.join(docs_dir, "*.pdf")):
        try:
            pages = PyPDFLoader(pdf_path).load()
            chunks = splitter.split_documents(pages)
            for c in chunks:
                c.metadata["source"] = os.path.basename(pdf_path)
            all_chunks.extend(chunks)
        except Exception as e:
            print(f"Error loading {pdf_path}: {e}")

    if not all_chunks:
        return 0

    # Re-initialize the collection cleanly
    store = Chroma.from_documents(
        documents=all_chunks,
        embedding=_embeddings,
        persist_directory=settings.CHROMA_PERSIST_DIR
    )
    return len(all_chunks)


def ask_regulation(query: str) -> dict:
    """Retrieves top relevant chunks and generates a grounded response."""
    store = _get_vectorstore()
    # Increased k to 6 for broader coverage across dense guideline tables
    results = store.similarity_search(query, k=6)

    if not results:
        return {"answer": "No relevant permits or schedules found for this.", "sources": []}

    context = "\n\n".join(f"[{r.metadata.get('source', 'unknown')}] {r.page_content}" for r in results)
    sources = sorted(set(r.metadata.get("source", "unknown") for r in results))

    prompt = f"""You are CityOps AI, a regulatory assistant for municipal officers. Answer the officer's question using ONLY the excerpts below.
You MUST cite specific rule numbers, annexures, or rule tags (e.g., [PMC-18], [TEL-05], or Annexure-12) in your response.
If the excerpts do not contain the answer, say so plainly.

Excerpts:
{context}

Question: {query}
"""
    response = _llm.invoke(prompt)
    return {"answer": response.content, "sources": sources}