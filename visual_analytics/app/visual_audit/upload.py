"""Image upload validation, integrity checking, and safe metadata extraction."""

import io
import os
import re
from typing import Tuple, List, Optional
from PIL import Image, UnidentifiedImageError

from visual_analytics.app.config import settings
from visual_analytics.app.schemas.visual_audit_schema import ImageMetadata


class ImageValidationError(Exception):
    """Raised when an uploaded image fails security, format, or size constraints."""

    def __init__(self, message: str, code: str = "INVALID_IMAGE"):
        super().__init__(message)
        self.message = message
        self.code = code


def sanitize_filename(filename: str) -> str:
    """Sanitize filename to prevent directory traversal and injection attacks."""
    normalized = filename.replace("\\", "/")
    clean_name = os.path.basename(normalized)
    clean_name = re.sub(r"[^a-zA-Z0-9_\.\-]", "_", clean_name)
    return clean_name[:128] or "unnamed_image.png"


def detect_magic_mime(file_bytes: bytes) -> Optional[str]:
    """Inspect leading magic bytes to identify true file format without trusting headers."""
    if len(file_bytes) < 12:
        return None

    if file_bytes.startswith(b"\x89PNG\r\n\x1a\n"):
        return "image/png"
    if file_bytes.startswith(b"\xff\xd8\xff"):
        return "image/jpeg"
    if file_bytes.startswith(b"RIFF") and file_bytes[8:12] == b"WEBP":
        return "image/webp"

    return None


class ImageValidator:
    """Validates uploaded image byte buffers and files against security rules."""

    def __init__(
        self,
        max_size_bytes: int = settings.MAX_UPLOAD_SIZE_BYTES,
        allowed_types: Optional[List[str]] = None,
        min_dim: int = settings.MIN_IMAGE_DIMENSION_PX,
        max_dim: int = settings.MAX_IMAGE_DIMENSION_PX,
    ):
        self.max_size_bytes = max_size_bytes
        self.allowed_types = allowed_types or settings.ALLOWED_IMAGE_TYPES
        self.min_dim = min_dim
        self.max_dim = max_dim

    def validate_and_load(
        self,
        file_bytes: bytes,
        filename: str,
        declared_content_type: Optional[str] = None,
    ) -> Tuple[Image.Image, ImageMetadata]:
        """
        Perform strict multi-layer validation:
        1. File size check.
        2. Magic byte header verification.
        3. Extension checking.
        4. PIL decode and corruption verification.
        5. Dimension constraints.
        Returns the opened PIL Image and typed ImageMetadata.
        """
        # 1. Size check
        size = len(file_bytes)
        if size == 0:
            raise ImageValidationError("Uploaded image is empty (0 bytes).", code="EMPTY_FILE")

        if size > self.max_size_bytes:
            raise ImageValidationError(
                f"File size of {size} bytes exceeds maximum allowed limit of {self.max_size_bytes} bytes "
                f"({self.max_size_bytes / (1024 * 1024):.1f} MB).",
                code="OVERSIZED_FILE",
            )

        # 2. Magic byte inspection
        detected_mime = detect_magic_mime(file_bytes)
        if not detected_mime or detected_mime not in self.allowed_types:
            raise ImageValidationError(
                f"Unsupported or unrecognized file format. Detected MIME: '{detected_mime}'. "
                f"Supported formats: PNG, JPG, JPEG, WEBP.",
                code="UNSUPPORTED_FORMAT",
            )

        # 3. Filename extension validation
        clean_name = sanitize_filename(filename)
        _, ext = os.path.splitext(clean_name.lower())
        if ext not in settings.ALLOWED_EXTENSIONS:
            raise ImageValidationError(
                f"File extension '{ext}' is not permitted. Allowed: {', '.join(settings.ALLOWED_EXTENSIONS)}",
                code="INVALID_EXTENSION",
            )

        # 4. Image decode and corruption check
        try:
            image_stream = io.BytesIO(file_bytes)
            img = Image.open(image_stream)
            # Verify image structure
            img.verify()

            # Reopen stream because verify() closes/advances pointer
            image_stream.seek(0)
            img = Image.open(image_stream)
            # Force load image data to catch incomplete or corrupted frames
            img.load()
        except (UnidentifiedImageError, OSError, SyntaxError) as e:
            raise ImageValidationError(
                f"Image file is corrupted, truncated, or unreadable: {str(e)}",
                code="CORRUPTED_IMAGE",
            )

        # 5. Dimension check
        width, height = img.size
        if width < self.min_dim or height < self.min_dim:
            raise ImageValidationError(
                f"Image resolution {width}x{height} is too small. Minimum required: {self.min_dim}x{self.min_dim}px.",
                code="RESOLUTION_TOO_SMALL",
            )

        if width > self.max_dim or height > self.max_dim:
            raise ImageValidationError(
                f"Image resolution {width}x{height} exceeds maximum allowable {self.max_dim}x{self.max_dim}px.",
                code="RESOLUTION_TOO_LARGE",
            )

        # Ensure image is in RGB or RGBA mode for downstream color analysis
        if img.mode not in ("RGB", "RGBA"):
            img = img.convert("RGB")

        aspect_ratio = round(width / float(height), 2) if height > 0 else 1.0

        metadata = ImageMetadata(
            filename=clean_name,
            width=width,
            height=height,
            format=img.format or detected_mime.split("/")[-1].upper(),
            file_size_bytes=size,
            aspect_ratio=aspect_ratio,
        )

        return img, metadata
