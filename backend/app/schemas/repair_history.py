from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict

from app.models.enums import RepairStatus


class RepairHistoryBase(BaseModel):
    device_id: UUID
    repair_request_id: UUID | None = None
    old_status: RepairStatus | None = None
    new_status: RepairStatus | None = None
    note: str | None = None


class RepairHistoryCreate(RepairHistoryBase):
    pass


class RepairHistoryResponse(RepairHistoryBase):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    created_at: datetime
