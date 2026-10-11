from fastapi import APIRouter
from app.api.v1.endpoints import analyses, bullets, health, jobs, prep

api_router = APIRouter()
api_router.include_router(health.router, tags=["Health"])
api_router.include_router(analyses.router, tags=["Analyses"])
api_router.include_router(bullets.router, tags=["Bullets"])
api_router.include_router(jobs.router, tags=["Jobs"])
api_router.include_router(prep.router, prefix="/prep", tags=["Preparation"])
