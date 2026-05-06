from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict

from app.models.device import RepairStatus
from app.schemas.category import Category
from app.schemas.user import UserResponse


class DeviceBase(BaseModel):
    inventory_number: str
    name: str
    serial_number: str | None = None
    cabinet: str | None = None
    category_id: UUID | None = None
    responsible_id: UUID | None = None
    repair_status: RepairStatus = RepairStatus.NOT_IN_REPAIR


class DeviceCreate(DeviceBase):
    author_id: UUID


class DeviceUpdate(BaseModel):
    name: str | None = None
    serial_number: str | None = None
    cabinet: str | None = None
    category_id: UUID | None = None
    responsible_id: UUID | None = None
    repair_status: RepairStatus | None = None
    taken_by: UUID | None = None


class Device(DeviceBase):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    author_id: UUID
    taken_by: UUID | None = None
    created_at: datetime
    updated_at: datetime
    category: Category | None = None
    responsible: UserResponse | None = None
    author: UserResponse
    taken_by_user: UserResponse | None = None
