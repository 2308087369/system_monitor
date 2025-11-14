#!/usr/bin/env bash
set -euo pipefail

ENV_NAME="${1:-prod}"
BASE_DIR="$(cd "$(dirname "$0")/.." && pwd)"
RUN_DIR="$BASE_DIR/scripts/run"
mkdir -p "$RUN_DIR"

case "$ENV_NAME" in
  prod)
    BACKEND_PORT=6996
    FRONTEND_PORT=6997
    ;;
  formal)
    BACKEND_PORT=6994
    FRONTEND_PORT=6995
    ;;
  *)
    echo "invalid env" && exit 1
    ;;
esac

# 从环境变量读取API_URL，如果没有则使用占位符
API_URL="${NEXT_PUBLIC_API_URL:-http://YOUR_SERVER_IP:${BACKEND_PORT}}"

cd "$BASE_DIR/frontend"
pnpm install
NEXT_PUBLIC_API_URL="$API_URL" NODE_ENV=production pnpm build
PORT="$FRONTEND_PORT" nohup env NEXT_PUBLIC_API_URL="$API_URL" NODE_ENV=production pnpm start > "$RUN_DIR/frontend-${ENV_NAME}.log" 2>&1 & echo $! > "$RUN_DIR/frontend-${ENV_NAME}.pid"

cd "$BASE_DIR"
python3 -m venv .venv || true
. .venv/bin/activate
pip install --upgrade pip
pip install fastapi uvicorn pydantic starlette
nohup .venv/bin/python -m uvicorn routers.main:app --host 0.0.0.0 --port "$BACKEND_PORT" > "$RUN_DIR/backend-${ENV_NAME}.log" 2>&1 & echo $! > "$RUN_DIR/backend-${ENV_NAME}.pid"

echo "frontend:${FRONTEND_PORT} backend:${BACKEND_PORT}"