"""
Brand Governance Audit Orchestrator

Coordinates the end-to-end audit lifecycle:
1. Media ingestion and text extraction (via MediaExtractor)
2. Brand guideline and verified benchmark loading (via Database/Retriever)
3. AI Audit evaluation pass (via AIAuditEngine)
4. Audit result and individual findings persistence
5. Workflow state progression and immutable audit logging
"""
import uuid
from typing import Optional, Dict, Any
from sqlalchemy.orm import Session

from app.models import (
    ContentSubmission,
    ContentRevision,
    AuditRun,
    AuditFinding,
    AuditEvent,
    BrandGuideline,
)
from app.workflow.state_machine import (
    WorkflowState,
    WorkflowStateMachine,
)
from app.services.media_audit import MediaExtractor
from app.services.ai_audit import AIAuditEngine
from app.schemas.audit_contract import AuditResult, OverallAuditStatus


class AuditOrchestrator:
    @classmethod
    def execute_audit_for_submission(
        cls,
        db: Session,
        submission_id: str,
        revision_id: Optional[str] = None,
        actor_id: Optional[str] = None,
    ) -> AuditResult:
        """
        Executes a complete governance audit for an existing submission.
        """
        submission = db.query(ContentSubmission).filter(ContentSubmission.id == submission_id).first()
        if not submission:
            raise ValueError(f"Submission with ID '{submission_id}' not found.")

        # Determine revision
        target_revision = None
        if revision_id:
            target_revision = db.query(ContentRevision).filter(ContentRevision.id == revision_id).first()
        elif submission.current_revision_id:
            target_revision = db.query(ContentRevision).filter(ContentRevision.id == submission.current_revision_id).first()

        content_text = ""
        media_type = "text/plain"

        if target_revision:
            if target_revision.raw_text:
                content_text = target_revision.raw_text
            elif target_revision.file_path:
                extracted = MediaExtractor.extract_from_file(
                    file_path=target_revision.file_path,
                    media_type="text/plain",
                    original_filename=target_revision.file_name,
                )
                content_text = extracted.extracted_text
        elif submission.description:
            content_text = submission.description

        # State transition: Mark auditing
        if WorkflowStateMachine.can_transition(submission.status, WorkflowState.AUDITING.value):
            submission.status = WorkflowState.AUDITING.value
            db.commit()

        # Query active organization guidelines
        guidelines_records = (
            db.query(BrandGuideline)
            .filter(
                BrandGuideline.organization_id == submission.organization_id,
                BrandGuideline.is_active == True,
            )
            .all()
        )
        active_guidelines_data = []
        for g in guidelines_records:
            for r in g.rules:
                active_guidelines_data.append({
                    "id": r.id,
                    "category": r.category,
                    "rule_name": r.rule_name,
                    "rule_definition": r.rule_definition,
                })

        # Run AI Audit Pass
        audit_result: AuditResult = AIAuditEngine.run_audit(
            content_text=content_text or submission.title,
            content_id=submission.id,
            revision_id=target_revision.id if target_revision else None,
            active_guidelines=active_guidelines_data,
            media_type=media_type,
        )

        # Persist AuditRun
        run_record = AuditRun(
            id=audit_result.audit_id,
            submission_id=submission.id,
            revision_id=target_revision.id if target_revision else None,
            schema_version=audit_result.schema_version,
            overall_status=audit_result.overall_status.value,
            summary=audit_result.summary.model_dump(),
            engine_metadata=audit_result.engine_metadata.model_dump(),
        )
        db.add(run_record)

        # Persist individual findings
        for finding in audit_result.findings:
            db_finding = AuditFinding(
                audit_run_id=run_record.id,
                finding_id=finding.id,
                category=finding.category.value,
                severity=finding.severity.value,
                title=finding.title,
                message=finding.message,
                evidence=finding.evidence,
                source_reference=finding.source_reference.model_dump() if finding.source_reference else None,
                confidence=finding.confidence,
                suggested_correction=finding.suggested_correction.model_dump() if finding.suggested_correction else None,
                status=finding.status.value,
                location=finding.location.model_dump() if finding.location else None,
                requires_human_review=finding.requires_human_review,
            )
            db.add(db_finding)

        # Progress workflow state based on audit results
        # NOTE: AI NEVER transitions to approved. Final approval requires human reviewer.
        if audit_result.overall_status == OverallAuditStatus.NON_COMPLIANT:
            next_state = WorkflowState.CHANGES_REQUESTED.value
        else:
            next_state = WorkflowState.PENDING_APPROVAL.value

        submission.status = next_state

        # Log immutable audit event
        event = AuditEvent(
            organization_id=submission.organization_id,
            actor_id=actor_id or "system_ai_orchestrator",
            entity_type="audit_run",
            entity_id=run_record.id,
            event_type="audit_completed",
            details={
                "submission_id": submission.id,
                "overall_status": audit_result.overall_status.value,
                "compliance_score": audit_result.summary.compliance_score,
                "total_findings": audit_result.summary.total_findings,
                "new_workflow_state": next_state,
            },
        )
        db.add(event)
        db.commit()
        db.refresh(run_record)

        return audit_result
