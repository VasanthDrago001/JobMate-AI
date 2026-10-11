"""Pydantic schemas package for JobMate AI."""

from app.schemas.analysis import (
    AnalysisResponse,
    DeterministicSkillAnalysis,
    EvaluatedSkill,
    JobDescriptionMetadata,
    MatchSummary,
    PlaceholderAnalysis,
    ResumeMetadata,
)
from app.schemas.bullet import (
    BulletImprovementRequest,
    BulletImprovementResponse,
    BulletSuggestion,
)
from app.schemas.job_finder import (
    JobListing,
    JobSearchFilter,
    JobSearchResponse,
    SkillMatchEvidence,
)
from app.schemas.prep import (
    PreparationRoadmap,
    QuizQuestionPublic,
    QuizResultItem,
    QuizSessionResult,
    QuizSubmission,
    QuizSubmissionItem,
    RoadmapRequest,
    RoadmapTopicItem,
    RoadmapWeek,
    TopicSummary,
)

__all__ = [
    # Analysis schemas
    "AnalysisResponse",
    "DeterministicSkillAnalysis",
    "EvaluatedSkill",
    "JobDescriptionMetadata",
    "MatchSummary",
    "PlaceholderAnalysis",
    "ResumeMetadata",
    # Bullet rewriter schemas
    "BulletImprovementRequest",
    "BulletImprovementResponse",
    "BulletSuggestion",
    # Job Finder schemas
    "JobListing",
    "JobSearchFilter",
    "JobSearchResponse",
    "SkillMatchEvidence",
    # Interview Prep schemas
    "PreparationRoadmap",
    "QuizQuestionPublic",
    "QuizResultItem",
    "QuizSessionResult",
    "QuizSubmission",
    "QuizSubmissionItem",
    "RoadmapRequest",
    "RoadmapTopicItem",
    "RoadmapWeek",
    "TopicSummary",
]
