"""
Context Resolver Module for AI Audit Pipeline
Stage 1 & Stage 2:
- Validates the submission and retrieves its immutable content version
- Identifies content type, language, intended channel, target audience, product, and jurisdiction
"""
from typing import Optional, Dict, Any, Tuple
from sqlalchemy.orm import Session

from app.models.submission import ContentSubmission
from app.models.revision import ContentRevision
from app.services.media_audit.extractor import MediaExtractor


class AuditContextResolver:
    """Resolves and validates audit targets, content metadata, and immutable revisions."""

    @classmethod
    def resolve_target_content(
        cls,
        db: Optional[Session],
        submission_id: str,
        revision_id: Optional[str] = None,
        provided_text: Optional[str] = None,
        provided_metadata: Optional[Dict[str, Any]] = None,
    ) -> Tuple[str, Optional[ContentSubmission], Optional[ContentRevision], Dict[str, Any]]:
        """
        Retrieves submission, target revision, immutable raw content, and context metadata.
        Returns:
            (content_text, submission, target_revision, metadata)
        """
        metadata: Dict[str, Any] = {
            "content_type": "text",
            "language": "en",
            "channel": "web",
            "target_audience": "enterprise",
            "product": "Inkloom AI",
            "jurisdiction": "Global",
        }
        if provided_metadata:
            metadata.update(provided_metadata)

        submission: Optional[ContentSubmission] = None
        target_revision: Optional[ContentRevision] = None
        content_text = provided_text or ""

        if db and submission_id:
            submission = db.query(ContentSubmission).filter(ContentSubmission.id == submission_id).first()
            if submission:
                metadata["content_type"] = submission.content_type
                if submission.title and not content_text:
                    content_text = submission.title

                # Locate target revision
                if revision_id:
                    target_revision = db.query(ContentRevision).filter(ContentRevision.id == revision_id).first()
                elif submission.current_revision_id:
                    target_revision = db.query(ContentRevision).filter(ContentRevision.id == submission.current_revision_id).first()

                if target_revision:
                    # Inherit revision metadata
                    if target_revision.media_metadata:
                        for k in ["channel", "target_audience", "jurisdiction", "product", "language"]:
                            if k in target_revision.media_metadata:
                                metadata[k] = target_revision.media_metadata[k]

                    if target_revision.raw_text:
                        content_text = target_revision.raw_text
                    elif target_revision.file_path:
                        try:
                            extracted = MediaExtractor.extract_from_file(
                                file_path=target_revision.file_path,
                                media_type=submission.content_type,
                                original_filename=target_revision.file_name,
                            )
                            content_text = extracted.extracted_text
                            metadata["extracted_segments"] = len(extracted.segments)
                            metadata["extraction_warnings"] = [w.message for w in extracted.warnings]
                        except Exception as e:
                            metadata["extraction_error"] = str(e)
                elif submission.description and not content_text:
                    content_text = submission.description

        # Infer metadata heuristics from text if not explicitly configured
        cls._infer_heuristics(content_text, metadata)

        return content_text, submission, target_revision, metadata

    @staticmethod
    def _infer_heuristics(text: str, metadata: Dict[str, Any]) -> None:
        """Applies non-destructive heuristics to detect channel and jurisdiction signals."""
        lower = text.lower() if text else ""
        # Channel detection
        if not metadata.get("channel") or metadata.get("channel") == "web":
            if any(k in lower for k in ["#", "@", "tweet", "retweet", "post", "linkedin", "instagram"]):
                metadata["channel"] = "social"
            elif any(k in lower for k in ["subject:", "unsubscribe", "dear customer", "newsletter"]):
                metadata["channel"] = "email"
            elif any(k in lower for k in ["billboard", "print", "flyer", "brochure"]):
                metadata["channel"] = "print"

        # Jurisdiction signals
        if not metadata.get("jurisdiction") or metadata.get("jurisdiction") == "Global":
            if any(k in lower for k in ["gdpr", "eu ai act", "european union", "eea", "ce mark"]):
                metadata["jurisdiction"] = "EU"
            elif any(k in lower for k in ["ftc", "sec", "fda", "ccpa", "california", "united states", "delaware"]):
                metadata["jurisdiction"] = "US"
            elif any(k in lower for k in ["uk gdpr", "fca", "united kingdom", "london"]):
                metadata["jurisdiction"] = "UK"
