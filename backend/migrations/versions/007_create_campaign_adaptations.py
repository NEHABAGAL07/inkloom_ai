"""Create campaign_adaptations table and add source_content_id to content_submissions

Revision ID: 007_create_campaign_adaptations
Revises: 006_add_phase2_fields_to_audit_findings
Create Date: 2026-10-29 01:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '007_create_campaign_adaptations'
down_revision = '006_add_phase2_fields_to_audit_findings'
branch_labels = None
depends_on = None


def upgrade() -> None:
    bind = op.get_bind()
    insp = sa.inspect(bind)
    tables = insp.get_table_names()
    
    # 1. Add source_content_id to content_submissions if table exists and column is not present
    if 'content_submissions' in tables:
        cols = [c['name'] for c in insp.get_columns('content_submissions')]
        if 'source_content_id' not in cols:
            with op.batch_alter_table('content_submissions', schema=None) as batch_op:
                batch_op.add_column(
                    sa.Column('source_content_id', sa.String(length=36), nullable=True)
                )
                batch_op.create_index('ix_content_submissions_source_content_id', ['source_content_id'], unique=False)

    # 2. Create campaign_adaptations table if not present
    if 'campaign_adaptations' not in tables:
        op.create_table(
            'campaign_adaptations',
            sa.Column('id', sa.String(length=36), primary_key=True, nullable=False),
            sa.Column('organization_id', sa.String(length=36), nullable=False),
            sa.Column('source_content_id', sa.String(length=36), nullable=False),
            sa.Column('platform', sa.String(length=50), nullable=False),
            sa.Column('content', sa.JSON(), nullable=False),
            sa.Column('status', sa.String(length=50), server_default='draft', nullable=False),
            sa.Column('mode', sa.String(length=50), server_default='rule_based', nullable=False),
            sa.Column('audit_result', sa.JSON(), nullable=True),
            sa.Column('brand_check', sa.String(length=50), server_default='passed', nullable=False),
            sa.Column('brand_check_details', sa.JSON(), nullable=True),
            sa.Column('created_by', sa.String(length=36), nullable=True),
            sa.Column('created_at', sa.DateTime(), nullable=True),
            sa.Column('updated_at', sa.DateTime(), nullable=True),
            sa.ForeignKeyConstraint(['organization_id'], ['organizations.id'], ondelete='CASCADE'),
            sa.ForeignKeyConstraint(['source_content_id'], ['content_submissions.id'], ondelete='CASCADE'),
            sa.ForeignKeyConstraint(['created_by'], ['users.id'], ondelete='SET NULL'),
        )
        op.create_index('ix_campaign_adaptations_organization_id', 'campaign_adaptations', ['organization_id'], unique=False)
        op.create_index('ix_campaign_adaptations_source_content_id', 'campaign_adaptations', ['source_content_id'], unique=False)
        op.create_index('ix_campaign_adaptations_platform', 'campaign_adaptations', ['platform'], unique=False)
        op.create_index('ix_campaign_adaptations_status', 'campaign_adaptations', ['status'], unique=False)
        op.create_index('ix_campaign_adaptations_created_by', 'campaign_adaptations', ['created_by'], unique=False)


def downgrade() -> None:
    bind = op.get_bind()
    insp = sa.inspect(bind)
    tables = insp.get_table_names()
    
    if 'campaign_adaptations' in tables:
        op.drop_index('ix_campaign_adaptations_created_by', table_name='campaign_adaptations')
        op.drop_index('ix_campaign_adaptations_status', table_name='campaign_adaptations')
        op.drop_index('ix_campaign_adaptations_platform', table_name='campaign_adaptations')
        op.drop_index('ix_campaign_adaptations_source_content_id', table_name='campaign_adaptations')
        op.drop_index('ix_campaign_adaptations_organization_id', table_name='campaign_adaptations')
        op.drop_table('campaign_adaptations')

    cols = [c['name'] for c in insp.get_columns('content_submissions')]
    if 'source_content_id' in cols:
        with op.batch_alter_table('content_submissions', schema=None) as batch_op:
            batch_op.drop_index('ix_content_submissions_source_content_id')
            batch_op.drop_column('source_content_id')
