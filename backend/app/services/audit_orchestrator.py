"""Inkloom AI - Central Audit Orchestrator.

Coordinates media extraction, AI rule verification, and workflow state updates.
"""

from typing import Optional, List, Dict, Any
from app.schemas.audit import AuditResultSchema
from app.services.ai_audit.engine import AIAuditEngine
from app.services.media_audit.extractor import MediaExtractor
from app.services.media_audit.media_orchestrator import MediaAuditOrchestrator
from app.workflow.state_machine import determine_next_state_from_audit
from app.schemas.common import FindingSeverityEnum, WorkflowStateEnum


class AuditOrchestrator:
    """Stitches media processing and AI brand checks into a unified pipeline."""

    def __init__(
        self,
        ai_engine: Optional[AIAuditEngine] = None,
        media_extractor: Optional[MediaExtractor] = None,
        media_orchestrator: Optional[MediaAuditOrchestrator] = None,
    ):
        self.ai_engine = ai_engine or AIAuditEngine()
        self.media_extractor = media_extractor or MediaExtractor()
        self.media_orchestrator = media_orchestrator or MediaAuditOrchestrator(
            ai_engine=self.ai_engine,
            media_extractor=self.media_extractor,
        )

    def run_audit(
        self,
        content_id: str,
        raw_text: Optional[str] = None,
        file_path: Optional[str] = None,
        filename: Optional[str] = None,
        mime_type: Optional[str] = None,
        custom_rules: Optional[List[Dict[str, Any]]] = None,
        verified_facts: Optional[List[Dict[str, Any]]] = None,
    ) -> AuditResultSchema:
        """
        Execute full audit cycle on text or file.
        Returns validated AuditResultSchema conforming to contract.
        """
        # If a file is provided, invoke media audit orchestrator
        if file_path and filename:
            media_audit_res = self.media_orchestrator.audit_media(
                file_path=file_path,
                filename=filename,
                mime_type=mime_type,
                custom_rules=custom_rules,
                content_id=content_id,
            )
            if media_audit_res.audit_result:
                return media_audit_res.audit_result

        extractors_used: List[str] = ["plain_text_extractor"]
        text_to_audit = raw_text or ""


        # Fallback if content was completely empty
        if not text_to_audit.strip():
            text_to_audit = "Sample brand content under evaluation."

        # Execute AI governance audit
        audit_result = self.ai_engine.audit_text(
            text=text_to_audit,
            content_id=content_id,
            custom_rules=custom_rules,
            verified_facts=verified_facts,
            extractors_used=extractors_used,
        )

        return audit_result

    def determine_workflow_outcome(self, audit_result: AuditResultSchema) -> WorkflowStateEnum:
        """Evaluate if audit findings warrant changes or pending approval."""
        has_blockers = any(
            f.severity in (FindingSeverityEnum.CRITICAL, FindingSeverityEnum.HIGH)
            for f in audit_result.findings
        )
        return determine_next_state_from_audit(has_blockers)
