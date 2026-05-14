"""Входящие HTTP-вызовы из триггеров Yandex Tracker"""

import hmac
import logging
from typing import Annotated

from fastapi import APIRouter, Depends, Header, HTTPException, Request, status
from sqlalchemy import func
from sqlalchemy.orm import Session

from backend.app.api.deps import get_db
from backend.app.core.config import settings
from backend.app.models.enums import RequestStatus
from backend.app.models.repair_request import RepairRequest
from backend.app.models.user import User
from backend.app.schemas.tracker_webhook import (
    YandexTrackerWebhookPayload,
    YandexTrackerWebhookResponse,
)
from backend.app.services.repair_request_closure_service import (
    record_repair_request_closed,
)

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/webhooks", tags=["webhooks"])

TRACKER_WEBHOOK_SECRET_HEADER = "X-Tracker-Webhook-Secret"

ACTIVE_FOR_CLOSE = (RequestStatus.OPEN, RequestStatus.IN_PROGRESS)


def _resolve_closing_user(
    db: Session, tracker_user_raw: str | None, fallback: User
) -> User:
    """Сопоставляет строку из Tracker с users.login или full_name."""
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


@router.post(
    "/yandex-tracker",
    response_model=YandexTrackerWebhookResponse,
    summary="Закрытие заявки по событию из Yandex Tracker",
    description=("Настройте в очереди Tracker триггер «HTTP-запрос»"),
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
    used_fallback = actor.id == fallback.id
    logger.info(
        "yandex_tracker_webhook resolved closed_by login=%s used_tracker_fallback=%s",
        actor.login,
        used_fallback,
    )
    key = (payload.issue_key or "").strip()
    iid = (payload.issue_id or "").strip()

    q = db.query(RepairRequest).filter(RepairRequest.status.in_(ACTIVE_FOR_CLOSE))
    if key:
        repair_request = q.filter(RepairRequest.tracker_ticket_key == key).first()
    else:
        repair_request = q.filter(RepairRequest.tracker_ticket_id == iid).first()

    if repair_request is None:
        q_closed = db.query(RepairRequest.id).filter(
            RepairRequest.status == RequestStatus.CLOSED
        )
        if key:
            q_closed = q_closed.filter(RepairRequest.tracker_ticket_key == key)
        else:
            q_closed = q_closed.filter(RepairRequest.tracker_ticket_id == iid)
        closed = q_closed.first()
        if closed is not None:
            return YandexTrackerWebhookResponse(
                status="already_closed",
                repair_request_id=str(closed[0]),
                detail="repair_request_already_closed",
                closed_by_login=None,
            )
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="repair_request_not_found_for_tracker_issue",
        )

    record_repair_request_closed(db, repair_request, actor, payload.resolution)
    db.commit()

    return YandexTrackerWebhookResponse(
        status="closed",
        repair_request_id=str(repair_request.id),
        detail=None,
        closed_by_login=actor.login,
    )
