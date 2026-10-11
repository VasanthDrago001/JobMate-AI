import logging
from typing import List, Optional
from fastapi import APIRouter, Query, HTTPException, status
from app.schemas.prep import (
    TopicSummary,
    QuizQuestionPublic,
    QuizSubmission,
    QuizSessionResult,
    RoadmapRequest,
    PreparationRoadmap,
)
from app.services.prep.quiz_service import quiz_service
from app.services.prep.roadmap_service import roadmap_service

logger = logging.getLogger("jobmate.api.prep")

router = APIRouter()


@router.get(
    "/topics",
    response_model=List[TopicSummary],
    summary="Get available quiz topics and question counts",
)
async def get_quiz_topics() -> List[TopicSummary]:
    """Returns all available technical and aptitude topics with question counts."""
    return quiz_service.get_available_topics()


@router.get(
    "/quizzes",
    response_model=List[QuizQuestionPublic],
    summary="Get interactive practice questions for a topic",
)
async def get_quiz_questions(
    topic: Optional[str] = Query(None, description="Topic filter (e.g., 'Python', 'SQL')"),
    difficulty: Optional[str] = Query(None, description="'beginner', 'intermediate', or 'advanced'"),
    limit: int = Query(5, ge=1, le=20, description="Number of questions to retrieve"),
) -> List[QuizQuestionPublic]:
    """Retrieves practice questions without revealing the correct answer upfront."""
    questions = quiz_service.get_quiz_questions(topic=topic, difficulty=difficulty, limit=limit)
    if not questions:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"No questions found for topic='{topic}' and difficulty='{difficulty}'.",
        )
    return questions


@router.post(
    "/quizzes/submit",
    response_model=QuizSessionResult,
    summary="Evaluate submitted quiz answers and calculate XP",
)
async def submit_quiz(submission: QuizSubmission) -> QuizSessionResult:
    """Evaluates client quiz answers, calculates percentage, explanations, and gamification XP."""
    if not submission.answers:
        raise HTTPException(
            status_code=422,
            detail="Cannot evaluate an empty quiz submission.",
        )
    return quiz_service.evaluate_quiz(submission)


@router.post(
    "/roadmap",
    response_model=PreparationRoadmap,
    summary="Generate a role-specific 4-week preparation roadmap",
)
async def generate_prep_roadmap(request: RoadmapRequest) -> PreparationRoadmap:
    """Generates a structured 4-week roadmap using verified resume evidence and target JD gaps."""
    return roadmap_service.generate_roadmap(request)
