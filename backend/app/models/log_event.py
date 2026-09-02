from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime

class LogEvent(BaseModel):
    log_id: str
    timestamp: Optional[datetime] = None
    level: str = "UNKNOWN"
    component: Optional[str] = None
    message: str
    raw_log: str

class DetectedError(BaseModel):
    log_id: str
    level: str
    message: str
    timestamp: Optional[datetime] = None
