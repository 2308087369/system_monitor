接口总览

- 基础地址: http://<host>:8000/
- 统一认证: Bearer Token（通过 POST /auth/token 获取），Swagger Authorize 可直接绑定
- 授权规则:
  - 登录即可访问: 查询类接口（扫描、可用服务、监控列表、服务状态、日志）
  - 仅管理员可操作: 监控项维护（添加/移除/批量）、服务控制（start/stop/restart/...）
认证

- POST /auth/token （表单）routers/main.py:330
  - 传入: application/x-www-form-urlencoded
    - username : string
    - password : string
    - grant_type : string （建议 password ）
  - 返回: { "access_token": "string", "token_type": "bearer" }
  - 说明: 使用 OAuth2 密码模式；Swagger 会自动生成 Authorize 按钮
- GET /auth/me （需登录）routers/main.py:354
  - 传入: Authorization: Bearer <token>
  - 返回: { "username": "string", "role": "admin|user" }
- POST /auth/logout （需登录）routers/main.py:347
  - 传入: Authorization: Bearer <token>
  - 返回: { "message": "Logged out" }
  - 说明: JWT 为无状态，后端仅返回成功消息
服务扫描与查询

- GET /scan-services （需登录）routers/main.py:358
  - 传入: 无
  - 返回: string[] （所有发现的 .service 文件名，去重排序）
- GET /available-services （需登录）routers/main.py:363
  - 传入: 无
  - 返回: Array<{ name: string, description: string, enabled: string, loaded: boolean }>
  - 说明: 为避免超时，最多取前 50 个服务做详情补充
- GET /service-status/{service_name} （需登录）routers/main.py:450
  - 传入: path 参数 service_name: string （可不带 .service ，后端自动补）
  - 返回: ServiceInfo
    - name: string
    - status: string （如 "active (running)" ）
    - active: string （ ActiveState ）
    - enabled: string （ UnitFileState ）
    - description: string
    - loaded: boolean
监控列表管理

- GET /monitored-services （需登录）routers/main.py:380
  - 传入: 无
  - 返回: string[] （当前监控的服务名，含 .service 后缀）
- POST /monitored-services （管理员）routers/main.py:385
  - 传入: application/json { "service_name": "string" }
  - 返回: { "message": "Service <name> added to monitoring", "services": string[] }
  - 校验:
    - 若未带 .service 自动补全
    - 必须存在于系统可用服务列表，否则返回 404
- POST /monitored-services/batch （管理员）routers/main.py:406
  - 传入: application/json { "services": string[] }
  - 返回: { "message": "Batch operation completed", "added": string[], "not_found": string[], "total_monitored": number }
  - 说明: 批量校验存在性并添加；自动补全 .service
- DELETE /monitored-services/{service_name} （管理员）routers/main.py:435
  - 传入: path 参数 service_name: string （可不带 .service ，自动补全）
  - 返回: { "message": "Service <name> removed from monitoring" }
  - 异常: 不在监控列表返回 404
服务控制与日志

- POST /service-control/{service_name}/{action} （管理员）routers/main.py:470
  - 传入:
    - path 参数 service_name: string （自动补 .service ）
    - path 参数 action: string ∈ { start, stop, restart, reload, enable, disable }
  - 返回: { "success": boolean, "message": string, "return_code": number }
  - 说明: 调用 sudo systemctl <action> <service> ，需系统权限；服务不存在返回 { success: false, message: "...not found" } （参考 routers/main.py:303）
- GET /service-logs/{service_name} （需登录）routers/main.py:483
  - 传入:
    - path 参数 service_name: string （自动补 .service ）
    - query 参数 lines: number （默认 50，范围 1..500 ）
  - 返回: { "logs": string[] } 或 { "logs": [], "error": string }
  - 异常: 超时返回 408；其他失败返回 500
  - 说明: 调用 sudo journalctl -u <service> -n <lines>
其他

- GET /monitored-status （需登录）routers/main.py:458
  - 传入: 无
  - 返回: ServiceInfo[] （对监控列表逐项取状态）
- GET /health routers/main.py:504
  - 传入: 无
  - 返回: { "status": "healthy", "timestamp": string, "monitored_services_count": number }
- GET / routers/main.py:326
  - 传入: 无
  - 返回: { "message": "Systemd Service Monitor API", "version": "1.0.0" }
认证与权限说明

- 令牌获取
  - 通过 POST /auth/token 获取 { access_token, token_type } ，在前端或 Swagger 使用 Authorization: Bearer <access_token> 。
- 角色判定
  - GET /auth/me 返回 role ，前端可据此控制页面操作入口：
    - admin : 可维护监控项与控制服务
    - user : 只读查看、日志查看
- 统一异常与错误码
  - 认证失败/过期: 401 Unauthorized （令牌缺失或无效）
  - 权限不足: 403 Forbidden
  - 资源不存在: 404 Not Found （如服务或监控项不存在）
  - 日志获取超时: 408 Request Timeout
  - 服务器错误: 500 Internal Server Error
  - 业务失败（服务控制/校验失败）: 返回 success: false 与错误 message
模型与请求体

- ServiceInfo 模型 routers/main.py:163
  - 字段: name , status , active , enabled , description , loaded
- ServiceAddRequest 请求体 routers/main.py:171
  - 字段: service_name: string
- ServiceBatchRequest 请求体 routers/main.py:174
  - 字段: services: string[]
- TokenResponse 响应体 routers/main.py:136
  - 字段: access_token: string , token_type: string
以上即为当前后端脚本的完整接口文档。前端已按此文档统一封装并接入。若需要导出成 OpenAPI/Markdown 文档文件或补充示例请求/响应，我可以继续生成。