"""SQLAlchemy Base and Declarative Mixins."""

from datetime import datetime, timezone
import uuid
from sqlalchemy import Column, String, DateTime
from sqlalchemy.orm import declarative_base, declared_attr

Base = declarative_base()


class TimestampMixin:
    """Provides created_at and updated_at UTC timestamps."""
    created_at = Column(
        DateTime(timezone=True), 
        default=lambda: datetime.now(timezone.utc), 
        nullable=False
    )
    updated_at = Column(
        DateTime(timezone=True), 
        default=lambda: datetime.now(timezone.utc), 
        onupdate=lambda: datetime.now(timezone.utc), 
        nullable=False
    )


class TenantMixin:
    """Enforces organization/tenant scoping on database models."""
    @declared_attr
    def organization_id(cls):
        return Column(String(64), nullable=False, index=True)


def generate_uuid() -> str:
    """Generate cryptographically strong UUID string."""
    return str(uuid.uuid4())
