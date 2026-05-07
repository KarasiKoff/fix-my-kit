# Backend scaffold

Каркас backend-слоя на FastAPI без реализации таблиц и миграций.

## Структура

- `app/core` — конфигурация и подключение к БД.
- `app/api` — роуты и зависимости API.
- `app/schemas` — Pydantic-схемы.
- `app/services` — бизнес-слой (пока пусто).
- `app/models` — SQLAlchemy-модели (пока пусто).

## Запуск через Docker Compose

1. Скопируйте `.env.example` в `.env` в корне проекта.
2. Запустите:

```bash
docker compose up --build
```

Используется **один** корневой `Dockerfile` с target-стадиями:

- `backend` — Python/FastAPI
- `frontend` — Node/Vite

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

Из каталога `backend/`:

```bash
alembic revision --autogenerate -m "init"
alembic upgrade head
```

Как это работает:

- `alembic.ini` указывает на `backend/alembic/` (через `%(here)s`), поэтому команды одинаково работают из корня и из `backend`.
- `alembic/env.py` берёт `settings.database_url` из `app/core/config.py`.
- `Settings` читает `.env` из корня проекта (и как fallback — `backend/.env`), поэтому пропадает ошибка `POSTGRES_* Field required` из-за "не той папки запуска".

Структура конфига выполнена в стиле `ServerConfig` + `DbConfig` + общий `Settings` (аналогично старому проекту с разделением server/database блоков).

## Зависимости (текущий базовый набор)

- `fastapi`
- `uvicorn[standard]`
- `sqlalchemy`
- `psycopg[binary]`
- `pydantic-settings`
- `PyJWT`
- `python-multipart`
- `alembic`
