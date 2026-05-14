"""Входящие HTTP-вызовы из триггеров Yandex Tracker"""

import hmac
import logging
from typing import Annotated

from fastapi import APIRouter, Depends, Header, HTTPException, Request, status
from sqlalchemy import func
from sqlalchemy.orm import Session

from backend.app.api.deps import get_db
from backend.app.core.config import settings
from backend.app.models.device import Device
from backend.app.models.enums import RepairStatus, RequestStatus
from backend.app.models.repair_request import RepairRequest
from backend.app.models.user import User
from backend.app.schemas.tracker_webhook import (
    YandexTrackerWebhookPayload,
    YandexTrackerWebhookResponse,
)
from backend.app.services.repair_history_service import add_repair_history
from backend.app.services.repair_request_closure_service import (
    record_repair_request_closed,
)

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/webhooks", tags=["webhooks"])

TRACKER_WEBHOOK_SECRET_HEADER = "X-Tracker-Webhook-Secret"

# Куда вебхук может перевести заявку из текущего статуса
WEBHOOK_ALLOWED: dict[RequestStatus, set[RequestStatus]] = {
    RequestStatus.OPEN: {
        RequestStatus.OPEN,
        RequestStatus.IN_PROGRESS,
        RequestStatus.CLOSED,
    },
    RequestStatus.IN_PROGRESS: {
        RequestStatus.OPEN,
        RequestStatus.IN_PROGRESS,
        RequestStatus.CLOSED,
    },
    RequestStatus.CLOSED: {
        RequestStatus.OPEN,
        RequestStatus.IN_PROGRESS,
        RequestStatus.CLOSED,
    },
}

# Строка как приходит из Трекера (после strip). Пока пусто — дополняйте по логам / ответу 400.
TRACKER_STATUS_ALIASES: dict[str, RequestStatus] = {}


def _map_tracker_status_to_request(raw: str) -> RequestStatus | None:
    """None — в payload нет статуса: только закрытие. Иначе ищем точное совпадение в TRACKER_STATUS_ALIASES."""
    if not raw or not raw.strip():
        return None
    return TRACKER_STATUS_ALIASES.get(raw.strip())


def _resolve_closing_user(
    db: Session, tracker_user_raw: str | None, fallback: User
) -> User:
    raw = (tracker_user_raw or "").strip()
    if not raw:
        return fallback
    u = db.query(User).filter(User.login == raw, User.is_active.is_(True)).first()
    if u is not None:
        return u
    u = (
        db.query(User)
        .filter(func.lower(User.login) == func.lower(raw), User.is_active.is_(True))
        .first()
    )
    if u is not None:
        return u
    u = db.query(User).filter(User.full_name == raw, User.is_active.is_(True)).first()
    if u is not None:
        return u
    u = (
        db.query(User)
        .filter(func.lower(User.full_name) == func.lower(raw), User.is_active.is_(True))
        .first()
    )
    if u is not None:
        return u
    return fallback


def _verify_webhook_secret(header_value: str | None) -> None:
    expected = (settings.server.tracker_webhook_secret or "").strip()
    if not expected:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="webhook_not_configured",
        )
    if not header_value:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="missing_webhook_secret"
        )
    a = header_value.encode("utf-8")
    b = expected.encode("utf-8")
    if len(a) != len(b) or not hmac.compare_digest(a, b):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="invalid_webhook_secret"
        )


def _find_repair_request(
    db: Session, issue_key: str, issue_id: str
) -> RepairRequest | None:
    q = db.query(RepairRequest)
    if issue_key:
        return q.filter(RepairRequest.tracker_ticket_key == issue_key).first()
    return q.filter(RepairRequest.tracker_ticket_id == issue_id).first()


def _reopen_from_closed(db: Session, repair_request: RepairRequest) -> None:
    """Переоткрытие из Закрыт: сбрасываем поля закрытия, устройство снова в ремонте."""
    repair_request.closed_at = None
    repair_request.closed_by_user_id = None
    device = db.query(Device).filter(Device.id == repair_request.device_id).first()
    if device is not None:
        device.repair_status = RepairStatus.IN_REPAIR


@router.post(
    "/yandex-tracker",
    response_model=YandexTrackerWebhookResponse,
    summary="Синхронизация заявки по событию из Yandex Tracker",
    description=(
        "Один URL. В JSON: `tracker_status` = `{{issue.status}}` — строка как в Трекере, "
        "точное совпадение с ключами в `TRACKER_STATUS_ALIASES`"
        "Пустой `tracker_status` — только закрытие заявки. "
        f"Заголовок `{TRACKER_WEBHOOK_SECRET_HEADER}` = `TRACKER_WEBHOOK_SECRET`."
    ),
)
def yandex_tracker_close_repair_request(
    request: Request,
    payload: YandexTrackerWebhookPayload,
    db: Session = Depends(get_db),
    x_tracker_webhook_secret: Annotated[
        str | None, Header(alias=TRACKER_WEBHOOK_SECRET_HEADER)
    ] = None,
) -> YandexTrackerWebhookResponse:
    _verify_webhook_secret(x_tracker_webhook_secret)

    client = request.client.host if request.client else None
    logger.info(
        "yandex_tracker_webhook payload=%s client=%s",
        payload.model_dump(),
        client,
    )

    login = (
        settings.server.tracker_webhook_actor_login or "tracker_webhook"
    ).strip() or "tracker_webhook"
    fallback = db.query(User).filter(User.login == login).first()
    if fallback is None:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="webhook_actor_missing_restart_app",
        )

    actor = _resolve_closing_user(db, payload.user, fallback)
    logger.info(
        "yandex_tracker_webhook resolved closed_by login=%s used_tracker_fallback=%s",
        actor.login,
        actor.id == fallback.id,
    )

    key = (payload.issue_key or "").strip()
    iid = (payload.issue_id or "").strip()
    repair_request = _find_repair_request(db, key, iid)
    if repair_request is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="repair_request_not_found_for_tracker_issue",
        )

    raw_status = (payload.tracker_status or "").strip()
    mapped = _map_tracker_status_to_request(raw_status) if raw_status else None
    if raw_status and mapped is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"code": "unmapped_tracker_status", "value": raw_status},
        )
    target: RequestStatus = mapped if mapped is not None else RequestStatus.CLOSED

    if repair_request.status == target:
        return YandexTrackerWebhookResponse(
            status="noop",
            repair_request_id=str(repair_request.id),
            detail="already_in_target_status",
            request_status=repair_request.status.value,
            closed_by_login=None,
        )

    if target not in WEBHOOK_ALLOWED[repair_request.status]:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="invalid_status_transition",
        )

    rid = str(repair_request.id)

    if target == RequestStatus.CLOSED:
        record_repair_request_closed(db, repair_request, actor, payload.resolution)
        db.commit()
        return YandexTrackerWebhookResponse(
            status="closed",
            repair_request_id=rid,
            detail=None,
            request_status=RequestStatus.CLOSED.value,
            closed_by_login=actor.login,
        )

    if repair_request.status == RequestStatus.CLOSED:
        _reopen_from_closed(db, repair_request)

    repair_request.status = target
    if payload.resolution is not None:
        repair_request.resolution_note = payload.resolution
    add_repair_history(
        db,
        device_id=repair_request.device_id,
        repair_request_id=repair_request.id,
        old_status=None,
        new_status=None,
        note=f"Статус из Трекера: {raw_status or target.value}",
    )
    db.commit()

    return YandexTrackerWebhookResponse(
        status="updated",
        repair_request_id=rid,
        detail=None,
        request_status=target.value,
        closed_by_login=None,
    )
