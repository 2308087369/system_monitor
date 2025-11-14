# 安全说明

## ⚠️ 重要安全提醒

在部署到生产环境前，请务必完成以下安全配置：

### 1. JWT密钥安全
- **必须**设置强密钥，长度至少32位字符
- **禁止**使用默认密钥 `your-jwt-secret-here`
- 建议命令：`openssl rand -hex 32`

### 2. 默认用户密码
- **必须**修改默认管理员和用户密码
- **禁止**使用默认密码 `admin123` 和 `user123`
- 密码应包含大小写字母、数字和特殊字符

### 3. 网络配置安全
- **必须**替换 `YOUR_SERVER_IP` 为你的实际服务器IP或域名
- 建议使用HTTPS和反向代理（如Nginx）
- 配置防火墙规则，限制访问端口

### 4. 文件权限
```bash
# 设置敏感文件权限
chmod 600 .env*
chmod 600 users.db
chmod 600 monitored_services.json
```

### 5. 生产环境部署检查清单
- [ ] 修改JWT_SECRET为强密钥
- [ ] 修改默认用户密码
- [ ] 配置正确的API_URL
- [ ] 设置文件权限
- [ ] 配置HTTPS
- [ ] 设置防火墙规则
- [ ] 定期更新依赖包

### 6. 环境变量配置
复制对应的示例文件：
```bash
# 开发环境
cp .env.local.example .env.local

# 生产环境
cp .env.production.example .env.production
```

### 7. 安全监控
- 定期检查系统日志
- 监控异常登录尝试
- 及时更新系统补丁

## 联系方式
如发现安全漏洞，请通过Issue报告。