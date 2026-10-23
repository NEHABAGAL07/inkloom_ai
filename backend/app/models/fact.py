"""Verified Fact and Knowledge Source Database Model."""

from sqlalchemy import Column, String, Boolean, Text
from app.database.base import Base, TimestampMixin, TenantMixin, generate_uuid


class VerifiedFact(Base, TimestampMixin, TenantMixin):
    """Certified facts and claims used as knowledge sources for brand claim verification."""
    __tablename__ = "verified_facts"

    id = Column(String(64), primary_key=True, default=generate_uuid)
    statement = Column(Text, nullable=False)
    category = Column(String(64), default="general", nullable=False)  # market_metric, certification, product_spec, financial
    source_document = Column(String(500), nullable=True)  # e.g., "Annual Report 2026, Section 4"
    is_active = Column(Boolean, default=True, nullable=False)
