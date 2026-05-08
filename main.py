from collections.abc import AsyncIterator
from contextlib import asynccontextmanager

from backend.app.api.router import api_router
from backend.app.core.config import settings
from backend.app.services.admin_bootstrap import ensure_admin_user
from fastapi import FastAPI


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncIterator[None]:
    ensure_admin_user()
    yield


app = FastAPI(title=settings.app_name, lifespan=lifespan)
app.include_router(api_router)


@app.get("/health", tags=["health"])
def health() -> dict[str, str]:
    return {"status": "ok"}
