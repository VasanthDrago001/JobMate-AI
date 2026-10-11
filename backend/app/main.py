from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.api.v1.router import api_router

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="Backend API for JobMate AI - Skill gap and resume alignment platform",
    openapi_url=f"{settings.API_V1_STR}/openapi.json" if settings.DEBUG else None,
)

# CORS Middleware setup
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Root-level health endpoint requested in specifications
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
    }
