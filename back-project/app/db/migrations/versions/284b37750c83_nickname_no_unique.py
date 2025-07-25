"""nickname-no-unique

Revision ID: 284b37750c83
Revises: 2349928d828f
Create Date: 2025-07-07 05:34:19.194256

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = '284b37750c83'
down_revision: Union[str, Sequence[str], None] = '2349928d828f'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # ### commands auto generated by Alembic - please adjust! ###
    # Remove FCM token column and index since it's not being used
    op.drop_index(op.f('ix_users_fcm_token'), table_name='users')
    op.drop_column('users', 'fcm_token')
    
    # Drop the unique constraint on username index and recreate it as non-unique
    op.drop_index(op.f('ix_users_username'), table_name='users')
    op.create_index(op.f('ix_users_username'), 'users', ['username'], unique=False)
    # ### end Alembic commands ###


def downgrade() -> None:
    """Downgrade schema."""
    # ### commands auto generated by Alembic - please adjust! ###
    # Restore the unique constraint on username index
    op.drop_index(op.f('ix_users_username'), table_name='users')
    op.create_index(op.f('ix_users_username'), 'users', ['username'], unique=True)
    
    # Restore FCM token column and index (for rollback purposes)
    op.add_column('users', sa.Column('fcm_token', sa.VARCHAR(), autoincrement=False, nullable=True))
    op.create_index(op.f('ix_users_fcm_token'), 'users', ['fcm_token'], unique=False)
    # ### end Alembic commands ###
