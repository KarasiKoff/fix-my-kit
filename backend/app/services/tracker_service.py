from __future__ import annotations

import json
from dataclasses import dataclass
from datetime import UTC, datetime
from urllib import error, request
from urllib.parse import quote

from backend.app.core.config import settings
from backend.app.models.repair_request import RepairRequest


class TrackerUnavailableError(Exception):
    """Ошибка сети, HTTP или неожиданный ответ Трекера."""

    def __init__(self, message: str) -> None:
        super().__init__(message)
        self.message = message


@dataclass(frozen=True)
class TrackerIssueResult:
    ticket_id: str
    ticket_key: str
    ticket_url: str
    synced_at: datetime


def _require_tracker_config() -> tuple[str, str, str, str]:
    s = settings.server
    if not s.tracker_token:
        raise TrackerUnavailableError("TRACKER_TOKEN is not set")
    if not s.tracker_org_id:
        raise TrackerUnavailableError("TRACKER_ORG_ID is not set")
    if not s.tracker_queue:
        raise TrackerUnavailableError("TRACKER_QUEUE is not set")
    base = s.tracker_base_url.rstrip("/")
    return base, s.tracker_token, s.tracker_org_id, s.tracker_queue


def _tracker_headers(
    token: str, org_id: str, *, json_body: bool = False
) -> dict[str, str]:
    headers: dict[str, str] = {
        "Authorization": f"OAuth {token}",
        "X-Cloud-Org-ID": org_id,
    }
    if json_body:
        headers["Content-Type"] = "application/json"
    return headers


def _parse_issue_response(body: dict) -> TrackerIssueResult:
    ticket_id = str(body.get("id") or "")
    ticket_key = str(body.get("key") or "")
    # В ответе API поле self — URL вида api.tracker.yandex.net/.../issues/KEY; для UI нужна ссылка на веб-Трекер.
    if ticket_key:
        ticket_url = f"https://tracker.yandex.ru/{ticket_key}"
    else:
        ticket_url = str(body.get("self") or "")
    if not ticket_id or not ticket_key or not ticket_url:
        raise TrackerUnavailableError("tracker_response_missing_fields")
    return TrackerIssueResult(
        ticket_id=ticket_id,
        ticket_key=ticket_key,
        ticket_url=ticket_url,
        synced_at=datetime.now(UTC),
    )


def _request_json(
    method: str,
    url: str,
    *,
    token: str,
    org_id: str,
    data: dict | None = None,
) -> dict:
    payload = json.dumps(data).encode("utf-8") if data is not None else None
    req = request.Request(
        url,
        data=payload,
        method=method,
        headers=_tracker_headers(token, org_id, json_body=data is not None),
    )
    timeout = settings.server.tracker_timeout_seconds
    try:
        with request.urlopen(req, timeout=timeout) as resp:
            return json.loads(resp.read().decode("utf-8"))
    except error.HTTPError as exc:
        text = exc.read().decode("utf-8", errors="replace")
        raise TrackerUnavailableError(f"tracker_http_{exc.code}: {text}") from exc
    except error.URLError as exc:
        raise TrackerUnavailableError(f"tracker_network: {exc.reason}") from exc
    except json.JSONDecodeError as exc:
        raise TrackerUnavailableError("tracker_invalid_json") from exc


def _requester_line(repair_request: RepairRequest) -> str:
    """Публичная заявка — applicant_name; из под учётки — ФИО (или логин) автора."""
    if repair_request.author_user_id is None:
        return (repair_request.applicant_name or "не указано").strip() or "не указано"
    author = repair_request.author
    if author is None:
        return "не указано"
    if author.full_name and author.full_name.strip():
        return author.full_name.strip()
    return (author.login or str(author.id)).strip()


def _build_issue_payload(repair_request: RepairRequest, queue: str) -> dict:
    device = repair_request.device
    device_name = device.name if device is not None else "устройство (нет данных)"
    audience_name = (
        device.audience.name
        if device is not None and device.audience is not None
        else None
    )
    inv = device.inventory_number if device is not None else None
    audience_display = (
        audience_name.strip() if audience_name and str(audience_name).strip() else "—"
    )
    inv_display = inv if inv else "—"

    audience_part = (
        f", аудитория {audience_name}"
        if audience_name and str(audience_name).strip()
        else ""
    )
    summary = f"Ремонт: {device_name}{audience_part}"
    summary = summary[:255]

    requester = _requester_line(repair_request)

    desc_text = (repair_request.description or "—").strip() or "—"
    desc_lines = desc_text.splitlines()
    quoted_desc = "\n".join(f"> {line}" if line else ">" for line in desc_lines)

    lines: list[str] = [
        "### Устройство",
        f"- **Название:** {device_name}",
        f"- **Аудитория:** {audience_display}",
        f"- **Инв. номер:** {inv_display}",
        "",
        "### Заявитель",
        requester,
        "",
        "### Описание проблемы",
        quoted_desc,
        "",
        "### Отладка",
        f"- **id заявки:** `{repair_request.id}`",
        f"- **id устройства:** `{repair_request.device_id}`",
    ]
    if repair_request.author_user_id is not None:
        lines.append(f"- **id автора:** `{repair_request.author_user_id}`")

    return {
        "queue": queue,
        "summary": summary,
        "description": "\n".join(lines),
    }


def _fetch_issue(
    base_url: str, token: str, org_id: str, issue_ref: str
) -> TrackerIssueResult:
    safe_ref = quote(str(issue_ref), safe="")
    url = f"{base_url}/issues/{safe_ref}/"
    body = _request_json("GET", url, token=token, org_id=org_id)
    return _parse_issue_response(body)


def _create_issue(repair_request: RepairRequest) -> TrackerIssueResult:
    base_url, token, org_id, queue = _require_tracker_config()
    payload = _build_issue_payload(repair_request, queue)
    url = f"{base_url}/issues/"
    body = _request_json("POST", url, token=token, org_id=org_id, data=payload)
    return _parse_issue_response(body)


def sync_repair_request_to_tracker(repair_request: RepairRequest) -> TrackerIssueResult:
    """Создаёт задачу в Трекере или подтверждает существующую по ключу/id в БД."""
    base_url, token, org_id, _queue = _require_tracker_config()
    issue_ref = repair_request.tracker_ticket_key or repair_request.tracker_ticket_id
    if issue_ref:
        return _fetch_issue(base_url, token, org_id, issue_ref)
    return _create_issue(repair_request)


SYSADMIN_TAKEN_TRACKER_COMMENT = (
    "В **Fix My Kit** добавлена пометка: устройство **забрал системный администратор**."
)
SYSADMIN_RETURNED_TRACKER_COMMENT = (
    "В **Fix My Kit** снята пометка «забрал сисадмин» — устройство на месте."
)


def post_issue_comment(issue_ref: str, text: str, *, markup_md: bool = True) -> None:
    """Комментарий в задачу от имени OAuth-токена"""
    ref = (issue_ref or "").strip()
    if not ref:
        raise TrackerUnavailableError("tracker_issue_ref_missing")
    if not (text or "").strip():
        raise TrackerUnavailableError("tracker_comment_text_empty")
    base_url, token, org_id, _ = _require_tracker_config()
    safe_ref = quote(ref, safe="")
    url = f"{base_url}/issues/{safe_ref}/comments"
    payload: dict = {"text": text.strip()}
    if markup_md:
        payload["markupType"] = "md"
    _request_json("POST", url, token=token, org_id=org_id, data=payload)
