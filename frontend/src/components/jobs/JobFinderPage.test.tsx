import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { JobFinderPage } from './JobFinderPage';
import { jobService } from '../../services/jobService';
import type { JobSearchResponseUI } from '../../types/jobFinder';

const MOCK_JOBS_RESPONSE: JobSearchResponseUI = {
  results: [
    {
      id: 'razorpay-backend-sde2',
      title: 'Senior Software Engineer - Backend',
      company_name: 'Razorpay',
      location: 'Bengaluru',
      work_mode: 'Hybrid',
      source: 'greenhouse',
      application_url: 'https://razorpay.com/jobs/sde2',
      salary_display: '₹22,00,000 - ₹34,00,000 / yr',
      description_snippet: 'Build payment infrastructure using Python, FastAPI, and PostgreSQL.',
      posting_date: 'March 15, 2026',
      last_verified_at: new Date().toISOString(),
      match_score_percentage: 85.0,
      matched_skills_count: 4,
      total_required_skills_count: 5,
      match_summary_explanation: 'Strong match: 4 of 5 required skills verified in your resume.',
      skills_breakdown: [
        {
          skill_name: 'Python',
          status: 'matched',
          resume_evidence_snippet: 'Built microservices using Python 3.11',
          importance: 'Required',
        },
        {
          skill_name: 'FastAPI',
          status: 'matched',
          resume_evidence_snippet: 'Developed high-throughput REST APIs',
          importance: 'Required',
        },
        {
          skill_name: 'PostgreSQL',
          status: 'matched',
          resume_evidence_snippet: 'Optimized PostgreSQL queries',
          importance: 'Required',
        },
        {
          skill_name: 'Kubernetes',
          status: 'missing',
          resume_evidence_snippet: null,
          importance: 'Preferred',
        },
      ],
      is_expired: false,
    },
  ],
  total_matches_found: 1,
  current_page: 1,
  has_more: false,
  source_attribution: 'Adzuna Developer API & Official Greenhouse Boards',
  cached: false,
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

    // Select Remote work mode (triggers search immediately)
    const remoteBtn = screen.getByRole('button', { name: /^Remote$/i });
    fireEvent.click(remoteBtn);

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

  it('allows sorting and experience filtering with auto-search', async () => {
    render(
      <JobFinderPage
        initialRole="Backend Engineer"
        candidateSkills={['Python']}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Senior Software Engineer - Backend')).toBeInTheDocument();
    });

    // Change experience level dropdown
    const expSelect = screen.getByLabelText(/Experience Level/i);
    fireEvent.change(expSelect, { target: { value: 'senior' } });

    await waitFor(() => {
      expect(jobService.searchJobs).toHaveBeenCalledWith(
        expect.objectContaining({
          experienceLevel: 'senior',
        }),
        ['Python']
      );
    });

    // Change sort dropdown
    const sortSelect = screen.getByLabelText(/Sort by:/i);
    fireEvent.change(sortSelect, { target: { value: 'company' } });

    await waitFor(() => {
      expect(jobService.searchJobs).toHaveBeenCalledWith(
        expect.objectContaining({
          sortBy: 'company',
        }),
        ['Python']
      );
    });
  });

  it('resets filters and searches immediately when reset button is clicked', async () => {
    render(
      <JobFinderPage
        initialRole="Software Engineer"
        candidateSkills={['Python']}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Senior Software Engineer - Backend')).toBeInTheDocument();
    });

    // Click reset button
    const resetBtn = screen.getByRole('button', { name: /Reset Filters/i });
    fireEvent.click(resetBtn);

    await waitFor(() => {
      expect(jobService.searchJobs).toHaveBeenCalledWith(
        expect.objectContaining({
          location: 'All India',
          workMode: 'all',
          experienceLevel: 'all',
          sortBy: 'match',
          page: 1,
        }),
        ['Python']
      );
    });
  });

  it('supports pagination controls when total results exceed page size', async () => {
    vi.mocked(jobService.searchJobs).mockResolvedValue({
      ...MOCK_JOBS_RESPONSE,
      total_matches_found: 18,
    });

    render(
      <JobFinderPage
        initialRole="Backend Engineer"
        candidateSkills={['Python']}
      />
    );

    const nextBtn = await screen.findByRole('button', { name: /Next →/i });
    expect(nextBtn).toBeInTheDocument();
    fireEvent.click(nextBtn);

    await waitFor(() => {
      expect(jobService.searchJobs).toHaveBeenCalledWith(
        expect.objectContaining({
          page: 2,
        }),
        ['Python']
      );
    });
  });
});

