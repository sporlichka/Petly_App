"""add_firebase_fields_to_user

Revision ID: 04bb9854bb6e
Revises: 33af8a3e7f3d
Create Date: 2025-07-16 11:28:15.358527

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = '04bb9854bb6e'
down_revision: Union[str, Sequence[str], None] = '33af8a3e7f3d'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.add_column('users', sa.Column('firebase_uid', sa.String(), nullable=True))
    op.add_column('users', sa.Column('full_name', sa.String(), nullable=True))
    op.add_column('users', sa.Column('is_active', sa.Boolean(), nullable=True))
    op.add_column('users', sa.Column('email_verified', sa.Boolean(), nullable=True))
    op.add_column('users', sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True))
    op.alter_column('users', 'hashed_password',
               existing_type=sa.VARCHAR(),
               nullable=True)
    op.create_index(op.f('ix_users_firebase_uid'), 'users', ['firebase_uid'], unique=True)

    # Обновляем существующих пользователей (legacy users)
    op.execute("UPDATE users SET is_active = TRUE WHERE is_active IS NULL")
    op.execute("UPDATE users SET email_verified = TRUE WHERE email_verified IS NULL")
    op.execute("UPDATE users SET updated_at = created_at WHERE updated_at IS NULL")


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_index(op.f('ix_users_firebase_uid'), table_name='users')
    # Исправляем NULL значения в hashed_password перед тем как сделать поле NOT NULL
    op.execute("UPDATE users SET hashed_password = 'legacy_password_hash' WHERE hashed_password IS NULL")
    op.alter_column('users', 'hashed_password',
               existing_type=sa.VARCHAR(),
               nullable=False)
    op.drop_column('users', 'updated_at')
    op.drop_column('users', 'is_active')
    op.drop_column('users', 'email_verified')
    op.drop_column('users', 'full_name')
    op.drop_column('users', 'firebase_uid')
