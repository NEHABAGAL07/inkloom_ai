from typing import List, Optional
from datetime import datetime
from pydantic import BaseModel, EmailStr


class UserInfo(BaseModel):
    id: str
    email: str
    full_name: Optional[str] = None


class OrgMembershipInfo(BaseModel):
    organization_id: str
    organization_name: str
    organization_slug: str
    role: str


class UserRegisterRequest(BaseModel):
    email: str
    password: str
    full_name: str
    organization_name: str
    industry: Optional[str] = None


class UserLoginRequest(BaseModel):
    email: str
    password: str


class AuthTokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserInfo
    active_organization_id: str
    active_role: str
    memberships: List[OrgMembershipInfo]


class AcceptInvitationRequest(BaseModel):
    token: str
    full_name: str
    password: str


class CurrentUserResponse(BaseModel):
    user: UserInfo
    active_organization_id: str
    active_role: str
    memberships: List[OrgMembershipInfo]
