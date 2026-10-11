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
    """Retrieve all available technical and aptitude practice topics with question counts.

    Purpose:
        Provides metadata for topic selection filters, displaying how many curated questions
        and difficulty tiers are available per subject.

    Returns:
        List of TopicSummary items.
    """
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
    """Retrieve practice questions for a topic without revealing correct answers upfront.

    Purpose:
        Supplies sanitized questions (options, prompt, and concept tested) for interactive
        timed drill mode, withholding correct answer indices until submission.

    Args:
        topic: Optional subject filter string.
        difficulty: Optional difficulty level filter.
        limit: Maximum number of questions to return (1-20).

    Returns:
        List of QuizQuestionPublic objects.
    """
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
    """Evaluate submitted quiz answers, score accuracy, and calculate gamification XP.

    Purpose:
        Computes deterministic scores, provides conceptual explanations for each answer,
        and awards XP and badges to reinforce learning.

    Args:
        submission: QuizSubmission containing candidate's selected option indices.

    Returns:
        QuizSessionResult with score percentage, breakdown explanations, and earned XP.
    """
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
    """Generate a deterministic 4-week study roadmap grounded in resume evidence and target gaps.

    Purpose:
        Synthesizes a structured weekly learning plan targeting verified strengths in Week 1,
        core missing must-haves in Week 2, architecture in Week 3, and STAR rehearsals in Week 4.

    Args:
        request: RoadmapRequest containing target role, matched skills, and gap lists.

    Returns:
        PreparationRoadmap containing structured 4-week timeline with estimated hours and practice tasks.
    """
    return roadmap_service.generate_roadmap(request)

