from uuid import uuid4

from sqlalchemy import Boolean, Column, String, Uuid
from sqlalchemy.dialects.postgresql import TIMESTAMP

from app.models.base import Base


class Category(Base):
    __tablename__ = "categories"

    id = Column(Uuid, primary_key=True, default=uuid4)
    name = Column(String, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(TIMESTAMP(timezone=True), nullable=False, server_default="CURRENT_TIMESTAMP")
