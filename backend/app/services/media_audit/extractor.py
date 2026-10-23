"""High-Level Media Extractor and Safe File Dispatcher."""

import os
from typing import Optional, List
from app.services.media_audit.interfaces import (
    MediaProcessingResult,
    MediaProcessingStatus,
)
from app.services.media_audit.file_validation import (
    FileValidator,
    sanitize_filename,
    MAX_FILE_SIZE_BYTES,
)
from app.services.media_audit.document_processor import DocumentProcessor
from app.services.media_audit.image_processor import ImageProcessor
from app.services.media_audit.video_processor import VideoProcessor


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

    def validate_file_constraints(self, file_path: str, mime_type: str, filename: str = "file") -> List[str]:
        """Validate file size, allowed MIME types, and magic byte signatures."""
        _, _, errors = FileValidator.validate(
            file_path=file_path,
            filename=filename,
            mime_type=mime_type,
        )
        return errors

    def extract(
        self,
        file_path: str,
        filename: str,
        mime_type: Optional[str] = None,
        transcript_text: Optional[str] = None,
    ) -> MediaProcessingResult:
        """
        Validate and extract text, layout segmentation, and visual metrics from media.
        """
        sanitized = sanitize_filename(filename)
        guessed_mime = mime_type or FileValidator.guess_mime_from_extension(sanitized)

        # Validate existence, size, MIME whitelist, and magic bytes
        is_valid, resolved_mime, validation_errors = FileValidator.validate(
            file_path=file_path,
            filename=sanitized,
            mime_type=guessed_mime,
        )

        if not is_valid:
            return MediaProcessingResult(
                source_filename=sanitized,
                media_type=resolved_mime,
                status=MediaProcessingStatus.FAILED,
                errors=validation_errors,
            )

        # Dispatch based on MIME type
        if resolved_mime == "text/plain":
            return self.doc_processor.process_txt(file_path, sanitized)
        elif resolved_mime == "application/pdf":
            return self.doc_processor.process_pdf(file_path, sanitized)
        elif resolved_mime == "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
            return self.doc_processor.process_docx(file_path, sanitized)
        elif resolved_mime in ("image/png", "image/jpeg", "image/webp"):
            return self.image_processor.process_image(file_path, sanitized, resolved_mime)
        elif resolved_mime in ("video/mp4", "video/quicktime", "video/webm"):
            return self.video_processor.process_video(file_path, sanitized, transcript_text=transcript_text)
        else:
            return MediaProcessingResult(
                source_filename=sanitized,
                media_type=resolved_mime,
                status=MediaProcessingStatus.UNSUPPORTED,
                errors=[f"Unsupported media MIME type: {resolved_mime}"],
            )
