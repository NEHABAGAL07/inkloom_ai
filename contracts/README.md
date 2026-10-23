# Inkloom AI — Shared Audit Result Contract

The shared contract defines the canonical data structure for brand governance audit results across **Backend**, **Frontend**, **AI Audit Engine**, and **Media Processing**.

All four components communicate using this schema. No team should alter this structure unilaterally.

---

## 1. Files in this Directory

- [`audit-result.schema.json`](file:///contracts/audit-result.schema.json): The JSON Schema Draft 2020-12 specification.
- [`audit-result.example.json`](file:///contracts/audit-result.example.json): A realistic example demonstrating all finding categories, severities, evidence excerpts, and suggested corrections.

---

## 2. Core Design Principles

1. **Evidence-Based Reporting**:
   - `evidence` holds the literal text quote, token range, or bounding box.
   - If evidence is unavailable, it is represented explicitly as `null`—never fabricated.

2. **Ground Truth & Citation Integrity**:
   - `source_reference` references real, registered brand guidelines or fact benchmarks.
   - **Never hallucinate citations**: If a claim has no registered benchmark, `verification_status` must be marked `"unverified"` and `source_reference` must reflect missing reference rather than an invented citation.
   - `contradicted` claims must be clearly distinguished from `unsupported/unverified` claims.

3. **Separation of Confidence vs. Severity**:
   - `severity` (`critical`, `high`, `medium`, `low`, `info`) indicates business and brand impact.
   - `confidence` (`0.0` to `1.0`) indicates the algorithmic probability that the rule violation was accurately detected.

4. **Human in the Loop**:
   - `requires_human_review: true` flags items that require manual reviewer verification before publishing.
   - The AI engine recommends; human reviewers approve.

---

## 3. Implementation Mappings

- **Backend / AI Engine**: Python Pydantic V2 model in [`backend/app/schemas/audit_contract.py`](file:///backend/app/schemas/audit_contract.py).
- **Frontend**: TypeScript interface in [`frontend/types/audit.ts`](file:///frontend/types/audit.ts).
- **Test Suite**: Automated contract test in [`backend/tests/test_audit_contract.py`](file:///backend/tests/test_audit_contract.py) validates example and Pydantic models against the JSON schema.
