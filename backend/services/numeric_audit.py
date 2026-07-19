"""Post-generation numeric integrity verification against retrieved evidence."""
from __future__ import annotations

import re
from typing import NamedTuple

# Financial-scale numbers: exposures, limits, balances, percentages.
_NUMERIC_RE = re.compile(
    r"""
    (?<![\w/\[])
    (?:
      (?:USD|EUR|GBP|TRY|TL|\$|€|£)\s*
    )?
    (
      \d{1,3}(?:,\d{3})+(?:\.\d+)?
      |\d+(?:\.\d+)?
    )
    (?:
      \s*(?:USD|EUR|GBP|TRY|TL|million|billion|mn|bn|M|B|%)
    )?
    (?![\w/\]])
    """,
    re.VERBOSE | re.IGNORECASE,
)

# Citation brackets, years, small ordinals — not audit targets.
_SKIP_VALUES = frozenset({2020, 2021, 2022, 2023, 2024, 2025, 2026, 2027, 2028, 2029, 2030})
_MIN_AUDIT_VALUE = 10_000.0
_RELATIVE_TOLERANCE = 0.02  # 2% — formatting / rounding only


class ParsedNumber(NamedTuple):
    value: float
    raw: str
    currency: str | None


def _parse_numeric_token(raw: str, prefix: str = "") -> ParsedNumber | None:
    cleaned = raw.replace(",", "").strip()
    if not cleaned or cleaned in (".", "-"):
        return None
    try:
        value = float(cleaned)
    except ValueError:
        return None

    if abs(value) < _MIN_AUDIT_VALUE or value in _SKIP_VALUES:
        return None
    if value == int(value) and 1900 <= value <= 2100:
        return None

    currency = None
    combined = f"{prefix}{raw}".upper()
    for code in ("USD", "EUR", "GBP", "TRY", "TL", "$", "€", "£"):
        if code in combined:
            currency = "USD" if code == "$" else ("EUR" if code == "€" else ("GBP" if code == "£" else code))
            break
    return ParsedNumber(value=value, raw=raw.strip(), currency=currency)


def extract_financial_numbers(text: str) -> list[ParsedNumber]:
    """Extract significant financial numbers from text."""
    found: list[ParsedNumber] = []
    seen_values: set[float] = set()
    for match in _NUMERIC_RE.finditer(text):
        prefix = text[max(0, match.start() - 6) : match.start()]
        parsed = _parse_numeric_token(match.group(1), prefix)
        if parsed and parsed.value not in seen_values:
            seen_values.add(parsed.value)
            found.append(parsed)
    return found


def _format_display(value: float, currency: str | None, template: str | None = None) -> str:
    if template and "," in template:
        formatted = f"{value:,.0f}" if value == int(value) else f"{value:,.2f}"
    elif value == int(value):
        formatted = f"{int(value):,}"
    else:
        formatted = f"{value:,.2f}".rstrip("0").rstrip(".")
    if currency:
        return f"{formatted} {currency}"
    return formatted


def _values_match(a: float, b: float) -> bool:
    if a == b:
        return True
    denom = max(abs(a), abs(b), 1.0)
    return abs(a - b) / denom <= _RELATIVE_TOLERANCE


def _find_evidence_match(
    answer_num: ParsedNumber,
    evidence_numbers: list[ParsedNumber],
) -> ParsedNumber | None:
    """If answer_num looks substituted, return the closest evidence counterpart."""
    for ev in evidence_numbers:
        if _values_match(answer_num.value, ev.value):
            return None  # exact / near-exact match — OK

    # Same order of magnitude but different value → likely hallucination.
    candidates = [
        ev
        for ev in evidence_numbers
        if not _values_match(answer_num.value, ev.value)
        and _same_magnitude_band(answer_num.value, ev.value)
    ]
    if not candidates:
        return None
    return min(candidates, key=lambda ev: abs(ev.value - answer_num.value))


def _same_magnitude_band(a: float, b: float) -> bool:
    if a <= 0 or b <= 0:
        return False
    ratio = max(a, b) / min(a, b)
    return ratio <= 5.0  # within one half-order of magnitude


def detect_numeric_mismatches(answer: str, chunks: list[dict]) -> list[tuple[ParsedNumber, ParsedNumber]]:
    """Return (answer_number, evidence_number) pairs where substitution is detected."""
    evidence_text = "\n".join(c.get("content", "") for c in chunks)
    evidence_numbers = extract_financial_numbers(evidence_text)
    if not evidence_numbers:
        return []

    evidence_values = {n.value for n in evidence_numbers}
    mismatches: list[tuple[ParsedNumber, ParsedNumber]] = []
    flagged_evidence: set[float] = set()

    for answer_num in extract_financial_numbers(answer):
        if any(_values_match(answer_num.value, ev) for ev in evidence_values):
            continue
        counterpart = _find_evidence_match(answer_num, evidence_numbers)
        if counterpart and counterpart.value not in flagged_evidence:
            mismatches.append((answer_num, counterpart))
            flagged_evidence.add(counterpart.value)

    return mismatches


def build_audit_notes(mismatches: list[tuple[ParsedNumber, ParsedNumber]]) -> str:
    if not mismatches:
        return ""
    notes: list[str] = []
    for _answer_num, evidence_num in mismatches:
        display = _format_display(
            evidence_num.value,
            evidence_num.currency,
            evidence_num.raw,
        )
        notes.append(f"[Audit Note: Raw evidence shows exact value to be {display}]")
    return "\n".join(notes)


def apply_numeric_audit(answer: str, chunks: list[dict]) -> str:
    """Append audit notes when LLM financial figures diverge from evidence."""
    if not answer or not chunks:
        return answer
    if "This information is not available" in answer:
        return answer

    mismatches = detect_numeric_mismatches(answer, chunks)
    notes = build_audit_notes(mismatches)
    if not notes:
        return answer
    return f"{answer.rstrip()}\n\n{notes}"
