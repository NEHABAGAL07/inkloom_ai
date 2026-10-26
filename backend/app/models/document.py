"""
Document Intelligence Models for Brand Governance Chatbot
Captures uploaded brand manuals, style guides, policy documents, and their indexed text chunks.
Strictly isolated by organization_id with cascading chunk deletion.
"""
from sqlalchemy import Column, String, Text, Boolean, Integer, ForeignKey
from sqlalchemy.orm import relationship
from app.models.base_model import TimestampedModel


class KnowledgeDocument(TimestampedModel):
    __tablename__ = "knowledge_documents"

    organization_id = Column(
        String(36),
        ForeignKey("organizations.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    filename = Column(String(255), nullable=False)
    mime_type = Column(String(100), nullable=False)
    file_size_bytes = Column(Integer, default=0, nullable=False)

    # Ingestion status: 'processing', 'ready', 'failed'
    status = Column(String(50), default="processing", nullable=False, index=True)
    page_count = Column(Integer, default=0, nullable=False)
    uploaded_by = Column(String(255), nullable=True)  # User ID or email of uploader
    error_message = Column(Text, nullable=True)
    has_ocr_warning = Column(Boolean, default=False, nullable=False)

    organization = relationship("Organization", back_populates="knowledge_documents")
    chunks = relationship(
        "DocumentChunk",
        back_populates="document",
        cascade="all, delete-orphan",
    )


class DocumentChunk(TimestampedModel):
    __tablename__ = "document_chunks"

    document_id = Column(
        String(36),
        ForeignKey("knowledge_documents.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    organization_id = Column(
        String(36),
        ForeignKey("organizations.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    page_number = Column(Integer, default=1, nullable=False)
    chunk_index = Column(Integer, default=0, nullable=False)
    text = Column(Text, nullable=False)
    token_count = Column(Integer, default=0, nullable=False)

    document = relationship("KnowledgeDocument", back_populates="chunks")
