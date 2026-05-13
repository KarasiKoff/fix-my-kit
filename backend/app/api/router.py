from fastapi import APIRouter

from backend.app.api.routes.auth import router as auth_router
from backend.app.api.routes.devices import router as devices_router
from backend.app.api.routes.categories import router as categories_router
from backend.app.api.routes.audiences import router as audiences_router
from backend.app.api.routes.health import router as health_router
from backend.app.api.routes.repair_requests import router as repair_requests_router
from backend.app.api.routes.public import router as public_router
from backend.app.api.routes.users import router as users_router

api_router = APIRouter()
api_router.include_router(auth_router)
api_router.include_router(devices_router)
api_router.include_router(categories_router)
api_router.include_router(audiences_router)
api_router.include_router(health_router, tags=["health"])
api_router.include_router(repair_requests_router)
api_router.include_router(users_router)
api_router.include_router(public_router)
