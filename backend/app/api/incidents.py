"""
Incident Records & Final RCA Draft API Router.
Handles persistent incident records creation, listing, updating,
and publication-ready SRE RCA Post-Mortem markdown generation.
"""
import uuid
from typing import List, Optional, Dict, Any
from datetime import datetime, timezone
from fastapi import APIRouter, HTTPException, status
from app.models.incident_record import (
    IncidentRecordCreate,
    IncidentRecordUpdate,
    RCADraftGenerateRequest,
)
from app.services.log_analyzer import get_session
from app.services.rca_generator import generate_rca_markdown

router = APIRouter()

# In-memory store for fallback/local operation
INCIDENT_RECORDS_STORE: Dict[str, Dict[str, Any]] = {}

@router.post("", status_code=status.HTTP_201_CREATED)
async def create_incident_record(payload: IncidentRecordCreate):
    """
    Creates and persists a formal incident record.
    """
    record_id = f"inc_{uuid.uuid4().hex[:12]}"
    now_iso = datetime.now(timezone.utc).isoformat()
    
    record = {
        "id": record_id,
        "user_id": payload.user_id,
        "session_id": payload.session_id,
        "incident_title": payload.incident_title,
        "severity": payload.severity,
        "status": payload.status,
        "executive_summary": payload.executive_summary,
        "root_cause": payload.root_cause,
        "trigger_event": payload.trigger_event,
        "impact_assessment": payload.impact_assessment,
        "affected_components": payload.affected_components,
        "causal_timeline": payload.causal_timeline,
        "action_items": payload.action_items,
        "rca_draft_markdown": payload.rca_draft_markdown,
        "created_at": now_iso,
        "updated_at": now_iso,
    }
    
    INCIDENT_RECORDS_STORE[record_id] = record
    return record

@router.get("")
async def list_incident_records(session_id: Optional[str] = None, user_id: Optional[str] = None):
    """
    Lists all persisted incident records, optionally filtered by session or user.
    """
    records = list(INCIDENT_RECORDS_STORE.values())
    if session_id:
        records = [r for r in records if r.get("session_id") == session_id]
    if user_id:
        records = [r for r in records if r.get("user_id") == user_id]
    
    # Sort by created_at descending
    records.sort(key=lambda r: r.get("created_at", ""), reverse=True)
    return records

@router.get("/{incident_id}")
async def get_incident_record(incident_id: str):
    """
    Retrieves a single incident record by ID.
    """
    record = INCIDENT_RECORDS_STORE.get(incident_id)
    if not record:
        raise HTTPException(status_code=404, detail=f"Incident record {incident_id} not found.")
    return record

@router.put("/{incident_id}")
async def update_incident_record(incident_id: str, payload: IncidentRecordUpdate):
    """
    Updates an incident record (e.g. status transition, adding action items, editing RCA draft).
    """
    record = INCIDENT_RECORDS_STORE.get(incident_id)
    if not record:
        raise HTTPException(status_code=404, detail=f"Incident record {incident_id} not found.")
    
    data = payload.model_dump(exclude_unset=True)
    data["updated_at"] = datetime.now(timezone.utc).isoformat()
    record.update(data)
    INCIDENT_RECORDS_STORE[incident_id] = record
    return record

@router.delete("/{incident_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_incident_record(incident_id: str):
    """
    Deletes an incident record.
    """
    if incident_id in INCIDENT_RECORDS_STORE:
        del INCIDENT_RECORDS_STORE[incident_id]
    return None

@router.post("/generate-rca")
async def generate_rca_report(payload: RCADraftGenerateRequest):
    """
    Generates a full publication-ready SRE Root Cause Analysis (RCA) Post-Mortem Draft
    from an active or provided log session.
    """
    session = None
    if payload.session_id:
        session = get_session(payload.session_id)
    
    analysis = session.get("analysis", {}) if session else {}
    errors = session.get("errors", []) if session else []
    summary = analysis.get("summary", "System incident detected across server component streams.")
    root_causes = analysis.get("root_cause_analysis", [])
    timeline = analysis.get("timeline", [])
    recommendations = analysis.get("recommendations", [])

    title = payload.incident_title or (
        root_causes[0]["cause"][:90] if root_causes else f"Incident in Session {payload.session_id or 'SRE'}"
    )

    markdown_draft = generate_rca_markdown(
        incident_title=title,
        severity=payload.severity or "MAJOR",
        session_id=payload.session_id or "sess_live",
        summary=summary,
        root_causes=root_causes,
        timeline_events=timeline,
        errors=errors,
        recommendations=recommendations,
        custom_notes=payload.custom_notes or ""
    )

    return {
        "incident_title": title,
        "severity": payload.severity or "MAJOR",
        "executive_summary": summary,
        "root_causes": root_causes,
        "timeline": timeline,
        "recommendations": recommendations,
        "rca_draft_markdown": markdown_draft,
        "generated_at": datetime.now(timezone.utc).isoformat(),
    }
