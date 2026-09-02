from fastapi import APIRouter, HTTPException
from app.services.log_analyzer import get_session

router = APIRouter()

@router.get("/{session_id}")
async def get_analysis(session_id: str):
    session = get_session(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
        
    return {
        "session_id": session_id,
        "status": session["status"],
        "total_logs": session["total_logs"],
        "detected_errors": session["detected_errors_count"],
        "errors": session["errors"],
        "analysis": session["analysis"]
    }
