import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel
import hashlib
import logging
from config import settings
from llm.unified_client import unified_client
from cache.redis import redis_client
from utils.limiter import limiter

logger = logging.getLogger(__name__)
router = APIRouter()

class SummarizeRequest(BaseModel):
    text: str

class SummarizeResponse(BaseModel):
    summary: str
    cached: bool = False

@router.post("/summarize", response_model=SummarizeResponse)
async def summarize_text(request: SummarizeRequest, req_context: Request):
    """
    Guarded endpoint for text summarization.
    OPTIMIZATIONS:
    - Feature Flag check
    - Rate Limiting (IP-based)
    - Response Caching (Redis)
    - Unified LLM Client (Mistral)
    """
    # 1. Feature Flag Check
    if not settings.LLM_ENABLED:
        raise HTTPException(status_code=503, detail="LLM services are currently disabled by configuration.")

    # 2. Rate Limiting
    client_ip = req_context.client.host if req_context.client else "unknown"
    if not limiter.is_allowed(client_ip, limit=settings.LLM_RATE_LIMIT_PER_MIN):
        logger.warning(f"Rate limit exceeded for IP: {client_ip}")
        raise HTTPException(status_code=429, detail="Too many requests. Please slow down.")

    # 3. Caching (Dedup)
    text_hash = hashlib.md5(request.text.encode()).hexdigest()
    cache_key = f"llm:summary:{text_hash}"
    
    cached_result = await redis_client.get(cache_key)
    if cached_result:
        logger.info("Serving LLM summary from cache.")
        return {"summary": cached_result, "cached": True}

    try:
        # 4. Execution
        summary = await unified_client.execute_task('summary', request.text)
        if not summary:
             raise HTTPException(status_code=503, detail="Service unavailable or token limit exceeded.")
        
        # 5. Cache Write
        await redis_client.set(cache_key, summary, ttl=3600)
        
        return {"summary": summary, "cached": False}

    except Exception as e:
        logger.error(f"LLM endpoint error: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal processing error.")

@router.get("/health")
async def llm_health_check():
    """
    Check LLM client health status.
    """
    try:
        # Perform a quick test call
        test_result = await unified_client.execute_task('summary', 'Health check test.')
        
        return {
            "status": "healthy" if test_result else "degraded",
            "provider": "Unified (Mistral)",
            "test_response": test_result[:50] + "..." if test_result and len(test_result) > 50 else test_result
        }
    except Exception as e:
        return {
            "status": "error",
            "error": str(e)
        }

