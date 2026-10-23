"""
Central Media Content Extractor and File Validation Dispatcher

Validates file uploads, enforces size and MIME boundaries, defends against
path traversal attacks, manages temporary workspace directories safely,
and delegates to format-specific extractors.
"""
import os
import re
import tempfile
import shutil
from typing import Optional
from app.core.config import settings
from app.services.media_audit.interfaces import (
    ExtractedContent,
    MediaProcessingStatus,
    ProcessingWarning,
)
from app.services.media_audit.document_processor import DocumentProcessor
from app.services.media_audit.image_processor import ImageProcessor
from app.services.media_audit.video_processor import VideoProcessor


class MediaExtractionError(Exception):
    pass


class MediaExtractor:
    @staticmethod
    def sanitize_filename(filename: str) -> str:
        """Removes dangerous characters, path traversal segments (../), and preserves extension."""
        basename = os.path.basename(filename)
        sanitized = re.sub(r"[^a-zA-Z0-9_\-\.]", "_", basename)
        return sanitized or "unnamed_upload"

    @classmethod
    def validate_file(cls, filename: str, file_size_bytes: int, media_type: str) -> None:
        """Validates file upload limits and permitted media types."""
        max_bytes = settings.MAX_UPLOAD_SIZE_MB * 1024 * 1024
        if file_size_bytes > max_bytes:
            raise MediaExtractionError(
                f"File size {file_size_bytes / (1024*1024):.1f}MB exceeds maximum limit of {settings.MAX_UPLOAD_SIZE_MB}MB."
            )

        if media_type not in settings.ALLOWED_MEDIA_TYPES and not media_type.startswith("text/"):
            raise MediaExtractionError(
                f"Media type '{media_type}' is not supported. Allowed formats: {settings.ALLOWED_MEDIA_TYPES}"
            )

    @classmethod
    def extract_from_file(
        cls,
        file_path: str,
        media_type: str,
        original_filename: Optional[str] = None
    ) -> ExtractedContent:
        """
        Extracts content from a local file path with safety bounds.
        """
        if not os.path.exists(file_path):
            raise MediaExtractionError(f"Target file does not exist: {file_path}")

        file_size = os.path.getsize(file_path)
        safe_name = cls.sanitize_filename(original_filename or os.path.basename(file_path))
        cls.validate_file(filename=safe_name, file_size_bytes=file_size, media_type=media_type)

        extracted_text = ""
        segments = []
        warnings = []
        metadata = {"file_size_bytes": file_size}
        status = MediaProcessingStatus.SUCCESS

        try:
            if media_type == "text/plain" or safe_name.endswith(".txt"):
                extracted_text, segments, warnings = DocumentProcessor.process_txt(file_path)

            elif media_type == "application/pdf" or safe_name.endswith(".pdf"):
                extracted_text, segments, warnings = DocumentProcessor.process_pdf(file_path)

            elif (
                media_type == "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                or safe_name.endswith(".docx")
            ):
                extracted_text, segments, warnings = DocumentProcessor.process_docx(file_path)

            elif media_type.startswith("image/"):
                img_text, img_meta, segments, warnings = ImageProcessor.extract_image_data(file_path)
                metadata.update(img_meta)
                extracted_text = img_text

            elif media_type.startswith("video/"):
                vid_text, vid_meta, segments, warnings = VideoProcessor.process_video(file_path)
                metadata.update(vid_meta)
                extracted_text = vid_text

            else:
                extracted_text, segments, warnings = DocumentProcessor.process_txt(file_path)

        except Exception as e:
            status = MediaProcessingStatus.FAILED
            warnings.append(
                ProcessingWarning(
                    code="EXTRACTION_FAILURE",
                    message=f"Critical error extracting content: {str(e)}",
                    severity="error",
                )
            )

        return ExtractedContent(
            source_filename=safe_name,
            media_type=media_type,
            file_size_bytes=file_size,
            processing_status=status,
            extracted_text=extracted_text,
            segments=segments,
            media_metadata=metadata,
            warnings=warnings,
        )
