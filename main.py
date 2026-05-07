from backend.app.api.router import api_router
from backend.app.core.config import settings
from fastapi import FastAPI

app = FastAPI(title=settings.app_name)
app.include_router(api_router)


@app.get("/health", tags=["health"])
def health() -> dict[str, str]:
    return {"status": "ok"}
