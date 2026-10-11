import logging
import uuid
from datetime import datetime, timezone
from typing import Optional

from fastapi import APIRouter, File, Form, HTTPException, Request, UploadFile
from app.core.config import settings
from app.core.exceptions import JobMateError
from app.core.rate_limiter import rate_limiter
from app.schemas.analysis import (
    AnalysisResponse,
    DeterministicSkillAnalysis,
    JobDescriptionMetadata,
    PlaceholderAnalysis,
    ResumeMetadata,
)
from app.services.bullet_rewriter_service import bullet_rewriter_service
from app.services.matching_service import matching_engine
from app.services.pdf_service import parse_resume_pdf

logger = logging.getLogger("jobmate.analyses")

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
    request: Request,
    file: UploadFile = File(..., description="Resume PDF file (max 5 MB)"),
    job_description: str = Form(..., description="Target Job Description text (50 - 10,000 chars)"),
    target_role: Optional[str] = Form(None, description="Optional target job title or role"),
    consent: bool = Form(..., description="Affirmative user consent under India DPDP Act 2023"),
) -> AnalysisResponse:
    """Handle resume and job description ingestion and return validated metadata and skill alignment."""

    # 0. Enforce client IP rate limit
    rate_limiter.check_rate_limit(request, key="analyses", max_requests=15, window_seconds=60.0)

    # 1. Validate affirmative consent
    if not consent:
        raise HTTPException(
            status_code=400,
            detail="Explicit user consent is required for ephemeral resume processing under India's DPDP Act 2023.",
        )

    # 2. Validate job description and target role length
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

    clean_role = target_role.strip() if target_role else None
    if clean_role and len(clean_role) > 100:
        raise HTTPException(
            status_code=422,
            detail="Target role exceeds maximum allowed length of 100 characters.",
        )

    # 3. Read uploaded file content with chunk-based size enforcement
    if not file.filename or not file.filename.strip():
        raise HTTPException(
            status_code=400,
            detail="Uploaded file must have a valid filename.",
        )

    import os
    import re
    safe_filename = os.path.basename(file.filename.strip())
    if len(safe_filename) > 255:
        raise HTTPException(
            status_code=400,
            detail="Filename exceeds maximum allowed length of 255 characters.",
        )

    max_bytes = settings.MAX_FILE_SIZE_MB * 1024 * 1024
    chunks = []
    total_size = 0
    try:
        while chunk := await file.read(1024 * 1024):
            total_size += len(chunk)
            if total_size > max_bytes:
                raise HTTPException(
                    status_code=413,
                    detail=f"Uploaded file size exceeds maximum limit of {settings.MAX_FILE_SIZE_MB} MB.",
                )
            chunks.append(chunk)
        file_bytes = b"".join(chunks)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=400,
            detail=f"Failed to read uploaded file stream: {str(e)}",
        ) from e

    # 4. Parse & Validate PDF
    try:
        pdf_meta = parse_resume_pdf(file_bytes, safe_filename)
    except JobMateError as err:
        raise HTTPException(status_code=err.status_code, detail=err.message) from err
    except HTTPException:
        raise
    except Exception as err:
        logger.error("Unexpected error during PDF text extraction: %s", err, exc_info=True)
        raise HTTPException(
            status_code=500,
            detail="An unexpected error occurred during PDF text extraction. Please verify the document format.",
        ) from err

    # 5. Execute Deterministic Skill Matching Engine
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

    # 7. Generate optional truthful bullet improvements (non-crashing fallback)
    bullet_improvements = []
    try:
        raw_lines = [
            line.strip() for line in pdf_meta.get("raw_text", "").split("\n")
            if len(line.strip()) > 25
            and not re.search(r"@|phone|email|linkedin|github|\+91|[0-9]{10}", line.lower())
            and not any(line.strip().lower().startswith(h) for h in ["name", "technical skills", "skills", "education", "certifications", "projects"])
        ]
        candidate_sample = [
            line for line in raw_lines
            if any(w in line.lower() for w in ["engineered", "developed", "built", "implemented", "scaled", "designed", "optimized", "tested"])
        ][:2]

        if candidate_sample:
            target_skills = [s.name for s in analysis_result.matched_skills[:3]] or [s.name for s in analysis_result.all_requirements[:3]]
            improvement_resp = await bullet_rewriter_service.improve_bullets(
                bullets=candidate_sample,
                target_role=clean_role,
                target_skills=target_skills,
                allow_fallback=True,
            )
            bullet_improvements = improvement_resp.suggestions
    except Exception as err:
        logger.warning("Bullet rewriter call failed in analysis, returning rules-based report without crashing: %s", err)

    return AnalysisResponse(
        analysis_id=analysis_id,
        status="completed",
        created_at=datetime.now(timezone.utc),
        resume_metadata=resume_metadata,
        job_description_metadata=jd_metadata,
        analysis_result=analysis_result,
        bullet_improvements=bullet_improvements,
        placeholder_analysis=placeholder_analysis,
    )

