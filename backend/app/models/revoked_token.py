from datetime import datetime, timezone
from sqlalchemy import Column, String, DateTime
from app.models.base_model import TimestampedModel


class RevokedToken(TimestampedModel):
    """
    Stores revoked JWT access tokens for server-side session invalidation.
    Tokens are stored as SHA-256 hashes to prevent raw token exposure.
    """
    __tablename__ = "revoked_tokens"

    token_hash = Column(String(64), unique=True, index=True, nullable=False)
    user_id = Column(String(36), index=True, nullable=True)
    expires_at = Column(DateTime(timezone=True), nullable=False)
    reason = Column(String(100), default="user_logout", nullable=False)
