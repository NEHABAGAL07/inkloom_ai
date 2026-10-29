import uuid
from sqlalchemy import Column, String, ForeignKey, JSON
from sqlalchemy.orm import relationship
from app.models.base_model import TimestampedModel


class CampaignAdaptation(TimestampedModel):
    __tablename__ = "campaign_adaptations"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    organization_id = Column(String(36), ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False, index=True)
    source_content_id = Column(String(36), ForeignKey("content_submissions.id", ondelete="CASCADE"), nullable=False, index=True)
    platform = Column(String(50), nullable=False, index=True)  # instagram, linkedin, youtube, website
    content = Column(JSON, nullable=False)  # structured variant text content
    
    # Workflow status: draft, submitted, approved, rejected
    status = Column(String(50), default="draft", nullable=False, index=True)
    mode = Column(String(50), default="rule_based", nullable=False)  # llm, rule_based
    
    # Audit & Brand Check results
    audit_result = Column(JSON, nullable=True)  # full AuditResult dictionary
    brand_check = Column(String(50), default="passed", nullable=False)  # passed, flagged
    brand_check_details = Column(JSON, nullable=True)  # details on preserved/missing facts
    
    created_by = Column(String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)

    # Relationships
    source_submission = relationship("ContentSubmission", foreign_keys=[source_content_id], backref="adaptations")
    creator = relationship("User", foreign_keys=[created_by])
    organization = relationship("Organization")

