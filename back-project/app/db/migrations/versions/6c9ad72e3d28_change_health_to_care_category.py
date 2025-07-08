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
    # Create new enum type with CARE instead of HEALTH
    op.execute("ALTER TYPE activitycategory RENAME TO activitycategory_old")
    op.execute("CREATE TYPE activitycategory AS ENUM ('FEEDING', 'CARE', 'ACTIVITY')")
    
    # Update the column to use new enum type
    op.execute("ALTER TABLE activity_records ALTER COLUMN category TYPE activitycategory USING category::text::activitycategory")
    
    # Update existing records from HEALTH to CARE
    op.execute("UPDATE activity_records SET category = 'CARE' WHERE category = 'HEALTH'")
    
    # Drop old enum type
    op.execute("DROP TYPE activitycategory_old")


def downgrade() -> None:
    """Downgrade schema."""
    # Create old enum type with HEALTH
    op.execute("ALTER TYPE activitycategory RENAME TO activitycategory_new")
    op.execute("CREATE TYPE activitycategory AS ENUM ('FEEDING', 'HEALTH', 'ACTIVITY')")
    
    # Update existing records from CARE back to HEALTH
    op.execute("UPDATE activity_records SET category = 'HEALTH' WHERE category = 'CARE'")
    
    # Update the column to use old enum type
    op.execute("ALTER TABLE activity_records ALTER COLUMN category TYPE activitycategory USING category::text::activitycategory")
    
    # Drop new enum type
    op.execute("DROP TYPE activitycategory_new")
