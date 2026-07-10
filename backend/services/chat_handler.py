"""Straight-through local chat for the LOCAL_CHAT execution track (phi-3.5-mini)."""
from __future__ import annotations

import asyncio
import logging
import threading
import time
from typing import AsyncIterator

from backend.config import CHAT_MODEL
from backend.services.foundry_client import get_chat_client
from backend.services.generation import _apply_completion_settings, _clean_response_text
from backend.services.intent import Intent, classify_intent, smalltalk_response

logger = logging.getLogger(__name__)

_CHAT_SYSTEM = (
    "You are Foundry Local, an on-premises AI assistant operating in a secure, "
    "offline banking environment. Respond in crisp corporate English. Keep answers "
    "concise and professional. You do not have access to uploaded documents in this "
    "mode — direct the user to ask document-specific questions for knowledge-base lookup."
)


async def generate_chat(query: str, history: list[dict] | None = None) -> str:
    """Low-latency phi-3.5-mini response without RAG context."""
    if classify_intent(query) is Intent.SMALLTALK:
        return smalltalk_response(query)

    chat_client = await get_chat_client()
    _apply_completion_settings(chat_client)
    messages: list[dict] = [{"role": "system", "content": _CHAT_SYSTEM}]
    if history:
        messages.extend(history[-4:])
    messages.append({"role": "user", "content": query})

    t0 = time.perf_counter()
    response = await asyncio.to_thread(chat_client.complete_chat, messages)
    answer = _clean_response_text(response.choices[0].message.content or "")
    logger.info(
        "LOCAL_CHAT complete (model=%s) in %.1f ms.",
        CHAT_MODEL, (time.perf_counter() - t0) * 1000,
    )
    return answer or smalltalk_response(query)


async def stream_chat(
    query: str,
    history: list[dict] | None = None,
    chat_client=None,
) -> AsyncIterator[str]:
    """Stream a phi-3.5-mini chat response without RAG context."""
    if classify_intent(query) is Intent.SMALLTALK:
        yield smalltalk_response(query)
        return

    if chat_client is None:
        chat_client = await get_chat_client()
    _apply_completion_settings(chat_client)

    messages: list[dict] = [{"role": "system", "content": _CHAT_SYSTEM}]
    if history:
        messages.extend(history[-4:])
    messages.append({"role": "user", "content": query})

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

    emitted = ""
    while True:
        item = await queue.get()
        if item is _DONE:
            if not emitted:
                yield smalltalk_response(query)
            break
        if isinstance(item, Exception):
            logger.warning("LOCAL_CHAT stream failed (%s) — falling back.", item)
            response = await asyncio.to_thread(chat_client.complete_chat, messages)
            answer = _clean_response_text(response.choices[0].message.content or "")
            if answer:
                yield answer
            else:
                yield smalltalk_response(query)
            break
        emitted += item
        yield item
