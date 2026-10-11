import React from 'react';
import type { MatchedSkill } from '../../types/analysis';

interface EvidenceDrawerProps {
  skill: MatchedSkill | null;
  onClose: () => void;
}

export const EvidenceDrawer: React.FC<EvidenceDrawerProps> = ({ skill, onClose }) => {
  if (!skill) return null;

  return (
    <div
      className="evidence-drawer-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="evidence-drawer-title"
      onClick={onClose}
    >
      <div
        className="evidence-drawer glass-card"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="drawer-header">
          <div className="drawer-title-group">
            <span className="skill-cat-pill">{skill.category}</span>
            <h3 id="evidence-drawer-title" className="drawer-skill-name">
              Evidence for: <span className="highlight-text">{skill.name}</span>
            </h3>
          </div>
          <button
            type="button"
            className="drawer-close-btn"
            onClick={onClose}
            aria-label="Close evidence drawer"
          >
            ×
          </button>
        </div>

        <div className="drawer-body">
          <div className="evidence-section-meta">
            <span className="meta-item">
              <strong>Resume Section:</strong> {skill.section}
            </span>
            {skill.pageNumber && (
              <span className="meta-item">
                <strong>Page:</strong> {skill.pageNumber}
              </span>
            )}
          </div>

          <div className="evidence-quote-box">
            <span className="quote-label">Exact Snippet Located in Your Resume:</span>
            <blockquote className="quote-text">
              &ldquo;{skill.evidenceSnippet}&rdquo;
            </blockquote>
          </div>

          <div className="evidence-verdict">
            <span className="verdict-icon" aria-hidden="true">
              ✅
            </span>
            <div className="verdict-text">
              <strong>Verified Alignment:</strong> Technical interviewers can corroborate this
              claim against your actual resume text.
            </div>
          </div>
        </div>

        <div className="drawer-footer">
          <button type="button" className="btn btn-secondary btn-sm" onClick={onClose}>
            Close Evidence Window
          </button>
        </div>
      </div>
    </div>
  );
};
