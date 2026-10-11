import React, { useState } from 'react';
import { PdfUploader } from './PdfUploader';
import { PrivacyModal } from '../common/PrivacyModal';
import type { AnalysisFormData } from '../../types/analysis';
import {
  SAMPLE_JOB_DESCRIPTION,
  SAMPLE_RESUME_FILENAME,
} from '../../services/mockData';

interface AnalyzerPageProps {
  formData: AnalysisFormData;
  onChangeFormData: (data: Partial<AnalysisFormData>) => void;
  onSubmitAnalysis: () => void;
  onLoadSample: () => void;
}

const COMMON_ROLES = [
  'Senior Backend Engineer (FastAPI / Python)',
  'Full-Stack Developer (React + Node / Python)',
  'Frontend Software Engineer (React / TypeScript)',
  'DevOps / Cloud Engineer (AWS / Docker / K8s)',
  'Data Engineer (SQL / Python / Spark)',
];

/**
 * Resume and Job Description Analyzer input form page.
 *
 * Captures PDF upload, target role designation, job description requirements,
 * and mandatory affirmative DPDP Act 2023 consent before initiating analysis.
 */
export const AnalyzerPage: React.FC<AnalyzerPageProps> = ({
  formData,
  onChangeFormData,
  onSubmitAnalysis,
  onLoadSample,
}) => {
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [validationAttempted, setValidationAttempted] = useState(false);

  const isFileValid = Boolean(formData.resumeFileName || formData.resumeFile);
  const isJdValid = formData.jobDescription.trim().length >= 50;
  const isConsentValid = formData.consentGiven;

  /**
   * Validates form completeness (file, JD length >= 50 chars, consent affirmed)
   * and dispatches analysis initiation.
   */
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setValidationAttempted(true);

    if (isFileValid && isJdValid && isConsentValid) {
      onSubmitAnalysis();
    }
  };

  /**
   * Updates target role when a suggested role pill is clicked.
   */
  const handleRoleSelect = (role: string) => {
    onChangeFormData({ targetRole: role });
  };


  const charCount = formData.jobDescription.length;

  return (
    <div className="analyzer-page container">
      <div className="analyzer-header-block">
        <h1 className="page-title">Resume & Job Description Analyzer</h1>
        <p className="page-subtitle">
          Extract skills, identify matching and not-found keywords, reveal resume evidence, and
          generate truthful STAR/XYZ bullet improvements.
        </p>

        {/* Quick Sample Demo Banner */}
        <div className="demo-helper-bar glass-card">
          <div className="demo-helper-text">
            <span className="sparkle-icon" aria-hidden="true">
              ✨
            </span>
            <span>
              <strong>Evaluating JobMate AI?</strong> You can load a sample Indian IT Full-Stack /
              Backend resume & JD in one click.
            </span>
          </div>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={onLoadSample}
            id="btn-fill-sample"
          >
            Load Sample Profile
          </button>
        </div>
      </div>

      <form className="analyzer-form glass-card" onSubmit={handleSubmit} noValidate>
        {/* Field 1: Target Job Title */}
        <div className="form-group">
          <label htmlFor="target-role-input" className="form-label">
            Target Job Title / Role <span className="optional-text">(Recommended)</span>
          </label>
          <input
            type="text"
            id="target-role-input"
            className="form-input"
            placeholder="e.g. Senior Backend Engineer / SDE-2"
            value={formData.targetRole}
            onChange={(e) => onChangeFormData({ targetRole: e.target.value })}
            maxLength={120}
          />

          <div className="quick-suggestions-row">
            <span className="suggestions-label">Quick select:</span>
            <div className="suggestions-chips">
              {COMMON_ROLES.map((role) => (
                <button
                  type="button"
                  key={role}
                  className={`chip-btn ${formData.targetRole === role ? 'chip-active' : ''}`}
                  onClick={() => handleRoleSelect(role)}
                >
                  {role}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Field 2: PDF Upload */}
        <div className="form-group">
          <PdfUploader
            selectedFile={formData.resumeFile}
            fileName={formData.resumeFileName}
            onFileSelect={(file, name) =>
              onChangeFormData({ resumeFile: file, resumeFileName: name })
            }
            error={
              validationAttempted && !isFileValid
                ? 'Please upload your resume PDF to begin analysis.'
                : null
            }
          />
        </div>

        {/* Field 3: Job Description Textarea */}
        <div className="form-group">
          <div className="label-with-action">
            <label htmlFor="job-description-input" className="form-label">
              2. Paste Target Job Description <span className="required-indicator">*</span>
            </label>
            <div className="label-actions">
              {formData.jobDescription && (
                <button
                  type="button"
                  className="text-btn btn-sm"
                  onClick={() => onChangeFormData({ jobDescription: '' })}
                >
                  Clear JD
                </button>
              )}
              <button
                type="button"
                className="text-btn btn-sm"
                onClick={() =>
                  onChangeFormData({
                    jobDescription: SAMPLE_JOB_DESCRIPTION,
                    targetRole: 'Senior Backend / Full-Stack Engineer (SDE-2)',
                    resumeFileName: formData.resumeFileName || SAMPLE_RESUME_FILENAME,
                  })
                }
              >
                Paste Sample JD
              </button>
            </div>
          </div>

          <textarea
            id="job-description-input"
            data-testid="job-description-input"
            className={`form-textarea ${
              validationAttempted && !isJdValid ? 'has-error' : ''
            }`}
            rows={8}
            placeholder="Paste the full job description from LinkedIn, Naukri, or company careers page here (include technical requirements, responsibilities, and qualifications)..."
            value={formData.jobDescription}
            onChange={(e) => onChangeFormData({ jobDescription: e.target.value })}
            maxLength={10000}
            aria-describedby="jd-char-counter"
          />

          <div className="textarea-footer">
            <span
              id="jd-char-counter"
              className={`char-counter ${charCount < 50 ? 'char-counter-low' : ''}`}
            >
              {charCount} / 10,000 characters {charCount < 50 && '(minimum 50 required)'}
            </span>
          </div>

          {validationAttempted && !isJdValid && (
            <p className="field-error-text" role="alert" data-testid="jd-error">
              ⚠️ Job description must be at least 50 characters long to extract meaningful technical
              skills.
            </p>
          )}
        </div>

        {/* Field 4: DPDP Consent Checkbox */}
        <div className="form-group consent-group">
          <div className="checkbox-container">
            <input
              type="checkbox"
              id="consent-checkbox"
              data-testid="consent-checkbox"
              checked={formData.consentGiven}
              onChange={(e) => onChangeFormData({ consentGiven: e.target.checked })}
              className="styled-checkbox"
            />
            <label htmlFor="consent-checkbox" className="checkbox-label">
              I consent to ephemeral, in-memory processing of my resume under India&apos;s{' '}
              <strong>Digital Personal Data Protection (DPDP) Act, 2023</strong>. I understand that
              JobMate AI does not store my document, sell candidate data, or claim to guarantee ATS
              hiring selections.{' '}
              <button
                type="button"
                className="text-btn inline-btn"
                onClick={() => setShowPrivacyModal(true)}
              >
                (View Privacy Terms)
              </button>
            </label>
          </div>

          {validationAttempted && !isConsentValid && (
            <p className="field-error-text" role="alert" data-testid="consent-error">
              ⚠️ Please confirm the consent checkbox to process your resume.
            </p>
          )}
        </div>

        {/* Submit Button */}
        <div className="form-submit-row">
          <button
            type="submit"
            className="btn btn-primary btn-lg submit-analyze-btn"
            id="btn-submit-analysis"
            data-testid="btn-submit-analysis"
          >
            ⚡ Analyze Resume & Skill Alignment
          </button>
        </div>
      </form>

      {/* Privacy Modal */}
      <PrivacyModal
        isOpen={showPrivacyModal}
        onClose={() => setShowPrivacyModal(false)}
      />
    </div>
  );
};
