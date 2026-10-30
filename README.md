# Inkloom AI — AI-Powered Brand Governance Platform

> **Automated brand compliance checks, terminology enforcement, verified claim checks, and human-in-the-loop review workflows for the enterprise.**

[![CI Pipeline](https://github.com/NEHABAGAL07/inkloom_ai/actions/workflows/tests.yml/badge.svg)](https://github.com/NEHABAGAL07/inkloom_ai/actions/workflows/tests.yml)
[![License](https://img.shields.io/badge/License-Proprietary-indigo.svg)](#)
[![Python](https://img.shields.io/badge/Python-3.11+-blue.svg)](https://www.python.org/)
[![Next.js](https://img.shields.io/badge/Next.js-14+-black.svg)](https://nextjs.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.110+-teal.svg)](https://fastapi.tiangolo.com/)

---

## 1. Product Overview

In high-growth and decentralized enterprises, marketing, sales, and product teams continuously publish content across dozens of channels. Inconsistent messaging, deprecated product names, unverified performance claims, off-brand tone, and accessibility breaches harm brand equity and expose organizations to legal liability.

**Inkloom AI** solves this by acting as an intelligent brand governance co-pilot:
- **Pre-publication Audit**: Automatically checks text copy, documents (PDF/DOCX), and visual assets against approved brand guidelines and corporate identity rules.
- **Brand Guideline Assistant**: Natural-language conversational Q&A grounded strictly in uploaded brand guideline documents (PDF/DOCX/TXT) with in-house BM25 synonym expansion and exact page/snippet citations.
- **Evidence & Confidence**: Explains every finding with verbatim evidence quotes, confidence metrics, and rule citations.
- **Intent-Preserving Rewrites**: Proposes intelligent corrections that fix compliance flaws while preserving the creator's voice and intent.
- **Truth Invariance**: Verifies numerical claims against certified benchmarks. Distinguishes *unverified claims* from *contradicted claims* without ever hallucinating citations.
- **Human Authority Guarantee**: AI assists and recommends, but **human reviewers always make the final publication approval decision**.

---

## 2. Technology Stack

- **Frontend**: Next.js 14 (App Router), React 18, TypeScript, Tailwind CSS, Lucide Icons.
- **Backend API**: FastAPI, Pydantic V2, SQLAlchemy 2.0, Alembic, Uvicorn.
- **Database**: PostgreSQL (production / Docker) with SQLite fallback for zero-config local development.
- **AI Audit Engine**: Deterministic rules engine (offline baseline) with optional adapter for cloud LLMs (OpenAI, Anthropic, Gemini).
- **Media Processing**: Multi-format extractor supporting plain text, PDF, DOCX, image metadata/OCR heuristics, and video transcript hooks.
- **Contracts**: JSON Schema (Draft 2020-12) bridging Frontend, Backend, AI Engine, and Media Extractors.
- **Containerization & CI**: Docker, Docker Compose, GitHub Actions.

---

## 3. Repository Architecture & Layout

```text
inkloom_ai/
├── contracts/                     # Single source of truth for audit data schemas
│   ├── audit-result.schema.json  # JSON Schema specification
│   ├── audit-result.example.json # Canonical example with realistic findings
│   └── README.md                 # Contract specification guide
├── backend/                       # FastAPI Backend Service
│   ├── app/
│   │   ├── api/routes/           # Versioned API routes (/api/v1)
│   │   ├── core/                 # Config (pydantic-settings), RBAC & security
│   │   ├── database/             # SQLAlchemy engine & declarative base
│   │   ├── models/               # Multi-tenant DB models (Organizations, Guidelines, Submissions, Audits)
│   │   ├── schemas/              # Pydantic contract & request/response schemas
│   │   ├── workflow/             # Centrally validated state machine
│   │   ├── ai/                   # Unified AI Layer (Gemini, schemas, safety, tasks)
│   │   │   ├── client.py         # AIClient dispatcher with fallback resilience
│   │   │   ├── schemas.py        # Task-agnostic AIRequest and AIResponse schemas
│   │   │   ├── safety.py         # Prompt injection defense & key redaction
│   │   │   ├── providers/        # Google Gemini & offline deterministic providers
│   │   │   └── tasks/            # Grounded Q&A, explain, rewrite, vision review
│   │   └── services/
│   │       ├── audit_orchestrator.py # Pipeline coordinator
│   │       ├── ai_audit/         # Independent AI audit modules
│   │       │   ├── engine.py     # Main callable AI audit engine
│   │       │   ├── guideline_retrieval.py # Context rule selector
│   │       │   ├── tone_analysis.py       # Anti-FUD & tone checker
│   │       │   ├── terminology.py         # Deprecated names & trademark checker
│   │       │   └── claim_checking.py      # Claim verification & benchmark matcher
│   │       └── media_audit/      # Safe document & media extraction
│   │           ├── interfaces.py          # Typed MediaSegment & ExtractedContent
│   │           ├── extractor.py           # Dispatcher, file limits & path defense
│   │           ├── document_processor.py  # PDF, DOCX, TXT extractors
│   │           ├── image_processor.py     # OCR & visual brand contrast
│   │           └── video_processor.py     # Video frames & transcript hook
│   ├── migrations/               # Alembic database migrations
│   ├── tests/                    # Backend test suite (unit, contract, workflow, integration)
│   │   ├── conftest.py
│   │   ├── test_health.py
│   │   ├── test_audit_contract.py
│   │   ├── test_workflow.py
│   │   ├── test_ai_engine.py
│   │   ├── media/test_extractor.py
│   │   └── integration/test_orchestrator.py
│   ├── requirements.txt          # Python dependencies
│   ├── alembic.ini
│   └── .env.example
├── frontend/                      # Next.js Frontend Application
│   ├── app/
│   │   ├── page.tsx              # Executive Brand Governance Dashboard
│   │   ├── layout.tsx            # Global layout with navigation sidebar
│   │   ├── globals.css           # Custom design tokens & glassmorphism
│   │   ├── content/page.tsx      # Submission studio with live editor & file upload
│   │   ├── audits/page.tsx       # Interactive findings explorer & diff viewer
│   │   ├── reviews/page.tsx      # Human review queue & decision modal
│   │   ├── analytics/page.tsx    # Governance metrics & compliance trends
│   │   └── settings/page.tsx     # Brand guideline manager & asset registry
│   ├── components/               # Modular UI components
│   │   ├── layout/               # Sidebar, Header
│   │   ├── content/              # SubmissionForm, FileUpload
│   │   ├── audits/               # AuditSummaryCard, FindingCard, DiffViewer, FindingsFilter
│   │   └── reviews/              # ReviewActionModal, AuditTrailTimeline
│   ├── services/
│   │   ├── api.ts                # Real/Mock unified API client
│   │   └── mock-api.ts           # Deterministic offline mock service
│   ├── types/                    # TypeScript contract matching JSON Schema
│   ├── package.json
│   ├── tsconfig.json
│   ├── next.config.ts
│   └── .env.example
├── docs/                          # Architecture & Team Guidelines
│   ├── architecture.md           # System diagrams & data flow
│   ├── api-contract.md           # REST API specification
│   ├── git-workflow.md           # Branching strategy & PR procedures
│   ├── team-ownership.md         # 4-developer ownership boundaries
│   ├── local-setup.md            # Step-by-step local run guide
│   └── security.md               # Tenant isolation, RBAC & safety policies
├── scripts/
│   └── validate_contracts.py     # Contract validation script
├── .github/workflows/tests.yml   # CI automation pipeline
├── Dockerfile                    # Container definition
├── docker-compose.yml            # Multi-service local composition
└── .env.example                  # Root environment template
```

---

## 4. Team Ownership & Code Boundaries

The repository is cleanly partitioned for four developers working in parallel on dedicated Git branches:

| Contributor | Git Branch | Ownership Boundary |
|---|---|---|
| **1. Backend & DB** | `backend` | `backend/app/api/`, `models/`, `schemas/`, `database/`, `workflow/` |
| **2. Frontend** | `feature/frontend` | `frontend/` |
| **3. AI Audit Engine** | `feature/ai-engine` | `backend/app/services/ai_audit/`, `backend/tests/test_ai_engine.py` |
| **4. Media & QA** | `feature/media-qa` | `backend/app/services/media_audit/`, `backend/tests/media/` |

*For complete collaboration protocols and shared contract rules, refer to [`docs/team-ownership.md`](file:///docs/team-ownership.md) and [`docs/git-workflow.md`](file:///docs/git-workflow.md).*

---

## 5. Local Setup & Quickstart

### Prerequisites
- Python 3.11+
- Node.js 18+ & npm 9+

### 5.1 Run Backend
```bash
cd backend
python -m venv venv

# Windows
.\venv\Scripts\Activate.ps1
# macOS/Linux
source venv/bin/activate

pip install -r requirements.txt
cp .env.example .env
uvicorn app.main:app --reload --port 8000
```
- API is running at: [http://localhost:8000](http://localhost:8000)
- Interactive API Docs (Swagger): [http://localhost:8000/docs](http://localhost:8000/docs)
- Health Check: [http://localhost:8000/health](http://localhost:8000/health)

### 5.2 Run Frontend
```bash
cd frontend
npm install
cp .env.example .env.local
npm run dev
```
- Application is live at: [http://localhost:3000](http://localhost:3000)
- By default, `NEXT_PUBLIC_USE_MOCK=true` allows the frontend to run fully offline with deterministic brand governance mock data. Set to `false` when connecting to the live FastAPI backend.

### 5.3 Enabling Real Google Gemini AI Integration

Inkloom AI features a unified, provider-agnostic AI layer (`backend/app/ai/`) that powers all copilots and governance intelligence:

1. **Obtain API Key**:
   - Generate a Gemini API key at [Google AI Studio](https://aistudio.google.com/).
2. **Configure `backend/.env`**:
   ```env
   LLM_PROVIDER=gemini
   LLM_API_KEY=AQ.Ab8RN6KruE828jo2vpDRGZfu3eB246FGcrNpywoUFFXXaVxqAw
   LLM_MODEL_NAME=gemini-3.1-flash-lite
   LLM_TIMEOUT_SECONDS=30.0
   LLM_MAX_RETRIES=2
   LLM_MAX_OUTPUT_TOKENS=1000
   CHAT_RATE_LIMIT_PER_MINUTE=10
   ```
3. **Resilience & Safe Extractive Fallback**:
   - **Zero-Key Extractive Mode**: When `LLM_API_KEY` is empty, Inkloom operates in deterministic **Offline Mode** (`mode="offline"`). It extracts top verbatim sections with page citations without making any outbound network calls.
   - **Automatic Fallback on Failure**: If Gemini calls fail (e.g., HTTP 500, network timeouts, 429 quota limits, `MAX_TOKENS` truncation, or safety blocks), `AIClient` catches the error, logs a clean warning without secrets, and yields a complete deterministic answer with HTTP 200. Zero unhandled 500s.
   - **Strict Grounding Guarantee**: If BM25 retrieval finds no passages or scores fall below relevance thresholds, the system immediately returns `"I couldn't find this in your uploaded documents."` (`confidence="not_found"`) without spending LLM tokens.
   - **Prompt Injection Containment**: All untrusted inputs are encapsulated within strict XML-delimited blocks (`<<<UNTRUSTED_CONTENT>>>`) with hard directives instructing the model to treat content purely as passive subject data.

### 5.4 Run with Docker Compose (Production Multi-Container)
```bash
# Using one-click deployment script
./scripts/deploy-docker.sh     # Linux / macOS / Cloud VPS
.\scripts\deploy-docker.ps1    # Windows PowerShell

# Or directly:
docker compose up --build -d
```
See [DEPLOYMENT.md](docs/DEPLOYMENT.md) for full deployment instructions (Docker, Google Cloud Run, AWS EC2, and VPS with Nginx SSL).

---

## 6. Testing Instructions

With the backend virtual environment active:
```bash
cd backend
python -m pytest tests/ -v
```

To validate the shared JSON contract independently:
```bash
python scripts/validate_contracts.py
```

---

## 7. Current Implementation Status & Known Stubs

| Component | Status | Details |
|---|---|---|
| **Shared Audit Contract** | **Complete** | JSON Schema (Draft 2020-12), realistic example, Pydantic V2 models, and TypeScript types implemented and verified. |
| **Central Workflow Engine** | **Complete** | State machine centrally validates transitions: `draft`, `submitted`, `auditing`, `changes_requested`, `resubmitted`, `pending_approval`, `approved`, `rejected`. Enforces human sign-off. |
| **FastAPI REST API** | **Complete** | Endpoints for `/health`, `/submissions`, `/audits`, `/reviews`, `/guidelines`, `/assets`, and `/analytics`. |
| **AI Audit Engine** | **Operational Baseline** | Deterministic rule-based engine with tone analysis, terminology checker, and claim verification. Optional LLM adapter interface ready for cloud providers. |
| **Media Processing** | **Operational Baseline** | TXT, PDF, DOCX extraction, filename sanitization, size limit enforcement. Image OCR and video transcripts have safe fallback stubs. |
| **Frontend Application** | **Operational** | 6 complete views: Dashboard, Content Submission Studio, Audit Findings Explorer with Diffs, Review Queue with Decision Modal, Governance Analytics, Settings. Unified `api.ts` / `mock-api.ts`. |
| **Authentication & RBAC** | **Starter Stub** | Role headers and dependency injection are established (`X-Tenant-Id`, `X-User-Role`); production JWT verification needs hookup to enterprise SSO/IdP. |
| **Database Migrations** | **Scaffolded** | Alembic initialized; automatic SQLite schema creation enabled for local dev. |
