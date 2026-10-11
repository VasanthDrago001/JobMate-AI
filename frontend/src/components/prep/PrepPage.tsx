import React, { useState, useEffect, useCallback } from 'react';
import type { PreparationRoadmap, PrepProgress } from '../../types/prep';
import { prepService } from '../../services/prepService';
import { GamificationBar } from './GamificationBar';
import { RoadmapView } from './RoadmapView';
import { QuizEngine } from './QuizEngine';

interface PrepPageProps {
  initialRole?: string;
  matchedSkills?: string[];
  missingMustHave?: string[];
  missingGoodToHave?: string[];
  onNavigateToAnalyzer?: () => void;
  onNavigateToJobs?: () => void;
}

/**
 * Interview Preparation & Skill Mastery Module page.
 *
 * Orchestrates:
 * - Deterministic 4-week structured preparation roadmaps based on resume strengths and gaps.
 * - Interactive technical quizzes with instant answer feedback and conceptual explanations.
 * - Client-side gamification (XP, level badges, and daily practice streaks).
 */
export const PrepPage: React.FC<PrepPageProps> = ({
  initialRole = 'Senior Backend / Full-Stack Engineer',
  matchedSkills = ['Python', 'FastAPI', 'PostgreSQL'],
  missingMustHave = ['Docker', 'Redis'],
  missingGoodToHave = ['Microservices Architecture'],
  onNavigateToAnalyzer,
  onNavigateToJobs,
}) => {
  const [activeTab, setActiveTab] = useState<'roadmap' | 'quiz'>('roadmap');
  const [progress, setProgress] = useState<PrepProgress>(() => prepService.loadProgress());
  const [roadmap, setRoadmap] = useState<PreparationRoadmap | null>(null);
  const [isLoadingRoadmap, setIsLoadingRoadmap] = useState<boolean>(false);
  const [activeQuizTopic, setActiveQuizTopic] = useState<string>('all');

  /**
   * Fetches or deterministically synthesizes the 4-week preparation plan.
   */
  const handleLoadRoadmap = useCallback(async () => {
    setIsLoadingRoadmap(true);
    try {
      const generated = await prepService.generateRoadmap(
        initialRole,
        matchedSkills,
        missingMustHave,
        missingGoodToHave
      );
      setRoadmap(generated);
    } catch {
      // Handled via service fallback
    } finally {
      setIsLoadingRoadmap(false);
    }
  }, [initialRole, matchedSkills, missingMustHave, missingGoodToHave]);

  useEffect(() => {
    handleLoadRoadmap();
  }, [handleLoadRoadmap]);

  /**
   * Toggles completion status of a roadmap week and awards +50 XP bonus.
   */
  const handleToggleRoadmapWeek = (weekNumber: number) => {
    const updated = prepService.toggleRoadmapWeek(weekNumber);
    setProgress({ ...updated });
  };

  /**
   * Refreshes client-side progress state after completing a technical quiz session.
   */
  const handleQuizCompleted = () => {
    // Reload local progress after quiz completion
    const updated = prepService.loadProgress();
    setProgress({ ...updated });
  };

  /**
   * Switches to quiz view focused on a specific roadmap topic.
   */
  const handleStartTopicDrill = (topicName: string) => {
    setActiveQuizTopic(topicName);
    setActiveTab('quiz');
  };


  return (
    <div className="prep-page container" id="prep-page-content">
      {/* Top Banner */}
      <div className="prep-header glass-card">
        <div className="prep-header-content">
          <span className="section-badge">💡 Phase 3 Feature</span>
          <h1 className="prep-title">Interview Preparation & Skill Mastery</h1>
          <p className="prep-subtitle">
            Targeted technical roadmaps and interactive topic quizzes synthesized directly from your
            resume evidence and target Job Description requirements.
          </p>

          {/* Active Skills Context Strip */}
          <div className="active-skills-strip">
            <span className="skills-strip-label">Contextual Profile Grounding:</span>
            <div className="skills-pill-group">
              {matchedSkills.map((s) => (
                <span key={s} className="candidate-skill-pill" title="Verified in resume">
                  ✓ {s}
                </span>
              ))}
              {missingMustHave.map((s) => (
                <span
                  key={s}
                  className="candidate-skill-pill gap-pill"
                  title="Missing Must-Have in JD"
                  style={{
                    background: 'rgba(244, 63, 94, 0.15)',
                    color: '#fda4af',
                    borderColor: 'rgba(244, 63, 94, 0.35)',
                  }}
                >
                  ⚠️ {s} (Gap)
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Gamification Bar */}
      <GamificationBar progress={progress} />

      {/* Main Tab Navigation */}
      <div className="prep-tabs-bar" role="tablist">
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'roadmap'}
          className={`tab-btn ${activeTab === 'roadmap' ? 'tab-active' : ''}`}
          onClick={() => setActiveTab('roadmap')}
          data-testid="tab-roadmap"
        >
          🗺️ 4-Week Preparation Roadmap
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'quiz'}
          className={`tab-btn ${activeTab === 'quiz' ? 'tab-active' : ''}`}
          onClick={() => setActiveTab('quiz')}
          data-testid="tab-quiz"
        >
          🎯 Technical Quizzes & Speed Drills
        </button>
      </div>

      {/* Tab 1: Roadmap View */}
      {activeTab === 'roadmap' &&
        (isLoadingRoadmap ? (
          <div className="glass-card quiz-card quiz-loading-card">
            <div className="loading-spinner" />
            <p>Synthesizing role preparation roadmap...</p>
          </div>
        ) : roadmap ? (
          <RoadmapView
            roadmap={roadmap}
            progress={progress}
            onToggleWeek={handleToggleRoadmapWeek}
            onStartQuizTopic={handleStartTopicDrill}
          />
        ) : null)}

      {/* Tab 2: Quiz Engine View */}
      {activeTab === 'quiz' && (
        <QuizEngine
          initialTopic={activeQuizTopic}
          onQuizCompleted={handleQuizCompleted}
          onNavigateToRoadmap={() => setActiveTab('roadmap')}
        />
      )}

      {/* Footer Navigation CTA */}
      <div className="prep-footer-actions glass-card no-print">
        <div className="footer-actions-text">
          <h4>Ready to apply your knowledge or re-scan your CV?</h4>
          <p>
            Match your newly prepared skills against real Indian IT jobs or run another analysis.
          </p>
        </div>
        <div className="footer-btn-group">
          {onNavigateToJobs && (
            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={onNavigateToJobs}
            >
              🎯 View Matching Jobs
            </button>
          )}
          {onNavigateToAnalyzer && (
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={onNavigateToAnalyzer}
            >
              Scan Another Resume
            </button>
          )}
        </div>
      </div>

      {/* Honest Disclaimer */}
      <footer className="finder-attribution-footer glass-card">
        <p className="attribution-text">
          💡 <strong>Honest Practice Disclaimer:</strong> JobMate AI practice questions and roadmaps
          are synthetic educational preparation materials aligned with Indian IT industry benchmarks.
          They are not actual, leaked, or confidential questions from any employer.
        </p>
      </footer>
    </div>
  );
};
