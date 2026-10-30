"""
AI Status and Telemetry Endpoint for Inkloom AI.
Exposes runtime provider configuration, model name, key presence (boolean only, never the key itself),
and thread-safe in-memory usage telemetry.
Restricted to Admin and Compliance Officer roles via RBAC.
"""
from typing import Any, Dict
from fastapi import APIRouter, Depends
from pydantic import BaseModel, Field

from app.core.config import settings
from app.core.security import (
    AuthContext,
    UserRole,
    require_roles,
)
from app.ai.usage import global_ai_usage_tracker

router = APIRouter(prefix="/ai", tags=["AI Governance"])


class AIStatusResponse(BaseModel):
    provider: str = Field(..., description="Active AI provider name (e.g. 'gemini', 'offline')")
    model: str = Field(..., description="Configured model identifier")
    key_configured: bool = Field(..., description="True if an API key is non-empty; raw key is never returned")
    usage: Dict[str, Any] = Field(..., description="Aggregated in-memory usage counters")


@router.get("/status", response_model=AIStatusResponse)
def get_ai_status(
    auth: AuthContext = Depends(require_roles(UserRole.ADMIN, UserRole.COMPLIANCE_OFFICER)),
) -> AIStatusResponse:
    """
    Returns runtime AI subsystem health, model identifiers, and aggregated telemetry.
    Secured by RBAC: Admin and Compliance Officer access only.
    Strictly safeguards credentials: never exposes the secret key in the response payload.
    """
    provider_name = (settings.LLM_PROVIDER or "offline").lower().strip()
    model_name = (settings.LLM_MODEL_NAME or "").strip()
    key_configured = bool(settings.LLM_API_KEY and settings.LLM_API_KEY.strip())

    return AIStatusResponse(
        provider=provider_name,
        model=model_name,
        key_configured=key_configured,
        usage=global_ai_usage_tracker.get_metrics(),
    )

