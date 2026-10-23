from typing import Optional, List
from datetime import datetime
from pydantic import BaseModel


class OrganizationCreateRequest(BaseModel):
    name: str
    industry: Optional[str] = None
    description: Optional[str] = None
    website: Optional[str] = None


class OrganizationUpdateRequest(BaseModel):
    name: Optional[str] = None
    industry: Optional[str] = None
    description: Optional[str] = None
    website: Optional[str] = None


class OrganizationResponse(BaseModel):
    id: str
    name: str
    slug: str
    industry: Optional[str] = None
    description: Optional[str] = None
    website: Optional[str] = None
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True


class MemberInfoResponse(BaseModel):
    user_id: str
    email: str
    full_name: Optional[str] = None
    role: str
    joined_at: datetime


class MemberRoleUpdateRequest(BaseModel):
    role: str


class InvitationCreateRequest(BaseModel):
    email: str
    role: str  # admin, designer, compliance_officer, marketing


class InvitationResponse(BaseModel):
    id: str
    email: str
    role: str
    token: str
    invite_url: str
    expires_at: datetime
    is_revoked: bool
    created_at: datetime


class PublicInvitationInfo(BaseModel):
    token: str
    email: str
    role: str
    organization_id: str
    organization_name: str
    is_valid: bool
    expires_at: datetime
