from __future__ import annotations

from typing import AsyncIterator

from backend.config import CHAT_MODEL, SYSTEM_PROMPT

_chat_client = None


# ---------------------------------------------------------------------------
# Client initialisation
# ---------------------------------------------------------------------------

async def _init_chat_client() -> None:
    """Lazy-load the Foundry Local chat model on first use."""
    global _chat_client

    if _chat_client is not None:
        return

    from foundry_local import FoundryLocalManager  # type: ignore[import]

    print(f"[generation] Loading chat model '{CHAT_MODEL}' …")
    manager = FoundryLocalManager(alias=CHAT_MODEL)
    _chat_client = manager.get_client()
    print(f"[generation] Chat model ready.")


# ---------------------------------------------------------------------------
# Message building
# ---------------------------------------------------------------------------

def _build_context(chunks: list[dict]) -> str:
    return "\n\n".join(
        f"[Kaynak: {c['filename']} | Uygunluk: {c['score']:.2f}]\n{c['content']}"
        for c in chunks
    )


def _build_messages(context: str, query: str, history: list[dict] | None) -> list[dict]:
    messages: list[dict] = [{"role": "system", "content": SYSTEM_PROMPT}]

    if history:
        messages.extend(history[-6:])

    messages.append(
        {"role": "user", "content": f"Bağlam:\n{context}\n\nSoru: {query}"}
    )
    return messages


# ---------------------------------------------------------------------------
# Generation
# ---------------------------------------------------------------------------

async def generate(
    chunks: list[dict],
    query: str,
    history: list[dict] | None = None,
) -> str:
    """Return the full model response as a string.

    chunks: [{filename, content, score}] from retrieval.
    history: optional list of previous {role, content} messages (last 6 used).
    """
    await _init_chat_client()

    context = _build_context(chunks)
    messages = _build_messages(context, query, history)

    response = _chat_client.chat.completions.create(
        model=CHAT_MODEL,
        messages=messages,
    )
    return response.choices[0].message.content


async def stream_generate(
    chunks: list[dict],
    query: str,
    history: list[dict] | None = None,
) -> AsyncIterator[str]:
    """Yield the model response token by token.

    Falls back to a single-yield of the full response if the Foundry Local
    client does not support streaming.
    """
    await _init_chat_client()

    context = _build_context(chunks)
    messages = _build_messages(context, query, history)

    try:
        stream = _chat_client.chat.completions.create(
            model=CHAT_MODEL,
            messages=messages,
            stream=True,
        )
        for chunk in stream:
            delta = chunk.choices[0].delta
            token = getattr(delta, "content", None)
            if token:
                yield token
    except Exception:
        # Streaming not supported — fall back to blocking generate
        full_response = await generate(chunks, query, history)
        yield full_response
