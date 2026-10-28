from fastapi import APIRouter, Response, status
from sqlalchemy import text

from app.core.config import settings
from app.database.session import SessionLocal

router = APIRouter(tags=["Health"])


@router.get("/health/live")
def liveness_probe():
    """
    Kubernetes/container liveness probe.
    Returns 200 OK as long as the process is running.
    """
    return {
        "status": "alive",
        "service": settings.APP_NAME,
        "version": "0.1.0",
    }


@router.get("/health/ready")
def readiness_probe(response: Response):
    """
    Kubernetes/container readiness probe.
    Verifies that essential dependencies (database) are reachable before receiving traffic.
    """
    db_connected = False
    try:
        db = SessionLocal()
        try:
            db.execute(text("SELECT 1"))
            db_connected = True
        finally:
            db.close()
    except Exception:
        db_connected = False

    if not db_connected:
        response.status_code = status.HTTP_503_SERVICE_UNAVAILABLE
        return {
            "status": "unready",
            "service": settings.APP_NAME,
            "checks": {
                "database": "unreachable",
            },
        }

    return {
        "status": "ready",
        "service": settings.APP_NAME,
        "checks": {
            "database": "connected",
        },
    }


@router.get("/health")
def health_check(response: Response):
    """Comprehensive system health check endpoint."""
    db_connected = False
    try:
        db = SessionLocal()
        try:
            db.execute(text("SELECT 1"))
            db_connected = True
        finally:
            db.close()
    except Exception:
        db_connected = False

    overall_status = "healthy" if db_connected else "degraded"
    if not db_connected:
        response.status_code = status.HTTP_503_SERVICE_UNAVAILABLE

    return {
        "status": overall_status,
        "service": settings.APP_NAME,
        "environment": settings.ENVIRONMENT,
        "version": "0.1.0",
        "checks": {
            "database": "connected" if db_connected else "unreachable",
            "ai_engine": settings.AI_ENGINE_MODE,
            "media_processor": "active",
        },
    }

