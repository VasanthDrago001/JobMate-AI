import React from 'react';
import type { StageInfo } from '../../types/analysis';

interface LoadingProgressProps {
  stageInfo: StageInfo;
  onCancel: () => void;
}

export const LoadingProgress: React.FC<LoadingProgressProps> = ({
  stageInfo,
  onCancel,
}) => {
  return (
    <div
      className="loading-screen-wrapper container"
      role="status"
      aria-live="polite"
      aria-label="Analyzing resume"
    >
      <div className="glass-card loading-card" data-testid="loading-card">
        <div className="loading-spinner-ring" aria-hidden="true">
          <div className="spinner-inner" />
        </div>

        <h2 className="loading-title">{stageInfo.title}</h2>
        <p className="loading-description">{stageInfo.description}</p>

        {/* Progress Bar */}
        <div className="progress-bar-container" aria-hidden="true">
          <div
            className="progress-bar-fill"
            style={{ width: `${stageInfo.progressPercent}%` }}
          />
        </div>

        <div className="progress-meta">
          <span className="progress-percent">{stageInfo.progressPercent}% Complete</span>
          <span className="progress-badge">Phase: {stageInfo.stage.replace(/_/g, ' ')}</span>
        </div>

        {/* Informative stage milestones */}
        <div className="stages-milestones-list">
          <div
            className={`milestone-item ${
              stageInfo.progressPercent >= 20 ? 'completed' : 'pending'
            }`}
          >
            <span className="milestone-dot" />
            <span>PDF Header & Layout Validation</span>
          </div>
          <div
            className={`milestone-item ${
              stageInfo.progressPercent >= 65 ? 'completed' : 'pending'
            }`}
          >
            <span className="milestone-dot" />
            <span>Indian IT Taxonomy Overlap (850+ terms)</span>
          </div>
          <div
            className={`milestone-item ${
              stageInfo.progressPercent >= 82 ? 'completed' : 'pending'
            }`}
          >
            <span className="milestone-dot" />
            <span>Contextual Resume Evidence Mapping</span>
          </div>
          <div
            className={`milestone-item ${
              stageInfo.progressPercent >= 95 ? 'completed' : 'pending'
            }`}
          >
            <span className="milestone-dot" />
            <span>Truthful STAR/XYZ Bullet Formulation</span>
          </div>
        </div>

        <div className="loading-cancel-row">
          <button type="button" className="text-btn btn-sm" onClick={onCancel}>
            Cancel Analysis
          </button>
        </div>
      </div>
    </div>
  );
};
