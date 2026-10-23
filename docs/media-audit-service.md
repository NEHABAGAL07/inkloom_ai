# Inkloom AI — Media Audit Service Architecture & Reference

## 1. Overview & Service Architecture

The **Media Audit Service** provides robust, modular media preprocessing, deterministic visual brand verification, optical character recognition (OCR), and layout segmentation for the Inkloom AI brand governance platform.

Rather than replacing or duplicating the existing AI Audit Engine, the Media Audit Service acts as an intelligent ingestion and preprocessing layer. It validates files, inspects binary signatures, performs computer-vision and visual brand checks, extracts text segments with physical page numbers or video timestamps, and passes extracted text to the `AIAuditEngine`.

```mermaid
graph TD
    Upload([Uploaded File: PDF / DOCX / Image / Video]) --> Validator[FileValidator\nMagic Bytes, Extension Whitelist, Size Bounds]
    Validator -->|Safe Temp File| Dispatcher[MediaExtractor Dispatcher]

    subgraph Document Processing
        Dispatcher -->|PDF| DocParser[DocumentProcessor\npypdf page extraction, scanned PDF detection]
        Dispatcher -->|DOCX| DocxParser[DocumentProcessor\npython-docx paragraphs & tables]
        Dispatcher -->|TXT| TxtParser[DocumentProcessor\nUTF-8 / Latin-1 multi-encoding fallback]
    end

    subgraph Visual & Image Processing
        Dispatcher -->|PNG / JPEG / WebP| ImgProc[ImageProcessor\nPillow dimensions, color quantization]
        ImgProc --> VisRules[VisualBrandRulesEngine\nWCAG 2.1 Contrast (L1+0.05)/(L2+0.05)\nBrand Palette Euclidean Distance]
        ImgProc --> OCR[OCRExtractor\npytesseract / Tesseract engine adapter]
    end

    subgraph Video Processing
        Dispatcher -->|MP4 / MOV / WebM| VidProc[VideoProcessor\nPure-Python ISO-BMFF Atom Parser: moov/mvhd/tkhd\nTranscript Timestamp Spreading]
    end

    DocParser --> Segments[TextSegments & Visual Metrics\nPage numbers, timestamps, resolution, colors]
    DocxParser --> Segments
    TxtParser --> Segments
    ImgProc --> Segments
    VidProc --> Segments

    Segments --> Orchestrator[MediaAuditOrchestrator]
    Orchestrator -->|Extracted Text| AIEngine[AIAuditEngine\nDeterministic rules, tone, claims]
    AIEngine -->|Text Findings| LocationMapper[Location Mapper\nEnrich findings with page numbers & video timestamps]
    LocationMapper --> Merger[Finding Merger\nMerge text + visual + a11y findings]
    Merger --> Result([MediaAuditResult\nUnified AuditResultSchema + Safe Metadata])
```

---

## 2. Supported Formats & Capabilities

| Format | Extension | Engine / Parser | Implemented Capabilities | Limitations & Unsupported Features |
| :--- | :--- | :--- | :--- | :--- |
| **Plain Text** | `.txt` | Native Python | UTF-8 and Latin-1 decoding, paragraph segmentation, offset tracking. | Extracted text capped at 500,000 characters. |
| **PDF Documents** | `.pdf` | `pypdf` | Page-by-page text extraction, page limits, password-encryption detection, scanned PDF detection (<40 chars flagged as OCR required). | Scanned PDFs without OCR require OCR preprocessing; forms and digital signatures not executed. |
| **Word Documents** | `.docx` | `python-docx` | Headings, paragraph text, table cell extraction, and structure preservation. | Legacy `.doc` binary format not supported; embedded macros and scripts ignored for security. |
| **Images** | `.png`, `.jpg`, `.jpeg`, `.webp` | `Pillow (PIL)` | Dimension validation, aspect ratio, color quantization, dominant palette extraction, WCAG 2.1 contrast ratio, alt-text rules. | Logo shape detection is deterministic/bounding-box baseline; does not perform semantic visual segmentation without external GPU models. |
| **Video** | `.mp4`, `.mov`, `.webm` | Pure-Python Atom Parser + Optional FFmpeg | Duration, timescale, resolution extracted directly from container atoms without FFmpeg; transcript ingestion with timestamps. | Without FFmpeg installed, video audio is not transcribed live; spoken audio auditing requires transcript ingestion. |

---

## 3. Upload Limits & Configuration

All limits are configurable via environment variables (`backend/app/core/config.py` and `.env`):

| Configuration Variable | Default Value | Description |
| :--- | :--- | :--- |
| `MAX_UPLOAD_SIZE_BYTES` | `26214400` (25 MB) | Maximum upload payload size enforced on both streaming HTTP and file validation. |
| `MAX_DOCUMENT_PAGES` | `100` | Maximum pages processed per PDF document before truncation with warning. |
| `MAX_IMAGE_DIMENSION` | `8192` px | Maximum width or height for uploaded images (prevents pixel flood attacks). |
| `MAX_IMAGE_PIXELS` | `64,000,000` | Pillow decompression bomb protection threshold. |
| `MAX_EXTRACTED_TEXT_CHARS`| `500,000` | Maximum character limit for extracted document text. |
| `MAX_VIDEO_DURATION_SECONDS`| `600.0` (10 min) | Maximum video container duration allowed for processing. |
| `ENABLE_OCR` | `true` | Toggles whether OCR extraction is attempted when Tesseract is present. |
| `TESSERACT_CMD` | `tesseract` | System executable name or path for the Tesseract binary. |
| `FFMPEG_CMD` | `ffmpeg` | System executable name or path for FFmpeg. |

---

## 4. Deterministic vs. Optional External Checks

Inkloom AI guarantees high availability by running zero-external-dependency fallbacks whenever optional tools are not installed:

### 1. Deterministic Checks (Always Available)
- **File Validation & Magic Bytes**: Inspects raw binary headers (`%PDF-`, `\x89PNG`, `\xff\xd8\xff`, `RIFF...WEBP`, `PK\x03\x04`, `ftyp`).
- **Path Sanitization**: Neutralizes directory traversal (`../`, `..\`), shell metacharacters, and null bytes.
- **Document Text Extraction**: Native `pypdf`, `python-docx`, and Python decoding.
- **Pure-Python MP4 Parsing**: Extracts duration, timescale, and dimensions directly from ISO-BMFF box atoms (`ftyp`, `moov`, `mvhd`, `tkhd`).
- **WCAG 2.1 Contrast**: Computes relative luminance $L = 0.2126R + 0.7152G + 0.0722B$ after sRGB channel linearization. Ratio is calculated as:
  $$\text{Ratio} = \frac{L_1 + 0.05}{L_2 + 0.05}$$
  Pairs below 4.5:1 generate `ACCESSIBILITY` findings.
- **Brand Palette Euclidean Distance**: Measures color deviation against corporate palette (`#1A365D`, `#0284C7`, `#0F172A`, `#FFFFFF`, `#F8FAFC`).
- **Alt Text Validation**: Audits presence and descriptiveness of alternative text.

### 2. Optional External Capabilities (Reported Honestly)
- **Tesseract OCR (`pytesseract`)**: Extracted text from embedded image copy. If Tesseract binary is absent on system PATH, `capabilities.ocr_available` is set to `false`, and no text is fabricated.
- **FFmpeg Frame Sampling**: If FFmpeg is absent, container metadata is extracted via native pure-Python atom parsing, and `capabilities.ffmpeg_available` is set to `false` with an informative warning.

---

## 5. API Reference

### `POST /api/v1/media/audit`
*(Alias: `POST /api/media/audit`)*

Audits an uploaded document, image, or video asset against corporate brand guidelines and visual standards.

#### Request (Multipart Form Data)
| Parameter | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `file` | `UploadFile` | Yes | File binary (PDF, DOCX, TXT, PNG, JPEG, WebP, MP4, MOV, WebM). |
| `transcript_text` | `string` | No | Spoken audio transcript or subtitle lines for video files. |
| `alt_text` | `string` | No | Descriptive alternative text for accessibility checks. |
| `content_id` | `string` | No | Existing submission ID to link the audit record. |

#### Response (`MediaAuditResult`)
```json
{
  "status": "success",
  "media_type": "text/plain",
  "file_metadata": {
    "original_filename": "press_release.txt",
    "media_type": "text/plain",
    "size_bytes": 1024,
    "character_count": 480,
    "line_count": 6
  },
  "extracted_text": "Inkloom AI Launch Copy Sample...",
  "findings": [
    {
      "id": "claim-unsupported-001",
      "category": "claim_verification",
      "severity": "high",
      "title": "Unsupported Factual Claim Detected",
      "message": "Factual assertion lacks certified proof: 'We provide a 100% error-free guarantee'.",
      "evidence": "100% error-free guarantee",
      "source_reference": null,
      "confidence": 0.85,
      "suggested_correction": "Qualify claim with verified benchmark data.",
      "status": "flagged",
      "location": {
        "page": 1,
        "line": null,
        "start_offset": 62,
        "end_offset": 88
      },
      "requires_human_review": true
    }
  ],
  "audit_result": {
    "schema_version": "1.0.0",
    "audit_id": "audit-media-1730000000",
    "content_id": "cnt-20261023",
    "overall_status": "needs_human_review",
    "summary": "Media audit completed for press_release.txt. Identified 1 visual and governance finding(s).",
    "findings": [...],
    "created_at": "2026-10-23T12:00:00Z",
    "engine_metadata": {
      "engine_version": "1.0.0",
      "execution_time_ms": 14.5,
      "rules_checked_count": 16,
      "ai_model_used": "deterministic-media-pipeline",
      "extractors_used": ["media_audit:text/plain"]
    }
  },
  "capabilities": {
    "text_extraction_success": true,
    "ocr_available": false,
    "ocr_success": false,
    "visual_analysis_success": false,
    "transcript_available": false,
    "ffmpeg_available": false,
    "ai_audit_completed": true
  },
  "warnings": [],
  "errors": [],
  "duration_ms": 14.8
}
```

---

## 6. Local Setup & Testing (Windows PowerShell)

### Running Automated Test Suite
From the repository root:
```powershell
.\backend\.venv\Scripts\pytest backend/tests/media/ -v
```

To run the entire repository suite (89 passing tests):
```powershell
.\backend\.venv\Scripts\pytest -v
```

### Running the Backend Development Server
```powershell
Set-Location backend
.\.venv\Scripts\uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

Interactive OpenAPI Swagger UI is available at:
`http://localhost:8000/docs`

---

## 7. Security Best Practices
- **Never Auto-Approve**: Media checks can transition a submission to `changes_requested` or `pending_approval`, but *never* to `approved`.
- **Zero Local Path Disclosure**: File paths on the host server (`C:\...` or `/tmp/...`) are stripped from API responses; only sanitized basenames are returned.
- **Decompression Bomb Protection**: Pillow limits image allocations to 64 megapixels to prevent memory exhaustion.
- **Deterministic Temporary File Deletion**: All processing is wrapped in `SafeTempFile` context managers to ensure immediate removal upon completion or error.
