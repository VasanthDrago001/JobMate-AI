import React, { useEffect, useState, useCallback } from 'react';
import './App.css';
import { api, API_BASE_URL } from './services/api';
import type { HealthStatus } from './types/api';

type ConnectionState = 'idle' | 'checking' | 'connected' | 'error';

export const App: React.FC = () => {
  const [connectionState, setConnectionState] = useState<ConnectionState>('checking');
  const [healthData, setHealthData] = useState<HealthStatus | null>(null);
  const [latencyMs, setLatencyMs] = useState<number | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const verifyBackendHealth = useCallback(async () => {
    setConnectionState('checking');
    setErrorMessage(null);
    const startTime = performance.now();

    try {
      const data = await api.checkHealth();
      const endTime = performance.now();
      setLatencyMs(Math.round(endTime - startTime));
      setHealthData(data);
      setConnectionState('connected');
    } catch (err) {
      setConnectionState('error');
      setHealthData(null);
      setLatencyMs(null);
      const msg = err instanceof Error ? err.message : 'Unable to connect to backend';
      setErrorMessage(msg);
    }
  }, []);

  useEffect(() => {
    verifyBackendHealth();
  }, [verifyBackendHealth]);

  return (
    <div className="app-wrapper">
      {/* Header */}
      <header className="app-header">
        <div className="container header-content">
          <div className="brand-logo">
            <span className="logo-badge">JM</span>
            <div>
              <div className="brand-name">JobMate AI</div>
              <div className="brand-target">Indian IT Career Intelligence</div>
            </div>
          </div>

          <div className="status-pill" data-testid="status-pill">
            <span
              className={`status-dot ${
                connectionState === 'connected'
                  ? 'online'
                  : connectionState === 'checking'
                  ? 'checking'
                  : 'error'
              }`}
            />
            <span>
              {connectionState === 'connected' && 'API Online'}
              {connectionState === 'checking' && 'Checking API...'}
              {connectionState === 'error' && 'API Offline'}
            </span>
          </div>
        </div>
      </header>

      {/* Main Body */}
      <main className="main-content">
        <div className="container">
          {/* Hero Section */}
          <section className="hero-section">
            <div className="hero-badge-container">
              <span className="hero-badge">Phase 0 Completed • Repository Initialized</span>
            </div>
            <h1 className="hero-title">
              Targeted, Truthful Resume Alignment for{' '}
              <span className="gradient-text">Indian IT Engineers</span>
            </h1>
            <p className="hero-subtext">
              Zero hallucinated skills. Real keyword evidence. STAR/XYZ bullet rewrites strictly
              tailored to your target job description. Built for high-volume IT competitive hiring.
            </p>
          </section>

          {/* Backend Connectivity Card */}
          <section className="glass-card status-card" data-testid="health-card">
            <div className="status-header">
              <div className="status-title-group">
                <h3>Backend Connectivity Verification</h3>
                <span className="tag">FastAPI Core</span>
              </div>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={verifyBackendHealth}
                disabled={connectionState === 'checking'}
              >
                {connectionState === 'checking' ? 'Testing...' : 'Ping /health'}
              </button>
            </div>

            <div className="status-grid">
              <div className="status-item">
                <span className="status-label">Service Status</span>
                <span className="status-val">
                  {connectionState === 'connected' && 'Online (200 OK)'}
                  {connectionState === 'checking' && 'Pinging...'}
                  {connectionState === 'error' && 'Disconnected'}
                </span>
              </div>
              <div className="status-item">
                <span className="status-label">Latency</span>
                <span className="status-val">{latencyMs !== null ? `${latencyMs} ms` : '—'}</span>
              </div>
              <div className="status-item">
                <span className="status-label">Environment</span>
                <span className="status-val">{healthData?.environment ?? 'development'}</span>
              </div>
              <div className="status-item">
                <span className="status-label">API Gateway</span>
                <span className="status-val" style={{ fontSize: '0.8rem' }}>
                  {API_BASE_URL}
                </span>
              </div>
            </div>

            {errorMessage && (
              <div
                style={{
                  marginTop: '16px',
                  padding: '12px',
                  borderRadius: '6px',
                  background: 'rgba(244, 63, 94, 0.1)',
                  border: '1px solid rgba(244, 63, 94, 0.3)',
                  color: '#fda4af',
                  fontSize: '0.85rem',
                }}
              >
                <strong>Connection note:</strong> {errorMessage}. (Start the backend using{' '}
                <code>python app/main.py</code> or <code>uvicorn app.main:app</code>).
              </div>
            )}
          </section>

          {/* Architectural Pillars */}
          <section className="pillars-grid">
            <div className="glass-card pillar-card">
              <div className="pillar-icon">🎯</div>
              <h2 className="pillar-title">Transparent Keyword Gap</h2>
              <p className="pillar-desc">
                Clear categorization of missing must-have vs. good-to-have technical skills, with
                instant line-level evidence for all matched keywords.
              </p>
            </div>

            <div className="glass-card pillar-card">
              <div className="pillar-icon">✍️</div>
              <h2 className="pillar-title">Truthful Bullet Rewrites</h2>
              <p className="pillar-desc">
                Rewrites weak bullet points using the proven Google XYZ formula without inventing
                false metrics, company projects, or unperformed tasks.
              </p>
            </div>

            <div className="glass-card pillar-card">
              <div className="pillar-icon">🔒</div>
              <h2 className="pillar-title">DPDP 2023 Compliant</h2>
              <p className="pillar-desc">
                Ephemeral in-memory PDF parsing with zero persistent storage. Your sensitive career
                data is never sold or used to train third-party AI models.
              </p>
            </div>
          </section>

          {/* Transparent Anti-Snake-Oil Commitment */}
          <aside className="disclaimer-banner" role="note">
            <span className="disclaimer-icon">💡</span>
            <p className="disclaimer-text">
              <strong>Honesty Commitment:</strong> JobMate AI does not sell fake &quot;95% ATS
              selection score&quot; promises. We provide truthful lexical alignment, keyword
              evidence, and structured achievement rephrasing for human technical recruiters.
            </p>
          </aside>
        </div>
      </main>

      {/* Footer */}
      <footer className="app-footer">
        <div className="container">
          <p>JobMate AI © 2026 • Phase 0 Architecture Completed • Ready for Phase 1 Engine</p>
        </div>
      </footer>
    </div>
  );
};

export default App;
