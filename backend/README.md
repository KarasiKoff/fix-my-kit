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
alembic -c backend/alembic.ini revision --autogenerate -m "init"
alembic -c backend/alembic.ini upgrade head
```

## Зависимости (текущий базовый набор)

- `fastapi`
- `uvicorn[standard]`
- `sqlalchemy`
- `psycopg[binary]`
- `pydantic-settings`
- `PyJWT`
- `python-multipart`
- `alembic`
