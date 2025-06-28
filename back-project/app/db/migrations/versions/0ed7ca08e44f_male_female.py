"""male-female

Revision ID: 0ed7ca08e44f
Revises: 2f241cbc03c3
Create Date: 2025-06-27 12:39:20.314709

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = '0ed7ca08e44f'
down_revision: Union[str, Sequence[str], None] = '2f241cbc03c3'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # Create the enum type first
    petgender_enum = postgresql.ENUM('MALE', 'FEMALE', name='petgender')
    petgender_enum.create(op.get_bind())
    
    # Add gender column to pets table
    op.add_column('pets', sa.Column('gender', sa.Enum('MALE', 'FEMALE', name='petgender'), nullable=False, server_default='MALE'))


def downgrade() -> None:
    """Downgrade schema."""
    # Remove gender column from pets table
    op.drop_column('pets', 'gender')
    
    # Drop the enum type
    petgender_enum = postgresql.ENUM('MALE', 'FEMALE', name='petgender')
    petgender_enum.drop(op.get_bind())
