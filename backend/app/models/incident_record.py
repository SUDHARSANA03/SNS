from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any

class ActionItem(BaseModel):
    title: str
    description: str
    owner: Optional[str] = "SRE Team"
    status: str = "OPEN" # OPEN, IN_PROGRESS, COMPLETED
    type: str = "PREVENTATIVE" # IMMEDIATE, PREVENTATIVE, ARCHITECTURAL
    command_patch: Optional[str] = None

class IncidentRecordCreate(BaseModel):
    user_id: Optional[str] = None
    session_id: Optional[str] = None
    incident_title: str
    severity: str = "MAJOR" # CRITICAL, MAJOR, MINOR, LOW
    status: str = "IDENTIFIED" # INVESTIGATING, IDENTIFIED, MITIGATED, RESOLVED, CLOSED
    executive_summary: str
    root_cause: Optional[str] = None
    trigger_event: Optional[str] = None
    impact_assessment: Optional[str] = None
    affected_components: List[str] = []
    causal_timeline: List[Dict[str, Any]] = []
    action_items: List[Dict[str, Any]] = []
    rca_draft_markdown: Optional[str] = None

class IncidentRecordUpdate(BaseModel):
    incident_title: Optional[str] = None
    severity: Optional[str] = None
    status: Optional[str] = None
    executive_summary: Optional[str] = None
    root_cause: Optional[str] = None
    action_items: Optional[List[Dict[str, Any]]] = None
    rca_draft_markdown: Optional[str] = None

class RCADraftGenerateRequest(BaseModel):
    session_id: Optional[str] = None
    incident_title: Optional[str] = None
    severity: Optional[str] = "MAJOR"
    custom_notes: Optional[str] = None
    nvidia_api_key: Optional[str] = None
