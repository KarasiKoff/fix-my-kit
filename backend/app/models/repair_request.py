from uuid import uuid4

from sqlalchemy import Column, Enum as SQLEnum
from sqlalchemy import ForeignKey, String, Text, Uuid
from sqlalchemy.dialects.postgresql import TIMESTAMP
from sqlalchemy.orm import relationship

from app.models.base import Base
from app.models.enums import RequestStatus


class RepairRequest(Base):
    __tablename__ = "repair_requests"

    id = Column(Uuid, primary_key=True, default=uuid4)
    device_id = Column(Uuid, ForeignKey("devices.id"), nullable=False)
    author_user_id = Column(Uuid, ForeignKey("users.id"), nullable=True)
    closed_by_user_id = Column(Uuid, ForeignKey("users.id"), nullable=True)
    taken_by_sysadmin_by_user_id = Column(Uuid, ForeignKey("users.id"), nullable=True)
    applicant_name = Column(String, nullable=True)
    description = Column(Text, nullable=False)
    status = Column(SQLEnum(RequestStatus, name="request_status"), nullable=False, default=RequestStatus.OPEN)
    taken_by_sysadmin_at = Column(TIMESTAMP(timezone=True), nullable=True)
    resolution_note = Column(Text, nullable=True)
    closed_at = Column(TIMESTAMP(timezone=True), nullable=True)
    tracker_ticket_id = Column(String, nullable=True)
    tracker_ticket_key = Column(String, nullable=True)
    tracker_ticket_url = Column(String, nullable=True)
    last_sync_at = Column(TIMESTAMP(timezone=True), nullable=True)
    created_at = Column(TIMESTAMP(timezone=True), nullable=False, server_default="CURRENT_TIMESTAMP")
    updated_at = Column(
        TIMESTAMP(timezone=True),
        nullable=False,
        server_default="CURRENT_TIMESTAMP",
        onupdate="CURRENT_TIMESTAMP",
    )

    # Relationships
    device = relationship("Device", backref="repair_requests")
    author = relationship("User", foreign_keys=[author_user_id], backref="repair_requests_created")
    closed_by = relationship("User", foreign_keys=[closed_by_user_id], backref="repair_requests_closed")
    taken_by_sysadmin = relationship("User", foreign_keys=[taken_by_sysadmin_by_user_id], backref="repair_requests_taken")
