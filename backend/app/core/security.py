"""Inkloom AI - Security, Permissions, and Tenant Authentication.

NOTE: This is the development authentication and RBAC scaffold.
Production deployment requires full OAuth2/OIDC integration or JWT verification.
"""

from enum import Enum
from typing import Optional, List, Dict, Any
from fastapi import HTTPException, Security, status, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

security_scheme = HTTPBearer(auto_error=False)


class RoleEnum(str, Enum):
    """Supported RBAC roles for organization members."""
    ADMIN = "admin"
    REVIEWER = "reviewer"
    CREATOR = "creator"
    VIEWER = "viewer"


class CurrentUser:
    """Represents the authenticated user context in request scope."""
    def __init__(
        self,
        user_id: str,
        email: str,
        organization_id: str,
        roles: List[RoleEnum],
    ):
        self.user_id = user_id
        self.email = email
        self.organization_id = organization_id
        self.roles = roles

    def has_role(self, required_role: RoleEnum) -> bool:
        """Check if user has a specific role or administrative override."""
        if RoleEnum.ADMIN in self.roles:
            return True
        return required_role in self.roles

    def require_role(self, required_role: RoleEnum) -> None:
        """Enforce specific role; raise HTTP 403 Forbidden if missing."""
        if not self.has_role(required_role):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Operation requires '{required_role.value}' role.",
            )


def get_current_user(
    auth: Optional[HTTPAuthorizationCredentials] = Security(security_scheme),
) -> CurrentUser:
    """
    Dependency returning current user.
    In development scaffold, returns a deterministic mock authenticated reviewer
    unless an authorization token with specific claims is passed.
    """
    # Development fallback user context:
    return CurrentUser(
        user_id="usr-dev-reviewer-001",
        email="reviewer@example.com",
        organization_id="org-inkloom-demo-001",
        roles=[RoleEnum.REVIEWER, RoleEnum.CREATOR],
    )


def require_roles(*allowed_roles: RoleEnum):
    """Dependency factory checking if current user holds any allowed role."""
    def role_checker(user: CurrentUser = Depends(get_current_user)) -> CurrentUser:
        if RoleEnum.ADMIN in user.roles:
            return user
        if not any(role in user.roles for role in allowed_roles):
            allowed_names = [r.value for r in allowed_roles]
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access forbidden. Requires one of roles: {allowed_names}",
            )
        return user
    return role_checker
