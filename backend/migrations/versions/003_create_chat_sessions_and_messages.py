"""Create chat_sessions and chat_messages tables for Brand Guideline Assistant

Revision ID: 003_create_chat_sessions_and_messages
Revises: 002_create_knowledge_documents_and_chunks
Create Date: 2026-10-26 02:22:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '003_create_chat_sessions_and_messages'
down_revision = '002_create_knowledge_documents_and_chunks'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        'chat_sessions',
        sa.Column('id', sa.String(length=36), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('organization_id', sa.String(length=36), nullable=False),
        sa.Column('user_id', sa.String(length=36), nullable=False),
        sa.Column('title', sa.String(length=255), nullable=False, server_default='Brand Assistant Inquiry'),
        sa.ForeignKeyConstraint(['organization_id'], ['organizations.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_chat_sessions_organization_id'), 'chat_sessions', ['organization_id'], unique=False)
    op.create_index(op.f('ix_chat_sessions_user_id'), 'chat_sessions', ['user_id'], unique=False)

    op.create_table(
        'chat_messages',
        sa.Column('id', sa.String(length=36), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('session_id', sa.String(length=36), nullable=False),
        sa.Column('role', sa.String(length=32), nullable=False),
        sa.Column('content', sa.Text(), nullable=False),
        sa.Column('citations', sa.JSON(), nullable=True),
        sa.Column('confidence', sa.String(length=32), nullable=False, server_default='medium'),
        sa.Column('feedback', sa.JSON(), nullable=True),
        sa.ForeignKeyConstraint(['session_id'], ['chat_sessions.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_chat_messages_session_id'), 'chat_messages', ['session_id'], unique=False)


def downgrade() -> None:
    op.drop_index(op.f('ix_chat_messages_session_id'), table_name='chat_messages')
    op.drop_table('chat_messages')

    op.drop_index(op.f('ix_chat_sessions_user_id'), table_name='chat_sessions')
    op.drop_index(op.f('ix_chat_sessions_organization_id'), table_name='chat_sessions')
    op.drop_table('chat_sessions')
