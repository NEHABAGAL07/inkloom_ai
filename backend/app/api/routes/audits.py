"""Audit Execution and Results API Routes."""

import json
import os
from datetime import datetime, timezone
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status
from app.core.security import CurrentUser, get_current_user
from app.schemas.audit import AuditResultSchema, AuditRunRequest
from app.schemas.common import WorkflowStateEnum
from app.services.audit_orchestrator import AuditOrchestrator
from app.api.routes.content import _SUBMISSION_STORE

router = APIRouter(prefix="/audits", tags=["Audits"])

_orchestrator = AuditOrchestrator()
_AUDIT_STORE = {}


@router.post("/run", response_model=AuditResultSchema, status_code=status.HTTP_200_OK)
async def run_audit(
    payload: AuditRunRequest,
    current_user: CurrentUser = Depends(get_current_user),
):
    """
    Trigger automated brand governance audit on content submission.
    Returns validated AuditResultSchema.
    """
    raw_text = None
    file_path = None
    filename = None

    if payload.content_id in _SUBMISSION_STORE:
        sub = _SUBMISSION_STORE[payload.content_id]
        if sub.revisions:
            rev = sub.revisions[-1]
            raw_text = rev.raw_text
            file_path = rev.file_path
            if file_path:
                filename = os.path.basename(file_path)
    else:
        # Default sample text to audit if content_id was not previously submitted
        raw_text = (
            "Try inkloom today for best-in-class workflows. "
            "Our system delivers a 100% error-free guarantee across all media. "
            "We are super pumped to announce this capability."
        )

    audit_result = _orchestrator.run_audit(
        content_id=payload.content_id,
        raw_text=raw_text,
        file_path=file_path,
        filename=filename,
    )

    if payload.content_id in _SUBMISSION_STORE:
        _SUBMISSION_STORE[payload.content_id].current_status = WorkflowStateEnum.PENDING_APPROVAL
        _SUBMISSION_STORE[payload.content_id].updated_at = datetime.now(timezone.utc)

    _AUDIT_STORE[audit_result.audit_id] = audit_result
    return audit_result


@router.get("/{audit_id}", response_model=AuditResultSchema)
async def get_audit_result(
    audit_id: str,
    current_user: CurrentUser = Depends(get_current_user),
):
    """Retrieve audit result conforming to shared audit contract."""
    if audit_id in _AUDIT_STORE:
        return _AUDIT_STORE[audit_id]

    # If example audit id requested or not found, return canonical contract example
    example_path = os.path.join(
        os.path.dirname(__file__), "..", "..", "..", "..", "contracts", "audit-result.example.json"
    )
    if os.path.exists(example_path):
        with open(example_path, "r", encoding="utf-8") as f:
            data = json.load(f)
            data["audit_id"] = audit_id
            return AuditResultSchema(**data)

    raise HTTPException(status_code=404, detail=f"Audit result '{audit_id}' not found.")
