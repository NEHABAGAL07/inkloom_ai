from sqlalchemy import Column, String, Text, Boolean, ForeignKey, JSON
from sqlalchemy.orm import relationship
from app.models.base_model import TimestampedModel


class ApprovedAsset(TimestampedModel):
    __tablename__ = "approved_assets"

    organization_id = Column(String(36), ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False, index=True)
    name = Column(String(255), nullable=False)
    asset_type = Column(String(50), nullable=False, index=True)  # logo, color_palette, typography, verified_claim, boilerplate
    file_path = Column(String(512), nullable=True)
    file_url = Column(String(512), nullable=True)
    specifications = Column(JSON, nullable=False, default=dict)  # e.g., hex codes, min padding, allowed variants
    is_active = Column(Boolean, default=True, nullable=False)

    organization = relationship("Organization", back_populates="assets")
