import React, { useState, useEffect, useCallback } from 'react';
import type { JobFilterParams, JobListingUI, WorkModeFilter, ExperienceLevelFilter } from '../../types/jobFinder';
import { jobService } from '../../services/jobService';

interface JobFinderPageProps {
  initialRole?: string;
  candidateSkills?: string[];
  onNavigateToAnalyzer?: () => void;
}

const DEFAULT_LOCATIONS = [
  'Bengaluru',
  'Hyderabad',
  'Pune',
  'Mumbai',
  'Gurgaon / Delhi NCR',
  'Noida',
  'Chennai',
  'Kolkata',
  'Remote',
  'All India',
];

export const JobFinderPage: React.FC<JobFinderPageProps> = ({
  initialRole = 'Senior Backend / Full-Stack Engineer',
  candidateSkills = ['Python', 'FastAPI', 'Docker', 'PostgreSQL', 'Redis', 'Microservices'],
  onNavigateToAnalyzer,
}) => {
  const [roleInput, setRoleInput] = useState<string>(initialRole);
  const [selectedLocation, setSelectedLocation] = useState<string>('Bengaluru');
  const [workMode, setWorkMode] = useState<WorkModeFilter>('all');
  const [experienceLevel, setExperienceLevel] = useState<ExperienceLevelFilter>('all');
  const [locations, setLocations] = useState<string[]>(DEFAULT_LOCATIONS);

  const [jobs, setJobs] = useState<JobListingUI[]>([]);
  const [totalFound, setTotalFound] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [attribution, setAttribution] = useState<string>(
    'Job listings powered by Adzuna Developer API and verified official employer career boards.'
  );

  // Fetch supported locations on mount
  useEffect(() => {
    jobService
      .getLocations()
      .then((locs) => {
        if (locs && locs.length > 0) {
          setLocations([...locs, 'All India']);
        }
      })
      .catch(() => {
        // Keep defaults
      });
  }, []);

  // Execute search
  const handleSearch = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    const filter: JobFilterParams = {
      role: roleInput.trim() || 'Software Engineer',
      location: selectedLocation,
      workMode,
      experienceLevel,
      page: 1,
      pageSize: 15,
    };

    try {
      const response = await jobService.searchJobs(filter, candidateSkills);
      setJobs(response.results);
      setTotalFound(response.total_matches_found);
      if (response.source_attribution) {
        setAttribution(response.source_attribution);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to retrieve job vacancies.';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  }, [roleInput, selectedLocation, workMode, experienceLevel, candidateSkills]);

  // Run initial search on mount
  useEffect(() => {
    handleSearch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="job-finder-page container" id="job-finder-content">
      {/* Top Value Banner */}
      <div className="job-finder-header glass-card">
        <div className="finder-header-content">
          <span className="section-badge">🎯 Phase 2 Feature</span>
          <h1 className="finder-title">Skill-to-Company Indian IT Job Finder</h1>
          <p className="finder-subtitle">
            Find active vacancies from legitimate Indian IT employers and see exact skill alignment
            computed against your verified resume profile.
          </p>

          {/* Active Skills Strip */}
          {candidateSkills && candidateSkills.length > 0 && (
            <div className="active-skills-strip">
              <span className="skills-strip-label">Comparing against your verified skills:</span>
              <div className="skills-pill-group">
                {candidateSkills.slice(0, 8).map((skill) => (
                  <span key={skill} className="candidate-skill-pill">
                    ✓ {skill}
                  </span>
                ))}
                {candidateSkills.length > 8 && (
                  <span className="more-skills-pill">+{candidateSkills.length - 8} more</span>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Filter Toolbar Card */}
      <section className="glass-card finder-filter-card" aria-label="Job Search Filters">
        <div className="filter-grid">
          {/* Target Role Field */}
          <div className="filter-field">
            <label htmlFor="finder-role-input" className="filter-label">
              Role or Skill Keyword
            </label>
            <input
              id="finder-role-input"
              type="text"
              className="filter-input"
              value={roleInput}
              onChange={(e) => setRoleInput(e.target.value)}
              placeholder="e.g. Python Developer, QA Automation"
            />
          </div>

          {/* Location Select */}
          <div className="filter-field">
            <label htmlFor="finder-location-select" className="filter-label">
              Location / Tech Hub
            </label>
            <select
              id="finder-location-select"
              className="filter-select"
              value={selectedLocation}
              onChange={(e) => setSelectedLocation(e.target.value)}
            >
              {locations.map((loc) => (
                <option key={loc} value={loc}>
                  📍 {loc}
                </option>
              ))}
            </select>
          </div>

          {/* Experience Level Filter */}
          <div className="filter-field">
            <label htmlFor="finder-exp-select" className="filter-label">
              Experience Level
            </label>
            <select
              id="finder-exp-select"
              className="filter-select"
              value={experienceLevel}
              onChange={(e) => setExperienceLevel(e.target.value as ExperienceLevelFilter)}
            >
              <option value="all">Any Experience</option>
              <option value="entry">Entry Level (0-2 yrs)</option>
              <option value="mid">Mid Level (2-5 yrs)</option>
              <option value="senior">Senior / Lead (5+ yrs)</option>
            </select>
          </div>

          {/* Work Mode Filter */}
          <div className="filter-field">
            <span className="filter-label">Work Mode</span>
            <div className="pill-toggle-group">
              {(['all', 'remote', 'hybrid', 'on-site'] as WorkModeFilter[]).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  className={`pill-toggle-btn ${workMode === mode ? 'active' : ''}`}
                  onClick={() => setWorkMode(mode)}
                >
                  {mode === 'all'
                    ? 'All'
                    : mode === 'remote'
                    ? 'Remote'
                    : mode === 'hybrid'
                    ? 'Hybrid'
                    : 'On-site'}
                </button>
              ))}
            </div>
          </div>

          {/* Search Trigger Button */}
          <div className="filter-field filter-action">
            <button
              id="btn-search-jobs"
              type="button"
              className="btn btn-primary w-full"
              onClick={handleSearch}
              disabled={isLoading}
            >
              {isLoading ? 'Searching Vacancies...' : 'Find Aligned Jobs 🔍'}
            </button>
          </div>
        </div>
      </section>

      {/* Results Header */}
      <div className="finder-results-bar">
        <div className="results-count-text">
          Showing <strong>{jobs.length}</strong> of <strong>{totalFound}</strong> verified job postings
          for <em>&ldquo;{roleInput}&rdquo;</em> in <em>{selectedLocation}</em>
        </div>
        <div className="ranking-indicator-pill">
          ⚡ Ranked by resume skill alignment
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div className="glass-card finder-error-alert" role="alert">
          <span className="alert-icon">⚠️</span>
          <div>
            <strong>Unable to load jobs:</strong> {error}
            <button type="button" className="retry-link-btn" onClick={handleSearch}>
              Try Again
            </button>
          </div>
        </div>
      )}

      {/* Loading Skeleton */}
      {isLoading ? (
        <div className="jobs-loading-skeleton">
          <div className="skeleton-card glass-card">
            <div className="skeleton-line title" />
            <div className="skeleton-line subtitle" />
            <div className="skeleton-line body" />
          </div>
          <div className="skeleton-card glass-card">
            <div className="skeleton-line title" />
            <div className="skeleton-line subtitle" />
            <div className="skeleton-line body" />
          </div>
        </div>
      ) : jobs.length === 0 ? (
        /* Empty State */
        <div className="glass-card finder-empty-card">
          <div className="empty-icon">🔎</div>
          <h3>No matching job vacancies found</h3>
          <p>
            No active positions matched your exact search criteria in {selectedLocation}. Try
            selecting &ldquo;All India&rdquo; or broadening your target role title.
          </p>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={() => {
              setSelectedLocation('All India');
              setWorkMode('all');
            }}
          >
            Reset Location to All India
          </button>
        </div>
      ) : (
        /* Job Cards Grid */
        <div className="jobs-cards-grid">
          {jobs.map((job) => (
            <div key={job.id} className="job-card glass-card" data-testid={`job-card-${job.id}`}>
              {/* Card Header */}
              <div className="job-card-header">
                <div>
                  <div className="job-source-tag">
                    <span className="source-dot" />
                    {job.source === 'greenhouse'
                      ? 'Direct Employer Board'
                      : job.source === 'adzuna'
                      ? 'Adzuna Verified'
                      : 'Verified Indian IT Employer'}
                  </div>
                  <h3 className="job-title">{job.title}</h3>
                  <div className="job-company-row">
                    <strong className="company-name">{job.company_name}</strong>
                    <span className="meta-sep">•</span>
                    <span className="job-loc">📍 {job.location}</span>
                    <span className="meta-sep">•</span>
                    <span className="work-mode-badge">{job.work_mode}</span>
                  </div>
                </div>

                {/* Score Pill */}
                <div className="job-match-badge" title="Calculated skill overlap with your resume">
                  <span className="match-pct">{Math.round(job.match_score_percentage)}%</span>
                  <span className="match-label">Skill Match</span>
                </div>
              </div>

              {/* Salary & Meta Row */}
              <div className="job-meta-pill-row">
                <span className="salary-pill">💵 {job.salary_display}</span>
                <span className="verified-pill">
                  ✓ Verified active as of today
                </span>
              </div>

              {/* Match Explanation Strip */}
              <div className="job-explanation-strip">
                <span className="explanation-icon">💡</span>
                <p className="explanation-text">{job.match_summary_explanation}</p>
              </div>

              {/* Requirements & Evidence Breakdown */}
              {job.skills_breakdown && job.skills_breakdown.length > 0 && (
                <div className="job-skills-breakdown">
                  <span className="breakdown-label">Requirements Breakdown:</span>
                  <div className="breakdown-tags">
                    {job.skills_breakdown.map((s) => (
                      <span
                        key={s.skill_name}
                        className={`skill-tag ${
                          s.status === 'matched'
                            ? 'tag-matched'
                            : s.status === 'partial'
                            ? 'tag-partial'
                            : 'tag-missing'
                        }`}
                        title={
                          s.status === 'matched'
                            ? `Matched with evidence: ${s.resume_evidence_snippet || 'Verified in CV'}`
                            : s.status === 'partial'
                            ? 'Related foundation present'
                            : 'Not found in your resume'
                        }
                      >
                        {s.status === 'matched' ? '✓ ' : s.status === 'partial' ? '~ ' : '✗ '}
                        {s.skill_name}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Description Snippet */}
              <p className="job-snippet-text">&ldquo;{job.description_snippet}&rdquo;</p>

              {/* Card Footer Actions */}
              <div className="job-card-footer">
                <a
                  href={job.application_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-primary btn-sm btn-apply"
                >
                  Apply Directly on Employer Portal ↗
                </a>
                {onNavigateToAnalyzer && (
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={onNavigateToAnalyzer}
                  >
                    Compare Against Another CV
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Official Data Attribution Footer */}
      <footer className="finder-attribution-footer glass-card">
        <p className="attribution-text">
          {attribution} JobMate AI presents verified employer opportunities without automated scraping.
        </p>
      </footer>
    </div>
  );
};
