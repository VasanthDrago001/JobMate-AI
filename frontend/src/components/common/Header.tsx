import React, { useState } from 'react';
import type { AppView } from '../../types/analysis';

interface HeaderProps {
  currentView: AppView;
  onNavigate: (view: AppView) => void;
  isBackendConnected: boolean;
}

/**
 * Application top navigation header.
 *
 * Provides responsive navigation across Overview, Analyzer, Job Finder,
 * Prep, and Privacy views, along with backend connectivity status
 * and persistent launch actions with stable layout sizing.
 */
export const Header: React.FC<HeaderProps> = ({
  currentView,
  onNavigate,
  isBackendConnected,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  /**
   * Dispatches navigation request and closes the mobile drawer if open.
   */
  const handleNavClick = (view: AppView) => {
    onNavigate(view);
    setMobileMenuOpen(false);
  };

  /**
   * Handles Primary CTA clicks. Navigates to analyzer or scrolls directly
   * to the upload form if the user is already on the analyzer view.
   */
  const handleLaunchClick = () => {
    if (currentView === 'analyzer') {
      const formEl = document.getElementById('analyzer-form');
      if (formEl && typeof formEl.scrollIntoView === 'function') {
        formEl.scrollIntoView({ behavior: 'smooth' });
      }
    } else {
      handleNavClick('analyzer');
    }
  };

  return (
    <header className="app-header" role="banner">
      <div className="container header-container">
        <div
          className="brand-logo"
          onClick={() => handleNavClick('landing')}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              handleNavClick('landing');
            }
          }}
          aria-label="JobMate AI Home"
        >
          <div className="logo-badge" aria-hidden="true">
            JM
          </div>
          <div className="brand-text">
            <span className="brand-name">JobMate AI</span>
            <span className="brand-tagline">Indian IT Career Intelligence</span>
          </div>
        </div>

        {/* Desktop Navigation */}
        <nav className="desktop-nav" aria-label="Main Navigation">
          <button
            type="button"
            className={`nav-link ${currentView === 'landing' ? 'active' : ''}`}
            onClick={() => handleNavClick('landing')}
            aria-current={currentView === 'landing' ? 'page' : undefined}
          >
            Overview
          </button>
          <button
            type="button"
            className={`nav-link ${currentView === 'analyzer' ? 'active' : ''}`}
            onClick={() => handleNavClick('analyzer')}
            aria-current={currentView === 'analyzer' ? 'page' : undefined}
          >
            Resume Analyzer
          </button>
          <button
            type="button"
            className={`nav-link ${currentView === 'jobs' ? 'active' : ''}`}
            onClick={() => handleNavClick('jobs')}
            aria-current={currentView === 'jobs' ? 'page' : undefined}
          >
            Job Finder 🎯
          </button>
          <button
            type="button"
            className={`nav-link ${currentView === 'prep' ? 'active' : ''}`}
            onClick={() => handleNavClick('prep')}
            aria-current={currentView === 'prep' ? 'page' : undefined}
          >
            Interview Prep 💡
          </button>
          <button
            type="button"
            className={`nav-link ${currentView === 'privacy' ? 'active' : ''}`}
            onClick={() => handleNavClick('privacy')}
            aria-current={currentView === 'privacy' ? 'page' : undefined}
          >
            Privacy & DPDP
          </button>
        </nav>

        {/* Status indicator & CTA */}
        <div className="header-actions">
          <div
            className="status-pill"
            title={
              isBackendConnected
                ? 'Connected to local FastAPI backend'
                : 'Running in deterministic demo mode'
            }
          >
            <span
              className={`status-dot ${isBackendConnected ? 'online' : 'checking'}`}
              aria-hidden="true"
            />
            <span className="status-text">
              {isBackendConnected ? 'FastAPI Online' : 'Preview Mode'}
            </span>
          </div>

          <button
            type="button"
            className="btn btn-primary btn-sm launch-btn"
            onClick={handleLaunchClick}
            aria-label="Launch Resume Analyzer"
          >
            Start Analysis →
          </button>

          {/* Mobile hamburger button */}
          <button
            type="button"
            className="mobile-menu-toggle"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-expanded={mobileMenuOpen}
            aria-label="Toggle navigation menu"
          >
            <span className="hamburger-line" />
            <span className="hamburger-line" />
            <span className="hamburger-line" />
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="mobile-nav-drawer" role="dialog" aria-modal="true">
          <button
            type="button"
            className={`mobile-nav-link ${currentView === 'landing' ? 'active' : ''}`}
            onClick={() => handleNavClick('landing')}
          >
            Overview
          </button>
          <button
            type="button"
            className={`mobile-nav-link ${currentView === 'analyzer' ? 'active' : ''}`}
            onClick={() => handleNavClick('analyzer')}
          >
            Resume Analyzer
          </button>
          <button
            type="button"
            className={`mobile-nav-link ${currentView === 'jobs' ? 'active' : ''}`}
            onClick={() => handleNavClick('jobs')}
          >
            Job Finder 🎯
          </button>
          <button
            type="button"
            className={`mobile-nav-link ${currentView === 'prep' ? 'active' : ''}`}
            onClick={() => handleNavClick('prep')}
          >
            Interview Prep 💡
          </button>
          <button
            type="button"
            className={`mobile-nav-link ${currentView === 'privacy' ? 'active' : ''}`}
            onClick={() => handleNavClick('privacy')}
          >
            Privacy & Limitations
          </button>
          <button
            type="button"
            className="btn btn-primary w-full"
            style={{ marginTop: '12px' }}
            onClick={() => handleNavClick('analyzer')}
          >
            Launch Resume Analyzer
          </button>
        </div>
      )}
    </header>
  );
};
