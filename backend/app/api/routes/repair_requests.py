from datetime import datetime, timezone
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func
from sqlalchemy.orm import Session

from backend.app.api.deps import get_db, require_admin_or_sysadmin
from backend.app.models.device import Device
from backend.app.models.enums import RequestStatus
from backend.app.models.repair_request import RepairRequest
from backend.app.models.user import User
from backend.app.schemas.repair_request import (
    PublicRepairRequestCreate,
    PublicRepairRequestResponse,
    RepairRequestClose,
    RepairRequestCreate,
    RepairRequestDetail,
    RepairRequestList,
    RepairRequestResponse,
    RepairRequestStatusUpdate,
    RepairRequestTake,
)

router = APIRouter(tags=["repair-requests"])

ACTIVE_STATUSES = (RequestStatus.OPEN, RequestStatus.IN_PROGRESS)
ALLOWED_STATUS_TRANSITIONS = {
    RequestStatus.OPEN: {RequestStatus.OPEN, RequestStatus.IN_PROGRESS, RequestStatus.CLOSED},
    RequestStatus.IN_PROGRESS: {RequestStatus.IN_PROGRESS, RequestStatus.CLOSED},
    RequestStatus.CLOSED: {RequestStatus.CLOSED},
}


def get_repair_request_or_404(db: Session, request_id: UUID) -> RepairRequest:
    repair_request = db.query(RepairRequest).filter(RepairRequest.id == request_id).first()
    if repair_request is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="repair_request_not_found")
    return repair_request


def ensure_device_exists(db: Session, device_id: UUID) -> None:
    exists = db.query(Device.id).filter(Device.id == device_id).first()
    if exists is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="device_not_found")


def ensure_no_active_request(db: Session, device_id: UUID) -> None:
    active_request = (
        db.query(RepairRequest.id)
        .filter(RepairRequest.device_id == device_id, RepairRequest.status.in_(ACTIVE_STATUSES))
        .first()
    )
    if active_request is not None:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="active_request_exists")


def apply_closed_fields(repair_request: RepairRequest, current_user: User, resolution_note: str | None = None) -> None:
    repair_request.status = RequestStatus.CLOSED
    repair_request.closed_at = datetime.now(timezone.utc)
    repair_request.closed_by_user_id = current_user.id
    if resolution_note is not None:
        repair_request.resolution_note = resolution_note


@router.get("/repair-requests", response_model=RepairRequestList)
def list_repair_requests(
    status_filter: RequestStatus | None = Query(default=None, alias="status"),
    device_id: UUID | None = None,
    author_user_id: UUID | None = None,
    date_from: datetime | None = None,
    date_to: datetime | None = None,
    limit: int = Query(default=50, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin_or_sysadmin),
) -> RepairRequestList:
    query = db.query(RepairRequest)

    if status_filter is not None:
        query = query.filter(RepairRequest.status == status_filter)
    if device_id is not None:
        query = query.filter(RepairRequest.device_id == device_id)
    if author_user_id is not None:
        query = query.filter(RepairRequest.author_user_id == author_user_id)
    if date_from is not None:
        query = query.filter(RepairRequest.created_at >= date_from)
    if date_to is not None:
        query = query.filter(RepairRequest.created_at <= date_to)

    total = query.with_entities(func.count(RepairRequest.id)).scalar() or 0
    items = query.order_by(RepairRequest.created_at.desc()).limit(limit).offset(offset).all()

    return RepairRequestList(items=[RepairRequestResponse.model_validate(item) for item in items], total=total)


@router.post("/repair-requests", response_model=RepairRequestResponse, status_code=status.HTTP_201_CREATED)
def create_repair_request(
    payload: RepairRequestCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin_or_sysadmin),
) -> RepairRequestResponse:
    ensure_device_exists(db, payload.device_id)
    ensure_no_active_request(db, payload.device_id)

    repair_request = RepairRequest(
        device_id=payload.device_id,
        description=payload.description,
        applicant_name=payload.applicant_name,
        author_user_id=payload.author_user_id or current_user.id,
    )
    db.add(repair_request)
    db.commit()
    db.refresh(repair_request)
    return RepairRequestResponse.model_validate(repair_request)


@router.post("/public/repair-requests", response_model=PublicRepairRequestResponse, status_code=status.HTTP_201_CREATED)
def create_public_repair_request(
    payload: PublicRepairRequestCreate,
    db: Session = Depends(get_db),
) -> PublicRepairRequestResponse:
    ensure_device_exists(db, payload.device_id)
    ensure_no_active_request(db, payload.device_id)

    repair_request = RepairRequest(
        device_id=payload.device_id,
        applicant_name=payload.applicant_name,
        description=payload.description,
    )
    db.add(repair_request)
    db.commit()
    db.refresh(repair_request)
    return PublicRepairRequestResponse(id=repair_request.id, status=repair_request.status)


@router.get("/repair-requests/{request_id}", response_model=RepairRequestDetail)
def get_repair_request(
    request_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin_or_sysadmin),
) -> RepairRequestDetail:
    repair_request = get_repair_request_or_404(db, request_id)
    return RepairRequestDetail.model_validate(repair_request)


@router.patch("/repair-requests/{request_id}/status", response_model=RepairRequestDetail)
def update_repair_request_status(
    request_id: UUID,
    payload: RepairRequestStatusUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin_or_sysadmin),
) -> RepairRequestDetail:
    repair_request = get_repair_request_or_404(db, request_id)
    if payload.status not in ALLOWED_STATUS_TRANSITIONS[repair_request.status]:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="invalid_status_transition")

    if payload.status == RequestStatus.CLOSED:
        apply_closed_fields(repair_request, current_user, payload.resolution_note)
    else:
        repair_request.status = payload.status
        if payload.resolution_note is not None:
            repair_request.resolution_note = payload.resolution_note

    db.commit()
    db.refresh(repair_request)
    return RepairRequestDetail.model_validate(repair_request)


@router.patch("/repair-requests/{request_id}/take", response_model=RepairRequestDetail)
def take_repair_request(
    request_id: UUID,
    payload: RepairRequestTake,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin_or_sysadmin),
) -> RepairRequestDetail:
    repair_request = get_repair_request_or_404(db, request_id)
    if payload.taken:
        repair_request.taken_by_sysadmin_at = datetime.now(timezone.utc)
        repair_request.taken_by_sysadmin_by_user_id = current_user.id

    db.commit()
    db.refresh(repair_request)
    return RepairRequestDetail.model_validate(repair_request)


@router.patch("/repair-requests/{request_id}/close", response_model=RepairRequestDetail)
def close_repair_request(
    request_id: UUID,
    payload: RepairRequestClose,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin_or_sysadmin),
) -> RepairRequestDetail:
    repair_request = get_repair_request_or_404(db, request_id)
    if RequestStatus.CLOSED not in ALLOWED_STATUS_TRANSITIONS[repair_request.status]:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="invalid_status_transition")

    apply_closed_fields(repair_request, current_user, payload.resolution_note)
    db.commit()
    db.refresh(repair_request)
    return RepairRequestDetail.model_validate(repair_request)
