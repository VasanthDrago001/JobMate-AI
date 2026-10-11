import React, { useState, useEffect, useCallback } from 'react';
import type {
  TopicSummary,
  QuizQuestion,
  QuizSessionResult,
  DifficultyLevel,
} from '../../types/prep';
import { prepService } from '../../services/prepService';

interface QuizEngineProps {
  initialTopic?: string;
  onQuizCompleted?: (xpEarned: number) => void;
  onNavigateToRoadmap?: () => void;
}

/**
 * Interactive Technical Quiz Engine component.
 *
 * Provides timed multiple-choice practice drills across Indian IT tech stacks:
 * - Real-time question progress bar.
 * - Single-select choice tiles with accessible radio roles and keyboard focus.
 * - Deterministic scoring and XP calculation upon submission.
 * - In-depth conceptual explanations for every question option.
 */
export const QuizEngine: React.FC<QuizEngineProps> = ({
  initialTopic = 'all',
  onQuizCompleted,
  onNavigateToRoadmap,
}) => {
  const [topics, setTopics] = useState<TopicSummary[]>([]);
  const [selectedTopic, setSelectedTopic] = useState<string>(initialTopic);
  const [selectedDifficulty, setSelectedDifficulty] = useState<DifficultyLevel | 'all'>('all');

  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState<number>(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, number>>({});

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const [quizResult, setQuizResult] = useState<QuizSessionResult | null>(null);

  // Load available topics on mount
  useEffect(() => {
    prepService.getTopics().then((topList) => {
      setTopics(topList);
    });
  }, []);

  /**
   * Fetches practice questions matching selected topic and difficulty tier.
   *
   * @param topicOverride Optional topic string to override selected state.
   */
  const handleLoadQuiz = useCallback(async (topicOverride?: string) => {
    setIsLoading(true);
    setError(null);
    setQuizResult(null);
    setCurrentQuestionIndex(0);
    setSelectedAnswers({});

    const topicToFetch = topicOverride || selectedTopic;

    try {
      const qList = await prepService.getQuizQuestions(
        topicToFetch,
        selectedDifficulty === 'all' ? undefined : selectedDifficulty,
        5
      );
      setQuestions(qList);
      if (qList.length === 0) {
        setError('No questions found for the selected topic and difficulty.');
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to retrieve quiz questions.';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  }, [selectedTopic, selectedDifficulty]);

  // Load quiz on mount or topic change
  useEffect(() => {
    handleLoadQuiz();
  }, [handleLoadQuiz]);

  /**
   * Records candidate's answer choice index for a question.
   */
  const handleSelectOption = (questionId: string, optionIndex: number) => {
    if (quizResult) return; // Prevent change after submission
    setSelectedAnswers((prev) => ({
      ...prev,
      [questionId]: optionIndex,
    }));
  };

  /**
   * Evaluates answers and submits quiz session to backend / local evaluator.
   */
  const handleSubmitQuiz = async () => {
    if (questions.length === 0) return;

    // Check if all questions have answers
    const unansweredCount = questions.filter((q) => selectedAnswers[q.id] === undefined).length;
    if (unansweredCount > 0) {
      const confirmSubmit = window.confirm(
        `You have ${unansweredCount} unanswered question(s). Submit anyway?`
      );
      if (!confirmSubmit) return;
    }

    setIsSubmitting(true);
    setError(null);

    const submissionPayload = {
      topic: selectedTopic === 'all' ? 'Mixed Topics' : selectedTopic,
      answers: questions.map((q) => ({
        question_id: q.id,
        selected_option_index: selectedAnswers[q.id] !== undefined ? selectedAnswers[q.id] : 0,
      })),
    };

    try {
      const result = await prepService.submitQuiz(submissionPayload);
      setQuizResult(result);
      if (onQuizCompleted) {
        onQuizCompleted(result.xp_earned);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error evaluating quiz submission.';
      setError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };


  const currentQ = questions[currentQuestionIndex];
  const totalQ = questions.length;
  const progressPct = totalQ > 0 ? ((currentQuestionIndex + 1) / totalQ) * 100 : 0;

  return (
    <div className="quiz-engine-container">
      {/* Quiz Filter & Topic Selector Bar */}
      <div className="quiz-toolbar glass-card">
        <div className="quiz-toolbar-left">
          <label htmlFor="quiz-topic-select" className="filter-label">
            Skill Topic:
          </label>
          <select
            id="quiz-topic-select"
            className="filter-select"
            value={selectedTopic}
            onChange={(e) => {
              setSelectedTopic(e.target.value);
            }}
          >
            <option value="all">⚡ All Practice Topics (Mixed)</option>
            {topics.map((t) => (
              <option key={t.topic_id} value={t.display_name}>
                {t.display_name} ({t.total_questions} questions)
              </option>
            ))}
          </select>
        </div>

        <div className="quiz-toolbar-middle">
          <span className="filter-label">Difficulty:</span>
          <div className="pill-toggle-group">
            {(['all', 'beginner', 'intermediate', 'advanced'] as const).map((diff) => (
              <button
                key={diff}
                type="button"
                className={`pill-toggle-btn ${selectedDifficulty === diff ? 'active' : ''}`}
                onClick={() => setSelectedDifficulty(diff)}
              >
                {diff === 'all' ? 'All' : diff.charAt(0).toUpperCase() + diff.slice(1)}
              </button>
            ))}
          </div>
        </div>

        <div className="quiz-toolbar-right">
          <button
            type="button"
            className="btn btn-primary btn-sm"
            onClick={() => handleLoadQuiz()}
            disabled={isLoading}
          >
            {isLoading ? 'Loading...' : 'New Drill 🔄'}
          </button>
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div className="glass-card finder-error-alert" role="alert">
          <span className="alert-icon">⚠️</span>
          <span>{error}</span>
          <button
            type="button"
            className="retry-link-btn"
            onClick={() => handleLoadQuiz()}
          >
            Try Again
          </button>
        </div>
      )}

      {/* Loading state */}
      {isLoading ? (
        <div className="glass-card quiz-card quiz-loading-card">
          <div className="loading-spinner" />
          <p>Loading curated practice questions...</p>
        </div>
      ) : quizResult ? (
        /* Results View */
        <div className="glass-card quiz-card quiz-result-card" data-testid="quiz-result-view">
          <div className="quiz-result-header">
            <div className="score-radial-box">
              <span className="score-percentage-text">{quizResult.score_percentage}%</span>
              <span className="score-label">Score</span>
            </div>

            <div className="result-header-text">
              <div className="xp-award-pill">
                ⭐ +{quizResult.xp_earned} XP Earned
              </div>
              <h3 className="result-headline">
                {quizResult.correct_count} of {quizResult.total_questions} Questions Correct
              </h3>
              <p className="result-feedback">{quizResult.feedback_message}</p>
            </div>
          </div>

          {/* Question Breakdown with Explanations */}
          <div className="result-answers-list">
            <h4 className="breakdown-heading">Detailed Explanations & Answers:</h4>
            {quizResult.results.map((res, idx) => {
              const qOriginal = questions.find((q) => q.id === res.question_id);
              const selectedOptText =
                qOriginal && qOriginal.options[res.selected_index] !== undefined
                  ? qOriginal.options[res.selected_index]
                  : `Option ${res.selected_index + 1}`;
              const correctOptText =
                qOriginal && qOriginal.options[res.correct_index] !== undefined
                  ? qOriginal.options[res.correct_index]
                  : `Option ${res.correct_index + 1}`;

              return (
                <div
                  key={res.question_id}
                  className={`result-item-card ${res.is_correct ? 'item-correct' : 'item-incorrect'}`}
                >
                  <div className="result-item-top">
                    <span className="item-verdict-badge">
                      {res.is_correct ? '✓ Correct' : '✗ Needs Review'}
                    </span>
                    <span className="item-concept-tag">{res.concept_tested}</span>
                  </div>

                  <p className="item-question-text">
                    <strong>Q{idx + 1}:</strong> {qOriginal?.question_text}
                  </p>

                  <div className="item-choices-comparison">
                    <div className="choice-row user-choice">
                      <span className="choice-label">Your Answer:</span>
                      <span className="choice-val">{selectedOptText}</span>
                    </div>
                    {!res.is_correct && (
                      <div className="choice-row correct-choice">
                        <span className="choice-label">Correct Answer:</span>
                        <span className="choice-val">{correctOptText}</span>
                      </div>
                    )}
                  </div>

                  <div className="item-explanation-box">
                    <span className="exp-icon">💡</span>
                    <p className="exp-text">
                      <strong>Conceptual Rationale:</strong> {res.explanation}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="quiz-result-actions">
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => handleLoadQuiz()}
            >
              Take Another Quiz Drill 🔄
            </button>
            {onNavigateToRoadmap && (
              <button
                type="button"
                className="btn btn-secondary"
                onClick={onNavigateToRoadmap}
              >
                Back to Roadmap 🗺️
              </button>
            )}
          </div>
        </div>
      ) : currentQ ? (
        /* Active Interactive Question Card */
        <div className="glass-card quiz-card" data-testid="active-quiz-card">
          {/* Progress Header */}
          <div className="quiz-progress-header">
            <div className="quiz-progress-meta">
              <span className="q-counter">
                Question {currentQuestionIndex + 1} of {totalQ}
              </span>
              <span className="q-concept-badge">{currentQ.concept_tested}</span>
              <span className="q-difficulty-badge">{currentQ.difficulty}</span>
            </div>
            <div className="quiz-progress-bar-track">
              <div
                className="quiz-progress-bar-fill"
                style={{ width: `${progressPct}%` }}
              />
            </div>
          </div>

          {/* Question Text */}
          <h3 className="quiz-question-prompt">{currentQ.question_text}</h3>

          {/* Options Grid */}
          <div className="quiz-options-grid" role="radiogroup">
            {currentQ.options.map((optText, optIdx) => {
              const isSelected = selectedAnswers[currentQ.id] === optIdx;
              const optionLetters = ['A', 'B', 'C', 'D'];

              return (
                <div
                  key={optIdx}
                  className={`quiz-option-card ${isSelected ? 'option-selected' : ''}`}
                  onClick={() => handleSelectOption(currentQ.id, optIdx)}
                  role="radio"
                  aria-checked={isSelected}
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      handleSelectOption(currentQ.id, optIdx);
                    }
                  }}
                  data-testid={`quiz-opt-${optIdx}`}
                >
                  <span className="option-letter">{optionLetters[optIdx]}</span>
                  <span className="option-text">{optText}</span>
                </div>
              );
            })}
          </div>

          {/* Navigation Controls */}
          <div className="quiz-nav-footer">
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => setCurrentQuestionIndex((prev) => Math.max(0, prev - 1))}
              disabled={currentQuestionIndex === 0}
            >
              ← Previous
            </button>

            {currentQuestionIndex < totalQ - 1 ? (
              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={() =>
                  setCurrentQuestionIndex((prev) => Math.min(totalQ - 1, prev + 1))
                }
              >
                Next Question →
              </button>
            ) : (
              <button
                type="button"
                className="btn btn-primary btn-sm btn-submit-quiz"
                onClick={handleSubmitQuiz}
                disabled={isSubmitting}
                data-testid="btn-submit-quiz"
              >
                {isSubmitting ? 'Evaluating...' : 'Submit Quiz Drill 🏁'}
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="glass-card quiz-card empty-quiz-card">
          <p>No questions currently available. Select a different topic above.</p>
        </div>
      )}
    </div>
  );
};
