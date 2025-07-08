"""change_health_to_care_category

Revision ID: 6c9ad72e3d28
Revises: 284b37750c83
Create Date: 2025-07-08 05:32:35.184143

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = '6c9ad72e3d28'
down_revision: Union[str, Sequence[str], None] = '284b37750c83'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # Add a temporary column with the new enum type
    op.execute("CREATE TYPE activitycategory_new AS ENUM ('FEEDING', 'CARE', 'ACTIVITY')")
    op.execute("ALTER TABLE activity_records ADD COLUMN category_new activitycategory_new")
    
    # Copy data with transformation
    op.execute("UPDATE activity_records SET category_new = CASE WHEN category = 'HEALTH' THEN 'CARE'::activitycategory_new ELSE category::text::activitycategory_new END")
    
    # Drop old column and enum
    op.execute("ALTER TABLE activity_records DROP COLUMN category")
    op.execute("DROP TYPE activitycategory")
    
    # Rename new column and enum
    op.execute("ALTER TABLE activity_records RENAME COLUMN category_new TO category")
    op.execute("ALTER TYPE activitycategory_new RENAME TO activitycategory")


def downgrade() -> None:
    """Downgrade schema."""
    # Add a temporary column with the old enum type
    op.execute("CREATE TYPE activitycategory_old AS ENUM ('FEEDING', 'HEALTH', 'ACTIVITY')")
    op.execute("ALTER TABLE activity_records ADD COLUMN category_old activitycategory_old")
    
    # Copy data with transformation
    op.execute("UPDATE activity_records SET category_old = CASE WHEN category = 'CARE' THEN 'HEALTH'::activitycategory_old ELSE category::text::activitycategory_old END")
    
    # Drop new column and enum
    op.execute("ALTER TABLE activity_records DROP COLUMN category")
    op.execute("DROP TYPE activitycategory")
    
    # Rename old column and enum
    op.execute("ALTER TABLE activity_records RENAME COLUMN category_old TO category")
    op.execute("ALTER TYPE activitycategory_old RENAME TO activitycategory")
