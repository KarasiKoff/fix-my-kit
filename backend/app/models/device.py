from uuid import uuid4

from sqlalchemy import Column, Enum as SQLEnum
from sqlalchemy import ForeignKey, String, Uuid
from sqlalchemy.dialects.postgresql import TIMESTAMP
from sqlalchemy.orm import relationship

from app.models.base import Base
from app.models.enums import RepairStatus


class Device(Base):
    __tablename__ = "devices"

    id = Column(Uuid, primary_key=True, default=uuid4)
    inventory_number = Column(String, nullable=False, unique=True)
    name = Column(String, nullable=False)
    category_id = Column(Uuid, ForeignKey("categories.id"), nullable=True)
    serial_number = Column(String, nullable=True)
    cabinet = Column(String, nullable=True)
    responsible_id = Column(Uuid, ForeignKey("users.id"), nullable=True)
    repair_status = Column(SQLEnum(RepairStatus, name="repair_status"), nullable=False, default=RepairStatus.NOT_IN_REPAIR)
    created_at = Column(TIMESTAMP(timezone=True), nullable=False, server_default="CURRENT_TIMESTAMP")
    updated_at = Column(
        TIMESTAMP(timezone=True),
        nullable=False,
        server_default="CURRENT_TIMESTAMP",
        onupdate="CURRENT_TIMESTAMP",
    )

    # Relationships
    category = relationship("Category", backref="devices")
    responsible = relationship("User", foreign_keys=[responsible_id], backref="responsible_for_devices")
