#!/usr/bin/env python3
"""
初始化示例数据库 - 用于开源项目的默认用户配置
"""
import sqlite3
import hashlib
import secrets
from datetime import datetime
import os

def create_example_database():
    """创建包含示例用户的SQLite数据库"""
    db_file = "users.example.db"

    # 如果已存在，先删除
    if os.path.exists(db_file):
        os.remove(db_file)

    conn = sqlite3.connect(db_file)
    try:
        cur = conn.cursor()

        # 创建用户表
        cur.execute("""
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                username TEXT UNIQUE NOT NULL,
                password_hash TEXT NOT NULL,
                salt TEXT NOT NULL,
                role TEXT NOT NULL,
                created_at TEXT NOT NULL
            )
        """)

        # 创建会话表
        cur.execute("""
            CREATE TABLE IF NOT EXISTS sessions (
                token TEXT PRIMARY KEY,
                username TEXT NOT NULL,
                expires_at INTEGER NOT NULL,
                created_at INTEGER NOT NULL
            )
        """)

        # 创建示例用户
        def create_user(username, password, role):
            salt = secrets.token_hex(16)
            pwd_hash = hashlib.pbkdf2_hmac(
                "sha256", password.encode(), salt.encode(), 100_000
            ).hex()
            cur.execute(
                "INSERT INTO users (username, password_hash, salt, role, created_at) VALUES (?, ?, ?, ?, ?)",
                (username, pwd_hash, salt, role, datetime.now().isoformat()),
            )

        # 创建默认用户
        create_user("admin", "admin123", "admin")
        create_user("user", "user123", "user")

        conn.commit()
        print(f"✅ 示例数据库已创建: {db_file}")
        print("📋 默认用户:")
        print("  - 管理员: admin/admin123")
        print("  - 用户: user/user123")
        print("\n⚠️  警告: 这些只是示例凭据，请在生产环境中修改！")

    except Exception as e:
        print(f"❌ 创建数据库失败: {e}")
        raise
    finally:
        conn.close()

if __name__ == "__main__":
    create_example_database()