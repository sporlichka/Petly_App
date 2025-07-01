"""add_cascade_deletion_for_user_profile

Revision ID: 44e487a79d69
Revises: 7356beaf9de1
Create Date: 2025-07-01 19:18:15.694615

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '44e487a79d69'
down_revision: Union[str, Sequence[str], None] = '7356beaf9de1'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    pass


def downgrade() -> None:
    """Downgrade schema."""
    pass
