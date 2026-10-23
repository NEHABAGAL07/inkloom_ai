"""
Document Processing Module

Extracts plain text and page-indexed segments from TXT, PDF, and DOCX documents.
Isolates optional external libraries so missing dependencies never crash the core API.
"""
import os
from typing import List, Tuple
from app.services.media_audit.interfaces import (
    MediaSegment,
    ProcessingWarning,
    MediaProcessingStatus,
)


class DocumentProcessor:
    @staticmethod
    def process_txt(file_path: str) -> Tuple[str, List[MediaSegment], List[ProcessingWarning]]:
        warnings: List[ProcessingWarning] = []
        segments: List[MediaSegment] = []

        encodings = ["utf-8", "latin-1", "cp1252"]
        content = ""
        success = False

        for enc in encodings:
            try:
                with open(file_path, "r", encoding=enc) as f:
                    content = f.read()
                success = True
                break
            except UnicodeDecodeError:
                continue

        if not success:
            with open(file_path, "rb") as f:
                content = f.read().decode("utf-8", errors="replace")
            warnings.append(
                ProcessingWarning(
                    code="ENCODING_FALLBACK",
                    message="File contained non-standard characters; replaced invalid bytes.",
                )
            )

        # Break into line-based segments
        lines = content.splitlines()
        for idx, line in enumerate(lines, start=1):
            stripped = line.strip()
            if stripped:
                segments.append(
                    MediaSegment(
                        segment_id=f"seg_line_{idx}",
                        text=stripped,
                        page_number=1,
                    )
                )

        return content, segments, warnings

    @staticmethod
    def process_pdf(file_path: str) -> Tuple[str, List[MediaSegment], List[ProcessingWarning]]:
        warnings: List[ProcessingWarning] = []
        segments: List[MediaSegment] = []
        full_text_parts: List[str] = []

        try:
            import pypdf
            reader = pypdf.PdfReader(file_path)
            for page_idx, page in enumerate(reader.pages, start=1):
                page_text = page.extract_text() or ""
                if page_text.strip():
                    full_text_parts.append(page_text)
                    segments.append(
                        MediaSegment(
                            segment_id=f"seg_page_{page_idx}",
                            text=page_text.strip(),
                            page_number=page_idx,
                        )
                    )
        except ImportError:
            warnings.append(
                ProcessingWarning(
                    code="PDF_PARSER_MISSING",
                    message="Optional dependency 'pypdf' is not installed. PDF text extraction used minimal header fallback.",
                    severity="warning",
                )
            )
            full_text_parts.append("[PDF extraction unavailable - install 'pypdf' package]")
        except Exception as e:
            warnings.append(
                ProcessingWarning(
                    code="PDF_READ_ERROR",
                    message=f"Failed to parse PDF document: {str(e)}",
                    severity="error",
                )
            )

        return "\n\n".join(full_text_parts), segments, warnings

    @staticmethod
    def process_docx(file_path: str) -> Tuple[str, List[MediaSegment], List[ProcessingWarning]]:
        warnings: List[ProcessingWarning] = []
        segments: List[MediaSegment] = []
        full_text_parts: List[str] = []

        try:
            import docx
            doc = docx.Document(file_path)
            for p_idx, para in enumerate(doc.paragraphs, start=1):
                text = para.text.strip()
                if text:
                    full_text_parts.append(text)
                    segments.append(
                        MediaSegment(
                            segment_id=f"seg_para_{p_idx}",
                            text=text,
                            page_number=1,
                        )
                    )
        except ImportError:
            warnings.append(
                ProcessingWarning(
                    code="DOCX_PARSER_MISSING",
                    message="Optional dependency 'python-docx' is not installed.",
                    severity="warning",
                )
            )
            full_text_parts.append("[DOCX extraction unavailable - install 'python-docx' package]")
        except Exception as e:
            warnings.append(
                ProcessingWarning(
                    code="DOCX_READ_ERROR",
                    message=f"Failed to parse DOCX document: {str(e)}",
                    severity="error",
                )
            )

        return "\n\n".join(full_text_parts), segments, warnings
