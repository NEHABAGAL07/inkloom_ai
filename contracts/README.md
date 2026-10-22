# Inkloom AI — Shared Audit Contract

This directory contains the canonical, versioned specification for brand governance audit results in **Inkloom AI**.

All four sub-systems must strictly adhere to this schema:
1. **AI Audit Engine** (`backend/app/services/ai_audit/`): Generates findings conforming to this contract.
2. **Media Processing & QA** (`backend/app/services/media_audit/`): Produces extraction metadata and visual audit findings conforming to this contract.
3. **Backend API** (`backend/app/api/` & `backend/app/schemas/audit.py`): Validates, stores, and serves audit outputs.
4. **Frontend UI** (`frontend/types/audit.ts` & `frontend/services/`): Consumes and displays audit findings consistently.

---

## Files in this Directory

| File | Purpose |
| :--- | :--- |
| `audit-result.schema.json` | JSON Schema (Draft 2020-12) defining valid audit result structures. |
| `audit-result.example.json` | Concrete, validated reference instance of an audit result payload. |

---

## Core Contract Principles

1. **Separation of Confidence vs. Severity**:
   - `severity` (`critical`, `high`, `medium`, `low`, `info`) indicates business and brand impact.
   - `confidence` (`0.0` - `1.0`) indicates statistical or rule match certainty. High severity can have moderate confidence, and vice versa.
2. **No Fabricated Citations**:
   - `source_reference` points to an actual brand guideline ID or rule section. If no guideline is matched, it **must** be `null`.
   - `evidence` represents the raw verbatim string, color hex, or extracted metric. If unlocatable, it must be `null`.
3. **Distinction between Unverified vs. Contradicted Claims**:
   - Unverified claims are categorized under `claim_verification` with neutral or warning severity and explicit note that no empirical source exists in the claim registry.
   - Contradicted claims indicate direct mismatch with approved corporate facts.
4. **Human Review Responsibility**:
   - `requires_human_review: true` mandates human reviewer sign-off before publishing.
   - AI findings alone never publish or automatically approve marketing assets.

---

## Synchronization Requirements

When updating the schema:
1. Increment `schema_version` (Semantic Versioning).
2. Update Pydantic model in `backend/app/schemas/audit.py`.
3. Update TypeScript interface in `frontend/types/audit.ts`.
4. Run `backend/tests/test_audit_contract.py` to ensure schema conformance.
