import React from 'react';
import type { AppView } from '../../types/analysis';

interface EmptyStateProps {
  onNavigate: (view: AppView) => void;
  onLoadSample: () => void;
}

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
