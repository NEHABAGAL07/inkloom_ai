"""Add phase 2 audit finding fields

Revision ID: 006_add_phase2_fields_to_audit_findings
Revises: 005_add_responsible_owner_to_knowledge_items
Create Date: 2026-10-28 20:45:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '006_add_phase2_fields_to_audit_findings'
down_revision = '005_add_responsible_owner_to_knowledge_items'
branch_labels = None
depends_on = None


def upgrade() -> None:
    with op.batch_alter_table('audit_findings', schema=None) as batch_op:
        batch_op.add_column(sa.Column('rule_reference', sa.String(length=255), nullable=True))
        batch_op.add_column(sa.Column('evidence_status', sa.String(length=50), nullable=True))
        batch_op.add_column(sa.Column('jurisdiction', sa.String(length=100), nullable=True))
        batch_op.add_column(sa.Column('details', sa.JSON(), nullable=True))


def downgrade() -> None:
    with op.batch_alter_table('audit_findings', schema=None) as batch_op:
        batch_op.drop_column('details')
        batch_op.drop_column('jurisdiction')
        batch_op.drop_column('evidence_status')
        batch_op.drop_column('rule_reference')
