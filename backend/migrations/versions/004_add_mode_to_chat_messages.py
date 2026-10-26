"""Add mode column to chat_messages table

Revision ID: 004_add_mode_to_chat_messages
Revises: 003_create_chat_sessions_and_messages
Create Date: 2026-10-26 11:15:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '004_add_mode_to_chat_messages'
down_revision = '003_create_chat_sessions_and_messages'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Use batch_alter_table for SQLite compatibility
    with op.batch_alter_table('chat_messages', schema=None) as batch_op:
        batch_op.add_column(
            sa.Column('mode', sa.String(length=32), nullable=True, server_default='extractive')
        )


def downgrade() -> None:
    with op.batch_alter_table('chat_messages', schema=None) as batch_op:
        batch_op.drop_column('mode')
