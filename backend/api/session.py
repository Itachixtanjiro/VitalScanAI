from fastapi import APIRouter
from pydantic import BaseModel

router = APIRouter()

class SessionStartRequest(BaseModel):
    user_id: str

class SessionResponse(BaseModel):
    session_id: str
    status: str

@router.post("/start", response_model=SessionResponse)
async def start_session(request: SessionStartRequest):
    return {"session_id": "sess_123", "status": "active"}
