"""Approved Brand Assets API Routes."""

from datetime import datetime, timezone
from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Depends
from pydantic import BaseModel
from app.core.security import CurrentUser, get_current_user

router = APIRouter(prefix="/assets", tags=["Brand Assets"])


class ApprovedAssetSchema(BaseModel):
    id: str
    organization_id: str
    name: str
    asset_type: str  # logo, color_palette, claim_registry, typography
    file_path: Optional[str] = None
    asset_metadata: Dict[str, Any]
    is_active: bool


@router.get("", response_model=List[ApprovedAssetSchema])
async def list_assets(
    asset_type: Optional[str] = None,
    current_user: CurrentUser = Depends(get_current_user),
):
    """List approved brand assets for the organization."""
    sample_assets = [
        ApprovedAssetSchema(
            id="ast-logo-001",
            organization_id=current_user.organization_id,
            name="Primary Brand Wordmark (Dark Background)",
            asset_type="logo",
            file_path="/assets/branding/inkloom-wordmark-white.svg",
            asset_metadata={"min_width_px": 120, "clearspace_ratio": 0.25},
            is_active=True,
        ),
        ApprovedAssetSchema(
            id="ast-color-001",
            organization_id=current_user.organization_id,
            name="Core Enterprise Palette",
            asset_type="color_palette",
            asset_metadata={
                "primary": "#1A365D",
                "accent": "#38BDF8",
                "neutral": "#F8FAFC",
                "text_primary": "#0F172A",
            },
            is_active=True,
        ),
        ApprovedAssetSchema(
            id="ast-claim-001",
            organization_id=current_user.organization_id,
            name="Certified SOC2 Claim",
            asset_type="claim_registry",
            asset_metadata={
                "certified_statement": "Enterprise SOC2 Type II Certified",
                "evidence_ref": "DOC-SEC-2025-V2",
                "expires_at": "2027-12-31",
            },
            is_active=True,
        ),
    ]

    if asset_type:
        sample_assets = [a for a in sample_assets if a.asset_type == asset_type]

    return sample_assets
