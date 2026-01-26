import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import logging
from fastapi import APIRouter, UploadFile, File, HTTPException, Query
from typing import List, Optional
from pydantic import BaseModel

from rag.ingester import DocumentIngester
from rag.chunker import TextChunker
from rag.vectorstore import VectorStore

logger = logging.getLogger(__name__)
router = APIRouter()

# Global vector store instance
vector_store = None

def get_vector_store() -> VectorStore:
    """Get or create vector store singleton."""
    global vector_store
    if vector_store is None:
        vector_store = VectorStore(
            model_name="sentence-transformers/all-mpnet-base-v2",
            index_type="flat"
        )
        logger.info("Initialized global vector store")
    return vector_store

class IngestResponse(BaseModel):
    message: str
    chunks_added: int
    total_chunks: int

class SearchRequest(BaseModel):
    query: str
    k: int = 5

class SearchResult(BaseModel):
    text: str
    distance: float
    chunk_id: int
    metadata: dict

@router.post("/ingest", response_model=IngestResponse)
async def ingest_document(
    file: UploadFile = File(...),
    chunk_size: int = Query(500, description="Size of text chunks"),
    chunk_overlap: int = Query(50, description="Overlap between chunks")
):
    """
    Ingest a document into the RAG vector store.
    Supports PDF, DOCX, and TXT files.
    """
    try:
        # Read file content
        content = await file.read()
        
        # Extract text
        logger.info(f"Ingesting document: {file.filename}")
        text = DocumentIngester.ingest_from_bytes(
            content=content,
            file_type=file.content_type or "",
            filename=file.filename or "document"
        )
        
        # Chunk text
        chunker = TextChunker(chunk_size=chunk_size, chunk_overlap=chunk_overlap)
        chunks = chunker.chunk_with_sentences(text)
        
        # Add to vector store
        vs = get_vector_store()
        vs.add_chunks(chunks)
        
        return IngestResponse(
            message=f"Successfully ingested {file.filename}",
            chunks_added=len(chunks),
            total_chunks=len(vs.chunks)
        )
        
    except Exception as e:
        logger.error(f"Document ingestion failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/search", response_model=List[SearchResult])
async def search_documents(request: SearchRequest):
    """
    Search the RAG vector store for relevant chunks.
    """
    try:
        vs = get_vector_store()
        
        if len(vs.chunks) == 0:
            return []
        
        results = vs.search(query=request.query, k=request.k)
        
        return [
            SearchResult(
                text=chunk['text'],
                distance=distance,
                chunk_id=chunk['chunk_id'],
                metadata=chunk.get('metadata', {})
            )
            for chunk, distance in results
        ]
        
    except Exception as e:
        logger.error(f"Search failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/stats")
async def get_rag_stats():
    """Get RAG vector store statistics."""
    vs = get_vector_store()
    return {
        "total_chunks": len(vs.chunks),
        "model_name": vs.model_name,
        "index_type": vs.index_type,
        "dimension": vs.dimension
    }

@router.delete("/clear")
async def clear_vector_store():
    """Clear all documents from the vector store."""
    vs = get_vector_store()
    vs.clear()
    return {"message": "Vector store cleared"}
