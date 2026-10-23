"""Inkloom AI - Media Audit Orchestrator.

Coordinates media extraction, visual rules validation, OCR inspection,
and seamless integration with the AI Audit Engine. Maps findings to
spatial page numbers and video timestamps.
"""

import os
import time
from typing import Optional, List, Dict, Any
from app.services.media_audit.interfaces import (
    MediaProcessingResult,
    MediaProcessingStatus,
    MediaAuditResult,
    TextSegment,
)
from app.services.media_audit.file_validation import (
    FileValidator,
    sanitize_filename,
)
from app.services.media_audit.extractor import MediaExtractor
from app.services.media_audit.visual_rules import VisualBrandRulesEngine
from app.services.media_audit.ocr import OCRExtractor
from app.services.ai_audit.engine import AIAuditEngine
from app.schemas.audit import AuditResultSchema, FindingSchema, LocationSchema, EngineMetadataSchema
from app.schemas.common import (
    AuditStatusEnum,
    FindingCategoryEnum,
    FindingSeverityEnum,
    FindingStatusEnum,
)


class MediaAuditOrchestrator:
    """Coordinates media preprocessing, visual checks, and AI brand governance."""

    def __init__(
        self,
        ai_engine: Optional[AIAuditEngine] = None,
        media_extractor: Optional[MediaExtractor] = None,
        visual_rules: Optional[VisualBrandRulesEngine] = None,
        ocr_extractor: Optional[OCRExtractor] = None,
    ):
        self.ai_engine = ai_engine or AIAuditEngine()
        self.media_extractor = media_extractor or MediaExtractor()
        self.visual_rules = visual_rules or VisualBrandRulesEngine()
        self.ocr_extractor = ocr_extractor or OCRExtractor()

    def map_finding_to_segment(
        self,
        finding: FindingSchema,
        segments: List[TextSegment],
        full_text: str,
    ) -> FindingSchema:
        """
        Enrich a text-based finding with physical page number or video timestamp
        by matching its character offset against extracted media segments.
        """
        if not segments or not finding.location or finding.location.start_offset is None:
            return finding

        target_offset = finding.location.start_offset

        # Check if segments have explicit offsets
        for seg in segments:
            if seg.start_offset is not None and seg.end_offset is not None:
                if seg.start_offset <= target_offset <= seg.end_offset:
                    if seg.page_number is not None:
                        finding.location.page = seg.page_number
                    if seg.timestamp_seconds is not None:
                        finding.location.timestamp_seconds = seg.timestamp_seconds
                    return finding

        # If explicit offsets not stored on segments, compute cumulative offsets
        cumulative = 0
        for seg in segments:
            seg_len = len(seg.text)
            seg_end = cumulative + seg_len + 2  # accounted for \n\n separator
            if cumulative <= target_offset <= seg_end:
                if seg.page_number is not None:
                    finding.location.page = seg.page_number
                if seg.timestamp_seconds is not None:
                    finding.location.timestamp_seconds = seg.timestamp_seconds
                return finding
            cumulative = seg_end

        return finding

    def audit_media(
        self,
        file_path: str,
        filename: str,
        mime_type: Optional[str] = None,
        transcript_text: Optional[str] = None,
        alt_text: Optional[str] = None,
        custom_rules: Optional[List[Dict[str, Any]]] = None,
        context: Optional[Dict[str, Any]] = None,
        content_id: Optional[str] = None,
    ) -> MediaAuditResult:
        """
        Full media audit pipeline:
        1. File validation (extension, magic bytes, size limits)
        2. Media extraction & layout segmentation
        3. Visual brand and accessibility rules (contrast, palette, resolution, alt-text)
        4. Scanned PDF & OCR requirement detection
        5. AI Engine brand audit on extracted text with source location mapping
        """
        start_time = time.perf_counter()
        sanitized = sanitize_filename(filename)
        effective_content_id = content_id or f"media-{int(time.time())}"

        # 1. File Validation
        is_valid, resolved_mime, validation_errors = FileValidator.validate(
            file_path=file_path,
            filename=sanitized,
            mime_type=mime_type,
        )

        if not is_valid:
            duration_ms = round((time.perf_counter() - start_time) * 1000, 2)
            return MediaAuditResult(
                status=MediaProcessingStatus.FAILED,
                media_type=resolved_mime,
                file_metadata={"filename": sanitized, "error": "validation_failed"},
                errors=validation_errors,
                duration_ms=duration_ms,
            )

        # 2. Media Extraction
        extraction_res: MediaProcessingResult = self.media_extractor.extract(
            file_path=file_path,
            filename=sanitized,
            mime_type=resolved_mime,
            transcript_text=transcript_text,
        )

        all_findings: List[FindingSchema] = []
        all_warnings: List[str] = list(extraction_res.warnings)
        all_errors: List[str] = list(extraction_res.errors)

        capabilities = {
            "text_extraction_success": bool(extraction_res.extracted_text.strip()),
            "ocr_available": self.ocr_extractor.is_available(),
            "ocr_success": extraction_res.metadata.get("has_embedded_text", False),
            "visual_analysis_success": extraction_res.visual_results is not None,
            "transcript_available": bool(transcript_text and transcript_text.strip()),
            "ffmpeg_available": extraction_res.metadata.get("ffmpeg_available", False),
            "ai_audit_completed": False,
        }

        # 3. Alt-text Accessibility Check for Visual Assets
        if resolved_mime.startswith("image/") or resolved_mime.startswith("video/"):
            alt_findings = self.visual_rules.evaluate_alt_text(alt_text)
            all_findings.extend(alt_findings)

        # 4. Visual Compliance Checks for Images & Video Frames
        if extraction_res.visual_results:
            vis = extraction_res.visual_results
            if len(vis.dominant_colors) >= 2 and vis.contrast_ratio is not None:
                contrast_finding = self.visual_rules.evaluate_contrast(
                    vis.dominant_colors[0], vis.dominant_colors[1]
                )
                if contrast_finding:
                    all_findings.append(contrast_finding)

            palette_findings = self.visual_rules.evaluate_palette_adherence(vis.dominant_colors)
            all_findings.extend(palette_findings)

            if vis.resolution_width and vis.resolution_height:
                dim_findings = self.visual_rules.evaluate_dimensions(
                    vis.resolution_width, vis.resolution_height
                )
                all_findings.extend(dim_findings)

        # 5. Scanned PDF / OCR Requirement Check
        is_scanned_pdf = extraction_res.metadata.get("is_scanned_pdf", False)
        if is_scanned_pdf:
            all_findings.append(
                FindingSchema(
                    id="doc-scanned-001",
                    category=FindingCategoryEnum.ACCESSIBILITY,
                    severity=FindingSeverityEnum.HIGH,
                    title="Scanned Document Requires OCR Text Extraction",
                    message=(
                        "The uploaded PDF contains little or no selectable text. OCR is required to extract "
                        "and audit text embedded in images on these pages."
                    ),
                    evidence="Extracted selectable text character count < 40 across document pages.",
                    source_reference="Document Intake Standard Section 3.1: Scanned Media Policy",
                    confidence=0.99,
                    suggested_correction="Convert document through an OCR pipeline or provide digital original.",
                    status=FindingStatusEnum.FLAGGED,
                    location=LocationSchema(page=1),
                    requires_human_review=True,
                )
            )

        # 6. Execute AI Brand Governance Audit on Extracted Text
        audit_result: Optional[AuditResultSchema] = None
        extracted_text = extraction_res.extracted_text

        if extracted_text.strip():
            audit_result = self.ai_engine.audit_text(
                text=extracted_text,
                content_id=effective_content_id,
                custom_rules=custom_rules,
                extractors_used=[f"media_audit:{resolved_mime}"],
            )
            capabilities["ai_audit_completed"] = True

            # Map text findings to physical page or video timestamp locations
            mapped_text_findings = []
            for f in audit_result.findings:
                mapped = self.map_finding_to_segment(f, extraction_res.segments, extracted_text)
                mapped_text_findings.append(mapped)

            all_findings.extend(mapped_text_findings)

        # 7. Synthesize Canonical AuditResultSchema
        if audit_result is None:
            # Construct standalone AuditResultSchema when media has no text
            has_blockers = any(
                f.severity in (FindingSeverityEnum.CRITICAL, FindingSeverityEnum.HIGH)
                for f in all_findings
            )
            overall_status = (
                AuditStatusEnum.NEEDS_HUMAN_REVIEW
                if has_blockers
                else (AuditStatusEnum.WARNING if all_findings else AuditStatusEnum.PASSED)
            )

            audit_result = AuditResultSchema(
                audit_id=f"audit-{effective_content_id}",
                content_id=effective_content_id,
                overall_status=overall_status,
                summary=(
                    f"Media audit completed for {sanitized}. "
                    f"Identified {len(all_findings)} visual and governance finding(s)."
                ),
                findings=all_findings,
                created_at=time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
                engine_metadata=EngineMetadataSchema(
                    engine_version="1.0.0",
                    execution_time_ms=round((time.perf_counter() - start_time) * 1000, 2),
                    rules_checked_count=len(all_findings) + 5,
                    ai_model_used="deterministic-media-pipeline",
                    extractors_used=[f"media_audit:{resolved_mime}"],
                ),
            )
        else:
            # Merge visual findings into AI engine audit result
            audit_result.findings = all_findings
            has_blockers = any(
                f.severity in (FindingSeverityEnum.CRITICAL, FindingSeverityEnum.HIGH)
                for f in all_findings
            )
            if has_blockers:
                audit_result.overall_status = AuditStatusEnum.NEEDS_HUMAN_REVIEW

        # 8. Safe File Metadata (strip local filesystem paths)
        safe_file_metadata = {
            "original_filename": sanitized,
            "media_type": resolved_mime,
            "size_bytes": os.path.getsize(file_path) if os.path.exists(file_path) else 0,
        }
        for k, v in extraction_res.metadata.items():
            if not isinstance(v, (str, int, float, bool, list, dict)):
                continue
            str_v = str(v)
            if not str_v.startswith("/") and not str_v.startswith("C:\\") and "path" not in k.lower():
                safe_file_metadata[k] = v

        # 9. Overall Processing Status
        overall_proc_status = MediaProcessingStatus.SUCCESS
        if extraction_res.status == MediaProcessingStatus.FAILED:
            overall_proc_status = MediaProcessingStatus.FAILED
        elif (
            extraction_res.status == MediaProcessingStatus.PARTIAL
            or is_scanned_pdf
            or (not extracted_text.strip() and resolved_mime.startswith("text/"))
        ):
            overall_proc_status = MediaProcessingStatus.PARTIAL

        duration_ms = round((time.perf_counter() - start_time) * 1000, 2)

        return MediaAuditResult(
            status=overall_proc_status,
            media_type=resolved_mime,
            file_metadata=safe_file_metadata,
            extracted_text=extracted_text,
            findings=all_findings,
            audit_result=audit_result,
            capabilities=capabilities,
            warnings=all_warnings,
            errors=all_errors,
            duration_ms=duration_ms,
        )
