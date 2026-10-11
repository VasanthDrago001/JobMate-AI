from datetime import datetime, timezone
from typing import Dict, List, Optional
from pydantic import BaseModel, Field


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


class PlaceholderAnalysis(BaseModel):
    """Placeholder analysis result for Stage 1 parser validation."""

    phase: str = Field(
        "Phase 1 - Ingestion & Parser Core",
        description="Current engineering delivery phase",
    )
    status: str = Field("PARSED_SUCCESSFULLY", description="Parsing outcome status")
    message: str = Field(
        "Resume text extracted and verified successfully. Ready for Phase 2 skill matching.",
        description="Human-readable status summary",
    )
    disclaimer: str = Field(
        "This is a Phase 1 ingestion validation response. Full keyword coverage scoring and bullet optimizations will be connected in Phase 2.",
        description="Transparent scoring disclaimer",
    )
    section_character_counts: Dict[str, int] = Field(
        default_factory=dict,
        description="Extracted character breakdown per detected section",
    )


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
    placeholder_analysis: PlaceholderAnalysis
