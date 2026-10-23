"""Inkloom AI - Document Processor & Audit Unit Tests."""

import os
import io
import docx
import pypdf
import pytest
from app.services.media_audit.document_processor import DocumentProcessor
from app.services.media_audit.interfaces import MediaProcessingStatus
from app.services.media_audit.file_validation import SafeTempFile


def test_txt_utf8_extraction():
    """Verify TXT files extract paragraphs and offset locations cleanly."""
    processor = DocumentProcessor()
    text_content = (
        "Welcome to Inkloom AI.\n\n"
        "Our marketing governance platform audits all brand copy.\n\n"
        "Guaranteed 100% compliant with corporate guidelines."
    )

    with SafeTempFile(suffix=".txt") as tf_path:
        with open(tf_path, "w", encoding="utf-8") as f:
            f.write(text_content)

        res = processor.process_txt(tf_path, "welcome.txt")
        assert res.status == MediaProcessingStatus.SUCCESS
        assert "Welcome to Inkloom AI." in res.extracted_text
        assert len(res.segments) >= 3
        assert res.segments[0].page_number == 1
        assert res.segments[0].start_offset == 0
        assert res.metadata["character_count"] > 50


def test_txt_latin1_encoding_fallback():
    """Verify processor decodes Latin-1 encoded files without crashing."""
    processor = DocumentProcessor()
    latin1_bytes = "Café Inkloom au marché international.".encode("latin-1")

    with SafeTempFile(suffix=".txt") as tf_path:
        with open(tf_path, "wb") as f:
            f.write(latin1_bytes)

        res = processor.process_txt(tf_path, "cafe.txt")
        assert res.status == MediaProcessingStatus.SUCCESS
        assert "Café Inkloom" in res.extracted_text


def test_pdf_extraction_page_locations():
    """Verify PDF multi-page extraction preserves page numbers in segments."""
    processor = DocumentProcessor()

    # Create synthetic 2-page PDF with pypdf
    writer = pypdf.PdfWriter()
    p1 = writer.add_blank_page(width=612, height=792)
    p2 = writer.add_blank_page(width=612, height=792)

    with SafeTempFile(suffix=".pdf") as tf_path:
        with open(tf_path, "wb") as f:
            writer.write(f)

        res = processor.process_pdf(tf_path, "multipage.pdf")
        assert res.metadata["pages"] == 2
        assert res.metadata["is_scanned_pdf"] is True  # Blank pages have < 40 chars text
        assert any("Scanned document detected" in w for w in res.warnings)


def test_docx_structure_and_table_extraction():
    """Verify DOCX parser extracts headings, paragraphs, and table text."""
    processor = DocumentProcessor()

    doc = docx.Document()
    doc.add_heading("Inkloom Campaign Q3", level=1)
    doc.add_paragraph("This is the introductory campaign copy for digital ads.")

    table = doc.add_table(rows=2, cols=2)
    table.cell(0, 0).text = "Product Name"
    table.cell(0, 1).text = "Inkloom Core"
    table.cell(1, 0).text = "Claim"
    table.cell(1, 1).text = "100% error-free marketing guarantee"

    with SafeTempFile(suffix=".docx") as tf_path:
        doc.save(tf_path)

        res = processor.process_docx(tf_path, "campaign.docx")
        assert res.status == MediaProcessingStatus.SUCCESS
        assert "Inkloom Campaign Q3" in res.extracted_text
        assert "introductory campaign copy" in res.extracted_text
        assert "100% error-free marketing guarantee" in res.extracted_text

        # Verify segments include heading, paragraph, and table items
        assert len(res.segments) >= 3
        heading_segs = [s for s in res.segments if "Campaign Q3" in s.text]
        assert len(heading_segs) > 0


def test_corrupt_docx_handling():
    """Verify corrupt or unreadable DOCX files fail gracefully."""
    processor = DocumentProcessor()

    with SafeTempFile(suffix=".docx") as tf_path:
        with open(tf_path, "wb") as f:
            f.write(b"PK\x03\x04corrupted_zip_payload_not_real_docx")

        res = processor.process_docx(tf_path, "corrupt.docx")
        assert res.status == MediaProcessingStatus.FAILED
        assert len(res.errors) > 0
