import React from 'react';
import type { AppView } from '../../types/analysis';

interface LandingPageProps {
  onNavigate: (view: AppView) => void;
  onLoadSample: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onNavigate, onLoadSample }) => {
  return (
    <div className="landing-page container">
      {/* Hero Section */}
      <section className="hero-section" aria-labelledby="hero-heading">
        <div className="hero-pill-tag">
          <span className="pill-dot" aria-hidden="true" />
          <span>Engineered for Indian IT Job Seekers</span>
        </div>

        <h1 id="hero-heading" className="hero-title">
          Targeted, Truthful Resume Alignment with{' '}
          <span className="gradient-text">Zero Hallucinations</span>
        </h1>

        <p className="hero-subtitle">
          Stop guessing why your CV gets rejected. Match your resume against any target Job
          Description, uncover missing tech stack keywords, verify line-by-line evidence, and polish
          bullet points using the proven Google XYZ formula.
        </p>

        <div className="hero-cta-group">
          <button
            type="button"
            className="btn btn-primary btn-lg"
            onClick={() => onNavigate('analyzer')}
            id="cta-start-analyzer"
          >
            Launch Resume Analyzer →
          </button>
          <button
            type="button"
            className="btn btn-secondary btn-lg"
            onClick={onLoadSample}
            id="cta-try-sample"
          >
            🧪 Load Sample Profile & JD
          </button>
        </div>

        <div className="hero-metrics-strip">
          <div className="metric-item">
            <span className="metric-val">850+</span>
            <span className="metric-lbl">Indian IT Tech Stacks</span>
          </div>
          <div className="metric-item">
            <span className="metric-val">100%</span>
            <span className="metric-lbl">Truthful Evidence Mapping</span>
          </div>
          <div className="metric-item">
            <span className="metric-val">₹0</span>
            <span className="metric-lbl">Cost / No Hidden Paywalls</span>
          </div>
          <div className="metric-item">
            <span className="metric-val">DPDP 2023</span>
            <span className="metric-lbl">Ephemeral In-Memory Privacy</span>
          </div>
        </div>
      </section>

      {/* How It Works Pipeline */}
      <section className="pipeline-section" aria-labelledby="pipeline-heading">
        <div className="section-header">
          <span className="section-eyebrow">Methodology</span>
          <h2 id="pipeline-heading" className="section-title">
            How JobMate AI Analyzes Your Profile
          </h2>
          <p className="section-desc">
            A transparent 3-step alignment engine built without black-box scoring or fabricated skills.
          </p>
        </div>

        <div className="pipeline-cards-grid">
          <div className="glass-card pipeline-card">
            <div className="step-badge">Step 1</div>
            <div className="card-icon" aria-hidden="true">
              📄
            </div>
            <h3>PDF Parsing & Layout Analysis</h3>
            <p>
              Extracts text from single-column or complex Canva two-column PDFs without interleaving
              sidebar skill tokens into your work experience history.
            </p>
          </div>

          <div className="glass-card pipeline-card">
            <div className="step-badge">Step 2</div>
            <div className="card-icon" aria-hidden="true">
              🎯
            </div>
            <h3>Lexical & Evidence Gap Mapping</h3>
            <p>
              Maps your resume against the target JD using a curated Indian tech taxonomy and
              synonym mapper. Locates the exact context sentence for every matched skill.
            </p>
          </div>

          <div className="glass-card pipeline-card">
            <div className="step-badge">Step 3</div>
            <div className="card-icon" aria-hidden="true">
              ✍️
            </div>
            <h3>Truthful STAR / XYZ Enhancement</h3>
            <p>
              Restructures vague responsibility bullets into high-impact engineering accomplishments
              without inventing false metrics, companies, or unperformed tasks.
            </p>
          </div>
        </div>
      </section>

      {/* Comparison: Deceptive Tools vs JobMate AI */}
      <section className="comparison-section" aria-labelledby="comparison-heading">
        <div className="section-header">
          <span className="section-eyebrow">The Honesty Pledge</span>
          <h2 id="comparison-heading" className="section-title">
            Why JobMate AI Rejects &quot;ATS Score&quot; Snake Oil
          </h2>
          <p className="section-desc">
            Indian tech professionals deserve genuine engineering alignment, not marketing gimmicks.
          </p>
        </div>

        <div className="glass-card table-card">
          <div className="table-responsive">
            <table className="comparison-table">
              <thead>
                <tr>
                  <th>Feature / Standard</th>
                  <th className="th-competitor">Commercial &quot;ATS Checkers&quot;</th>
                  <th className="th-jobmate">JobMate AI Standard</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>
                    <strong>Score Calculation</strong>
                  </td>
                  <td className="td-bad">
                    ❌ Fabricated &quot;95% ATS Pass Probability&quot;
                  </td>
                  <td className="td-good">
                    ✅ Transparent keyword & evidence coverage ratio
                  </td>
                </tr>
                <tr>
                  <td>
                    <strong>Skill Evidence</strong>
                  </td>
                  <td className="td-bad">❌ Blind keyword counts with no context</td>
                  <td className="td-good">
                    ✅ Pinpoints exact sentence & section where skill appears
                  </td>
                </tr>
                <tr>
                  <td>
                    <strong>Generative Bullet Rewrites</strong>
                  </td>
                  <td className="td-bad">
                    ❌ Hallucinates fake 40% metrics & tools you never used
                  </td>
                  <td className="td-good">
                    ✅ Strict non-hallucination guardrails + guidance placeholders
                  </td>
                </tr>
                <tr>
                  <td>
                    <strong>Data Privacy & Retention</strong>
                  </td>
                  <td className="td-bad">
                    ❌ Resumes stored on servers and shared with recruiters
                  </td>
                  <td className="td-good">
                    ✅ In-memory ephemeral processing (DPDP Act 2023 compliant)
                  </td>
                </tr>
                <tr>
                  <td>
                    <strong>Target Demographics</strong>
                  </td>
                  <td className="td-bad">❌ Generic US/Western corporate templates</td>
                  <td className="td-good">
                    ✅ Tailored for Indian IT (Services, GCCs, Product startups)
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Bottom CTA Banner */}
      <section className="cta-banner glass-card">
        <div className="cta-content">
          <h2>Ready to align your CV with your dream role?</h2>
          <p>
            Upload your PDF and paste your target Job Description. No credit card, no sign-up required.
          </p>
        </div>
        <button
          type="button"
          className="btn btn-primary btn-lg"
          onClick={() => onNavigate('analyzer')}
        >
          Open Analyzer Now →
        </button>
      </section>
    </div>
  );
};
