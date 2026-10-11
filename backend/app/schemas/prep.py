from pydantic import BaseModel, Field
from typing import List, Optional, Literal


class QuizQuestionPublic(BaseModel):
    id: str = Field(..., description="Unique question identifier")
    topic: str = Field(..., description="Technical or aptitude category")
    difficulty: Literal["beginner", "intermediate", "advanced"] = Field(..., description="Complexity level")
    question_text: str = Field(..., description="Prompt scenario or technical question")
    options: List[str] = Field(..., description="Four possible answer choices")
    concept_tested: str = Field(..., description="Core conceptual subject tested")


class QuizSubmissionItem(BaseModel):
    question_id: str
    selected_option_index: int = Field(..., ge=0, le=3)


class QuizSubmission(BaseModel):
    topic: str
    answers: List[QuizSubmissionItem]


class QuizResultItem(BaseModel):
    question_id: str
    is_correct: bool
    selected_index: int
    correct_index: int
    explanation: str
    concept_tested: str


class QuizSessionResult(BaseModel):
    topic: str
    total_questions: int
    correct_count: int
    score_percentage: float
    xp_earned: int
    results: List[QuizResultItem]
    feedback_message: str
    disclaimer: str = (
        "Practice questions are synthetic preparation prompts aligned with Indian IT hiring standards, "
        "not actual or leaked questions from any employer."
    )


class TopicSummary(BaseModel):
    topic_id: str
    display_name: str
    total_questions: int
    available_difficulties: List[str]


class RoadmapTopicItem(BaseModel):
    topic_name: str
    category: str
    priority: Literal["high", "medium", "refresher"]
    estimated_hours: int
    key_concepts: List[str]
    recommended_practice_focus: str


class RoadmapWeek(BaseModel):
    week_number: int
    theme: str
    focus_objective: str
    estimated_weekly_hours: int
    topics: List[RoadmapTopicItem]


class RoadmapRequest(BaseModel):
    target_role: str = Field(..., min_length=2, max_length=150)
    matched_skills: List[str] = Field(default_factory=list)
    missing_must_have: List[str] = Field(default_factory=list)
    missing_good_to_have: List[str] = Field(default_factory=list)


class PreparationRoadmap(BaseModel):
    target_role: str
    roadmap_version: str = "v1.0.0-deterministic"
    total_estimated_hours: int
    weeks: List[RoadmapWeek]
    matched_skills_covered: int
    gaps_targeted: int
    honest_disclaimer: str = (
        "This preparation roadmap is deterministically synthesized from your target role requirements and "
        "identified skill gaps. It is an educational study guide, not a guarantee of employer interview selection."
    )
