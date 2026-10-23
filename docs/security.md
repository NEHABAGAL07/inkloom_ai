# Inkloom AI — Security Architecture & Governance Principles

This document outlines the security controls, tenant isolation guarantees, permission policies, and data handling rules enforced across Inkloom AI.

---

## 1. Multi-Tenant Data Isolation

Inkloom AI is built to serve multi-organization enterprises where brand guidelines, unreleased marketing assets, and draft press releases are sensitive business secrets.

### Isolation Rules
1. **Mandatory Tenant Scoping**:
   - Every database table holding operational data (`content_submissions`, `content_revisions`, `brand_guidelines`, `audit_results`, `review_decisions`) has an explicit foreign key to `organization_id` (or `workspace_id`).
   - Every database query in `backend/app/api/` must explicitly filter on `organization_id`.
   - Never expose auto-increment integer IDs externally. Use cryptographically random UUIDv4 identifiers.
2. **File Storage Isolation**:
   - Uploaded media is saved into tenant-scoped directory paths:
     `uploads/{organization_id}/{submission_id}/{sanitized_filename}`
   - Path traversal attacks (`../`, `..\\`) are strictly sanitized before disk writes.

---

## 2. Role-Based Access Control (RBAC)

Inkloom AI defines four explicit roles:

| Role | Scope | Permissions |
| :--- | :--- | :--- |
| `admin` | Organization | Full administrative control: manage guidelines, members, API keys, workspaces, and view full audit history. |
| `reviewer` | Workspace | Brand officer / Legal reviewer: inspect audits, request revisions, and issue binding **final publication approvals**. |
| `creator` | Workspace | Content author / Marketer: submit copy and media for automated audits, view findings, resolve suggestions, and resubmit revisions. Cannot approve content. |
| `viewer` | Workspace | Read-only access to published guidelines, approved assets, and analytics reports. |

---

## 3. Human-in-the-Loop Publication Governance

- **AI findings do not constitute publication approval.**
- Even if an automated audit generates a status of `passed` with 0 findings, content cannot enter the `approved` state automatically.
- Only a user with the `reviewer` or `admin` role can transition content to `approved`.
- Every transition stores:
  - `reviewer_id`
  - `action` (`approve`, `reject`, `request_changes`)
  - `comments` (mandatory reason)
  - `revision_id`
  - `timestamp`

---

## 4. No Hallucinated Citations Guarantee

1. **Evidence Integrity**:
   - An AI finding must cite the verbatim snippet extracted from the submitted content.
   - If evidence cannot be pinned to an exact segment, the `evidence` field is set to `null` or marked `unavailable`. The engine must never invent placeholder evidence.
2. **Source References**:
   - The `source_reference` field must refer only to an existing brand guideline ID, style guide rule, or certified claim in the database.
   - If a claim fails verification because no supporting registry entry exists, the finding is marked with `category: "claim_verification"` and `source_reference: null`, with message: *"No verifiable source found in organizational claim registry."*
3. **Unverified vs. Contradicted Claims**:
   - **Unverified**: Missing proof. Flagged for review.
   - **Contradicted**: Explicitly in conflict with an approved brand fact or legal parameter. Flagged as high/critical severity.

---

## 5. Media & Upload Security

- **File Size Caps**: Configured in `MAX_UPLOAD_SIZE_BYTES` (default 25 MB). Requests exceeding this limit return HTTP 413 Payload Too Large.
- **MIME Validation**: Validated via magic bytes inspection, not merely file extension.
- **Safe Temporary Files**: Media extractors process files in isolated temporary directories and guarantee cleanup in `finally` blocks.
- **Sanitized Filenames**: Basename sanitization strips control characters, path separators, and null bytes.
- **Isolated OCR/FFmpeg Execution**: External binary invocations (like `pdftotext`, `tesseract`, or `ffmpeg`) are executed with timeouts and restricted subprocess environments to prevent CPU denial-of-service.

---

## 6. Secrets & Environment Handling

- No API keys, passwords, or production tokens are hardcoded.
- All secrets are loaded through `backend/app/core/config.py` using `pydantic-settings`.
- Safe error handlers in `backend/app/main.py` catch unhandled exceptions and return sanitized generic error messages (`Internal Server Error`), preventing database schemas, query strings, or stack traces from leaking to client responses.
