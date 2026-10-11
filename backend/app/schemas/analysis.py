from datetime import datetime, timezone
from typing import Dict, List, Literal, Optional
from pydantic import BaseModel, Field

from app.schemas.bullet import BulletSuggestion


class ResumeMetadata(BaseModel):
    """Metadata for the parsed resume document."""

    file_name: str = Field(..., description="Original name of the uploaded PDF")
    file_size_bytes: int = Field(..., ge=0, description="Size of uploaded file in bytes")
    page_count: int = Field(..., ge=1, description="Number of pages in the PDF")
    character_count: int = Field(..., ge=0, description="Total characters of extracted text")
    word_count: int = Field(..., ge=0, description="Total words extracted from the resume")
    detected_sections: List[str] = Field(
        default_factory=list,
        description="Identified resume sections (e.g., Skills, Experience, Education)",
    )
    is_text_based: bool = Field(
        True,
        description="True if the PDF contains digital text layer rather than scanned image",
    )


class JobDescriptionMetadata(BaseModel):
    """Metadata for the supplied target job description."""

    target_role: Optional[str] = Field(None, description="Target job title or role")
    character_count: int = Field(..., ge=0, description="Length of the job description in characters")
    word_count: int = Field(..., ge=0, description="Word count of the job description")


class EvaluatedSkill(BaseModel):
    """Evaluation details for a single job requirement skill."""

    skill_id: str = Field(..., description="Internal skill identifier")
    name: str = Field(..., description="Canonical display name of the skill")
    category: str = Field(..., description="Skill category, e.g. Languages, Databases, Tools")
    status: Literal["matched", "partial", "not_found_in_resume"] = Field(
        ...,
        description="Match classification against candidate resume",
    )
    matched_term: Optional[str] = Field(
        None,
        description="The exact alias or variant detected in the document",
    )
    evidence_snippet: Optional[str] = Field(
        None,
        description="Short text context from the resume verifying evidence of the skill",
    )
    weight: float = Field(1.0, description="Relative weighting of this skill")
    explanation: Optional[str] = Field(
        None,
        description="Clear, transparent reason for the classification status",
    )


class MatchSummary(BaseModel):
    """Summary counts and metrics for the deterministic skill match."""

    total_requirements: int = Field(..., ge=0, description="Total distinct technical skills identified in JD")
    matched_count: int = Field(..., ge=0, description="Number of skills directly matched with evidence")
    partial_count: int = Field(..., ge=0, description="Number of skills with related or foundation evidence")
    not_found_count: int = Field(..., ge=0, description="Number of skills absent from resume text")
    earned_weight: Optional[float] = Field(None, description="Total weighted score points earned")
    total_possible_weight: Optional[float] = Field(None, description="Maximum possible weighted score points")


class DeterministicSkillAnalysis(BaseModel):
    """Deterministic resume-to-job-description skill matching result."""

    status: Literal["completed", "unable_to_score"] = Field(
        ...,
        description="Scoring outcome: completed or unable_to_score if JD lacks technical skills",
    )
    score: Optional[float] = Field(
        None,
        description="Transparent weighted keyword coverage score (0.0 - 100.0) or null if unable to score",
    )
    scoring_method_version: str = Field(
        ...,
        description="Version of the deterministic scoring method",
    )
    message: str = Field(..., description="Human-readable outcome description")
    scoring_formula: str = Field(
        ...,
        description="Explicit mathematical formula used for scoring calculation",
    )
    summary: MatchSummary
    matched_skills: List[EvaluatedSkill] = Field(
        default_factory=list,
        description="Skills directly matched with extracted evidence snippets",
    )
    partial_skills: List[EvaluatedSkill] = Field(
        default_factory=list,
        description="Skills where related technologies were detected in the resume",
    )
    not_found_skills: List[EvaluatedSkill] = Field(
        default_factory=list,
        description="Skills required by JD but not detected in the resume text",
    )
    all_requirements: List[EvaluatedSkill] = Field(
        default_factory=list,
        description="Complete list of all evaluated job requirements",
    )
    disclaimer_honest_scoring: str = Field(
        ...,
        description="Clear statement that score reflects text coverage, not ATS or hiring predictions",
    )
    disclaimer_not_found_skills: str = Field(
        ...,
        description="Clear notice that not found in resume does not mean candidate lacks practical skill",
    )


class PlaceholderAnalysis(BaseModel):
    """Legacy/placeholder analysis result for backward compatibility."""

    phase: str = Field("Phase 1 - Ingestion & Parser Core")
    status: str = Field("PARSED_SUCCESSFULLY")
    message: str = Field("Resume text extracted and verified successfully.")
    disclaimer: str = Field("Legacy placeholder analysis.")
    section_character_counts: Dict[str, int] = Field(default_factory=dict)


class AnalysisResponse(BaseModel):
    """Unified response model for POST /api/v1/analyses."""

    analysis_id: str = Field(..., description="Unique UUID for this analysis session")
    status: str = Field("completed", description="Status of the ingestion request")
    created_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc),
        description="Timestamp of processing completion",
    )
    resume_metadata: ResumeMetadata
    job_description_metadata: JobDescriptionMetadata
    analysis_result: DeterministicSkillAnalysis = Field(
        ...,
        description="Deterministic skill matching results, evidence snippets, and transparent coverage score",
    )
    bullet_improvements: List[BulletSuggestion] = Field(
        default_factory=list,
        description="Optional truthful bullet improvements using XYZ or STAR formula",
    )
    placeholder_analysis: Optional[PlaceholderAnalysis] = Field(
        None,
        description="Deprecated Phase 1 placeholder retained for backward compatibility",
    )
