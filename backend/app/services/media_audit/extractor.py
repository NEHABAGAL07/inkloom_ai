"""High-Level Media Extractor and Safe File Dispatcher."""

import os
import re
import tempfile
import shutil
from typing import Optional, List
from app.core.config import settings
from app.services.media_audit.interfaces import (
    MediaProcessingResult,
    MediaProcessingStatus,
)
from app.services.media_audit.document_processor import DocumentProcessor
from app.services.media_audit.image_processor import ImageProcessor
from app.services.media_audit.video_processor import VideoProcessor


def sanitize_filename(filename: str) -> str:
    """Sanitize filename to prevent directory traversal and injection attacks."""
    # Normalize backslashes to forward slashes so Windows paths are handled on Unix
    normalized = filename.replace("\\", "/")
    # Remove path elements
    clean_name = os.path.basename(normalized)
    # Strip dangerous characters
    clean_name = re.sub(r"[^a-zA-Z0-9_\.\-]", "_", clean_name)
    # Limit max length
    return clean_name[:128] or "unnamed_file"


class MediaExtractor:
    """Unified entry point for media validation, extraction, and safe cleanup."""

    def __init__(
        self,
        doc_processor: Optional[DocumentProcessor] = None,
        image_processor: Optional[ImageProcessor] = None,
        video_processor: Optional[VideoProcessor] = None,
    ):
        self.doc_processor = doc_processor or DocumentProcessor()
        self.image_processor = image_processor or ImageProcessor()
        self.video_processor = video_processor or VideoProcessor()

    def validate_file_constraints(self, file_path: str, mime_type: str) -> List[str]:
        """Validate file size and allowed MIME types."""
        errors: List[str] = []
        if not os.path.exists(file_path):
            errors.append("File does not exist.")
            return errors

        file_size = os.path.getsize(file_path)
        if file_size > settings.MAX_UPLOAD_SIZE_BYTES:
            errors.append(
                f"File size ({file_size} bytes) exceeds configured maximum limit of "
                f"{settings.MAX_UPLOAD_SIZE_BYTES} bytes."
            )

        if mime_type not in settings.ALLOWED_MEDIA_TYPES:
            errors.append(f"Media type '{mime_type}' is not currently allowed.")

        return errors

    def extract(
        self,
        file_path: str,
        filename: str,
        mime_type: Optional[str] = None,
    ) -> MediaProcessingResult:
        """Extract text and metadata from file using appropriate processor."""
        sanitized = sanitize_filename(filename)
        guessed_mime = mime_type or self._guess_mime_type(sanitized)

        # Validate
        validation_errors = self.validate_file_constraints(file_path, guessed_mime)
        if validation_errors:
            return MediaProcessingResult(
                source_filename=sanitized,
                media_type=guessed_mime,
                status=MediaProcessingStatus.FAILED,
                errors=validation_errors,
            )

        # Dispatch based on MIME type
        if guessed_mime == "text/plain":
            return self.doc_processor.process_txt(file_path, sanitized)
        elif guessed_mime == "application/pdf":
            return self.doc_processor.process_pdf(file_path, sanitized)
        elif guessed_mime == "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
            return self.doc_processor.process_docx(file_path, sanitized)
        elif guessed_mime in ("image/png", "image/jpeg", "image/webp"):
            return self.image_processor.process_image(file_path, sanitized, guessed_mime)
        elif guessed_mime in ("video/mp4", "video/quicktime"):
            return self.video_processor.process_video(file_path, sanitized)
        else:
            return MediaProcessingResult(
                source_filename=sanitized,
                media_type=guessed_mime,
                status=MediaProcessingStatus.UNSUPPORTED,
                errors=[f"Unsupported media MIME type: {guessed_mime}"],
            )

    @staticmethod
    def _guess_mime_type(filename: str) -> str:
        """Determine MIME type from file extension."""
        ext = os.path.splitext(filename)[1].lower()
        mapping = {
            ".txt": "text/plain",
            ".pdf": "application/pdf",
            ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            ".png": "image/png",
            ".jpg": "image/jpeg",
            ".jpeg": "image/jpeg",
            ".mp4": "video/mp4",
        }
        return mapping.get(ext, "application/octet-stream")
