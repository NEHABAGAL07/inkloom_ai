"""Inkloom AI - Media File Validation and Security Module.

Enforces strict file format whitelisting, magic-byte inspection (signature verification),
spoofing detection, size limits, and safe filename sanitization to prevent path traversal
and injection attacks.
"""

import os
import re
import tempfile
import shutil
from typing import List, Tuple, Optional, Dict
from app.core.config import settings


class FileValidationError(ValueError):
    """Raised when an uploaded file violates safety or format constraints."""
    pass


# Magic bytes signatures for supported MIME types
MAGIC_SIGNATURES: Dict[str, List[bytes]] = {
    "application/pdf": [b"%PDF-"],
    "image/png": [b"\x89PNG\r\n\x1a\n"],
    "image/jpeg": [b"\xff\xd8\xff"],
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [b"PK\x03\x04"],
}

EXTENSION_TO_MIME: Dict[str, str] = {
    ".txt": "text/plain",
    ".pdf": "application/pdf",
    ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".webp": "image/webp",
    ".mp4": "video/mp4",
    ".mov": "video/quicktime",
    ".webm": "video/webm",
}

# Configurable processing limits
MAX_FILE_SIZE_BYTES = settings.MAX_UPLOAD_SIZE_BYTES  # 25 MB default
MAX_DOCUMENT_PAGES = 100
MAX_IMAGE_DIMENSION = 8192  # 8192 x 8192 px max
MAX_EXTRACTED_TEXT_CHARS = 500_000
MAX_VIDEO_DURATION_SECONDS = 600.0  # 10 minutes max


def sanitize_filename(filename: str) -> str:
    """
    Sanitize filename to prevent directory traversal and injection attacks.
    Removes path elements, null bytes, backslashes, and restricts characters.
    """
    if not filename or not filename.strip():
        return "unnamed_asset"

    # Strip directory components (handles both POSIX and Windows separators)
    clean = os.path.basename(filename.replace("\\", "/"))
    # Remove null bytes and non-printable characters
    clean = re.sub(r"[\x00-\x1f\x7f-\x9f]", "", clean)
    # Strip dangerous shell characters
    clean = re.sub(r"[^a-zA-Z0-9_\.\-]", "_", clean)
    # Prevent leading dots (hidden files / relative traversal)
    clean = clean.lstrip(".")
    # Limit length
    clean = clean[:128]

    if not clean or not clean.strip("_."):
        return "unnamed_asset"

    return clean


class FileValidator:
    """Validates uploaded media files for type integrity and safety."""

    @classmethod
    def guess_mime_from_extension(cls, filename: str) -> str:
        """Derive standard MIME type from sanitized file extension."""
        ext = os.path.splitext(filename)[1].lower()
        return EXTENSION_TO_MIME.get(ext, "application/octet-stream")

    @classmethod
    def verify_magic_bytes(cls, file_path: str, expected_mime: str) -> Tuple[bool, Optional[str]]:
        """
        Inspect initial bytes of file against expected magic signatures.
        Detects extension spoofing (e.g. an EXE or image renamed to .pdf).
        """
        if not os.path.exists(file_path):
            return False, "File does not exist."

        file_size = os.path.getsize(file_path)
        if file_size == 0:
            return False, "File is completely empty (0 bytes)."

        try:
            with open(file_path, "rb") as f:
                header = f.read(64)
        except Exception as e:
            return False, f"Failed to read file header: {str(e)}"

        # 1. Plain text check: verify no binary null bytes in initial chunk
        if expected_mime == "text/plain":
            if b"\x00" in header:
                return False, "Spoofed text file: Binary data detected in text file."
            return True, None

        # 2. WebP signature check: starts with 'RIFF' and contains 'WEBP'
        if expected_mime == "image/webp":
            if len(header) >= 12 and header[:4] == b"RIFF" and header[8:12] == b"WEBP":
                return True, None
            return False, "Spoofed WebP image: Missing RIFF/WEBP signature."

        # 3. MP4 / QuickTime signature check: contains 'ftyp'
        if expected_mime in ("video/mp4", "video/quicktime"):
            if len(header) >= 8 and (b"ftyp" in header[:16] or b"moov" in header[:16]):
                return True, None
            return False, "Spoofed video file: Missing MP4/QuickTime ftyp signature."

        # 4. Standard magic byte lookup
        signatures = MAGIC_SIGNATURES.get(expected_mime)
        if signatures:
            matches = any(header.startswith(sig) for sig in signatures)
            if not matches:
                return False, f"File signature mismatch for MIME type '{expected_mime}'."
            return True, None

        # Format allowed without strict magic byte table
        return True, None

    @classmethod
    def validate(
        cls,
        file_path: str,
        filename: str,
        mime_type: Optional[str] = None,
        max_size_bytes: Optional[int] = None,
    ) -> Tuple[bool, str, List[str]]:
        """
        Full file validation pipeline: existence, size, MIME type, and magic bytes.
        Returns (is_valid, resolved_mime, errors).
        """
        errors: List[str] = []
        sanitized = sanitize_filename(filename)
        resolved_mime = mime_type or cls.guess_mime_from_extension(sanitized)
        effective_max_size = max_size_bytes if max_size_bytes is not None else settings.MAX_UPLOAD_SIZE_BYTES

        # 1. File existence
        if not os.path.exists(file_path):
            errors.append(f"File not found on disk: {sanitized}")
            return False, resolved_mime, errors

        # 2. File size bounds
        file_size = os.path.getsize(file_path)
        if file_size == 0:
            errors.append("Uploaded file is empty (0 bytes).")
            return False, resolved_mime, errors

        if file_size > effective_max_size:
            errors.append(
                f"File size ({file_size} bytes) exceeds configured maximum limit of {effective_max_size} bytes."
            )

        # 3. MIME Whitelist
        allowed_mimes = settings.ALLOWED_MEDIA_TYPES
        if resolved_mime not in allowed_mimes:
            errors.append(f"MIME type '{resolved_mime}' is not in allowed media types whitelist.")

        # 4. Magic bytes inspection
        is_sig_valid, sig_err = cls.verify_magic_bytes(file_path, resolved_mime)
        if not is_sig_valid and sig_err:
            errors.append(sig_err)

        is_valid = len(errors) == 0
        return is_valid, resolved_mime, errors


class SafeTempFile:
    """Context manager ensuring deterministic temporary file creation and cleanup."""

    def __init__(self, suffix: str = ".bin"):
        self.suffix = suffix
        self.path: Optional[str] = None

    def __enter__(self) -> str:
        with tempfile.NamedTemporaryFile(suffix=self.suffix, delete=False) as tf:
            self.path = tf.name
        return self.path

    def __exit__(self, exc_type, exc_val, exc_tb):
        if self.path and os.path.exists(self.path):
            try:
                os.remove(self.path)
            except OSError:
                pass
