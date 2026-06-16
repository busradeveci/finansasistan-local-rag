"""
Input sanitisation utilities for FinansAsistan.

All user-supplied strings (chat queries, filenames passed through API fields)
must be run through sanitize_query() before they touch any LLM prompt template
or are persisted to the database.

Threat model addressed:
- Prompt injection via hidden control characters (\\x00-\\x1f, \\x7f, \\x80-\\x9f)
- HTML / script tag injection that could leak through to a future web renderer
- Null-byte injection that crashes Python's sqlite3 parameter binding
- Oversized inputs that could overflow the model's context window
"""

import logging
import re
import unicodedata

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------

# Maximum characters accepted for a single user query.
# Phi-3.5 Mini has a ~128 k-token context but we keep queries intentionally
# short to leave room for the retrieved context blocks.
_MAX_QUERY_CHARS = 2_000

# ---------------------------------------------------------------------------
# Patterns
# ---------------------------------------------------------------------------

# C0 control characters (0x00–0x1F) except tab (0x09), newline (0x0A),
# carriage return (0x0D) which are valid in multi-line input.
_CTRL_CHARS = re.compile(r"[\x00-\x08\x0b\x0c\x0e-\x1f\x7f\x80-\x9f]")

# Rudimentary HTML / script-tag stripping.  We do NOT need a full HTML parser
# because the input is plain text destined for an LLM prompt, not a browser;
# we just want to neutralise obvious injection patterns.
_HTML_TAGS = re.compile(r"<[^>]{0,256}>", re.IGNORECASE | re.DOTALL)

# Prompt-injection trigger phrases that attempt to override system instructions.
# Matched case-insensitively; the whole surrounding sentence is NOT removed —
# only the phrase is replaced with [REDACTED] so context is preserved.
_INJECTION_PATTERNS = re.compile(
    r"(ignore\s+(all\s+)?previous\s+instructions?"
    r"|forget\s+(everything|all)"
    r"|system\s*:\s*"
    r"|<\s*system\s*>"
    r"|\\n\s*###"          # markdown heading injection
    r"|act\s+as\s+(if\s+you\s+are|a\s+different)"
    r")",
    re.IGNORECASE,
)

# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------

def sanitize_query(raw: str) -> str:
    """Clean and validate a user query string before it enters any prompt.

    Steps applied in order:
    1. Type-guard — coerce to str, reject non-string gracefully.
    2. Unicode normalise (NFC) — collapse combining characters.
    3. Strip C0/C1 control characters (null bytes, ESC, DEL, etc.).
    4. Strip HTML / script tags.
    5. Neutralise prompt-injection trigger phrases.
    6. Collapse excessive whitespace.
    7. Enforce maximum length, truncating with a warning if exceeded.

    Returns the cleaned string.  Never raises — a pathological input becomes
    an empty string rather than a server error.
    """
    if not isinstance(raw, str):
        logger.warning("sanitize_query received non-string input (%s) — coercing.", type(raw))
        try:
            raw = str(raw)
        except Exception:
            return ""

    # 1. Unicode normalisation
    text = unicodedata.normalize("NFC", raw)

    # 2. Remove control characters
    before = len(text)
    text = _CTRL_CHARS.sub("", text)
    removed = before - len(text)
    if removed:
        logger.warning("sanitize_query: removed %d control character(s) from input.", removed)

    # 3. Strip HTML tags
    text_no_html = _HTML_TAGS.sub("", text)
    if text_no_html != text:
        logger.warning("sanitize_query: stripped HTML/script tags from input.")
    text = text_no_html

    # 4. Neutralise prompt-injection phrases
    text_clean = _INJECTION_PATTERNS.sub("[REDACTED]", text)
    if text_clean != text:
        logger.warning("sanitize_query: neutralised prompt-injection attempt in input.")
    text = text_clean

    # 5. Collapse whitespace
    text = re.sub(r"[ \t]{2,}", " ", text)
    text = re.sub(r"\n{3,}", "\n\n", text)
    text = text.strip()

    # 6. Length enforcement
    if len(text) > _MAX_QUERY_CHARS:
        logger.warning(
            "sanitize_query: input truncated from %d to %d characters.",
            len(text), _MAX_QUERY_CHARS,
        )
        text = text[:_MAX_QUERY_CHARS].rstrip()

    return text


def sanitize_filename(raw: str) -> str:
    """Sanitise a filename coming from an upload or API parameter.

    Strips path traversal sequences and control characters, returns only the
    final component so callers can safely join it onto DOCS_DIR.
    """
    import pathlib

    text = sanitize_query(raw)          # reuse control-char stripping
    # Keep only the final filename component — neutralises ../../ traversal
    text = pathlib.Path(text).name
    # Remove characters that are problematic on Windows / POSIX
    text = re.sub(r'[<>:"/\\|?*]', "_", text)
    return text.strip() or "upload"
