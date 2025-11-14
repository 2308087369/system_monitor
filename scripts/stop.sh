#!/usr/bin/env bash
set -euo pipefail

BASE_DIR="$(cd "$(dirname "$0")/.." && pwd)"
RUN_DIR="$BASE_DIR/scripts/run"

if [ -d "$RUN_DIR" ]; then
    echo "🛑 停止所有服务..."

    # 停止后端服务
    if [ -f "$RUN_DIR/backend-prod.pid" ]; then
        PID=$(cat "$RUN_DIR/backend-prod.pid")
        if kill -0 "$PID" 2>/dev/null; then
            kill "$PID"
            echo "✅ 已停止后端服务 (PID: $PID)"
        fi
        rm -f "$RUN_DIR/backend-prod.pid"
    fi

    if [ -f "$RUN_DIR/backend-formal.pid" ]; then
        PID=$(cat "$RUN_DIR/backend-formal.pid")
        if kill -0 "$PID" 2>/dev/null; then
            kill "$PID"
            echo "✅ 已停止正式环境后端服务 (PID: $PID)"
        fi
        rm -f "$RUN_DIR/backend-formal.pid"
    fi

    # 停止前端服务
    if [ -f "$RUN_DIR/frontend-prod.pid" ]; then
        PID=$(cat "$RUN_DIR/frontend-prod.pid")
        if kill -0 "$PID" 2>/dev/null; then
            kill "$PID"
            echo "✅ 已停止前端服务 (PID: $PID)"
        fi
        rm -f "$RUN_DIR/frontend-prod.pid"
    fi

    if [ -f "$RUN_DIR/frontend-formal.pid" ]; then
        PID=$(cat "$RUN_DIR/frontend-formal.pid")
        if kill -0 "$PID" 2>/dev/null; then
            kill "$PID"
            echo "✅ 已停止正式环境前端服务 (PID: $PID)"
        fi
        rm -f "$RUN_DIR/frontend-formal.pid"
    fi

    echo "✅ 所有服务已停止"
else
    echo "ℹ️  没有找到运行中的服务"
fi