from uuid import uuid4

from sqlalchemy import Boolean, Column, Enum as SQLEnum
from sqlalchemy import String, Uuid
from sqlalchemy.dialects.postgresql import TIMESTAMP

from app.models.base import Base
from app.models.enums import UserRole


class User(Base):
    __tablename__ = "users"

    id = Column(Uuid, primary_key=True, default=uuid4)
    login = Column(String, nullable=False, unique=True)
    password_hash = Column(String, nullable=False)
    role = Column(SQLEnum(UserRole, name="user_role"), nullable=False, default=UserRole.USER)
    full_name = Column(String, nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(TIMESTAMP(timezone=True), nullable=False, server_default="CURRENT_TIMESTAMP")
    updated_at = Column(
        TIMESTAMP(timezone=True),
        nullable=False,
        server_default="CURRENT_TIMESTAMP",
        onupdate="CURRENT_TIMESTAMP",
    )
