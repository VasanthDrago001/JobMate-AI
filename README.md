# JobMate AI 🚀

> **Targeted, Truthful Resume Alignment & Skill Gap Assistant for Indian IT Job Seekers**  
> Built with React + TypeScript + Vite, Python + FastAPI, and PostgreSQL / Supabase.

---

## 1. Project Overview

JobMate AI is an open, transparent, and privacy-first web application designed for Indian tech professionals (freshers, service-to-product switchers, and laterals).

### Core Differentiators:
- **Zero Hallucination:** Never invents fake achievements, metrics, companies, or tools.
- **Honest Alignment:** Replaces deceptive "95% ATS score" claims with transparent lexical/semantic keyword overlap and verifiable line-by-line resume evidence.
- **STAR / XYZ Bullet Rewriter:** Truthfully improves existing resume bullets using Google's XYZ formula (`Accomplished [X] as measured by [Y], by doing [Z]`).
- **India DPDP Act 2023 Compliant:** In-memory ephemeral processing with zero persistent file retention and automatic PII masking.
- **Cost Disciplined:** Engineered for ₹0 fixed infrastructure costs during development and < ₹0.03 per analysis in production.

---

## 2. Repository Architecture & Directory Structure

```text
JobMate/
├── backend/                    # Python + FastAPI Application
│   ├── app/
│   │   ├── api/v1/             # REST endpoints (health, analysis, bullets)
│   │   ├── core/               # Pydantic configuration, security, rate limiting
│   │   └── main.py             # FastAPI entrypoint, CORS & middleware
│   ├── tests/                  # Pytest test suite
│   ├── .venv/                  # Virtual environment
│   ├── .env.example            # Backend environment template
│   ├── pytest.ini              # Pytest configuration
│   └── requirements.txt        # Pinned / constrained dependencies
│
├── frontend/                   # React + TypeScript + Vite Application
│   ├── src/
│   │   ├── services/           # Reusable API client (api.ts)
│   │   ├── test/               # Vitest testing setup (setup.ts)
│   │   ├── types/              # Strict TypeScript definitions (api.ts)
│   │   ├── App.tsx             # Main responsive application component
│   │   ├── App.css             # Component styling
│   │   └── index.css           # Vanilla CSS design system tokens
│   ├── .env.example            # Frontend environment template
│   ├── package.json            # Node scripts and dependencies
│   ├── tsconfig.app.json       # TypeScript strict configuration
│   └── vite.config.ts          # Vite & Vitest configuration
│
├── docs/                       # Architecture & Product Specifications
│   ├── README.md               # Documentation Index
│   ├── 01_PRD.md               # Product Requirements Document
│   ├── 02_ARCHITECTURE_AND_DESIGN.md
│   ├── 03_SECURITY_PRIVACY_AND_BUDGET.md
│   └── 04_PHASED_IMPLEMENTATION_PLAN.md
│
├── .env.example                # Monorepo environment template
├── .gitignore                  # Git ignore rules for Python & Node
└── README.md                   # This setup & operations guide
```

---

## 3. Prerequisites

- **Python:** 3.11+ (tested on Python 3.13)
- **Node.js:** v20+ or v24+ LTS
- **Package Managers:** `pip` and `npm`

---

## 4. Setup & Installation

### Step 1: Clone and Enter the Repository
```bash
git clone <repository_url>
cd JobMate
```

### Quick Start on Windows (1-Click or Direct PowerShell)

You can launch both services immediately using either the 1-click batch files or direct PowerShell commands without needing to mess with activation scripts or Linux `source` commands:

#### Option 1: 1-Click Launchers (Easiest)
- Double-click **`run-backend.bat`** in the repository root to start FastAPI (`http://127.0.0.1:8000`).
- Double-click **`run-frontend.bat`** in the repository root to start Vite React (`http://localhost:5173`).
- Double-click **`run-tests.bat`** to run both backend and frontend test suites.

#### Option 2: Direct Windows PowerShell Commands (No activation required)

> **Important Note for Windows Users:**  
> The `source` command is exclusive to Linux/macOS bash shells and does not exist in Windows PowerShell.  
> Furthermore, running activation scripts (`Activate.ps1`) is often blocked by Windows ExecutionPolicy.  
> You can run everything directly using the virtual environment's Python binary:

**Terminal 1 — Backend Server:**
```powershell
.\backend\.venv\Scripts\python.exe -m uvicorn app.main:app --app-dir backend --host 127.0.0.1 --port 8000 --reload
```
- **Backend URL:** `http://127.0.0.1:8000`
- **Health Check Endpoint:** `http://127.0.0.1:8000/health`
- **Interactive Swagger Docs:** `http://127.0.0.1:8000/docs`

**Terminal 2 — Frontend Dev Server:**
```powershell
npm.cmd --prefix frontend run dev
```
- **Frontend URL:** `http://localhost:5173`

---

## 5. Manual Setup & Activation Guide

If you prefer to manually configure or activate your environment:

### Windows PowerShell (With ExecutionPolicy Bypass)
```powershell
# Set execution policy for the current PowerShell process only
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass

# Activate virtual environment
.\backend\.venv\Scripts\Activate.ps1

# Run backend
uvicorn app.main:app --app-dir backend --host 127.0.0.1 --port 8000 --reload
```

### Linux / macOS
```bash
# Activate virtual environment
source backend/.venv/bin/activate

# Run backend
uvicorn app.main:app --app-dir backend --host 127.0.0.1 --port 8000 --reload
```

---

## 6. Running Tests

### Backend Tests (`pytest`)
```bash
# From backend directory (with .venv active):
pytest

# Or from repository root (Windows PowerShell):
.\backend\.venv\Scripts\pytest.exe backend
```
Expected output:
```text
tests/test_health.py::test_root_health_endpoint PASSED
tests/test_health.py::test_api_v1_health_endpoint PASSED
tests/test_health.py::test_root_endpoint PASSED
3 passed in ~0.6s
```

### Frontend Tests (`vitest`)
```bash
# From frontend directory:
npm run test

# Or from repository root:
npm --prefix frontend run test
```
Expected output:
```text
✓ src/App.test.tsx (4 tests)
Test Files  1 passed (1)
Tests       4 passed (4)
```

---

## 7. Phased Implementation Roadmap

- [x] **Phase 0:** Product Requirements Document (PRD), Architecture & Budget Plan.
- [x] **Phase 0.5 (Current):** Monorepo Scaffolding, Backend FastAPI + `/health`, Frontend React + TypeScript + Vitest, Reusable API Client.
- [ ] **Phase 1:** Core Ingestion Engine (`pdfplumber` PDF text extractor, Indian IT skill taxonomy dictionary, section parser).
- [ ] **Phase 2:** Alignment Engine & Truthful LLM Assistant (Gemini Flash API, STAR/XYZ bullet rewriter).
- [ ] **Phase 3:** Frontend Alignment Dashboard (Drag-and-drop PDF upload, JD input, keyword grid, evidence viewer).
- [ ] **Phase 4:** Downloadable Analysis Report (`@media print` one-click PDF export) & End-to-End integration.
- [ ] **Phase 5:** Security hardening, DPDP 2023 compliance audit, and production deployment scripts.

---

## 8. Documentation Reference

Detailed specifications are available in the [`docs/`](docs/README.md) folder:
- [PRD (Product Requirements Document)](docs/01_PRD.md)
- [System Architecture & API Contracts](docs/02_ARCHITECTURE_AND_DESIGN.md)
- [Security, DPDP 2023 Privacy & Budget Model](docs/03_SECURITY_PRIVACY_AND_BUDGET.md)
- [Phased Implementation & Test Strategy](docs/04_PHASED_IMPLEMENTATION_PLAN.md)
