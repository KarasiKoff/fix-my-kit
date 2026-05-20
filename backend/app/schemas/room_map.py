from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


class DevicePositionItem(BaseModel):
    device_id: UUID
    x_pct: float = Field(ge=0.0, le=100.0)
    y_pct: float = Field(ge=0.0, le=100.0)


class DeviceOnMap(DevicePositionItem):
    model_config = ConfigDict(from_attributes=True)

    device_name: str
    inventory_number: str
    repair_status: str
    category_id: UUID | None = None
    category_has_icon: bool = False


class RoomMapResponse(BaseModel):
    audience_id: int
    positions: list[DeviceOnMap]


class RoomMapSaveRequest(BaseModel):
    positions: list[DevicePositionItem]


class RoomDeviceListItem(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    name: str
    inventory_number: str
    repair_status: str
    is_on_map: bool = False
    category_id: UUID | None = None
    category_has_icon: bool = False


class RoomDeviceListResponse(BaseModel):
    items: list[RoomDeviceListItem]
