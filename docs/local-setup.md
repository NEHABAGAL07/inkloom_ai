# Inkloom AI — Local Environment Setup Guide

This guide walks you through setting up Inkloom AI on your local machine for backend, frontend, AI engine, and media QA development.

---

## Prerequisites

- **Python**: Version 3.11, 3.12, or 3.13+
- **Node.js**: Version 18.x, 20.x, or 22+
- **Git**: Installed and configured
- **Optional (for full media OCR & Docker)**:
  - Docker Desktop
  - Tesseract OCR (`tesseract` in PATH)
  - Poppler (`pdftotext` in PATH)

---

## 1. Quickstart with Docker Compose (Recommended)

To start PostgreSQL, FastAPI backend, and Next.js frontend with a single command:

```bash
# 1. Clone & copy environment templates
cp .env.example .env

# 2. Start services
docker compose up --build
```

- **Frontend**: Accessible at [http://localhost:3000](http://localhost:3000)
- **Backend API Docs**: Accessible at [http://localhost:8000/docs](http://localhost:8000/docs)
- **Health Check**: Accessible at [http://localhost:8000/health](http://localhost:8000/health)

---

## 2. Manual Local Setup (Without Docker)

### Backend Setup

```bash
# 1. Navigate to backend directory
cd backend

# 2. Create virtual environment
python -m venv .venv

# 3. Activate virtual environment
# On Windows (PowerShell):
.venv\Scripts\Activate.ps1
# On Linux/macOS:
source .venv/bin/activate

# 4. Install dependencies
pip install --upgrade pip
pip install -r requirements.txt

# 5. Copy environment configuration
cp .env.example .env

# 6. Run database migrations or startup
# (Uses SQLite fallback if PostgreSQL is not running)
uvicorn app.main:app --reload --port 8000
```

Verify backend is running by opening [http://localhost:8000/health](http://localhost:8000/health).

### Frontend Setup

```bash
# 1. In a separate terminal, navigate to frontend
cd frontend

# 2. Install dependencies
npm install

# 3. Copy environment configuration
cp .env.example .env.local

# 4. Start Next.js development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the Inkloom AI Brand Governance dashboard.

---

## 3. Running the Test Suite

```bash
# In backend directory with virtualenv active:
pytest -v

# Run only media tests:
pytest tests/media/ -v

# Run contract tests:
pytest tests/test_audit_contract.py -v

# Frontend type check:
cd frontend
npm run type-check
```
