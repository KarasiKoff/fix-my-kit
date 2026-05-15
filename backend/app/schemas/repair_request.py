from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict

from backend.app.models.enums import RequestStatus


class RepairRequestBase(BaseModel):
    device_id: UUID
    description: str
    applicant_name: str | None = None


class RepairRequestCreate(RepairRequestBase):
    author_user_id: UUID | None = None
    sync_to_tracker: bool = True


class PublicRepairRequestCreate(RepairRequestBase):
    applicant_name: str


class RepairRequestStatusUpdate(BaseModel):
    status: RequestStatus
    resolution_note: str | None = None


class RepairRequestTake(BaseModel):
    taken: bool


class RepairRequestClose(BaseModel):
    resolution_note: str | None = None


class RepairRequestUpdate(BaseModel):
    description: str | None = None
    status: RequestStatus | None = None
    resolution_note: str | None = None
    taken_by_sysadmin_by_user_id: UUID | None = None
    taken_by_sysadmin_at: datetime | None = None


class RepairRequestResponse(RepairRequestBase):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    author_user_id: UUID | None
    closed_by_user_id: UUID | None
    taken_by_sysadmin_by_user_id: UUID | None
    status: RequestStatus
    taken_by_sysadmin_at: datetime | None = None
    resolution_note: str | None = None
    closed_at: datetime | None = None
    tracker_ticket_id: str | None = None
    tracker_ticket_key: str | None = None
    tracker_ticket_url: str | None = None
    last_sync_at: datetime | None = None
    created_at: datetime
    updated_at: datetime
    device_inventory_number: str | None = None
    device_name: str | None = None


class RepairRequestList(BaseModel):
    items: list[RepairRequestResponse]
    total: int


class PublicRepairRequestResponse(BaseModel):
    id: UUID
    status: RequestStatus


RepairRequestDetail = RepairRequestResponse
