"""Create knowledge_items table for shared intelligence foundation

Revision ID: 001_create_knowledge_items
Revises: 
Create Date: 2026-10-24 18:48:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '001_create_knowledge_items'
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        'knowledge_items',
        sa.Column('id', sa.String(length=36), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('organization_id', sa.String(length=36), nullable=False),
        sa.Column('source_type', sa.String(length=50), nullable=False),
        sa.Column('category', sa.String(length=50), nullable=False),
        sa.Column('title', sa.String(length=255), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('content_payload', sa.JSON(), nullable=False),
        sa.Column('source_reference', sa.String(length=512), nullable=True),
        sa.Column('source_url', sa.String(length=512), nullable=True),
        sa.Column('jurisdiction', sa.String(length=100), nullable=False, server_default='Global'),
        sa.Column('industry', sa.String(length=100), nullable=False, server_default='General'),
        sa.Column('content_channels', sa.JSON(), nullable=True),
        sa.Column('publication_date', sa.DateTime(timezone=True), nullable=True),
        sa.Column('effective_date', sa.DateTime(timezone=True), nullable=True),
        sa.Column('review_date', sa.DateTime(timezone=True), nullable=True),
        sa.Column('version', sa.String(length=50), nullable=False, server_default='1.0.0'),
        sa.Column('verification_status', sa.String(length=50), nullable=False, server_default='unverified'),
        sa.Column('evidence_status', sa.String(length=50), nullable=False, server_default='unavailable'),
        sa.Column('rule_type', sa.String(length=50), nullable=False, server_default='brand_standard'),
        sa.Column('priority_level', sa.Integer(), nullable=False, server_default='3'),
        sa.Column('authoritative_source', sa.String(length=255), nullable=True),
        sa.Column('verified_by', sa.String(length=255), nullable=True),
        sa.Column('verified_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('verification_rationale', sa.Text(), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default='1'),
        sa.Column('tags', sa.JSON(), nullable=True),
        sa.ForeignKeyConstraint(['organization_id'], ['organizations.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_knowledge_items_organization_id'), 'knowledge_items', ['organization_id'], unique=False)
    op.create_index(op.f('ix_knowledge_items_source_type'), 'knowledge_items', ['source_type'], unique=False)
    op.create_index(op.f('ix_knowledge_items_category'), 'knowledge_items', ['category'], unique=False)
    op.create_index(op.f('ix_knowledge_items_jurisdiction'), 'knowledge_items', ['jurisdiction'], unique=False)
    op.create_index(op.f('ix_knowledge_items_industry'), 'knowledge_items', ['industry'], unique=False)
    op.create_index(op.f('ix_knowledge_items_verification_status'), 'knowledge_items', ['verification_status'], unique=False)
    op.create_index(op.f('ix_knowledge_items_evidence_status'), 'knowledge_items', ['evidence_status'], unique=False)
    op.create_index(op.f('ix_knowledge_items_rule_type'), 'knowledge_items', ['rule_type'], unique=False)
    op.create_index(op.f('ix_knowledge_items_priority_level'), 'knowledge_items', ['priority_level'], unique=False)
    op.create_index(op.f('ix_knowledge_items_is_active'), 'knowledge_items', ['is_active'], unique=False)


def downgrade() -> None:
    op.drop_index(op.f('ix_knowledge_items_is_active'), table_name='knowledge_items')
    op.drop_index(op.f('ix_knowledge_items_priority_level'), table_name='knowledge_items')
    op.drop_index(op.f('ix_knowledge_items_rule_type'), table_name='knowledge_items')
    op.drop_index(op.f('ix_knowledge_items_evidence_status'), table_name='knowledge_items')
    op.drop_index(op.f('ix_knowledge_items_verification_status'), table_name='knowledge_items')
    op.drop_index(op.f('ix_knowledge_items_industry'), table_name='knowledge_items')
    op.drop_index(op.f('ix_knowledge_items_jurisdiction'), table_name='knowledge_items')
    op.drop_index(op.f('ix_knowledge_items_category'), table_name='knowledge_items')
    op.drop_index(op.f('ix_knowledge_items_source_type'), table_name='knowledge_items')
    op.drop_index(op.f('ix_knowledge_items_organization_id'), table_name='knowledge_items')
    op.drop_table('knowledge_items')
