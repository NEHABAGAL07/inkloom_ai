from fastapi import APIRouter
from app.api.routes.health import router as health_router
from app.api.routes.auth import router as auth_router
from app.api.routes.organizations import router as organizations_router
from app.api.routes.invitations import router as invitations_router
from app.api.routes.guidelines import router as guidelines_router
from app.api.routes.assets import router as assets_router
from app.api.routes.submissions import router as submissions_router
from app.api.routes.audits import router as audits_router
from app.api.routes.reviews import router as reviews_router
from app.api.routes.analytics import router as analytics_router
from app.api.routes.knowledge import router as knowledge_router
from app.api.routes.intelligence import router as intelligence_router
from app.api.routes.comments import router as comments_router, org_comments_router
from app.api.routes.documents import router as documents_router
from app.api.routes.chat import router as chat_router
from app.api.routes.marketing_copilot import router as marketing_copilot_router
from app.api.routes.designer_copilot import router as designer_copilot_router
from app.api.routes.legal_copilot import router as legal_copilot_router
from app.api.routes.campaigns import router as campaigns_router
from app.api.routes.notifications import router as notifications_router
from app.api.routes.ai_status import router as ai_status_router

api_router = APIRouter()

api_router.include_router(health_router)
api_router.include_router(auth_router)
api_router.include_router(organizations_router)
api_router.include_router(invitations_router)
api_router.include_router(guidelines_router)
api_router.include_router(assets_router)
api_router.include_router(submissions_router)
api_router.include_router(audits_router)
api_router.include_router(reviews_router)
api_router.include_router(comments_router)
api_router.include_router(org_comments_router)
api_router.include_router(analytics_router)
api_router.include_router(knowledge_router)
api_router.include_router(intelligence_router)
api_router.include_router(documents_router)
api_router.include_router(chat_router)
api_router.include_router(marketing_copilot_router)
api_router.include_router(designer_copilot_router)
api_router.include_router(legal_copilot_router)
api_router.include_router(campaigns_router)
api_router.include_router(notifications_router)
api_router.include_router(ai_status_router)

__all__ = ["api_router"]
