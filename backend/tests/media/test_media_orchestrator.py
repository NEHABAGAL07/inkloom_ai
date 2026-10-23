"""Inkloom AI - Media Audit Orchestrator Integration Tests.

Validates end-to-end pipeline:
- Media extraction + visual rules + AI Audit Engine integration
- Spatial and temporal location mapping (page numbers, video timestamps)
- Partial success representation (scanned PDF, unconfigured OCR/FFmpeg)
- Strict contract conformance of resulting AuditResultSchema
"""

import os
import pypdf
from PIL import Image
import pytest
from app.services.media_audit.media_orchestrator import MediaAuditOrchestrator
from app.services.media_audit.interfaces import MediaProcessingStatus
from app.services.media_audit.file_validation import SafeTempFile
from app.schemas.common import (
    AuditStatusEnum,
    FindingCategoryEnum,
    FindingSeverityEnum,
)
from tests.media.test_video_audit import create_synthetic_mp4_header


def test_media_orchestrator_txt_document_with_ai_findings():
    """Verify text document extraction invokes AI audit engine and maps findings."""
    orchestrator = MediaAuditOrchestrator()

    # Content contains colloquialism ("super pumped") and unsupported claim ("100% error-free guarantee")
    content = (
        "Welcome to the official Inkloom enterprise announcement.\n\n"
        "We are super pumped to unveil our brand platform.\n\n"
        "Our engine provides a 100% error-free guarantee across all channels."
    )

    with SafeTempFile(suffix=".txt") as tf_path:
        with open(tf_path, "w", encoding="utf-8") as f:
            f.write(content)

        res = orchestrator.audit_media(
            file_path=tf_path,
            filename="press_release.txt",
            mime_type="text/plain",
        )

        assert res.status == MediaProcessingStatus.SUCCESS
        assert res.capabilities["text_extraction_success"] is True
        assert res.capabilities["ai_audit_completed"] is True
        assert res.audit_result is not None
        assert len(res.findings) >= 2

        # Verify findings have page numbers mapped
        for f in res.findings:
            assert f.location is not None
            assert f.location.page == 1

        # Check safe metadata (no local paths)
        assert "file_path" not in res.file_metadata
        assert res.file_metadata["original_filename"] == "press_release.txt"


def test_media_orchestrator_image_with_visual_and_alt_text():
    """Verify image audit evaluates visual palette, contrast, and alt text."""
    orchestrator = MediaAuditOrchestrator()

    # Create synthetic image
    img = Image.new("RGB", (600, 400), color=(26, 54, 93))

    with SafeTempFile(suffix=".png") as tf_path:
        img.save(tf_path, format="PNG")

        # Run audit with MISSING alt text
        res = orchestrator.audit_media(
            file_path=tf_path,
            filename="hero_banner.png",
            mime_type="image/png",
            alt_text=None,
        )

        assert res.status == MediaProcessingStatus.SUCCESS
        assert res.capabilities["visual_analysis_success"] is True

        # Should flag missing alt text
        alt_findings = [f for f in res.findings if f.category == FindingCategoryEnum.ACCESSIBILITY]
        assert len(alt_findings) >= 1
        assert any("alt text" in f.title.lower() for f in alt_findings)


def test_media_orchestrator_scanned_pdf_reports_partial_and_ocr_requirement():
    """Verify scanned PDF without selectable text produces PARTIAL status and OCR finding."""
    orchestrator = MediaAuditOrchestrator()

    writer = pypdf.PdfWriter()
    writer.add_blank_page(width=612, height=792)

    with SafeTempFile(suffix=".pdf") as tf_path:
        with open(tf_path, "wb") as f:
            writer.write(f)

        res = orchestrator.audit_media(
            file_path=tf_path,
            filename="scanned_contract.pdf",
            mime_type="application/pdf",
        )

        # Scanned PDF must be marked PARTIAL, not misleadingly SUCCESS
        assert res.status == MediaProcessingStatus.PARTIAL
        assert any("Scanned document detected" in w for w in res.warnings)

        # Verify OCR requirement finding was generated
        ocr_findings = [f for f in res.findings if "OCR" in f.title]
        assert len(ocr_findings) >= 1
        assert ocr_findings[0].severity == FindingSeverityEnum.HIGH
        assert ocr_findings[0].requires_human_review is True


def test_media_orchestrator_video_transcript_with_timestamp_mapping():
    """Verify video audit with transcript maps findings to video timestamps."""
    orchestrator = MediaAuditOrchestrator()
    mp4_bytes = create_synthetic_mp4_header(duration_sec=60.0)

    # Transcript has colloquialism in sentence 2
    transcript = (
        "Welcome to the annual shareholder meeting. "
        "We are super pumped about our Q3 results. "
        "Thank you for attending."
    )

    with SafeTempFile(suffix=".mp4") as tf_path:
        with open(tf_path, "wb") as f:
            f.write(mp4_bytes)

        res = orchestrator.audit_media(
            file_path=tf_path,
            filename="quarterly_review.mp4",
            mime_type="video/mp4",
            transcript_text=transcript,
        )

        assert res.status == MediaProcessingStatus.SUCCESS
        assert res.capabilities["transcript_available"] is True
        assert res.capabilities["ai_audit_completed"] is True

        # Finding on "super pumped" should have positive timestamp
        tone_findings = [f for f in res.findings if f.category == FindingCategoryEnum.TONE_AND_VOICE]
        assert len(tone_findings) >= 1
        assert tone_findings[0].location is not None
        assert tone_findings[0].location.timestamp_seconds is not None
        assert tone_findings[0].location.timestamp_seconds >= 0.0


def test_media_orchestrator_validation_failure():
    """Verify invalid or spoofed files abort immediately with FAILED status."""
    orchestrator = MediaAuditOrchestrator()

    with SafeTempFile(suffix=".pdf") as tf_path:
        with open(tf_path, "wb") as f:
            # Spoofed executable
            f.write(b"MZ\x00\x00malicious_binary")

        res = orchestrator.audit_media(
            file_path=tf_path,
            filename="fake_report.pdf",
            mime_type="application/pdf",
        )

        assert res.status == MediaProcessingStatus.FAILED
        assert len(res.errors) > 0
        assert res.audit_result is None
