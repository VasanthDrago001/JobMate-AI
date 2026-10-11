import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import App from './App';
import { api } from './services/api';

vi.mock('./services/api', () => ({
  API_BASE_URL: 'http://127.0.0.1:8000',
  api: {
    checkHealth: vi.fn(),
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
    expect(screen.getByText(/Honest Scoring Disclaimer:/i)).toBeInTheDocument();
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
});
