from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status, Response
from sqlalchemy.orm import Session
from app.core.config import settings

from app.database.session import get_db
from app.core.security import hash_password, verify_password, create_access_token
from app.models import Invitation, Organization, User, Membership, AuditEvent
from app.schemas.organization import PublicInvitationInfo
from app.schemas.auth import AcceptInvitationRequest, AuthTokenResponse, UserInfo, OrgMembershipInfo

router = APIRouter(prefix="/invitations", tags=["Invitations & Acceptance"])


@router.get("/{token}", response_model=PublicInvitationInfo)
def inspect_invitation(token: str, db: Session = Depends(get_db)):
    """Publicly inspects an invitation token before acceptance."""
    invitation = (
        db.query(Invitation)
        .join(Organization, Invitation.organization_id == Organization.id)
        .filter(Invitation.token == token)
        .first()
    )

    if not invitation:
        raise HTTPException(status_code=404, detail="Invitation token not found.")

    now = datetime.now(timezone.utc)
    # Check expiry timezone-aware
    exp = invitation.expires_at
    if exp.tzinfo is None:
        exp = exp.replace(tzinfo=timezone.utc)

    is_valid = (
        not invitation.is_revoked
        and invitation.accepted_at is None
        and exp > now
    )

    return PublicInvitationInfo(
        token=invitation.token,
        email=invitation.email,
        role=invitation.role,
        organization_id=invitation.organization.id,
        organization_name=invitation.organization.name,
        is_valid=is_valid,
        expires_at=invitation.expires_at,
    )


@router.post("/accept", response_model=AuthTokenResponse)
def accept_invitation(
    payload: AcceptInvitationRequest,
    response: Response,
    db: Session = Depends(get_db),
):
    """
    Accepts an employee invitation, registers/authenticates user,
    and assigns the organization membership with the designated role.
    """
    invitation = (
        db.query(Invitation)
        .join(Organization, Invitation.organization_id == Organization.id)
        .filter(Invitation.token == payload.token)
        .first()
    )

    if not invitation:
        raise HTTPException(status_code=404, detail="Invalid invitation token.")

    if invitation.is_revoked:
        raise HTTPException(status_code=400, detail="This invitation has been revoked by the administrator.")

    if invitation.accepted_at is not None:
        raise HTTPException(status_code=400, detail="This invitation has already been accepted.")

    now = datetime.now(timezone.utc)
    exp = invitation.expires_at
    if exp.tzinfo is None:
        exp = exp.replace(tzinfo=timezone.utc)
    if exp <= now:
        raise HTTPException(status_code=400, detail="This invitation link has expired. Please request a new invite.")

    clean_email = invitation.email.strip().lower()

    # Find or create user
    user = db.query(User).filter(User.email == clean_email).first()
    if user:
        # If user already exists, verify password or update password if not set
        if user.hashed_password:
            if not verify_password(payload.password, user.hashed_password):
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="An account with this email already exists, but the provided password was incorrect.",
                )
        else:
            user.hashed_password = hash_password(payload.password)
        if payload.full_name and not user.full_name:
            user.full_name = payload.full_name.strip()
    else:
        user = User(
            email=clean_email,
            full_name=payload.full_name.strip(),
            hashed_password=hash_password(payload.password),
            is_active=True,
        )
        db.add(user)
        db.flush()

    # Check if membership already exists
    existing_membership = (
        db.query(Membership)
        .filter(Membership.organization_id == invitation.organization_id, Membership.user_id == user.id)
        .first()
    )

    if existing_membership:
        existing_membership.role = invitation.role
    else:
        membership = Membership(
            organization_id=invitation.organization_id,
            user_id=user.id,
            role=invitation.role,
        )
        db.add(membership)

    invitation.accepted_at = now

    event = AuditEvent(
        organization_id=invitation.organization_id,
        actor_id=user.id,
        entity_type="membership",
        entity_id=user.id,
        event_type="invitation_accepted",
        details={"email": user.email, "role": invitation.role},
    )
    db.add(event)
    db.commit()

    # Generate token
    token = create_access_token({"sub": user.id, "email": user.email, "org_id": invitation.organization_id})

    # Set secure HttpOnly cookie for session persistence
    response.set_cookie(
        key="inkloom_token",
        value=token,
        httponly=True,
        samesite="lax",
        secure=False,
        max_age=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        path="/",
    )

    # Get all user memberships
    all_memberships = (
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
        for m, org in all_memberships
    ]

    return AuthTokenResponse(
        access_token=token,
        token_type="bearer",
        user=UserInfo(id=user.id, email=user.email, full_name=user.full_name),
        active_organization_id=invitation.organization_id,
        active_role=invitation.role,
        memberships=org_list,
    )
