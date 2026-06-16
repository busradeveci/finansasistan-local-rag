"""LLM generation service using Microsoft Foundry Local SDK (foundry-local-sdk).

Inference model : phi-3.5-mini  (alias defined in backend.config)
SDK package     : foundry-local-sdk  (import: foundry_local_sdk)
Pattern         :
    1.  FoundryLocalManager.initialize(config)  — singleton, idempotent
    2.  manager.catalog.get_model(alias)
    3.  model.download() + model.load()          — no-op if already cached/loaded
    4.  chat_client = model.get_chat_client()    — SDK-native ChatClient
    5.  chat_client.complete_chat(messages)      — non-streaming
       / chat_client.complete_chat(messages, stream=True) — streaming chunks

No OpenAI cloud, no HuggingFace, no external network calls.
"""
from __future__ import annotations

import asyncio
import logging
import time
from typing import AsyncIterator

from backend.config import CHAT_MODEL, MAX_CONTEXT_CHUNKS, SYSTEM_PROMPT
from backend.sanitize import sanitize_query

logger = logging.getLogger(__name__)

# Module-level lazy state
_chat_client = None          # foundry_local_sdk ChatClient
_sdk_initialized = False     # FoundryLocalManager singleton guard


# ---------------------------------------------------------------------------
# SDK initialisation helpers
# ---------------------------------------------------------------------------

def _ensure_sdk() -> None:
    """Initialise the Foundry Local SDK singleton (safe to call multiple times)."""
    global _sdk_initialized
    if _sdk_initialized:
        return
    from foundry_local_sdk import Configuration, FoundryLocalManager  # type: ignore[import]
    config = Configuration(app_name="FinansAsistan")
    FoundryLocalManager.initialize(config)
    _sdk_initialized = True
    logger.info("Foundry Local SDK singleton initialised (app=FinansAsistan).")


def _load_chat_model_blocking() -> object:
    """Download, load, and return the ChatClient — runs in a thread pool."""
    _ensure_sdk()
    from foundry_local_sdk import FoundryLocalManager  # type: ignore[import]

    manager = FoundryLocalManager.instance
    model = manager.catalog.get_model(CHAT_MODEL)

    logger.info("Downloading chat model '%s' (skipped if cached)…", CHAT_MODEL)
    model.download()

    logger.info("Loading chat model '%s' into inference engine…", CHAT_MODEL)
    model.load()

    client = model.get_chat_client()
    logger.info(
        "Chat model ready — alias='%s' endpoint=%s",
        CHAT_MODEL, getattr(manager, "endpoint", "native"),
    )
    return client


async def _init_chat_client() -> None:
    """Lazy-load the Foundry Local chat model on first use (async-safe)."""
    global _chat_client
    if _chat_client is not None:
        return

    logger.info("Initialising chat model '%s' via Foundry Local SDK…", CHAT_MODEL)
    t0 = time.perf_counter()
    _chat_client = await asyncio.to_thread(_load_chat_model_blocking)
    logger.info("Chat model '%s' ready in %.1f s.", CHAT_MODEL, time.perf_counter() - t0)


# ---------------------------------------------------------------------------
# Context / prompt building
# ---------------------------------------------------------------------------

def _enforce_chunk_limit(chunks: list[dict]) -> list[dict]:
    """Hard-cap the number of context chunks at MAX_CONTEXT_CHUNKS.

    Defence-in-depth: even if the retrieval layer returns more chunks than
    expected, the prompt builder never injects more than the configured max.
    """
    if len(chunks) > MAX_CONTEXT_CHUNKS:
        logger.warning(
            "Context chunk count %d exceeds MAX_CONTEXT_CHUNKS=%d — truncating.",
            len(chunks), MAX_CONTEXT_CHUNKS,
        )
        return chunks[:MAX_CONTEXT_CHUNKS]
    return chunks


def _build_context(chunks: list[dict]) -> str:
    """Format retrieved chunks as numbered source blocks.

    Numbered labels let the model cite specific sources precisely, making
    the citation instruction in SYSTEM_PROMPT unambiguous.
    """
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
    """Assemble the full message list sent to the chat model.

    Applies input sanitisation before the query enters any prompt template.
    Keeps the last 6 history turns to bound token consumption.
    """
    clean_query = sanitize_query(query)

    messages: list[dict] = [{"role": "system", "content": SYSTEM_PROMPT}]

    if history:
        messages.extend(history[-6:])

    user_content = (
        "Aşağıdaki kaynak bloklarını kullanarak soruyu yanıtla. "
        "Bu bloklarda bulunmayan hiçbir bilgiyi KULLANMA.\n\n"
        f"{context}\n\n"
        f"SORU: {clean_query}"
    )
    messages.append({"role": "user", "content": user_content})
    return messages


# ---------------------------------------------------------------------------
# Generation
# ---------------------------------------------------------------------------

async def generate(
    chunks: list[dict],
    query: str,
    history: list[dict] | None = None,
) -> str:
    """Return the full model response as a single string (blocking mode).

    Args:
        chunks:  [{filename, chunk_index, content, score}] from retrieval.
        query:   Raw user query (sanitised internally).
        history: Optional list of prior {role, content} messages (last 6 used).
    """
    await _init_chat_client()

    context  = _build_context(chunks)
    messages = _build_messages(context, query, history)

    logger.info(
        "Generating response (model=%s, context_chunks=%d, history_turns=%d).",
        CHAT_MODEL, len(chunks), len(history) if history else 0,
    )
    t0 = time.perf_counter()

    # Foundry Local SDK: ChatClient.complete_chat(messages)
    # Returns an OpenAI-compatible ChatCompletion response object.
    response = await asyncio.to_thread(
        _chat_client.complete_chat, messages
    )
    answer = response.choices[0].message.content

    elapsed_ms = (time.perf_counter() - t0) * 1000
    logger.info(
        "Generation complete in %.1f ms (%d output chars).", elapsed_ms, len(answer)
    )
    return answer


async def stream_generate(
    chunks: list[dict],
    query: str,
    history: list[dict] | None = None,
) -> AsyncIterator[str]:
    """Yield the model response token by token via SSE.

    Primary path  : complete_chat(messages, stream=True) — if the ChatClient
                    supports streaming, iterates chunks.choices[0].delta.content.
    Fallback path : complete_chat(messages)              — if streaming is
                    unsupported, yields the full response as a single token.
    """
    await _init_chat_client()

    context  = _build_context(chunks)
    messages = _build_messages(context, query, history)

    token_count = 0
    t0 = time.perf_counter()
    logger.info(
        "Starting streaming generation (model=%s, context_chunks=%d).",
        CHAT_MODEL, len(chunks),
    )

    try:
        stream = _chat_client.complete_chat(messages, stream=True)
        for chunk in stream:
            if not chunk.choices:
                continue
            delta = chunk.choices[0].delta
            token = getattr(delta, "content", None)
            if token:
                token_count += 1
                yield token

        elapsed_ms = (time.perf_counter() - t0) * 1000
        logger.info(
            "Stream complete: %d token(s) in %.1f ms.", token_count, elapsed_ms
        )

    except Exception as exc:
        elapsed_ms = (time.perf_counter() - t0) * 1000
        logger.warning(
            "stream_generate fell back to blocking call after %.1f ms "
            "(ChatClient.complete_chat stream not supported: %s).",
            elapsed_ms, type(exc).__name__,
        )
        # Fallback: blocking complete_chat, yield as single token
        response = await asyncio.to_thread(_chat_client.complete_chat, messages)
        yield response.choices[0].message.content
