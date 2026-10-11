import React from 'react';

interface ErrorStateProps {
  errorMessage: string;
  onRetry: () => void;
  onReset: () => void;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  errorMessage,
  onRetry,
  onReset,
}) => {
  return (
    <div
      className="error-state-wrapper container"
      role="alert"
      aria-live="assertive"
    >
      <div className="glass-card error-card" data-testid="error-state-card">
        <div className="error-icon" aria-hidden="true">
          ⚠️
        </div>
        <h2 className="error-title">Analysis Interrupted</h2>
        <p className="error-message">{errorMessage}</p>

        <div className="error-troubleshooting-tips">
          <h4>Common Quick Checks:</h4>
          <ul>
            <li>Ensure the uploaded file is a valid, unencrypted PDF.</li>
            <li>Ensure your target job description contains at least 50 characters.</li>
            <li>Verify you have affirmed the DPDP 2023 consent checkbox.</li>
          </ul>
        </div>

        <div className="error-actions">
          <button type="button" className="btn btn-primary" onClick={onRetry}>
            🔄 Try Again
          </button>
          <button type="button" className="btn btn-secondary" onClick={onReset}>
            Edit Inputs
          </button>
        </div>
      </div>
    </div>
  );
};
