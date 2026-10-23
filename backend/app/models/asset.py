"""Approved Brand Asset Model."""

from sqlalchemy import Column, String, Boolean, JSON
from app.database.base import Base, TimestampMixin, TenantMixin, generate_uuid


class ApprovedAsset(Base, TimestampMixin, TenantMixin):
    """Approved logos, color schemes, certified claim registry entries, fonts."""
    __tablename__ = "approved_assets"

    id = Column(String(64), primary_key=True, default=generate_uuid)
    name = Column(String(255), nullable=False)
    asset_type = Column(String(64), nullable=False)  # logo, color_palette, claim_registry, typography
    file_path = Column(String(1000), nullable=True)
    asset_metadata = Column(JSON, default=dict)  # colors: ["#1A365D"], dimensions, approved_claim_text, etc.
    is_active = Column(Boolean, default=True, nullable=False)
