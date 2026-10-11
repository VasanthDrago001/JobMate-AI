import React from 'react';
import type { PrepProgress } from '../../types/prep';

interface GamificationBarProps {
  progress: PrepProgress;
}

export const GamificationBar: React.FC<GamificationBarProps> = ({ progress }) => {
  const xpInCurrentLevel = progress.xp % 100;
  const levelProgressPct = Math.min(100, Math.max(0, xpInCurrentLevel));

  const getRankTitle = (lvl: number): string => {
    if (lvl <= 1) return 'Aspiring Developer';
    if (lvl === 2) return 'Junior Engineer';
    if (lvl === 3) return 'Core Contributor';
    if (lvl === 4) return 'Senior Specialist';
    return 'Staff / Tech Lead';
  };

  return (
    <div className="gamification-bar glass-card" aria-label="Learning Progress and XP">
      <div className="gamification-stats">
        {/* Level and Rank */}
        <div className="stat-pill-item">
          <span className="stat-pill-icon" aria-hidden="true">
            ⚡
          </span>
          <div className="stat-pill-details">
            <span className="stat-pill-title">Level {progress.level}</span>
            <span className="stat-pill-sub">{getRankTitle(progress.level)}</span>
          </div>
        </div>

        {/* XP Counter */}
        <div className="stat-pill-item">
          <span className="stat-pill-icon" aria-hidden="true">
            ⭐
          </span>
          <div className="stat-pill-details">
            <span className="stat-pill-title">{progress.xp} XP</span>
            <div className="xp-mini-track" title={`${xpInCurrentLevel}/100 XP to Level ${progress.level + 1}`}>
              <div
                className="xp-mini-fill"
                style={{ width: `${levelProgressPct}%` }}
              />
            </div>
          </div>
        </div>

        {/* Daily Streak */}
        <div className="stat-pill-item">
          <span className="stat-pill-icon" aria-hidden="true">
            🔥
          </span>
          <div className="stat-pill-details">
            <span className="stat-pill-title">{progress.streakDays}-Day Streak</span>
            <span className="stat-pill-sub">Practice Daily</span>
          </div>
        </div>

        {/* Badges preview */}
        <div className="stat-pill-item badges-item">
          <span className="stat-pill-icon" aria-hidden="true">
            🏅
          </span>
          <div className="stat-pill-details">
            <span className="stat-pill-title">
              {progress.unlockedBadges.length} Badge
              {progress.unlockedBadges.length !== 1 ? 's' : ''}
            </span>
            <div className="mini-badges-row">
              {progress.unlockedBadges.length === 0 ? (
                <span className="stat-pill-sub">Complete a quiz to earn</span>
              ) : (
                progress.unlockedBadges.map((b) => (
                  <span
                    key={b.id}
                    className="mini-badge-icon"
                    title={`${b.title}: ${b.description}`}
                  >
                    {b.icon}
                  </span>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
