FROM python:3.14-alpine AS backend

WORKDIR /app

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

COPY backend/requirements.txt ./requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

COPY backend/ ./

EXPOSE 8000

CMD ["sh", "-c", "if [ -f alembic.ini ]; then alembic upgrade head; fi && uvicorn app.main:app --host 0.0.0.0 --port 8000 --log-level info"]


FROM node:22-alpine AS frontend

WORKDIR /app

COPY frontend/package*.json ./
RUN npm install

COPY frontend/ ./

ARG VITE_PROXY_TARGET=http://backend:8000
ENV VITE_PROXY_TARGET=${VITE_PROXY_TARGET}

EXPOSE 5173

CMD ["sh", "-c", "npm run dev -- --host 0.0.0.0 --port 5173"]
