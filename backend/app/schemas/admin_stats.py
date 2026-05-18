from datetime import date, datetime
from uuid import UUID

from pydantic import BaseModel


class RepairRequestStats(BaseModel):
    total: int
    open: int
    in_progress: int
    resolved: int
    wont_fix: int
    tracker_synced: int


class CatalogStats(BaseModel):
    devices_total: int
    categories_total: int
    audiences_total: int


class CategoryDeviceCount(BaseModel):
    category_id: UUID | None
    category_name: str
    device_count: int
    share_percent: float


class TrackerSyncEvent(BaseModel):
    repair_request_id: UUID
    tracker_ticket_key: str | None
    tracker_ticket_url: str | None
    last_sync_at: datetime


class AdminStatsResponse(BaseModel):
    date_from: date | None
    date_to: date | None
    repair_requests: RepairRequestStats
    catalog: CatalogStats
    devices_by_category: list[CategoryDeviceCount]
    last_tracker_sync_at: datetime | None
    recent_tracker_syncs: list[TrackerSyncEvent]
