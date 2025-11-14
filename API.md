# API 文档

## 🔌 基础信息

- **Base URL**: `http://localhost:6996`
- **认证方式**: JWT Bearer Token
- **Content-Type**: `application/json`

## 🔐 认证

### 登录
```http
POST /auth/token
Content-Type: application/x-www-form-urlencoded

username=admin&password=admin123
```

**响应**:
```json
{
  "access_token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
  "token_type": "bearer"
}
```

### 获取当前用户信息
```http
GET /auth/me
Authorization: Bearer <token>
```

**响应**:
```json
{
  "username": "admin",
  "role": "admin"
}
```

### 登出
```http
POST /auth/logout
Authorization: Bearer <token>
```

## 📊 服务管理

### 扫描所有服务
```http
GET /scan-services
Authorization: Bearer <token>
```

**响应**:
```json
[
  "sshd.service",
  "nginx.service",
  "mysql.service"
]
```

### 获取可用服务列表
```http
GET /available-services?page=1&page_size=10
Authorization: Bearer <token>
```

**响应**:
```json
[
  {
    "name": "sshd.service",
    "description": "OpenSSH server daemon",
    "enabled": "enabled",
    "loaded": true
  }
]
```

### 获取监控服务列表
```http
GET /monitored-services
Authorization: Bearer <token>
```

**响应**:
```json
[
  "nginx.service",
  "mysql.service"
]
```

### 添加监控服务
```http
POST /monitored-services
Authorization: Bearer <token>
Content-Type: application/json

{
  "service_name": "nginx"
}
```

**响应**:
```json
{
  "message": "Service nginx.service added to monitoring",
  "services": ["nginx.service", "mysql.service"]
}
```

### 批量添加监控服务
```http
POST /monitored-services/batch
Authorization: Bearer <token>
Content-Type: application/json

{
  "services": ["nginx", "mysql", "redis"]
}
```

**响应**:
```json
{
  "message": "Batch operation completed",
  "added": ["nginx.service", "mysql.service"],
  "not_found": ["redis.service"],
  "total_monitored": 2
}
```

### 移除监控服务
```http
DELETE /monitored-services/nginx
Authorization: Bearer <token>
```

**响应**:
```json
{
  "message": "Service nginx.service removed from monitoring"
}
```

## 📈 服务状态

### 获取单个服务状态
```http
GET /service-status/nginx
Authorization: Bearer <token>
```

**响应**:
```json
{
  "name": "nginx.service",
  "status": "active (running)",
  "active": "active",
  "enabled": "enabled",
  "description": "A high performance web server",
  "loaded": true
}
```

### 获取所有监控服务状态
```http
GET /monitored-status
Authorization: Bearer <token>
```

**响应**:
```json
[
  {
    "name": "nginx.service",
    "status": "active (running)",
    "active": "active",
    "enabled": "enabled",
    "description": "A high performance web server",
    "loaded": true
  },
  {
    "name": "mysql.service",
    "status": "inactive (dead)",
    "active": "inactive",
    "enabled": "disabled",
    "description": "MySQL database server",
    "loaded": true
  }
]
```

## 🎮 服务控制

### 控制服务（管理员）
```http
POST /service-control/nginx/start
Authorization: Bearer <token>
```

支持的操作: `start`, `stop`, `restart`, `reload`, `enable`, `disable`, `status`

**响应**:
```json
{
  "success": true,
  "message": "",
  "return_code": 0
}
```

## 📋 日志查看

### 获取服务日志
```http
GET /service-logs/nginx?lines=50
Authorization: Bearer <token>
```

**响应**:
```json
{
  "logs": [
    "Jan 01 12:00:00 server nginx[1234]: Starting nginx...",
    "Jan 01 12:00:01 server nginx[1234]: nginx started successfully"
  ]
}
```

## 🏥 健康检查

### 系统健康状态
```http
GET /health
```

**响应**:
```json
{
  "status": "healthy",
  "timestamp": "2024-01-01T12:00:00.000000",
  "monitored_services_count": 2
}
```

## 📊 状态码说明

| 状态码 | 说明 |
|--------|------|
| 200 | 请求成功 |
| 401 | 未认证或认证失败 |
| 403 | 权限不足（需要管理员权限） |
| 404 | 服务未找到 |
| 408 | 请求超时 |
| 500 | 服务器内部错误 |

## 🔒 权限说明

- **普通用户**: 可以查看服务状态和日志
- **管理员**: 可以执行所有操作，包括服务控制

## 💡 使用示例

### Python 示例
```python
import requests

# 登录获取token
response = requests.post('http://localhost:6996/auth/token', data={
    'username': 'admin',
    'password': 'your-password'
})
token = response.json()['access_token']

# 获取监控服务状态
headers = {'Authorization': f'Bearer {token}'}
response = requests.get('http://localhost:6996/monitored-status', headers=headers)
services = response.json()

for service in services:
    print(f"{service['name']}: {service['status']}")
```

### cURL 示例
```bash
# 登录
TOKEN=$(curl -s -X POST http://localhost:6996/auth/token \
  -d "username=admin&password=your-password" \
  | jq -r '.access_token')

# 获取服务状态
curl -s http://localhost:6996/monitored-status \
  -H "Authorization: Bearer $TOKEN" | jq
```

### JavaScript 示例
```javascript
// 登录
const loginResponse = await fetch('http://localhost:6996/auth/token', {
  method: 'POST',
  headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  body: 'username=admin&password=your-password'
});
const { access_token } = await loginResponse.json();

// 获取服务状态
const statusResponse = await fetch('http://localhost:6996/monitored-status', {
  headers: { 'Authorization': `Bearer ${access_token}` }
});
const services = await statusResponse.json();

console.log(services);
```

## ⚠️ 注意事项

1. 所有时间戳均为 ISO 8601 格式
2. 服务名称可以带或不带 `.service` 后缀
3. 管理员操作需要 `admin` 角色
4. 日志查看可能需要 sudo 权限
5. 建议使用 HTTPS 进行生产环境部署

## 🔧 错误处理

所有错误响应都包含详细的错误信息：

```json
{
  "detail": "Service not-found.service not found"
}
```

常见的错误类型：
- `Service not found`: 服务不存在
- `Invalid action`: 不支持的操作类型
- `Forbidden`: 权限不足
- `Unauthorized`: 认证失败或过期
- `Operation timed out`: 操作超时