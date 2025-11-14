#!/usr/bin/env bash
set -euo pipefail

# Systemd Service Monitor - 初始设置脚本
# 用于首次部署时初始化项目

echo "🚀 Systemd Service Monitor - 初始设置"
echo "=================================="

# 检查是否提供了环境参数
ENV_TYPE="${1:-dev}"
case "$ENV_TYPE" in
  dev|development)
    ENV_FILE=".env.local"
    echo "📋 开发环境设置"
    ;;
  prod|production)
    ENV_FILE=".env.production"
    echo "🚀 生产环境设置"
    ;;
  *)
    echo "❌ 错误: 请指定环境类型 (dev 或 prod)"
    exit 1
    ;;
esac

# 创建环境变量文件
if [ ! -f "$ENV_FILE" ]; then
    echo "📄 创建环境变量文件: $ENV_FILE"
    cp "$ENV_FILE.example" "$ENV_FILE"
    echo "⚠️  请编辑 $ENV_FILE 文件，设置您的配置:"
    echo "   - JWT_SECRET: 设置强密钥"
    echo "   - ADMIN_PASSWORD: 设置管理员密码"
    echo "   - USER_PASSWORD: 设置用户密码"
    echo "   - NEXT_PUBLIC_API_URL: 设置API地址"
else
    echo "✅ 环境变量文件已存在: $ENV_FILE"
fi

# 初始化示例数据库
echo "📊 初始化示例数据库..."
python3 scripts/init_example_db.py

# 创建空的监控服务配置文件
if [ ! -f "monitored_services.json" ]; then
    echo "[]" > monitored_services.json
    echo "✅ 创建监控服务配置文件"
fi

# 安装后端依赖
echo "📦 安装后端依赖..."
if [ ! -d ".venv" ]; then
    python3 -m venv .venv
    echo "✅ 创建虚拟环境"
fi

source .venv/bin/activate
pip install --upgrade pip
pip install fastapi uvicorn pydantic starlette

# 安装前端依赖
echo "📦 安装前端依赖..."
cd frontend
if [ ! -d "node_modules" ]; then
    pnpm install
fi
cd ..

# 设置文件权限
echo "🔒 设置文件权限..."
chmod 600 "$ENV_FILE" 2>/dev/null || true
chmod 600 .env* 2>/dev/null || true
chmod 644 users.example.db
chmod 644 monitored_services.json

echo ""
echo "✅ 初始设置完成！"
echo ""
echo "📋 下一步操作:"
echo ""
if [ "$ENV_TYPE" = "prod" ]; then
    echo "⚠️  生产环境安全提醒:"
    echo "   1. 编辑 $ENV_FILE 文件，修改默认密码和密钥"
    echo "   2. 配置正确的 API_URL"
    echo "   3. 参考 SECURITY.md 完成安全配置"
    echo ""
    echo "🚀 部署应用:"
    echo "   ./scripts/deploy.sh prod"
else
    echo "🚀 启动开发服务器:"
    echo "   后端: .venv/bin/python -m uvicorn routers.main:app --host 0.0.0.0 --port 6996 --reload"
    echo "   前端: cd frontend && pnpm dev"
    echo ""
    echo "🌐 访问应用:"
    echo "   前端: http://localhost:3000"
    echo "   API: http://localhost:6996"
    echo ""
    echo "👤 默认用户:"
    echo "   管理员: admin/admin123"
    echo "   用户: user/user123"
fi

echo ""
echo "📖 更多信息请参考:"
echo "   - README.md: 项目介绍"
echo "   - DEPLOYMENT.md: 部署指南"
echo "   - SECURITY.md: 安全说明"
echo "   - API.md: API文档"