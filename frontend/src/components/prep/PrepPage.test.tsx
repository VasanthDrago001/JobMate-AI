import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { PrepPage } from './PrepPage';
import { prepService } from '../../services/prepService';
import type { PreparationRoadmap, QuizQuestion, QuizSessionResult } from '../../types/prep';

const MOCK_ROADMAP: PreparationRoadmap = {
  target_role: 'Senior Backend Engineer',
  roadmap_version: 'v1.0.0-deterministic',
  total_estimated_hours: 68,
  matched_skills_covered: 3,
  gaps_targeted: 3,
  honest_disclaimer: 'Deterministic study roadmap.',
  weeks: [
    {
      week_number: 1,
      theme: 'Reinforce Strengths & Fundamentals',
      focus_objective: 'Deep dive into Python and FastAPI.',
      estimated_weekly_hours: 18,
      topics: [
        {
          topic_name: 'Python Internals',
          category: 'Programming',
          priority: 'refresher',
          estimated_hours: 6,
          key_concepts: ['GIL', 'Generators'],
          recommended_practice_focus: 'Write LRU cache.',
        },
      ],
    },
    {
      week_number: 2,
      theme: 'Critical Must-Have Gap Closure',
      focus_objective: 'Master Docker containerization.',
      estimated_weekly_hours: 20,
      topics: [
        {
          topic_name: 'Docker & Compose',
          category: 'DevOps',
          priority: 'high',
          estimated_hours: 8,
          key_concepts: ['Multi-stage builds'],
          recommended_practice_focus: 'Containerize backend service.',
        },
      ],
    },
    {
      week_number: 3,
      theme: 'System Design Patterns',
      focus_objective: 'Architect scalable distributed systems.',
      estimated_weekly_hours: 18,
      topics: [
        {
          topic_name: 'Caching with Redis',
          category: 'Architecture',
          priority: 'medium',
          estimated_hours: 6,
          key_concepts: ['LRU eviction', 'Distributed locks'],
          recommended_practice_focus: 'Build rate limiter.',
        },
      ],
    },
    {
      week_number: 4,
      theme: 'Mock Drills & STAR Storytelling',
      focus_objective: 'Practice concise project stories and timed drills.',
      estimated_weekly_hours: 12,
      topics: [
        {
          topic_name: 'STAR Storytelling Drill',
          category: 'Behavioral',
          priority: 'high',
          estimated_hours: 6,
          key_concepts: ['STAR formula'],
          recommended_practice_focus: 'Deliver 2-minute overviews.',
        },
      ],
    },
  ],
};

const MOCK_QUIZ_QUESTIONS: QuizQuestion[] = [
  {
    id: 'py-001',
    topic: 'Python',
    difficulty: 'beginner',
    question_text: 'What is the difference between a list and a tuple in Python?',
    options: [
      'Lists are immutable while tuples are mutable',
      'Lists are mutable while tuples are immutable',
      'Lists can only store integers',
      'Tuples cannot be iterated',
    ],
    concept_tested: 'Data Structures & Mutability',
  },
];

const MOCK_QUIZ_RESULT: QuizSessionResult = {
  topic: 'Python',
  total_questions: 1,
  correct_count: 1,
  score_percentage: 100,
  xp_earned: 35,
  results: [
    {
      question_id: 'py-001',
      is_correct: true,
      selected_index: 1,
      correct_index: 1,
      explanation: 'Lists are mutable while tuples are immutable.',
      concept_tested: 'Data Structures & Mutability',
    },
  ],
  feedback_message: 'Excellent performance!',
  disclaimer: 'Synthetic practice questions.',
};

vi.mock('../../services/prepService', () => ({
  prepService: {
    loadProgress: vi.fn(),
    saveProgress: vi.fn(),
    recordQuizCompletion: vi.fn(),
    toggleRoadmapWeek: vi.fn(),
    getTopics: vi.fn(),
    getQuizQuestions: vi.fn(),
    submitQuiz: vi.fn(),
    generateRoadmap: vi.fn(),
  },
}));

describe('PrepPage Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(prepService.loadProgress).mockReturnValue({
      xp: 45,
      level: 1,
      streakDays: 3,
      lastPracticedDate: '2026-10-10',
      completedRoadmapWeeks: [],
      quizzesTaken: 1,
      unlockedBadges: [
        {
          id: 'first_quiz',
          title: 'First Step',
          description: 'Completed your first practice technical quiz',
          icon: '🚀',
          unlockedAt: '2026-10-10T12:00:00Z',
        },
      ],
    });
    vi.mocked(prepService.getTopics).mockResolvedValue([
      {
        topic_id: 'python',
        display_name: 'Python',
        total_questions: 5,
        available_difficulties: ['beginner', 'intermediate'],
      },
    ]);
    vi.mocked(prepService.generateRoadmap).mockResolvedValue(MOCK_ROADMAP);
    vi.mocked(prepService.getQuizQuestions).mockResolvedValue(MOCK_QUIZ_QUESTIONS);
    vi.mocked(prepService.submitQuiz).mockResolvedValue(MOCK_QUIZ_RESULT);
    vi.mocked(prepService.toggleRoadmapWeek).mockReturnValue({
      xp: 95,
      level: 1,
      streakDays: 3,
      lastPracticedDate: '2026-10-10',
      completedRoadmapWeeks: [1],
      quizzesTaken: 1,
      unlockedBadges: [],
    });
  });

  it('renders gamification bar with XP, level, and streak', async () => {
    render(
      <PrepPage
        initialRole="Senior Backend Engineer"
        matchedSkills={['Python', 'FastAPI']}
        missingMustHave={['Docker']}
      />
    );

    expect(screen.getByText(/Interview Preparation & Skill Mastery/i)).toBeInTheDocument();
    expect(screen.getByText('45 XP')).toBeInTheDocument();
    expect(screen.getByText('Level 1')).toBeInTheDocument();
    expect(screen.getByText('3-Day Streak')).toBeInTheDocument();
    expect(screen.getByText('🚀')).toBeInTheDocument();
  });

  it('renders 4-week preparation roadmap and allows marking weeks complete', async () => {
    render(
      <PrepPage
        initialRole="Senior Backend Engineer"
        matchedSkills={['Python', 'FastAPI']}
        missingMustHave={['Docker']}
      />
    );

    await waitFor(() => {
      expect(screen.getByText(/Reinforce Strengths & Fundamentals/i)).toBeInTheDocument();
      expect(screen.getByText(/Critical Must-Have Gap Closure/i)).toBeInTheDocument();
    });

    // Mark Week 1 as complete
    const markButtons = screen.getAllByRole('button', { name: /Mark as Done/i });
    fireEvent.click(markButtons[0]);

    expect(prepService.toggleRoadmapWeek).toHaveBeenCalledWith(1);
  });

  it('switches to Quiz tab, answers a question, and displays score with explanation', async () => {
    render(
      <PrepPage
        initialRole="Senior Backend Engineer"
        matchedSkills={['Python']}
      />
    );

    // Switch to Quiz tab
    const quizTab = screen.getByTestId('tab-quiz');
    fireEvent.click(quizTab);

    await waitFor(() => {
      expect(screen.getByText(/What is the difference between a list and a tuple in Python\?/i)).toBeInTheDocument();
    });

    // Select option B (index 1)
    const optB = screen.getByTestId('quiz-opt-1');
    fireEvent.click(optB);

    // Click submit
    const submitBtn = screen.getByTestId('btn-submit-quiz');
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByTestId('quiz-result-view')).toBeInTheDocument();
      expect(screen.getByText('100%')).toBeInTheDocument();
      expect(screen.getByText('⭐ +35 XP Earned')).toBeInTheDocument();
      expect(screen.getByText(/Lists are mutable while tuples are immutable./i)).toBeInTheDocument();
    });
  });
});
