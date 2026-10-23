"""Inkloom AI - File Validation & Security Unit Tests."""

import os
import tempfile
import pytest
from app.services.media_audit.file_validation import (
    FileValidator,
    sanitize_filename,
    SafeTempFile,
    MAX_FILE_SIZE_BYTES,
)
from app.core.config import settings


def test_sanitize_filename_security():
    """Verify path traversal, directory components, and injection payloads are neutralized."""
    # Directory traversal
    assert sanitize_filename("../../../etc/shadow") == "shadow"
    assert sanitize_filename("..\\..\\windows\\system32\\cmd.exe") == "cmd.exe"
    assert sanitize_filename("./subdir/document.pdf") == "document.pdf"

    # Shell injection and dangerous characters
    assert sanitize_filename("exploit;rm -rf ;test.png") == "exploit_rm_-rf__test.png"
    assert sanitize_filename("exploit;rm -rf /;test.png") == "_test.png"
    assert sanitize_filename("file`whoami`.docx") == "file_whoami_.docx"
    assert sanitize_filename("dangerous<script>alert(1).png") == "dangerous_script_alert_1_.png"

    # Hidden files and leading dots
    assert sanitize_filename(".hidden_config.txt") == "hidden_config.txt"
    assert sanitize_filename("..leading_dots.pdf") == "leading_dots.pdf"

    # Empty and whitespace
    assert sanitize_filename("") == "unnamed_asset"
    assert sanitize_filename("   ") == "unnamed_asset"


def test_supported_file_types_validation():
    """Verify valid files with legitimate magic byte signatures pass validation."""
    with SafeTempFile(suffix=".txt") as tf_path:
        with open(tf_path, "wb") as f:
            f.write(b"Safe text content for marketing review.")

        is_valid, mime, errors = FileValidator.validate(tf_path, "campaign.txt")
        assert is_valid is True
        assert mime == "text/plain"
        assert len(errors) == 0


def test_extension_spoofing_detection_pdf():
    """Detect executable binary renamed with a .pdf extension."""
    with SafeTempFile(suffix=".pdf") as tf_path:
        with open(tf_path, "wb") as f:
            # Windows MZ executable header spoofed as PDF
            f.write(b"MZ\x90\x00\x03\x00\x00\x00\x04\x00\x00\x00\xff\xff\x00\x00")

        is_valid, mime, errors = FileValidator.validate(tf_path, "malicious.pdf")
        assert is_valid is False
        assert any("signature mismatch" in err.lower() for err in errors)


def test_extension_spoofing_detection_png():
    """Detect non-image binary disguised as a .png."""
    with SafeTempFile(suffix=".png") as tf_path:
        with open(tf_path, "wb") as f:
            f.write(b"NOT_A_PNG_HEADER_JUST_RANDOM_TEXT")

        is_valid, mime, errors = FileValidator.validate(tf_path, "fake.png")
        assert is_valid is False
        assert any("signature mismatch" in err.lower() for err in errors)


def test_binary_in_text_file_detection():
    """Detect binary payload disguised as a plain .txt file."""
    with SafeTempFile(suffix=".txt") as tf_path:
        with open(tf_path, "wb") as f:
            f.write(b"Text with hidden binary\x00\x01\x02shellcode")

        is_valid, mime, errors = FileValidator.validate(tf_path, "payload.txt")
        assert is_valid is False
        assert any("binary data detected in text file" in err.lower() for err in errors)


def test_empty_file_rejection():
    """Verify zero-byte files are rejected."""
    with SafeTempFile(suffix=".txt") as tf_path:
        # File is 0 bytes
        is_valid, mime, errors = FileValidator.validate(tf_path, "empty.txt")
        assert is_valid is False
        assert any("empty" in err.lower() for err in errors)


def test_nonexistent_file_handling():
    """Verify nonexistent paths are handled gracefully."""
    is_valid, mime, errors = FileValidator.validate("nonexistent_path_xyz123.pdf", "ghost.pdf")
    assert is_valid is False
    assert any("not found" in err.lower() for err in errors)


def test_unsupported_mime_whitelist():
    """Verify formats not in ALLOWED_MEDIA_TYPES are rejected."""
    with SafeTempFile(suffix=".sh") as tf_path:
        with open(tf_path, "wb") as f:
            f.write(b"#!/bin/bash\necho hello\n")

        is_valid, mime, errors = FileValidator.validate(tf_path, "script.sh")
        assert is_valid is False
        assert any("not in allowed media types" in err.lower() for err in errors)


def test_oversized_file_rejection():
    """Verify files exceeding size limits are rejected."""
    with SafeTempFile(suffix=".txt") as tf_path:
        with open(tf_path, "wb") as f:
            f.write(b"A" * 2048)

        is_valid, mime, errors = FileValidator.validate(
            tf_path, "oversized.txt", max_size_bytes=1024
        )
        assert is_valid is False
        assert any("exceeds configured maximum limit" in err for err in errors)


def test_safe_temp_file_cleanup_on_exception():
    """Verify SafeTempFile deletes disk artifact even if an exception occurs."""
    captured_path = None
    try:
        with SafeTempFile(suffix=".txt") as tf:
            captured_path = tf
            assert os.path.exists(captured_path)
            raise RuntimeError("Simulated processing crash")
    except RuntimeError:
        pass

    assert captured_path is not None
    assert not os.path.exists(captured_path)
