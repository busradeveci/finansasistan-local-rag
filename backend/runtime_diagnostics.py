"""
Foundry Local — runtime diagnostics for frontend ↔ backend contract checks.

Run BEFORE or AFTER starting servers:

    python -m backend.runtime_diagnostics

Optional flags (via env):
    RUNTIME_CHECK_HTTP=1   — also probe http://127.0.0.1:8000 when backend is up
"""

from __future__ import annotations

import json
import os
import sqlite3
import sys
import tempfile
import urllib.error
import urllib.request
from pathlib import Path
from typing import Any

from backend.config import DATA_DIR, DB_PATH, DOCS_DIR, ROOT_DIR
from backend.db.vector_store import init_db, list_documents, vector_index_stats
from backend.services.ingestion import extract_text

BACKEND_URL = os.environ.get("RUNTIME_BACKEND_URL", "http://127.0.0.1:8000")
FRONTEND_URL = os.environ.get("RUNTIME_FRONTEND_URL", "http://127.0.0.1:5173")


def _check(name: str, ok: bool, detail: str = "") -> dict[str, Any]:
    return {"name": name, "ok": ok, "detail": detail}


def _import_extractors() -> dict[str, Any]:
    try:
        import pypdf  # noqa: F401
        import docx  # noqa: F401
        import fitz  # noqa: F401
        import psutil  # noqa: F401
        import pandas  # noqa: F401
        import openpyxl  # noqa: F401

        return _check(
            "document_extractors",
            True,
            "pypdf, pymupdf, python-docx, pandas, openpyxl and psutil imports OK",
        )
    except ImportError as exc:
        return _check("document_extractors", False, str(exc))


def _check_paths() -> list[dict[str, Any]]:
    results: list[dict[str, Any]] = []
    for label, path in [
        ("data_dir", DATA_DIR),
        ("docs_dir", DOCS_DIR),
        ("vector_db", DB_PATH),
    ]:
        exists = path.exists()
        if label in ("data_dir", "docs_dir") and not exists:
            path.mkdir(parents=True, exist_ok=True)
            exists = path.exists()
        results.append(
            _check(
                label,
                exists,
                str(path) if exists else f"missing — expected at {path}",
            )
        )
    return results


def _check_sqlite() -> dict[str, Any]:
    try:
        init_db(DB_PATH)
        docs = list_documents(DB_PATH)
        index = vector_index_stats(DB_PATH)
        return _check(
            "sqlite_vector_store",
            True,
            f"{len(docs)} document(s), {index['vectors']} vector(s), {index['dimensions']} dims",
        )
    except sqlite3.Error as exc:
        return _check("sqlite_vector_store", False, str(exc))


def _check_extraction_pipeline() -> dict[str, Any]:
    sample = (
        "Runtime diagnostic sample paragraph with enough characters to pass the "
        "minimum chunk length threshold used by the ingestion pipeline."
    )
    try:
        with tempfile.NamedTemporaryFile(
            mode="w", suffix=".txt", delete=False, encoding="utf-8"
        ) as tmp:
            tmp.write(sample)
            tmp_path = Path(tmp.name)
        text = extract_text(tmp_path)
        tmp_path.unlink(missing_ok=True)
        if not text.strip():
            return _check("text_extraction", False, "extract_text returned empty string")
        return _check("text_extraction", True, f"{len(text)} chars extracted from .txt sample")
    except Exception as exc:
        return _check("text_extraction", False, str(exc))


def _http_get(url: str, timeout: float = 5.0) -> tuple[int, dict | str]:
    req = urllib.request.Request(url, headers={"Accept": "application/json"})
    with urllib.request.urlopen(req, timeout=timeout) as resp:
        body = resp.read().decode()
        try:
            return resp.status, json.loads(body)
        except json.JSONDecodeError:
            return resp.status, body


def _check_backend_http() -> list[dict[str, Any]]:
    results: list[dict[str, Any]] = []
    try:
        status, payload = _http_get(f"{BACKEND_URL}/api/status")
        ok = status == 200 and isinstance(payload, dict) and payload.get("status") == "ok"
        doc_count = (
            payload.get("vector_store", {}).get("document_count")
            if isinstance(payload, dict)
            else "?"
        )
        results.append(
            _check("backend_http_status", ok, f"HTTP {status}, {doc_count} indexed doc(s)")
        )
    except urllib.error.URLError as exc:
        results.append(
            _check(
                "backend_http_status",
                False,
                f"{BACKEND_URL} unreachable — start with: python -m uvicorn backend.main:app --port 8000 ({exc})",
            )
        )
        return results

    try:
        status, payload = _http_get(f"{BACKEND_URL}/documents/inventory", timeout=10)
        ok = status == 200 and isinstance(payload, dict) and "documents" in payload
        count = len(payload.get("documents", [])) if isinstance(payload, dict) else 0
        results.append(
            _check("backend_inventory", ok, f"HTTP {status}, {count} row(s) in inventory")
        )
    except urllib.error.URLError as exc:
        results.append(_check("backend_inventory", False, str(exc)))

    try:
        req = urllib.request.Request(
            f"{BACKEND_URL}/documents/inventory",
            headers={"Origin": FRONTEND_URL},
            method="GET",
        )
        with urllib.request.urlopen(req, timeout=10) as resp:
            cors = resp.headers.get("Access-Control-Allow-Origin", "")
            ok = bool(cors)
            results.append(
                _check(
                    "cors_frontend_origin",
                    ok,
                    f"Access-Control-Allow-Origin={cors or '(missing)'} for Origin {FRONTEND_URL}",
                )
            )
    except urllib.error.URLError as exc:
        results.append(_check("cors_frontend_origin", False, str(exc)))

    return results


def collect_diagnostics(*, check_http: bool | None = None) -> dict[str, Any]:
    if check_http is None:
        check_http = os.environ.get("RUNTIME_CHECK_HTTP", "0") == "1"

    checks: list[dict[str, Any]] = [
        _check("project_root", ROOT_DIR.exists(), str(ROOT_DIR)),
        _import_extractors(),
        *_check_paths(),
        _check_sqlite(),
        _check_extraction_pipeline(),
    ]

    if check_http:
        checks.extend(_check_backend_http())

    passed = sum(1 for c in checks if c["ok"])
    return {
        "status": "ok" if passed == len(checks) else "degraded",
        "passed": passed,
        "total": len(checks),
        "backend_url": BACKEND_URL,
        "frontend_url": FRONTEND_URL,
        "paths": {
            "data_dir": str(DATA_DIR),
            "docs_dir": str(DOCS_DIR),
            "db_path": str(DB_PATH),
        },
        "checks": checks,
    }


def main() -> None:
    report = collect_diagnostics(check_http=True)
    print("=" * 60)
    print("  Foundry Local — Runtime Diagnostics")
    print("=" * 60)
    for item in report["checks"]:
        mark = "PASS" if item["ok"] else "FAIL"
        print(f"  [{mark}] {item['name']}: {item['detail']}")
    print("-" * 60)
    print(f"  Result: {report['passed']}/{report['total']} checks passed")
    print(f"  Backend: {report['backend_url']}")
    print(f"  Frontend: {report['frontend_url']}")
    print(f"  Docs dir: {report['paths']['docs_dir']}")
    print(f"  DB path:  {report['paths']['db_path']}")
    print("=" * 60)
    if report["status"] != "ok":
        print("\nStart servers:")
        print("  Terminal 1: python -m uvicorn backend.main:app --port 8000")
        print("  Terminal 2: cd frontend && npm run dev")
        sys.exit(1)
    print("\nAll checks passed — frontend and backend contract is healthy.")


if __name__ == "__main__":
    main()
