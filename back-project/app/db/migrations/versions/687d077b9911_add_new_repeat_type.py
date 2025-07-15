"""add new repeat type

Revision ID: 687d077b9911
Revises: 6c9ad72e3d28
Create Date: 2025-07-14 11:33:13.419232

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = '687d077b9911'
down_revision: Union[str, Sequence[str], None] = '6c9ad72e3d28'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    repeattype = sa.Enum('NONE', 'DAY', 'WEEK', 'MONTH', 'YEAR', name='repeattype')
    repeattype.create(op.get_bind(), checkfirst=True)
    
    # Добавляем колонки как nullable сначала
    op.add_column('activity_records', sa.Column('repeat_type', repeattype, nullable=True))
    op.add_column('activity_records', sa.Column('repeat_interval', sa.Integer(), nullable=True))
    op.add_column('activity_records', sa.Column('repeat_end_date', sa.DateTime(), nullable=True))
    op.add_column('activity_records', sa.Column('repeat_count', sa.Integer(), nullable=True))
    
    # Устанавливаем значения по умолчанию для существующих записей
    op.execute("UPDATE activity_records SET repeat_type = 'NONE', repeat_interval = 1 WHERE repeat_type IS NULL")
    
    # Делаем колонки NOT NULL
    op.alter_column('activity_records', 'repeat_type', nullable=False)
    op.alter_column('activity_records', 'repeat_interval', nullable=False)
    
    op.alter_column('activity_records', 'category',
               existing_type=postgresql.ENUM('FEEDING', 'CARE', 'ACTIVITY', name='activitycategory'),
               nullable=False)
    op.drop_column('activity_records', 'repeat')
    # ### end Alembic commands ###


def downgrade() -> None:
    """Downgrade schema."""
    # Только изменения для activity_records
    op.add_column('activity_records', sa.Column('repeat', sa.VARCHAR(), autoincrement=False, nullable=True))
    op.alter_column('activity_records', 'category',
               existing_type=postgresql.ENUM('FEEDING', 'CARE', 'ACTIVITY', name='activitycategory'),
               nullable=True)
    op.drop_column('activity_records', 'repeat_count')
    op.drop_column('activity_records', 'repeat_end_date')
    op.drop_column('activity_records', 'repeat_interval')
    op.drop_column('activity_records', 'repeat_type')
    repeattype = sa.Enum('NONE', 'DAY', 'WEEK', 'MONTH', 'YEAR', name='repeattype')
    repeattype.drop(op.get_bind(), checkfirst=True)
    # ### end Alembic commands ###
