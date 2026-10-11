import React from 'react';
import type { AppView } from '../../types/analysis';

interface FooterProps {
  onNavigate: (view: AppView) => void;
}

export const Footer: React.FC<FooterProps> = ({ onNavigate }) => {
  return (
    <footer className="app-footer" role="contentinfo">
      <div className="container footer-container">
        <div className="footer-top">
          <div className="footer-brand">
            <div className="footer-logo">
              <span className="logo-badge-sm">JM</span>
              <span className="footer-title">JobMate AI</span>
            </div>
            <p className="footer-desc">
              Transparent, privacy-first resume alignment and truthful STAR/XYZ bullet optimization
              built specifically for Indian IT job seekers.
            </p>
          </div>

          <div className="footer-links-group">
            <h4 className="footer-heading">Platform</h4>
            <ul className="footer-list">
              <li>
                <button
                  type="button"
                  className="footer-link-btn"
                  onClick={() => onNavigate('landing')}
                >
                  Overview & Methodology
                </button>
              </li>
              <li>
                <button
                  type="button"
                  className="footer-link-btn"
                  onClick={() => onNavigate('analyzer')}
                >
                  Resume Analyzer
                </button>
              </li>
              <li>
                <button
                  type="button"
                  className="footer-link-btn"
                  onClick={() => onNavigate('jobs')}
                >
                  Job Finder 🎯
                </button>
              </li>
              <li>
                <button
                  type="button"
                  className="footer-link-btn"
                  onClick={() => onNavigate('privacy')}
                >
                  Privacy Notice & DPDP 2023
                </button>
              </li>
            </ul>
          </div>

          <div className="footer-compliance">
            <h4 className="footer-heading">Data Rights & Ethics</h4>
            <div className="compliance-badge">
              <span className="compliance-icon" aria-hidden="true">
                🛡️
              </span>
              <div>
                <strong>India DPDP Act 2023</strong>
                <p>
                  Zero persistent storage. Resumes are processed in ephemeral memory and discarded
                  immediately.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="footer-disclaimer-box">
          <p>
            <strong>Fair Use & Ethical Notice:</strong> JobMate AI does not generate fictitious work
            histories, unverified skills, or false metrics. We do not partner with or scrape job
            portals, nor do we claim proprietary ATS scoring formulas. Evaluation is based purely on
            lexical and conceptual comparison against your target job description.
          </p>
        </div>

        <div className="footer-bottom">
          <p>© 2026 JobMate AI. Open Engineering Preview. All rights reserved.</p>
          <div className="footer-meta">
            <span>React + TypeScript</span>
            <span className="separator">•</span>
            <span>FastAPI Python</span>
            <span className="separator">•</span>
            <span>₹0 Fixed Infrastructure</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
