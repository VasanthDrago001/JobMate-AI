from datetime import datetime, timezone
from typing import List, Literal, Optional
from pydantic import BaseModel, Field


class JobSearchFilter(BaseModel):
    """User filter parameters for Job Finder queries."""

    role: str = Field(
        ...,
        min_length=2,
        max_length=80,
        description="Target job title or tech keyword (e.g. 'Python Developer', 'QA Automation')",
    )
    location: str = Field(
        "Bengaluru",
        max_length=60,
        description="Target Indian city, 'Remote', or 'All India'",
    )
    work_mode: Literal["all", "remote", "hybrid", "on-site"] = Field(
        "all",
        description="Preferred work arrangement",
    )
    experience_level: Literal["all", "entry", "mid", "senior"] = Field(
        "all",
        description="Experience level tier",
    )
    candidate_skills: List[str] = Field(
        default_factory=list,
        max_length=30,
        description="List of verified technical skills from the candidate's resume analysis",
    )
    sort_by: Literal["match", "recent", "company"] = Field(
        "match",
        description="Sorting criteria for results: match score, posting recency, or company name",
    )
    page: int = Field(1, ge=1, le=50, description="Results pagination page number")
    page_size: int = Field(10, ge=1, le=25, description="Number of results per page")


class SkillMatchEvidence(BaseModel):
    """Corroboration between job requirement and candidate resume evidence."""

    skill_name: str = Field(..., description="Technical skill name")
    status: Literal["matched", "missing", "partial"] = Field(
        ...,
        description="Whether skill was detected in candidate CV",
    )
    resume_evidence_snippet: Optional[str] = Field(
        None,
        description="Textual snippet from resume proving practical experience",
    )
    importance: Literal["Required", "Preferred"] = Field(
        "Required",
        description="Skill importance for this job role",
    )


class JobListing(BaseModel):
    """Structured representation of a real, verified job listing."""

    id: str = Field(..., description="Unique job ad identifier from source provider")
    source: Literal["adzuna", "greenhouse", "lever", "verified_curated"] = Field(
        ...,
        description="Legitimate authorized data source",
    )
    title: str = Field(..., description="Verified job posting title")
    company_name: str = Field(..., description="Verified hiring employer name")
    company_logo_url: Optional[str] = Field(None, description="Optional employer logo URL")
    location: str = Field(..., description="Location string (e.g. 'Bengaluru, Karnataka' or 'Remote')")
    work_mode: Literal["Remote", "Hybrid", "On-site", "Not Specified"] = Field(
        "Not Specified",
        description="Work arrangement classification",
    )
    salary_display: str = Field(
        "Salary not disclosed",
        description="Salary range or transparent 'Salary not disclosed' label",
    )
    description_snippet: str = Field(..., description="Snippet of role requirements")
    posting_date: Optional[datetime] = Field(None, description="Original publication timestamp if available")
    last_verified_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc),
        description="Timestamp this listing was verified active",
    )
    application_url: str = Field(..., description="Legitimate direct external application link")

    # Match comparison computed against candidate's verified skills
    match_score_percentage: float = Field(0.0, ge=0.0, le=100.0)
    matched_skills_count: int = 0
    total_required_skills_count: int = 0
    skills_breakdown: List[SkillMatchEvidence] = Field(default_factory=list)
    match_summary_explanation: str = Field(
        ...,
        description="Honest explanation of skill overlap and missing requirements",
    )
    is_expired: bool = Field(False, description="True if marked expired or removed")


class JobSearchResponse(BaseModel):
    """Response payload for job search queries."""

    results: List[JobListing] = Field(default_factory=list, description="Ranked matching job listings")
    total_matches_found: int = Field(..., description="Total count of matching active jobs found")
    current_page: int = Field(1, description="Current pagination page")
    has_more: bool = Field(False, description="True if subsequent pages exist")
    source_attribution: str = Field(
        "Job listings powered by Adzuna and verified official career boards.",
        description="Mandatory source attribution statement",
    )
    attribution_logo_url: Optional[str] = Field(
        "https://static.adzuna.com/badges/adzuna-logo.png",
        description="Attribution logo asset URL",
    )
    cached: bool = Field(False, description="True if served from fast in-memory cache")
