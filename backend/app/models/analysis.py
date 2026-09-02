from pydantic import BaseModel
from typing import List, Optional

class TimelineEvent(BaseModel):
    log_id: str
    event: str

class RootCause(BaseModel):
    cause: str
    type: str  # e.g., 'hypothesis', 'fact'
    confidence: float
    evidence_log_ids: List[str]
    reasoning: str

class AnalysisResponse(BaseModel):
    summary: str
    root_cause_analysis: List[RootCause]
    timeline: List[TimelineEvent]
    recommendations: List[str]
