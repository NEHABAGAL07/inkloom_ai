"""Audit Results and Findings Database Models."""

from sqlalchemy import Column, String, Integer, Float, Boolean, ForeignKey, JSON, Text
from sqlalchemy.orm import relationship
from app.database.base import Base, TimestampMixin, TenantMixin, generate_uuid


class AuditResultModel(Base, TimestampMixin, TenantMixin):
    """Database entity persisting audit executions."""
    __tablename__ = "audit_results"

    id = Column(String(64), primary_key=True, default=generate_uuid)
    content_id = Column(String(64), ForeignKey("content_submissions.id", ondelete="CASCADE"), nullable=False, index=True)
    revision_id = Column(String(64), ForeignKey("content_revisions.id", ondelete="CASCADE"), nullable=False, index=True)
    schema_version = Column(String(16), default="1.0.0", nullable=False)
    overall_status = Column(String(32), nullable=False)  # passed, failed, warning, needs_human_review
    summary = Column(Text, nullable=False)
    engine_metadata = Column(JSON, default=dict)

    revision = relationship("ContentRevision", back_populates="audits")
    findings = relationship("FindingModel", back_populates="audit", cascade="all, delete-orphan")


class FindingModel(Base, TimestampMixin):
    """Specific governance violation or warning finding."""
    __tablename__ = "audit_findings"

    id = Column(String(64), primary_key=True, default=generate_uuid)
    audit_id = Column(String(64), ForeignKey("audit_results.id", ondelete="CASCADE"), nullable=False, index=True)
    category = Column(String(64), nullable=False)
    severity = Column(String(32), nullable=False)
    title = Column(String(255), nullable=False)
    message = Column(Text, nullable=False)
    evidence = Column(Text, nullable=True)
    source_reference = Column(String(500), nullable=True)
    confidence = Column(Float, nullable=False)
    suggested_correction = Column(Text, nullable=True)
    status = Column(String(32), default="flagged", nullable=False)  # flagged, accepted, dismissed, escalated
    location_data = Column(JSON, nullable=True)
    requires_human_review = Column(Boolean, default=True, nullable=False)

    audit = relationship("AuditResultModel", back_populates="findings")
