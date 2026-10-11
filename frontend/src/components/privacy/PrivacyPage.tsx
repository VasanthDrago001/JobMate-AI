import React from 'react';
import type { AppView } from '../../types/analysis';

interface PrivacyPageProps {
  onNavigate: (view: AppView) => void;
}

export const PrivacyPage: React.FC<PrivacyPageProps> = ({ onNavigate }) => {
  return (
    <div className="privacy-page container">
      <div className="page-header-block">
        <div className="breadcrumb-nav">
          <button type="button" className="text-btn" onClick={() => onNavigate('landing')}>
            ← Back to Home
          </button>
        </div>
        <h1 className="page-title">Privacy Policy & Service Limitations</h1>
        <p className="page-subtitle">
          Engineered in strict accordance with India&apos;s Digital Personal Data Protection (DPDP)
          Act, 2023 and ethical AI design standards.
        </p>
      </div>

      <div className="privacy-content-grid">
        <section className="glass-card privacy-card">
          <div className="privacy-card-header">
            <span className="section-icon" aria-hidden="true">
              🔒
            </span>
            <h2>1. Ephemeral Data Processing</h2>
          </div>
          <p>
            When you upload a PDF resume to JobMate AI, the document is parsed directly in memory.
            Your document is <strong>never written to permanent disk storage</strong>, nor is it stored
            in a database or cloud bucket. Once your analysis report is rendered in your browser, the
            in-memory representation is completely wiped.
          </p>
          <ul className="styled-list">
            <li>Zero server-side resume caching in guest mode.</li>
            <li>No database archiving of uploaded candidate resumes.</li>
            <li>No sharing with third-party headhunters, staffing agencies, or data brokers.</li>
          </ul>
        </section>

        <section className="glass-card privacy-card">
          <div className="privacy-card-header">
            <span className="section-icon" aria-hidden="true">
              ⚖️
            </span>
            <h2>2. Digital Personal Data Protection (DPDP) Act 2023</h2>
          </div>
          <p>
            In compliance with Section 6 and Section 12 of the DPDP Act 2023, JobMate AI respects your
            rights as a Data Principal:
          </p>
          <ul className="styled-list">
            <li>
              <strong>Purpose Limitation:</strong> Uploaded text is evaluated solely to calculate
              lexical skill alignment with your provided job description.
            </li>
            <li>
              <strong>PII Minimization:</strong> Phone numbers, email addresses, and postal addresses
              are automatically stripped before any contextual AI processing.
            </li>
            <li>
              <strong>Explicit Consent:</strong> Analysis never executes without your affirmative
              checkbox consent.
            </li>
          </ul>
        </section>

        <section className="glass-card privacy-card">
          <div className="privacy-card-header">
            <span className="section-icon" aria-hidden="true">
              🚫
            </span>
            <h2>3. Honest Service Limitations (No Snake Oil)</h2>
          </div>
          <p>
            Many commercial platforms advertise misleading &quot;ATS Scores&quot; claiming that
            achieving a 90% score guarantees recruiter shortlists. JobMate AI categorically rejects this:
          </p>
          <ul className="styled-list">
            <li>
              <strong>No ATS Prediction Claims:</strong> Applicant Tracking Systems (e.g., Workday,
              Greenhouse, Taleo) do not share proprietary scoring algorithms. Our score represents
              transparent keyword alignment and contextual evidence overlap.
            </li>
            <li>
              <strong>Human Recruiter Reality:</strong> Technical hiring decisions depend on portfolio
              depth, system design interviews, and verified project contributions.
            </li>
            <li>
              <strong>No Live Job Scraping:</strong> We do not show live job vacancies, scraped openings,
              or affiliate application links in this MVP.
            </li>
          </ul>
        </section>

        <section className="glass-card privacy-card">
          <div className="privacy-card-header">
            <span className="section-icon" aria-hidden="true">
              🤝
            </span>
            <h2>4. Truthful AI Guardrails</h2>
          </div>
          <p>
            JobMate AI enforces strict non-hallucination system constraints on generative bullet rewrites:
          </p>
          <ul className="styled-list">
            <li>The system will never invent metrics, percentages, tools, or companies.</li>
            <li>
              If a metric is missing, the AI injects explicit guidance prompts like{' '}
              <code>[Insert actual query latency or defect count if known]</code>.
            </li>
            <li>
              <strong>User Responsibility:</strong> You must never copy-paste suggested bullet points
              unless you personally performed the work described. Misrepresenting skills during Indian
              IT technical rounds leads to immediate disqualification.
            </li>
          </ul>
        </section>
      </div>

      <div className="privacy-cta-box glass-card">
        <h3>Ready to analyze your resume with complete peace of mind?</h3>
        <p>No account required. Instant, ephemeral processing.</p>
        <button
          type="button"
          className="btn btn-primary"
          onClick={() => onNavigate('analyzer')}
        >
          Open Resume Analyzer →
        </button>
      </div>
    </div>
  );
};
