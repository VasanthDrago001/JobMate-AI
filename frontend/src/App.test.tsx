import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import App from './App';
import { api } from './services/api';

const MOCK_BACKEND_RESPONSE = {
  analysis_id: 'jm-test-12345',
  status: 'completed',
  created_at: new Date().toISOString(),
  resume_metadata: {
    file_name: 'Vasanth_Kumar_Resume_Backend_2026.pdf',
    file_size_bytes: 104800,
    page_count: 2,
    character_count: 3200,
    word_count: 480,
    detected_sections: ['Skills', 'Experience', 'Projects'],
    is_text_based: true,
  },
  job_description_metadata: {
    target_role: 'Senior Backend Engineer',
    character_count: 500,
    word_count: 65,
  },
  analysis_result: {
    status: 'completed',
    score: 72.0,
    scoring_method_version: 'v1.0.0-deterministic',
    message: 'Extracted 12 requirements from job description',
    scoring_formula: '((matched * 1.0) + (partial * 0.5)) / total * 100',
    summary: {
      total_requirements: 12,
      matched_count: 8,
      partial_count: 2,
      not_found_count: 2,
    },
    matched_skills: [
      {
        skill_id: 'fastapi',
        name: 'FastAPI',
        category: 'Frameworks & Libraries',
        status: 'matched',
        matched_term: 'FastAPI',
        evidence_snippet: 'Migrated legacy monolith endpoints to FastAPI microservices.',
        weight: 1.0,
        explanation: 'Matched with evidence.',
      },
    ],
    partial_skills: [],
    not_found_skills: [
      {
        skill_id: 'k8s',
        name: 'Kubernetes',
        category: 'Cloud & DevOps',
        status: 'not_found_in_resume',
        matched_term: null,
        evidence_snippet: null,
        weight: 1.0,
        explanation: 'Kubernetes was not found in your resume.',
      },
    ],
    all_requirements: [],
    disclaimer_honest_scoring:
      'Honest Scoring Disclaimer: This score reflects keyword alignment with the submitted job description, not an automated ATS hiring decision.',
    disclaimer_not_found_skills: 'Not found does not mean you lack the skill.',
  },
  bullet_improvements: [
    {
      id: 'b-1',
      original_bullet: 'Worked on backend APIs using FastAPI.',
      suggested_rewrite:
        'Engineered high-throughput REST APIs using FastAPI, decreasing latency by [quantify: e.g., 20%].',
      reason: 'Applied Google XYZ Formula',
      framework: 'Google XYZ Formula',
      targeted_skills: ['FastAPI'],
      needs_confirmation: true,
      confirmation_prompt: 'Please confirm the latency reduction percentage.',
    },
  ],
};

vi.mock('./services/api', () => ({
  API_BASE_URL: 'http://127.0.0.1:8000',
  api: {
    checkHealth: vi.fn(),
    analyzeResume: vi.fn(),
    improveBullets: vi.fn(),
  },
}));

describe('JobMate AI Frontend SaaS Interface', () => {
  beforeEach(() => {
    window.location.hash = '';
    vi.clearAllMocks();
    vi.mocked(api.checkHealth).mockResolvedValue({
      status: 'ok',
      service: 'JobMate AI Backend',
      version: '0.1.0',
      environment: 'development',
    });
    vi.mocked(api.analyzeResume).mockResolvedValue(MOCK_BACKEND_RESPONSE as any);
  });

  it('renders landing page with title and Indian IT value proposition', () => {
    render(<App />);

    expect(screen.getAllByText('JobMate AI')[0]).toBeInTheDocument();
    expect(
      screen.getByText(/Targeted, Truthful Resume Alignment with/i)
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Engineered for Indian IT Job Seekers/i)
    ).toBeInTheDocument();
    expect(screen.getByText('850+')).toBeInTheDocument();
  });

  it('navigates to Privacy & DPDP page and returns to Home', () => {
    render(<App />);

    // Click Privacy & DPDP in navigation
    const privacyNavBtn = screen.getAllByRole('button', { name: /Privacy & DPDP/i })[0];
    fireEvent.click(privacyNavBtn);

    expect(
      screen.getByText(/Privacy Policy & Service Limitations/i)
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Digital Personal Data Protection \(DPDP\) Act 2023/i)
    ).toBeInTheDocument();

    // Click Back to Home
    const backBtn = screen.getByText(/← Back to Home/i);
    fireEvent.click(backBtn);

    expect(
      screen.getByText(/Targeted, Truthful Resume Alignment with/i)
    ).toBeInTheDocument();
  });

  it('navigates to Analyzer page and enforces form validation', async () => {
    render(<App />);

    // Navigate to Analyzer
    const startBtn = screen.getAllByRole('button', { name: /Resume Analyzer/i })[0];
    fireEvent.click(startBtn);

    expect(
      screen.getByText(/Resume & Job Description Analyzer/i)
    ).toBeInTheDocument();

    // Attempt submitting without filling form
    const submitBtn = screen.getByTestId('btn-submit-analysis');
    fireEvent.click(submitBtn);

    // Validation errors should appear
    expect(
      screen.getByText(/Please upload your resume PDF to begin analysis/i)
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Job description must be at least 50 characters long/i)
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Please confirm the consent checkbox/i)
    ).toBeInTheDocument();
  });

  it('preloads sample profile and executes analysis to reach results', async () => {
    render(<App />);

    // Click sample load from landing page
    const sampleBtn = screen.getByText(/🧪 Load Sample Profile & JD/i);
    fireEvent.click(sampleBtn);

    // Should now be on Analyzer page with prefilled values
    expect(
      screen.getByText('Vasanth_Kumar_Resume_Backend_2026.pdf')
    ).toBeInTheDocument();
    const consentCheck = screen.getByTestId('consent-checkbox') as HTMLInputElement;
    expect(consentCheck.checked).toBe(true);

    // Submit analysis
    const submitBtn = screen.getByTestId('btn-submit-analysis');
    fireEvent.click(submitBtn);

    // Should display loading progress screen
    expect(screen.getByTestId('loading-card')).toBeInTheDocument();

    // Wait for analysis to complete and display results screen
    await waitFor(
      () => {
        expect(screen.getByTestId('coverage-score')).toBeInTheDocument();
      },
      { timeout: 5000 }
    );

    // Verify key elements in Results page
    expect(screen.getByText('72%')).toBeInTheDocument();
    expect(screen.getByText(/Matched Skills with Verified Resume Evidence/i)).toBeInTheDocument();
    expect(screen.getByText(/Keywords Not Found in Your Resume/i)).toBeInTheDocument();
    expect(screen.getByText(/Truthful Resume Bullet Improvements/i)).toBeInTheDocument();
    expect(screen.getAllByText(/Honest Scoring Disclaimer:/i).length).toBeGreaterThan(0);
  });

  it('opens and closes evidence drawer when clicking a matched skill', async () => {
    render(<App />);

    // Quick load sample and submit
    fireEvent.click(screen.getByText(/🧪 Load Sample Profile & JD/i));
    fireEvent.click(screen.getByTestId('btn-submit-analysis'));

    await waitFor(
      () => {
        expect(screen.getByTestId('coverage-score')).toBeInTheDocument();
      },
      { timeout: 5000 }
    );

    // Click FastAPI matched skill card
    const fastApiCard = screen.getByTestId('matched-skill-FastAPI');
    fireEvent.click(fastApiCard);

    // Evidence drawer should open
    const drawer = screen.getByRole('dialog', { name: /Evidence for:/i });
    expect(drawer).toBeInTheDocument();
    expect(
      within(drawer).getByText(/Migrated legacy monolith endpoints to FastAPI/i)
    ).toBeInTheDocument();

    // Close evidence drawer
    const closeBtn = within(drawer).getByRole('button', { name: /Close Evidence Window/i });
    fireEvent.click(closeBtn);

    expect(
      screen.queryByRole('dialog', { name: /Evidence for:/i })
    ).not.toBeInTheDocument();
  });

  it('navigates to Job Finder from Header navigation', async () => {
    render(<App />);

    const jobFinderBtn = screen.getAllByRole('button', { name: /Job Finder/i })[0];
    fireEvent.click(jobFinderBtn);

    await waitFor(() => {
      expect(screen.getByText(/Skill-to-Company Indian IT Job Finder/i)).toBeInTheDocument();
    });
  });

  it('transitions from Results page to Job Finder via CTA button', async () => {
    render(<App />);

    // Load sample and submit
    fireEvent.click(screen.getByText(/🧪 Load Sample Profile & JD/i));
    fireEvent.click(screen.getByTestId('btn-submit-analysis'));

    await waitFor(
      () => {
        expect(screen.getByTestId('coverage-score')).toBeInTheDocument();
      },
      { timeout: 5000 }
    );

    // Click matching jobs CTA button
    const ctaBtn = screen.getByRole('button', { name: /Explore Matching Jobs →/i });
    fireEvent.click(ctaBtn);

    await waitFor(() => {
      expect(screen.getByText(/Skill-to-Company Indian IT Job Finder/i)).toBeInTheDocument();
      expect(screen.getByText(/✓ FastAPI/i)).toBeInTheDocument();
    });
  });

  it('navigates to Interview Prep from Header navigation', async () => {
    render(<App />);

    const prepBtn = screen.getAllByRole('button', { name: /Interview Prep/i })[0];
    fireEvent.click(prepBtn);

    await waitFor(() => {
      expect(screen.getByText(/Interview Preparation & Skill Mastery/i)).toBeInTheDocument();
    });
  });

  it('transitions from Results page to Interview Prep via CTA button', async () => {
    render(<App />);

    // Load sample and submit
    fireEvent.click(screen.getByText(/🧪 Load Sample Profile & JD/i));
    fireEvent.click(screen.getByTestId('btn-submit-analysis'));

    await waitFor(
      () => {
        expect(screen.getByTestId('coverage-score')).toBeInTheDocument();
      },
      { timeout: 5000 }
    );

    // Click interview prep CTA button
    const prepCtaBtn = screen.getByRole('button', { name: /Start Interview Prep 🚀/i });
    fireEvent.click(prepCtaBtn);

    await waitFor(() => {
      expect(screen.getByText(/Interview Preparation & Skill Mastery/i)).toBeInTheDocument();
      expect(screen.getByText(/4-Week Preparation Roadmap/i)).toBeInTheDocument();
    });
  });
});
