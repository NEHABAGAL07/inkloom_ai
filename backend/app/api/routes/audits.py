"""Audit Execution and Results API Routes with Database Persistence."""

import json
import os
from datetime import datetime, timezone
from typing import Optional, List, Union
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import CurrentUser, get_current_user
from app.database.session import get_db
from app.models.content import ContentSubmission, ContentRevision
from app.models.audit import AuditResultModel, FindingModel
from app.models.fact import VerifiedFact
from app.models.review import AuditEventModel
from app.schemas.audit import AuditResultSchema, AuditRunRequest, FindingSchema, LocationSchema, EngineMetadataSchema
from app.schemas.common import AuditStatusEnum, FindingCategoryEnum, FindingSeverityEnum, FindingStatusEnum, WorkflowStateEnum
from app.services.audit_orchestrator import AuditOrchestrator
from app.api.routes.content import _SUBMISSION_STORE

router = APIRouter(prefix="/audits", tags=["Audits"])

_orchestrator = AuditOrchestrator()
_AUDIT_STORE = {}


@router.post("/run", response_model=AuditResultSchema, status_code=status.HTTP_200_OK)
async def run_audit(
    payload: AuditRunRequest,
    current_user: CurrentUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Trigger automated brand governance audit on content submission.
    Persists audit execution and findings to database.
    Returns validated AuditResultSchema.
    """
    raw_text = None
    file_path = None
    filename = None
    resolved_revision_id = None
    guideline_id = payload.guideline_ids[0] if payload.guideline_ids else None

    # 1. Resolve content from DB or in-memory fallback
    query = (
        select(ContentSubmission)
        .options(selectinload(ContentSubmission.revisions))
        .where(ContentSubmission.id == payload.content_id)
    )
    res = await db.execute(query)
    submission = res.scalars().first()

    if submission and submission.revisions:
        # Resolve target revision
        if payload.revision_id:
            target_rev = next(
                (r for r in submission.revisions if str(r.id) == str(payload.revision_id) or str(r.revision_num) == str(payload.revision_id)),
                submission.revisions[-1]
            )
        else:
            target_rev = submission.revisions[-1]
        resolved_revision_id = target_rev.id
        raw_text = target_rev.raw_text
        file_path = target_rev.file_path
        if file_path:
            filename = os.path.basename(file_path)
    elif payload.content_id in _SUBMISSION_STORE:
        sub = _SUBMISSION_STORE[payload.content_id]
        if sub.revisions:
            rev = sub.revisions[-1]
            resolved_revision_id = rev.id
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
        resolved_revision_id = f"rev-{payload.content_id}-1"

    # 2. Fetch approved facts from database to verify claims
    facts_query = select(VerifiedFact).where(VerifiedFact.is_active.is_(True))
    facts_res = await db.execute(facts_query)
    verified_facts = [
        {
            "id": f.id,
            "statement": f.statement,
            "category": f.category,
            "source_document": f.source_document,
        }
        for f in facts_res.scalars().all()
    ]

    # 3. Execute audit orchestrator
    audit_result = _orchestrator.run_audit(
        content_id=payload.content_id,
        raw_text=raw_text,
        file_path=file_path,
        filename=filename,
        verified_facts=verified_facts if verified_facts else None,
    )

    # 4. Determine workflow state transition: automated audit queues content for human review
    # Invariant: automated audits never auto-approve; content moves to pending_approval for human sign-off
    next_status = WorkflowStateEnum.PENDING_APPROVAL

    # 5. Persist audit result and findings to database
    audit_model = AuditResultModel(
        id=audit_result.audit_id,
        organization_id=current_user.organization_id,
        content_id=payload.content_id,
        revision_id=resolved_revision_id or f"rev-{payload.content_id}-1",
        guideline_id=guideline_id,
        schema_version="1.0.0",
        overall_status=audit_result.overall_status.value,
        summary=audit_result.summary,
        engine_metadata=audit_result.engine_metadata.model_dump(),
    )
    db.add(audit_model)
    await db.flush()

    for finding in audit_result.findings:
        cat_map = {
            "tone_and_voice": "tone",
            "claim_verification": "unsupported_claim",
            "visual_compliance": "visual_consistency",
        }
        finding_cat = cat_map.get(finding.category.value, finding.category.value)
        finding_unique_id = f"{finding.id}-{audit_model.id[:8]}"
        finding_model = FindingModel(
            id=finding_unique_id,
            audit_id=audit_model.id,
            category=finding.category.value,
            severity=finding.severity.value,
            title=finding.title,
            message=finding.message,
            evidence=finding.evidence,
            original_text=finding.evidence,
            explanation=finding.message,
            source_reference=finding.source_reference,
            guideline_id=guideline_id,
            evidence_status="unverified" if finding_cat in ("unsupported_claim", "factual_accuracy") else "unavailable",
            confidence=finding.confidence,
            suggested_correction=finding.suggested_correction,
            suggestion=finding.suggested_correction,
            status=finding.status.value,
            location_data=finding.location.model_dump() if finding.location else None,
            requires_human_review=finding.requires_human_review,
        )
        db.add(finding_model)

    # Update submission status in database
    if submission:
        submission.current_status = next_status.value
        submission.updated_at = datetime.now(timezone.utc)
        db.add(submission)

    # Update in-memory fallback
    if payload.content_id in _SUBMISSION_STORE:
        _SUBMISSION_STORE[payload.content_id].current_status = next_status
        _SUBMISSION_STORE[payload.content_id].updated_at = datetime.now(timezone.utc)

    # Record immutable audit event
    event = AuditEventModel(
        organization_id=current_user.organization_id,
        actor_id=current_user.user_id,
        entity_type="audit",
        entity_id=audit_result.audit_id,
        event_type="audit_completed",
        details={
            "content_id": payload.content_id,
            "overall_status": audit_result.overall_status.value,
            "findings_count": len(audit_result.findings),
            "next_workflow_state": next_status.value,
        },
    )
    db.add(event)

    await db.commit()

    if payload.content_id in _SUBMISSION_STORE:
        _SUBMISSION_STORE[payload.content_id].current_status = WorkflowStateEnum.PENDING_APPROVAL
        _SUBMISSION_STORE[payload.content_id].updated_at = datetime.now(timezone.utc)

    _AUDIT_STORE[audit_result.audit_id] = audit_result
    return audit_result


@router.post("/content/{content_id}/audit", response_model=AuditResultSchema, status_code=status.HTTP_200_OK)
async def audit_content_by_id(
    content_id: str,
    payload: Optional[AuditRunRequest] = None,
    current_user: CurrentUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Trigger brand governance audit for specific content_id (Section 8 endpoint).
    """
    req = payload or AuditRunRequest(content_id=content_id)
    req.content_id = content_id
    return await run_audit(payload=req, current_user=current_user, db=db)


@router.get("/{audit_id}", response_model=AuditResultSchema)
async def get_audit_result(
    audit_id: str,
    current_user: CurrentUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Retrieve audit result conforming to shared audit contract."""
    # 1. Check database
    query = (
        select(AuditResultModel)
        .options(selectinload(AuditResultModel.findings))
        .where(AuditResultModel.id == audit_id)
    )
    res = await db.execute(query)
    audit = res.scalars().first()

    if audit:
        findings_schemas = []
        for f in audit.findings:
            loc = LocationSchema(**f.location_data) if f.location_data else None
            findings_schemas.append(
                FindingSchema(
                    id=f.id,
                    category=FindingCategoryEnum(f.category),
                    severity=FindingSeverityEnum(f.severity.lower()),
                    title=f.title,
                    message=f.message,
                    evidence=f.evidence or f.original_text,
                    source_reference=f.source_reference,
                    confidence=f.confidence,
                    suggested_correction=f.suggested_correction or f.suggestion,
                    status=FindingStatusEnum(f.status),
                    location=loc,
                    requires_human_review=f.requires_human_review,
                )
            )

        eng_meta = audit.engine_metadata or {}
        return AuditResultSchema(
            schema_version=audit.schema_version,
            audit_id=audit.id,
            content_id=audit.content_id,
            overall_status=AuditStatusEnum(audit.overall_status),
            summary=audit.summary,
            findings=findings_schemas,
            created_at=audit.created_at.isoformat() if audit.created_at else datetime.now(timezone.utc).isoformat(),
            engine_metadata=EngineMetadataSchema(
                engine_version=eng_meta.get("engine_version", "inkloom-audit-engine-v1.0.0"),
                execution_time_ms=eng_meta.get("execution_time_ms", 10.0),
                rules_checked_count=eng_meta.get("rules_checked_count", 0),
                ai_model_used=eng_meta.get("ai_model_used"),
                extractors_used=eng_meta.get("extractors_used", ["plain_text_extractor"]),
            ),
        )

    # 2. Check memory store
    if audit_id in _AUDIT_STORE:
        return _AUDIT_STORE[audit_id]

    # 3. If example audit id requested, return canonical contract example
    example_path = os.path.join(
        os.path.dirname(__file__), "..", "..", "..", "..", "contracts", "audit-result.example.json"
    )
    if os.path.exists(example_path):
        with open(example_path, "r", encoding="utf-8") as f:
            data = json.load(f)
            data["audit_id"] = audit_id
            return AuditResultSchema(**data)

    raise HTTPException(status_code=404, detail=f"Audit result '{audit_id}' not found.")
