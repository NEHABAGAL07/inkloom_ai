"""Inkloom AI - Document Processor for Plain Text, PDF, and DOCX Formats.

Extracts text content and layout segmentation (page numbers, paragraph indices).
Detects scanned PDFs with no selectable text, enforces page/character bounds,
and handles encrypted or malformed documents gracefully.
"""

import os
from typing import List, Optional
from app.services.media_audit.interfaces import (
    MediaProcessingResult,
    MediaProcessingStatus,
    TextSegment,
)
from app.services.media_audit.file_validation import (
    MAX_DOCUMENT_PAGES,
    MAX_EXTRACTED_TEXT_CHARS,
)


class DocumentProcessor:
    """Extracts text content and layout segmentation from document files."""

    def process_txt(self, file_path: str, filename: str) -> MediaProcessingResult:
        """Process plain text files with multi-encoding fallback."""
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

        # Enforce character bound
        if len(text) > MAX_EXTRACTED_TEXT_CHARS:
            warnings.append(
                f"Text truncated from {len(text)} to {MAX_EXTRACTED_TEXT_CHARS} characters."
            )
            text = text[:MAX_EXTRACTED_TEXT_CHARS]

        lines = text.splitlines()
        segments: List[TextSegment] = []
        offset = 0
        for line in lines:
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
            status=MediaProcessingStatus.SUCCESS if text.strip() else MediaProcessingStatus.PARTIAL,
            extracted_text=text,
            segments=segments,
            metadata={"character_count": len(text), "line_count": len(lines)},
            warnings=warnings,
        )

    def process_pdf(self, file_path: str, filename: str) -> MediaProcessingResult:
        """Process PDF documents, detecting scanned pages and layout locations."""
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
            
            # Handle encrypted PDF
            if reader.is_encrypted:
                try:
                    # Attempt empty password decrypt
                    reader.decrypt("")
                except Exception:
                    errors.append("PDF is password-encrypted and cannot be audited without credentials.")
                    return MediaProcessingResult(
                        source_filename=filename,
                        media_type="application/pdf",
                        status=MediaProcessingStatus.FAILED,
                        errors=errors,
                    )

            total_pages = len(reader.pages)
            pages_to_process = min(total_pages, MAX_DOCUMENT_PAGES)
            if total_pages > MAX_DOCUMENT_PAGES:
                warnings.append(
                    f"PDF page count ({total_pages}) exceeds limit of {MAX_DOCUMENT_PAGES}; "
                    f"only the first {MAX_DOCUMENT_PAGES} pages were processed."
                )

            current_char_count = 0
            empty_pages_count = 0

            for page_idx in range(1, pages_to_process + 1):
                page = reader.pages[page_idx - 1]
                page_text = (page.extract_text() or "").strip()

                if not page_text:
                    empty_pages_count += 1
                else:
                    full_text_chunks.append(page_text)
                    segments.append(
                        TextSegment(
                            text=page_text,
                            page_number=page_idx,
                        )
                    )
                    current_char_count += len(page_text)
                    if current_char_count >= MAX_EXTRACTED_TEXT_CHARS:
                        warnings.append("Reached maximum extracted text size limit; remaining pages truncated.")
                        break

            extracted_text = "\n\n".join(full_text_chunks)
            is_scanned_pdf = bool(total_pages > 0 and len(extracted_text.strip()) < 40)

            if is_scanned_pdf:
                warnings.append(
                    "Scanned document detected: PDF contains little or no selectable text. "
                    "OCR is required to extract and audit text embedded in images on these pages."
                )

            status = MediaProcessingStatus.SUCCESS
            if not extracted_text:
                status = MediaProcessingStatus.PARTIAL

            return MediaProcessingResult(
                source_filename=filename,
                media_type="application/pdf",
                status=status,
                extracted_text=extracted_text,
                segments=segments,
                metadata={
                    "pages": total_pages,
                    "pages_processed": pages_to_process,
                    "empty_pages": empty_pages_count,
                    "is_scanned_pdf": is_scanned_pdf,
                    "extractor": "pypdf",
                },
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
        """Process DOCX documents, extracting paragraphs, headings, and table cells."""
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
            char_count = 0

            # 1. Extract paragraphs
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
                    char_count += len(para_text)
                    if char_count >= MAX_EXTRACTED_TEXT_CHARS:
                        warnings.append("Reached maximum extracted text size limit.")
                        break

            # 2. Extract tables
            table_count = len(doc.tables)
            for table_idx, table in enumerate(doc.tables, start=1):
                if char_count >= MAX_EXTRACTED_TEXT_CHARS:
                    break
                for row in table.rows:
                    row_texts = [cell.text.strip() for cell in row.cells if cell.text.strip()]
                    if row_texts:
                        row_line = " | ".join(row_texts)
                        full_text_chunks.append(row_line)
                        segments.append(TextSegment(text=row_line, page_number=1))
                        char_count += len(row_line)

            extracted_text = "\n".join(full_text_chunks)
            status = MediaProcessingStatus.SUCCESS if extracted_text else MediaProcessingStatus.PARTIAL

            return MediaProcessingResult(
                source_filename=filename,
                media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
                status=status,
                extracted_text=extracted_text,
                segments=segments,
                metadata={
                    "paragraphs": len(doc.paragraphs),
                    "tables": table_count,
                    "extractor": "python-docx",
                },
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
