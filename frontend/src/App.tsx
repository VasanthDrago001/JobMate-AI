import React, { useState, useEffect, useCallback } from 'react';
import './App.css';
import { Header } from './components/common/Header';
import { Footer } from './components/common/Footer';
import { LandingPage } from './components/landing/LandingPage';
import { AnalyzerPage } from './components/analyzer/AnalyzerPage';
import { LoadingProgress } from './components/loading/LoadingProgress';
import { ResultsPage } from './components/results/ResultsPage';
import { PrivacyPage } from './components/privacy/PrivacyPage';
import { JobFinderPage } from './components/jobs/JobFinderPage';
import { PrepPage } from './components/prep/PrepPage';
import { EmptyState, ErrorState } from './components/feedback/FeedbackStates';

import { api } from './services/api';
import { runResumeAnalysis } from './services/analysisService';
import {
  SAMPLE_JOB_DESCRIPTION,
  SAMPLE_RESUME_FILENAME,
} from './data/sampleData';
import type {
  AppView,
  AnalysisFormData,
  AnalysisResult,
  StageInfo,
} from './types/analysis';

const INITIAL_FORM_DATA: AnalysisFormData = {
  resumeFile: null,
  resumeFileName: '',
  targetRole: '',
  jobDescription: '',
  consentGiven: false,
};

const INITIAL_STAGE_INFO: StageInfo = {
  stage: 'idle',
  progressPercent: 0,
  title: 'Preparing Analysis',
  description: 'Initializing validation checks...',
};

/**
 * Main Application Root component for JobMate AI.
 *
 * Coordinates:
 * - View routing synchronized with browser URL hash (#analyzer, #jobs, #prep, #privacy, #results).
 * - Backend service health monitoring.
 * - Form state lifecycle and realistic sample evaluation loading.
 * - Multi-stage resume alignment orchestration with stage-by-stage feedback.
 */
export const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<AppView>('landing');
  const [isBackendConnected, setIsBackendConnected] = useState<boolean>(false);
  const [formData, setFormData] = useState<AnalysisFormData>(INITIAL_FORM_DATA);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [currentStage, setCurrentStage] = useState<StageInfo>(INITIAL_STAGE_INFO);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  /**
   * Synchronizes browser URL hash fragments with the internal active view state.
   */
  useEffect(() => {
    const syncHashToView = () => {
      const hash = window.location.hash.replace('#', '');
      if (hash === 'analyzer') {
        setCurrentView('analyzer');
      } else if (hash === 'privacy') {
        setCurrentView('privacy');
      } else if (hash === 'results') {
        setCurrentView('results');
      } else if (hash === 'jobs') {
        setCurrentView('jobs');
      } else if (hash === 'prep') {
        setCurrentView('prep');
      } else if (hash === '' || hash === 'landing') {
        setCurrentView('landing');
      }
    };

    syncHashToView();
    window.addEventListener('hashchange', syncHashToView);
    return () => window.removeEventListener('hashchange', syncHashToView);
  }, []);

  /**
   * Performs non-blocking health check against FastAPI backend to display connectivity pill.
   */
  useEffect(() => {
    let isMounted = true;
    api
      .checkHealth()
      .then(() => {
        if (isMounted) setIsBackendConnected(true);
      })
      .catch(() => {
        if (isMounted) setIsBackendConnected(false);
      });
    return () => {
      isMounted = false;
    };
  }, []);

  /**
   * Updates partial fields in the candidate analysis form data.
   */
  const handleUpdateFormData = useCallback((fields: Partial<AnalysisFormData>) => {
    setFormData((prev) => ({ ...prev, ...fields }));
  }, []);

  /**
   * Loads pre-configured sample Indian IT Full-Stack / Backend candidate profile for fast demonstration.
   */
  const handleLoadSample = useCallback(() => {
    setFormData({
      resumeFile: null,
      resumeFileName: SAMPLE_RESUME_FILENAME,
      targetRole: 'Senior Backend / Full-Stack Engineer (SDE-2)',
      jobDescription: SAMPLE_JOB_DESCRIPTION,
      consentGiven: true,
    });
    setErrorMessage(null);
    setCurrentView('analyzer');
    window.location.hash = '#analyzer';
    if (typeof window.scrollTo === 'function') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, []);

  /**
   * Dispatches resume analysis workflow across parser, matching engine, and bullet rewriter.
   */
  const handleStartAnalysis = async () => {
    setIsAnalyzing(true);
    setErrorMessage(null);

    try {
      const result = await runResumeAnalysis(formData, (stageInfo) => {
        setCurrentStage(stageInfo);
      });
      setAnalysisResult(result);
      setIsAnalyzing(false);
      setCurrentView('results');
      window.location.hash = '#results';
      if (typeof window.scrollTo === 'function') {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    } catch (err) {
      setIsAnalyzing(false);
      const msg = err instanceof Error ? err.message : 'An unexpected error occurred.';
      setErrorMessage(msg);
    }
  };

  /**
   * Cancels in-flight analysis and restores initial idle state.
   */
  const handleCancelAnalysis = () => {
    setIsAnalyzing(false);
    setCurrentStage(INITIAL_STAGE_INFO);
  };

  /**
   * Dispatches view navigation, updates URL hash, and smoothly scrolls to page top.
   */
  const handleNavigate = (view: AppView) => {
    setErrorMessage(null);
    setCurrentView(view);
    window.location.hash = view === 'landing' ? '' : `#${view}`;
    if (typeof window.scrollTo === 'function') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };


  return (
    <div className="app-wrapper">
      {/* Universal Top Header */}
      <Header
        currentView={currentView}
        onNavigate={handleNavigate}
        isBackendConnected={isBackendConnected}
      />

      {/* Main Content Area */}
      <main className="main-content" id="main-content">
        {/* State 1: Active Analysis in Progress */}
        {isAnalyzing ? (
          <LoadingProgress
            stageInfo={currentStage}
            onCancel={handleCancelAnalysis}
          />
        ) : errorMessage ? (
          /* State 2: Error State */
          <ErrorState
            errorMessage={errorMessage}
            onRetry={handleStartAnalysis}
            onReset={() => {
              setErrorMessage(null);
              setCurrentView('analyzer');
            }}
          />
        ) : (
          /* State 3: Page Views */
          <>
            {currentView === 'landing' && (
              <LandingPage
                onNavigate={handleNavigate}
                onLoadSample={handleLoadSample}
              />
            )}

            {currentView === 'analyzer' && (
              <AnalyzerPage
                formData={formData}
                onChangeFormData={handleUpdateFormData}
                onSubmitAnalysis={handleStartAnalysis}
                onLoadSample={handleLoadSample}
              />
            )}

            {currentView === 'results' &&
              (analysisResult ? (
                <ResultsPage
                  result={analysisResult}
                  onReanalyze={() => {
                    setCurrentView('analyzer');
                    window.location.hash = '#analyzer';
                  }}
                  onNavigateToJobs={() => handleNavigate('jobs')}
                  onNavigateToPrep={() => handleNavigate('prep')}
                />
              ) : (
                <EmptyState
                  onNavigate={handleNavigate}
                  onLoadSample={handleLoadSample}
                />
              ))}

            {currentView === 'jobs' && (
              <JobFinderPage
                initialRole={analysisResult?.targetRole || (formData.targetRole ? formData.targetRole : 'Senior Backend / Full-Stack Engineer')}
                candidateSkills={
                  analysisResult?.matchedSkills && analysisResult.matchedSkills.length > 0
                    ? analysisResult.matchedSkills.map((s) => s.name)
                    : undefined
                }
                onNavigateToAnalyzer={() => handleNavigate('analyzer')}
              />
            )}

            {currentView === 'prep' && (
              <PrepPage
                initialRole={analysisResult?.targetRole || (formData.targetRole ? formData.targetRole : 'Senior Backend / Full-Stack Engineer')}
                matchedSkills={
                  analysisResult?.matchedSkills && analysisResult.matchedSkills.length > 0
                    ? analysisResult.matchedSkills.map((s) => s.name)
                    : undefined
                }
                missingMustHave={
                  analysisResult?.missingSkills
                    ? analysisResult.missingSkills.filter((s) => s.importance === 'Must-Have').map((s) => s.name)
                    : undefined
                }
                missingGoodToHave={
                  analysisResult?.missingSkills
                    ? analysisResult.missingSkills.filter((s) => s.importance === 'Good-to-Have').map((s) => s.name)
                    : undefined
                }
                onNavigateToAnalyzer={() => handleNavigate('analyzer')}
                onNavigateToJobs={() => handleNavigate('jobs')}
              />
            )}

            {currentView === 'privacy' && (
              <PrivacyPage onNavigate={handleNavigate} />
            )}
          </>
        )}
      </main>

      {/* Universal Footer */}
      <Footer onNavigate={handleNavigate} />
    </div>
  );
};

export default App;
