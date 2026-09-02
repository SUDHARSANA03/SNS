import uuid
import asyncio
from typing import Dict, Any
from app.services.log_parser import parse_log_content
from app.services.error_detector import detect_errors
from app.services.llm_service import analyze_logs_with_llm

# In-memory session store for MVP
sessions: Dict[str, Any] = {}


async def run_analysis(content: str) -> Dict[str, Any]:
    """Run the full analysis pipeline and return the complete result.
    
    This awaits the LLM call so the caller gets everything in one shot
    without needing to poll a session ID.
    """
    session_id = str(uuid.uuid4())
    
    # Parse logs
    events = parse_log_content(content)
    errors = detect_errors(events)
    
    result = {
        "session_id": session_id,
        "status": "completed",
        "total_logs": len(events),
        "detected_errors_count": len(errors),
        "errors": [e.model_dump() for e in errors],
        "analysis": {}
    }
    
    if not events:
        result["analysis"] = {
            "summary": "No logs found in file.",
            "root_cause_analysis": [],
            "timeline": [],
            "recommendations": []
        }
        return result
    
    try:
        max_events_to_send = 200
        events_to_send = events[-max_events_to_send:] if len(events) > max_events_to_send else events
        
        analysis = await analyze_logs_with_llm(events_to_send, errors)
        result["analysis"] = analysis.model_dump()
    except Exception as e:
        result["status"] = "failed"
        result["analysis"] = {
            "summary": f"Analysis failed: {str(e)}",
            "root_cause_analysis": [],
            "timeline": [],
            "recommendations": []
        }
    
    # Also store in sessions so it can be retrieved later via GET
    sessions[session_id] = result
    return result


async def process_log_file(session_id: str, content: str):
    try:
        # Parse logs
        events = parse_log_content(content)
        
        # Detect errors
        errors = detect_errors(events)
        
        sessions[session_id].update({
            "total_logs": len(events),
            "detected_errors_count": len(errors),
            "errors": [e.model_dump() for e in errors],
        })
        
        if not events:
            sessions[session_id]["status"] = "completed"
            sessions[session_id]["analysis"] = {
                "summary": "No logs found in file.",
                "root_cause_analysis": [],
                "timeline": [],
                "recommendations": []
            }
            return
            
        # Send to LLM
        # NOTE: For very large files, we'd need to chunk `events` around errors. 
        # For MVP, we send them, but we should enforce a limit if needed.
        max_events_to_send = 200 # rudimentary chunking limit
        events_to_send = events[-max_events_to_send:] if len(events) > max_events_to_send else events
        
        analysis = await analyze_logs_with_llm(events_to_send, errors)
        
        sessions[session_id]["status"] = "completed"
        sessions[session_id]["analysis"] = analysis.model_dump()
        
    except Exception as e:
        sessions[session_id]["status"] = "failed"
        sessions[session_id]["analysis"] = {
            "summary": f"Analysis failed: {str(e)}",
            "root_cause_analysis": [],
            "timeline": [],
            "recommendations": []
        }


def start_analysis_session(content: str) -> str:
    session_id = str(uuid.uuid4())
    sessions[session_id] = {
        "session_id": session_id,
        "status": "analysis_started",
        "total_logs": 0,
        "detected_errors_count": 0,
        "errors": [],
        "analysis": {}
    }
    
    # Start background task
    asyncio.create_task(process_log_file(session_id, content))
    
    return session_id


def get_session(session_id: str) -> Dict[str, Any]:
    return sessions.get(session_id)
