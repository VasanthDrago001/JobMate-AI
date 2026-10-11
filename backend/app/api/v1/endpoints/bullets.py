from fastapi import APIRouter, HTTPException, Request
from app.core.exceptions import (
    AIConfigurationError,
    AIError,
    AIQuotaExceededError,
    AITimeoutError,
)
from app.core.rate_limiter import rate_limiter
from app.schemas.bullet import BulletImprovementRequest, BulletImprovementResponse
from app.services.bullet_rewriter_service import bullet_rewriter_service

router = APIRouter()


@router.post(
    "/bullets/improve",
    response_model=BulletImprovementResponse,
    status_code=200,
    summary="Generate Truthful AI Resume Bullet Improvements",
    description=(
        "Rewrites up to 3 candidate resume bullet points using the Google XYZ Formula or STAR Method. "
        "Strict zero-fabrication directives prohibit invented skills or fake metrics. "
        "Enforces server-side rate limits and PII sanitization. "
        "Falls back gracefully to deterministic guidance if AI provider is unavailable."
    ),
)
async def improve_resume_bullets(
    request: Request,
    payload: BulletImprovementRequest,
) -> BulletImprovementResponse:
    """Improve candidate resume bullets with anti-hallucination guardrails and fallback safety.

    Purpose:
        Restructures vague responsibility bullets into Google XYZ or STAR impact accomplishments
        without inventing unperformed tasks, tools, dates, or false metrics.
        Enforces client IP rate limiting and provides seamless fallback to deterministic guidance.

    Args:
        request: FastAPI HTTP request used for rate limiting.
        payload: BulletImprovementRequest containing up to 3 candidate bullets and optional role context.

    Returns:
        BulletImprovementResponse with validated suggestions, framework names, and confirmation flags.
    """
    # Enforce client IP rate limit
    rate_limiter.check_rate_limit(request, key="bullets", max_requests=30, window_seconds=60.0)

    try:
        response = await bullet_rewriter_service.improve_bullets(
            bullets=payload.bullets,
            target_role=payload.target_role,
            target_skills=payload.target_skills,
            allow_fallback=True,  # Non-crashing graceful fallback
        )
        return response
    except AIQuotaExceededError as err:
        raise HTTPException(status_code=429, detail=str(err.message)) from err
    except AITimeoutError as err:
        raise HTTPException(status_code=504, detail=str(err.message)) from err
    except AIConfigurationError as err:
        raise HTTPException(status_code=503, detail=str(err.message)) from err
    except AIError as err:
        raise HTTPException(status_code=err.status_code, detail=str(err.message)) from err
    except Exception as err:
        raise HTTPException(
            status_code=500,
            detail=f"An unexpected error occurred generating bullet improvements: {str(err)}",
        ) from err
