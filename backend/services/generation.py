"""LLM generation service — Microsoft Foundry Local SDK (foundry-local-sdk)."""
from __future__ import annotations

import asyncio
import logging
import re
import threading
import time
from typing import AsyncIterator

from backend.config import CHAT_MODEL, MAX_CONTEXT_CHUNKS, NO_CONTEXT_ANSWER, SYSTEM_PROMPT
from backend.sanitize import sanitize_query
from backend.services import metrics
from backend.services.foundry_client import get_chat_client

# Rough token estimate for local accounting (≈4 chars per token for English).
_CHARS_PER_TOKEN = 4

logger = logging.getLogger(__name__)

# Long-form analytical answers must never be truncated mid-clause: the model
# is mandated to exhaust every relevant data point in the retrieved context.
_MAX_TOKENS = 2048
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

# Emojis and pictographs are banned in corporate reporting output.  Only clear
# emoji/pictograph blocks are stripped — arrows and mathematical notation are
# preserved so source-document symbols survive character-for-character.
_EMOJI_RE = re.compile(
    "["
    "\U0001F1E6-\U0001F1FF"   # regional indicators (flags)
    "\U0001F300-\U0001FAFF"   # symbols, pictographs, emoticons, transport
    "\U00002600-\U000026FF"   # miscellaneous symbols
    "\U00002700-\U000027BF"   # dingbats
    "\uFE0F"                  # variation selector-16
    "]"
)


def _scrub_response_content(text: str, *, strip_edges: bool = True) -> str:
    """Remove structural tags, chunk IDs, and emojis before sending text out."""
    if not text:
        return ""
    cleaned = text.replace("<|answer text|>", "")
    cleaned = _STRUCTURAL_TAG_RE.sub("", cleaned)
    cleaned = _CHUNK_ID_RE.sub("", cleaned)
    cleaned = _EMOJI_RE.sub("", cleaned)
    return cleaned.strip() if strip_edges else cleaned


# ---------------------------------------------------------------------------
# Repetition / phrase-loop safety filter
# ---------------------------------------------------------------------------
# Small local models occasionally degenerate into loops such as
# "commitment for commitment" or a sentence repeated verbatim.  This filter is
# the deterministic backstop behind the SYSTEM_PROMPT's NO REPETITION rule.

# "X for X", "X and X" — connective sandwiched between the same word.
# Turkish connectives are retained as a legacy guard for mixed-language output.
_CONNECTIVE_LOOP_RE = re.compile(
    r"\b([^\W\d_]{2,})"
    r"((?:\s+(?:for|and|or|with|like|as|to|of|by|in|on|over"
    r"|için|ile|ve|veya|gibi|olarak|üzere)\s+\1\b)+)",
    re.IGNORECASE | re.UNICODE,
)

# Legitimate English "X-connective-X" constructions that must never be
# collapsed — financial reporting is full of them ("quarter over quarter",
# "dollar for dollar", "case by case").
_EN_IDIOM_WORDS = frozenset({
    "day", "side", "step", "one", "back", "face", "hand", "more", "little",
    "again", "year", "month", "quarter", "week", "case", "dollar", "euro",
    "pound", "word", "line", "item", "point", "time", "end", "eye", "measure",
})

_SENTENCE_SPLIT_RE = re.compile(r"(?<=[.!?…])\s+")


def _norm_token(token: str) -> str:
    return token.strip(".,;:!?…()\"'").casefold()


def _collapse_connective_loop(match: re.Match) -> str:
    """Collapse "X for X" loops, sparing legitimate English idioms."""
    word = match.group(1)
    if word.casefold() in _EN_IDIOM_WORDS:
        return match.group(0)
    return word


def _collapse_ngram_loops(line: str) -> str:
    """Collapse immediately repeated word sequences within a single line.

    Multi-word phrases repeated back-to-back are always a loop and collapse on
    the first repeat.  Single words collapse only from the third consecutive
    occurrence, so legitimate doubled words in English ("had had", "that
    that") and Turkish reduplication ("ayrı ayrı") survive.
    """
    tokens = line.split(" ")
    for n in range(4, 0, -1):
        min_repeats = 1 if n > 1 else 2
        out: list[str] = []
        i = 0
        while i < len(tokens):
            gram = [_norm_token(t) for t in tokens[i : i + n]]
            if len(gram) == n and all(gram):
                repeats = 0
                j = i + n
                while (
                    j + n <= len(tokens)
                    and [_norm_token(t) for t in tokens[j : j + n]] == gram
                ):
                    repeats += 1
                    j += n
                if repeats >= min_repeats:
                    # Keep the last occurrence: it carries the final punctuation.
                    out.extend(tokens[j - n : j])
                    i = j
                    continue
            out.append(tokens[i])
            i += 1
        tokens = out
    return " ".join(tokens)


def _drop_duplicate_sentences(line: str) -> str:
    """Remove consecutive duplicate sentences within a line."""
    sentences = _SENTENCE_SPLIT_RE.split(line)
    kept: list[str] = []
    for sentence in sentences:
        if kept and _norm_token(sentence) == _norm_token(kept[-1]):
            continue
        kept.append(sentence)
    return " ".join(kept)


def _collapse_loops(text: str) -> str:
    """Full anti-repetition pass. Operates line-by-line to preserve Markdown."""
    if not text:
        return text
    lines_out: list[str] = []
    prev_norm: str | None = None
    for line in text.split("\n"):
        if line.lstrip().startswith("|"):
            # Markdown table row — cell/separator patterns legitimately repeat.
            cleaned = line
        else:
            cleaned = _CONNECTIVE_LOOP_RE.sub(_collapse_connective_loop, line)
            cleaned = _collapse_ngram_loops(cleaned)
            cleaned = _drop_duplicate_sentences(cleaned)
        norm = _norm_token(cleaned)
        if norm and norm == prev_norm:
            continue  # whole line repeated verbatim
        if norm:
            prev_norm = norm
        lines_out.append(cleaned)
    return "\n".join(lines_out)


def _clean_response_text(text: str) -> str:
    """Final cleanup for complete responses."""
    return _collapse_loops(_scrub_response_content(text, strip_edges=True))


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


class _StreamReferenceSuppressor:
    """Suppress a model-written bibliography on the streaming path.

    Already-streamed text cannot be retracted, so the moment a segment opens a
    "References:"/"Sources:" heading, that line and everything after it are
    dropped.  The deterministic References block is appended at stream end.
    """

    def __init__(self) -> None:
        self._suppressing = False

    def feed(self, segment: str) -> str:
        if self._suppressing:
            return ""
        lines = segment.split("\n")
        for idx, line in enumerate(lines):
            if _MODEL_REFS_HEADING_RE.match(line):
                self._suppressing = True
                return "\n".join(lines[:idx]).rstrip()
        return segment


class _StreamingLoopGuard:
    """Sentence-granular anti-repetition filter for the streaming path.

    Buffers cleaned text until a sentence/line boundary, runs the loop
    collapser on the completed segment, and suppresses segments that repeat
    the previously emitted one.  Trades token-level latency for the guarantee
    that a degenerate loop never reaches the client.
    """

    _BOUNDARY_RE = re.compile(r"[.!?…]\s|\n")

    def __init__(self) -> None:
        self._buffer = ""
        self._last_norm: str | None = None

    def _process(self, segment: str) -> str:
        cleaned = _collapse_loops(segment)
        norm = _norm_token(cleaned)
        if norm and norm == self._last_norm:
            return ""
        if norm:
            self._last_norm = norm
        return cleaned

    def feed_segments(self, piece: str) -> list[str]:
        """Return completed, loop-filtered segments (may be empty)."""
        self._buffer += piece
        emitted: list[str] = []
        while True:
            match = self._BOUNDARY_RE.search(self._buffer)
            if not match:
                break
            cut = match.end()
            segment, self._buffer = self._buffer[:cut], self._buffer[cut:]
            emitted.append(self._process(segment))
        return emitted

    def feed(self, piece: str) -> str:
        return "".join(self.feed_segments(piece))

    def flush(self) -> str:
        segment, self._buffer = self._buffer, ""
        return self._process(segment) if segment else ""


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


# ---------------------------------------------------------------------------
# Academic citation tracking
# ---------------------------------------------------------------------------
# Every unique parent document gets one stable reference number in order of
# first appearance (chunks arrive sorted by relevance).  All chunks from the
# same file share that number, so mixed multi-format uploads (.pdf, .docx,
# .txt, .md) cross-reference to their parent source with absolute precision.

_CITATION_RE = re.compile(r"\[(\d{1,2})\]")
_MODEL_REFS_HEADING_RE = re.compile(r"^\s*(references|sources|kaynaklar)\s*:?\s*$", re.IGNORECASE)

# ---------------------------------------------------------------------------
# Conditional-refusal and meta-note scrubbing
# ---------------------------------------------------------------------------
# The refusal sentence is valid ONLY as a complete standalone response.  Small
# models sometimes suffix it (or a "(Note: ...)" meta-comment) onto successful
# answers.  These deterministic filters enforce the prompt's binary rule.

_REFUSAL_RE = re.compile(
    re.escape(NO_CONTEXT_ANSWER).replace(r"\.", r"\.?"), re.IGNORECASE
)
_META_NOTE_RE = re.compile(r"^\(?\s*note\s*[:\-—]", re.IGNORECASE)


def _strip_refusal_and_meta_notes(text: str) -> str:
    """Remove refusal-sentence leaks and meta-notes from substantive answers.

    A pure refusal response is preserved verbatim; anything else must not
    contain the refusal sentence or "(Note: ...)"-style meta-commentary.
    """
    without_refusal = _REFUSAL_RE.sub("", text)
    lines = [
        line for line in without_refusal.split("\n")
        if not _META_NOTE_RE.match(line.strip())
    ]
    cleaned = re.sub(r"\n{3,}", "\n\n", "\n".join(lines)).strip()
    cleaned = re.sub(r"[ \t]{2,}", " ", cleaned)
    if not cleaned:
        # Nothing substantive remained — this WAS a refusal (possibly wrapped
        # in a meta-note).  Return the canonical standalone sentence.
        return NO_CONTEXT_ANSWER
    return cleaned


class _StreamAnswerSanitizer:
    """Streaming twin of _strip_refusal_and_meta_notes.

    Operates on the sentence/line segments produced by the loop guard.  The
    first segment may legitimately be the refusal sentence (a true refusal);
    once substantive text has been emitted, any later refusal sentence or
    "(Note: ...)" meta-comment is suppressed before it reaches the client.
    """

    def __init__(self) -> None:
        self._emitted_any = False
        self._in_note = False

    def feed(self, segment: str) -> str:
        if not segment:
            return ""
        if self._in_note:
            # Swallow continuation of an unclosed "(Note: ..." until it ends.
            if ")" in segment:
                self._in_note = False
                segment = segment.split(")", 1)[1]
            else:
                return ""
        if self._emitted_any:
            segment = _REFUSAL_RE.sub("", segment)
        stripped = segment.strip()
        if _META_NOTE_RE.match(stripped):
            if stripped.startswith("(") and ")" not in stripped[1:]:
                self._in_note = True
            return ""
        if stripped:
            self._emitted_any = True
        return segment


def build_citation_map(chunks: list[dict]) -> dict[str, int]:
    """Map each unique filename to its bracketed reference number ([1], [2]…)."""
    refs: dict[str, int] = {}
    for chunk in _enforce_chunk_limit(chunks):
        filename = chunk["filename"]
        if filename not in refs:
            refs[filename] = len(refs) + 1
    return refs


def _strip_model_references(text: str) -> str:
    """Drop any bibliography section the model wrote despite instructions.

    The deterministic References block appended by the server is the single
    source of truth for citation-to-filename mapping.
    """
    lines = text.split("\n")
    for i, line in enumerate(lines):
        if _MODEL_REFS_HEADING_RE.match(line):
            return "\n".join(lines[:i]).rstrip()
    return text


def _build_references_block(answer_text: str, ref_map: dict[str, int]) -> str:
    """Return the "References:" bibliography for citations used in *answer_text*.

    Only reference numbers actually cited are listed; if the model cited
    nothing, all context sources are listed so provenance is never lost.
    Returns "" for refusal answers.
    """
    if not ref_map or NO_CONTEXT_ANSWER in answer_text:
        return ""
    by_number = {num: filename for filename, num in ref_map.items()}
    used = {int(m) for m in _CITATION_RE.findall(answer_text) if int(m) in by_number}
    numbers = sorted(used) if used else sorted(by_number)
    lines = "\n".join(f"[{n}] {by_number[n]}" for n in numbers)
    return f"References:\n{lines}"


def _finalize_answer(answer_text: str, ref_map: dict[str, int]) -> str:
    """Strip model bibliographies, refusal leaks, and meta-notes; append refs."""
    cleaned = _strip_refusal_and_meta_notes(
        _strip_model_references(answer_text).rstrip()
    )
    references = _build_references_block(cleaned, ref_map)
    if not references:
        return cleaned
    return f"{cleaned}\n\n{references}"


def _build_context(chunks: list[dict]) -> str:
    """Serialise chunks as hard-partitioned source blocks.

    Explicit BEGIN/END fences reinforce the prompt's context-segregation rule:
    facts inside one fence must never be blended with facts from another
    unless the excerpts themselves state the correlation.
    """
    safe_chunks = _enforce_chunk_limit(chunks)
    refs = build_citation_map(safe_chunks)
    blocks = []
    for c in safe_chunks:
        n = refs[c["filename"]]
        blocks.append(
            f"===== SOURCE [{n}] BEGIN ({c['filename']}) =====\n"
            f"{c['content']}\n"
            f"===== SOURCE [{n}] END ====="
        )
    return "\n\n".join(blocks)


def _build_messages(context: str, query: str, history: list[dict] | None) -> list[dict]:
    """Assemble the prompt. Kept lean — behavioural rules live in SYSTEM_PROMPT
    only, so they are not paid for twice per request."""
    clean_query = sanitize_query(query)
    messages: list[dict] = [{"role": "system", "content": SYSTEM_PROMPT}]
    if history:
        messages.extend(history[-6:])
    user_content = (
        "NUMBERED SOURCES (your only source of truth — cite with the bracketed numbers; "
        "each BEGIN/END fence is an isolated partition, never blend facts across fences "
        "unless the excerpts explicitly correlate them):\n\n"
        f"{context}\n\n"
        f"QUESTION: {clean_query}\n\n"
        "Decide first: do the sources explicitly contain the answer? "
        f'If not, reply with exactly this single sentence and nothing else: "{NO_CONTEXT_ANSWER}" '
        "If they do, write an exhaustive, professionally structured answer in crisp corporate "
        "financial English — report every relevant figure, sub-clause, exception, and trigger; "
        "do not omit data points for brevity, and never include that refusal sentence or any "
        "\"(Note: ...)\" meta-commentary. Append the bracketed source number to each factual "
        "sentence, e.g. \"The collateral ratio was raised to 155% [1].\" "
        "Do not write a References or Sources section — it is appended automatically."
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
    ref_map = build_citation_map(chunks)
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
    answer = _finalize_answer(
        _clean_response_text(response.choices[0].message.content or ""), ref_map
    )
    elapsed_ms = (time.perf_counter() - t0) * 1000
    metrics.record_generation(elapsed_ms)
    metrics.add_context_tokens(len(context) // _CHARS_PER_TOKEN)
    logger.info("Generation complete in %.1f ms (%d chars).", elapsed_ms, len(answer))
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

    ref_map = build_citation_map(chunks)
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
    loop_guard = _StreamingLoopGuard()
    ref_suppressor = _StreamReferenceSuppressor()
    answer_sanitizer = _StreamAnswerSanitizer()

    def _pipe_segments(segments: list[str]) -> str:
        return "".join(
            ref_suppressor.feed(answer_sanitizer.feed(s)) for s in segments if s
        )

    emitted_text = ""
    while True:
        item = await queue.get()
        if item is _DONE:
            final_segments = loop_guard.feed_segments(stripper.flush())
            final_segments.append(loop_guard.flush())
            tail = _pipe_segments(final_segments)
            if tail:
                emitted_text += tail
                yield tail
            references = _build_references_block(emitted_text, ref_map)
            if references:
                yield f"\n\n{references}"
            break
        if isinstance(item, Exception):
            logger.warning(
                "Streaming failed (%s) — falling back to blocking complete_chat.",
                item,
            )
            response = await asyncio.to_thread(chat_client.complete_chat, messages)
            answer = _finalize_answer(
                _clean_response_text(response.choices[0].message.content or ""), ref_map
            )
            if answer:
                yield answer
            break
        token_count += 1
        cleaned = _pipe_segments(loop_guard.feed_segments(stripper.feed(item)))
        if cleaned:
            emitted_text += cleaned
            yield cleaned

    elapsed_ms = (time.perf_counter() - t0) * 1000
    metrics.record_generation(elapsed_ms)
    metrics.add_context_tokens(len(context) // _CHARS_PER_TOKEN)
    logger.info("Stream complete: %d token(s) in %.1f ms.", token_count, elapsed_ms)
