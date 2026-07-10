"""Internal math operations for the LOCAL_MATH execution track.

All computation runs locally — no cloud APIs.  Safe AST evaluation handles
arithmetic; percentage and aggregate helpers cover common metric queries.
"""
from __future__ import annotations

import ast
import math
import operator
import re
from typing import Any

# Financial numbers: optional currency prefix, thousands separators, decimals.
_NUM = r"(?:\$|€|£|₺|USD\s*)?(?:\d{1,3}(?:,\d{3})+(?:\.\d+)?|\d+(?:\.\d+)?)"
_PERCENT_OF_RE = re.compile(
    rf"(?:what\s+is\s+)?(\d+(?:\.\d+)?)\s*%\s*of\s+({_NUM})",
    re.IGNORECASE,
)
_PERCENT_CHANGE_RE = re.compile(
    rf"(\d+(?:\.\d+)?)\s*%\s*(?:increase|decrease|change)\s*(?:from|on|over)?\s*({_NUM})",
    re.IGNORECASE,
)
_EXPR_RE = re.compile(
    r"(?:calculate|compute|evaluate|solve|what\s+is)\s+(.+?)(?:\?|$)",
    re.IGNORECASE,
)
_NUMBER_LIST_RE = re.compile(rf"({_NUM})")

_BIN_OPS: dict[type, Any] = {
    ast.Add: operator.add,
    ast.Sub: operator.sub,
    ast.Mult: operator.mul,
    ast.Div: operator.truediv,
    ast.FloorDiv: operator.floordiv,
    ast.Mod: operator.mod,
    ast.Pow: operator.pow,
}
_UNARY_OPS: dict[type, Any] = {
    ast.UAdd: operator.pos,
    ast.USub: operator.neg,
}


def _parse_number(raw: str) -> float:
    """Parse a financial numeric token, stripping currency symbols and commas."""
    cleaned = raw.strip()
    cleaned = re.sub(r"^(?:\$|€|£|₺|USD\s*)", "", cleaned, flags=re.IGNORECASE)
    cleaned = cleaned.replace(",", "")
    return float(cleaned)


def _normalize_expression_numbers(expr: str) -> str:
    """Replace comma-separated numeric literals so AST parsing sees plain floats."""

    def _replace(match: re.Match[str]) -> str:
        return str(_parse_number(match.group(0)))

    return _NUMBER_LIST_RE.sub(_replace, expr)


def _safe_eval(node: ast.AST) -> float:
    if isinstance(node, ast.Expression):
        return _safe_eval(node.body)
    if isinstance(node, ast.Constant) and isinstance(node.value, (int, float)):
        return float(node.value)
    if isinstance(node, ast.Num):  # noqa: UP038 — py<3.8 compat in older parsers
        return float(node.n)
    if isinstance(node, ast.UnaryOp) and type(node.op) in _UNARY_OPS:
        return _UNARY_OPS[type(node.op)](_safe_eval(node.operand))
    if isinstance(node, ast.BinOp) and type(node.op) in _BIN_OPS:
        left, right = _safe_eval(node.left), _safe_eval(node.right)
        if isinstance(node.op, (ast.Div, ast.FloorDiv)) and right == 0:
            raise ZeroDivisionError("division by zero")
        return _BIN_OPS[type(node.op)](left, right)
    raise ValueError(f"unsupported expression: {ast.dump(node)}")


def _format_number(value: float) -> str:
    if math.isfinite(value) and abs(value - round(value)) < 1e-9:
        return f"{int(round(value)):,}"
    return f"{value:.6g}"


def _try_expression(text: str) -> str | None:
    expr = text.strip().rstrip("?")
    expr = expr.replace("×", "*").replace("÷", "/").replace("^", "**")
    expr = _normalize_expression_numbers(expr)
    if not re.search(r"[\+\-\*/\^]", expr):
        return None
    try:
        tree = ast.parse(expr, mode="eval")
        result = _safe_eval(tree)
        if not math.isfinite(result):
            return None
        return f"The result is {_format_number(result)}."
    except (SyntaxError, ValueError, ZeroDivisionError, TypeError):
        return None


def _try_percent_of(query: str) -> str | None:
    match = _PERCENT_OF_RE.search(query)
    if not match:
        return None
    pct, base = float(match.group(1)), _parse_number(match.group(2))
    result = base * pct / 100.0
    return f"{_format_number(pct)}% of {_format_number(base)} is {_format_number(result)}."


def _try_percent_change(query: str) -> str | None:
    match = _PERCENT_CHANGE_RE.search(query)
    if not match:
        return None
    pct, base = float(match.group(1)), _parse_number(match.group(2))
    direction = "increase" if "decrease" not in query.lower() else "decrease"
    factor = 1 + pct / 100.0 if direction == "increase" else 1 - pct / 100.0
    result = base * factor
    return (
        f"A {_format_number(pct)}% {direction} on {_format_number(base)} "
        f"yields {_format_number(result)}."
    )


def _try_aggregate(query: str) -> str | None:
    lowered = query.lower()
    numbers = [_parse_number(n) for n in _NUMBER_LIST_RE.findall(query)]
    if len(numbers) < 2:
        return None
    if "average" in lowered or "mean" in lowered:
        avg = sum(numbers) / len(numbers)
        return f"The average of {', '.join(_format_number(n) for n in numbers)} is {_format_number(avg)}."
    if "sum" in lowered or "total" in lowered:
        total = sum(numbers)
        return f"The sum of {', '.join(_format_number(n) for n in numbers)} is {_format_number(total)}."
    return None


def try_math_answer(query: str) -> str | None:
    """Return a locally computed answer for *query*, or None if not a math task."""
    if not query.strip():
        return None

    for handler in (_try_percent_of, _try_percent_change, _try_aggregate):
        answer = handler(query)
        if answer:
            return answer

    expr_match = _EXPR_RE.search(query)
    if expr_match:
        answer = _try_expression(expr_match.group(1))
        if answer:
            return answer

    stripped = query.strip().rstrip("?")
    if re.match(r"^[\d\s\+\-\*\/\(\)\.\^×÷,\$€£₺]+(?:USD\s*)?$", stripped, re.IGNORECASE):
        return _try_expression(stripped)

    return None
