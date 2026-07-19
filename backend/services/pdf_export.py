"""Executive PDF report generation — HTML-to-PDF with corporate styling."""
from __future__ import annotations

import html
import io
import logging
import re
import uuid
from datetime import datetime, timezone
from typing import Any, Literal

logger = logging.getLogger(__name__)

try:
    from weasyprint import HTML as WeasyHTML  # type: ignore[import-untyped]

    WEASYPRINT_AVAILABLE = True
except (ImportError, OSError) as exc:
    WEASYPRINT_AVAILABLE = False
    WeasyHTML = None  # type: ignore[assignment,misc]
    logger.info("WeasyPrint unavailable (%s); xhtml2pdf will be used for PDF export.", exc)

# Light executive print theme — white background, slate text, thin gray borders.
_BG = "#ffffff"
_TEXT = "#1e293b"
_TITLE = "#0f172a"
_TITLE_ACCENT = "#1e3a8a"
_BORDER = "#e2e8f0"
_BORDER_STRONG = "#cbd5e1"
_TH_BG = "#f8fafc"
_TEXT_SECONDARY = "#475569"
_TEXT_MUTED = "#64748b"
_ACCENT = "#1e3a8a"

_AUTHOR = "Branch Manager: Büşra Deveci"
_DEPARTMENT = "Commercial Credit Risk Operations"
_REPORT_TITLE = "FOUNDRY LOCAL - EXECUTIVE CREDIT ANALYSIS REPORT"

_REFS_HEADING_RE = re.compile(r"^\s*(references|sources|kaynaklar)\s*:?\s*$", re.IGNORECASE)


def _strip_references_section(text: str) -> str:
    lines = text.split("\n")
    for i, line in enumerate(lines):
        if _REFS_HEADING_RE.match(line.strip()):
            return "\n".join(lines[:i]).rstrip()
    return text.rstrip()


def _escape(text: str) -> str:
    return html.escape(text or "", quote=True)


def _format_analysis_html(analysis: str) -> str:
    """Convert plain / lightly-marked analysis text into styled HTML blocks."""
    text = _strip_references_section(analysis)
    if not text.strip():
        return '<p class="muted">No analysis content provided.</p>'

    blocks: list[str] = []
    paragraph: list[str] = []
    table_rows: list[list[str]] = []
    list_items: list[str] = []
    in_list = False

    def flush_paragraph() -> None:
        nonlocal paragraph
        if paragraph:
            body = "<br/>".join(_escape(line) for line in paragraph)
            blocks.append(f'<p class="analysis-p">{body}</p>')
            paragraph = []

    def flush_list() -> None:
        nonlocal list_items, in_list
        if list_items:
            items = "".join(f"<li>{_escape(item)}</li>" for item in list_items)
            blocks.append(f'<ul class="analysis-list">{items}</ul>')
            list_items = []
        in_list = False

    def flush_table() -> None:
        nonlocal table_rows
        if not table_rows:
            return
        header = table_rows[0]
        body_rows = table_rows[1:]
        thead = "".join(f"<th>{_escape(cell.strip())}</th>" for cell in header)
        tbody_parts: list[str] = []
        for row in body_rows:
            if all(re.match(r"^[-:\s|]+$", cell) for cell in row):
                continue
            cells = "".join(f"<td>{_escape(cell.strip())}</td>" for cell in row)
            tbody_parts.append(f"<tr>{cells}</tr>")
        blocks.append(
            f'<table class="analysis-table"><thead><tr>{thead}</tr></thead>'
            f"<tbody>{''.join(tbody_parts)}</tbody></table>"
        )
        table_rows = []

    for raw_line in text.split("\n"):
        line = raw_line.rstrip()
        stripped = line.strip()

        if stripped.startswith("|") and stripped.endswith("|"):
            flush_paragraph()
            flush_list()
            cells = [c.strip() for c in stripped.strip("|").split("|")]
            table_rows.append(cells)
            continue

        if table_rows:
            flush_table()

        if re.match(r"^#{1,3}\s+", stripped):
            flush_paragraph()
            flush_list()
            heading = re.sub(r"^#{1,3}\s+", "", stripped)
            blocks.append(f'<h3 class="analysis-h3">{_escape(heading)}</h3>')
            continue

        if re.match(r"^[-*•]\s+", stripped):
            flush_paragraph()
            in_list = True
            list_items.append(re.sub(r"^[-*•]\s+", "", stripped))
            continue

        if re.match(r"^\d+\.\s+", stripped):
            flush_paragraph()
            in_list = True
            list_items.append(re.sub(r"^\d+\.\s+", "", stripped))
            continue

        if in_list and not stripped:
            flush_list()
            continue

        if in_list and stripped:
            flush_list()

        if not stripped:
            flush_paragraph()
            continue

        if stripped.startswith("---") or stripped.startswith("___"):
            flush_paragraph()
            blocks.append('<hr class="divider"/>')
            continue

        paragraph.append(stripped)

    flush_paragraph()
    flush_list()
    flush_table()
    return "\n".join(blocks)


def _build_sources_html(sources: list[dict[str, Any]]) -> str:
    if not sources:
        return '<p class="muted">No retrieved evidence sources recorded for this analysis.</p>'

    rows: list[str] = []
    for src in sources:
        ref = src.get("ref")
        filename = _escape(str(src.get("filename", "Unknown")))
        confidence = src.get("confidence")
        chunk_index = src.get("chunk_index")
        preview = _escape(str(src.get("preview") or src.get("content") or "")[:280])

        conf_label = f"{confidence:.1f}%" if isinstance(confidence, (int, float)) else "—"
        chunk_label = str(chunk_index) if chunk_index is not None else "—"
        ref_label = f"[{ref}]" if ref is not None else "—"

        rows.append(
            f"<tr>"
            f"<td class=\"ref\">{ref_label}</td>"
            f"<td class=\"doc\">{filename}</td>"
            f"<td class=\"num\">{chunk_label}</td>"
            f"<td class=\"num\">{conf_label}</td>"
            f"<td class=\"preview\">{preview or '—'}</td>"
            f"</tr>"
        )

    return (
        '<table class="sources-table">'
        "<colgroup>"
        '<col class="col-ref"/>'
        '<col class="col-doc"/>'
        '<col class="col-chunk"/>'
        '<col class="col-conf"/>'
        '<col class="col-excerpt"/>'
        "</colgroup>"
        "<thead><tr>"
        "<th>Ref</th><th>Document</th><th>Chunk</th>"
        "<th>Confidence</th><th>Excerpt</th>"
        "</tr></thead>"
        f"<tbody>{''.join(rows)}</tbody></table>"
    )


def _report_styles(renderer: Literal["weasyprint", "xhtml2pdf"]) -> str:
    """Return CSS tuned for the chosen PDF renderer."""
    table_rules = f"""
.analysis-table, .sources-table {{
  table-layout: auto !important;
  width: 100%;
  border-collapse: collapse;
  margin: 10px 0 14px;
  font-size: 9pt;
}}
.analysis-table th, .analysis-table td,
.sources-table th, .sources-table td {{
  border: 1px solid {_BORDER};
  padding: 10px 12px;
  text-align: left;
  vertical-align: middle;
}}
.analysis-table th, .sources-table th {{
  background-color: {_TH_BG};
  color: {_TITLE};
  font-weight: bold;
  text-transform: uppercase;
  font-size: 7.5pt;
}}
.analysis-table td, .sources-table td {{
  background-color: {_BG};
  color: {_TEXT};
}}
.sources-table .col-ref {{ width: 8%; }}
.sources-table .col-doc {{ width: 25%; }}
.sources-table .col-chunk {{ width: 8%; }}
.sources-table .col-conf {{ width: 12%; }}
.sources-table .col-excerpt {{ width: 47%; }}
.sources-table th,
.sources-table .ref,
.sources-table .doc,
.sources-table .num {{
  white-space: nowrap;
}}
.sources-table .ref {{ color: {_ACCENT}; font-weight: bold; }}
.sources-table .num {{ color: {_TEXT_SECONDARY}; }}
.sources-table .preview {{
  font-size: 8.5pt;
  color: {_TEXT_MUTED};
  white-space: normal;
  word-wrap: break-word;
  word-break: break-all;
}}
"""

    if renderer == "weasyprint":
        return f"""
@page {{
  size: A4;
  margin: 18mm 12mm 22mm 12mm;
}}
* {{ box-sizing: border-box; margin: 0; padding: 0; }}
body {{
  font-family: "DejaVu Sans", "Liberation Sans", sans-serif;
  font-size: 10.5pt;
  line-height: 1.55;
  color: {_TEXT};
  background: {_BG};
  margin: 0;
  padding: 0;
}}
.cover {{
  background: {_BG};
  border: 1px solid {_BORDER_STRONG};
  padding: 28px 26px 24px;
  margin-bottom: 22px;
}}
.cover-eyebrow {{
  font-size: 8.5pt;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: {_TITLE_ACCENT};
  font-weight: 700;
  margin-bottom: 10px;
}}
.cover h1 {{
  font-size: 19pt;
  font-weight: 700;
  color: {_TITLE};
  letter-spacing: 0.02em;
  line-height: 1.25;
  margin-bottom: 6px;
}}
.cover-subtitle {{
  font-size: 11pt;
  color: {_TITLE_ACCENT};
  font-weight: 600;
  margin-bottom: 18px;
}}
.meta-grid {{
  width: 100%;
  margin-top: 14px;
  padding-top: 14px;
  border-top: 1px solid {_BORDER};
  border-collapse: collapse;
}}
.meta-grid td {{
  width: 50%;
  vertical-align: top;
  padding: 8px 12px 8px 0;
}}
.meta-item label {{
  display: block;
  font-size: 7.5pt;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: {_TEXT_MUTED};
  margin-bottom: 3px;
}}
.meta-item span {{
  color: {_TEXT};
  font-size: 9.5pt;
  font-weight: 600;
}}
.section {{
  margin-bottom: 20px;
  page-break-inside: avoid;
}}
.section-title {{
  font-size: 9pt;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: {_TITLE_ACCENT};
  font-weight: 700;
  margin-bottom: 10px;
  padding-bottom: 6px;
  border-bottom: 1px solid {_BORDER};
}}
.analysis-body {{
  background: {_BG};
  border: 1px solid {_BORDER_STRONG};
  padding: 16px 18px;
}}
.analysis-p {{
  margin-bottom: 10px;
  color: {_TEXT};
}}
.analysis-h3 {{
  font-size: 11pt;
  color: {_TITLE};
  margin: 14px 0 8px;
}}
.analysis-list {{
  margin: 8px 0 12px 18px;
  color: {_TEXT};
}}
.analysis-list li {{ margin-bottom: 4px; }}
{table_rules}
.divider {{
  border: none;
  border-top: 1px solid {_BORDER};
  margin: 14px 0;
}}
.muted {{ color: {_TEXT_MUTED}; font-size: 9pt; }}
.footer-note {{ margin-top: 12px; text-align: center; }}
.footer-section {{
  margin-top: 24px;
  padding-top: 14px;
  border-top: 2px solid {_BORDER_STRONG};
  page-break-inside: avoid;
}}
.footer-section .section-title {{ color: {_TITLE_ACCENT}; }}
"""

    # xhtml2pdf: table/block layout only — no flexbox inside tables, no rgba/radius.
    return f"""
@page {{
  size: a4;
  margin: 1.2cm 1cm;
}}
body {{
  font-family: "DejaVu Sans", "Liberation Sans", sans-serif;
  font-size: 10pt;
  line-height: 1.5;
  color: {_TEXT};
  background-color: {_BG};
  margin: 0;
  padding: 0;
}}
.cover {{
  background-color: {_BG};
  border: 1px solid {_BORDER_STRONG};
  padding: 20px;
  margin-bottom: 16px;
}}
.cover-eyebrow {{
  font-size: 8pt;
  text-transform: uppercase;
  color: {_TITLE_ACCENT};
  font-weight: bold;
  margin-bottom: 8px;
}}
.cover h1 {{
  font-size: 18pt;
  font-weight: bold;
  color: {_TITLE};
  margin-bottom: 6px;
}}
.cover-subtitle {{
  font-size: 11pt;
  color: {_TITLE_ACCENT};
  font-weight: bold;
  margin-bottom: 14px;
}}
.meta-grid {{
  width: 100%;
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid {_BORDER};
  border-collapse: collapse;
}}
.meta-grid td {{
  width: 50%;
  vertical-align: top;
  padding: 6px 10px 6px 0;
}}
.meta-item label {{
  display: block;
  font-size: 7pt;
  text-transform: uppercase;
  color: {_TEXT_MUTED};
  margin-bottom: 2px;
}}
.meta-item span {{
  color: {_TEXT};
  font-size: 9pt;
  font-weight: bold;
}}
.section {{
  margin-bottom: 16px;
}}
.section-title {{
  font-size: 9pt;
  text-transform: uppercase;
  color: {_TITLE_ACCENT};
  font-weight: bold;
  margin-bottom: 8px;
  padding-bottom: 4px;
  border-bottom: 1px solid {_BORDER};
}}
.analysis-body {{
  background-color: {_BG};
  border: 1px solid {_BORDER_STRONG};
  padding: 12px 14px;
}}
.analysis-p {{
  margin-bottom: 8px;
  color: {_TEXT};
}}
.analysis-h3 {{
  font-size: 11pt;
  color: {_TITLE};
  margin: 12px 0 6px;
}}
.analysis-list {{
  margin: 6px 0 10px 18px;
  color: {_TEXT};
}}
.analysis-list li {{ margin-bottom: 3px; }}
{table_rules}
.divider {{
  border: none;
  border-top: 1px solid {_BORDER};
  margin: 10px 0;
}}
.muted {{ color: {_TEXT_MUTED}; font-size: 9pt; }}
.footer-note {{ margin-top: 10px; text-align: center; }}
.footer-section {{
  margin-top: 20px;
  padding-top: 12px;
  border-top: 2px solid {_BORDER_STRONG};
}}
.footer-section .section-title {{ color: {_TITLE_ACCENT}; }}
"""


def build_report_html(
    *,
    title: str,
    analysis: str,
    sources: list[dict[str, Any]],
    system_id: str | None = None,
    generated_at: datetime | None = None,
    renderer: Literal["weasyprint", "xhtml2pdf"] = "weasyprint",
) -> str:
    """Render the full executive report HTML document."""
    when = generated_at or datetime.now(timezone.utc)
    sys_id = system_id or f"FL-{when.strftime('%Y%m%d')}-{uuid.uuid4().hex[:6].upper()}"
    generated_label = when.strftime("%d %B %Y, %H:%M UTC")
    query_title = _escape(title or "Executive Credit Analysis")
    analysis_html = _format_analysis_html(analysis)
    sources_html = _build_sources_html(sources)
    styles = _report_styles(renderer)

    return f"""<!DOCTYPE html><html lang="tr"><head><meta charset="utf-8">
<title>{_escape(_REPORT_TITLE)}</title>
<style>
{styles}
</style>
</head>
<body>
  <div class="cover">
    <div class="cover-eyebrow">Foundry Local Banking Intelligence</div>
    <h1>{_escape(_REPORT_TITLE)}</h1>
    <p class="cover-subtitle">{query_title}</p>
    <table class="meta-grid">
    <tr>
      <td>
        <div class="meta-item">
          <label>Author</label>
          <span>{_escape(_AUTHOR)}</span>
        </div>
      </td>
      <td>
        <div class="meta-item">
          <label>Department</label>
          <span>{_escape(_DEPARTMENT)}</span>
        </div>
      </td>
    </tr>
    <tr>
      <td>
        <div class="meta-item">
          <label>Generated Date</label>
          <span>{_escape(generated_label)}</span>
        </div>
      </td>
      <td>
        <div class="meta-item">
          <label>System ID</label>
          <span>{_escape(sys_id)}</span>
        </div>
      </td>
    </tr>
    </table>
  </div>

  <div class="section">
    <div class="section-title">Executive Analysis</div>
    <div class="analysis-body">
      {analysis_html}
    </div>
  </div>

  <div class="footer-section">
    <div class="section-title">Retrieved Evidence Sources</div>
    {sources_html}
    <p class="muted footer-note">Foundry Local - Confidential Executive Report</p>
  </div>
</body>
</html>"""


def _render_with_weasyprint(html_document: str) -> bytes:
    if not WEASYPRINT_AVAILABLE or WeasyHTML is None:
        raise RuntimeError("WeasyPrint is not available on this system")
    return WeasyHTML(string=html_document, base_url=".").write_pdf()


def _render_with_xhtml2pdf(html_document: str) -> bytes:
    try:
        from xhtml2pdf import pisa  # type: ignore[import-untyped]
    except ImportError as exc:
        raise RuntimeError(
            "xhtml2pdf is not installed. Run: pip install xhtml2pdf "
            "(see backend/requirements.txt)"
        ) from exc

    buffer = io.BytesIO()
    status = pisa.CreatePDF(html_document, dest=buffer, encoding="utf-8")
    if status.err:
        raise RuntimeError("xhtml2pdf reported rendering errors")
    return buffer.getvalue()


def render_pdf_bytes(
    *,
    title: str,
    analysis: str,
    sources: list[dict[str, Any]],
    system_id: str,
    generated_at: datetime,
) -> bytes:
    """Render HTML to PDF bytes. WeasyPrint preferred; xhtml2pdf fallback."""
    if WEASYPRINT_AVAILABLE:
        try:
            html_doc = build_report_html(
                title=title,
                analysis=analysis,
                sources=sources,
                system_id=system_id,
                generated_at=generated_at,
                renderer="weasyprint",
            )
            return _render_with_weasyprint(html_doc)
        except Exception as exc:
            logger.warning(
                "WeasyPrint rendering failed (%s); falling back to xhtml2pdf.",
                exc,
            )

    html_doc = build_report_html(
        title=title,
        analysis=analysis,
        sources=sources,
        system_id=system_id,
        generated_at=generated_at,
        renderer="xhtml2pdf",
    )
    try:
        return _render_with_xhtml2pdf(html_doc)
    except Exception as exc:
        raise RuntimeError(
            "PDF rendering failed. Install weasyprint or xhtml2pdf "
            f"(see backend/requirements.txt). Detail: {exc}"
        ) from exc


def generate_executive_pdf(
    *,
    title: str,
    analysis: str,
    sources: list[dict[str, Any]],
) -> tuple[bytes, str]:
    """Build and render the executive PDF. Returns (pdf_bytes, system_id)."""
    when = datetime.now(timezone.utc)
    system_id = f"FL-{when.strftime('%Y%m%d')}-{uuid.uuid4().hex[:6].upper()}"
    pdf_bytes = render_pdf_bytes(
        title=title,
        analysis=analysis,
        sources=sources,
        system_id=system_id,
        generated_at=when,
    )
    return pdf_bytes, system_id
