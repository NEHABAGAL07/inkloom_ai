# Inkloom AI — REST API Contract

Base URL: `/api/v1`

All responses return standard JSON. Error responses follow the standard RFC 7807 format or FastAPI `HTTPException` structure with `{"detail": "..."}` or `{"error_code": "...", "message": "..."}`.

---

## 1. System & Health

### `GET /health`
Returns health status, active database connectivity, and engine version.
- **Auth**: None
- **Response `200 OK`**:
```json
{
  "status": "healthy",
  "version": "1.0.0",
  "timestamp": "2026-10-22T12:00:00Z",
  "database": "connected",
  "environment": "development"
}
```

---

## 2. Organizations & Brand Guidelines

### `GET /api/v1/workspaces`
List workspaces accessible to the authenticated user.

### `GET /api/v1/guidelines`
List active brand guidelines for the tenant.
- **Query Params**: `organization_id` (UUID), `category` (optional)
- **Response `200 OK`**:
```json
[
  {
    "id": "gd-101",
    "organization_id": "org-001",
    "name": "Corporate Identity & Voice v2",
    "category": "tone_and_voice",
    "version": "2.4",
    "rules": [
      {
        "id": "rule-tone-01",
        "title": "Authoritative yet Accessible Tone",
        "description": "Avoid hyperbole and overly casual slang.",
        "severity": "medium",
        "prohibited_phrases": ["super pumped", "game changer", "revolutionary"]
      }
    ],
    "is_active": true
  }
]
```

### `POST /api/v1/guidelines`
Create a new guideline rule or style standard.

---

## 3. Approved Brand Assets

### `GET /api/v1/assets`
List registered logos, official color palettes, and certified claims.
- **Query Params**: `type` (`logo`, `color_palette`, `claim_registry`)

### `POST /api/v1/assets`
Register a new brand asset with approved parameters (e.g. Hex color codes, approved claim text).

---

## 4. Content Submissions & Revisions

### `POST /api/v1/content/submit`
Submit text or upload a document for brand governance review.
- **Content-Type**: `multipart/form-data` or `application/json`
- **Fields**:
  - `title`: string
  - `content_type`: `text` | `document` | `image` | `video`
  - `raw_text`: string (optional if file attached)
  - `file`: binary upload (optional)
  - `organization_id`: UUID
- **Response `201 Created`**:
```json
{
  "content_id": "9a8b7c6d-5e4f-3a2b-1c0d-e9f8a7b6c5d4",
  "current_revision": 1,
  "status": "draft",
  "title": "Q4 Press Release",
  "created_at": "2026-10-22T12:00:00Z"
}
```

### `GET /api/v1/content/{content_id}`
Retrieve submission details, revision history, and current workflow status.

---

## 5. Audit Execution & Results

### `POST /api/v1/audits/run`
Trigger a brand governance audit on a content submission revision.
- **Request Body**:
```json
{
  "content_id": "9a8b7c6d-5e4f-3a2b-1c0d-e9f8a7b6c5d4",
  "revision_id": 1,
  "guideline_ids": ["gd-101"]
}
```
- **Response `200 OK`**: Conforms to `contracts/audit-result.schema.json`.

### `GET /api/v1/audits/{audit_id}`
Fetch cached audit results matching `contracts/audit-result.schema.json`.

---

## 6. Review Decisions & Approval Workflow

### `POST /api/v1/reviews/decision`
Record an official human review decision on content.
- **Request Body**:
```json
{
  "content_id": "9a8b7c6d-5e4f-3a2b-1c0d-e9f8a7b6c5d4",
  "revision_id": 1,
  "action": "request_changes",
  "comments": "Please resolve unverified claim in paragraph 3 before publishing.",
  "reviewer_id": "user-reviewer-123"
}
```
- **Allowed Actions**: `approve`, `reject`, `request_changes`
- **Response `200 OK`**: Updated workflow state and audit trail event.

---

## 7. Analytics & Compliance Metrics

### `GET /api/v1/analytics/summary`
Get aggregated brand governance metrics:
- Overall compliance rate (%)
- Most frequent violation categories
- Total audits conducted
- Average review turnaround time

---

## 8. Media Asset Auditing

### `POST /api/v1/media/audit`
*(Alias: `POST /api/media/audit`)*

Execute end-to-end media preprocessing, visual compliance checks, and AI brand governance analysis on an uploaded file.

- **Content-Type**: `multipart/form-data`
- **Fields**:
  - `file`: binary upload (PDF, DOCX, TXT, PNG, JPEG, WebP, MP4, MOV, WebM) — *Required*
  - `transcript_text`: string (optional, spoken video audio transcription)
  - `alt_text`: string (optional, accessibility image description)
  - `content_id`: string (optional, submission identifier to link workflow state)
- **Response `200 OK`**:
```json
{
  "status": "success",
  "media_type": "application/pdf",
  "file_metadata": {
    "original_filename": "campaign_brief.pdf",
    "media_type": "application/pdf",
    "size_bytes": 14200,
    "pages": 3,
    "pages_processed": 3
  },
  "extracted_text": "Q4 Brand Strategy Launch Brief...",
  "findings": [
    {
      "id": "claim-unsupported-001",
      "category": "claim_verification",
      "severity": "high",
      "title": "Unsupported Factual Claim Detected",
      "message": "Factual assertion lacks certified proof: '100% error-free guarantee'.",
      "evidence": "100% error-free guarantee",
      "source_reference": null,
      "confidence": 0.85,
      "suggested_correction": "Qualify claim with verified benchmark data.",
      "status": "flagged",
      "location": {
        "page": 2,
        "line": null,
        "start_offset": 140,
        "end_offset": 166
      },
      "requires_human_review": true
    }
  ],
  "audit_result": {
    "schema_version": "1.0.0",
    "audit_id": "audit-media-1730000000",
    "content_id": "cnt-20261023",
    "overall_status": "needs_human_review",
    "summary": "Media audit completed for campaign_brief.pdf. Identified 1 finding(s).",
    "findings": [...],
    "created_at": "2026-10-23T12:00:00Z",
    "engine_metadata": {
      "engine_version": "1.0.0",
      "execution_time_ms": 22.4,
      "rules_checked_count": 18,
      "ai_model_used": "deterministic-media-pipeline",
      "extractors_used": ["media_audit:application/pdf"]
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
  "duration_ms": 22.8
}
```

