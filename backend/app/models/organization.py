from sqlalchemy import Column, String, Boolean, ForeignKey
from sqlalchemy.orm import relationship
from app.models.base_model import TimestampedModel


class Organization(TimestampedModel):
    __tablename__ = "organizations"

    name = Column(String(255), nullable=False)
    slug = Column(String(100), unique=True, nullable=False, index=True)
    description = Column(String(512), nullable=True)
    industry = Column(String(100), nullable=True)
    website = Column(String(255), nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)

    memberships = relationship("Membership", back_populates="organization", cascade="all, delete-orphan")
    invitations = relationship("Invitation", back_populates="organization", cascade="all, delete-orphan")
    guidelines = relationship("BrandGuideline", back_populates="organization", cascade="all, delete-orphan")
    assets = relationship("ApprovedAsset", back_populates="organization", cascade="all, delete-orphan")
    submissions = relationship("ContentSubmission", back_populates="organization", cascade="all, delete-orphan")
    knowledge_items = relationship("KnowledgeItem", back_populates="organization", cascade="all, delete-orphan")
    knowledge_documents = relationship("KnowledgeDocument", back_populates="organization", cascade="all, delete-orphan")
    media_items = relationship("MediaItem", back_populates="organization", cascade="all, delete-orphan")


class Membership(TimestampedModel):
    __tablename__ = "memberships"

    organization_id = Column(String(36), ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    role = Column(String(50), default="creator", nullable=False)  # admin, compliance_officer, reviewer, creator, viewer

    organization = relationship("Organization", back_populates="memberships")
    user = relationship("User", back_populates="memberships")
