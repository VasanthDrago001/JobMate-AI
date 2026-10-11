import uuid
from datetime import datetime, timezone
from typing import Optional

from fastapi import APIRouter, File, Form, HTTPException, UploadFile
from app.core.config import settings
from app.core.exceptions import JobMateError
from app.schemas.analysis import (
    AnalysisResponse,
    DeterministicSkillAnalysis,
    JobDescriptionMetadata,
    PlaceholderAnalysis,
    ResumeMetadata,
)
from app.services.matching_service import matching_engine
from app.services.pdf_service import parse_resume_pdf

router = APIRouter()


@router.post(
    "/analyses",
    response_model=AnalysisResponse,
    status_code=200,
    summary="Upload Resume PDF and Job Description for Ingestion & Skill Alignment",
    description=(
        "Ingests a candidate resume PDF (max 5 MB) and job description string with explicit DPDP consent. "
        "Validates file signature, extracts text via layout-aware parser, detects scanned images/encryption, "
        "and runs the deterministic skill matching engine across curated Python, PHP, and QA Automation taxonomies. "
        "Returns verified document metadata, matched skills with evidence snippets, missing skills, and a "
        "transparent weighted keyword coverage score."
    ),
)
async def create_analysis(
    file: UploadFile = File(..., description="Resume PDF file (max 5 MB)"),
    job_description: str = Form(..., description="Target Job Description text (50 - 10,000 chars)"),
    target_role: Optional[str] = Form(None, description="Optional target job title or role"),
    consent: bool = Form(..., description="Affirmative user consent under India DPDP Act 2023"),
) -> AnalysisResponse:
    """Handle resume and job description ingestion and return validated metadata and skill alignment."""

    # 1. Validate affirmative consent
    if not consent:
        raise HTTPException(
            status_code=400,
            detail="Explicit user consent is required for ephemeral resume processing under India's DPDP Act 2023.",
        )

    # 2. Validate job description length
    clean_jd = job_description.strip()
    if len(clean_jd) < settings.MIN_JD_LENGTH:
        raise HTTPException(
            status_code=422,
            detail=(
                f"Job description is too short ({len(clean_jd)} characters). "
                f"Please provide at least {settings.MIN_JD_LENGTH} characters for accurate skill alignment."
            ),
        )

    if len(clean_jd) > settings.MAX_JD_LENGTH:
        raise HTTPException(
            status_code=422,
            detail=f"Job description exceeds maximum allowed length of {settings.MAX_JD_LENGTH} characters.",
        )

    # 3. Read uploaded file content
    if not file.filename:
        raise HTTPException(
            status_code=400,
            detail="Uploaded file must have a valid filename.",
        )

    try:
        file_bytes = await file.read()
    except Exception as e:
        raise HTTPException(
            status_code=400,
            detail=f"Failed to read uploaded file stream: {str(e)}",
        ) from e

    # 4. Parse & Validate PDF
    try:
        pdf_meta = parse_resume_pdf(file_bytes, file.filename)
    except JobMateError as err:
        raise HTTPException(status_code=err.status_code, detail=err.message) from err
    except Exception as err:
        raise HTTPException(
            status_code=500,
            detail=f"An unexpected error occurred during PDF text extraction: {str(err)}",
        ) from err

    # 5. Execute Deterministic Skill Matching Engine
    clean_role = target_role.strip() if target_role else None
    match_dict = matching_engine.analyze(
        resume_text=pdf_meta["raw_text"],
        job_description=clean_jd,
        target_role=clean_role,
    )
    analysis_result = DeterministicSkillAnalysis(**match_dict)

    # 6. Build structured response
    jd_words = len(clean_jd.split())
    jd_chars = len(clean_jd)

    analysis_id = f"jm-{uuid.uuid4().hex[:12]}"

    resume_metadata = ResumeMetadata(
        file_name=pdf_meta["file_name"],
        file_size_bytes=pdf_meta["file_size_bytes"],
        page_count=pdf_meta["page_count"],
        character_count=pdf_meta["character_count"],
        word_count=pdf_meta["word_count"],
        detected_sections=pdf_meta["detected_sections"],
        is_text_based=pdf_meta["is_text_based"],
    )

    jd_metadata = JobDescriptionMetadata(
        target_role=clean_role,
        character_count=jd_chars,
        word_count=jd_words,
    )

    placeholder_analysis = PlaceholderAnalysis(
        phase="Phase 1 - Ingestion & Parser Core",
        status="PARSED_SUCCESSFULLY",
        message=analysis_result.message,
        disclaimer=analysis_result.disclaimer_honest_scoring,
        section_character_counts=pdf_meta.get("section_character_counts", {}),
    )

    return AnalysisResponse(
        analysis_id=analysis_id,
        status="completed",
        created_at=datetime.now(timezone.utc),
        resume_metadata=resume_metadata,
        job_description_metadata=jd_metadata,
        analysis_result=analysis_result,
        placeholder_analysis=placeholder_analysis,
    )
