# Systemd Service Monitor

一个基于 Web 的 Linux systemd 服务监控和管理工具，提供实时监控、服务控制和日志查看功能。

## ✨ 功能特性

- 🔍 **服务扫描**: 自动发现系统中的所有 systemd 服务
- 📊 **实时监控**: 监控服务状态和运行状况
- 🎮 **服务控制**: 启动、停止、重启、启用/禁用服务（需要管理员权限）
- 📋 **日志查看**: 查看服务的 systemd 日志
- 🔐 **权限管理**: 基于角色的访问控制（管理员/普通用户）
- 📱 **响应式设计**: 适配各种设备屏幕
- ⚡ **高性能**: 基于 FastAPI 和 Next.js 构建

## 🏗️ 技术栈

- **后端**: FastAPI (Python)、SQLite、JWT 认证
- **前端**: Next.js 16.0.3、React 19.2.0、TypeScript、Tailwind CSS
- **UI 组件**: shadcn/ui
- **包管理**: pnpm (前端)、pip (后端)

## 🚀 快速开始

### 环境要求
- Python 3.8+
- Node.js 18+
- pnpm 包管理器
- Linux 系统（支持 systemd）
- sudo 权限（用于服务控制）

### 开发环境部署

1. **快速初始化（推荐）**
   ```bash
   git clone <your-repo-url>
   cd system_monitor
   ./scripts/setup.sh dev
   ```

2. **手动配置（可选）**
   ```bash
   # 克隆项目
   git clone <your-repo-url>
   cd system_monitor

   # 配置环境变量
   cp .env.local.example .env.local
   # 编辑 .env.local 文件

   # 初始化示例数据库
   python3 scripts/init_example_db.py

   # 启动后端
   python3 -m venv .venv
   source .venv/bin/activate
   pip install fastapi uvicorn pydantic starlette
   .venv/bin/python -m uvicorn routers.main:app --host 0.0.0.0 --port 6996 --reload

   # 启动前端（新终端）
   cd frontend
   pnpm install
   pnpm dev
   ```

3. **访问应用**
   - 前端: http://localhost:3000
   - 后端 API: http://localhost:6996
   - 默认用户: admin/admin123 或 user/user123

### 生产环境部署

参考 [DEPLOYMENT.md](./DEPLOYMENT.md) 获取详细的部署指南。

快速部署：
```bash
./scripts/deploy.sh prod
```

## 📖 文档

- [📋 部署指南](./DEPLOYMENT.md) - 详细的部署和配置说明
- [🔒 安全说明](./SECURITY.md) - 安全配置和最佳实践
- [🔧 API 文档](./API.md) - API 接口文档

## 🔧 开发

### ⚠️ 重要提醒：避免提交大文件

本项目使用 `.gitignore` 来避免提交不应版本控制的文件。请确保：**

- **不要提交 `node_modules/`** - 使用 `pnpm install` 本地安装
- **不要提交 `.next/`** - 使用 `pnpm build` 本地构建
- **不要提交大文件** - GitHub 有 100MB 文件大小限制

如意外提交了大文件，请运行：
```bash
# 清理本地构建文件
./scripts/cleanup.sh

# 清理git历史中的大文件（谨慎使用）
git filter-branch --force --index-filter 'git rm --cached --ignore-unmatch 文件名' --prune-empty --tag-name-filter cat -- --all
```

### 数据库配置

项目支持灵活的数据库配置：

- **开发环境**: 使用 `users.db` 和 `monitored_services.json`
- **生产环境**: 可通过环境变量自定义路径
- **示例数据库**: `users.example.db` 包含默认用户供参考

环境变量：
- `USERS_DB_FILE`: 用户数据库文件路径（默认: `users.db`）
- `MONITORED_SERVICES_FILE`: 监控服务配置文件路径（默认: `monitored_services.json`）

### 项目结构
```
system_monitor/
├── routers/
│   └── main.py              # FastAPI 后端主文件
├── frontend/
│   ├── app/                 # Next.js 应用目录
│   ├── components/          # React 组件
│   ├── lib/                 # 工具函数和 API 客户端
│   └── hooks/               # 自定义 React hooks
├── scripts/
│   ├── setup.sh             # 初始设置脚本
│   ├── deploy.sh            # 部署脚本
│   ├── stop.sh              # 停止服务脚本
│   └── init_example_db.py   # 初始化示例数据库
└── docs/                    # 文档
```

### 开发命令

#### 后端开发
```bash
# 运行开发服务器
.venv/bin/python -m uvicorn routers.main:app --host 0.0.0.0 --port 6996 --reload
```

#### 前端开发
```bash
cd frontend
pnpm dev          # 开发服务器
pnpm build        # 构建生产版本
pnpm lint         # 代码检查
```

## 🔐 安全特性

- JWT 身份认证
- 密码哈希存储（PBKDF2）
- 基于角色的访问控制
- CORS 配置
- 输入验证和错误处理

⚠️ **重要**: 部署前请务必阅读 [SECURITY.md](./SECURITY.md) 并完成安全配置。

## 🛠️ 系统要求

- 操作系统: Linux (支持 systemd)
- Python: 3.8+
- Node.js: 18+
- 权限: 运行用户需要 sudo 权限来控制系统服务

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

## 📄 许可证

[MIT License](./LICENSE)

## ⚠️ 免责声明

本项目用于教育和合法用途。使用本工具控制系统服务需要适当的权限。请确保您有权限监控和管理目标系统上的服务。

---

## 🔍 功能预览

### 服务监控面板
- 实时显示服务状态
- 一键刷新状态
- 批量操作支持

### 服务管理
- 添加/移除监控服务
- 服务控制（启动/停止/重启）
- 日志查看

### 用户认证
- 登录/登出
- 角色权限管理
- 会话管理

## 🐛 故障排除

### 常见问题

1. **权限错误**: 确保运行用户有 sudo 权限
2. **服务未发现**: 检查服务名称是否正确
3. **端口占用**: 检查端口是否被占用
4. **依赖问题**: 确保所有依赖已安装

### 查看日志
```bash
# 后端日志
tail -f scripts/run/backend-*.log

# 前端日志
tail -f scripts/run/frontend-*.log
```

## 📞 支持

如有问题，请在 GitHub 提交 Issue。