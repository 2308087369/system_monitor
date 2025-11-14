# 部署指南

## 📋 部署前准备

### 1. 环境要求
- Python 3.8+
- Node.js 18+
- pnpm 包管理器
- Linux 系统（支持 systemd）
- sudo 权限（用于服务控制）

### 2. 安全准备
参考 [SECURITY.md](./SECURITY.md) 完成安全配置

---

## 🚀 部署步骤

### 步骤 1: 克隆项目
```bash
git clone <your-repo-url>
cd system_monitor
```

### 步骤 2: 配置环境变量

#### 开发环境
```bash
cp .env.local.example .env.local
# 编辑 .env.local 文件，按需修改配置
```

#### 生产环境
```bash
cp .env.production.example .env.production
# 编辑 .env.production 文件，**必须修改敏感配置**
```

### 步骤 3: 后端部署

#### 开发环境
```bash
# 创建虚拟环境
python3 -m venv .venv
source .venv/bin/activate

# 安装依赖
pip install fastapi uvicorn pydantic starlette

# 运行开发服务器
.venv/bin/python -m uvicorn routers.main:app --host 0.0.0.0 --port 6996 --reload
```

#### 生产环境
```bash
# 使用部署脚本
./scripts/deploy.sh prod

# 或使用自定义端口（正式环境）
./scripts/deploy.sh formal
```

### 步骤 4: 前端部署

部署脚本会自动处理前端构建，如需手动部署：

```bash
cd frontend
pnpm install
NEXT_PUBLIC_API_URL="http://your-server:6996" pnpm build
PORT=6997 pnpm start
```

---

## 🔧 配置说明

### 端口配置
- **开发环境**: 后端 6996，前端 3000
- **生产环境**: 后端 6996，前端 6997
- **正式环境**: 后端 6994，前端 6995

### 环境变量

| 变量名 | 说明 | 示例 |
|--------|------|------|
| `JWT_SECRET` | JWT密钥（必填） | `openssl rand -hex 32` |
| `ADMIN_PASSWORD` | 管理员密码（必填） | 强密码 |
| `USER_PASSWORD` | 普通用户密码（必填） | 强密码 |
| `NEXT_PUBLIC_API_URL` | API地址（必填） | `https://your-domain.com` |
| `BACKEND_PORT` | 后端端口 | `6996` |
| `FRONTEND_PORT` | 前端端口 | `6997` |

---

## 🛡️ 安全加固

### 1. 使用 HTTPS
建议配置 Nginx 反向代理：

```nginx
server {
    listen 443 ssl;
    server_name your-domain.com;

    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;

    location /api {
        proxy_pass http://localhost:6996;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    location / {
        proxy_pass http://localhost:6997;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

### 2. 防火墙配置
```bash
# 仅开放必要端口
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
```

### 3. 系统服务
创建 systemd 服务文件（可选）：

```ini
# /etc/systemd/system/system-monitor.service
[Unit]
Description=System Monitor Backend
After=network.target

[Service]
Type=simple
User=your-user
WorkingDirectory=/path/to/system_monitor
ExecStart=/path/to/system_monitor/.venv/bin/python -m uvicorn routers.main:app --host 0.0.0.0 --port 6996
Restart=always

[Install]
WantedBy=multi-user.target
```

---

## 🔍 验证部署

### 健康检查
```bash
curl http://localhost:6996/health
```

### 服务状态
访问前端界面或使用 API：
```bash
curl http://localhost:6996/monitored-services
```

---

## 🔄 更新部署

### 停止服务
```bash
./scripts/stop.sh
```

### 更新代码
```bash
git pull origin main
```

### 重新部署
```bash
./scripts/deploy.sh prod
```

---

## 📞 故障排除

### 常见问题

1. **权限问题**: 确保运行用户有 sudo 权限执行 systemctl
2. **端口占用**: 检查端口是否被其他服务占用
3. **依赖问题**: 确保所有依赖已正确安装
4. **日志查看**: 检查 `scripts/run/` 目录下的日志文件

### 日志位置
- 后端日志: `scripts/run/backend-*.log`
- 前端日志: `scripts/run/frontend-*.log`
- 进程ID: `scripts/run/*.pid`