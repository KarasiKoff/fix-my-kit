from enum import Enum
from uuid import uuid4

from sqlalchemy import Column, Enum as SQLEnum
from sqlalchemy import ForeignKey, Text, Uuid
from sqlalchemy.dialects.postgresql import TIMESTAMP
from sqlalchemy.orm import relationship

from app.models.base import Base


class RepairStatus(str, Enum):
    NOT_IN_REPAIR = "not_in_repair"
    IN_REPAIR = "in_repair"


class RepairHistory(Base):
    __tablename__ = "repair_history"

    id = Column(Uuid, primary_key=True, default=uuid4)
    device_id = Column(Uuid, ForeignKey("devices.id"), nullable=False)
    repair_request_id = Column(Uuid, ForeignKey("repair_requests.id"), nullable=True)
    old_status = Column(SQLEnum(RepairStatus), nullable=True)
    new_status = Column(SQLEnum(RepairStatus), nullable=True)
    note = Column(Text, nullable=True)
    created_at = Column(TIMESTAMP(timezone=True), nullable=False, server_default="CURRENT_TIMESTAMP")

    # Relationships
    device = relationship("Device", backref="repair_history")
    repair_request = relationship("RepairRequest", backref="history")
