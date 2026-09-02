from fastapi import APIRouter, UploadFile, File, HTTPException
from app.services.log_analyzer import run_analysis

router = APIRouter()

@router.post("/upload")
async def upload_logs(file: UploadFile = File(...)):
    if not (file.filename.endswith(".log") or file.filename.endswith(".txt")):
        raise HTTPException(status_code=400, detail="Only .log or .txt files are supported")
        
    try:
        content = await file.read()
        content_str = content.decode("utf-8")
    except UnicodeDecodeError:
        raise HTTPException(status_code=400, detail="File encoding must be UTF-8")
    
    # Run the full pipeline (parse → detect errors → LLM analysis) and return everything
    result = await run_analysis(content_str)
    
    return {
        "session_id": result["session_id"],
        "status": result["status"],
        "total_logs": result["total_logs"],
        "detected_errors": result["detected_errors_count"],
        "errors": result["errors"],
        "analysis": result["analysis"]
    }

