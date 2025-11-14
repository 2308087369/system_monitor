# app.py
from fastapi import FastAPI, HTTPException, Query, Depends, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from pydantic import BaseModel
import subprocess
import os
import re
from typing import List, Dict, Optional
import json
from datetime import datetime
import sqlite3
import hashlib
import secrets
import time
import hmac
import base64

app = FastAPI(title="Systemd Service Monitor", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 存储用户选择的服务 - 生产环境可通过环境变量配置
monitored_services_file = os.environ.get("MONITORED_SERVICES_FILE", "monitored_services.json")
# 数据库文件路径 - 生产环境可通过环境变量配置
users_db_file = os.environ.get("USERS_DB_FILE", "users.db")

AUTH_TOKEN_EXPIRE_SECONDS = 7 * 24 * 60 * 60
JWT_EXPIRE_SECONDS = AUTH_TOKEN_EXPIRE_SECONDS
JWT_SECRET = os.environ.get("JWT_SECRET", "your-jwt-secret-here")
JWT_ALG = "HS256"

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/token")

def get_db_conn():
    return sqlite3.connect(users_db_file)

def init_user_db():
    conn = get_db_conn()
    try:
        cur = conn.cursor()
        cur.execute(
            """
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                username TEXT UNIQUE NOT NULL,
                password_hash TEXT NOT NULL,
                salt TEXT NOT NULL,
                role TEXT NOT NULL,
                created_at TEXT NOT NULL
            )
            """
        )
        cur.execute(
            """
            CREATE TABLE IF NOT EXISTS sessions (
                token TEXT PRIMARY KEY,
                username TEXT NOT NULL,
                expires_at INTEGER NOT NULL,
                created_at INTEGER NOT NULL
            )
            """
        )

        def ensure_user(username: str, password: str, role: str):
            cur.execute("SELECT 1 FROM users WHERE username=?", (username,))
            if cur.fetchone():
                return
            salt = secrets.token_hex(16)
            pwd_hash = hashlib.pbkdf2_hmac(
                "sha256", password.encode(), salt.encode(), 100_000
            ).hex()
            cur.execute(
                "INSERT INTO users (username, password_hash, salt, role, created_at) VALUES (?, ?, ?, ?, ?)",
                (username, pwd_hash, salt, role, datetime.now().isoformat()),
            )

        # 创建默认用户 - 请在生产环境中修改这些凭据
        ensure_user("admin", os.environ.get("ADMIN_PASSWORD", "admin123"), "admin")
        ensure_user("user", os.environ.get("USER_PASSWORD", "user123"), "user")
        conn.commit()
    finally:
        conn.close()

def verify_password(password: str, salt: str, password_hash: str) -> bool:
    calc = hashlib.pbkdf2_hmac("sha256", password.encode(), salt.encode(), 100_000).hex()
    return secrets.compare_digest(calc, password_hash)

def _b64url_encode(b: bytes) -> str:
    return base64.urlsafe_b64encode(b).rstrip(b'=').decode()

def _b64url_decode(s: str) -> bytes:
    return base64.urlsafe_b64decode(s + '=' * (-len(s) % 4))

def create_access_token(data: Dict, expires_seconds: int = JWT_EXPIRE_SECONDS) -> str:
    header = {"alg": JWT_ALG, "typ": "JWT"}
    payload = dict(data)
    payload["exp"] = int(time.time()) + int(expires_seconds)
    h = _b64url_encode(json.dumps(header, separators=(',', ':')).encode())
    p = _b64url_encode(json.dumps(payload, separators=(',', ':')).encode())
    signing_input = f"{h}.{p}".encode()
    sig = hmac.new(JWT_SECRET.encode(), signing_input, hashlib.sha256).digest()
    s = _b64url_encode(sig)
    return f"{h}.{p}.{s}"

def decode_access_token(token: str) -> Optional[Dict]:
    try:
        parts = token.split('.')
        if len(parts) != 3:
            return None
        h, p, s = parts
        signing_input = f"{h}.{p}".encode()
        expected = hmac.new(JWT_SECRET.encode(), signing_input, hashlib.sha256).digest()
        if not hmac.compare_digest(_b64url_decode(s), expected):
            return None
        payload = json.loads(_b64url_decode(p))
        if int(payload.get("exp", 0)) < int(time.time()):
            return None
        return payload
    except Exception:
        return None

class LoginRequest(BaseModel):
    username: str
    password: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str

async def get_current_user(token: str = Depends(oauth2_scheme)) -> Dict:
    payload = decode_access_token(token)
    if not payload:
        raise HTTPException(status_code=401, detail="Unauthorized")
    username = payload.get("sub")
    role = payload.get("role")
    if not username or not role:
        raise HTTPException(status_code=401, detail="Unauthorized")
    conn = get_db_conn()
    try:
        cur = conn.cursor()
        cur.execute("SELECT username, role FROM users WHERE username=?", (username,))
        u = cur.fetchone()
        if not u:
            raise HTTPException(status_code=401, detail="Unauthorized")
    finally:
        conn.close()
    return {"username": username, "role": role}

async def get_current_admin(user: Dict = Depends(get_current_user)) -> Dict:
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Forbidden")
    return user

class ServiceInfo(BaseModel):
    name: str
    status: str
    active: str
    enabled: str
    description: str
    loaded: bool = True

class ServiceAddRequest(BaseModel):
    service_name: str

class ServiceBatchRequest(BaseModel):
    services: List[str]

def load_monitored_services():
    """加载已监控的服务列表"""
    if os.path.exists(monitored_services_file):
        with open(monitored_services_file, 'r') as f:
            return json.load(f)
    return []

def save_monitored_services(services):
    """保存监控的服务列表"""
    with open(monitored_services_file, 'w') as f:
        json.dump(services, f, indent=2)

init_user_db()

def get_service_status(service_name: str) -> ServiceInfo:
    """获取单个服务状态"""
    try:
        # 检查服务是否存在
        result = subprocess.run(
            ['systemctl', 'list-unit-files', service_name],
            capture_output=True, text=True, timeout=10
        )
        
        if service_name not in result.stdout:
            return ServiceInfo(
                name=service_name,
                status="not-found",
                active="unknown",
                enabled="unknown",
                description="Service not found",
                loaded=False
            )

        # 获取详细状态
        result = subprocess.run(
            ['systemctl', 'show', service_name, '--no-page'],
            capture_output=True, text=True, timeout=10
        )
        
        if result.returncode != 0:
            return ServiceInfo(
                name=service_name,
                status="error",
                active="error",
                enabled="error",
                description="Failed to get service status",
                loaded=False
            )

        # 解析systemctl输出
        status_info = {}
        for line in result.stdout.split('\n'):
            if '=' in line:
                key, value = line.split('=', 1)
                status_info[key] = value

        active_state = status_info.get('ActiveState', 'unknown')
        sub_state = status_info.get('SubState', 'unknown')
        unit_file_state = status_info.get('UnitFileState', 'unknown')
        description = status_info.get('Description', 'No description')

        # 获取更详细的状态
        status_result = subprocess.run(
            ['systemctl', 'status', service_name],
            capture_output=True, text=True, timeout=10
        )

        return ServiceInfo(
            name=service_name,
            status=f"{active_state} ({sub_state})",
            active=active_state,
            enabled=unit_file_state,
            description=description,
            loaded=True
        )

    except subprocess.TimeoutExpired:
        return ServiceInfo(
            name=service_name,
            status="timeout",
            active="timeout",
            enabled="unknown",
            description="Timeout while checking service",
            loaded=False
        )
    except Exception as e:
        return ServiceInfo(
            name=service_name,
            status="error",
            active="error",
            enabled="unknown",
            description=f"Error: {str(e)}",
            loaded=False
        )

def scan_systemd_services(directory: str = "/etc/systemd/system/") -> List[str]:
    """扫描指定目录下的所有.service文件"""
    services = []
    try:
        if os.path.exists(directory):
            for filename in os.listdir(directory):
                if filename.endswith('.service'):
                    services.append(filename)
        
        # 同时扫描/lib/systemd/system/ 和 /usr/lib/systemd/system/
        additional_dirs = ['/lib/systemd/system/', '/usr/lib/systemd/system/']
        for add_dir in additional_dirs:
            if os.path.exists(add_dir):
                for filename in os.listdir(add_dir):
                    if filename.endswith('.service'):
                        services.append(filename)
        
        # 去重并排序
        return sorted(list(set(services)))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to scan services: {str(e)}")

def control_service(service_name: str, action: str) -> Dict:
    """控制服务（启动、停止、重启等）"""
    try:
        if action not in ['start', 'stop', 'restart', 'reload', 'enable', 'disable', 'status']:
            raise ValueError("Invalid action")

        # 检查服务是否存在
        check_result = subprocess.run(
            ['systemctl', 'list-unit-files', service_name],
            capture_output=True, text=True, timeout=10
        )
        
        if service_name not in check_result.stdout:
            return {"success": False, "message": f"Service {service_name} not found"}

        # 执行操作
        result = subprocess.run(
            ['sudo', 'systemctl', action, service_name],
            capture_output=True, text=True, timeout=30
        )
        
        success = result.returncode == 0
        return {
            "success": success,
            "message": result.stdout if success else result.stderr,
            "return_code": result.returncode
        }
    except subprocess.TimeoutExpired:
        return {"success": False, "message": "Operation timed out"}
    except Exception as e:
        return {"success": False, "message": f"Error: {str(e)}"}

@app.get("/")
async def root():
    return {"message": "Systemd Service Monitor API", "version": "1.0.0"}

@app.post("/auth/token", response_model=TokenResponse)
async def login(form_data: OAuth2PasswordRequestForm = Depends()):
    conn = get_db_conn()
    try:
        cur = conn.cursor()
        cur.execute("SELECT username, password_hash, salt, role FROM users WHERE username=?", (form_data.username,))
        row = cur.fetchone()
        if not row:
            raise HTTPException(status_code=401, detail="Invalid credentials")
        username, password_hash, salt, role = row
        if not verify_password(form_data.password, salt, password_hash):
            raise HTTPException(status_code=401, detail="Invalid credentials")
        access_token = create_access_token({"sub": username, "role": role})
        return {"access_token": access_token, "token_type": "bearer"}
    finally:
        conn.close()

@app.post("/auth/logout")
async def logout(user: Dict = Depends(get_current_user)):
    return {"message": "Logged out"}

@app.get("/auth/me")
async def me(user: Dict = Depends(get_current_user)):
    return {"username": user["username"], "role": user["role"]}

@app.get("/scan-services", response_model=List[str])
async def scan_services(user: Dict = Depends(get_current_user)):
    """扫描系统中所有的.service文件"""
    return scan_systemd_services()

@app.get("/available-services", response_model=List[Dict])
async def get_available_services(user: Dict = Depends(get_current_user), page: Optional[int] = Query(None, ge=1), page_size: Optional[int] = Query(None, ge=1, le=10000)):
    """获取所有可用的服务及其基本信息"""
    services = scan_systemd_services()
    service_info = []
    
    if page and page_size:
        start = (page - 1) * page_size
        services = services[start:start + page_size]
    
    for service in services:
        info = get_service_status(service)
        service_info.append({
            "name": service,
            "description": info.description,
            "enabled": info.enabled,
            "loaded": info.loaded
        })
    
    return service_info

@app.get("/monitored-services", response_model=List[str])
async def get_monitored_services(user: Dict = Depends(get_current_user)):
    """获取当前监控的服务列表"""
    return load_monitored_services()

@app.post("/monitored-services")
async def add_monitored_service(request: ServiceAddRequest, admin: Dict = Depends(get_current_admin)):
    """添加新的服务到监控列表"""
    service_name = request.service_name.strip()
    
    if not service_name.endswith('.service'):
        service_name += '.service'
    
    # 检查服务是否存在
    available_services = scan_systemd_services()
    if service_name not in available_services:
        raise HTTPException(status_code=404, detail=f"Service {service_name} not found")
    
    # 添加到监控列表
    monitored = load_monitored_services()
    if service_name not in monitored:
        monitored.append(service_name)
        save_monitored_services(monitored)
    
    return {"message": f"Service {service_name} added to monitoring", "services": monitored}

@app.post("/monitored-services/batch")
async def add_monitored_services_batch(request: ServiceBatchRequest, admin: Dict = Depends(get_current_admin)):
    """批量添加服务到监控列表"""
    available_services = scan_systemd_services()
    monitored = load_monitored_services()
    added = []
    not_found = []
    
    for service_name in request.services:
        service_name = service_name.strip()
        if not service_name.endswith('.service'):
            service_name += '.service'
        
        if service_name in available_services:
            if service_name not in monitored:
                monitored.append(service_name)
                added.append(service_name)
        else:
            not_found.append(service_name)
    
    save_monitored_services(monitored)
    
    return {
        "message": "Batch operation completed",
        "added": added,
        "not_found": not_found,
        "total_monitored": len(monitored)
    }

@app.delete("/monitored-services/{service_name}")
async def remove_monitored_service(service_name: str, admin: Dict = Depends(get_current_admin)):
    """从监控列表中移除服务"""
    monitored = load_monitored_services()
    
    if not service_name.endswith('.service'):
        service_name += '.service'
    
    if service_name in monitored:
        monitored.remove(service_name)
        save_monitored_services(monitored)
        return {"message": f"Service {service_name} removed from monitoring"}
    else:
        raise HTTPException(status_code=404, detail=f"Service {service_name} not in monitoring list")

@app.get("/service-status/{service_name}", response_model=ServiceInfo)
async def get_single_service_status(service_name: str, user: Dict = Depends(get_current_user)):
    """获取单个服务的详细状态"""
    if not service_name.endswith('.service'):
        service_name += '.service'
    
    return get_service_status(service_name)

@app.get("/monitored-status", response_model=List[ServiceInfo])
async def get_all_monitored_status(user: Dict = Depends(get_current_user)):
    """获取所有监控服务的状态"""
    monitored = load_monitored_services()
    statuses = []
    
    for service in monitored:
        status = get_service_status(service)
        statuses.append(status)
    
    return statuses

@app.post("/service-control/{service_name}/{action}")
async def control_service_endpoint(service_name: str, action: str, admin: Dict = Depends(get_current_admin)):
    """控制服务（需要sudo权限）"""
    if not service_name.endswith('.service'):
        service_name += '.service'
    
    result = control_service(service_name, action)
    
    if not result["success"]:
        raise HTTPException(status_code=400, detail=result["message"])
    
    return result

@app.get("/service-logs/{service_name}")
async def get_service_logs(service_name: str, lines: int = Query(50, ge=1, le=500), user: Dict = Depends(get_current_user)):
    """获取服务的日志"""
    if not service_name.endswith('.service'):
        service_name += '.service'
    
    try:
        result = subprocess.run(
            ['sudo', 'journalctl', '-u', service_name, '-n', str(lines), '--no-pager'],
            capture_output=True, text=True, timeout=15
        )
        
        if result.returncode == 0:
            return {"logs": result.stdout.split('\n')}
        else:
            return {"logs": [], "error": result.stderr}
    except subprocess.TimeoutExpired:
        raise HTTPException(status_code=408, detail="Log retrieval timed out")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get logs: {str(e)}")

@app.get("/health")
async def health_check():
    """健康检查"""
    return {
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "monitored_services_count": len(load_monitored_services())
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=6996)
