"""Document metadata extraction for vault filtering."""
from __future__ import annotations

import re
from pathlib import Path

_FILE_TYPE_LABELS: dict[str, str] = {
    ".csv":  "CSV",
    ".xlsx": "Excel",
    ".xls":  "Excel",
    ".pdf":  "PDF",
    ".docx": "DOCX",
    ".txt":  "TXT",
    ".md":   "Markdown",
}

_YEAR_RE = re.compile(r"(20\d{2})")
_QUARTER_RE = re.compile(r"(?:^|[_\-\s])q([1-4])(?:[_\-\s]|$)", re.IGNORECASE)


def extract_document_metadata(filename: str) -> dict[str, str]:
    """Derive structural metadata from a document filename for vault filtering."""
    ext = Path(filename).suffix.lower()
    stem = Path(filename).stem.lower()
    file_type = _FILE_TYPE_LABELS.get(ext, ext.lstrip(".").upper() or "FILE")

    year_match = _YEAR_RE.search(filename)
    year = year_match.group(1) if year_match else ""

    quarter_match = _QUARTER_RE.search(stem)
    quarter = f"Q{quarter_match.group(1)}" if quarter_match else ""

    return {"year": year, "quarter": quarter, "file_type": file_type}
