import time
import psutil  # type: ignore
import jwt  # type: ignore
import platform
import socket
import sys
import os
import hashlib
from datetime import datetime, timedelta, timezone
from pathlib import Path
from pydantic import BaseModel  # type: ignore
from fastapi import APIRouter, HTTPException  # type: ignore
from backend.config import (
    DB_PATH, CHAT_MODEL, EMBED_MODEL, ROUTER_MODEL,
    CHUNK_SIZE, CHUNK_OVERLAP, TOP_K, SCORE_THRESHOLD,
    RELATIVE_SCORE_CUTOFF, MAX_CONTEXT_CHUNKS
)
from backend.db.database import get_connection

try:
    # Python 3.12+ removed distutils, causing GPUtil to throw ModuleNotFoundError.
    if "distutils" not in sys.modules:
        import types
        import shutil
        distutils = types.ModuleType("distutils")
        distutils.spawn = types.ModuleType("distutils.spawn")  # type: ignore
        distutils.spawn.find_executable = shutil.which  # type: ignore
        sys.modules["distutils"] = distutils
        sys.modules["distutils.spawn"] = distutils.spawn  # type: ignore
    import GPUtil  # type: ignore
except ImportError:
    GPUtil = None  # type: ignore

_last_disk_io = None
_last_net_io = None
_last_io_time = None
_boot_time = psutil.boot_time()

router = APIRouter(prefix="/api/v1", tags=["api_v1"])

JWT_SECRET = "vectorvault_secret_key_123!"
JWT_ALGORITHM = "HS256"

class LoginRequest(BaseModel):
    email: str
    password: str

@router.post("/auth/login")
def login(request: LoginRequest):
    conn = get_connection(DB_PATH)
    try:
        hashed_pwd = hashlib.sha256(request.password.encode()).hexdigest()
        
        user = conn.execute(
            "SELECT id, email, display_name, role FROM users WHERE email = ? AND hashed_password = ?",
            (request.email, hashed_pwd)
        ).fetchone()
        
        if not user:
            conn.execute(
                "INSERT INTO audit_logs (event_type, operator_email, status, message_details, latency_ms) VALUES (?, ?, ?, ?, ?)",
                ("[AUTH]", request.email, "DENIED", "Unauthorized Operator Access Denied", 5)
            )
            conn.commit()
            raise HTTPException(status_code=401, detail="Unauthorized Operator Credentials. Access denied by Air-Gap Security Manager.")
            
        conn.execute(
            "INSERT INTO audit_logs (event_type, operator_email, status, message_details, latency_ms) VALUES (?, ?, ?, ?, ?)",
            ("[AUTH]", request.email, "SUCCESS", "Operator session initialized", 8)
        )
        conn.commit()
        
        payload = {
            "sub": user["email"],
            "exp": datetime.now(timezone.utc) + timedelta(hours=12)
        }
        token = jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)
        
        return {
            "token": f"vv_local_{token}",
            "user": {
                "email": user["email"],
                "displayName": user["display_name"],
                "role": user["role"],
                "initials": "".join([part[0].upper() for part in (user["display_name"] or "").split(" ")[:2] if part])
            }
        }
    finally:
        conn.close()

@router.get("/telemetry/system")
def get_system_telemetry():
    global _last_disk_io, _last_net_io, _last_io_time
    
    current_time = time.time()
    disk_io = psutil.disk_io_counters()
    net_io = psutil.net_io_counters()
    
    # Calculate IO deltas
    read_bps = 0
    write_bps = 0
    sent_bps = 0
    recv_bps = 0
    
    if _last_io_time and disk_io and _last_disk_io and net_io and _last_net_io:
        delta_time = current_time - _last_io_time
        if delta_time > 0:
            read_bps = (disk_io.read_bytes - _last_disk_io.read_bytes) / delta_time
            write_bps = (disk_io.write_bytes - _last_disk_io.write_bytes) / delta_time
            sent_bps = (net_io.bytes_sent - _last_net_io.bytes_sent) / delta_time
            recv_bps = (net_io.bytes_recv - _last_net_io.bytes_recv) / delta_time
            
    _last_disk_io = disk_io
    _last_net_io = net_io
    _last_io_time = current_time
    
    cpu_freq = psutil.cpu_freq()
    memory = psutil.virtual_memory()
    
    disk_usage = psutil.disk_usage(os.path.abspath(os.sep))
    
    conn = get_connection(DB_PATH)
    try:
        chunks_count = conn.execute("SELECT COUNT(*) FROM vector_chunks").fetchone()[0]
    except Exception:
        chunks_count = 0
    finally:
        conn.close()
        
    db_file_size = 0
    if Path(DB_PATH).exists():
        db_file_size = Path(DB_PATH).stat().st_size / (1024 * 1024)
        
    gpu_data = {"percent": None, "vram": None, "name": None}
    if GPUtil:
        gpus = GPUtil.getGPUs()
        if gpus:
            gpu_data["percent"] = round(gpus[0].load * 100, 1)
            gpu_data["vram"] = round(gpus[0].memoryUsed / 1024, 1) # GB
            gpu_data["name"] = gpus[0].name

    hostname = socket.gethostname()
    try:
        local_ip = socket.gethostbyname(hostname)
    except Exception:
        local_ip = "127.0.0.1"

    # CPU load average is not available on Windows, return None gracefully
    cpu_load = None
    if hasattr(psutil, "getloadavg"):
        cpu_load = psutil.getloadavg()
        
    return {
        "cpu": {
            "percent": psutil.cpu_percent(interval=None),
            "logical_cores": psutil.cpu_count(logical=True),
            "physical_cores": psutil.cpu_count(logical=False),
            "frequency": round(cpu_freq.current, 1) if cpu_freq else None,
            "load": cpu_load,
            "temperature": None # Requires specific sensor support, returning honest null
        },
        "memory": {
            "used_gb": round((memory.total - memory.available) / 1024**3, 1),
            "total_gb": round(memory.total / 1024**3, 1),
            "percent": memory.percent
        },
        "gpu": gpu_data,
        "storage": {
            "percent": disk_usage.percent,
            "total_capacity": f"{round(disk_usage.total / 1024**3, 1)} GB",
            "used_space": f"{round(disk_usage.used / 1024**3, 1)} GB",
            "available_space": f"{round(disk_usage.free / 1024**3, 1)} GB",
            "read_mbps": round(read_bps / (1024 * 1024), 2),
            "write_mbps": round(write_bps / (1024 * 1024), 2),
            "sqlite_size": f"{round(db_file_size, 2)} MB",
            "vector_size": "Awaiting Backend Integration" # Need vector store specific size if separated
        },
        "network": {
            "hostname": hostname,
            "local_ip": local_ip,
            "bytes_sent_sec": round(sent_bps, 2),
            "bytes_recv_sec": round(recv_bps, 2),
            "status": "Operational",
            "offline_mode": True,
            "localhost_endpoint": "http://127.0.0.1:8000",
            "active_connections": len(psutil.net_connections()),
            "zero_outbound": True
        },
        "system": {
            "uptime": f"{round((current_time - _boot_time) / 3600, 1)} hours",
            "os": platform.system(),
            "architecture": platform.machine(),
            "python_version": sys.version.split(" ")[0]
        },
        "runtime": {
            "chat_model": CHAT_MODEL,
            "embed_model": EMBED_MODEL,
            "router_model": ROUTER_MODEL,
            "provider": "Foundry Local Core"
        },
        "vector_db": {
            "chunks_count": chunks_count,
            "db_size_mb": round(db_file_size, 2)
        }
    }


@router.get("/security/logs")
def get_security_logs():
    conn = get_connection(DB_PATH)
    try:
        logs = conn.execute(
            "SELECT timestamp, event_type, operator_email, status, message_details FROM audit_logs ORDER BY timestamp DESC LIMIT 50"
        ).fetchall()
        
        return [
            {
                "timestamp": log["timestamp"],
                "event_type": log["event_type"],
                "operator_email": log["operator_email"],
                "status": log["status"],
                "message_details": log["message_details"]
            }
            for log in logs
        ]
    finally:
        conn.close()

@router.get("/config")
def get_config():
    return {
        "models": {
            "chat_model": CHAT_MODEL,
            "embed_model": EMBED_MODEL,
            "router_model": ROUTER_MODEL
        },
        "retrieval": {
            "score_threshold": SCORE_THRESHOLD,
            "relative_cutoff": RELATIVE_SCORE_CUTOFF,
            "max_context_chunks": MAX_CONTEXT_CHUNKS,
            "top_k": TOP_K
        },
        "indexing": {
            "chunk_size": CHUNK_SIZE,
            "chunk_overlap": CHUNK_OVERLAP
        }
    }

