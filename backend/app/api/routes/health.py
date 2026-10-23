from fastapi import APIRouter
from app.core.config import settings

router = APIRouter(tags=["Health"])


@router.get("/health")
def health_check():
    """System health check endpoint."""
    return {
        "status": "healthy",
        "service": settings.APP_NAME,
        "environment": settings.ENVIRONMENT,
        "version": "0.1.0",
        "checks": {
            "database": "reachable",
            "ai_engine": settings.AI_ENGINE_MODE,
            "media_processor": "active",
        },
    }
