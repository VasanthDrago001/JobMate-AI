from typing import List, Literal, Optional
from pydantic import BaseModel, Field


class BulletSuggestion(BaseModel):
    """Structured suggestion for an individual resume bullet point."""

    id: str = Field(..., description="Unique suggestion identifier")
    original_bullet: str = Field(..., description="Original raw bullet text from candidate")
    suggested_rewrite: str = Field(..., description="Truthful improved rewrite using Google XYZ or STAR formula")
    reason: str = Field(..., description="Explanation of why this rewrite is stronger and clearer")
    framework: Literal["Google XYZ Formula", "STAR Method"] = Field(
        ...,
        description="The structured bullet drafting framework applied",
    )
    targeted_skills: List[str] = Field(
        default_factory=list,
        description="Technical skills highlighted in this bullet",
    )
    needs_confirmation: bool = Field(
        ...,
        description="True if the candidate must review facts or fill in bracketed placeholder metrics",
    )
    confirmation_prompt: Optional[str] = Field(
        None,
        description="Prompt instructing candidate on what specific facts or numbers to confirm",
    )


class BulletImprovementRequest(BaseModel):
    """Request payload for improving specific resume bullet points."""

    bullets: List[str] = Field(
        ...,
        min_length=1,
        max_length=3,
        description="List of 1 to 3 candidate bullet strings to improve (max 400 chars each)",
    )
    target_role: Optional[str] = Field(
        None,
        max_length=100,
        description="Target job title or role context",
    )
    target_skills: List[str] = Field(
        default_factory=list,
        max_length=10,
        description="List of up to 10 technical skills from JD to align with",
    )


class BulletImprovementResponse(BaseModel):
    """Response payload containing validated truthful bullet rewrites."""

    suggestions: List[BulletSuggestion] = Field(
        ...,
        description="List of improved bullet suggestions",
    )
    model_used: str = Field(
        ...,
        description="The AI model or fallback engine that generated the suggestions",
    )
    usage_remaining_today: Optional[int] = Field(
        None,
        description="Remaining daily AI calls available within the configured budget",
    )
    is_fallback: bool = Field(
        False,
        description="True if generated via deterministic rules-based fallback due to AI quota or outage",
    )
    disclaimer: str = Field(
        "Suggestions are strictly truthful improvements. Never include fabricated metrics, dates, or tools. "
        "JobMate AI does not guarantee interview invitations or automated ATS hiring selection.",
        description="Truthfulness and anti-exaggeration disclaimer",
    )
