import React from 'react';

interface PrivacyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PrivacyModal: React.FC<PrivacyModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div
      className="modal-backdrop"
      role="dialog"
      aria-modal="true"
      aria-labelledby="privacy-modal-title"
      onClick={onClose}
    >
      <div
        className="modal-content glass-card"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <h2 id="privacy-modal-title">Privacy Policy & Ethical Terms</h2>
          <button
            type="button"
            className="modal-close-btn"
            onClick={onClose}
            aria-label="Close modal"
          >
            ×
          </button>
        </div>

        <div className="modal-body">
          <div className="privacy-item">
            <h4>🛡️ India DPDP Act 2023 Compliance</h4>
            <p>
              Your resume PDF is parsed strictly in-memory. We never save your document to persistent
              storage or databases. PII (phone number, email address) is filtered out before any AI
              analysis.
            </p>
          </div>

          <div className="privacy-item">
            <h4>🎯 No Snake-Oil Scoring</h4>
            <p>
              We measure keyword alignment with the job description you supply. We do not make claims
              predicting automated ATS shortlisting or guaranteed hiring.
            </p>
          </div>

          <div className="privacy-item">
            <h4>✍️ Zero Hallucinations Policy</h4>
            <p>
              Bullet suggestions only re-format work you actually accomplished using the STAR/XYZ
              structure. Never adopt a suggested bullet point unless it truthfully reflects your
              experience.
            </p>
          </div>
        </div>

        <div className="modal-footer">
          <button type="button" className="btn btn-primary" onClick={onClose}>
            I Understand & Agree
          </button>
        </div>
      </div>
    </div>
  );
};
