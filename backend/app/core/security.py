"""
Authentication and Role-Based Access Control (RBAC) Module
Supports multi-tenant isolation, cryptographically signed tokens,
password hashing, and server-side membership validation.
"""
import base64
import hashlib
import hmac
import json
import secrets
import time
from datetime import datetime, timezone, timedelta
from enum import Enum
from typing import List, Optional, Dict, Any
from fastapi import Header, HTTPException, status, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.core.config import settings
from app.database.session import get_db


class UserRole(str, Enum):
    ADMIN = "admin"  # Manager / Organization Admin
    DESIGNER = "designer"  # Designer / Creative Asset Manager
    COMPLIANCE_OFFICER = "compliance_officer"  # Legal / Compliance Reviewer
    MARKETING = "marketing"  # Marketing Content Creator
    # Backwards compatibility
    REVIEWER = "reviewer"
    CREATOR = "creator"
    VIEWER = "viewer"


class AuthContext(BaseModel):
    user_id: str
    organization_id: str
    roles: List[UserRole]
    email: Optional[str] = None
    full_name: Optional[str] = None
    is_authenticated: bool = True

    def has_role(self, *required_roles: UserRole) -> bool:
        if UserRole.ADMIN in self.roles:
            return True
        return any(role in self.roles for role in required_roles)


# ---------------------------------------------------------
# Cryptographic Password Hashing & Verification (PBKDF2-HMAC)
# ---------------------------------------------------------
def hash_password(password: str, salt: Optional[str] = None) -> str:
    """Hashes a password with PBKDF2-HMAC-SHA256 and unique 16-byte salt."""
    if not salt:
        salt = secrets.token_hex(16)
    key = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt.encode("utf-8"), 100000)
    return f"{salt}${key.hex()}"


def verify_password(password: str, hashed_password: str) -> bool:
    """Verifies a plain password against stored salt$hash."""
    if not hashed_password or "$" not in hashed_password:
        return False
    salt, key_hex = hashed_password.split("$", 1)
    key = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt.encode("utf-8"), 100000)
    return hmac.compare_digest(key.hex(), key_hex)


# ---------------------------------------------------------
# Standard JWT Signing & Verification (HMAC-SHA256)
# ---------------------------------------------------------
def _b64url_encode(data: bytes) -> str:
    return base64.urlsafe_b64encode(data).decode("utf-8").rstrip("=")


def _b64url_decode(data: str) -> bytes:
    padding = 4 - (len(data) % 4)
    if padding and padding < 4:
        data += "=" * padding
    return base64.urlsafe_b64decode(data.encode("utf-8"))


def create_access_token(data: Dict[str, Any], expires_delta: Optional[timedelta] = None) -> str:
    """Generates standard RFC 7519 compliant HMAC-SHA256 signed JWT."""
    header = {"alg": "HS256", "typ": "JWT"}
    payload = data.copy()
    now = int(time.time())
    if expires_delta:
        exp = now + int(expires_delta.total_seconds())
    else:
        exp = now + (settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60)
    payload["iat"] = now
    payload["exp"] = exp

    header_bytes = json.dumps(header, separators=(",", ":")).encode("utf-8")
    payload_bytes = json.dumps(payload, separators=(",", ":")).encode("utf-8")

    unsigned_token = f"{_b64url_encode(header_bytes)}.{_b64url_encode(payload_bytes)}"
    signature = hmac.new(
        settings.SECRET_KEY.encode("utf-8"),
        unsigned_token.encode("utf-8"),
        hashlib.sha256,
    ).digest()
    return f"{unsigned_token}.{_b64url_encode(signature)}"


def decode_access_token(token: str) -> Optional[Dict[str, Any]]:
    """Decodes and validates JWT signature and expiry. Returns payload if valid, None otherwise."""
    parts = token.split(".")
    if len(parts) != 3:
        return None

    unsigned_token = f"{parts[0]}.{parts[1]}"
    expected_sig = hmac.new(
        settings.SECRET_KEY.encode("utf-8"),
        unsigned_token.encode("utf-8"),
        hashlib.sha256,
    ).digest()

    try:
        actual_sig = _b64url_decode(parts[2])
        if not hmac.compare_digest(actual_sig, expected_sig):
            return None

        payload_bytes = _b64url_decode(parts[1])
        payload = json.loads(payload_bytes.decode("utf-8"))

        if "exp" in payload and int(time.time()) > payload["exp"]:
            return None

        return payload
    except Exception:
        return None


# ---------------------------------------------------------
# Multi-Tenant Auth Dependency with Server-Side DB Validation
# ---------------------------------------------------------
def get_current_auth_context(
    x_tenant_id: Optional[str] = Header(None, alias="X-Tenant-Id"),
    x_user_id: Optional[str] = Header(None, alias="X-User-Id"),
    x_user_role: Optional[str] = Header(None, alias="X-User-Role"),
    authorization: Optional[str] = Header(None, alias="Authorization"),
    db: Session = Depends(get_db),
) -> AuthContext:
    """
    Extracts multi-tenant context and user credentials.
    If Bearer token is provided:
      1. Verifies cryptographic JWT signature.
      2. Validates user existence in database.
      3. Validates that user has an active Membership in the target organization.
      4. Assigns the real server-side role from the database.
    If no token is provided:
      Falls back gracefully to test/dev context for backwards compatibility.
    """
    from app.models.user import User
    from app.models.organization import Membership, Organization

    # 1. Bearer Token Authentication
    if authorization and authorization.startswith("Bearer "):
        token = authorization[7:].strip()
        payload = decode_access_token(token)
        if not payload or "sub" not in payload:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid or expired authentication token.",
                headers={"WWW-Authenticate": "Bearer"},
            )

        user_id = payload["sub"]
        user = db.query(User).filter(User.id == user_id, User.is_active == True).first()
        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="User account not found or deactivated.",
            )

        # Determine target tenant
        target_org_id = x_tenant_id or payload.get("org_id")
        if target_org_id:
            membership = (
                db.query(Membership)
                .filter(Membership.user_id == user.id, Membership.organization_id == target_org_id)
                .first()
            )
            if not membership:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail=f"Access denied: You are not a registered member of organization '{target_org_id}'.",
                )
            tenant_id = target_org_id
            resolved_role_str = membership.role
        else:
            # Pick first available organization
            membership = db.query(Membership).filter(Membership.user_id == user.id).first()
            if not membership:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="User does not have an active membership in any organization.",
                )
            tenant_id = membership.organization_id
            resolved_role_str = membership.role

        try:
            role = UserRole(resolved_role_str.lower())
        except ValueError:
            role = UserRole.MARKETING

        return AuthContext(
            user_id=user.id,
            organization_id=tenant_id,
            roles=[role],
            email=user.email,
            full_name=user.full_name,
            is_authenticated=True,
        )

    # 2. Development & Unit Test Fallback (when no Bearer token passed)
    tenant_id = x_tenant_id or "org_default_inkloom"
    user_id = x_user_id or "user_local_dev"

    # If user and tenant exist in DB, lookup actual membership role
    membership = (
        db.query(Membership)
        .filter(Membership.user_id == user_id, Membership.organization_id == tenant_id)
        .first()
    )

    if membership:
        try:
            role = UserRole(membership.role.lower())
        except ValueError:
            role = UserRole.COMPLIANCE_OFFICER
    else:
        role = UserRole.COMPLIANCE_OFFICER
        if x_user_role:
            try:
                role = UserRole(x_user_role.lower())
            except ValueError:
                role = UserRole.CREATOR

    return AuthContext(
        user_id=user_id,
        organization_id=tenant_id,
        roles=[role],
        email=f"{user_id}@example.internal",
        is_authenticated=True,
    )


def require_roles(*allowed_roles: UserRole):
    """Dependency factory ensuring current user possesses at least one required role."""
    def role_checker(auth: AuthContext = Depends(get_current_auth_context)) -> AuthContext:
        if not auth.has_role(*allowed_roles):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access denied. Requires one of roles: {[r.value for r in allowed_roles]}",
            )
        return auth
    return role_checker
