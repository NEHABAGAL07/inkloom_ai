# Inkloom AI — Frontend Console

The modern React + TypeScript + Vite + Tailwind CSS console for **Inkloom AI**, an enterprise brand governance and marketing compliance platform.

---

## 1. Prerequisites

- **Node.js**: v18.0.0 or later (v20+ recommended; verified on Node.js v24)
- **npm**: v9.0.0 or later
- **FastAPI Backend (Optional for Mock Mode)**: Python 3.11+ running on `http://localhost:8000`

---

## 2. Quickstart & Installation (Windows PowerShell)

```powershell
# 1. Navigate to frontend directory
cd c:\Users\Aditya\OneDrive\Desktop\inkloom_ai\frontend

# 2. Install dependencies
npm install

# 3. Configure environment
Copy-Item .env.example .env

# 4. Start local development server
npm run dev
```

The application will be accessible at:
👉 **`http://localhost:5173`**

---

## 3. Configuration & Modes

Environment variables are located in `.env`:

```env
# Backend API Base URL
VITE_API_BASE_URL=http://localhost:8000/api

# Synthetic Mock Mode (true / false)
VITE_USE_MOCK_API=false

# App Title
VITE_APP_TITLE=Inkloom AI
```

### Operational Modes

1. **Live API Mode (`VITE_USE_MOCK_API=false` — Default)**:
   - Connects directly to the live FastAPI backend at `http://localhost:8000/api`.
   - Full persistence for content submissions, immutable revisions, deterministic audit runs, human review signoffs, and live compliance telemetry.

2. **Mock Demonstration Mode (`VITE_USE_MOCK_API=true` or UI Toggle)**:
   - Runs 100% in-browser on rich synthetic brand guidelines, certified facts, marketing drafts, and simulated audit runs.
   - You can also toggle between Live and Mock mode directly via the header button on the top right of the application without restarting the dev server!

---

## 4. Available Scripts

| Script | Command | Purpose |
| :--- | :--- | :--- |
| **`npm run dev`** | `vite` | Starts local dev server at `http://localhost:5173` with Hot Module Replacement (HMR). |
| **`npm run build`** | `tsc && vite build` | Type-checks and bundles the application for production to `dist/`. |
| **`npm run type-check`** | `tsc --noEmit` | Runs full TypeScript compiler check across all components, pages, and API models. |
| **`npm run preview`** | `vite preview` | Previews the production build locally. |

---

## 5. Backend Endpoints Integrated

All endpoints are version-safe and communicate with the FastAPI server:

| Endpoint | Method | Purpose in UI |
| :--- | :--- | :--- |
| `/api/health` | `GET` | Live backend telemetry indicator in header and settings |
| `/api/guidelines` | `GET`, `POST` | List and create brand guidelines |
| `/api/guidelines/{id}/rules` | `POST` | Append discrete brand rules (prohibited/canonical terms) |
| `/api/facts` | `GET`, `POST` | List and register certified enterprise claims and sources |
| `/api/content` | `GET`, `POST` | List content library and submit new marketing copy |
| `/api/content/{id}` | `GET` | View content snapshot and workflow status |
| `/api/content/{id}/revisions` | `POST` | Submit revision (invalidates approval; restarts review cycle) |
| `/api/content/{id}/history` | `GET` | Chronological revision timeline and snapshots |
| `/api/content/{id}/audit` | `POST` | Execute automated deterministic brand audit |
| `/api/audits/{id}` | `GET` | Retrieve structured audit findings conforming to Section 9 |
| `/api/reviews` | `GET` | Reviewer workspace queue of content pending signoff |
| `/api/reviews/{id}/decision` | `POST` | Record reviewer decision (`approved`, `changes_requested`, `rejected`) |
| `/api/analytics` | `GET` | Real-time aggregated compliance rate & violation distributions |

---

## 6. Architecture & Folder Structure

```text
frontend/
├── src/
│   ├── components/
│   │   ├── audits/         # AuditSummaryCard, FindingCard, etc.
│   │   ├── layout/         # AppLayout, AppSidebar, AppHeader
│   │   ├── reviews/        # ReviewQueueTable, ReviewDecisionModal
│   │   └── ui/             # StatusBadge, SeverityBadge, MetricCard, EmptyState, LoadingState, etc.
│   ├── lib/
│   │   ├── api/            # Centralized API client (client.ts)
│   │   ├── mock/           # Synthetic mock data and mock service
│   │   └── utils/          # Class merging (cn) and formatters
│   ├── pages/
│   │   ├── DashboardPage.tsx
│   │   ├── ContentAuditPage.tsx
│   │   ├── AuditResultsPage.tsx
│   │   ├── ContentLibraryPage.tsx
│   │   ├── ContentDetailPage.tsx
│   │   ├── GuidelinesPage.tsx
│   │   ├── ReviewQueuePage.tsx
│   │   ├── AnalyticsPage.tsx
│   │   └── SettingsPage.tsx
│   ├── styles/             # index.css (Tailwind & glassmorphic tokens)
│   ├── types/              # TypeScript interfaces matching backend models
│   ├── App.tsx             # Route configuration
│   └── main.tsx            # React root entrypoint
├── index.html
├── package.json
├── tailwind.config.js
├── tsconfig.json
└── vite.config.ts
```

---

## 7. Known Limitations

1. **Rich Media Processing (OCR / Video Frame Sampling)**: The UI provides clean disabled indicators for Image/Video upload tabs with explicit tooltips explaining that text copy audit is the active modality in the current milestone.
2. **Authentication Interface**: As with the backend development phase, user identity falls back to default tenant `org-default-001` to allow seamless local testing without OAuth redirect dependencies.
