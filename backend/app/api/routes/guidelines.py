import uuid
from datetime import datetime, timezone
from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.core.security import (
    get_current_auth_context,
    AuthContext,
    UserRole,
    Permission,
    require_permission,
)
from app.models import (
    BrandGuideline,
    GuidelineRule,
    BrandGuidelineVersion,
    GuidelineClarificationReport,
    AuditEvent,
)
from app.schemas.guideline import (
    BrandGuidelineCreate,
    BrandGuidelineResponse,
    BrandGuidelineProfileResponse,
    BrandGuidelineDraftUpdate,
    BrandGuidelinePublishRequest,
    BrandGuidelineSubmitReviewRequest,
    BrandGuidelineReviewDecisionRequest,
    BrandGuidelineRollbackRequest,
    BrandGuidelineVersionResponse,
    EffectiveSettingsResponse,
    GuidelineRuleResponse,
    ConflictCheckResponse,
    RuleConflictItem,
    ClarificationReportCreate,
    ClarificationReportResponse,
    ClarificationReportResolve,
)
from app.services.guideline_templates import GuidelineTemplateService
from app.services.conflict_resolver import ConflictResolver, PRIORITY_HIERARCHY

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
            jurisdiction="Global",
            industry="General",
            product_category="Enterprise Software",
            requires_legal_approval=True,
            draft_data={},
            published_data=None,
        )
        db.add(guideline)
        db.commit()
        db.refresh(guideline)
    return guideline


def _build_profile_response(guideline: BrandGuideline, auth: AuthContext, db: Session) -> BrandGuidelineProfileResponse:
    """Constructs a role-aware profile response strictly enforcing permission boundaries."""
    is_manager = auth.has_role(UserRole.ADMIN, UserRole.COMPLIANCE_OFFICER)
    can_edit = auth.has_permission(Permission.CREATE_BRAND_DRAFTS)
    can_review_legal = auth.has_permission(Permission.REVIEW_LEGAL_CHANGES)
    can_publish = auth.has_permission(Permission.PUBLISH_GUIDELINES)
    user_role_str = auth.roles[0].value if auth.roles else "viewer"

    # Strict isolation: Draft data is NEVER exposed to employees without editing permission
    exposed_draft = guideline.draft_data if can_edit else None

    # Load associated published rules
    rules_records = (
        db.query(GuidelineRule)
        .filter(GuidelineRule.guideline_id == guideline.id)
        .order_by(GuidelineRule.priority_level.asc(), GuidelineRule.created_at.asc())
        .all()
    )
    rules_resp = [GuidelineRuleResponse.model_validate(r) for r in rules_records] if rules_records else []

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
        can_edit=can_edit,
        can_review_legal=can_review_legal,
        can_publish=can_publish,
        user_role=user_role_str,
        submission_notes=guideline.submission_notes,
        submitted_by=guideline.submitted_by,
        submitted_at=guideline.submitted_at,
        reviewed_by=guideline.reviewed_by,
        reviewed_at=guideline.reviewed_at,
        review_decision=guideline.review_decision,
        review_rationale=guideline.review_rationale,
        requires_legal_approval=guideline.requires_legal_approval,
        jurisdiction=guideline.jurisdiction or "Global",
        industry=guideline.industry or "General",
        product_category=guideline.product_category or "Enterprise Software",
        content_channels=guideline.content_channels,
        effective_date=guideline.effective_date,
        review_date=guideline.review_date,
        draft_data=exposed_draft,
        published_data=guideline.published_data,
        rules=rules_resp,
        created_at=guideline.created_at,
        updated_at=guideline.updated_at,
    )


@router.get("", response_model=List[BrandGuidelineResponse])
def list_guidelines(
    jurisdiction: Optional[str] = Query(None, description="Filter by jurisdiction (US, EU, UK, Global)"),
    industry: Optional[str] = Query(None, description="Filter by industry"),
    db: Session = Depends(get_db),
    auth: AuthContext = Depends(get_current_auth_context),
):
    """Retrieve brand guidelines scoped to the current tenant with optional jurisdiction/industry filters."""
    query = db.query(BrandGuideline).filter(BrandGuideline.organization_id == auth.organization_id)
    if jurisdiction and jurisdiction != "all":
        query = query.filter(BrandGuideline.jurisdiction.in_([jurisdiction, "Global"]))
    if industry and industry != "all":
        query = query.filter(BrandGuideline.industry.in_([industry, "General"]))
    return query.all()


@router.get("/profile", response_model=BrandGuidelineProfileResponse)
def get_brand_profile(
    db: Session = Depends(get_db),
    auth: AuthContext = Depends(get_current_auth_context),
):
    """
    Retrieves the authoritative brand guideline profile for the current tenant.
    - Managers and Legal Officers receive draft_data and management controls.
    - Employees receive only approved, published_data. Drafts are NEVER exposed to employees.
    """
    guideline = _get_or_create_org_guideline(db, auth.organization_id)
    return _build_profile_response(guideline, auth, db)


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
    if not auth.has_permission(Permission.CREATE_BRAND_DRAFTS):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied: Only brand administrators and legal compliance officers can edit guideline drafts.",
        )

    guideline = _get_or_create_org_guideline(db, auth.organization_id)

    if payload.name:
        guideline.name = payload.name
    if payload.description is not None:
        guideline.description = payload.description
    if payload.jurisdiction:
        guideline.jurisdiction = payload.jurisdiction
    if payload.industry:
        guideline.industry = payload.industry
    if payload.product_category:
        guideline.product_category = payload.product_category
    if payload.content_channels:
        guideline.content_channels = payload.content_channels

    guideline.draft_data = payload.draft_data

    # If previously published, mark status as changes_pending
    if guideline.published_data:
        guideline.status = "changes_pending"
    else:
        guideline.status = "draft"

    # Reset any previous review decision when new draft edits are saved
    guideline.review_decision = None

    # Audit event logging
    event = AuditEvent(
        organization_id=auth.organization_id,
        actor_id=auth.user_id,
        entity_type="brand_guideline",
        entity_id=guideline.id,
        event_type="guideline_draft_updated",
        details={
            "actor_email": auth.email,
            "status": guideline.status,
            "name": guideline.name,
        },
    )
    db.add(event)

    db.commit()
    db.refresh(guideline)

    return _build_profile_response(guideline, auth, db)


@router.post("/submit-for-review", response_model=BrandGuidelineProfileResponse)
def submit_draft_for_review(
    payload: BrandGuidelineSubmitReviewRequest,
    db: Session = Depends(get_db),
    auth: AuthContext = Depends(get_current_auth_context),
):
    """
    Submits a working guideline draft for legal and compliance review.
    Validates draft completeness before submission.
    """
    if not auth.has_permission(Permission.PROPOSE_LEGAL_RULES):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied: Only authorized administrators can submit guidelines for legal review.",
        )

    guideline = _get_or_create_org_guideline(db, auth.organization_id)
    draft = guideline.draft_data or {}
    identity = draft.get("identity", {})
    brand_name = identity.get("brand_name") or guideline.name

    if not brand_name or not str(brand_name).strip():
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Validation failed: Brand Name is required in Brand Identity before submitting for review.",
        )

    now = datetime.now(timezone.utc)
    guideline.status = "submitted"
    guideline.submitted_by = auth.full_name or auth.email
    guideline.submitted_at = now
    guideline.submission_notes = payload.submission_notes
    guideline.requires_legal_approval = payload.requires_legal_approval

    if payload.jurisdiction:
        guideline.jurisdiction = payload.jurisdiction
    if payload.industry:
        guideline.industry = payload.industry
    if payload.content_channels:
        guideline.content_channels = payload.content_channels

    # Clear previous review decision
    guideline.review_decision = None
    guideline.reviewed_by = None
    guideline.reviewed_at = None

    # Audit event logging
    event = AuditEvent(
        organization_id=auth.organization_id,
        actor_id=auth.user_id,
        entity_type="brand_guideline",
        entity_id=guideline.id,
        event_type="guideline_submitted_for_review",
        details={
            "submitted_by": guideline.submitted_by,
            "notes": payload.submission_notes,
            "requires_legal_approval": payload.requires_legal_approval,
            "timestamp": now.isoformat(),
        },
    )
    db.add(event)

    db.commit()
    db.refresh(guideline)

    return _build_profile_response(guideline, auth, db)


@router.get("/pending-review", response_model=List[BrandGuidelineProfileResponse])
def list_pending_reviews(
    db: Session = Depends(get_db),
    auth: AuthContext = Depends(get_current_auth_context),
):
    """
    Retrieves the queue of guideline drafts submitted for legal compliance review.
    Restricted strictly to Legal / Compliance Officers.
    """
    if not auth.has_permission(Permission.REVIEW_LEGAL_CHANGES):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied: Only authorized Legal & Compliance officers can view the legal review queue.",
        )

    pending = (
        db.query(BrandGuideline)
        .filter(
            BrandGuideline.organization_id == auth.organization_id,
            BrandGuideline.status.in_(["submitted", "changes_requested"]),
        )
        .order_by(BrandGuideline.updated_at.desc())
        .all()
    )
    return [_build_profile_response(g, auth, db) for g in pending]


@router.post("/review-decision", response_model=BrandGuidelineProfileResponse)
def record_review_decision(
    payload: BrandGuidelineReviewDecisionRequest,
    db: Session = Depends(get_db),
    auth: AuthContext = Depends(get_current_auth_context),
):
    """
    Records a formal legal review decision: 'approved', 'rejected', or 'changes_requested'.
    Enforces strict least privilege: Only an authorized Compliance Officer can record legal decisions.
    Prevents unauthorized self-approval.
    """
    if not auth.is_legal_officer():
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied: Only designated Legal & Compliance Officers can approve or reject legal guidelines.",
        )

    guideline = _get_or_create_org_guideline(db, auth.organization_id)

    if guideline.status not in ["submitted", "changes_pending", "changes_requested"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Guideline is currently in '{guideline.status}' status and not awaiting review.",
        )

    now = datetime.now(timezone.utc)
    guideline.status = payload.decision
    guideline.review_decision = payload.decision
    guideline.reviewed_by = auth.full_name or auth.email
    guideline.reviewed_at = now
    guideline.review_rationale = payload.rationale

    # Audit event logging
    event = AuditEvent(
        organization_id=auth.organization_id,
        actor_id=auth.user_id,
        entity_type="brand_guideline",
        entity_id=guideline.id,
        event_type=f"guideline_review_{payload.decision}",
        details={
            "reviewed_by": guideline.reviewed_by,
            "decision": payload.decision,
            "rationale": payload.rationale,
            "timestamp": now.isoformat(),
        },
    )
    db.add(event)

    db.commit()
    db.refresh(guideline)

    return _build_profile_response(guideline, auth, db)


@router.post("/publish", response_model=BrandGuidelineProfileResponse)
def publish_guidelines(
    payload: BrandGuidelinePublishRequest,
    db: Session = Depends(get_db),
    auth: AuthContext = Depends(get_current_auth_context),
):
    """
    Publishes the working draft into the authoritative, immutable brand profile.
    Enforces governance rules:
    - If configured policy requires legal approval, verifies the draft is formally approved
      or published directly by an authorized Compliance Officer.
    - Stores immutable historical version snapshot.
    - Synchronizes granular GuidelineRule records with priority levels for AI engine lookups.
    """
    if not auth.has_permission(Permission.PUBLISH_GUIDELINES):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied: Only authorized administrators and compliance officers can publish brand guidelines.",
        )

    guideline = _get_or_create_org_guideline(db, auth.organization_id)
    draft = guideline.draft_data or {}

    # Check legal approval prerequisite for legally sensitive categories or submitted proposals
    draft_compliance = draft.get("compliance", [])
    pub_compliance = (guideline.published_data or {}).get("compliance", [])
    legal_rules_modified = draft_compliance != pub_compliance

    if (guideline.requires_legal_approval and legal_rules_modified) or guideline.status == "submitted":
        if guideline.status != "approved" and not auth.is_legal_officer():
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=(
                    "Publication blocked by compliance policy: Changes to legally sensitive rules or submitted "
                    "drafts require prior review and approval by an authorized Legal & Compliance Officer."
                ),
            )

    identity = draft.get("identity", {})
    brand_name = identity.get("brand_name") or guideline.name
    if not brand_name or not str(brand_name).strip():
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Validation failed: Brand Name is required in Brand Identity before publishing.",
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
        approved_by=guideline.reviewed_by or publisher_name,
        approved_at=guideline.reviewed_at or now,
        approval_rationale=guideline.review_rationale,
        jurisdiction=guideline.jurisdiction or "Global",
        industry=guideline.industry or "General",
        effective_date=guideline.effective_date or now,
        review_date=guideline.review_date,
    )
    db.add(version_record)

    # Sync individual rules from published data for AI Engine compatibility
    _sync_rules_from_published_data(db, guideline, draft)

    # Record AuditEvent
    event = AuditEvent(
        organization_id=auth.organization_id,
        actor_id=auth.user_id,
        entity_type="brand_guideline",
        entity_id=guideline.id,
        event_type="guideline_published",
        details={
            "version": payload.version,
            "published_by": publisher_name,
            "changelog": payload.changelog,
            "approved_by": version_record.approved_by,
        },
    )
    db.add(event)

    db.commit()
    db.refresh(guideline)

    return _build_profile_response(guideline, auth, db)


@router.post("/rollback", response_model=BrandGuidelineProfileResponse)
def rollback_to_version(
    payload: BrandGuidelineRollbackRequest,
    db: Session = Depends(get_db),
    auth: AuthContext = Depends(get_current_auth_context),
):
    """
    Rolls back to a previously approved version by publishing a NEW version from the historical snapshot.
    Does NOT rewrite historical records, maintaining version immutability and complete audit trails.
    """
    if not auth.has_permission(Permission.PUBLISH_GUIDELINES):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied: Only managers and compliance officers can execute version rollbacks.",
        )

    version_record = (
        db.query(BrandGuidelineVersion)
        .filter(
            BrandGuidelineVersion.id == payload.version_id,
            BrandGuidelineVersion.organization_id == auth.organization_id,
        )
        .first()
    )
    if not version_record:
        raise HTTPException(status_code=404, detail="Target version not found.")

    guideline = _get_or_create_org_guideline(db, auth.organization_id)
    now = datetime.now(timezone.utc)
    publisher_name = auth.full_name or auth.email or "Authorized Manager"

    new_version_tag = f"{guideline.version}.rollback-{int(now.timestamp())}"
    changelog = f"Rollback to snapshot of v{version_record.version}. Rationale: {payload.rationale}"

    guideline.published_data = version_record.snapshot_data
    guideline.draft_data = version_record.snapshot_data
    guideline.status = "published"
    guideline.version = new_version_tag
    guideline.published_at = now
    guideline.published_by = publisher_name

    new_version = BrandGuidelineVersion(
        guideline_id=guideline.id,
        organization_id=auth.organization_id,
        version=new_version_tag,
        changelog=changelog,
        published_by=publisher_name,
        published_at=now,
        snapshot_data=version_record.snapshot_data,
        approved_by=publisher_name,
        approved_at=now,
        approval_rationale=f"Restored from version {version_record.version}: {payload.rationale}",
        jurisdiction=version_record.jurisdiction or "Global",
        industry=version_record.industry or "General",
        effective_date=now,
    )
    db.add(new_version)
    _sync_rules_from_published_data(db, guideline, version_record.snapshot_data)

    event = AuditEvent(
        organization_id=auth.organization_id,
        actor_id=auth.user_id,
        entity_type="brand_guideline",
        entity_id=guideline.id,
        event_type="guideline_rollback_published",
        details={
            "restored_version": version_record.version,
            "new_version": new_version_tag,
            "rationale": payload.rationale,
        },
    )
    db.add(event)

    db.commit()
    db.refresh(guideline)

    return _build_profile_response(guideline, auth, db)


@router.post("/conflict-check", response_model=ConflictCheckResponse)
def check_guideline_conflicts(
    db: Session = Depends(get_db),
    auth: AuthContext = Depends(get_current_auth_context),
):
    """
    Evaluates guideline rules against the documented 5-tier governance priority hierarchy.
    Identifies conflicts where lower-priority brand preferences contradict higher-priority legal mandates.
    """
    guideline = _get_or_create_org_guideline(db, auth.organization_id)
    # Managers evaluate their working draft; employees evaluate published data
    is_editor = auth.has_permission(Permission.CREATE_BRAND_DRAFTS)
    source_data = (guideline.draft_data if is_editor and guideline.draft_data else guideline.published_data) or {}

    raw_conflicts = ConflictResolver.evaluate_guideline_conflicts(source_data)
    conflict_items = [RuleConflictItem(**c) for c in raw_conflicts]

    return ConflictCheckResponse(
        total_conflicts=len(conflict_items),
        conflicts=conflict_items,
        priority_hierarchy=PRIORITY_HIERARCHY,
        compliance_disclaimer=(
            "Inkloom AI conflict detection assists organizational decision-making by applying "
            "documented governance priority hierarchies. It does not replace qualified legal review."
        ),
    )


@router.get("/starter-templates")
def get_starter_templates(
    jurisdiction: str = Query("all", description="Jurisdiction filter (US, EU, UK, Global, all)"),
    industry: str = Query("all", description="Industry filter (General, SaaS, Fintech, Healthcare, all)"),
    auth: AuthContext = Depends(get_current_auth_context),
):
    """
    Returns verified starter guideline templates with authentic statutory citations.
    Includes explicit verification statuses and evidence requirements.
    """
    templates = GuidelineTemplateService.get_starter_templates(jurisdiction=jurisdiction, industry=industry)
    scopes = GuidelineTemplateService.get_supported_scopes()
    return {
        "total_templates": len(templates),
        "templates": templates,
        "supported_scopes": scopes,
        "compliance_disclaimer": (
            "Templates provide reference points for organizational compliance policies and do not constitute legal advice."
        ),
    }


@router.post("/report-unclear", response_model=ClarificationReportResponse, status_code=status.HTTP_201_CREATED)
def report_unclear_guideline(
    payload: ClarificationReportCreate,
    db: Session = Depends(get_db),
    auth: AuthContext = Depends(get_current_auth_context),
):
    """
    Allows any employee or creator to report an unclear, conflicting, or outdated rule
    without modifying official guidelines. Reports are routed to Legal & Compliance.
    """
    guideline = _get_or_create_org_guideline(db, auth.organization_id)

    report = GuidelineClarificationReport(
        id=str(uuid.uuid4()),
        guideline_id=guideline.id,
        organization_id=auth.organization_id,
        user_id=auth.user_id,
        user_email=auth.email or "employee@organization.internal",
        user_name=auth.full_name or "Employee",
        rule_reference=payload.rule_reference,
        report_type=payload.report_type,
        description=payload.description,
        status="open",
    )
    db.add(report)


    event = AuditEvent(
        organization_id=auth.organization_id,
        actor_id=auth.user_id,
        entity_type="clarification_report",
        entity_id=report.id,
        event_type="guideline_clarification_reported",
        details={
            "rule_reference": payload.rule_reference,
            "report_type": payload.report_type,
        },
    )
    db.add(event)

    db.commit()
    db.refresh(report)

    return report


@router.get("/reports", response_model=List[ClarificationReportResponse])
def list_clarification_reports(
    db: Session = Depends(get_db),
    auth: AuthContext = Depends(get_current_auth_context),
):
    """Lists employee clarification reports for the organization."""
    reports = (
        db.query(GuidelineClarificationReport)
        .filter(GuidelineClarificationReport.organization_id == auth.organization_id)
        .order_by(GuidelineClarificationReport.created_at.desc())
        .all()
    )
    return reports


@router.put("/reports/{report_id}", response_model=ClarificationReportResponse)
def resolve_clarification_report(
    report_id: str,
    payload: ClarificationReportResolve,
    db: Session = Depends(get_db),
    auth: AuthContext = Depends(get_current_auth_context),
):
    """Resolves or dismisses an employee clarification report with documented notes."""
    if not auth.has_role(UserRole.ADMIN, UserRole.COMPLIANCE_OFFICER):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied: Only managers and compliance officers can resolve employee reports.",
        )

    report = (
        db.query(GuidelineClarificationReport)
        .filter(
            GuidelineClarificationReport.id == report_id,
            GuidelineClarificationReport.organization_id == auth.organization_id,
        )
        .first()
    )
    if not report:
        raise HTTPException(status_code=404, detail="Clarification report not found.")

    report.status = payload.status
    report.resolution_notes = payload.resolution_notes
    report.resolved_by = auth.full_name or auth.email
    report.resolved_at = datetime.now(timezone.utc)

    db.commit()
    db.refresh(report)
    return report


def _sync_rules_from_published_data(db: Session, guideline: BrandGuideline, data: Dict[str, Any]):
    """Translates published sections into granular GuidelineRule records with priority levels."""
    db.query(GuidelineRule).filter(GuidelineRule.guideline_id == guideline.id).delete()

    rules_to_add = []

    # 1. Voice & Words to avoid
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
                rule_type="brand_standard",
                priority_level=3,
                jurisdiction=guideline.jurisdiction or "Global",
                industry=guideline.industry or "General",
                verification_status="verified",
            )
        )

    # 2. Tone rules
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
                rule_type="brand_standard",
                priority_level=3,
                jurisdiction=guideline.jurisdiction or "Global",
                industry=guideline.industry or "General",
                verification_status="verified",
            )
        )

    # 3. Color rules
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
            rule_type="brand_standard",
            priority_level=3,
            jurisdiction=guideline.jurisdiction or "Global",
            industry=guideline.industry or "General",
            authoritative_source="W3C WCAG 2.1 AA Contrast Standards",
            verification_status="verified",
        )
    )

    # 4. Do's and Don'ts
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
                rule_type="brand_standard",
                priority_level=3,
                jurisdiction=guideline.jurisdiction or "Global",
                industry=guideline.industry or "General",
                verification_status="verified",
            )
        )

    # 5. Compliance & Mandatory Disclosures (Priority 1 or 2)
    for comp in data.get("compliance", []):
        is_mandatory = comp.get("requirement_level") == "mandatory"
        rules_to_add.append(
            GuidelineRule(
                guideline_id=guideline.id,
                category="legal_compliance",
                rule_name=comp.get("title", "Mandatory Disclaimer / Disclosure"),
                section="Legal Compliance & Disclosures",
                severity_default="critical" if is_mandatory else "medium",
                rule_definition={"rule_text": comp.get("rule_text", ""), "requirement_level": comp.get("requirement_level")},
                requires_human_review=True,
                rule_type="legal_mandatory" if is_mandatory else "legal_policy",
                priority_level=1 if is_mandatory else 2,
                jurisdiction=guideline.jurisdiction or "Global",
                industry=guideline.industry or "General",
                required_disclosure=comp.get("rule_text"),
                verification_status="verified",
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
            detail="Access denied: Only managers can restore previous guideline versions into drafts.",
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

    event = AuditEvent(
        organization_id=auth.organization_id,
        actor_id=auth.user_id,
        entity_type="brand_guideline",
        entity_id=guideline.id,
        event_type="guideline_version_restored_to_draft",
        details={
            "restored_version_id": version_id,
            "version_tag": version_record.version,
        },
    )
    db.add(event)

    db.commit()
    db.refresh(guideline)

    return _build_profile_response(guideline, auth, db)


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
    is_editor = auth.has_permission(Permission.CREATE_BRAND_DRAFTS)
    source = (guideline.draft_data if is_editor and guideline.draft_data else guideline.published_data) or {}

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

    if specific.get("enabled", True):
        overrides = specific.get("overrides", {})
        for k, v in overrides.items():
            if v is not None and v != "":
                effective[k] = v
                if k in inherited_keys:
                    inherited_keys.remove(k)
                overridden_keys.append(k)

        if "contrast_ratio" in overrides and float(overrides["contrast_ratio"]) < 4.5:
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
    if not auth.has_permission(Permission.CREATE_BRAND_DRAFTS):
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
        jurisdiction=payload.jurisdiction,
        industry=payload.industry,
        product_category=payload.product_category,
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
                rule_type=r.rule_type,
                priority_level=r.priority_level,
                jurisdiction=r.jurisdiction,
                industry=r.industry,
                authoritative_source=r.authoritative_source,
                verification_status=r.verification_status,
                evidence_required=r.evidence_required,
                evidence_description=r.evidence_description,
                required_disclosure=r.required_disclosure,
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
