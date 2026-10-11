export type DifficultyLevel = 'beginner' | 'intermediate' | 'advanced';
export type PriorityLevel = 'high' | 'medium' | 'refresher';

export interface QuizQuestion {
  id: string;
  topic: string;
  difficulty: DifficultyLevel;
  question_text: string;
  options: string[];
  concept_tested: string;
}

export interface QuizSubmissionItem {
  question_id: string;
  selected_option_index: number;
}

export interface QuizSubmission {
  topic: string;
  answers: QuizSubmissionItem[];
}

export interface QuizResultItem {
  question_id: string;
  is_correct: boolean;
  selected_index: number;
  correct_index: number;
  explanation: string;
  concept_tested: string;
}

export interface QuizSessionResult {
  topic: string;
  total_questions: number;
  correct_count: number;
  score_percentage: number;
  xp_earned: number;
  results: QuizResultItem[];
  feedback_message: string;
  disclaimer: string;
}

export interface TopicSummary {
  topic_id: string;
  display_name: string;
  total_questions: number;
  available_difficulties: string[];
}

export interface RoadmapTopicItem {
  topic_name: string;
  category: string;
  priority: PriorityLevel;
  estimated_hours: number;
  key_concepts: string[];
  recommended_practice_focus: string;
}

export interface RoadmapWeek {
  week_number: number;
  theme: string;
  focus_objective: string;
  estimated_weekly_hours: number;
  topics: RoadmapTopicItem[];
}

export interface PreparationRoadmap {
  target_role: string;
  roadmap_version: string;
  total_estimated_hours: number;
  weeks: RoadmapWeek[];
  matched_skills_covered: number;
  gaps_targeted: number;
  honest_disclaimer: string;
}

export interface PrepProgress {
  xp: number;
  level: number;
  streakDays: number;
  lastPracticedDate: string | null;
  completedRoadmapWeeks: number[];
  quizzesTaken: number;
  unlockedBadges: {
    id: string;
    title: string;
    description: string;
    icon: string;
    unlockedAt: string;
  }[];
}
