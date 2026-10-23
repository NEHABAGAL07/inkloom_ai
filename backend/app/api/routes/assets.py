from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.core.security import get_current_auth_context, AuthContext, UserRole
from app.models import ApprovedAsset
from app.schemas.asset import ApprovedAssetCreate, ApprovedAssetResponse

router = APIRouter(prefix="/assets", tags=["Approved Assets"])


@router.get("", response_model=List[ApprovedAssetResponse])
def list_assets(
    db: Session = Depends(get_db),
    auth: AuthContext = Depends(get_current_auth_context),
):
    """Retrieve all approved brand assets (logos, palettes, typography, benchmarks)."""
    return (
        db.query(ApprovedAsset)
        .filter(ApprovedAsset.organization_id == auth.organization_id)
        .all()
    )


@router.post("", response_model=ApprovedAssetResponse, status_code=status.HTTP_201_CREATED)
def create_asset(
    payload: ApprovedAssetCreate,
    db: Session = Depends(get_db),
    auth: AuthContext = Depends(get_current_auth_context),
):
    """Register an approved brand asset."""
    if not auth.has_role(UserRole.ADMIN, UserRole.COMPLIANCE_OFFICER):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only Admins and Compliance Officers can register brand assets.",
        )

    asset = ApprovedAsset(
        organization_id=auth.organization_id,
        name=payload.name,
        asset_type=payload.asset_type,
        file_url=payload.file_url,
        specifications=payload.specifications,
        is_active=payload.is_active,
    )
    db.add(asset)
    db.commit()
    db.refresh(asset)
    return asset
