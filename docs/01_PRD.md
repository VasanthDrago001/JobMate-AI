# JobMate AI — Product Requirements Document (PRD)

**Document Version:** 1.0.0  
**Target Audience:** Technical Lead, Founder/Engineer, Stakeholders  
**Status:** Under Review (Phase 0)  

---

## 1. Executive Summary & Problem Statement

### 1.1 The Context: Indian IT Job Market
The Indian tech hiring ecosystem is distinctively high-volume and hyper-competitive. Every year, over 1.5 million engineering graduates enter the workforce alongside hundreds of thousands of IT professionals seeking lateral moves between IT services firms (e.g., TCS, Infosys, Wipro, Cognizant), Global Capability Centers (GCCs), and high-growth product startups.

A single mid-level software engineering opening in Bengaluru, Pune, or Hyderabad receives between 500 to 5,000+ applicants within 48 hours on platforms like LinkedIn and Naukri.

### 1.2 The Core Problem
1. **Blind Submissions & Keyword Disconnect:** Job seekers often submit a generic resume without knowing which core technologies, frameworks, or architectural concepts from the specific Job Description (JD) are missing or buried in their CV.
2. **Deceptive "ATS Checker" Snake Oil:** Existing commercial tools claim "ATS score: 85%" or "Guaranteed shortlist", misleading candidates into believing automated filters possess proprietary scoring formulas. In reality, most Applicant Tracking Systems (Workday, Greenhouse, Lever, Taleo) do basic boolean search and keyword filtering; human recruiters make the shortlist decision.
3. **Harmful AI Hallucinations:** Generative AI tools (e.g., raw ChatGPT prompts) frequently invent metrics ("improved latency by 43.7% using Kafka" when the candidate only did basic message publishing) or invent skills the candidate never had. If caught in a technical interview, the candidate is blacklisted.
4. **Privacy Concerns:** Job seekers are hesitant to upload full resumes containing phone numbers, addresses, and current employer details to obscure websites that sell candidate data.

### 1.3 The Mission of JobMate AI
JobMate AI is a transparent, privacy-first, and truthful resume-to-JD alignment assistant designed specifically for Indian IT job seekers. It eliminates false promises, extracts real evidence, highlights keyword gaps without hallucination, and guides users to improve their bullet points using verified STAR/XYZ formulas based *only* on work they actually performed.

---

## 2. Target Personas

| Persona | Profile & Background | Pain Points | Primary Goal with JobMate AI |
| :--- | :--- | :--- | :--- |
| **Persona A: Service-to-Product Aspirant** (Ravi, 3 YOE) | Backend developer at a tier-1 service company working on legacy Java/Spring and maintenance. Wants to switch to a tier-2 product company or GCC. | His resume is written in generic corporate jargon ("Responsible for code fixes and client communication"). He doesn't know how to highlight microservices, Docker, or SQL optimization that matches modern JDs. | Identify missing keywords; restructure vague responsibility bullets into high-impact truthful engineering achievements. |
| **Persona B: Fresher / Campus Graduate** (Ananya, Final Year B.Tech) | CSE graduate from a Tier-2/3 college applying via off-campus drives (TCS NQT, Cognizant, startup job portals). | Has academic projects (MERN, Python) but resume contains buzzword stuffing or generic templates from Canva with no clear tech stack evidence. | Match her project bullet points to junior JD requirements; ensure foundational skills (Git, REST APIs, SQL) are clearly backed by project context. |
| **Persona C: Lateral Specialist** (Karthik, 6 YOE) | Full-stack developer (React + Node/Python) targeting Senior SDE roles with specific architectural requirements (Kafka, Redis, AWS). | Has done the work but his resume doesn't prominently show evidence for senior-level skills required in specific JDs. | Quickly audit match across multiple JDs to tailor his core strengths without rewriting his resume from scratch. |

---

## 3. Product Principles & Uncompromising Rules

1. **Absolute Truthfulness (Zero Hallucination):** 
   - Never invent candidate skills, metrics, achievements, employer names, or project scopes.
   - If a metric is missing from a bullet point, prompt the user with explicit placeholders: e.g., `"[Quantify: e.g., reduced response time from X ms to Y ms, or query count reduced]"`.
2. **No Deceptive ATS Claims:**
   - The app must **never** claim an "ATS Selection Score" or promise interviews.
   - The primary metric is clearly labeled: **"Keyword Alignment & Evidence Coverage"** with an explicit disclaimer: *"This score reflects lexical and contextual overlap with the submitted job description. Hiring decisions depend on recruiter evaluation and verified experience."*
3. **Data Minimization & Ephemeral Privacy:**
   - Resumes belong to the user. PDF processing is ephemeral by default. Resumes are not stored permanently unless the user explicitly logs in and saves a profile.
   - Option to redact or mask PII (Phone, Email, Current Salary, Address) before any downstream processing.
4. **Cost Discipline (₹0–₹5,000 Budget):**
   - Maximize deterministic/rule-based matching for skill extraction (zero token cost).
   - Use LLM calls selectively only for high-value tasks (semantic gap classification & truthful bullet rewriting).
   - Enforce server-side rate limits and payload size constraints.

---

## 4. MVP Scope vs. Future Roadmap

### 4.1 In Scope (Phase 1 MVP)
1. **Resume Ingestion:**
   - Upload PDF resume (max 5 MB, max 3 pages).
   - Client-side pre-validation + server-side validation (file signature, mime type).
   - Text & layout extraction with robust section detection (Experience, Projects, Skills, Education).
2. **Job Description Ingestion:**
   - Clean paste input field (min 100 characters, max 10,000 characters).
   - Role title input (optional/auto-detected).
3. **Skill & Keyword Extraction:**
   - Hybrid extraction engine (curated Indian IT skill taxonomy + contextual LLM extraction).
   - Categorization: Core Technical Skills, Frameworks/Libraries, Cloud/DevOps, Databases, Methodologies/Architecture.
4. **Keyword Gap & Evidence Analysis:**
   - **Matched Keywords:** Shows exact snippet/line where the skill appears in the resume.
   - **Missing Keywords:** Key requirements present in JD but absent in resume, grouped into *High Priority (Must-Have)* and *Secondary (Good-to-Have)*.
   - Transparent Alignment Percentage: `(Matched Core Skills / Total JD Core Skills) * 100`.
5. **Truthful Bullet Improvement Assistant:**
   - Identifies weak bullet points in the candidate's resume (passive voice, missing impact, vague duties).
   - Suggests rewrites using the Google XYZ formula (`Accomplished [X] as measured by [Y], by doing [Z]`) or STAR method.
   - Strict server-side verification: Rewrites only restructure existing candidate evidence.
6. **Downloadable Analysis Report:**
   - Instant downloadable summary report (clean PDF / print layout or structured Markdown) with match breakdown, evidence map, and tailored bullet recommendations.
7. **Responsive Web UI:**
   - Desktop and mobile-optimized web interface (Fast, clean, high-contrast, professional design).

### 4.2 Explicitly Out of Scope (Do NOT Build in MVP)
- Real-time job board scraping or current job opening listings.
- Company-specific official application links.
- Personalized multi-week preparation roadmaps.
- Voice/text resume-based mock interview practice.
- Quizzes, badges, points, or gamification features.
- Paid payment gateway integrations (Razorpay/Stripe).

---

## 5. Functional Requirements (FR)

### FR-1: Resume Upload & Parsing
- **FR-1.1:** System shall accept `.pdf` files up to 5 MB in size.
- **FR-1.2:** System shall verify file magic bytes (`%PDF-`) to reject renamed non-PDF files.
- **FR-1.3:** System shall reject password-protected or encrypted PDFs with a descriptive user message.
- **FR-1.4:** System shall handle both single-column and standard two-column PDF formats.
- **FR-1.5:** System shall parse text content and retain line/section continuity.
- **FR-1.6:** If the PDF is a scanned image (text layer absent or < 50 characters), system shall display an alert advising the user to upload a text-based PDF (OCR is excluded from MVP to maintain ₹0 operational budget).

### FR-2: Job Description Parsing
- **FR-2.1:** System shall accept text input between 100 and 10,000 characters.
- **FR-2.2:** System shall sanitize input to strip malicious scripts or unwanted markdown formatting.
- **FR-2.3:** System shall parse and classify JD skills into:
  - Required / Must-Have Skills (e.g., "Must have 3+ years in Python, FastAPI")
  - Preferred / Nice-to-Have Skills (e.g., "Knowledge of Kubernetes is a plus")
  - Tools & Methodologies (e.g., Jira, Agile, CI/CD)

### FR-3: Alignment Engine & Evidence Verification
- **FR-3.1:** Engine shall match resume terms to JD terms using lemmatization, exact matches, and synonym mapping (e.g., "Postgres" = "PostgreSQL", "ReactJS" = "React", "K8s" = "Kubernetes").
- **FR-3.2:** For every matched keyword, engine shall store and display the exact resume snippet (surrounding sentence/bullet) as **Evidence**.
- **FR-3.3:** For every missing keyword, engine shall check if it's a foundational prerequisite or optional tool.
- **FR-3.4:** System shall calculate an Alignment Ratio: `Matched / Total Identified JD Skills`.

### FR-4: Bullet Point Rewriter (Truthful AI Assistant)
- **FR-4.1:** System shall allow user to select up to 3-5 existing bullet points from their parsed resume to improve.
- **FR-4.2:** System shall send the original bullet along with relevant JD context to the LLM API using strict non-hallucination prompts.
- **FR-4.3:** LLM response must include:
  - Original Bullet
  - Improved Rewrite (Active verb + Context + Truthful mechanism)
  - Clear Guidance on how to quantify results if candidate possesses real metrics.
  - Explanation of what changed and why.

### FR-5: Report Generation & Export
- **FR-5.1:** System shall display a comprehensive interactive dashboard containing:
  - Alignment summary metrics
  - Match grid (Found vs. Missing)
  - Interactive Evidence drawer
  - Rewritten bullet cards
- **FR-5.2:** System shall allow single-click export of this analysis into a clean, printable PDF report or structured Markdown download without incurring server rendering overhead.

---

## 6. Non-Functional Requirements (NFR)

### NFR-1: Performance & Latency
- PDF parsing time: < 1.5 seconds for a 2-page PDF.
- Deterministic keyword extraction: < 500 milliseconds.
- End-to-end analysis response (including LLM call): < 6.0 seconds under normal network conditions.
- Frontend initial page load (FCP): < 1.2 seconds on 4G connections.

### NFR-2: Cost & Resource Utilization
- Zero fixed infrastructure cost for MVP:
  - Database: Supabase Free Tier (500MB PostgreSQL, 50,000 MAU).
  - Backend: Local development / Render Free Web Service or Railway Free Credit.
  - Frontend: Vercel / Cloudflare Pages Free Tier (Unlimited bandwidth/SSL).
  - LLM: Google Gemini 1.5/2.0 Flash (Free tier: 15 RPM, 1,500 requests/day, $0.00).

### NFR-3: Privacy & Security
- Resumes parsed in-memory; temporary files deleted immediately upon processing.
- No public S3/Supabase storage buckets for candidate resumes.
- User email/phone masked prior to any third-party AI API calls if user opts for privacy mode.
- Strict Content Security Policy (CSP) and CORS configuration.

### NFR-4: Usability & Accessibility
- Clean, intuitive interface with clear visual hierarchy.
- Mobile-responsive layout for review on smartphones.
- High contrast compliant with WCAG 2.1 AA standards.

---

## 7. Success Metrics for MVP

1. **Analysis Completion Rate:** > 85% of users who upload a resume and paste a JD reach the final report screen.
2. **Speed & Reliability:** 0 unhandled 500 errors on valid text PDFs; average parsing + matching latency < 5 seconds.
3. **Truthfulness Score:** 100% compliance with zero-hallucination rule across all test fixtures.
4. **Budget Adherence:** Total infrastructure spend remains ₹0 during development and < ₹500/month in early beta.
