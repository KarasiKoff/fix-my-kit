# Backend scaffold

Каркас backend-слоя на FastAPI без реализации таблиц и миграций.

## Структура

- `app/core` — конфигурация и подключение к БД.
- `app/api` — роуты и зависимости API.
- `app/schemas` — Pydantic-схемы.
- `app/services` — бизнес-слой (пока пусто).
- `app/repositories` — слой доступа к данным (пока пусто).
- `app/models` — SQLAlchemy-модели (пока пусто).

## Запуск через Docker Compose

1. Скопируйте `.env.example` в `.env` в корне проекта.
2. Запустите:

```bash
docker compose up --build
```

## Локальный запуск через UV

1. Установите `uv`: https://docs.astral.sh/uv/getting-started/installation/ или pip install uv
2. Установите зависимости из директории `backend`:

```bash
uv sync
```

3. Запустите приложение:

```bash
uv run uvicorn app.main:app --reload
```

## Проверка

- `GET /health` — liveness.
- `GET /health/ready` — проверка подключения к PostgreSQL (`SELECT 1`).

## Alembic (каркас готов)

В репозитории уже подготовлены:
- `alembic.ini`
- `alembic/env.py`
- `alembic/versions/`

Остаётся только создавать миграции.

Из **корня репозитория** (рядом с `.env`):

```bash
uv --directory backend run alembic -c alembic.ini revision --autogenerate -m "init"
uv --directory backend run alembic -c alembic.ini upgrade head
```

## Зависимости

Зависимости backend описаны в `pyproject.toml` и устанавливаются через UV.

Текущий базовый набор:

- `fastapi`
- `uvicorn[standard]`
- `sqlalchemy`
- `psycopg[binary]`
- `pydantic-settings`
- `PyJWT`
- `python-multipart`
- `alembic`
