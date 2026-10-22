"""Inkloom AI - Central Audit Orchestrator.

Coordinates media extraction, AI rule verification, and workflow state updates.
"""

from typing import Optional, List, Dict, Any
from app.schemas.audit import AuditResultSchema
from app.services.ai_audit.engine import AIAuditEngine
from app.services.media_audit.extractor import MediaExtractor
from app.workflow.state_machine import determine_next_state_from_audit
from app.schemas.common import FindingSeverityEnum, WorkflowStateEnum


class AuditOrchestrator:
    """Stitches media processing and AI brand checks into a unified pipeline."""

    def __init__(
        self,
        ai_engine: Optional[AIAuditEngine] = None,
        media_extractor: Optional[MediaExtractor] = None,
    ):
        self.ai_engine = ai_engine or AIAuditEngine()
        self.media_extractor = media_extractor or MediaExtractor()

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
        extractors_used: List[str] = []
        text_to_audit = raw_text or ""

        # If a file is provided, invoke media extractor
        if file_path and filename:
            extraction_result = self.media_extractor.extract(
                file_path=file_path,
                filename=filename,
                mime_type=mime_type,
            )
            extractors_used.append(f"media_extractor:{extraction_result.media_type}")
            if extraction_result.extracted_text:
                if text_to_audit:
                    text_to_audit = f"{text_to_audit}\n\n{extraction_result.extracted_text}"
                else:
                    text_to_audit = extraction_result.extracted_text
        else:
            extractors_used.append("plain_text_extractor")

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
