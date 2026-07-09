"""Lightweight semantic intent gate — routes small talk away from the RAG pipeline.

Casual greetings, pleasantries, and system status checks must never trigger
query embedding, vector search, or context injection: they waste tokens and
produce nonsense answers grounded in unrelated document chunks. This module
classifies the raw user query with zero-cost deterministic rules BEFORE the
pipeline runs, and supplies a polished corporate persona reply (strictly in
English) for the bypass. English patterns are first-class; common Turkish
legacy equivalents remain covered for continuity.
"""
from __future__ import annotations

import re
import unicodedata
from enum import Enum


class Intent(str, Enum):
    SMALLTALK = "smalltalk"
    DOCUMENT_QUERY = "document_query"


# Queries longer than this cannot be pure small talk — always route to RAG.
_MAX_SMALLTALK_CHARS = 80

# If any domain signal appears, the query is a document question even when it
# also contains a greeting ("Hello, what is the collateral ratio?").
_DOMAIN_SIGNALS = re.compile(
    r"(loan|credit|rate|ratio|collateral|limit|report|document|contract|"
    r"polic(y|ies)|risk|balance|budget|account|branch|customer|amount|"
    r"percent|%|\d|what (is|are) (?!you\b)|how (do(?! you\b)|to|much|many)|which|explain|"
    r"summar|list|compare|analy[sz]e|clause|table|invoice|revenue|capital|"
    r"kredi|faiz|oran|teminat|rapor|belge|dok[uü]man|s[oö]zle[sş]me|"
    r"[oö]zet|bilan[cç]o|b[uü]t[cç]e|hesap|[sş]ube|m[uü][sş]teri|tutar|"
    r"y[uü]zde|nedir|ka[cç]|hangi|nas[ıi]l yap|a[cç][ıi]kla|listele|"
    r"kar[sş][ıi]la[sş]t[ıi]r|analiz|madde|tablo)",
    re.IGNORECASE,
)

# Full-match patterns for casual intent, applied to the normalized query.
_GREETING = re.compile(
    r"(hello( there)?|hi( there)?|hey( there)?|greetings|"
    r"good (morning|afternoon|evening|day)|"
    r"merhaba(lar)?|selam(lar)?|g[uü]nayd[ıi]n|iyi (g[uü]nler|ak[sş]amlar|geceler))",
    re.IGNORECASE,
)
_WELLBEING = re.compile(
    r"(how are you( doing| today)?|how('s| is) it going|how do you do|"
    r"what('s| is) up|nas[ıi]ls[ıi]n(iz)?|naber|ne haber|nas[ıi]l gidiyor)",
    re.IGNORECASE,
)
_STATUS_CHECK = re.compile(
    r"(system ready\??|status( check)?|health check|are you (there|online|ready|working)|"
    r"is the system (ready|up|online|working)|test|ping|"
    r"sistem (haz[ıi]r|aktif|[cç]al[ıi][sş][ıi]yor)( m[ıi](s[ıi]n)?)?|"
    r"[cç]al[ıi][sş][ıi]yor mu(sun)?|orada m[ıi]s[ıi]n|haz[ıi]r m[ıi]s[ıi]n)",
    re.IGNORECASE,
)
_THANKS_BYE = re.compile(
    r"(thank(s| you)( very much| a lot| so much)?|much appreciated|cheers|"
    r"bye|goodbye|see you( later)?|good night|"
    r"te[sş]ekk[uü]r(ler| ederim)?|sa[gğ] ?ol(un)?|eyvallah|rica ederim|"
    r"g[oö]r[uü][sş][uü]r[uü]z|iyi [cç]al[ıi][sş]malar|ho[sş][cç]a ?kal(?:[ıi]n)?)",
    re.IGNORECASE,
)
_IDENTITY = re.compile(
    r"(who are you|what are you|what can you do|how can you help( me)?|"
    r"sen kimsin|kimsin( sen)?|ne yapabilirsin|nas[ıi]l yard[ıi]mc[ıi] olabilirsin)",
    re.IGNORECASE,
)

# Ordered: first matching category determines the canned reply (English only).
_SMALLTALK_RESPONSES: list[tuple[re.Pattern[str], str]] = [
    (
        _WELLBEING,
        "Thank you for asking — all systems are operational and at your service. "
        "I am ready to answer questions about your uploaded documents.",
    ),
    (
        _STATUS_CHECK,
        "The system is online and ready for queries. "
        "Please submit a question about your indexed document base.",
    ),
    (
        _THANKS_BYE,
        "You are welcome. I remain at your service whenever you have further questions.",
    ),
    (
        _IDENTITY,
        "I am Foundry Local, an on-premises AI analyst operating exclusively on "
        "your organization's uploaded documents. You may ask questions about "
        "your document base or request executive summaries and risk analyses.",
    ),
    (
        _GREETING,
        "Hello, I am Foundry Local. "
        "I am ready to answer questions about your uploaded documents.",
    ),
]

_DEFAULT_SMALLTALK_RESPONSE = (
    "Hello, I am Foundry Local. "
    "I am ready to answer questions about your uploaded documents."
)


def _normalize(query: str) -> str:
    """Lowercase, strip punctuation/emoji noise, collapse whitespace."""
    text = unicodedata.normalize("NFC", query or "")
    # Map Turkish dotted capital İ explicitly; plain "I".lower() -> "i" keeps
    # English intact, and all Turkish patterns tolerate both via [ıi] classes.
    text = text.replace("İ", "i").lower()
    text = re.sub(r"[^\w%çğıöşü]+", " ", text, flags=re.UNICODE)
    return re.sub(r"\s+", " ", text).strip()


def _match_smalltalk(normalized: str) -> str | None:
    """Return the canned reply if *normalized* is pure small talk, else None."""
    if not normalized or len(normalized) > _MAX_SMALLTALK_CHARS:
        return None
    for pattern, response in _SMALLTALK_RESPONSES:
        if pattern.fullmatch(normalized):
            return response
    # Compound pleasantries like "hello how are you" / "selam nasılsın".
    if _GREETING.match(normalized):
        rest = _GREETING.sub("", normalized, count=1).strip()
        if not rest:
            return _DEFAULT_SMALLTALK_RESPONSE
        for pattern, response in _SMALLTALK_RESPONSES:
            if pattern.fullmatch(rest):
                return response
    return None


def classify_intent(query: str) -> Intent:
    """Classify *query* without any model call or vector search."""
    normalized = _normalize(query)
    if _DOMAIN_SIGNALS.search(normalized):
        return Intent.DOCUMENT_QUERY
    if _match_smalltalk(normalized) is not None:
        return Intent.SMALLTALK
    return Intent.DOCUMENT_QUERY


def smalltalk_response(query: str) -> str:
    """Return the corporate persona reply for a SMALLTALK-classified query."""
    normalized = _normalize(query)
    reply = _match_smalltalk(normalized)
    return reply if reply is not None else _DEFAULT_SMALLTALK_RESPONSE
