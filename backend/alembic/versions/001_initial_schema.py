"""Initial database schema

Revision ID: 001_initial_schema
Revises: 
Create Date: 2024-05-06

"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = "001_initial_schema"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Типы создаём явно ниже; у колонок create_type=False — иначе при create_table
    # SQLAlchemy повторно шлёт CREATE TYPE и ловим DuplicateObject.
    repair_status = postgresql.ENUM(
        "not_in_repair", "in_repair", name="repair_status", create_type=False
    )
    request_status = postgresql.ENUM(
        "open", "in_progress", "closed", name="request_status", create_type=False
    )
    user_role = postgresql.ENUM(
        "user", "admin", "sysadmin", name="user_role", create_type=False
    )

    repair_status.create(op.get_bind(), checkfirst=True)
    request_status.create(op.get_bind(), checkfirst=True)
    user_role.create(op.get_bind(), checkfirst=True)

    # Create categories table
    op.create_table(
        "categories",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("name", sa.String(), nullable=False, unique=True),
        sa.Column("is_active", sa.Boolean(), server_default=sa.text("true"), nullable=False),
        sa.Column(
            "created_at",
            postgresql.TIMESTAMP(timezone=True),
            server_default=sa.text("CURRENT_TIMESTAMP"),
            nullable=False,
        ),
        sa.PrimaryKeyConstraint("id"),
    )

    # Create users table
    op.create_table(
        "users",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("login", sa.String(), nullable=False),
        sa.Column("password_hash", sa.String(), nullable=False),
        sa.Column("role", user_role, server_default="user", nullable=False),
        sa.Column("full_name", sa.String(), nullable=True),
        sa.Column("is_active", sa.Boolean(), server_default=sa.text("true"), nullable=False),
        sa.Column(
            "created_at",
            postgresql.TIMESTAMP(timezone=True),
            server_default=sa.text("CURRENT_TIMESTAMP"),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            postgresql.TIMESTAMP(timezone=True),
            server_default=sa.text("CURRENT_TIMESTAMP"),
            nullable=False,
        ),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("login"),
    )

    # Create devices table
    op.create_table(
        "devices",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("inventory_number", sa.String(), nullable=False),
        sa.Column("name", sa.String(), nullable=False),
        sa.Column("category_id", sa.Uuid(), nullable=True),
        sa.Column("serial_number", sa.String(), nullable=True),
        sa.Column("cabinet", sa.String(), nullable=True),
        sa.Column("responsible_id", sa.Uuid(), nullable=True),
        sa.Column("repair_status", repair_status, server_default="not_in_repair", nullable=False),
        sa.Column(
            "created_at",
            postgresql.TIMESTAMP(timezone=True),
            server_default=sa.text("CURRENT_TIMESTAMP"),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            postgresql.TIMESTAMP(timezone=True),
            server_default=sa.text("CURRENT_TIMESTAMP"),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(["category_id"], ["categories.id"]),
        sa.ForeignKeyConstraint(["responsible_id"], ["users.id"]),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("inventory_number"),
    )

    # Create repair_requests table
    op.create_table(
        "repair_requests",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("device_id", sa.Uuid(), nullable=False),
        sa.Column("author_user_id", sa.Uuid(), nullable=True),
        sa.Column("closed_by_user_id", sa.Uuid(), nullable=True),
        sa.Column("taken_by_sysadmin_by_user_id", sa.Uuid(), nullable=True),
        sa.Column("applicant_name", sa.String(), nullable=True),
        sa.Column("description", sa.Text(), nullable=False),
        sa.Column("status", request_status, server_default="open", nullable=False),
        sa.Column("taken_by_sysadmin_at", postgresql.TIMESTAMP(timezone=True), nullable=True),
        sa.Column("resolution_note", sa.Text(), nullable=True),
        sa.Column("closed_at", postgresql.TIMESTAMP(timezone=True), nullable=True),
        sa.Column("tracker_ticket_id", sa.String(), nullable=True),
        sa.Column("tracker_ticket_key", sa.String(), nullable=True),
        sa.Column("tracker_ticket_url", sa.String(), nullable=True),
        sa.Column("last_sync_at", postgresql.TIMESTAMP(timezone=True), nullable=True),
        sa.Column(
            "created_at",
            postgresql.TIMESTAMP(timezone=True),
            server_default=sa.text("CURRENT_TIMESTAMP"),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            postgresql.TIMESTAMP(timezone=True),
            server_default=sa.text("CURRENT_TIMESTAMP"),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(["author_user_id"], ["users.id"]),
        sa.ForeignKeyConstraint(["closed_by_user_id"], ["users.id"]),
        sa.ForeignKeyConstraint(["device_id"], ["devices.id"]),
        sa.ForeignKeyConstraint(["taken_by_sysadmin_by_user_id"], ["users.id"]),
        sa.PrimaryKeyConstraint("id"),
    )

    # Create repair_history table
    op.create_table(
        "repair_history",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("device_id", sa.Uuid(), nullable=False),
        sa.Column("repair_request_id", sa.Uuid(), nullable=True),
        sa.Column("old_status", repair_status, nullable=True),
        sa.Column("new_status", repair_status, nullable=True),
        sa.Column("note", sa.Text(), nullable=True),
        sa.Column(
            "created_at",
            postgresql.TIMESTAMP(timezone=True),
            server_default=sa.text("CURRENT_TIMESTAMP"),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(["device_id"], ["devices.id"]),
        sa.ForeignKeyConstraint(["repair_request_id"], ["repair_requests.id"]),
        sa.PrimaryKeyConstraint("id"),
    )


def downgrade() -> None:
    op.drop_table("repair_history")
    op.drop_table("repair_requests")
    op.drop_table("devices")
    op.drop_table("users")
    op.drop_table("categories")

    # Drop custom types
    op.execute("DROP TYPE IF EXISTS repair_status CASCADE")
    op.execute("DROP TYPE IF EXISTS request_status CASCADE")
    op.execute("DROP TYPE IF EXISTS user_role CASCADE")
