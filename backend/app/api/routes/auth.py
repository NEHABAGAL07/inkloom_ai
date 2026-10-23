import re
import uuid
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.core.security import (
    hash_password,
    verify_password,
    create_access_token,
    get_current_auth_context,
    AuthContext,
    UserRole,
)
from app.models import (
    User,
    Organization,
    Membership,
    BrandGuideline,
    GuidelineRule,
    AuditEvent,
)
from app.schemas.auth import (
    UserRegisterRequest,
    UserLoginRequest,
    AuthTokenResponse,
    UserInfo,
    OrgMembershipInfo,
    CurrentUserResponse,
)

router = APIRouter(prefix="/auth", tags=["Authentication & Onboarding"])


def slugify(text: str) -> str:
    slug = re.sub(r"[^\w\s-]", "", text).strip().lower()
    return re.sub(r"[-\s]+", "-", slug)


@router.post("/register", response_model=AuthTokenResponse, status_code=status.HTTP_201_CREATED)
def register_organization(
    payload: UserRegisterRequest,
    db: Session = Depends(get_db),
):
    """
    Atomically registers a company administrator account and creates the organization workspace.
    Initializes starter brand guidelines for the new tenant.
    """
    clean_email = payload.email.strip().lower()
    existing_user = db.query(User).filter(User.email == clean_email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="An account with this email address already exists. Please log in instead.",
        )

    # Generate unique slug for organization
    base_slug = slugify(payload.organization_name) or "workspace"
    candidate_slug = base_slug
    counter = 1
    while db.query(Organization).filter(Organization.slug == candidate_slug).first():
        candidate_slug = f"{base_slug}-{counter}"
        counter += 1

    try:
        # 1. Create Organization
        org = Organization(
            name=payload.organization_name.strip(),
            slug=candidate_slug,
            industry=payload.industry,
            is_active=True,
        )
        db.add(org)
        db.flush()

        # 2. Create User
        user = User(
            email=clean_email,
            full_name=payload.full_name.strip(),
            hashed_password=hash_password(payload.password),
            is_active=True,
        )
        db.add(user)
        db.flush()

        # 3. Create Administrator Membership
        membership = Membership(
            organization_id=org.id,
            user_id=user.id,
            role=UserRole.ADMIN.value,
        )
        db.add(membership)

        # 4. Initialize Default Brand Guideline
        guideline = BrandGuideline(
            organization_id=org.id,
            name=f"{org.name} Brand Governance Standard",
            description="Core corporate guidelines covering terminology, tone of voice, and claim citations.",
            version="1.0.0",
            is_active=True,
        )
        db.add(guideline)
        db.flush()

        # Core starter rules
        default_rules = [
            GuidelineRule(
                guideline_id=guideline.id,
                category="terminology",
                rule_name="Unapproved Buzzwords & Jargon",
                section="Section 1.1: Terminology",
                severity_default="high",
                rule_definition={
                    "forbidden_terms": ["disruptive synergy", "unbeatable price", "nextgen paradigm"],
                    "replacements": {"disruptive synergy": "streamlined integration"},
                },
                requires_human_review=False,
            ),
            GuidelineRule(
                guideline_id=guideline.id,
                category="claim_verification",
                rule_name="Mandatory Metric Benchmark Verification",
                section="Section 2.1: Performance Claims",
                severity_default="high",
                rule_definition={
                    "requires_citation": True,
                    "certified_benchmarks": [],
                },
                requires_human_review=True,
            ),
            GuidelineRule(
                guideline_id=guideline.id,
                category="tone_voice",
                rule_name="Empowering and Trustworthy Voice",
                section="Section 3.1: Tone of Voice",
                severity_default="medium",
                rule_definition={
                    "prohibited_tones": ["fear", "aggressive_sales"],
                    "prohibited_phrases": ["hurry or lose out", "crush competitors"],
                },
                requires_human_review=False,
            ),
        ]
        db.add_all(default_rules)

        # 5. Audit Log
        event = AuditEvent(
            organization_id=org.id,
            actor_id=user.id,
            entity_type="organization",
            entity_id=org.id,
            event_type="organization_registered",
            details={"name": org.name, "admin_email": user.email},
        )
        db.add(event)

        db.commit()
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Registration failed: {str(e)}",
        )

    # Issue access token
    token = create_access_token({"sub": user.id, "email": user.email, "org_id": org.id})

    return AuthTokenResponse(
        access_token=token,
        token_type="bearer",
        user=UserInfo(id=user.id, email=user.email, full_name=user.full_name),
        active_organization_id=org.id,
        active_role=UserRole.ADMIN.value,
        memberships=[
            OrgMembershipInfo(
                organization_id=org.id,
                organization_name=org.name,
                organization_slug=org.slug,
                role=UserRole.ADMIN.value,
            )
        ],
    )


@router.post("/login", response_model=AuthTokenResponse)
def login(
    payload: UserLoginRequest,
    db: Session = Depends(get_db),
):
    """
    Authenticates a user via email and password.
    Returns access token along with all authorized organizations and roles.
    """
    clean_email = payload.email.strip().lower()
    user = db.query(User).filter(User.email == clean_email, User.is_active == True).first()
    if not user or not user.hashed_password:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password.",
        )

    if not verify_password(payload.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password.",
        )

    # Retrieve user memberships
    memberships = (
        db.query(Membership, Organization)
        .join(Organization, Membership.organization_id == Organization.id)
        .filter(Membership.user_id == user.id, Organization.is_active == True)
        .all()
    )

    if not memberships:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User does not have active membership in any organization. Please accept an invitation or register a company.",
        )

    first_membership, first_org = memberships[0]
    org_list = [
        OrgMembershipInfo(
            organization_id=org.id,
            organization_name=org.name,
            organization_slug=org.slug,
            role=m.role,
        )
        for m, org in memberships
    ]

    token = create_access_token({"sub": user.id, "email": user.email, "org_id": first_org.id})

    return AuthTokenResponse(
        access_token=token,
        token_type="bearer",
        user=UserInfo(id=user.id, email=user.email, full_name=user.full_name),
        active_organization_id=first_org.id,
        active_role=first_membership.role,
        memberships=org_list,
    )


@router.get("/me", response_model=CurrentUserResponse)
def get_current_user_profile(
    auth: AuthContext = Depends(get_current_auth_context),
    db: Session = Depends(get_db),
):
    """
    Returns current authenticated identity and all authorized workspaces.
    """
    user = db.query(User).filter(User.id == auth.user_id).first()
    if not user:
        # Fallback if in development stub mode
        return CurrentUserResponse(
            user=UserInfo(id=auth.user_id, email=auth.email or "user@inkloom.internal", full_name=auth.full_name or "Local User"),
            active_organization_id=auth.organization_id,
            active_role=auth.roles[0].value if auth.roles else UserRole.CREATOR.value,
            memberships=[
                OrgMembershipInfo(
                    organization_id=auth.organization_id,
                    organization_name="Current Workspace",
                    organization_slug="current-workspace",
                    role=auth.roles[0].value if auth.roles else UserRole.CREATOR.value,
                )
            ],
        )

    memberships = (
        db.query(Membership, Organization)
        .join(Organization, Membership.organization_id == Organization.id)
        .filter(Membership.user_id == user.id, Organization.is_active == True)
        .all()
    )

    org_list = [
        OrgMembershipInfo(
            organization_id=org.id,
            organization_name=org.name,
            organization_slug=org.slug,
            role=m.role,
        )
        for m, org in memberships
    ]

    active_role = auth.roles[0].value if auth.roles else UserRole.MARKETING.value

    return CurrentUserResponse(
        user=UserInfo(id=user.id, email=user.email, full_name=user.full_name),
        active_organization_id=auth.organization_id,
        active_role=active_role,
        memberships=org_list,
    )
