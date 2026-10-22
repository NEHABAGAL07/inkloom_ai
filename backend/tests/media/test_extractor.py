"""Media Processing and QA Unit Tests."""

import os
import tempfile
import pytest
from app.services.media_audit.extractor import MediaExtractor, sanitize_filename
from app.services.media_audit.interfaces import MediaProcessingStatus
from app.services.media_audit.document_processor import DocumentProcessor
from app.services.media_audit.image_processor import ImageProcessor
from app.services.media_audit.video_processor import VideoProcessor


def test_sanitize_filename():
    """Verify dangerous traversal patterns are neutralized."""
    assert sanitize_filename("../../../etc/passwd") == "passwd"
    assert sanitize_filename("..\\..\\windows\\system32\\cmd.exe") == "cmd.exe"
    assert sanitize_filename("safe_document-v2.pdf") == "safe_document-v2.pdf"
    assert sanitize_filename("dangerous<script>alert(1).png") == "dangerous_script_alert_1_.png"


def test_plain_text_extraction():
    """Verify TXT file extraction produces valid text and segmented lines."""
    fixture_path = os.path.join(os.path.dirname(__file__), "fixtures", "sample_copy.txt")
    assert os.path.exists(fixture_path)

    extractor = MediaExtractor()
    result = extractor.extract(
        file_path=fixture_path,
        filename="sample_copy.txt",
        mime_type="text/plain",
    )

    assert result.status == MediaProcessingStatus.SUCCESS
    assert "Inkloom AI Launch Copy Sample" in result.extracted_text
    assert len(result.segments) >= 3
    assert result.segments[0].page_number == 1


def test_file_size_limit_rejection():
    """Verify oversized files are rejected before processing."""
    extractor = MediaExtractor()
    with tempfile.NamedTemporaryFile(suffix=".txt", delete=False) as tf:
        tf.write(b"0" * 1024)
        tf_path = tf.name

    try:
        # Mock constraint by checking with tiny limit
        from app.core.config import settings
        original_limit = settings.MAX_UPLOAD_SIZE_BYTES
        settings.MAX_UPLOAD_SIZE_BYTES = 512  # 512 bytes limit

        res = extractor.extract(file_path=tf_path, filename="large.txt", mime_type="text/plain")
        assert res.status == MediaProcessingStatus.FAILED
        assert any("exceeds configured maximum limit" in err for err in res.errors)

        settings.MAX_UPLOAD_SIZE_BYTES = original_limit
    finally:
        if os.path.exists(tf_path):
            os.remove(tf_path)


def test_visual_brand_checker_baseline():
    """Verify image processor provides visual metrics even without external OCR binaries."""
    processor = ImageProcessor()
    with tempfile.NamedTemporaryFile(suffix=".png", delete=False) as tf:
        tf.write(b"\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01\x08\x06\x00\x00\x00")
        tf_path = tf.name

    try:
        res = processor.process_image(file_path=tf_path, filename="test.png")
        assert res.status == MediaProcessingStatus.SUCCESS
        assert res.visual_results is not None
        assert res.visual_results.contrast_ratio >= 4.5
        assert len(res.visual_results.dominant_colors) > 0
    finally:
        if os.path.exists(tf_path):
            os.remove(tf_path)


def test_video_processor_transcript_ingestion():
    """Verify video processor ingests external transcript with timestamps."""
    processor = VideoProcessor()
    res = processor.process_video(
        file_path="mock_video.mp4",
        filename="mock_video.mp4",
        transcript_text="Welcome to the Inkloom keynote presentation.",
    )
    assert res.status == MediaProcessingStatus.SUCCESS
    assert "Inkloom keynote" in res.extracted_text
    assert len(res.segments) == 1
    assert res.segments[0].timestamp_seconds == 0.0
