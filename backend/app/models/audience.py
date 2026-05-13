from sqlalchemy import Column, Integer, String

from backend.app.models.base import Base


class Audience(Base):
    __tablename__ = "audience"

    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String, nullable=False, unique=True)
