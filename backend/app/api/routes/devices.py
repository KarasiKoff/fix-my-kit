from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session, joinedload

from backend.app.api.deps import get_db, require_roles
from backend.app.models.device import Device as DeviceModel
from backend.app.models.enums import RepairStatus, UserRole
from backend.app.models.repair_history import RepairHistory
from backend.app.schemas.device import Device, DeviceCreate, DeviceDetail, DeviceHistoryResponse, DeviceListResponse, DeviceQrResponse, DeviceUpdate

router = APIRouter(prefix="/devices", tags=["devices"])


def _device_base_query(db: Session):
    return db.query(DeviceModel).options(
        joinedload(DeviceModel.category),
        joinedload(DeviceModel.responsible),
    )


@router.get(
    "",
    response_model=DeviceListResponse,
    dependencies=[Depends(require_roles(UserRole.ADMIN, UserRole.SYSADMIN))],
)
def list_devices(
    inventory_number: str | None = Query(default=None),
    category_id: UUID | None = Query(default=None),
    cabinet: str | None = Query(default=None),
    responsible_id: UUID | None = Query(default=None),
    repair_status: RepairStatus | None = Query(default=None),
    limit: int = Query(default=50, ge=1, le=200),
    offset: int = Query(default=0, ge=0),
    db: Session = Depends(get_db),
) -> DeviceListResponse:
    query = _device_base_query(db)

    if inventory_number is not None:
        query = query.filter(DeviceModel.inventory_number.ilike(f"%{inventory_number}%"))
    if category_id is not None:
        query = query.filter(DeviceModel.category_id == category_id)
    if cabinet is not None:
        query = query.filter(DeviceModel.cabinet.ilike(f"%{cabinet}%"))
    if responsible_id is not None:
        query = query.filter(DeviceModel.responsible_id == responsible_id)
    if repair_status is not None:
        query = query.filter(DeviceModel.repair_status == repair_status)

    total = query.count()
    items = (
        query.order_by(DeviceModel.created_at.desc())
        .offset(offset)
        .limit(limit)
        .all()
    )
    return DeviceListResponse(items=[Device.model_validate(item) for item in items], total=total)


@router.post(
    "",
    status_code=status.HTTP_201_CREATED,
    response_model=Device,
    dependencies=[Depends(require_roles(UserRole.ADMIN))],
)
def create_device(payload: DeviceCreate, db: Session = Depends(get_db)) -> Device:
    device = DeviceModel(**payload.model_dump())
    db.add(device)
    try:
        db.commit()
    except IntegrityError as exc:
        db.rollback()
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="inventory_number_exists") from exc
    db.refresh(device)
    return Device.model_validate(device)


@router.get(
    "/{device_id}",
    response_model=DeviceDetail,
    dependencies=[Depends(require_roles(UserRole.ADMIN, UserRole.SYSADMIN))],
)
def get_device(device_id: UUID, db: Session = Depends(get_db)) -> DeviceDetail:
    device = _device_base_query(db).filter(DeviceModel.id == device_id).first()
    if device is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="device_not_found")
    return DeviceDetail.model_validate(device)


@router.patch(
    "/{device_id}",
    response_model=DeviceDetail,
    dependencies=[Depends(require_roles(UserRole.ADMIN, UserRole.SYSADMIN))],
)
def patch_device(device_id: UUID, payload: DeviceUpdate, db: Session = Depends(get_db)) -> DeviceDetail:
    device = db.query(DeviceModel).filter(DeviceModel.id == device_id).first()
    if device is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="device_not_found")

    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(device, field, value)

    try:
        db.commit()
    except IntegrityError as exc:
        db.rollback()
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="inventory_number_exists") from exc

    refreshed = _device_base_query(db).filter(DeviceModel.id == device_id).first()
    if refreshed is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="device_not_found")
    return DeviceDetail.model_validate(refreshed)


@router.get(
    "/{device_id}/qr",
    response_model=DeviceQrResponse,
    dependencies=[Depends(require_roles(UserRole.ADMIN, UserRole.SYSADMIN))],
)
def get_device_qr(device_id: UUID, db: Session = Depends(get_db)) -> DeviceQrResponse:
    exists = db.query(DeviceModel.id).filter(DeviceModel.id == device_id).first()
    if exists is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="device_not_found")
    return DeviceQrResponse(device_id=device_id, url=f"https://fixmykit.local/device/{device_id}")


@router.get(
    "/{device_id}/history",
    response_model=DeviceHistoryResponse,
    dependencies=[Depends(require_roles(UserRole.ADMIN, UserRole.SYSADMIN))],
)
def get_device_history(device_id: UUID, db: Session = Depends(get_db)) -> DeviceHistoryResponse:
    exists = db.query(DeviceModel.id).filter(DeviceModel.id == device_id).first()
    if exists is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="device_not_found")

    items = (
        db.query(RepairHistory)
        .filter(RepairHistory.device_id == device_id)
        .order_by(RepairHistory.created_at.desc())
        .all()
    )
    return DeviceHistoryResponse(items=items)
