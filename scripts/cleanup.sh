#!/usr/bin/env bash
set -euo pipefail

# 清理本地构建文件和依赖
echo '🧹 清理本地构建文件和依赖...'

# 清理前端构建文件和依赖
if [ -d "frontend/node_modules" ]; then
    echo '🗑️  删除 frontend/node_modules...'
    rm -rf frontend/node_modules
fi

if [ -d "frontend/.next" ]; then
    echo '🗑️  删除 frontend/.next...'
    rm -rf frontend/.next
fi

# 清理Python缓存
find . -type d -name "__pycache__" -exec rm -rf {} + 2>/dev/null || true
find . -name "*.pyc" -delete 2>/dev/null || true

# 清理日志文件
if [ -d "scripts/run" ]; then
    echo '🗑️  清理日志文件...'
    rm -f scripts/run/*.log
fi

echo '✅ 清理完成！'
echo '💡 提示：运行 ./scripts/setup.sh dev 重新安装依赖'