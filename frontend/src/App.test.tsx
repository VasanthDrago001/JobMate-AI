import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import App from './App';
import { api } from './services/api';

// Mock the API client
vi.mock('./services/api', () => ({
  API_BASE_URL: 'http://127.0.0.1:8000',
  api: {
    checkHealth: vi.fn(),
  },
}));

describe('JobMate AI Frontend Application', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the header and brand name correctly', () => {
    vi.mocked(api.checkHealth).mockReturnValue(new Promise(() => {})); // pending
    render(<App />);

    expect(screen.getByText('JobMate AI')).toBeInTheDocument();
    expect(screen.getByText('Indian IT Career Intelligence')).toBeInTheDocument();
  });

  it('displays Online status when health check succeeds', async () => {
    vi.mocked(api.checkHealth).mockResolvedValue({
      status: 'ok',
      service: 'JobMate AI Backend',
      version: '0.1.0',
      environment: 'development',
    });

    render(<App />);

    await waitFor(() => {
      expect(screen.getByText('API Online')).toBeInTheDocument();
      expect(screen.getByText('Online (200 OK)')).toBeInTheDocument();
    });
  });

  it('displays Offline status and connection error when health check fails', async () => {
    vi.mocked(api.checkHealth).mockRejectedValue(new Error('Connection refused'));

    render(<App />);

    await waitFor(() => {
      expect(screen.getByText('API Offline')).toBeInTheDocument();
      expect(screen.getByText('Disconnected')).toBeInTheDocument();
    });
  });

  it('displays core architectural pillars and honesty commitment', () => {
    vi.mocked(api.checkHealth).mockReturnValue(new Promise(() => {}));
    render(<App />);

    expect(screen.getByText('Transparent Keyword Gap')).toBeInTheDocument();
    expect(screen.getByText('Truthful Bullet Rewrites')).toBeInTheDocument();
    expect(screen.getByText('DPDP 2023 Compliant')).toBeInTheDocument();
  });
});
