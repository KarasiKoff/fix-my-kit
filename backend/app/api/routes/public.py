from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func
from sqlalchemy.orm import Session, joinedload

from backend.app.api.deps import get_db
from backend.app.models.device import Device as DeviceModel
from backend.app.schemas.public_device import PublicDeviceResponse

router = APIRouter(prefix="/api/public", tags=["public"])


@router.get("/devices/by-inventory", response_model=PublicDeviceResponse)
def get_public_device_by_inventory(
    number: str = Query(..., min_length=1, description="Инвентарный номер (без учёта регистра)"),
    db: Session = Depends(get_db),
) -> PublicDeviceResponse:
    inv = number.strip()
    device = (
        db.query(DeviceModel)
        .options(joinedload(DeviceModel.category), joinedload(DeviceModel.audience))
        .filter(func.lower(DeviceModel.inventory_number) == inv.lower())
        .first()
    )
    if device is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="device_not_found")
    return PublicDeviceResponse.model_validate(device)


@router.get("/devices/{device_id}", response_model=PublicDeviceResponse)
def get_public_device(device_id: UUID, db: Session = Depends(get_db)) -> PublicDeviceResponse:
    device = (
        db.query(DeviceModel)
        .options(joinedload(DeviceModel.category), joinedload(DeviceModel.audience))
        .filter(DeviceModel.id == device_id)
        .first()
    )
    if device is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="device_not_found")
    return PublicDeviceResponse.model_validate(device)
