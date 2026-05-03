"""add rag evaluations

Revision ID: 2b7c0f4d9a12
Revises: 1c587c569525
Create Date: 2026-05-03 02:45:00.000000
"""

from collections.abc import Sequence

from alembic import op
import sqlalchemy as sa


revision: str = "2b7c0f4d9a12"
down_revision: str | None = "1c587c569525"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "rag_evaluations",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("user_id", sa.Integer(), nullable=True),
        sa.Column("query", sa.Text(), nullable=False),
        sa.Column("answer", sa.Text(), nullable=False),
        sa.Column("faithfulness_score", sa.Float(), nullable=True),
        sa.Column("relevance_score", sa.Float(), nullable=True),
        sa.Column("context_precision", sa.Float(), nullable=True),
        sa.Column("context_recall", sa.Float(), nullable=True),
        sa.Column("agent_type", sa.String(length=80), nullable=False),
        sa.Column("error_message", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_rag_evaluations_agent_type"), "rag_evaluations", ["agent_type"], unique=False)
    op.create_index(op.f("ix_rag_evaluations_user_id"), "rag_evaluations", ["user_id"], unique=False)


def downgrade() -> None:
    op.drop_index(op.f("ix_rag_evaluations_user_id"), table_name="rag_evaluations")
    op.drop_index(op.f("ix_rag_evaluations_agent_type"), table_name="rag_evaluations")
    op.drop_table("rag_evaluations")
