"""Create media_items table for persistent designer and admin media storage

Revision ID: 007_create_media_items
Revises: 006_add_phase2_fields_to_audit_findings
Create Date: 2026-10-30 16:51:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '007_create_media_items'
down_revision = '006_add_phase2_fields_to_audit_findings'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Use inspect to avoid re-creating table if it already exists
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    tables = inspector.get_table_names()

    if 'media_items' not in tables:
        op.create_table(
            'media_items',
            sa.Column('id', sa.String(length=36), primary_key=True),
            sa.Column('organization_id', sa.String(length=36), sa.ForeignKey('organizations.id', ondelete='CASCADE'), nullable=False),
            sa.Column('campaign_id', sa.String(length=36), sa.ForeignKey('campaigns.id', ondelete='SET NULL'), nullable=True),
            sa.Column('submission_id', sa.String(length=36), sa.ForeignKey('content_submissions.id', ondelete='SET NULL'), nullable=True),
            sa.Column('original_filename', sa.String(length=255), nullable=False),
            sa.Column('stored_filename', sa.String(length=255), nullable=False),
            sa.Column('file_path', sa.String(length=512), nullable=False),
            sa.Column('file_type', sa.String(length=50), nullable=False, server_default='image'),
            sa.Column('mime_type', sa.String(length=100), nullable=False),
            sa.Column('file_size', sa.Integer(), nullable=False),
            sa.Column('uploaded_by', sa.String(length=255), nullable=True),
            sa.Column('description', sa.Text(), nullable=True),
            sa.Column('status', sa.String(length=50), nullable=False, server_default='active'),
            sa.Column('extra_metadata', sa.JSON(), nullable=True),
            sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
            sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
        )
        op.create_index('ix_media_items_organization_id', 'media_items', ['organization_id'])
        op.create_index('ix_media_items_campaign_id', 'media_items', ['campaign_id'])
        op.create_index('ix_media_items_submission_id', 'media_items', ['submission_id'])
        op.create_index('ix_media_items_status', 'media_items', ['status'])


def downgrade() -> None:
    op.drop_table('media_items')
