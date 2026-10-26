"""Create knowledge_documents and document_chunks tables for Document Intelligence

Revision ID: 002_create_knowledge_documents_and_chunks
Revises: 001_create_knowledge_items
Create Date: 2026-10-26 02:15:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '002_create_knowledge_documents_and_chunks'
down_revision = '001_create_knowledge_items'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        'knowledge_documents',
        sa.Column('id', sa.String(length=36), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('organization_id', sa.String(length=36), nullable=False),
        sa.Column('filename', sa.String(length=255), nullable=False),
        sa.Column('mime_type', sa.String(length=100), nullable=False),
        sa.Column('file_size_bytes', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('status', sa.String(length=50), nullable=False, server_default='processing'),
        sa.Column('page_count', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('uploaded_by', sa.String(length=255), nullable=True),
        sa.Column('error_message', sa.Text(), nullable=True),
        sa.Column('has_ocr_warning', sa.Boolean(), nullable=False, server_default='0'),
        sa.ForeignKeyConstraint(['organization_id'], ['organizations.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_knowledge_documents_organization_id'), 'knowledge_documents', ['organization_id'], unique=False)
    op.create_index(op.f('ix_knowledge_documents_status'), 'knowledge_documents', ['status'], unique=False)

    op.create_table(
        'document_chunks',
        sa.Column('id', sa.String(length=36), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('document_id', sa.String(length=36), nullable=False),
        sa.Column('organization_id', sa.String(length=36), nullable=False),
        sa.Column('page_number', sa.Integer(), nullable=False, server_default='1'),
        sa.Column('chunk_index', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('text', sa.Text(), nullable=False),
        sa.Column('token_count', sa.Integer(), nullable=False, server_default='0'),
        sa.ForeignKeyConstraint(['document_id'], ['knowledge_documents.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['organization_id'], ['organizations.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_document_chunks_document_id'), 'document_chunks', ['document_id'], unique=False)
    op.create_index(op.f('ix_document_chunks_organization_id'), 'document_chunks', ['organization_id'], unique=False)


def downgrade() -> None:
    op.drop_index(op.f('ix_document_chunks_organization_id'), table_name='document_chunks')
    op.drop_index(op.f('ix_document_chunks_document_id'), table_name='document_chunks')
    op.drop_table('document_chunks')

    op.drop_index(op.f('ix_knowledge_documents_status'), table_name='knowledge_documents')
    op.drop_index(op.f('ix_knowledge_documents_organization_id'), table_name='knowledge_documents')
    op.drop_table('knowledge_documents')
