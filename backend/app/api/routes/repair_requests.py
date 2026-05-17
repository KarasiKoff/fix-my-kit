from datetime import datetime, timezone
from typing import Literal
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import and_, or_
from sqlalchemy.orm import Session, joinedload

from backend.app.api.deps import get_db, require_admin_or_sysadmin
from backend.app.models.device import Device
from backend.app.models.enums import RepairStatus, RequestStatus
from backend.app.models.repair_request import RepairRequest
from backend.app.models.user import User
from backend.app.schemas.repair_request import (
    PublicRepairRequestCreate,
    PublicRepairRequestResponse,
    RepairRequestClose,
    RepairRequestCreate,
    RepairRequestDetail,
    RepairRequestList,
    RepairRequestPublish,
    RepairRequestResponse,
    RepairRequestStatusUpdate,
    RepairRequestTake,
)
from backend.app.schemas.suggest import SuggestResponse
from backend.app.schemas.tracker import TrackerBulkSyncResponse, TrackerSyncResponse
from backend.app.services.repair_history_service import add_repair_history
from backend.app.services.repair_request_closure_service import record_repair_request_closed
from backend.app.services.repair_request_list_query import fetch_repair_requests_page, suggest_repair_requests
from backend.app.services.tracker_service import TrackerUnavailableError, sync_repair_request_to_tracker

router = APIRouter(prefix="/api", tags=["repair-requests"])

_REPAIR_REQUEST_SORT_FIELDS: set[str] = {
    "created_at",
    "device_inventory_number",
    "applicant_name",
    "status",
}
_REPAIR_REQUEST_SUGGEST_FIELDS: set[str] = {"device", "applicant"}

ACTIVE_STATUSES = (RequestStatus.OPEN, RequestStatus.IN_PROGRESS)
ALLOWED_STATUS_TRANSITIONS = {
    RequestStatus.OPEN: {RequestStatus.OPEN, RequestStatus.IN_PROGRESS, RequestStatus.CLOSED},
    RequestStatus.IN_PROGRESS: {RequestStatus.IN_PROGRESS, RequestStatus.CLOSED},
    RequestStatus.CLOSED: {RequestStatus.CLOSED},
}


def get_repair_request_or_404(db: Session, request_id: UUID, *, for_tracker: bool = False) -> RepairRequest:
    q = db.query(RepairRequest).filter(RepairRequest.id == request_id)
    if for_tracker:
        q = q.options(joinedload(RepairRequest.device), joinedload(RepairRequest.author))
    repair_request = q.first()
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


def _try_tracker_sync(db: Session, request_id: UUID) -> bool:
    """Пытается создать/подтянуть задачу в Трекере. При ошибке не бросает исключение наружу."""
    repair_request = get_repair_request_or_404(db, request_id, for_tracker=True)
    try:
        result = sync_repair_request_to_tracker(repair_request)
    except TrackerUnavailableError:
        return False
    repair_request.tracker_ticket_id = result.ticket_id
    repair_request.tracker_ticket_key = result.ticket_key
    repair_request.tracker_ticket_url = result.ticket_url
    repair_request.last_sync_at = result.synced_at
    db.commit()
    return True


def _record_request_created(db: Session, repair_request: RepairRequest) -> None:
    device = db.query(Device).filter(Device.id == repair_request.device_id).first()
    if device is None:
        return
    old_rs = device.repair_status
    device.repair_status = RepairStatus.IN_REPAIR
    add_repair_history(
        db,
        device_id=device.id,
        repair_request_id=repair_request.id,
        old_status=old_rs,
        new_status=RepairStatus.IN_REPAIR,
        note="Создана заявка на ремонт",
    )


@router.get("/repair-requests/suggest", response_model=SuggestResponse)
def repair_request_suggest(
    field: str = Query(...),
    q: str = Query(..., min_length=1),
    db: Session = Depends(get_db),
    _: User = Depends(require_admin_or_sysadmin),
) -> SuggestResponse:
    if field not in _REPAIR_REQUEST_SUGGEST_FIELDS:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="invalid_suggest_field")
    return SuggestResponse(items=suggest_repair_requests(db, field, q))


@router.get("/repair-requests", response_model=RepairRequestList)
def list_repair_requests(
    device: str | None = Query(default=None, description="Filter by device inventory number or name"),
    applicant: str | None = Query(default=None, description="Filter by applicant name"),
    status_filter: RequestStatus | None = Query(default=None, alias="status"),
    device_id: UUID | None = None,
    author_user_id: UUID | None = None,
    date_from: datetime | None = None,
    date_to: datetime | None = None,
    sort_by: str = Query(default="created_at"),
    sort_dir: Literal["asc", "desc"] = Query(default="desc"),
    limit: int = Query(default=20, ge=1, le=50),
    offset: int = Query(default=0, ge=0),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin_or_sysadmin),
) -> RepairRequestList:
    if sort_by not in _REPAIR_REQUEST_SORT_FIELDS:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="invalid_sort_by")

    _ = device_id, author_user_id, date_from, date_to, current_user

    items, total = fetch_repair_requests_page(
        db,
        device=device,
        applicant=applicant,
        status=status_filter,
        sort_by=sort_by,  # type: ignore[arg-type]
        sort_dir=sort_dir,
        limit=limit,
        offset=offset,
    )
    return RepairRequestList(items=[_repair_request_list_item(item) for item in items], total=total)


def _repair_request_list_item(item: RepairRequest) -> RepairRequestResponse:
    payload = RepairRequestResponse.model_validate(item)
    if item.device is None:
        return payload
    return payload.model_copy(
        update={
            "device_inventory_number": item.device.inventory_number,
            "device_name": item.device.name,
        }
    )


@router.post(
    "/repair-requests/tracker/sync-unsynchronized",
    response_model=TrackerBulkSyncResponse,
    status_code=status.HTTP_200_OK,
)
def sync_unsynchronized_repair_requests(
    db: Session = Depends(get_db),
    _: User = Depends(require_admin_or_sysadmin),
) -> TrackerBulkSyncResponse:
    """Синхронизирует с Трекером все заявки без ticket id и key."""
    rows = (
        db.query(RepairRequest.id)
        .filter(
            and_(
                or_(RepairRequest.tracker_ticket_id.is_(None), RepairRequest.tracker_ticket_id == ""),
                or_(RepairRequest.tracker_ticket_key.is_(None), RepairRequest.tracker_ticket_key == ""),
            )
        )
        .order_by(RepairRequest.created_at.asc())
        .all()
    )
    attempted = len(rows)
    synced = 0
    failed = 0
    for (rid,) in rows:
        if _try_tracker_sync(db, rid):
            synced += 1
        else:
            failed += 1
    return TrackerBulkSyncResponse(attempted=attempted, synced=synced, failed=failed)


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
    db.flush()
    _record_request_created(db, repair_request)
    db.commit()
    db.refresh(repair_request)

    if payload.sync_to_tracker:
        _try_tracker_sync(db, repair_request.id)
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
    db.flush()
    _record_request_created(db, repair_request)
    db.commit()
    db.refresh(repair_request)

    _try_tracker_sync(db, repair_request.id)
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
        record_repair_request_closed(
            db,
            repair_request,
            current_user,
            payload.resolution_note,
            payload.resolution_desc,
        )
    else:
        repair_request.status = payload.status
        if payload.resolution_note is not None:
            repair_request.resolution_note = payload.resolution_note
        if payload.resolution_desc is not None:
            repair_request.resolution_desc = payload.resolution_desc
        add_repair_history(
            db,
            device_id=repair_request.device_id,
            repair_request_id=repair_request.id,
            old_status=None,
            new_status=None,
            note=f"Статус заявки изменён: {payload.status.value}",
        )

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
        add_repair_history(
            db,
            device_id=repair_request.device_id,
            repair_request_id=repair_request.id,
            old_status=None,
            new_status=None,
            note="Отмечено: забрал системный администратор",
        )

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

    record_repair_request_closed(
        db,
        repair_request,
        current_user,
        payload.resolution_note,
        payload.resolution_desc,
    )
    db.commit()
    db.refresh(repair_request)
    return RepairRequestDetail.model_validate(repair_request)


@router.patch("/repair-requests/{request_id}/publish", response_model=RepairRequestDetail)
def publish_repair_request(
    request_id: UUID,
    payload: RepairRequestPublish,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin_or_sysadmin),
) -> RepairRequestDetail:
    repair_request = get_repair_request_or_404(db, request_id)
    repair_request.is_published = payload.is_published
    db.commit()
    db.refresh(repair_request)
    return RepairRequestDetail.model_validate(repair_request)


@router.post("/repair-requests/{request_id}/tracker/sync", response_model=TrackerSyncResponse)
def sync_repair_request_tracker(
    request_id: UUID,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin_or_sysadmin),
) -> TrackerSyncResponse:
    repair_request = get_repair_request_or_404(db, request_id, for_tracker=True)
    try:
        result = sync_repair_request_to_tracker(repair_request)
    except TrackerUnavailableError:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="tracker_unavailable",
        ) from None

    repair_request.tracker_ticket_id = result.ticket_id
    repair_request.tracker_ticket_key = result.ticket_key
    repair_request.tracker_ticket_url = result.ticket_url
    repair_request.last_sync_at = result.synced_at
    db.commit()
    db.refresh(repair_request)

    return TrackerSyncResponse(
        tracker_ticket_id=result.ticket_id,
        tracker_ticket_key=result.ticket_key,
        tracker_ticket_url=result.ticket_url,
        last_sync_at=result.synced_at,
    )
