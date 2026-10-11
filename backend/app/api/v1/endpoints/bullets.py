from fastapi import APIRouter, HTTPException
from app.core.exceptions import (
    AIConfigurationError,
    AIError,
    AIQuotaExceededError,
    AITimeoutError,
)
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
    request: BulletImprovementRequest,
) -> BulletImprovementResponse:
    """Improve candidate resume bullets with anti-hallucination guardrails and fallback safety."""
    try:
        response = await bullet_rewriter_service.improve_bullets(
            bullets=request.bullets,
            target_role=request.target_role,
            target_skills=request.target_skills,
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
