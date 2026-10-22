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
