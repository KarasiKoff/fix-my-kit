from collections.abc import AsyncIterator
from contextlib import asynccontextmanager

from backend.app.core.config import settings

from backend.app.api.router import api_router 
from backend.app.services.admin_bootstrap import ensure_admin_user 
from backend.app.services.tracker_webhook_bootstrap import ensure_tracker_webhook_actor  
from fastapi import FastAPI 
from fastapi.middleware.cors import CORSMiddleware 


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncIterator[None]:
    ensure_admin_user()
    ensure_tracker_webhook_actor()
    yield


app = FastAPI(title=settings.app_name, lifespan=lifespan)

_cors_raw = (settings.server.cors_origins or "").strip()
_cors_origins = [o.strip() for o in _cors_raw.split(",") if o.strip()]
if _cors_origins:
    app.add_middleware(
        CORSMiddleware,
        allow_origins=_cors_origins,
        allow_credentials=False,
        allow_methods=["*"],
        allow_headers=["*"],
    )

app.include_router(api_router)


@app.get("/health", tags=["health"])
def health() -> dict[str, str]:
    return {"status": "ok"}
