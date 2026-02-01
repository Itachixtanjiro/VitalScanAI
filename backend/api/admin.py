from fastapi import APIRouter, HTTPException, Header
from typing import Optional
from llm.mistral_client import get_llm_call_log, mistral_client
from config import settings

router = APIRouter()

ADMIN_EMAIL = "med@med.com"


@router.get("/llm-analytics")
async def llm_analytics(x_admin_email: Optional[str] = Header(None)):
    """
    Returns LLM call log and aggregate statistics.
    Requires admin email header for access control.
    """
    if x_admin_email != ADMIN_EMAIL:
        raise HTTPException(status_code=403, detail="Admin access required")

    log = get_llm_call_log()

    # Aggregate stats
    total_calls = len(log)
    success_count = sum(1 for e in log if e["status"] == "success")
    error_count = sum(1 for e in log if e["status"] == "error")
    avg_latency = (
        round(sum(e["latency_ms"] for e in log) / total_calls)
        if total_calls > 0
        else 0
    )
    total_tokens = sum(e.get("total_tokens", 0) for e in log)

    # Per-task breakdown
    task_breakdown = {}
    for entry in log:
        t = entry["task_type"]
        if t not in task_breakdown:
            task_breakdown[t] = {"count": 0, "success": 0, "error": 0, "total_tokens": 0, "avg_latency_ms": 0}
        task_breakdown[t]["count"] += 1
        if entry["status"] == "success":
            task_breakdown[t]["success"] += 1
        elif entry["status"] == "error":
            task_breakdown[t]["error"] += 1
        task_breakdown[t]["total_tokens"] += entry.get("total_tokens", 0)
        task_breakdown[t]["avg_latency_ms"] += entry["latency_ms"]

    for t in task_breakdown:
        count = task_breakdown[t]["count"]
        if count > 0:
            task_breakdown[t]["avg_latency_ms"] = round(task_breakdown[t]["avg_latency_ms"] / count)

    return {
        "model": mistral_client.model,
        "api_key_configured": bool(mistral_client.api_key),
        "stats": {
            "total_calls": total_calls,
            "success": success_count,
            "errors": error_count,
            "avg_latency_ms": avg_latency,
            "total_tokens": total_tokens,
        },
        "task_breakdown": task_breakdown,
        "recent_calls": log[-50:],  # last 50 entries
    }
