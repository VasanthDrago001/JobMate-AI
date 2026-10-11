# JobMate AI — Documentation Index

Welcome to the technical and architectural documentation for **JobMate AI**, a targeted web application built for Indian IT job seekers.

## Documentation Structure

1. **[01_PRD.md](file:///d:/JobMate/docs/01_PRD.md)** — **Product Requirements Document**
   - Problem statement, user personas, market context (Indian IT ecosystem)
   - Core MVP scope & explicit non-goals
   - Functional & non-functional requirements
   - Ethical AI rules & guardrails against deceptive ATS scoring

2. **[02_ARCHITECTURE_AND_DESIGN.md](file:///d:/JobMate/docs/02_ARCHITECTURE_AND_DESIGN.md)** — **System Architecture & Technical Specifications**
   - High-level architecture & data flow diagrams
   - PDF library evaluation & technical justification (`pdfplumber` vs `pypdf` vs `PyMuPDF`)
   - Skill extraction & hybrid deterministic-LLM strategy
   - Database schema (PostgreSQL / Supabase with Row-Level Security)
   - REST API contracts (OpenAPI / Pydantic specifications)
   - Monorepo folder structure for FastAPI backend & React/Vite frontend

3. **[03_SECURITY_PRIVACY_AND_BUDGET.md](file:///d:/JobMate/docs/03_SECURITY_PRIVACY_AND_BUDGET.md)** — **Security, Privacy & Budget Analysis**
   - Data privacy & compliance with India's **Digital Personal Data Protection (DPDP) Act, 2023**
   - PDF file upload security, PII handling, and prompt injection defenses
   - LLM cost model & ₹0–₹5,000 budget breakdown (Free-tier optimization + scaling projections)

4. **[04_PHASED_IMPLEMENTATION_PLAN.md](file:///d:/JobMate/docs/04_PHASED_IMPLEMENTATION_PLAN.md)** — **Phased Implementation Roadmap & Testing Plan**
   - 5 structured delivery phases (Setup -> Core Parser -> Match Engine -> UI & Report -> Polish & Launch)
   - Phase-by-phase acceptance criteria & test cases (`pytest` + `vitest`)
   - Architectural decisions checklist requiring founder approval before coding
