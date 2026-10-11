import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { JobFinderPage } from './JobFinderPage';
import { jobService } from '../../services/jobService';
import type { JobSearchResponse } from '../../types/jobFinder';

const MOCK_JOBS_RESPONSE: JobSearchResponse = {
  results: [
    {
      id: 'razorpay-backend-sde2',
      title: 'Senior Software Engineer - Backend',
      company_name: 'Razorpay',
      location: 'Bengaluru',
      work_mode: 'hybrid',
      source: 'greenhouse',
      application_url: 'https://razorpay.com/jobs/sde2',
      salary_display: '₹22,00,000 - ₹34,00,000 / yr',
      description_snippet: 'Build payment infrastructure using Python, FastAPI, and PostgreSQL.',
      posted_at_iso: '2026-03-15T00:00:00Z',
      posted_date_display: 'March 15, 2026',
      last_verified_at_iso: new Date().toISOString(),
      match_score_percentage: 85.0,
      match_summary_explanation: 'Strong match: 4 of 5 required skills verified in your resume.',
      skills_breakdown: [
        {
          skill_name: 'Python',
          status: 'matched',
          resume_evidence_snippet: 'Built microservices using Python 3.11',
          importance: 'Must-Have',
        },
        {
          skill_name: 'FastAPI',
          status: 'matched',
          resume_evidence_snippet: 'Developed high-throughput REST APIs',
          importance: 'Must-Have',
        },
        {
          skill_name: 'PostgreSQL',
          status: 'matched',
          resume_evidence_snippet: 'Optimized PostgreSQL queries',
          importance: 'Must-Have',
        },
        {
          skill_name: 'Kubernetes',
          status: 'not_found',
          resume_evidence_snippet: null,
          importance: 'Good-to-Have',
        },
      ],
      is_expired: false,
    },
  ],
  total_matches_found: 1,
  page: 1,
  page_size: 15,
  query_role: 'Senior Backend Engineer',
  query_location: 'Bengaluru',
  source_attribution: 'Adzuna Developer API & Official Greenhouse Boards',
  cached: false,
  verified_at: new Date().toISOString(),
};

vi.mock('../../services/jobService', () => ({
  jobService: {
    getLocations: vi.fn(),
    searchJobs: vi.fn(),
  },
}));

describe('JobFinderPage Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(jobService.getLocations).mockResolvedValue([
      'Bengaluru',
      'Hyderabad',
      'Pune',
      'Mumbai',
      'Remote',
    ]);
    vi.mocked(jobService.searchJobs).mockResolvedValue(MOCK_JOBS_RESPONSE);
  });

  it('renders Job Finder header and candidate skills strip', async () => {
    render(
      <JobFinderPage
        initialRole="Senior Backend Engineer"
        candidateSkills={['Python', 'FastAPI', 'PostgreSQL']}
      />
    );

    expect(screen.getByText(/Skill-to-Company Indian IT Job Finder/i)).toBeInTheDocument();
    expect(screen.getByText(/Comparing against your verified skills:/i)).toBeInTheDocument();
    expect(screen.getByText(/✓ Python/i)).toBeInTheDocument();
    expect(screen.getByText(/✓ FastAPI/i)).toBeInTheDocument();
  });

  it('fetches and displays real job vacancy cards with skill match score', async () => {
    render(
      <JobFinderPage
        initialRole="Senior Backend Engineer"
        candidateSkills={['Python', 'FastAPI', 'PostgreSQL']}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Senior Software Engineer - Backend')).toBeInTheDocument();
    });

    expect(screen.getByText('Razorpay')).toBeInTheDocument();
    expect(screen.getByText('85%')).toBeInTheDocument();
    expect(screen.getByText('Direct Employer Board')).toBeInTheDocument();
    expect(screen.getByText(/₹22,00,000 - ₹34,00,000/i)).toBeInTheDocument();
    expect(
      screen.getByText(/Strong match: 4 of 5 required skills verified in your resume./i)
    ).toBeInTheDocument();

    // Verify Apply link
    const applyLink = screen.getByRole('link', {
      name: /Apply Directly on Employer Portal ↗/i,
    });
    expect(applyLink).toHaveAttribute('href', 'https://razorpay.com/jobs/sde2');
  });

  it('allows filtering by location and work mode', async () => {
    render(
      <JobFinderPage
        initialRole="Backend Engineer"
        candidateSkills={['Python', 'PostgreSQL']}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Senior Software Engineer - Backend')).toBeInTheDocument();
    });

    // Select Remote work mode
    const remoteBtn = screen.getByRole('button', { name: /^Remote$/i });
    fireEvent.click(remoteBtn);

    // Click search button
    const searchBtn = screen.getByRole('button', { name: /Find Aligned Jobs 🔍/i });
    fireEvent.click(searchBtn);

    await waitFor(() => {
      expect(jobService.searchJobs).toHaveBeenCalledWith(
        expect.objectContaining({
          workMode: 'remote',
        }),
        ['Python', 'PostgreSQL']
      );
    });
  });

  it('displays empty state when no jobs are found', async () => {
    vi.mocked(jobService.searchJobs).mockResolvedValueOnce({
      ...MOCK_JOBS_RESPONSE,
      results: [],
      total_matches_found: 0,
    });

    render(
      <JobFinderPage
        initialRole="Unknown Role"
        candidateSkills={['ObscureSkill']}
      />
    );

    await waitFor(() => {
      expect(screen.getByText(/No matching job vacancies found/i)).toBeInTheDocument();
    });
  });
});
