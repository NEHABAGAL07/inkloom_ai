"""Add responsible_owner column to knowledge_items table

Revision ID: 005_add_responsible_owner_to_knowledge_items
Revises: 004_add_mode_to_chat_messages
Create Date: 2026-10-28 14:35:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '005_add_responsible_owner_to_knowledge_items'
down_revision = '004_add_mode_to_chat_messages'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Use batch_alter_table for cross-database compatibility (SQLite and PostgreSQL)
    with op.batch_alter_table('knowledge_items', schema=None) as batch_op:
        batch_op.add_column(
            sa.Column('responsible_owner', sa.String(length=255), nullable=True)
        )


def downgrade() -> None:
    with op.batch_alter_table('knowledge_items', schema=None) as batch_op:
        batch_op.drop_column('responsible_owner')
