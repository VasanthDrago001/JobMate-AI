import React, { useState } from 'react';
import type {
  AnalysisResult,
  MatchedSkill,
  MissingSkill,
} from '../../types/analysis';
import { EvidenceDrawer } from './EvidenceDrawer';

interface ResultsPageProps {
  result: AnalysisResult;
  onReanalyze: () => void;
  onNavigateToJobs?: () => void;
  onNavigateToPrep?: () => void;
}

type FilterTab = 'all' | 'matched' | 'missing';

export const ResultsPage: React.FC<ResultsPageProps> = ({
  result,
  onReanalyze,
  onNavigateToJobs,
  onNavigateToPrep,
}) => {
  const [activeTab, setActiveTab] = useState<FilterTab>('all');
  const [selectedEvidenceSkill, setSelectedEvidenceSkill] =
    useState<MatchedSkill | null>(null);
  const [copiedBulletId, setCopiedBulletId] = useState<string | null>(null);

  const handleCopyBullet = async (id: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedBulletId(id);
      setTimeout(() => setCopiedBulletId(null), 2500);
    } catch {
      // Fallback if clipboard API is restricted
      setCopiedBulletId(id);
      setTimeout(() => setCopiedBulletId(null), 2500);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const { keywordCoverage, matchedSkills, missingSkills, bulletImprovements } =
    result;

  const mustHaveSkills = missingSkills.filter(
    (s: MissingSkill) => s.importance === 'Must-Have'
  );
  const goodToHaveSkills = missingSkills.filter(
    (s: MissingSkill) => s.importance === 'Good-to-Have'
  );

  const isUnableToScore = result.scoreStatus === 'unable_to_score';
  const partialSkills = result.partialSkills || [];

  return (
    <div className="results-page container" id="printable-report">
      {/* Top Action Bar (Hidden during print) */}
      <div className="results-action-bar no-print">
        <button
          type="button"
          className="text-btn btn-back"
          onClick={onReanalyze}
        >
          ← Edit JD or Upload Different Resume
        </button>

        <div className="action-buttons-group">
          {onNavigateToJobs && (
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={onNavigateToJobs}
              id="btn-nav-matching-jobs"
            >
              🎯 Matching Jobs ({matchedSkills.length})
            </button>
          )}
          {onNavigateToPrep && (
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={onNavigateToPrep}
              id="btn-nav-prep-roadmap"
            >
              💡 Prep Roadmap
            </button>
          )}
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={onReanalyze}
          >
            🔄 New Scan
          </button>
          <button
            type="button"
            className="btn btn-primary btn-sm btn-print"
            onClick={handlePrint}
            id="btn-print-report"
          >
            🖨️ Download / Print Report (PDF)
          </button>
        </div>
      </div>

      {/* Header Info Banner */}
      <div className="results-header-card glass-card">
        <div className="results-header-main">
          <div className="role-badge-row">
            <span className="target-role-badge">Target Role</span>
            {result.isMockDemo && (
              <span className="demo-evaluation-pill">
                🧪 Sample Profile Preview
              </span>
            )}
            {result.detectedSections && result.detectedSections.length > 0 && (
              <span className="demo-evaluation-pill" style={{ background: 'rgba(52, 211, 153, 0.15)', color: '#34d399' }}>
                📄 {result.pageCount ?? 1} Page(s) • {result.wordCount ?? 0} Words
              </span>
            )}
          </div>
          <h1 className="results-role-title">{result.targetRole}</h1>
          <div className="results-meta-row">
            <span>
              <strong>Resume:</strong> {result.resumeFileName}
            </span>
            <span className="separator">•</span>
            <span>
              <strong>Analyzed:</strong>{' '}
              {new Date(result.analyzedAt).toLocaleDateString('en-IN', {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </span>
            <span className="separator">•</span>
            <span>
              <strong>Engine:</strong> {result.scoringVersion || 'Indian IT Deterministic Matcher v1.0'}
            </span>
          </div>
        </div>
      </div>

      {/* Primary Metrics & Score Card */}
      <section
        className="glass-card coverage-summary-card"
        aria-labelledby="coverage-heading"
      >
        <div className="coverage-flex-container">
          {/* Radial / Circle Gauge */}
          <div className="coverage-gauge-box">
            <div
              className="gauge-circle"
              style={
                {
                  '--percentage': `${isUnableToScore ? 0 : keywordCoverage.percentage}%`,
                } as React.CSSProperties
              }
            >
              <div className="gauge-inner">
                <span className="gauge-number" data-testid="coverage-score">
                  {isUnableToScore ? 'N/A' : `${keywordCoverage.percentage}%`}
                </span>
                <span className="gauge-label">
                  {isUnableToScore ? 'No Skills' : 'Alignment'}
                </span>
              </div>
            </div>
          </div>

          {/* Breakdown Stats */}
          <div className="coverage-stats-box">
            <h2 id="coverage-heading" className="coverage-title">
              {isUnableToScore
                ? 'Unable to Calculate Keyword Alignment'
                : 'Technical Keyword Alignment Overview'}
            </h2>
            <p className="coverage-subtitle">
              {result.scoreMessage ||
                'Calculated across 850+ technology stacks and contextual synonym mappings.'}
            </p>

            <div className="stats-pills-grid">
              <div className="stat-card stat-matched">
                <span className="stat-card-num">{keywordCoverage.matchedCount}</span>
                <span className="stat-card-lbl">Matched Skills (Verified)</span>
              </div>
              {partialSkills.length > 0 && (
                <div className="stat-card stat-secondary" style={{ borderLeft: '3px solid #818cf8' }}>
                  <span className="stat-card-num">{partialSkills.length}</span>
                  <span className="stat-card-lbl">Partial / Related</span>
                </div>
              )}
              <div className="stat-card stat-must-have">
                <span className="stat-card-num">{mustHaveSkills.length}</span>
                <span className="stat-card-lbl">Missing Must-Have</span>
              </div>
              <div className="stat-card stat-secondary">
                <span className="stat-card-num">{goodToHaveSkills.length}</span>
                <span className="stat-card-lbl">Missing Secondary</span>
              </div>
              <div className="stat-card stat-total">
                <span className="stat-card-num">{keywordCoverage.totalIdentified}</span>
                <span className="stat-card-lbl">Total JD Requirements</span>
              </div>
            </div>
          </div>
        </div>

        {/* Ethical Anti-Snake-Oil Disclaimer */}
        <div className="disclaimer-alert-strip" role="note">
          <span className="alert-strip-icon" aria-hidden="true">
            💡
          </span>
          <p className="alert-strip-text">
            <strong>Honest Scoring Disclaimer:</strong>{' '}
            {result.honestDisclaimer ? result.honestDisclaimer.replace(/^Honest Scoring Disclaimer:\s*/i, '') : ''}
          </p>
        </div>
      </section>

      {/* Tabs Filter Bar (Hidden on print) */}
      <div className="results-tabs-bar no-print" role="tablist">
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'all'}
          className={`tab-btn ${activeTab === 'all' ? 'tab-active' : ''}`}
          onClick={() => setActiveTab('all')}
        >
          All Skills ({keywordCoverage.totalIdentified})
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'matched'}
          className={`tab-btn ${activeTab === 'matched' ? 'tab-active' : ''}`}
          onClick={() => setActiveTab('matched')}
        >
          ✅ Matched with Evidence ({matchedSkills.length})
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'missing'}
          className={`tab-btn ${activeTab === 'missing' ? 'tab-active' : ''}`}
          onClick={() => setActiveTab('missing')}
        >
          ⚠️ Gaps & Not Found ({missingSkills.length})
        </button>
      </div>

      {/* Section 1: Matched Skills with Resume Evidence */}
      {(activeTab === 'all' || activeTab === 'matched') && (
        <section
          className="glass-card section-card"
          aria-labelledby="matched-skills-title"
        >
          <div className="section-card-header">
            <div>
              <h2 id="matched-skills-title" className="section-title-sm">
                ✅ Matched Skills with Verified Resume Evidence ({matchedSkills.length})
              </h2>
              <p className="section-subtitle-sm">
                Skills explicitly identified in the Job Description and verified with textual context in
                your CV.
              </p>
            </div>
          </div>

          <div className="matched-skills-grid">
            {matchedSkills.map((skill: MatchedSkill) => (
              <div
                key={skill.name}
                className="matched-skill-card"
                onClick={() => setSelectedEvidenceSkill(skill)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    setSelectedEvidenceSkill(skill);
                  }
                }}
                title="Click to view exact resume evidence snippet"
                data-testid={`matched-skill-${skill.name}`}
              >
                <div className="skill-card-top">
                  <span className="skill-category-tag">{skill.category}</span>
                  <span className="evidence-badge">Evidence Located 🔍</span>
                </div>
                <h3 className="skill-name">{skill.name}</h3>
                <p className="skill-snippet-preview">
                  &ldquo;{skill.evidenceSnippet}&rdquo;
                </p>
                <div className="skill-card-bottom">
                  <span className="section-location">{skill.section}</span>
                  <span className="view-evidence-link">View Context →</span>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Section 2: Missing Keywords & Actionable Gap Analysis */}
      {(activeTab === 'all' || activeTab === 'missing') && (
        <section
          className="glass-card section-card"
          aria-labelledby="missing-skills-title"
        >
          <div className="section-card-header">
            <div>
              <h2 id="missing-skills-title" className="section-title-sm">
                ⚠️ Keywords Not Found in Your Resume ({missingSkills.length})
              </h2>
              <p className="section-subtitle-sm">
                Terms extracted from the target JD that were absent from your resume. Follow the honest
                recommendations below if you have experience with these tools.
              </p>
            </div>
          </div>

          {/* Must-Have Missing Skills */}
          {mustHaveSkills.length > 0 && (
            <div className="missing-group-block">
              <div className="group-heading-row">
                <span className="importance-badge must-have">High Priority (Must-Have in JD)</span>
                <span className="group-count">{mustHaveSkills.length} items</span>
              </div>

              <div className="missing-skills-list">
                {mustHaveSkills.map((skill: MissingSkill) => (
                  <div key={skill.name} className="missing-skill-item">
                    <div className="missing-item-header">
                      <h3 className="missing-skill-name">{skill.name}</h3>
                      <span className="skill-category-tag">{skill.category}</span>
                    </div>
                    <p className="missing-recommendation">
                      <strong>Action Guidance:</strong> {skill.recommendation}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Good-to-Have Missing Skills */}
          {goodToHaveSkills.length > 0 && (
            <div className="missing-group-block" style={{ marginTop: '24px' }}>
              <div className="group-heading-row">
                <span className="importance-badge good-to-have">
                  Secondary / Preferred (Good-to-Have in JD)
                </span>
                <span className="group-count">{goodToHaveSkills.length} items</span>
              </div>

              <div className="missing-skills-list">
                {goodToHaveSkills.map((skill: MissingSkill) => (
                  <div key={skill.name} className="missing-skill-item">
                    <div className="missing-item-header">
                      <h3 className="missing-skill-name">{skill.name}</h3>
                      <span className="skill-category-tag">{skill.category}</span>
                    </div>
                    <p className="missing-recommendation">
                      <strong>Action Guidance:</strong> {skill.recommendation}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>
      )}

      {/* Section 3: Truthful Bullet Point Enhancements (STAR / Google XYZ) */}
      <section
        className="glass-card section-card"
        aria-labelledby="bullet-improvements-title"
      >
        <div className="section-card-header">
          <div>
            <h2 id="bullet-improvements-title" className="section-title-sm">
              ✍️ Truthful Resume Bullet Improvements ({bulletImprovements.length})
            </h2>
            <p className="section-subtitle-sm">
              Restructured from your existing work achievements using Google&apos;s XYZ formula
              (Accomplished [X] as measured by [Y], by doing [Z]).
            </p>
          </div>
        </div>

        <div className="bullet-cards-stack">
          {bulletImprovements.map((bullet) => (
            <div key={bullet.id} className="bullet-comparison-card">
              <div className="bullet-card-header">
                <span className="framework-badge">{bullet.framework}</span>
                <div className="targeted-skills-row">
                  <span className="target-label">Targeted Skills:</span>
                  {bullet.targetedSkills.map((skill: string) => (
                    <span key={skill} className="mini-skill-pill">
                      {skill}
                    </span>
                  ))}
                </div>
              </div>

              <div className="bullet-diff-grid">
                {/* Original Bullet */}
                <div className="bullet-diff-box original-box">
                  <span className="diff-label label-original">Original Draft in CV:</span>
                  <p className="bullet-text">&ldquo;{bullet.originalBullet}&rdquo;</p>
                </div>

                {/* Improved Bullet */}
                <div className="bullet-diff-box improved-box">
                  <div className="diff-header-with-copy">
                    <span className="diff-label label-improved">
                      Recommended High-Impact Rewrite:
                    </span>
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm copy-btn no-print"
                      onClick={() =>
                        handleCopyBullet(bullet.id, bullet.suggestedBullet)
                      }
                      aria-label="Copy improved bullet point"
                    >
                      {copiedBulletId === bullet.id ? '✓ Copied!' : '📋 Copy'}
                    </button>
                  </div>
                  <p className="bullet-text-highlight">
                    &ldquo;{bullet.suggestedBullet}&rdquo;
                  </p>
                </div>
              </div>

              {/* Truthful Metrics Guidance */}
              <div className="bullet-metrics-note">
                <span className="note-icon" aria-hidden="true">
                  📌
                </span>
                <p className="note-text">
                  <strong>Metrics Guidance:</strong> {bullet.metricsGuidance}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Section 4: Live Job Finder CTA Card */}
      {onNavigateToJobs && (
        <section className="glass-card cta-jobs-banner no-print" aria-label="Job Finder CTA">
          <div className="cta-jobs-content">
            <h3>🎯 Discover Real Indian IT Job Openings Aligned With Your Profile</h3>
            <p>
              We&apos;ve verified {matchedSkills.length} skills in your resume. Check live, legitimate vacancies
              from top Indian IT tech firms and see your exact alignment percentage.
            </p>
          </div>
          <button
            type="button"
            className="btn btn-primary"
            onClick={onNavigateToJobs}
            id="btn-explore-matching-jobs"
          >
            Explore Matching Jobs →
          </button>
        </section>
      )}

      {/* Section 5: Learning & Interview Prep CTA Card */}
      {onNavigateToPrep && (
        <section
          className="glass-card cta-prep-banner no-print"
          aria-label="Learning and Interview Prep CTA"
          style={{
            marginTop: '16px',
            background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.15), rgba(16, 185, 129, 0.1))',
            border: '1px solid rgba(99, 102, 241, 0.35)',
            padding: '28px 32px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '20px',
          }}
        >
          <div className="cta-jobs-content">
            <h3>💡 Target Your Skill Gaps with a 4-Week Prep Roadmap</h3>
            <p>
              We detected {missingSkills.length} missing skill areas. Review a structured 4-week study plan,
              earn XP in interactive topic quizzes, and master STAR interview storytelling.
            </p>
          </div>
          <button
            type="button"
            className="btn btn-primary"
            onClick={onNavigateToPrep}
            id="btn-explore-prep-roadmap"
          >
            Start Interview Prep 🚀
          </button>
        </section>
      )}

      {/* Interactive Evidence Drawer Modal */}
      <EvidenceDrawer
        skill={selectedEvidenceSkill}
        onClose={() => setSelectedEvidenceSkill(null)}
      />
    </div>
  );
};
