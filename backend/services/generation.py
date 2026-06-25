"""LLM generation service — Microsoft Foundry Local SDK (foundry-local-sdk)."""
from __future__ import annotations

import asyncio
import logging
import re
import threading
import time
from typing import AsyncIterator

from backend.config import CHAT_MODEL, MAX_CONTEXT_CHUNKS, SYSTEM_PROMPT
from backend.sanitize import sanitize_query
from backend.services.foundry_client import get_chat_client

logger = logging.getLogger(__name__)

_MAX_TOKENS = 512
_TEMPERATURE = 0.0
_TOP_P = 0.9

# Strip model structural placeholders e.g. <|answer text|>, <answer text>
_STRUCTURAL_TAG_RE = re.compile(
    r"<\|[^|>]*\|>"           # <|answer text|>
    r"|<\s*answer\s+text\s*>"   # <answer text>
    r"|<\s*/?\s*answer\s*>",   # <answer>, </answer>
    re.IGNORECASE,
)
_CHUNK_ID_RE = re.compile(r"\(chunk\s*#\d+\)", re.IGNORECASE)


def _scrub_response_content(text: str, *, strip_edges: bool = True) -> str:
    """Remove structural tags and chunk IDs before sending text to the frontend."""
    if not text:
        return ""
    cleaned = text.replace("<|answer text|>", "")
    cleaned = _STRUCTURAL_TAG_RE.sub("", cleaned)
    cleaned = _CHUNK_ID_RE.sub("", cleaned)
    return cleaned.strip() if strip_edges else cleaned


def _clean_response_text(text: str) -> str:
    """Final cleanup for complete responses."""
    return _scrub_response_content(text, strip_edges=True)


class _StreamingTagStripper:
    """Remove structural tags and chunk IDs from streamed tokens."""

    def __init__(self) -> None:
        self._pending = ""

    def feed(self, piece: str) -> str:
        self._pending += piece
        cleaned = _scrub_response_content(self._pending, strip_edges=False)

        # Hold a trailing fragment that may be the start of an incomplete tag or chunk ref.
        hold_from = max(cleaned.rfind("<"), cleaned.rfind("(chunk"))
        if hold_from != -1:
            tail = cleaned[hold_from:]
            if tail.startswith("<") and ">" not in tail:
                emit, self._pending = cleaned[:hold_from], cleaned[hold_from:]
                return emit
            if tail.lower().startswith("(chunk") and ")" not in tail:
                emit, self._pending = cleaned[:hold_from], cleaned[hold_from:]
                return emit

        self._pending = ""
        return cleaned

    def flush(self) -> str:
        rest = _scrub_response_content(self._pending, strip_edges=False)
        self._pending = ""
        return rest


def _apply_completion_settings(chat_client) -> None:
    """Deterministic inference settings — zero creative variance."""
    chat_client.settings.max_tokens = _MAX_TOKENS
    chat_client.settings.temperature = 0.0
    chat_client.settings.top_p = _TOP_P


def _enforce_chunk_limit(chunks: list[dict]) -> list[dict]:
    if len(chunks) > MAX_CONTEXT_CHUNKS:
        logger.warning(
            "Context chunk count %d exceeds MAX_CONTEXT_CHUNKS=%d — truncating.",
            len(chunks), MAX_CONTEXT_CHUNKS,
        )
        return chunks[:MAX_CONTEXT_CHUNKS]
    return chunks


def _build_context(chunks: list[dict]) -> str:
    safe_chunks = _enforce_chunk_limit(chunks)
    blocks = []
    for i, c in enumerate(safe_chunks, start=1):
        blocks.append(
            f"[KAYNAK {i}: {c['filename']} (chunk #{c.get('chunk_index', '?')}) "
            f"| benzerlik={c['score']:.2f}]\n"
            f"{c['content']}"
        )
    return "\n\n---\n\n".join(blocks)


def _build_messages(context: str, query: str, history: list[dict] | None) -> list[dict]:
    clean_query = sanitize_query(query)
    messages: list[dict] = [{"role": "system", "content": SYSTEM_PROMPT}]
    if history:
        messages.extend(history[-6:])
    user_content = (
        "Act as a Senior Corporate Banking Consultant and Risk Analyst. "
        "Using ONLY the source blocks below, produce a two-section executive response in fluent Turkish:\n\n"
        "📊 Kurumsal Analiz Raporu — explain the exact facts from the sources in full, professional sentences.\n"
        "💡 Stratejik Risk Tavsiyeleri (Yönetici Özeti) — provide logical strategic advice and risk warnings "
        "that directly follow from those facts; do not introduce unsupported facts.\n\n"
        "Rules:\n"
        "- No bare fragments, isolated numbers, or keyword lists.\n"
        "- Markdown bullet points (- item) are allowed within sections.\n"
        "- End with: Kaynaklar: [document_name]\n\n"
        f"{context}\n\n"
        f"QUESTION: {clean_query}"
    )
    messages.append({"role": "user", "content": user_content})
    return messages


async def generate(
    chunks: list[dict],
    query: str,
    history: list[dict] | None = None,
) -> str:
    """Return the full model response as a string."""
    chat_client = await get_chat_client()
    _apply_completion_settings(chat_client)
    context = _build_context(chunks)
    messages = _build_messages(context, query, history)

    logger.info(
        "Generating response (model=%s, context_chunks=%d, history_turns=%d, "
        "max_tokens=%d, temperature=%.1f).",
        CHAT_MODEL, len(chunks), len(history) if history else 0,
        _MAX_TOKENS, 0.0,
    )
    t0 = time.perf_counter()
    response = await asyncio.to_thread(chat_client.complete_chat, messages)
    answer = _clean_response_text(response.choices[0].message.content or "")
    logger.info(
        "Generation complete in %.1f ms (%d chars).",
        (time.perf_counter() - t0) * 1000, len(answer),
    )
    return answer


async def stream_generate(
    chunks: list[dict],
    query: str,
    history: list[dict] | None = None,
    chat_client=None,
) -> AsyncIterator[str]:
    """Yield response tokens via SSE.

    Uses ChatClient.complete_streaming_chat() — the correct Foundry SDK API.
    Falls back to blocking complete_chat() if streaming fails.
    """
    if chat_client is None:
        chat_client = await get_chat_client()
    _apply_completion_settings(chat_client)

    context = _build_context(chunks)
    messages = _build_messages(context, query, history)

    token_count = 0
    t0 = time.perf_counter()
    logger.info(
        "Starting streaming generation (model=%s, chunks=%d, max_tokens=%d, temperature=%.1f).",
        CHAT_MODEL, len(chunks), _MAX_TOKENS, 0.0,
    )

    loop = asyncio.get_running_loop()
    queue: asyncio.Queue = asyncio.Queue()
    _DONE = object()

    def _run_stream() -> None:
        try:
            for chunk in chat_client.complete_streaming_chat(messages):
                if not chunk.choices:
                    continue
                token = getattr(chunk.choices[0].delta, "content", None)
                if token:
                    loop.call_soon_threadsafe(queue.put_nowait, token)
        except Exception as exc:
            loop.call_soon_threadsafe(queue.put_nowait, exc)
        finally:
            loop.call_soon_threadsafe(queue.put_nowait, _DONE)

    threading.Thread(target=_run_stream, daemon=True).start()

    stripper = _StreamingTagStripper()
    while True:
        item = await queue.get()
        if item is _DONE:
            tail = stripper.flush()
            if tail:
                yield tail
            break
        if isinstance(item, Exception):
            logger.warning(
                "Streaming failed (%s) — falling back to blocking complete_chat.",
                item,
            )
            response = await asyncio.to_thread(chat_client.complete_chat, messages)
            answer = _clean_response_text(response.choices[0].message.content or "")
            if answer:
                yield answer
            break
        token_count += 1
        cleaned = stripper.feed(item)
        if cleaned:
            yield cleaned

    logger.info(
        "Stream complete: %d token(s) in %.1f ms.",
        token_count, (time.perf_counter() - t0) * 1000,
    )
