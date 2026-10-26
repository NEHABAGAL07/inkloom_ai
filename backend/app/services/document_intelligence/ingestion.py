"""
Document Ingestion & Chunking Service
Processes PDF, DOCX, and TXT brand guideline manuals into page-aware text chunks.
Runs safely in background with comprehensive error handling and OCR detection.
"""
import os
import re
from typing import List, Tuple, Dict, Any, Optional
from sqlalchemy.orm import Session

from app.models.document import KnowledgeDocument, DocumentChunk
from app.services.media_audit.extractor import MediaExtractor, MediaExtractionError


class DocumentIngestionService:
    @staticmethod
    def chunk_page_text(
        text: str,
        page_number: int,
        target_chunk_size: int = 400,
        chunk_overlap: int = 50,
    ) -> List[Dict[str, Any]]:
        """
        Splits page text into ~300-500 word chunks with ~50 word overlap.
        Preserves exact page numbering and cleans whitespace.
        """
        cleaned_text = re.sub(r"\s+", " ", text).strip()
        if not cleaned_text:
            return []

        words = cleaned_text.split()
        if len(words) <= target_chunk_size:
            return [
                {
                    "page_number": page_number,
                    "chunk_index": 0,
                    "text": cleaned_text,
                    "token_count": len(words),
                }
            ]

        chunks = []
        step = max(target_chunk_size - chunk_overlap, 100)
        idx = 0
        for start in range(0, len(words), step):
            chunk_words = words[start : start + target_chunk_size]
            chunk_str = " ".join(chunk_words)
            chunks.append(
                {
                    "page_number": page_number,
                    "chunk_index": idx,
                    "text": chunk_str,
                    "token_count": len(chunk_words),
                }
            )
            idx += 1
            if start + target_chunk_size >= len(words):
                break

        return chunks

    @classmethod
    def extract_document_pages(cls, file_path: str, mime_type: str) -> Tuple[List[Tuple[int, str]], bool]:
        """
        Extracts text from PDF, DOCX, or TXT preserving 1-indexed page numbers.
        Returns: (pages_list [(page_num, text)], has_ocr_warning)
        """
        pages: List[Tuple[int, str]] = []
        has_ocr_warning = False

        if "pdf" in mime_type.lower() or file_path.lower().endswith(".pdf"):
            try:
                import pypdf
                reader = pypdf.PdfReader(file_path)
                total_chars = 0
                for idx, page in enumerate(reader.pages, start=1):
                    page_text = page.extract_text() or ""
                    pages.append((idx, page_text.strip()))
                    total_chars += len(page_text.strip())

                # If PDF has pages but virtually no text, it is likely scanned or image-based
                if len(pages) > 0 and total_chars < 20:
                    has_ocr_warning = True
            except Exception as e:
                raise MediaExtractionError(f"Failed to extract PDF text: {str(e)}")

        elif "word" in mime_type.lower() or file_path.lower().endswith(".docx"):
            try:
                import docx
                doc = docx.Document(file_path)
                paragraphs = [p.text.strip() for p in doc.paragraphs if p.text.strip()]
                full_text = "\n\n".join(paragraphs)
                # Word docs do not have native fixed page demarcations; treat as page 1
                pages.append((1, full_text))
            except Exception as e:
                raise MediaExtractionError(f"Failed to extract DOCX text: {str(e)}")

        else:
            # Plain text document
            encodings = ["utf-8", "latin-1", "cp1252"]
            content = None
            for enc in encodings:
                try:
                    with open(file_path, "r", encoding=enc) as f:
                        content = f.read()
                    break
                except UnicodeDecodeError:
                    continue

            if content is None:
                with open(file_path, "rb") as f:
                    content = f.read().decode("utf-8", errors="replace")

            pages.append((1, content.strip()))

        return pages, has_ocr_warning

    @classmethod
    def ingest_file_sync(
        cls,
        db: Session,
        document_id: str,
        file_path: str,
    ) -> KnowledgeDocument:
        """
        Synchronously parses document, generates chunks, and updates database state.
        Safe for use inside background workers or synchronous pipelines.
        """
        doc = db.query(KnowledgeDocument).filter(KnowledgeDocument.id == document_id).first()
        if not doc:
            raise ValueError(f"KnowledgeDocument {document_id} not found in database.")

        try:
            pages, has_ocr_warning = cls.extract_document_pages(file_path, doc.mime_type)

            all_chunks: List[Dict[str, Any]] = []
            for page_num, page_text in pages:
                if page_text:
                    page_chunks = cls.chunk_page_text(page_text, page_number=page_num)
                    all_chunks.extend(page_chunks)

            # Store generated chunks
            for ch in all_chunks:
                chunk_rec = DocumentChunk(
                    document_id=doc.id,
                    organization_id=doc.organization_id,
                    page_number=ch["page_number"],
                    chunk_index=ch["chunk_index"],
                    text=ch["text"],
                    token_count=ch["token_count"],
                )
                db.add(chunk_rec)

            doc.status = "ready"
            doc.page_count = len(pages)
            doc.has_ocr_warning = has_ocr_warning
            if has_ocr_warning:
                doc.error_message = (
                    "Notice: Scanned or image-based document detected with minimal text. "
                    "Text extraction may be partial; OCR processing recommended."
                )
            db.commit()
            db.refresh(doc)
            return doc

        except Exception as exc:
            db.rollback()
            doc.status = "failed"
            doc.error_message = str(exc)
            db.commit()
            raise exc
        finally:
            # Clean up local temporary file if present
            if os.path.exists(file_path):
                try:
                    os.remove(file_path)
                except OSError:
                    pass


def process_document_in_background(document_id: str, file_path: str, session_factory):
    """Entry point for FastAPI BackgroundTasks."""
    db: Session = session_factory()
    try:
        DocumentIngestionService.ingest_file_sync(db, document_id, file_path)
    finally:
        db.close()
