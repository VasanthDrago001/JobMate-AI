import logging
from typing import List
from fastapi import APIRouter, HTTPException, Request
from app.core.rate_limiter import rate_limiter
from app.schemas.job_finder import JobSearchFilter, JobSearchResponse
from app.services.job_search.job_service import job_finder_service

logger = logging.getLogger("jobmate.api.jobs")

router = APIRouter()

INDIAN_IT_LOCATIONS = [
    "Bengaluru",
    "Hyderabad",
    "Pune",
    "Mumbai",
    "Gurgaon / Delhi NCR",
    "Noida",
    "Chennai",
    "Kolkata",
    "Remote",
]


@router.post(
    "/jobs/search",
    response_model=JobSearchResponse,
    status_code=200,
    summary="Search Real IT Jobs and Compare with Candidate Skills",
    description=(
        "Retrieves real Indian IT vacancies from authorized providers (Adzuna Developer API & official public career boards), "
        "compares technical requirements against candidate resume skills, and returns verified listings with match scores "
        "and direct application links."
    ),
)
async def search_jobs(
    request: Request,
    filter_params: JobSearchFilter,
) -> JobSearchResponse:
    """Execute skill-aligned job search against legitimate sources."""
    # Enforce client rate limit (30 queries / minute per IP)
    rate_limiter.check_rate_limit(request, key="jobs_search", max_requests=30, window_seconds=60.0)

    try:
        response = await job_finder_service.search_jobs(filter_params)
        return response
    except Exception as err:
        logger.error("Job search failed: %s", err, exc_info=True)
        raise HTTPException(
            status_code=500,
            detail="An error occurred while retrieving job vacancies. Please try again shortly.",
        ) from err


@router.get(
    "/jobs/locations",
    response_model=List[str],
    status_code=200,
    summary="Get Supported Indian IT Tech Hub Locations",
)
def get_supported_locations() -> List[str]:
    """Returns curated list of major Indian IT tech hubs."""
    return INDIAN_IT_LOCATIONS
