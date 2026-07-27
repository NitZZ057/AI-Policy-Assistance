"""add is_guest to users

Revision ID: 3d9a2f6b8c51
Revises: 2b7c0f4d9a12
Create Date: 2026-07-27 10:00:00.000000
"""

from collections.abc import Sequence

from alembic import op
import sqlalchemy as sa


revision: str = "3d9a2f6b8c51"
down_revision: str | None = "2b7c0f4d9a12"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.add_column(
        "users",
        sa.Column(
            "is_guest",
            sa.Boolean(),
            nullable=False,
            server_default=sa.false(),
        ),
    )
    op.create_index("ix_users_is_guest", "users", ["is_guest"])


def downgrade() -> None:
    op.drop_index("ix_users_is_guest", table_name="users")
    op.drop_column("users", "is_guest")
