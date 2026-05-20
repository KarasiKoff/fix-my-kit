"""Вложения заявок: диск → Трекер, статусы, очистка."""

from __future__ import annotations

from dataclasses import dataclass
from datetime import UTC, datetime, timedelta
from uuid import UUID

from fastapi import HTTPException, UploadFile, status
from sqlalchemy.orm import Session

from backend.app.core.config import settings
from backend.app.models.enums import AttachmentsSyncStatus
from backend.app.models.repair_request import RepairRequest
from backend.app.services.attachment_storage import (
    PendingAttachment,
    cleanup_directory,
    count_pending,
    delete_pending_file,
    delete_stale_pending_files,
    iter_pending_request_dirs,
    list_pending,
    remove_pending_dir,
    save_pending_file,
)
from backend.app.services.attachment_validation import attachment_kind, is_allowed_attachment
from backend.app.services.tracker_service import (
    TrackerUnavailableError,
    issue_ref_for,
    list_issue_attachments,
    sync_repair_request_to_tracker,
    upload_issue_attachment,
)


class AttachmentLimitError(Exception):
    pass


class AttachmentValidationError(Exception):
    def __init__(self, code: str) -> None:
        self.code = code
        super().__init__(code)


@dataclass(frozen=True)
class AttachmentCleanupResult:
    orphan_dirs_removed: int
    stale_files_removed: int
    empty_dirs_removed: int


def max_per_request() -> int:
    return settings.server.attachment_max_per_request


def max_bytes() -> int:
    return settings.server.attachment_max_bytes


def recompute_attachment_fields(repair_request: RepairRequest) -> None:
    pending = count_pending(repair_request.id)
    synced = int(repair_request.attachments_synced_count or 0)
    total = pending + synced
    repair_request.attachments_count = total
    repair_request.has_attachments = total > 0
    if not repair_request.has_attachments:
        repair_request.attachments_sync_status = AttachmentsSyncStatus.NONE
        return
    if synced <= 0:
        repair_request.attachments_sync_status = AttachmentsSyncStatus.NONE
    elif pending > 0:
        repair_request.attachments_sync_status = AttachmentsSyncStatus.PARTIAL
    else:
        repair_request.attachments_sync_status = AttachmentsSyncStatus.COMPLETE


async def read_upload_limited(upload: UploadFile) -> bytes:
    max_size = max_bytes()
    chunks: list[bytes] = []
    total = 0
    while True:
        block = await upload.read(1024 * 1024)
        if not block:
            break
        total += len(block)
        if total > max_size:
            raise AttachmentValidationError("attachment_too_large")
        chunks.append(block)
    return b"".join(chunks)


async def validate_and_store_uploads(
    repair_request: RepairRequest,
    uploads: list[UploadFile],
) -> list[PendingAttachment]:
    if not uploads:
        return []
    pending_now = count_pending(repair_request.id)
    synced = int(repair_request.attachments_synced_count or 0)
    if pending_now + synced + len(uploads) > max_per_request():
        raise AttachmentLimitError("attachment_limit_reached")

    stored: list[PendingAttachment] = []
    for upload in uploads:
        name = upload.filename or "file"
        if not is_allowed_attachment(name, upload.content_type):
            raise AttachmentValidationError("attachment_type_not_allowed")
        data = await read_upload_limited(upload)
        if len(data) > max_bytes():
            raise AttachmentValidationError("attachment_too_large")
        item = save_pending_file(
            repair_request.id,
            original_name=name,
            data=data,
            mimetype=upload.content_type,
        )
        stored.append(item)

    repair_request.attachments_synced_count = synced
    recompute_attachment_fields(repair_request)
    return stored


def sync_pending_attachments_to_tracker(
    repair_request: RepairRequest,
) -> tuple[int, int]:
    """Загружает pending-файлы в Трекер. Возвращает (успешно, ошибок)."""
    ref = issue_ref_for(repair_request)
    if not ref:
        return 0, count_pending(repair_request.id)

    ok = 0
    failed = 0
    for item in list_pending(repair_request.id):
        try:
            upload_issue_attachment(ref, file_path=item.path, filename=item.original_name)
        except TrackerUnavailableError:
            failed += 1
            continue
        delete_pending_file(item.path)
        repair_request.attachments_synced_count = int(repair_request.attachments_synced_count or 0) + 1
        ok += 1

    recompute_attachment_fields(repair_request)
    directory_empty = count_pending(repair_request.id) == 0
    if directory_empty:
        remove_pending_dir(repair_request.id)
    return ok, failed


def sync_tracker_issue_and_attachments(db: Session, repair_request: RepairRequest) -> bool:
    """Создаёт/подтверждает задачу и догружает pending-вложения."""
    try:
        result = sync_repair_request_to_tracker(repair_request)
    except TrackerUnavailableError:
        return False

    repair_request.tracker_ticket_id = result.ticket_id
    repair_request.tracker_ticket_key = result.ticket_key
    repair_request.tracker_ticket_url = result.ticket_url
    repair_request.last_sync_at = result.synced_at
    db.flush()

    if count_pending(repair_request.id) > 0:
        sync_pending_attachments_to_tracker(repair_request)
    else:
        recompute_attachment_fields(repair_request)
    db.commit()
    return True


def run_attachment_cleanup(db: Session) -> AttachmentCleanupResult:
    max_age = timedelta(days=settings.server.attachment_orphan_max_age_days)
    valid_ids = {row[0] for row in db.query(RepairRequest.id).all()}

    orphan_dirs = 0
    stale_files = 0
    empty_dirs = 0

    for rid, path in iter_pending_request_dirs():
        if rid is None:
            cleanup_directory(path)
            orphan_dirs += 1
            continue
        if rid not in valid_ids:
            cleanup_directory(path)
            orphan_dirs += 1
            continue
        stale_files += delete_stale_pending_files(rid, max_age=max_age)
        if count_pending(rid) == 0:
            remove_pending_dir(rid)
            empty_dirs += 1
            rr = db.query(RepairRequest).filter(RepairRequest.id == rid).first()
            if rr is not None:
                recompute_attachment_fields(rr)

    db.commit()
    return AttachmentCleanupResult(
        orphan_dirs_removed=orphan_dirs,
        stale_files_removed=stale_files,
        empty_dirs_removed=empty_dirs,
    )


def tracker_attachment_kind(meta_mimetype: str | None, name: str) -> str:
    return attachment_kind(name, meta_mimetype)


def http_error_from_attachment_exc(exc: Exception) -> HTTPException:
    if isinstance(exc, AttachmentLimitError):
        return HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="attachment_limit_reached",
        )
    if isinstance(exc, AttachmentValidationError):
        return HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=exc.code)
    if isinstance(exc, TrackerUnavailableError):
        return HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail="tracker_unavailable")
    raise exc
