import React from 'react';
import type { PreparationRoadmap, PrepProgress } from '../../types/prep';

interface RoadmapViewProps {
  roadmap: PreparationRoadmap;
  progress: PrepProgress;
  onToggleWeek: (weekNumber: number) => void;
  onStartQuizTopic: (topicName: string) => void;
}

export const RoadmapView: React.FC<RoadmapViewProps> = ({
  roadmap,
  progress,
  onToggleWeek,
  onStartQuizTopic,
}) => {
  return (
    <div className="roadmap-view-container" id="printable-roadmap">
      {/* Overview Banner */}
      <div className="roadmap-meta-header glass-card">
        <div className="roadmap-meta-main">
          <span className="section-badge">🗺️ Structured 4-Week Plan</span>
          <h2 className="roadmap-title">
            Tailored Preparation Roadmap for {roadmap.target_role}
          </h2>
          <p className="roadmap-desc">
            Synthesized deterministically from your resume analysis. Reinforce verified strengths in Week 1,
            close critical must-have gaps in Week 2, master scalable architecture in Week 3, and rehearse STAR
            storytelling in Week 4.
          </p>
        </div>
        <div className="roadmap-meta-stats">
          <div className="meta-stat-box">
            <span className="stat-big-num">{roadmap.total_estimated_hours}h</span>
            <span className="stat-sub">Total Study Time</span>
          </div>
          <div className="meta-stat-box">
            <span className="stat-big-num">{roadmap.matched_skills_covered}</span>
            <span className="stat-sub">Strengths Refreshed</span>
          </div>
          <div className="meta-stat-box">
            <span className="stat-big-num">{roadmap.gaps_targeted}</span>
            <span className="stat-sub">Gaps Targeted</span>
          </div>
        </div>
      </div>

      {/* 4-Week Timeline Cards */}
      <div className="roadmap-timeline">
        {roadmap.weeks.map((week) => {
          const isCompleted = progress.completedRoadmapWeeks.includes(week.week_number);

          return (
            <div
              key={week.week_number}
              className={`roadmap-week-card glass-card ${isCompleted ? 'week-completed' : ''}`}
              data-testid={`roadmap-week-${week.week_number}`}
            >
              <div className="week-header-row">
                <div className="week-badge-col">
                  <span className="week-number-tag">Week {week.week_number}</span>
                  <h3 className="week-theme-title">{week.theme}</h3>
                </div>

                <div className="week-actions-col">
                  <span className="week-hours-pill">⏱️ ~{week.estimated_weekly_hours} Hours</span>
                  <button
                    type="button"
                    className={`btn btn-sm ${isCompleted ? 'btn-success' : 'btn-secondary'}`}
                    onClick={() => onToggleWeek(week.week_number)}
                    title="Mark week completed to earn +50 XP"
                  >
                    {isCompleted ? '✓ Completed (+50 XP)' : 'Mark as Done'}
                  </button>
                </div>
              </div>

              <p className="week-objective-text">{week.focus_objective}</p>

              {/* Topics Grid */}
              <div className="week-topics-grid">
                {week.topics.map((t) => (
                  <div key={t.topic_name} className="roadmap-topic-card">
                    <div className="topic-card-header">
                      <span
                        className={`priority-pill priority-${t.priority}`}
                      >
                        {t.priority === 'high'
                          ? 'High Priority Gap'
                          : t.priority === 'refresher'
                          ? 'Core Refresher'
                          : 'Secondary Pattern'}
                      </span>
                      <span className="topic-hours-text">{t.estimated_hours}h focus</span>
                    </div>

                    <h4 className="topic-title">{t.topic_name}</h4>
                    <span className="topic-category-text">{t.category}</span>

                    <div className="topic-concepts-box">
                      <span className="concepts-label">Key Conceptual Targets:</span>
                      <ul className="concepts-list">
                        {t.key_concepts.map((concept, idx) => (
                          <li key={idx}>{concept}</li>
                        ))}
                      </ul>
                    </div>

                    <div className="topic-practice-box">
                      <span className="practice-icon">🛠️</span>
                      <p className="practice-prompt">
                        <strong>Practical Exercise:</strong> {t.recommended_practice_focus}
                      </p>
                    </div>

                    <div className="topic-card-footer">
                      <button
                        type="button"
                        className="btn btn-secondary btn-sm w-full"
                        onClick={() => onStartQuizTopic(t.topic_name)}
                      >
                        Practice Quiz Drill 🎯
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
