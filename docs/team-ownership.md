# Inkloom AI — Team Ownership & Component Boundaries

To enable four engineers to work concurrently without merge conflicts or overlapping responsibilities, our repository establishes strict directory boundaries, branch assignments, and shared contract coordination protocols.

---

## 1. Contributor Ownership Matrix

| Contributor Role | Feature Branch | Primary Directory Ownership | Core Deliverables |
| :--- | :--- | :--- | :--- |
| **1. Backend & Database** | `backend` | `backend/app/api/`<br>`backend/app/models/`<br>`backend/app/schemas/`<br>`backend/app/database/`<br>`backend/app/workflow/` | REST API routes, PostgreSQL/SQLAlchemy models, Alembic migrations, RBAC & tenant scoping, approval workflow state machine, audit event logging. |
| **2. Frontend Engineer** | `feature/frontend` | `frontend/` (all subdirectories: `app/`, `components/`, `services/`, `types/`) | Next.js 15 UI, Tailwind CSS layouts, Content submission UI, Audit findings visualizer, Human review queue dialogs, Analytics charts, mock & live API services. |
| **3. AI Audit Engine** | `feature/ai-engine` | `backend/app/services/ai_audit/`<br>`backend/tests/test_ai_engine.py` | Guideline retrieval logic, tone & voice analysis, terminology enforcement, claim verification, explanation & correction generation, model adapters. |
| **4. Media Processing & QA**| `feature/media-qa` | `backend/app/services/media_audit/`<br>`backend/tests/media/` | PDF/DOCX/TXT parsers, OCR text extraction, visual brand checks (color/logo/contrast), video sampling, synthetic fixtures and media test suites. |

---

## 2. Shared Files Requiring Coordination

The following files impact multiple team members and require team review before merging:

| Shared Path | Impacted Contributors | Modification Protocol |
| :--- | :--- | :--- |
| `contracts/audit-result.schema.json` | All 4 Contributors | Any schema field change must be versioned and coordinated. Backend Pydantic schema and Frontend TypeScript types must be updated in tandem. |
| `backend/app/services/audit_orchestrator.py` | Backend, AI Engine, Media | Orchestrator stitches media extraction and AI audit together into the final contract. Agree on method signatures before editing. |
| `backend/requirements.txt` | Backend, AI Engine, Media | Add new dependencies with version pins. Ensure optional media packages do not break basic API installations. |
| `frontend/package.json` | Frontend | Add UI packages; keep lockfile clean. |
| `.github/workflows/tests.yml` | All 4 Contributors | CI runs checks for all modules. Do not disable other contributors' tests. |
| `docker-compose.yml` | All 4 Contributors | Shared environment configuration. |

---

## 3. Communication & Interface Guarantees

1. **AI Engine & Media Processor Independence**:
   - The AI engine (`ai_audit/`) and Media processor (`media_audit/`) must **never** import database models (`app.models`) directly. They must operate solely on plain Python objects or Pydantic schemas.
   - This keeps them trivially testable in isolation without needing database connections.
2. **Frontend Mock Service**:
   - The Frontend contributor uses `frontend/services/mock-api.ts` to develop complete UI flows even before backend endpoints are fully deployed.
   - When ready, toggle `NEXT_PUBLIC_USE_MOCK_API=false` to switch to `frontend/services/api.ts`.
3. **No Hidden State**:
   - All state transitions must pass through `backend/app/workflow/state_machine.py`.
