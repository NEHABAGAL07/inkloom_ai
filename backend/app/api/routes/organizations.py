import re
import secrets
from datetime import datetime, timezone, timedelta
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.core.security import (
    get_current_auth_context,
    require_roles,
    AuthContext,
    UserRole,
)
from app.models import (
    Organization,
    Membership,
    User,
    Invitation,
    AuditEvent,
)
from app.schemas.organization import (
    OrganizationCreateRequest,
    OrganizationUpdateRequest,
    OrganizationResponse,
    MemberInfoResponse,
    MemberRoleUpdateRequest,
    InvitationCreateRequest,
    InvitationResponse,
)

router = APIRouter(prefix="/organizations", tags=["Organization Workspaces & Team"])


def slugify(text: str) -> str:
    slug = re.sub(r"[^\w\s-]", "", text).strip().lower()
    return re.sub(r"[-\s]+", "-", slug)


@router.get("", response_model=List[OrganizationResponse])
def list_user_organizations(
    auth: AuthContext = Depends(get_current_auth_context),
    db: Session = Depends(get_db),
):
    """List all organizations where the authenticated user is a registered member."""
    orgs = (
        db.query(Organization)
        .join(Membership, Membership.organization_id == Organization.id)
        .filter(Membership.user_id == auth.user_id, Organization.is_active == True)
        .all()
    )
    return orgs


@router.post("", response_model=OrganizationResponse, status_code=status.HTTP_201_CREATED)
def create_organization(
    payload: OrganizationCreateRequest,
    auth: AuthContext = Depends(get_current_auth_context),
    db: Session = Depends(get_db),
):
    """Creates a new company workspace. Authenticated user becomes its administrator."""
    base_slug = slugify(payload.name) or "org"
    candidate_slug = base_slug
    counter = 1
    while db.query(Organization).filter(Organization.slug == candidate_slug).first():
        candidate_slug = f"{base_slug}-{counter}"
        counter += 1

    org = Organization(
        name=payload.name.strip(),
        slug=candidate_slug,
        industry=payload.industry,
        description=payload.description,
        website=payload.website,
        is_active=True,
    )
    db.add(org)
    db.flush()

    membership = Membership(
        organization_id=org.id,
        user_id=auth.user_id,
        role=UserRole.ADMIN.value,
    )
    db.add(membership)

    event = AuditEvent(
        organization_id=org.id,
        actor_id=auth.user_id,
        entity_type="organization",
        entity_id=org.id,
        event_type="workspace_created",
        details={"name": org.name},
    )
    db.add(event)
    db.commit()
    db.refresh(org)
    return org


@router.get("/{organization_id}", response_model=OrganizationResponse)
def get_organization_profile(
    organization_id: str,
    auth: AuthContext = Depends(get_current_auth_context),
    db: Session = Depends(get_db),
):
    """Retrieve organization profile (strictly scopes to authorized tenant membership)."""
    membership = (
        db.query(Membership)
        .filter(Membership.user_id == auth.user_id, Membership.organization_id == organization_id)
        .first()
    )
    if not membership:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied: You are not authorized to view this organization workspace.",
        )

    org = db.query(Organization).filter(Organization.id == organization_id).first()
    if not org:
        raise HTTPException(status_code=404, detail="Organization not found.")
    return org


@router.patch("/{organization_id}", response_model=OrganizationResponse)
def update_organization_profile(
    organization_id: str,
    payload: OrganizationUpdateRequest,
    auth: AuthContext = Depends(get_current_auth_context),
    db: Session = Depends(get_db),
):
    """Update organization details (Manager / Organization Admin only)."""
    if auth.organization_id != organization_id or not auth.has_role(UserRole.ADMIN):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only Organization Admins can update company settings.",
        )

    org = db.query(Organization).filter(Organization.id == organization_id).first()
    if not org:
        raise HTTPException(status_code=404, detail="Organization not found.")

    if payload.name is not None:
        org.name = payload.name.strip()
    if payload.industry is not None:
        org.industry = payload.industry.strip()
    if payload.description is not None:
        org.description = payload.description.strip()
    if payload.website is not None:
        org.website = payload.website.strip()

    db.commit()
    db.refresh(org)
    return org


# ---------------------------------------------------------
# Team & Membership Management
# ---------------------------------------------------------
@router.get("/{organization_id}/members", response_model=List[MemberInfoResponse])
def list_organization_members(
    organization_id: str,
    auth: AuthContext = Depends(get_current_auth_context),
    db: Session = Depends(get_db),
):
    """List members and their roles within the organization."""
    if auth.organization_id != organization_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied to tenant members.")

    members = (
        db.query(Membership, User)
        .join(User, Membership.user_id == User.id)
        .filter(Membership.organization_id == organization_id)
        .order_by(Membership.created_at.asc())
        .all()
    )

    return [
        MemberInfoResponse(
            user_id=u.id,
            email=u.email,
            full_name=u.full_name,
            role=m.role,
            joined_at=m.created_at,
        )
        for m, u in members
    ]


@router.patch("/{organization_id}/members/{user_id}", response_model=MemberInfoResponse)
def update_member_role(
    organization_id: str,
    user_id: str,
    payload: MemberRoleUpdateRequest,
    auth: AuthContext = Depends(get_current_auth_context),
    db: Session = Depends(get_db),
):
    """Change employee role (Manager / Organization Admin only)."""
    if auth.organization_id != organization_id or not auth.has_role(UserRole.ADMIN):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only Organization Admins can change roles.")

    membership = (
        db.query(Membership)
        .filter(Membership.organization_id == organization_id, Membership.user_id == user_id)
        .first()
    )
    if not membership:
        raise HTTPException(status_code=404, detail="Member not found in this organization.")

    # Validate target role
    valid_roles = [r.value for r in UserRole]
    if payload.role not in valid_roles:
        raise HTTPException(status_code=400, detail=f"Invalid role. Allowed roles: {valid_roles}")

    # Prevent removing last admin
    if membership.role == UserRole.ADMIN.value and payload.role != UserRole.ADMIN.value:
        admin_count = (
            db.query(Membership)
            .filter(Membership.organization_id == organization_id, Membership.role == UserRole.ADMIN.value)
            .count()
        )
        if admin_count <= 1:
            raise HTTPException(
                status_code=400,
                detail="Cannot demote the sole administrator of the organization.",
            )

    old_role = membership.role
    membership.role = payload.role

    event = AuditEvent(
        organization_id=organization_id,
        actor_id=auth.user_id,
        entity_type="membership",
        entity_id=membership.id,
        event_type="member_role_updated",
        details={"user_id": user_id, "old_role": old_role, "new_role": payload.role},
    )
    db.add(event)
    db.commit()

    user = db.query(User).filter(User.id == user_id).first()
    return MemberInfoResponse(
        user_id=user.id,
        email=user.email,
        full_name=user.full_name,
        role=membership.role,
        joined_at=membership.created_at,
    )


@router.delete("/{organization_id}/members/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
def remove_member(
    organization_id: str,
    user_id: str,
    auth: AuthContext = Depends(get_current_auth_context),
    db: Session = Depends(get_db),
):
    """Remove an employee from the workspace (Manager / Organization Admin only)."""
    if auth.organization_id != organization_id or not auth.has_role(UserRole.ADMIN):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only Organization Admins can remove members.")

    membership = (
        db.query(Membership)
        .filter(Membership.organization_id == organization_id, Membership.user_id == user_id)
        .first()
    )
    if not membership:
        raise HTTPException(status_code=404, detail="Member not found.")

    if membership.role == UserRole.ADMIN.value:
        admin_count = (
            db.query(Membership)
            .filter(Membership.organization_id == organization_id, Membership.role == UserRole.ADMIN.value)
            .count()
        )
        if admin_count <= 1:
            raise HTTPException(status_code=400, detail="Cannot remove the sole administrator of the organization.")

    db.delete(membership)
    db.commit()
    return None


# ---------------------------------------------------------
# Employee Invitations
# ---------------------------------------------------------
@router.post("/{organization_id}/invitations", response_model=InvitationResponse, status_code=status.HTTP_201_CREATED)
def invite_employee(
    organization_id: str,
    payload: InvitationCreateRequest,
    auth: AuthContext = Depends(get_current_auth_context),
    db: Session = Depends(get_db),
):
    """Generate a secure, expiring employee invitation (Manager / Organization Admin only)."""
    if auth.organization_id != organization_id or not auth.has_role(UserRole.ADMIN):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only Organization Admins can invite employees.")

    clean_email = payload.email.strip().lower()

    # Check if already a member
    existing_member = (
        db.query(Membership)
        .join(User, Membership.user_id == User.id)
        .filter(Membership.organization_id == organization_id, User.email == clean_email)
        .first()
    )
    if existing_member:
        raise HTTPException(status_code=409, detail=f"User '{clean_email}' is already an active member.")

    # Validate role
    valid_roles = [r.value for r in UserRole]
    if payload.role not in valid_roles:
        raise HTTPException(status_code=400, detail=f"Invalid role. Allowed roles: {valid_roles}")

    # Generate secure invitation token
    token = secrets.token_urlsafe(32)
    invitation = Invitation(
        organization_id=organization_id,
        email=clean_email,
        role=payload.role,
        token=token,
        invited_by_id=auth.user_id,
        expires_at=datetime.now(timezone.utc) + timedelta(days=7),
    )
    db.add(invitation)
    db.flush()

    event = AuditEvent(
        organization_id=organization_id,
        actor_id=auth.user_id,
        entity_type="invitation",
        entity_id=invitation.id,
        event_type="invitation_created",
        details={"invited_email": clean_email, "role": payload.role},
    )
    db.add(event)
    db.commit()
    db.refresh(invitation)

    invite_url = f"/invite?token={invitation.token}"

    return InvitationResponse(
        id=invitation.id,
        email=invitation.email,
        role=invitation.role,
        token=invitation.token,
        invite_url=invite_url,
        expires_at=invitation.expires_at,
        is_revoked=invitation.is_revoked,
        created_at=invitation.created_at,
    )


@router.get("/{organization_id}/invitations", response_model=List[InvitationResponse])
def list_pending_invitations(
    organization_id: str,
    auth: AuthContext = Depends(get_current_auth_context),
    db: Session = Depends(get_db),
):
    """Lists pending invitations for the organization (Manager / Organization Admin only)."""
    if auth.organization_id != organization_id or not auth.has_role(UserRole.ADMIN):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only Organization Admins can view invitations.")

    invites = (
        db.query(Invitation)
        .filter(
            Invitation.organization_id == organization_id,
            Invitation.accepted_at.is_(None),
            Invitation.is_revoked == False,
        )
        .order_by(Invitation.created_at.desc())
        .all()
    )

    return [
        InvitationResponse(
            id=i.id,
            email=i.email,
            role=i.role,
            token=i.token,
            invite_url=f"/invite?token={i.token}",
            expires_at=i.expires_at,
            is_revoked=i.is_revoked,
            created_at=i.created_at,
        )
        for i in invites
    ]


@router.delete("/{organization_id}/invitations/{invitation_id}", status_code=status.HTTP_204_NO_CONTENT)
def revoke_invitation(
    organization_id: str,
    invitation_id: str,
    auth: AuthContext = Depends(get_current_auth_context),
    db: Session = Depends(get_db),
):
    """Revoke a pending invitation (Manager / Organization Admin only)."""
    if auth.organization_id != organization_id or not auth.has_role(UserRole.ADMIN):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only Organization Admins can revoke invitations.")

    invitation = (
        db.query(Invitation)
        .filter(Invitation.id == invitation_id, Invitation.organization_id == organization_id)
        .first()
    )
    if not invitation:
        raise HTTPException(status_code=404, detail="Invitation not found.")

    invitation.is_revoked = True
    db.commit()
    return None
