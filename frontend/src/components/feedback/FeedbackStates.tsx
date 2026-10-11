import React from 'react';
import type { AppView } from '../../types/analysis';

export interface EmptyStateProps {
  onNavigate: (view: AppView) => void;
  onLoadSample: () => void;
}

/**
 * Empty State view displayed before any resume analysis has been conducted.
 */
export const EmptyState: React.FC<EmptyStateProps> = ({
  onNavigate,
  onLoadSample,
}) => {
  return (
    <div className="empty-state-wrapper container" role="region" aria-label="No analysis yet">
      <div className="glass-card empty-state-card" data-testid="empty-state-card">
        <div className="empty-state-icon" aria-hidden="true">
          📊
        </div>
        <h2 className="empty-state-title">No Active Analysis Report</h2>
        <p className="empty-state-desc">
          You haven&apos;t run an alignment scan yet. Upload your PDF resume and target job description
          to see matched keywords, contextual evidence, and truthful bullet rewrites.
        </p>
        <div className="empty-state-actions">
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => onNavigate('analyzer')}
          >
            Go to Resume Analyzer →
          </button>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={onLoadSample}
          >
            🧪 Load Sample Evaluation Profile
          </button>
        </div>
      </div>
    </div>
  );
};

export interface ErrorStateProps {
  errorMessage: string;
  onRetry: () => void;
  onReset: () => void;
}

/**
 * Error State view displayed when analysis fails or encounters input/network issues.
 */
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
