import logging
import sys
from collections.abc import AsyncIterator
from contextlib import asynccontextmanager

from backend.app.core.config import settings

# До импорта роутов: чтобы logger в handlers (webhooks и т.д.) писал в консоль Docker.
_log = logging.getLogger("backend")
if not _log.handlers:
    _lvl = getattr(logging, (settings.log_level or "INFO").upper(), logging.INFO)
    _log.setLevel(_lvl)
    _h = logging.StreamHandler(sys.stderr)
    _h.setLevel(_lvl)
    _h.setFormatter(logging.Formatter("%(levelname)s:%(name)s:%(message)s"))
    _log.addHandler(_h)
    _log.propagate = False

from backend.app.api.router import api_router  # noqa: E402
from backend.app.services.admin_bootstrap import ensure_admin_user  # noqa: E402
from backend.app.services.tracker_webhook_bootstrap import ensure_tracker_webhook_actor  # noqa: E402
from fastapi import FastAPI  # noqa: E402
from fastapi.middleware.cors import CORSMiddleware  # noqa: E402


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
