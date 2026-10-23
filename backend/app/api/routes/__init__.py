"""API Routes Router Assembly."""

from fastapi import APIRouter
from app.api.routes.health import router as health_router
from app.api.routes.workspaces import router as workspaces_router
from app.api.routes.guidelines import router as guidelines_router
from app.api.routes.facts import router as facts_router
from app.api.routes.assets import router as assets_router
from app.api.routes.content import router as content_router
from app.api.routes.audits import router as audits_router
from app.api.routes.reviews import router as reviews_router
from app.api.routes.analytics import router as analytics_router
from app.api.routes.media import router as media_router

api_router = APIRouter()

api_router.include_router(health_router)
api_router.include_router(workspaces_router)
api_router.include_router(guidelines_router)
api_router.include_router(facts_router)
api_router.include_router(assets_router)
api_router.include_router(content_router)
api_router.include_router(audits_router)
api_router.include_router(reviews_router)
api_router.include_router(analytics_router)
api_router.include_router(media_router)

