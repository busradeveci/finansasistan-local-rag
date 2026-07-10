"""Phi-4-mini powered offline semantic router.

Classifies every incoming query into one of three local execution tracks
before any retrieval or generation work begins.  Falls back to deterministic
rules when the router model is unavailable.
"""
from __future__ import annotations

import asyncio
import logging
import re
from enum import Enum

from backend.services.foundry_client import get_router_client
from backend.services.intent import Intent, classify_intent

logger = logging.getLogger(__name__)

_ROUTER_PROMPT = """You are an offline semantic intent router. Classify the user query into exactly ONE track:

LOCAL_MATH — arithmetic, percentages, ratios, numerical calculations, metric formulas, "what is 15% of 200", sum/average of numbers.
LOCAL_RAG — questions about uploaded documents, policies, contracts, reports, clauses, tables, factual lookup from a knowledge base.
LOCAL_CHAT — greetings, small talk, wellbeing checks, identity questions, system status, thanks, farewells, general conversation.

Reply with ONLY one token on a single line: LOCAL_MATH, LOCAL_RAG, or LOCAL_CHAT."""


class ExecutionTrack(str, Enum):
    LOCAL_MATH = "LOCAL_MATH"
    LOCAL_RAG = "LOCAL_RAG"
    LOCAL_CHAT = "LOCAL_CHAT"


TRACK_BADGE: dict[ExecutionTrack, str] = {
    ExecutionTrack.LOCAL_MATH: "Local Agent: Phi-4 Reasoning",
    ExecutionTrack.LOCAL_RAG: "Local RAG: Qwen Embedded Index",
    ExecutionTrack.LOCAL_CHAT: "Standard Chat: Phi-3.5",
}

_MATH_SIGNALS = re.compile(
    r"(?:"
    r"\d+\s*[\+\-\*\/\^×÷]\s*\d+"  # inline arithmetic
    r"|(?:what|how much|calculate|compute|evaluate|solve|find)\s+(?:is\s+)?\d"
    r"|(?:percent|percentage|ratio|average|mean|sum|total|difference)\s+(?:of|between|is)"
    r"|\d+\s*%\s*(?:of|increase|decrease|change)"
    r"|(?:\+|\-|\*|\/|\^)\s*\d"
    r")",
    re.IGNORECASE,
)

_TRACK_TOKEN_RE = re.compile(r"\b(LOCAL_MATH|LOCAL_RAG|LOCAL_CHAT)\b", re.IGNORECASE)


def _deterministic_track(query: str) -> ExecutionTrack:
    """Zero-model fallback when phi-4-mini is unavailable."""
    if classify_intent(query) is Intent.SMALLTALK:
        return ExecutionTrack.LOCAL_CHAT
    if _MATH_SIGNALS.search(query) and not re.search(
        r"(document|policy|contract|clause|report|collateral|loan|credit|belge|sözleşme|rapor)",
        query,
        re.IGNORECASE,
    ):
        return ExecutionTrack.LOCAL_MATH
    return ExecutionTrack.LOCAL_RAG


def _parse_track(raw: str) -> ExecutionTrack | None:
    match = _TRACK_TOKEN_RE.search(raw or "")
    if not match:
        return None
    try:
        return ExecutionTrack(match.group(1).upper())
    except ValueError:
        return None


async def classify_track(query: str) -> ExecutionTrack:
    """Classify *query* into a local execution track using phi-4-mini."""
    clean = (query or "").strip()
    if not clean:
        return ExecutionTrack.LOCAL_CHAT

    try:
        router = await get_router_client()
        messages = [
            {"role": "system", "content": _ROUTER_PROMPT},
            {"role": "user", "content": clean},
        ]
        router.settings.max_tokens = 16
        router.settings.temperature = 0.0
        router.settings.top_p = 0.9
        response = await asyncio.to_thread(router.complete_chat, messages)
        raw = (response.choices[0].message.content or "").strip()
        track = _parse_track(raw)
        if track is not None:
            logger.info("Semantic router (phi-4-mini): '%s' → %s", clean[:80], track.value)
            return track
        logger.warning("Semantic router returned unparseable output %r — using fallback.", raw)
    except Exception as exc:
        logger.warning("Semantic router unavailable (%s) — using deterministic fallback.", exc)

    track = _deterministic_track(clean)
    logger.info("Semantic router (fallback): '%s' → %s", clean[:80], track.value)
    return track
