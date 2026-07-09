"""In-memory operational metrics for the Analytics and Security Center modules.

Thread-safe counters and rolling latency samples recorded by the live
pipeline — nothing here is mocked or hardcoded.  State resets on process
restart, which is acceptable for a local, single-operator workstation.
"""
from __future__ import annotations

import threading
from collections import deque
from datetime import date

_LOCK = threading.Lock()
_MAX_SAMPLES = 200  # rolling window for latency averages


class _State:
    def __init__(self) -> None:
        self.day = date.today()
        self.queries_today = 0
        self.response_ms: deque[float] = deque(maxlen=_MAX_SAMPLES)
        self.retrieval_ms: deque[float] = deque(maxlen=_MAX_SAMPLES)
        self.generation_ms: deque[float] = deque(maxlen=_MAX_SAMPLES)
        self.embedding_ms: deque[float] = deque(maxlen=_MAX_SAMPLES)
        self.context_tokens = 0
        # Security counters
        self.sanitized_queries = 0
        self.prompt_injections_blocked = 0
        self.uploads_rejected = 0


_S = _State()


def _roll_day() -> None:
    today = date.today()
    if _S.day != today:
        _S.day = today
        _S.queries_today = 0


# ── Recording hooks (called from the live pipeline) ─────────────────────────

def record_query(response_ms: float) -> None:
    with _LOCK:
        _roll_day()
        _S.queries_today += 1
        _S.response_ms.append(response_ms)


def record_retrieval(ms: float) -> None:
    with _LOCK:
        _S.retrieval_ms.append(ms)


def record_generation(ms: float) -> None:
    with _LOCK:
        _S.generation_ms.append(ms)


def record_embedding(ms: float) -> None:
    with _LOCK:
        _S.embedding_ms.append(ms)


def add_context_tokens(count: int) -> None:
    with _LOCK:
        _S.context_tokens += max(0, count)


def record_sanitized_query() -> None:
    with _LOCK:
        _S.sanitized_queries += 1


def record_prompt_injection() -> None:
    with _LOCK:
        _S.prompt_injections_blocked += 1


def record_upload_rejected() -> None:
    with _LOCK:
        _S.uploads_rejected += 1


# ── Snapshots (served by /api/analytics and /api/security) ──────────────────

def _avg(samples: deque[float]) -> float:
    return round(sum(samples) / len(samples), 1) if samples else 0.0


def analytics_snapshot() -> dict:
    with _LOCK:
        _roll_day()
        return {
            "queries_processed_today": _S.queries_today,
            "avg_response_ms": _avg(_S.response_ms),
            "avg_retrieval_ms": _avg(_S.retrieval_ms),
            "avg_generation_ms": _avg(_S.generation_ms),
            "avg_embedding_ms": _avg(_S.embedding_ms),
            "context_tokens_accumulated": _S.context_tokens,
            "sample_count": len(_S.response_ms),
        }


def security_snapshot() -> dict:
    with _LOCK:
        threats = _S.prompt_injections_blocked + _S.uploads_rejected
        return {
            "sanitized_queries": _S.sanitized_queries,
            "prompt_injections_blocked": _S.prompt_injections_blocked,
            "uploads_rejected": _S.uploads_rejected,
            "threats_blocked": threats,
            "risk_tier": "Low / Healthy" if threats < 10 else "Elevated",
        }
