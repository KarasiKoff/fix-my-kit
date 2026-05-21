from pydantic import BaseModel, Field


class TrackerAttachmentItem(BaseModel):
    id: str
    name: str
    kind: str = Field(description="image | video")
    mimetype: str | None = None
    size: int | None = None
    has_thumbnail: bool = False
    created_at: str | None = None


class TrackerAttachmentList(BaseModel):
    items: list[TrackerAttachmentItem]


class AttachmentCleanupResponse(BaseModel):
    orphan_dirs_removed: int
    stale_files_removed: int
    empty_dirs_removed: int
