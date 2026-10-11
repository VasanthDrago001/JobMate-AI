import json
import logging
from pathlib import Path
from typing import Dict, List, Optional
from app.schemas.prep import (
    QuizQuestionPublic,
    QuizSubmission,
    QuizSessionResult,
    QuizResultItem,
    TopicSummary,
)

logger = logging.getLogger("jobmate.prep.quiz_service")

DATA_DIR = Path(__file__).resolve().parent.parent.parent / "data" / "question_bank"


class QuizService:
    def __init__(self, data_directory: Optional[Path] = None):
        self.data_dir = data_directory or DATA_DIR
        self._questions_by_id: Dict[str, dict] = {}
        self._questions_by_topic: Dict[str, List[dict]] = {}
        self._load_question_bank()

    def _load_question_bank(self) -> None:
        """Loads and indexes all curated JSON question banks from disk."""
        self._questions_by_id.clear()
        self._questions_by_topic.clear()

        if not self.data_dir.exists():
            logger.warning(f"Question bank directory {self.data_dir} does not exist.")
            return

        for json_file in self.data_dir.glob("*.json"):
            try:
                with open(json_file, "r", encoding="utf-8") as f:
                    items = json.load(f)
                    if isinstance(items, list):
                        for q in items:
                            qid = q.get("id")
                            if qid:
                                self._questions_by_id[qid] = q
                                topic = q.get("topic", "General")
                                self._questions_by_topic.setdefault(topic, []).append(q)
            except Exception as e:
                logger.error(f"Error loading question bank file {json_file}: {e}")

        logger.info(
            f"Loaded {len(self._questions_by_id)} curated questions across "
            f"{len(self._questions_by_topic)} topics."
        )

    def get_available_topics(self) -> List[TopicSummary]:
        """Return list of distinct practice topics with question counts and difficulty tiers.

        Purpose:
            Aggregates question bank metadata to populate topic selection menus in the UI.

        Returns:
            Alphabetically sorted list of TopicSummary models.
        """
        summaries = []
        for topic, q_list in self._questions_by_topic.items():
            diffs = sorted(list(set(q.get("difficulty", "intermediate") for q in q_list)))
            summaries.append(
                TopicSummary(
                    topic_id=topic.lower().replace(" ", "-").replace("&", "and"),
                    display_name=topic,
                    total_questions=len(q_list),
                    available_difficulties=diffs,
                )
            )
        return sorted(summaries, key=lambda s: s.display_name)

    def get_quiz_questions(
        self,
        topic: Optional[str] = None,
        difficulty: Optional[str] = None,
        limit: int = 5,
    ) -> List[QuizQuestionPublic]:
        """Fetch a sanitized batch of practice questions without exposing answer keys.

        Purpose:
            Retrieves questions matching requested topic and difficulty, stripping internal
            correct answer indices and explanations until submission time.

        Args:
            topic: Optional topic filter string (or 'all').
            difficulty: Optional difficulty filter ('beginner', 'intermediate', 'advanced').
            limit: Maximum number of questions to return (default 5).

        Returns:
            List of QuizQuestionPublic objects.
        """
        candidates = []

        if topic and topic != "all":
            # Match topic case-insensitively
            for t_name, q_list in self._questions_by_topic.items():
                if (
                    topic.lower() in t_name.lower()
                    or t_name.lower().replace(" ", "-").replace("&", "and") == topic.lower()
                ):
                    candidates.extend(q_list)
                    break
        else:
            candidates = list(self._questions_by_id.values())

        if difficulty and difficulty != "all":
            candidates = [c for c in candidates if c.get("difficulty") == difficulty.lower()]

        # Slice up to limit
        selected = candidates[:limit]

        return [
            QuizQuestionPublic(
                id=q["id"],
                topic=q.get("topic", "General"),
                difficulty=q.get("difficulty", "intermediate"),
                question_text=q["question_text"],
                options=q["options"],
                concept_tested=q.get("concept_tested", "Technical Practice"),
            )
            for q in selected
        ]

    def evaluate_quiz(self, submission: QuizSubmission) -> QuizSessionResult:
        """Evaluate submitted candidate answers, calculate score, explanations, and gamification XP.

        Purpose:
            Compares candidate answers against ground truth, calculates percentage score,
            awards XP (+15 XP per correct answer, +20 bonus for >=80%), and provides
            detailed explanations for interview review.

        Args:
            submission: QuizSubmission containing user answer choices.

        Returns:
            QuizSessionResult with breakdown, feedback message, and earned XP.
        """
        results: List[QuizResultItem] = []
        correct_count = 0

        for answer in submission.answers:
            q_data = self._questions_by_id.get(answer.question_id)
            if not q_data:
                continue

            ground_truth_idx = q_data.get("correct_option_index", 0)
            is_correct = answer.selected_option_index == ground_truth_idx

            if is_correct:
                correct_count += 1

            results.append(
                QuizResultItem(
                    question_id=answer.question_id,
                    is_correct=is_correct,
                    selected_index=answer.selected_option_index,
                    correct_index=ground_truth_idx,
                    explanation=q_data.get("explanation", "Standard technical practice answer."),
                    concept_tested=q_data.get("concept_tested", "Subject Knowledge"),
                )
            )

        total = len(results)
        score_pct = (correct_count / total * 100.0) if total > 0 else 0.0

        # Gamification XP: 15 XP per correct answer + 20 bonus XP for passing (>=80%)
        xp_earned = (correct_count * 15) + (20 if score_pct >= 80.0 and total >= 3 else 0)

        if score_pct >= 80.0:
            msg = "Excellent performance! Strong conceptual foundation demonstrated."
        elif score_pct >= 60.0:
            msg = "Good effort! Review the detailed explanations below to tighten your edge."
        else:
            msg = "Identified clear knowledge gaps. Study the conceptual explanations to reinforce foundational skills."

        return QuizSessionResult(
            topic=submission.topic,
            total_questions=total,
            correct_count=correct_count,
            score_percentage=round(score_pct, 1),
            xp_earned=xp_earned,
            results=results,
            feedback_message=msg,
        )


quiz_service = QuizService()
