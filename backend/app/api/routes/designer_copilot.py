"""
Designer Copilot API Routes
Endpoints for creative brief authoring, AI visual concept generation,
authorized brand asset resolution, secure design uploading, visual auditing,
and review queue submission.
"""
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, UploadFile, File, Form, status
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.core.security import (
    get_current_auth_context,
    AuthContext,
    UserRole,
    require_roles,
)
from app.schemas.designer_copilot import (
    CreativeBriefRequest,
    DesignConceptGenerationResponse,
    SaveCreativeBriefDraftRequest,
    DesignDraftDetailResponse,
    BrandAssetItem,
    ReferenceImageAnalysisRequest,
    ReferenceImageAnalysisResponse,
    DesignCritiqueRequest,
    DesignCritiqueResponse,
    DesignAdaptationRequest,
    DesignAdaptationResponse,
)
from app.schemas.audit_contract import AuditResult
from app.services.designer_copilot.service import DesignerCopilotService

router = APIRouter(prefix="/designer-copilot", tags=["Designer Copilot"])


@router.get("/assets", response_model=List[BrandAssetItem])
def list_authorized_assets(
    asset_type: Optional[str] = Query(default=None),
    db: Session = Depends(get_db),
    auth: AuthContext = Depends(
        require_roles(
            UserRole.DESIGNER,
            UserRole.MARKETING,
            UserRole.CREATOR,
            UserRole.ADMIN,
            UserRole.COMPLIANCE_OFFICER,
            UserRole.REVIEWER,
        )
    ),
):
    """
    Retrieves approved brand assets strictly scoped to the authenticated tenant.
    Prevents cross-tenant access and returns logos, palettes, typography, and templates.
    """
    return DesignerCopilotService.list_authorized_brand_assets(
        db=db,
        auth=auth,
        asset_type=asset_type,
    )


@router.post("/concepts/generate", response_model=DesignConceptGenerationResponse, status_code=status.HTTP_200_OK)
def generate_creative_concepts(
    payload: CreativeBriefRequest,
    db: Session = Depends(get_db),
    auth: AuthContext = Depends(
        require_roles(
            UserRole.DESIGNER,
            UserRole.MARKETING,
            UserRole.CREATOR,
            UserRole.ADMIN,
            UserRole.COMPLIANCE_OFFICER,
            UserRole.REVIEWER,
        )
    ),
):
    """
    Generates multiple distinct visual design concepts grounded in tenant brand guidelines,
    selected brand assets, and channel requirements.
    """
    try:
        return DesignerCopilotService.generate_creative_concepts(
            db=db,
            auth=auth,
            brief=payload,
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Concept generation failed: {str(e)}",
        )


@router.post("/briefs", response_model=DesignDraftDetailResponse, status_code=status.HTTP_201_CREATED)
def save_creative_brief(
    payload: SaveCreativeBriefDraftRequest,
    db: Session = Depends(get_db),
    auth: AuthContext = Depends(
        require_roles(
            UserRole.DESIGNER,
            UserRole.MARKETING,
            UserRole.CREATOR,
            UserRole.ADMIN,
            UserRole.COMPLIANCE_OFFICER,
            UserRole.REVIEWER,
        )
    ),
):
    """
    Persists a creative brief and optional selected concept as an organizational draft.
    """
    return DesignerCopilotService.save_creative_brief_draft(
        db=db,
        auth=auth,
        payload=payload,
    )


@router.get("/briefs", response_model=List[DesignDraftDetailResponse])
def list_creative_briefs(
    limit: int = Query(default=50, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
    db: Session = Depends(get_db),
    auth: AuthContext = Depends(
        require_roles(
            UserRole.DESIGNER,
            UserRole.MARKETING,
            UserRole.CREATOR,
            UserRole.ADMIN,
            UserRole.COMPLIANCE_OFFICER,
            UserRole.REVIEWER,
        )
    ),
):
    """
    Lists design briefs and creative projects for the authenticated tenant.
    """
    return DesignerCopilotService.list_creative_briefs(
        db=db,
        auth=auth,
        limit=limit,
        offset=offset,
    )


@router.get("/briefs/{brief_id}", response_model=DesignDraftDetailResponse)
def get_creative_brief(
    brief_id: str,
    db: Session = Depends(get_db),
    auth: AuthContext = Depends(
        require_roles(
            UserRole.DESIGNER,
            UserRole.MARKETING,
            UserRole.CREATOR,
            UserRole.ADMIN,
            UserRole.COMPLIANCE_OFFICER,
            UserRole.REVIEWER,
        )
    ),
):
    """
    Retrieves design brief detail, version history, and latest visual audit.
    """
    return DesignerCopilotService.get_creative_brief(
        db=db,
        auth=auth,
        brief_id=brief_id,
    )


@router.post("/briefs/{brief_id}/upload", response_model=DesignDraftDetailResponse, status_code=status.HTTP_201_CREATED)
def upload_design_version(
    brief_id: str,
    file: UploadFile = File(...),
    change_summary: Optional[str] = Form(None),
    db: Session = Depends(get_db),
    auth: AuthContext = Depends(
        require_roles(
            UserRole.DESIGNER,
            UserRole.MARKETING,
            UserRole.CREATOR,
            UserRole.ADMIN,
            UserRole.COMPLIANCE_OFFICER,
            UserRole.REVIEWER,
        )
    ),
):
    """
    Securely uploads a design image revision, enforcing size, MIME boundaries,
    and creating an immutable version record tied to the design project.
    """
    return DesignerCopilotService.upload_design_version(
        db=db,
        auth=auth,
        brief_id=brief_id,
        file=file,
        change_summary=change_summary,
    )


@router.post("/briefs/{brief_id}/audit", response_model=AuditResult, status_code=status.HTTP_201_CREATED)
def audit_design_version(
    brief_id: str,
    revision_id: Optional[str] = Query(default=None),
    db: Session = Depends(get_db),
    auth: AuthContext = Depends(
        require_roles(
            UserRole.DESIGNER,
            UserRole.MARKETING,
            UserRole.CREATOR,
            UserRole.ADMIN,
            UserRole.COMPLIANCE_OFFICER,
            UserRole.REVIEWER,
        )
    ),
):
    """
    Triggers visual brand and accessibility audit on the exact design revision.
    Evaluates contrast ratio (WCAG 2.1 AA), logo clearspace, and copy compliance.
    """
    return DesignerCopilotService.audit_design_version(
        db=db,
        auth=auth,
        brief_id=brief_id,
        revision_id=revision_id,
    )


@router.post("/briefs/{brief_id}/submit", response_model=DesignDraftDetailResponse)
def submit_design_for_review(
    brief_id: str,
    db: Session = Depends(get_db),
    auth: AuthContext = Depends(
        require_roles(
            UserRole.DESIGNER,
            UserRole.MARKETING,
            UserRole.CREATOR,
            UserRole.ADMIN,
            UserRole.COMPLIANCE_OFFICER,
            UserRole.REVIEWER,
        )
    ),
):
    """
    Submits finalized design to the human reviewer approval queue ('submitted').
    """
    return DesignerCopilotService.submit_design_for_review(
        db=db,
        auth=auth,
        brief_id=brief_id,
    )


@router.post("/analyze-image", response_model=ReferenceImageAnalysisResponse, status_code=status.HTTP_200_OK)
def analyze_reference_image(
    payload: ReferenceImageAnalysisRequest,
    db: Session = Depends(get_db),
    auth: AuthContext = Depends(
        require_roles(
            UserRole.DESIGNER,
            UserRole.MARKETING,
            UserRole.CREATOR,
            UserRole.ADMIN,
            UserRole.COMPLIANCE_OFFICER,
            UserRole.REVIEWER,
        )
    ),
):
    """
    Analyzes an uploaded reference image or content revision image file using visual inspection.
    Extracts dimensions, dominant color palette, and calculates WCAG 2.1 AA relative luminance & contrast ratio.
    """
    return DesignerCopilotService.analyze_reference_image(
        db=db,
        auth=auth,
        request=payload,
    )


@router.post("/critique", response_model=DesignCritiqueResponse, status_code=status.HTTP_200_OK)
def critique_design(
    payload: DesignCritiqueRequest,
    db: Session = Depends(get_db),
    auth: AuthContext = Depends(
        require_roles(
            UserRole.DESIGNER,
            UserRole.MARKETING,
            UserRole.CREATOR,
            UserRole.ADMIN,
            UserRole.COMPLIANCE_OFFICER,
            UserRole.REVIEWER,
        )
    ),
):
    """
    Performs structured creative design critique evaluating visual hierarchy,
    WCAG contrast, mobile safe-zones, and branding.
    """
    return DesignerCopilotService.critique_design_direction(
        db=db,
        auth=auth,
        request=payload,
    )


@router.post("/adapt", response_model=DesignAdaptationResponse, status_code=status.HTTP_200_OK)
def adapt_design(
    payload: DesignAdaptationRequest,
    db: Session = Depends(get_db),
    auth: AuthContext = Depends(
        require_roles(
            UserRole.DESIGNER,
            UserRole.MARKETING,
            UserRole.CREATOR,
            UserRole.ADMIN,
            UserRole.COMPLIANCE_OFFICER,
            UserRole.REVIEWER,
        )
    ),
):
    """
    Statefully adapts an existing design concept (e.g. 'make it more premium', 'adapt for Instagram')
    while strictly preserving specified constraints (headline, product, logo buffer).
    """
    return DesignerCopilotService.adapt_design_concept(
        db=db,
        auth=auth,
        request=payload,
    )
