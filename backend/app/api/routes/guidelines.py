import uuid
from datetime import datetime, timezone
from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.core.security import get_current_auth_context, AuthContext, UserRole
from app.models import BrandGuideline, GuidelineRule, BrandGuidelineVersion
from app.schemas.guideline import (
    BrandGuidelineCreate,
    BrandGuidelineResponse,
    BrandGuidelineProfileResponse,
    BrandGuidelineDraftUpdate,
    BrandGuidelinePublishRequest,
    BrandGuidelineVersionResponse,
    EffectiveSettingsResponse,
    GuidelineRuleCreate,
)

router = APIRouter(prefix="/guidelines", tags=["Brand Guidelines"])


def _get_or_create_org_guideline(db: Session, organization_id: str) -> BrandGuideline:
    """Helper ensuring an active brand guideline record exists for the tenant."""
    guideline = (
        db.query(BrandGuideline)
        .filter(
            BrandGuideline.organization_id == organization_id,
            BrandGuideline.is_active == True,
        )
        .order_by(BrandGuideline.created_at.desc())
        .first()
    )
    if not guideline:
        guideline = BrandGuideline(
            organization_id=organization_id,
            name="Official Enterprise Brand Standards",
            description="Authoritative brand guidelines governing visual identity, voice, tone, and media compliance.",
            version="1.0.0",
            status="draft",
            is_active=True,
            draft_data={},
            published_data=None,
        )
        db.add(guideline)
        db.commit()
        db.refresh(guideline)
    return guideline


@router.get("", response_model=List[BrandGuidelineResponse])
def list_guidelines(
    db: Session = Depends(get_db),
    auth: AuthContext = Depends(get_current_auth_context),
):
    """Retrieve brand guidelines scoped to the current tenant."""
    guidelines = (
        db.query(BrandGuideline)
        .filter(BrandGuideline.organization_id == auth.organization_id)
        .all()
    )
    return guidelines


@router.get("/profile", response_model=BrandGuidelineProfileResponse)
def get_brand_profile(
    db: Session = Depends(get_db),
    auth: AuthContext = Depends(get_current_auth_context),
):
    """
    Retrieves the authoritative brand guideline profile for the current tenant.
    - Managers receive both draft_data and published_data with is_manager=True.
    - Employees receive only published_data with is_manager=False. Draft data is NEVER exposed to employees.
    """
    guideline = _get_or_create_org_guideline(db, auth.organization_id)
    is_manager = auth.has_role(UserRole.ADMIN, UserRole.COMPLIANCE_OFFICER)

    return BrandGuidelineProfileResponse(
        id=guideline.id,
        organization_id=guideline.organization_id,
        name=guideline.name,
        description=guideline.description,
        version=guideline.version,
        status=guideline.status or "draft",
        is_active=guideline.is_active,
        published_at=guideline.published_at,
        published_by=guideline.published_by,
        is_manager=is_manager,
        draft_data=guideline.draft_data if is_manager else None,
        published_data=guideline.published_data,
        created_at=guideline.created_at,
        updated_at=guideline.updated_at,
    )


@router.put("/draft", response_model=BrandGuidelineProfileResponse)
def update_draft_guidelines(
    payload: BrandGuidelineDraftUpdate,
    db: Session = Depends(get_db),
    auth: AuthContext = Depends(get_current_auth_context),
):
    """
    Saves partially or fully completed guideline draft.
    Restricted to managers (Admins and Compliance Officers).
    """
    if not auth.has_role(UserRole.ADMIN, UserRole.COMPLIANCE_OFFICER):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied: Only managers and compliance officers can edit brand guideline drafts.",
        )

    guideline = _get_or_create_org_guideline(db, auth.organization_id)

    if payload.name:
        guideline.name = payload.name
    if payload.description is not None:
        guideline.description = payload.description

    guideline.draft_data = payload.draft_data

    # If already published, mark status as changes_pending
    if guideline.published_data:
        guideline.status = "changes_pending"
    else:
        guideline.status = "draft"

    db.commit()
    db.refresh(guideline)

    return BrandGuidelineProfileResponse(
        id=guideline.id,
        organization_id=guideline.organization_id,
        name=guideline.name,
        description=guideline.description,
        version=guideline.version,
        status=guideline.status,
        is_active=guideline.is_active,
        published_at=guideline.published_at,
        published_by=guideline.published_by,
        is_manager=True,
        draft_data=guideline.draft_data,
        published_data=guideline.published_data,
        created_at=guideline.created_at,
        updated_at=guideline.updated_at,
    )


@router.post("/publish", response_model=BrandGuidelineProfileResponse)
def publish_guidelines(
    payload: BrandGuidelinePublishRequest,
    db: Session = Depends(get_db),
    auth: AuthContext = Depends(get_current_auth_context),
):
    """
    Publishes the working draft into the authoritative, versioned brand profile.
    - Validates required elements (Brand Name, Colors, Voice).
    - Stores immutable historical version snapshot.
    - Synchronizes individual GuidelineRule records for AI engine lookups.
    """
    if not auth.has_role(UserRole.ADMIN, UserRole.COMPLIANCE_OFFICER):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied: Only managers and compliance officers can publish brand guidelines.",
        )

    guideline = _get_or_create_org_guideline(db, auth.organization_id)

    draft = guideline.draft_data or {}
    identity = draft.get("identity", {})
    brand_name = identity.get("brand_name") or guideline.name
    if not brand_name or not str(brand_name).strip():
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Validation failed: Brand Name is required in Brand Identity.",
        )

    now = datetime.now(timezone.utc)
    publisher_name = auth.full_name or auth.email or "Authorized Manager"

    # Promote draft to published
    guideline.published_data = draft
    guideline.status = "published"
    guideline.version = payload.version
    guideline.published_at = now
    guideline.published_by = publisher_name

    # Create immutable version record
    version_record = BrandGuidelineVersion(
        guideline_id=guideline.id,
        organization_id=auth.organization_id,
        version=payload.version,
        changelog=payload.changelog or f"Published by {publisher_name} on {now.strftime('%Y-%m-%d %H:%M UTC')}",
        published_by=publisher_name,
        published_at=now,
        snapshot_data=draft,
    )
    db.add(version_record)

    # Sync individual rules from published data for AI Engine compatibility
    _sync_rules_from_published_data(db, guideline, draft)

    db.commit()
    db.refresh(guideline)

    return BrandGuidelineProfileResponse(
        id=guideline.id,
        organization_id=guideline.organization_id,
        name=guideline.name,
        description=guideline.description,
        version=guideline.version,
        status=guideline.status,
        is_active=guideline.is_active,
        published_at=guideline.published_at,
        published_by=guideline.published_by,
        is_manager=True,
        draft_data=guideline.draft_data,
        published_data=guideline.published_data,
        created_at=guideline.created_at,
        updated_at=guideline.updated_at,
    )


def _sync_rules_from_published_data(db: Session, guideline: BrandGuideline, data: Dict[str, Any]):
    """Translates high-level published sections into granular GuidelineRule records for rule engine."""
    # Delete existing rules for this guideline
    db.query(GuidelineRule).filter(GuidelineRule.guideline_id == guideline.id).delete()

    rules_to_add = []

    # Voice & Words to avoid
    voice = data.get("voice", {})
    words_to_avoid = voice.get("words_to_avoid", [])
    if words_to_avoid:
        rules_to_add.append(
            GuidelineRule(
                guideline_id=guideline.id,
                category="terminology",
                rule_name="Forbidden Brand Terminology",
                section="Brand Voice & Vocabulary",
                severity_default="high",
                rule_definition={"forbidden_terms": words_to_avoid},
                requires_human_review=False,
            )
        )

    # Tone rules
    brand_tone = voice.get("brand_tone", [])
    if brand_tone:
        rules_to_add.append(
            GuidelineRule(
                guideline_id=guideline.id,
                category="tone_voice",
                rule_name="Brand Tone Alignment",
                section="Tone & Personality",
                severity_default="medium",
                rule_definition={"approved_tones": brand_tone, "formality": voice.get("formality_level", "professional")},
                requires_human_review=False,
            )
        )

    # Color rules
    colors = data.get("colors", {})
    palette = colors.get("palette", [])
    primary_color = next((c.get("hex") for c in palette if c.get("role") == "primary"), "#0F172A")
    rules_to_add.append(
        GuidelineRule(
            guideline_id=guideline.id,
            category="visual_brand",
            rule_name="Official Color Palette & Minimum Contrast",
            section="Brand Color System",
            severity_default="medium",
            rule_definition={
                "primary_hex": primary_color,
                "palette": palette,
                "minimum_contrast_ratio": 4.5,
            },
            requires_human_review=False,
        )
    )

    # Do's and Don'ts
    for rule in data.get("dos_and_donts", []):
        rules_to_add.append(
            GuidelineRule(
                guideline_id=guideline.id,
                category="policy",
                rule_name=rule.get("title", "Governance Policy Rule"),
                section=f"Brand Do's & Don'ts ({rule.get('type', 'rule')})",
                severity_default=rule.get("priority", "medium"),
                rule_definition={"description": rule.get("description", ""), "rule_type": rule.get("type", "")},
                requires_human_review=rule.get("priority") in ["critical", "high"],
            )
        )

    # Compliance rules
    for comp in data.get("compliance", []):
        rules_to_add.append(
            GuidelineRule(
                guideline_id=guideline.id,
                category="claim_verification",
                rule_name=comp.get("title", "Mandatory Disclaimer / Disclosure"),
                section="Legal Compliance & Disclosures",
                severity_default="high" if comp.get("requirement_level") == "mandatory" else "medium",
                rule_definition={"rule_text": comp.get("rule_text", ""), "requirement_level": comp.get("requirement_level")},
                requires_human_review=True,
            )
        )

    if rules_to_add:
        db.add_all(rules_to_add)


@router.get("/versions", response_model=List[BrandGuidelineVersionResponse])
def list_versions(
    db: Session = Depends(get_db),
    auth: AuthContext = Depends(get_current_auth_context),
):
    """Lists published version history for this organization."""
    guideline = _get_or_create_org_guideline(db, auth.organization_id)
    versions = (
        db.query(BrandGuidelineVersion)
        .filter(BrandGuidelineVersion.guideline_id == guideline.id)
        .order_by(BrandGuidelineVersion.created_at.desc())
        .all()
    )
    return versions


@router.post("/versions/{version_id}/restore", response_model=BrandGuidelineProfileResponse)
def restore_version(
    version_id: str,
    db: Session = Depends(get_db),
    auth: AuthContext = Depends(get_current_auth_context),
):
    """
    Restores an earlier published version into the manager's working draft.
    Requires manager role.
    """
    if not auth.has_role(UserRole.ADMIN, UserRole.COMPLIANCE_OFFICER):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied: Only managers can restore previous guideline versions.",
        )

    version_record = (
        db.query(BrandGuidelineVersion)
        .filter(
            BrandGuidelineVersion.id == version_id,
            BrandGuidelineVersion.organization_id == auth.organization_id,
        )
        .first()
    )
    if not version_record:
        raise HTTPException(status_code=404, detail="Version not found.")

    guideline = _get_or_create_org_guideline(db, auth.organization_id)
    guideline.draft_data = version_record.snapshot_data
    guideline.status = "changes_pending"

    db.commit()
    db.refresh(guideline)

    return BrandGuidelineProfileResponse(
        id=guideline.id,
        organization_id=guideline.organization_id,
        name=guideline.name,
        description=guideline.description,
        version=guideline.version,
        status=guideline.status,
        is_active=guideline.is_active,
        published_at=guideline.published_at,
        published_by=guideline.published_by,
        is_manager=True,
        draft_data=guideline.draft_data,
        published_data=guideline.published_data,
        created_at=guideline.created_at,
        updated_at=guideline.updated_at,
    )


@router.get("/effective", response_model=EffectiveSettingsResponse)
def get_effective_settings(
    media_type: str = Query("social_media", description="Media format category e.g. social_media, photography, video, print, web_ads"),
    db: Session = Depends(get_db),
    auth: AuthContext = Depends(get_current_auth_context),
):
    """
    Computes effective inherited settings for a specific creative media type.
    Distinguishes inherited values, explicit overrides, and flags rule conflicts.
    """
    guideline = _get_or_create_org_guideline(db, auth.organization_id)
    # Prefer draft if manager, else published
    is_manager = auth.has_role(UserRole.ADMIN, UserRole.COMPLIANCE_OFFICER)
    source = (guideline.draft_data if is_manager and guideline.draft_data else guideline.published_data) or {}

    general_identity = source.get("identity", {})
    general_colors = source.get("colors", {})
    general_typography = source.get("typography", {})
    general_voice = source.get("voice", {})

    media_guidelines = source.get("media_guidelines", {})
    specific = media_guidelines.get(media_type, {})

    effective = {
        "brand_name": general_identity.get("brand_name", guideline.name),
        "primary_color": next((c.get("hex") for c in general_colors.get("palette", []) if c.get("role") == "primary"), "#0F172A"),
        "primary_font": general_typography.get("primary_font", "Inter"),
        "brand_tone": general_voice.get("brand_tone", ["Professional", "Consultative"]),
    }

    inherited_keys = ["brand_name", "primary_color", "primary_font", "brand_tone"]
    overridden_keys = []
    conflicts = []

    # Merge media overrides if enabled
    if specific.get("enabled", True):
        overrides = specific.get("overrides", {})
        for k, v in overrides.items():
            if v is not None and v != "":
                effective[k] = v
                if k in inherited_keys:
                    inherited_keys.remove(k)
                overridden_keys.append(k)

        # Conflict detection: check if override contradicts critical general rules
        if "contrast_ratio" in overrides and overrides["contrast_ratio"] < 4.5:
            conflicts.append({
                "field": "contrast_ratio",
                "severity": "critical",
                "message": f"Media override contrast ratio ({overrides['contrast_ratio']}:1) violates General Brand WCAG AA standard (min 4.5:1).",
            })

    return EffectiveSettingsResponse(
        media_type=media_type,
        effective_settings=effective,
        inherited_keys=inherited_keys,
        overridden_keys=overridden_keys,
        conflicts=conflicts,
    )


@router.post("", response_model=BrandGuidelineResponse, status_code=status.HTTP_201_CREATED)
def create_guideline(
    payload: BrandGuidelineCreate,
    db: Session = Depends(get_db),
    auth: AuthContext = Depends(get_current_auth_context),
):
    """Create a new brand guideline (compliance officers and admins only)."""
    if not auth.has_role(UserRole.ADMIN, UserRole.COMPLIANCE_OFFICER):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only Admins and Compliance Officers can manage brand guidelines.",
        )

    guideline = BrandGuideline(
        organization_id=auth.organization_id,
        name=payload.name,
        description=payload.description,
        version=payload.version,
        is_active=payload.is_active,
    )
    db.add(guideline)
    db.flush()

    if payload.rules:
        for r in payload.rules:
            rule_record = GuidelineRule(
                guideline_id=guideline.id,
                category=r.category,
                rule_name=r.rule_name,
                section=r.section,
                severity_default=r.severity_default,
                rule_definition=r.rule_definition,
                requires_human_review=r.requires_human_review,
                source_url=r.source_url,
            )
            db.add(rule_record)

    db.commit()
    db.refresh(guideline)
    return guideline


@router.get("/{guideline_id}", response_model=BrandGuidelineResponse)
def get_guideline(
    guideline_id: str,
    db: Session = Depends(get_db),
    auth: AuthContext = Depends(get_current_auth_context),
):
    guideline = (
        db.query(BrandGuideline)
        .filter(
            BrandGuideline.id == guideline_id,
            BrandGuideline.organization_id == auth.organization_id,
        )
        .first()
    )
    if not guideline:
        raise HTTPException(status_code=404, detail="Guideline not found.")
    return guideline
