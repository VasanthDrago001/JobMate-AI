import logging
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.api.v1.router import api_router
from app.core.config import settings
from app.core.exceptions import JobMateError

logger = logging.getLogger("jobmate.api")

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="Backend API for JobMate AI - Skill gap and resume alignment platform",
    openapi_url=f"{settings.API_V1_STR}/openapi.json" if settings.DEBUG else None,
)

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
    """Translate domain-level JobMate exceptions into structured client JSON error responses.

    Args:
        request: Incoming FastAPI HTTP request.
        exc: Domain-specific JobMateError containing custom status code and message.

    Returns:
        JSONResponse with appropriate status code and detail payload.
    """
    return JSONResponse(
        status_code=exc.status_code,
        content={"detail": exc.message},
    )


@app.exception_handler(Exception)
async def global_unhandled_exception_handler(request: Request, exc: Exception):
    """Global catch-all exception handler preventing uncaught stack traces leaking to clients.

    Logs full diagnostic traceback securely server-side while returning a sanitized
    error payload to the caller in accordance with secure coding best practices.

    Args:
        request: Incoming FastAPI HTTP request.
        exc: Unhandled exception instance.

    Returns:
        JSONResponse with HTTP 500 status and friendly error message.
    """
    logger.error("Unhandled server exception on %s %s: %s", request.method, request.url.path, exc, exc_info=True)
    return JSONResponse(
        status_code=500,
        content={"detail": "An internal server error occurred. Please try again later."},
    )


@app.get("/health", summary="Root Health Check", tags=["Health"])
def health_check():
    """Root-level health check endpoint for monitoring uptime, version, and environment.

    Returns:
        Dict containing status, service name, version string, and active environment.
    """
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
    """Welcome endpoint providing service metadata and discovery links for API consumers.

    Returns:
        Dict containing welcome message, documentation link, and endpoint paths.
    """
    return {
        "message": "Welcome to JobMate AI API",
        "docs_url": "/docs" if settings.DEBUG else "disabled",
        "health_check": "/health",
        "analyses_endpoint": f"{settings.API_V1_STR}/analyses",
    }

