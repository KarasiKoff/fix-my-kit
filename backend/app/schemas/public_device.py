from uuid import UUID

from pydantic import BaseModel, ConfigDict

from backend.app.schemas.audience import Audience
from backend.app.schemas.category import Category


class PublicDeviceResponse(BaseModel):
    """Минимальные данные устройства для публичной формы заявки (без авторизации)."""

    model_config = ConfigDict(from_attributes=True)

    id: UUID
    inventory_number: str
    name: str
    category: Category | None = None
    audience: Audience | None = None
