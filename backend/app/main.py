from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from app.core.config import settings
from app.core.exceptions import JobMateError
from app.api.v1.router import api_router

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="Backend API for JobMate AI - Skill gap and resume alignment platform",
    openapi_url=f"{settings.API_V1_STR}/openapi.json" if settings.DEBUG else None,
)

import logging

logger = logging.getLogger("jobmate.api")

# CORS Middleware setup using environment-driven configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["Content-Type", "Authorization", "Accept", "X-Requested-With"],
)


@app.exception_handler(JobMateError)
async def jobmate_exception_handler(request: Request, exc: JobMateError):
    """Global handler for domain-specific JobMate validation errors."""
    return JSONResponse(
        status_code=exc.status_code,
        content={"detail": exc.message},
    )


@app.exception_handler(Exception)
async def global_unhandled_exception_handler(request: Request, exc: Exception):
    """Global fallback handler for unexpected server errors.

    Logs full details server-side while returning a sanitized client-safe response.
    """
    logger.error("Unhandled server exception on %s %s: %s", request.method, request.url.path, exc, exc_info=True)
    return JSONResponse(
        status_code=500,
        content={"detail": "An internal server error occurred. Please try again later."},
    )


# Root-level health endpoint
@app.get("/health", summary="Root Health Check", tags=["Health"])
def health_check():
    """Root health check endpoint."""
    return {
        "status": "ok",
        "service": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "environment": settings.ENVIRONMENT,
    }


# Include versioned API v1 router
app.include_router(api_router, prefix=settings.API_V1_STR)


@app.get("/", summary="Root Welcome", tags=["Root"])
def root():
    """Root welcoming endpoint with link to docs."""
    return {
        "message": "Welcome to JobMate AI API",
        "docs_url": "/docs" if settings.DEBUG else "disabled",
        "health_check": "/health",
        "analyses_endpoint": f"{settings.API_V1_STR}/analyses",
    }
