from pydantic import BaseModel, ConfigDict, Field, field_validator, model_validator


class YandexTrackerWebhookPayload(BaseModel):
    """Тело POST из триггера Yandex Tracker"""

    model_config = ConfigDict(extra="ignore")

    issue_key: str | None = Field(
        default=None, description="Ключ задачи, например FixMyKit-666"
    )
    issue_id: str | None = Field(
        default=None,
        description="Id задачи в Yandex Tracker",
    )
    resolution: str | None = Field(
        default=None, description="Текст резолюции / комментарий"
    )
    tracker_status: str | None = Field(
        default=None,
        description=(
            "Строка статуса из Tracker (например {{issue.status}}), точное совпадение с ключами "
            "TRACKER_STATUS_ALIASES в backend."
        ),
    )
    user: str | None = Field(
        default=None,
        description=("Кто закрыл в Yandex Tracker"),
    )

    @field_validator("issue_id", mode="before")
    @classmethod
    def issue_id_as_str(cls, v: object) -> str | None:
        if v is None:
            return None
        s = str(v).strip()
        return s or None

    @model_validator(mode="after")
    def require_issue_ref(self) -> "YandexTrackerWebhookPayload":
        key = (self.issue_key or "").strip()
        iid = (self.issue_id or "").strip()
        if not key and not iid:
            raise ValueError("issue_key or issue_id is required")
        return self


class YandexTrackerWebhookResponse(BaseModel):
    status: str
    repair_request_id: str | None = None
    detail: str | None = None
    request_status: str | None = Field(
        default=None,
        description="Статус заявки после обработки",
    )
    closed_by_login: str | None = Field(
        default=None, description="Кого записали в closed_by (login), только при closed"
    )
