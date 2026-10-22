# Inkloom AI — AI-Powered Brand Governance Platform

> **Maintain Brand Consistency, Verify Claims, and Ensure Compliance Across All Content & Media.**

Inkloom AI is an enterprise-grade brand governance platform that automates brand compliance checks, manages approved brand assets, and streamlines human-in-the-loop content review and approval workflows. Content creators submit copy, documents, and media for verification against approved brand guidelines, terminology standards, tone principles, factual claims, visual rules, and accessibility requirements.

---

## 1. Product Objectives & Core Principles

- **Evidence-Based Explanations**: Findings cite verbatim snippets and pinpoint locations with measured confidence scores.
- **Intent-Preserving Corrections**: Actionable suggested replacements correct compliance issues while preserving the creator's voice and intent.
- **Strict Human-in-the-Loop Governance**: Automated AI audits can never automatically approve content for publication. A designated human brand reviewer must make the final binding approval decision.
- **Truth & Verification Distinction**: Clearly distinguishes **unverified claims** (missing evidence in the corporate claim registry) from **contradicted claims** (facts in direct violation of verified brand parameters).
- **Zero Hallucination Guarantee**: The system never invents or fabricates citations, guideline references, or verification results. If a citation is missing, `source_reference` is explicitly returned as `null`.
- **Tenant Isolation**: Strict organization-level scoping protects proprietary guidelines, unpublished marketing campaigns, and audit history.

---

## 2. Technology Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend** | Next.js 15 (App Router), React 19, TypeScript, Tailwind CSS |
| **Backend API** | FastAPI, Pydantic v2, Python 3.11+ / 3.12+ |
| **Database & ORM** | PostgreSQL, SQLAlchemy 2.0 (Async), Alembic, SQLite fallback |
| **Audit Engine** | Deterministic regex & rule engine, LLM Model Adapter interface |
| **Media Extraction** | Pluggable extractors: `pypdf`, `python-docx`, Pillow, Tesseract OCR & FFmpeg hooks |
| **Contracts & QA** | JSON Schema (Draft 2020-12), Pytest, Pytest-Asyncio, HTTPX |
| **Containerization** | Docker, Docker Compose |

---

## 3. Repository Architecture & Layout

```
inkloom_ai/
├── contracts/                        # Versioned Single Source of Truth
│   ├── audit-result.schema.json      # Canonical JSON Schema for all findings
│   ├── audit-result.example.json     # Reference valid audit payload
│   └── README.md                     # Contract governance principles
├── frontend/                         # Next.js 15 Web Application
│   ├── app/                          # App router pages (Dashboard, Content, Audits, Reviews, Analytics, Settings)
│   ├── components/                   # UI components (Layout, Content form, Audits, Review modals)
│   ├── services/                     # Dual-mode API client (mock-api.ts and live api.ts)
│   ├── types/                        # TypeScript types strictly mirroring audit contract
│   ├── package.json
│   ├── tsconfig.json
│   └── .env.example
├── backend/                          # FastAPI REST API & Core Services
│   ├── app/
│   │   ├── main.py                   # Application entry point with CORS & error handlers
│   │   ├── api/routes/               # Versioned routes (/health, /content, /audits, /reviews, etc.)
│   │   ├── core/                     # Central config (pydantic-settings) & RBAC permissions
│   │   ├── database/                 # Async SQLAlchemy engine, session generator, Base mixins
│   │   ├── models/                   # DB models (Organizations, Guidelines, Assets, Submissions, Audits, Reviews)
│   │   ├── schemas/                  # Pydantic schemas mirroring JSON Schema contract
│   │   ├── workflow/                 # Central publication approval state machine
│   │   └── services/
│   │       ├── audit_orchestrator.py # Pipeline coordinator
│   │       ├── ai_audit/             # Guideline retrieval, tone, terminology, claims
│   │       └── media_audit/          # Document, image, video extraction & visual checks
│   ├── migrations/                   # Alembic environment and migration scripts
│   ├── tests/                        # Pytest suite (health, workflow, contract, ai-engine, media)
│   ├── requirements.txt
│   └── .env.example
├── docs/                             # Engineering Specifications & Protocols
│   ├── architecture.md               # System architecture and Mermaid diagrams
│   ├── api-contract.md               # REST API endpoints and data payloads
│   ├── team-ownership.md             # Contributor boundaries and coordination rules
│   ├── git-workflow.md               # Git branching, rebasing, and PR guidelines
│   ├── local-setup.md                # Step-by-step local setup guide
│   └── security.md                   # Multi-tenant isolation and security controls
├── scripts/                          # Utility & validation scripts
│   ├── validate_contracts.py         # Schema conformance tester
│   └── seed_demo_data.py             # Demo data generator
├── .github/workflows/
│   └── tests.yml                     # Continuous Integration workflow
├── .gitignore
├── .env.example
├── Dockerfile
├── docker-compose.yml
└── README.md
```

---

## 4. Team Ownership Boundaries

To enable four engineers to work in parallel on dedicated feature branches without merge conflicts:

| Contributor Role | Branch | Directory Ownership |
| :--- | :--- | :--- |
| **Backend & Database** | `backend` | `backend/app/api/`, `models/`, `schemas/`, `database/`, `workflow/` |
| **Frontend Engineer** | `feature/frontend` | `frontend/` (`app/`, `components/`, `services/`, `types/`) |
| **AI Audit Engine** | `feature/ai-engine` | `backend/app/services/ai_audit/`, `backend/tests/test_ai_engine.py` |
| **Media Processing & QA**| `feature/media-qa` | `backend/app/services/media_audit/`, `backend/tests/media/` |

> Consult [`docs/team-ownership.md`](docs/team-ownership.md) for shared file protocols and [`docs/git-workflow.md`](docs/git-workflow.md) for branch synchronization rules.

---

## 5. Local Setup & Quickstart

### Option A: Using Docker Compose (Fastest)

```bash
# 1. Clone repository and create local environment
cp .env.example .env

# 2. Start PostgreSQL, FastAPI backend, and Next.js frontend
docker compose up --build
```
- **Frontend**: [http://localhost:3000](http://localhost:3000)
- **Backend Swagger Docs**: [http://localhost:8000/docs](http://localhost:8000/docs)
- **API Health Check**: [http://localhost:8000/health](http://localhost:8000/health)

---

### Option B: Manual Local Setup

#### 1. Backend Setup
```bash
cd backend
python -m venv .venv

# Activate virtual environment (Windows PowerShell)
.venv\Scripts\Activate.ps1
# Activate virtual environment (Linux/macOS)
source .venv/bin/activate

pip install --upgrade pip
pip install -r requirements.txt
cp .env.example .env

# Run FastAPI with live reload
uvicorn app.main:app --reload --port 8000
```

#### 2. Frontend Setup
```bash
cd frontend
npm install
cp .env.example .env.local

# Run Next.js in development mode
npm run dev
```

---

## 6. Running Tests & Quality Checks

```bash
# Backend & Contract Tests (run from backend/ directory):
pytest -v

# Run only audit contract synchronization tests:
pytest tests/test_audit_contract.py -v

# Run workflow state transition tests:
pytest tests/test_workflow.py -v

# Run standalone schema validator:
python scripts/validate_contracts.py

# Frontend TypeScript Verification:
cd frontend
npm run type-check
```

---

## 7. Current Implementation Status & Stubs

This scaffold provides a coherent, functioning architectural foundation with explicit boundaries. In accordance with senior architecture standards, current stubs are labeled transparently:

| Component | Status | Implementation Details / Next Steps |
| :--- | :--- | :--- |
| **Audit Contract** | **Complete** | Versioned schema in `contracts/`, matching Pydantic and TypeScript types, contract tests passing. |
| **Approval Workflow** | **Complete** | Centralized 8-state machine in `app/workflow/state_machine.py`, automated AI publication prevention verified by unit tests. |
| **Rule-Based AI Audit** | **Complete** | Deterministic terminology, tone colloquialisms, and superlative claim checks functioning without external API keys. |
| **LLM Model Adapter** | *Scaffold / Stub* | Abstract adapter interface in `app/services/ai_audit/engine.py`. Next step: wire Gemini/OpenAI API keys via environment variables. |
| **Media Extractors** | **Functional** | Plain text extraction, filename sanitization, size/MIME validation. PDF (`pypdf`) and DOCX (`python-docx`) adapters implemented with graceful fallbacks if optional packages are uninstalled. |
| **OCR & Video QA** | *Scaffold / Baseline* | Image processor returns baseline visual compliance metrics; full OCR requires Tesseract system binary. Video frame sampler provides baseline interface. |
| **Authentication & RBAC** | *Dev Scaffold* | RBAC roles and dependency checks defined in `app/core/security.py`. Returns development reviewer identity; needs JWT/OAuth2 provider for production. |
| **Frontend UI** | **Complete** | Dashboard, Content Submission, Audit Findings Inspector, Review Queue with Modals, Analytics, and Settings pages with working mock & live services. |

---

## 8. License

Proprietary — Developed for Inkloom AI Brand Governance Hackathon.
