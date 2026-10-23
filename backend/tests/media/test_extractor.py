import os
import tempfile
import pytest
from app.services.media_audit.extractor import MediaExtractor, MediaExtractionError
from app.services.media_audit.interfaces import MediaProcessingStatus


def test_filename_sanitization():
    unsafe_name = "../../etc/passwd/malicious$$file.txt"
    sanitized = MediaExtractor.sanitize_filename(unsafe_name)
    assert ".." not in sanitized
    assert "/" not in sanitized
    assert "\\" not in sanitized
    assert sanitized.endswith(".txt")


def test_file_size_limit_rejection():
    with pytest.raises(MediaExtractionError) as exc_info:
        MediaExtractor.validate_file(
            filename="large_asset.mp4",
            file_size_bytes=100 * 1024 * 1024,  # 100MB exceeds default 25MB limit
            media_type="video/mp4",
        )
    assert "exceeds maximum limit" in str(exc_info.value)


def test_text_file_extraction():
    content = "Inkloom AI brand guidelines\nRule 1: Always be honest\nRule 2: Respect typography"
    with tempfile.NamedTemporaryFile("w", suffix=".txt", delete=False, encoding="utf-8") as f:
        f.write(content)
        temp_path = f.name

    try:
        extracted = MediaExtractor.extract_from_file(
            file_path=temp_path,
            media_type="text/plain",
            original_filename="brand_guide.txt",
        )
        assert extracted.processing_status == MediaProcessingStatus.SUCCESS
        assert "Inkloom AI brand guidelines" in extracted.extracted_text
        assert len(extracted.segments) == 3
    finally:
        if os.path.exists(temp_path):
            os.remove(temp_path)
