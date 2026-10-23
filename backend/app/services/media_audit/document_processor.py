"""Document Processor for Plain Text, PDF, and DOCX Formats."""

import os
from typing import List, Optional
from app.services.media_audit.interfaces import (
    MediaProcessingResult,
    MediaProcessingStatus,
    TextSegment,
)


class DocumentProcessor:
    """Extracts text content and layout segmentation from document files."""

    def process_txt(self, file_path: str, filename: str) -> MediaProcessingResult:
        """Process plain text files."""
        warnings: List[str] = []
        errors: List[str] = []
        text = ""

        try:
            with open(file_path, "r", encoding="utf-8") as f:
                text = f.read()
        except UnicodeDecodeError:
            warnings.append("UTF-8 decoding failed, falling back to latin-1 encoding.")
            try:
                with open(file_path, "r", encoding="latin-1") as f:
                    text = f.read()
            except Exception as e:
                errors.append(f"Failed to read text file: {str(e)}")
                return MediaProcessingResult(
                    source_filename=filename,
                    media_type="text/plain",
                    status=MediaProcessingStatus.FAILED,
                    errors=errors,
                )

        lines = text.splitlines()
        segments: List[TextSegment] = []
        offset = 0
        for idx, line in enumerate(lines, start=1):
            if line.strip():
                segments.append(
                    TextSegment(
                        text=line,
                        page_number=1,
                        start_offset=offset,
                        end_offset=offset + len(line),
                    )
                )
            offset += len(line) + 1

        return MediaProcessingResult(
            source_filename=filename,
            media_type="text/plain",
            status=MediaProcessingStatus.SUCCESS,
            extracted_text=text,
            segments=segments,
            metadata={"character_count": len(text), "line_count": len(lines)},
            warnings=warnings,
        )

    def process_pdf(self, file_path: str, filename: str) -> MediaProcessingResult:
        """Process PDF documents using pypdf if available."""
        warnings: List[str] = []
        errors: List[str] = []
        segments: List[TextSegment] = []
        full_text_chunks: List[str] = []

        try:
            import pypdf
        except ImportError:
            warnings.append(
                "pypdf package is not installed. PDF text extraction is disabled until installed."
            )
            return MediaProcessingResult(
                source_filename=filename,
                media_type="application/pdf",
                status=MediaProcessingStatus.PARTIAL,
                warnings=warnings,
                metadata={"pages": 0, "extractor": "stub"},
            )

        try:
            reader = pypdf.PdfReader(file_path)
            num_pages = len(reader.pages)
            for page_idx, page in enumerate(reader.pages, start=1):
                page_text = page.extract_text() or ""
                if page_text:
                    full_text_chunks.append(page_text)
                    segments.append(
                        TextSegment(
                            text=page_text,
                            page_number=page_idx,
                        )
                    )

            extracted_text = "\n\n".join(full_text_chunks)
            return MediaProcessingResult(
                source_filename=filename,
                media_type="application/pdf",
                status=MediaProcessingStatus.SUCCESS if extracted_text else MediaProcessingStatus.PARTIAL,
                extracted_text=extracted_text,
                segments=segments,
                metadata={"pages": num_pages, "extractor": "pypdf"},
                warnings=warnings,
            )
        except Exception as e:
            errors.append(f"PDF extraction error: {str(e)}")
            return MediaProcessingResult(
                source_filename=filename,
                media_type="application/pdf",
                status=MediaProcessingStatus.FAILED,
                errors=errors,
            )

    def process_docx(self, file_path: str, filename: str) -> MediaProcessingResult:
        """Process DOCX documents using python-docx if available."""
        warnings: List[str] = []
        errors: List[str] = []
        segments: List[TextSegment] = []
        full_text_chunks: List[str] = []

        try:
            import docx
        except ImportError:
            warnings.append(
                "python-docx is not installed. DOCX text extraction is disabled until installed."
            )
            return MediaProcessingResult(
                source_filename=filename,
                media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
                status=MediaProcessingStatus.PARTIAL,
                warnings=warnings,
                metadata={"paragraphs": 0, "extractor": "stub"},
            )

        try:
            doc = docx.Document(file_path)
            for para_idx, para in enumerate(doc.paragraphs, start=1):
                para_text = para.text.strip()
                if para_text:
                    full_text_chunks.append(para_text)
                    segments.append(
                        TextSegment(
                            text=para_text,
                            page_number=1,
                        )
                    )

            extracted_text = "\n".join(full_text_chunks)
            return MediaProcessingResult(
                source_filename=filename,
                media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
                status=MediaProcessingStatus.SUCCESS if extracted_text else MediaProcessingStatus.PARTIAL,
                extracted_text=extracted_text,
                segments=segments,
                metadata={"paragraphs": len(doc.paragraphs), "extractor": "python-docx"},
                warnings=warnings,
            )
        except Exception as e:
            errors.append(f"DOCX extraction error: {str(e)}")
            return MediaProcessingResult(
                source_filename=filename,
                media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
                status=MediaProcessingStatus.FAILED,
                errors=errors,
            )
