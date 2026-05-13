from pydantic import BaseModel, ConfigDict


class AudienceBase(BaseModel):
    name: str


class AudienceCreate(BaseModel):
    name: str


class Audience(AudienceBase):
    model_config = ConfigDict(from_attributes=True)

    id: int


class AudienceList(BaseModel):
    items: list[Audience]
