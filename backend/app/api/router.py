from fastapi import APIRouter

from backend.app.api.routes.auth import router as auth_router
from backend.app.api.routes.devices import router as devices_router
from backend.app.api.routes.health import router as health_router

api_router = APIRouter()
api_router.include_router(auth_router)
api_router.include_router(devices_router)
api_router.include_router(health_router, tags=["health"])
