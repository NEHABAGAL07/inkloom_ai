from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.core.security import get_current_auth_context, AuthContext
from app.models import AuditRun, ContentSubmission
from app.schemas.audit_contract import AuditResult, Finding, AuditSummary, EngineMetadata
from app.services.audit_orchestrator import AuditOrchestrator

router = APIRouter(prefix="/audits", tags=["Brand Governance Audits"])


class TriggerAuditRequest(BaseModel):
    submission_id: str
    revision_id: Optional[str] = None


@router.post("/trigger", response_model=AuditResult, status_code=status.HTTP_201_CREATED)
def trigger_audit(
    payload: TriggerAuditRequest,
    db: Session = Depends(get_db),
    auth: AuthContext = Depends(get_current_auth_context),
):
    """
    Triggers an end-to-end brand governance audit pass on a submission.
    """
    submission = (
        db.query(ContentSubmission)
        .filter(
            ContentSubmission.id == payload.submission_id,
            ContentSubmission.organization_id == auth.organization_id,
        )
        .first()
    )
    if not submission:
        raise HTTPException(status_code=404, detail="Submission not found.")

    try:
        audit_result = AuditOrchestrator.execute_audit_for_submission(
            db=db,
            submission_id=submission.id,
            revision_id=payload.revision_id,
            actor_id=auth.user_id,
        )
        return audit_result
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Audit execution failed: {str(e)}",
        )


@router.get("/{audit_id}", response_model=AuditResult)
def get_audit(
    audit_id: str,
    db: Session = Depends(get_db),
    auth: AuthContext = Depends(get_current_auth_context),
):
    """Fetch an audit run with full findings adhering to the contract."""
    audit_run = (
        db.query(AuditRun)
        .filter((AuditRun.id == audit_id) | (AuditRun.submission_id == audit_id))
        .order_by(AuditRun.created_at.desc())
        .first()
    )
    if not audit_run:
        # Check if audit_id is a submission_id that has not yet been audited
        submission = (
            db.query(ContentSubmission)
            .filter(
                ContentSubmission.id == audit_id,
                ContentSubmission.organization_id == auth.organization_id,
            )
            .first()
        )
        if submission:
            return AuditOrchestrator.execute_audit_for_submission(
                db=db,
                submission_id=submission.id,
                actor_id=auth.user_id,
            )
        raise HTTPException(status_code=404, detail="Audit run not found.")

    submission = db.query(ContentSubmission).filter(ContentSubmission.id == audit_run.submission_id).first()
    if not submission or submission.organization_id != auth.organization_id:
        raise HTTPException(status_code=404, detail="Audit run not found for tenant.")

    findings_list = []
    for f in audit_run.findings:
        details = getattr(f, "details", {}) or {}
        findings_list.append(
            Finding(
                id=f.finding_id,
                category=f.category,
                severity=f.severity,
                title=f.title,
                message=f.message,
                evidence=f.evidence,
                source_reference=f.source_reference,
                confidence=f.confidence,
                suggested_correction=f.suggested_correction,
                status=f.status,
                location=f.location,
                requires_human_review=f.requires_human_review,
                rule_reference=getattr(f, "rule_reference", None),
                evidence_status=getattr(f, "evidence_status", None),
                jurisdiction=getattr(f, "jurisdiction", None),
                original_text=details.get("original_text", f.evidence),
                explanation=details.get("explanation", f.message),
                evidence_references=details.get("evidence_references", []),
                correction_rationale=details.get("correction_rationale"),
                limitations=details.get("limitations"),
                alternative_punchlines=details.get("alternative_punchlines"),
            )
        )

    return AuditResult(
        schema_version=audit_run.schema_version,
        audit_id=audit_run.id,
        content_id=audit_run.submission_id,
        revision_id=audit_run.revision_id,
        overall_status=audit_run.overall_status,
        summary=AuditSummary(**audit_run.summary),
        findings=findings_list,
        created_at=audit_run.created_at,
        engine_metadata=EngineMetadata(**audit_run.engine_metadata),
    )
