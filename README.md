# Foundry Local — Secure & Enterprise Local RAG Workstation

> A 100 % offline, compliance-ready Retrieval-Augmented Generation assistant for
> internal banking documentation.  No cloud API calls.  No data egress.
> Every inference, embedding, and vector search runs on the local machine.
> All user-facing output — UI, logs, and LLM responses — is delivered in
> professional corporate English.

---

## Table of Contents

1. [Overview](#1-overview)
2. [Architecture](#2-architecture)
3. [Tech Stack](#3-tech-stack)
4. [Security Architecture](#4-security-architecture)
5. [Intent Routing Architecture](#5-intent-routing-architecture)
6. [Retrieval Pipeline — 4-Stage Filtering](#6-retrieval-pipeline--4-stage-filtering)
7. [Generation Safeguards](#7-generation-safeguards)
8. [Project Structure](#8-project-structure)
9. [Setup & Installation](#9-setup--installation)
10. [Running the Application](#10-running-the-application)
11. [Core Product Workflow](#11-core-product-workflow)
12. [API Reference](#12-api-reference)
13. [Configuration](#13-configuration)

---

## 1. Overview

**Foundry Local** is an enterprise-grade, fully air-gapped document assistant built
for financial institutions operating under strict data-privacy requirements
(e.g. BDDK — the Banking Regulation and Supervision Agency).

### Problem Statement

Internal banking teams need rapid, accurate answers from large policy corpora —
regulatory circulars, internal procedures, compliance documents — without
transmitting sensitive data to third-party LLM providers.

### Solution

The workstation ingests institutional documents locally, stores semantically
indexed vector embeddings in an embedded SQLite database, and answers
natural-language queries using a locally running small language model.  Every
component of the inference pipeline runs on-device:

| Concern | Guarantee |
|---|---|
| Data residency | All documents and embeddings remain on the local machine |
| Model inference | Phi-3.5 Mini runs via Microsoft Foundry Local — no network calls |
| Regulatory compliance | Data-privacy rules enforced at the prompt and router layers |
| Auditability | Structured logging with per-request timing across every pipeline stage |
| Output fidelity | Context-bound answers, directional metric lock, deterministic anti-loop filters |

---

## 2. Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        User (Browser)                           │
│                     http://localhost:5173                       │
└────────────────────────────┬────────────────────────────────────┘
                             │  REST / SSE
┌────────────────────────────▼────────────────────────────────────┐
│                   FastAPI Backend  :8000                        │
│                                                                 │
│  ┌─────────────┐   ┌──────────────┐   ┌──────────────────────┐ │
│  │  /documents │   │   /query     │   │     /api/status      │ │
│  │  router     │   │   router     │   │   (diagnostics)      │ │
│  └──────┬──────┘   └──────┬───────┘   └──────────────────────┘ │
│         │                 │                                     │
│         │          ┌──────▼───────────────────────────────────┐ │
│         │          │   Intent Gate (services/intent.py)       │ │
│         │          │   smalltalk / status check → instant     │ │
│         │          │   English persona reply, RAG bypassed    │ │
│         │          └──────┬───────────────────────────────────┘ │
│         │                 │  document queries only              │
│  ┌──────▼─────────────────▼───────────────────────────────────┐ │
│  │               Sanitization Layer (sanitize.py)             │ │
│  │   Unicode · Control Chars · HTML Tags · Prompt Injection   │ │
│  │   Length Cap · Path Traversal · Filename Hardening         │ │
│  └──────┬──────────────────┬──────────────────────────────────┘ │
│         │                  │                                    │
│  ┌──────▼──────┐   ┌───────▼────────────────────────────────┐  │
│  │  Ingestion  │   │        Retrieval Pipeline               │  │
│  │  Service    │   │  embed_query() → vector_store.search    │  │
│  │             │   │  4-stage filter: absolute threshold →   │  │
│  │ extract     │   │  relative cutoff → dedupe → hard cap    │  │
│  │ clean       │   └───────────────────────────┬────────────┘  │
│  │ chunk       │                               │ dense chunks  │
│  │ embed       │   ┌───────────────────────────▼────────────┐  │
│  │ store       │   │         Generation Service             │  │
│  └──────┬──────┘   │  _build_context() → [SOURCE N] blocks  │  │
│         │          │  streaming loop guard + tag stripper   │  │
│  ┌──────▼──────────▼──────────────────────────────────────┐  │  │
│  │              SQLite Vector Store  (data/vector_store.db)│  │  │
│  │   documents(id, filename, chunk_index, content, embed)  │  │  │
│  └─────────────────────────────────────────────────────────┘  │  │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │         Microsoft Foundry Local  (local runtime)        │   │
│  │   Chat:   phi-3.5-mini                                  │   │
│  │   Embed:  qwen3-embedding-0.6b                          │   │
│  └─────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

### Data Flow Summary

```
Document Upload
     │
     ▼
Text Extraction (TXT/MD/PDF/DOCX)
     │  encoding fallback: utf-8 → utf-8-sig → cp1254 → latin-1
     ▼
Text Cleaning  (whitespace normalisation, blank-line collapse)
     │
     ▼
Sentence-Boundary Chunking  (chunk_size=800, overlap=150 chars)
     │
     ▼
Batch Embedding  →  float32 BLOB serialisation  →  SQLite INSERT
     │
     ▼
                        Query Time
                             │
                             ▼
              Intent Gate  (smalltalk → instant reply, RAG bypassed)
                             │  document queries only
                             ▼
              Query Sanitization (6-layer sanitizer)
                             │
                             ▼
              Query Embedding  (Qwen3 embed, single vector)
                             │
                             ▼
              Vectorised Cosine Similarity  (NumPy matrix dot)
              4-stage filter  (threshold 0.25 → relative cutoff →
                               dedupe → hard cap 4)
                             │
                             ▼
              Prompt Assembly  (numbered [SOURCE] blocks + SYSTEM_PROMPT)
                             │
                             ▼
              Phi-3.5 Mini Inference  →  loop guard + tag stripper
                             │
                             ▼
              SSE token stream  →  Browser
```

---

## 3. Tech Stack

### Backend

| Component | Technology | Version |
|---|---|---|
| Web framework | FastAPI | ≥ 0.111 |
| ASGI server | Uvicorn (standard) | ≥ 0.29 |
| LLM inference runtime | Microsoft Foundry Local SDK | ≥ 1.2 |
| Chat model | Phi-3.5 Mini | — |
| Embedding model | Qwen3-Embedding-0.6B | — |
| Vector storage | SQLite (embedded) | stdlib |
| Similarity computation | NumPy (vectorised matrix ops) | ≥ 1.26 |
| PDF extraction | PyPDF2 | ≥ 3.0 |
| DOCX extraction | python-docx | ≥ 1.1 |
| Data validation | Pydantic v2 | ≥ 2.7 |
| File uploads | python-multipart | ≥ 0.0.9 |

### Frontend

| Component | Technology | Version |
|---|---|---|
| Build tool | Vite | ≥ 8.0 |
| UI library | React | ≥ 19 |
| Styling | Tailwind CSS v3 | ≥ 3.4 |
| Component system | shadcn/ui (default style) | ≥ 4.x |
| HTTP client | Axios | ≥ 1.0 |
| Icons | Lucide React | ≥ 0.4 |
| SSE streaming | Native browser `EventSource` API | — |

---

## 4. Security Architecture

Security is treated as a first-class concern throughout the stack.
All measures are implemented locally — no external WAF or cloud security service.

### 4.1 Input Sanitization (`backend/sanitize.py`)

Every user query passes through a **6-layer sanitization pipeline** before touching
any prompt template or database parameter:

```
Raw user input
      │
      ▼  Layer 1 — Unicode NFC normalisation
      │  Collapses combining characters and homoglyphs used in visual spoofing.
      │
      ▼  Layer 2 — C0 / C1 control character removal
      │  Strips null bytes (0x00), ESC (0x1B), DEL (0x7F), ANSI sequences (0x80–0x9F).
      │  Prevents sqlite3 null-byte injection and terminal escape attacks.
      │
      ▼  Layer 3 — HTML / script tag stripping
      │  Removes <script>, <img onerror=…>, <iframe> and similar patterns.
      │  Guards against payload injection if output is ever rendered in a browser.
      │
      ▼  Layer 4 — Prompt-injection phrase neutralisation
      │  Detects and replaces phrases such as:
      │    "ignore all previous instructions"
      │    "forget everything"
      │    "system:"  /  <system>
      │    "act as a different …"
      │  Replaced with [REDACTED], preserving grammatical context.
      │
      ▼  Layer 5 — Whitespace normalisation
      │  Collapses padding attacks that bury malicious content in whitespace.
      │
      ▼  Layer 6 — Hard length cap (2 000 characters)
         Prevents context-window overflow attacks.
         Truncation is logged as a WARNING for auditability.
```

### 4.2 API Boundary Security (`backend/routers/documents.py`)

- **Path traversal prevention**: uploaded and deleted filenames are passed through
  `sanitize_filename()`, which applies `pathlib.Path.name` to strip any `../../`
  sequences before the name reaches the filesystem.
- **Character filtering**: Windows/POSIX forbidden characters (`< > : " / \ | ? *`)
  are replaced with underscores.
- **Extension allow-list**: only `.txt`, `.md`, `.pdf`, `.docx` are accepted at the
  upload endpoint; all other MIME types receive `HTTP 400`.

### 4.3 Context Window Protection (`backend/services/generation.py`)

```python
MAX_CONTEXT_CHUNKS = 4   # defined in config.py
```

`_enforce_chunk_limit()` is called inside `_build_context()` — the last possible
point before chunks are serialised into a prompt string.  Regardless of the `top_k`
value supplied by the caller, **no more than 4 source blocks will ever be injected
into a single prompt**.  Violations are logged as WARNING.

### 4.4 Responsible AI Prompt Engineering (`backend/config.py`)

The `SYSTEM_PROMPT` enforces nine non-negotiable model behaviours:

1. **Absolute context fidelity** — the model answers exclusively from the
   numbered source blocks.  When the answer is absent it must reply with
   exactly: *"This information is not available in the uploaded documents."*
   No fabrication, assumption, or extrapolation under any circumstance.
2. **Maximum depth, no omission** — every relevant percentage, sub-clause,
   exception, and sanction variant (malus, haircuts, clawbacks) present in the
   sources must be reported with its metrics, durations, and triggers.
3. **Directional metric lock** — trend verbs are preserved character-for-character.
   A rate "raised to 140%" may never be reported as lowered or reduced.
4. **Structural fidelity across formats** — `.docx`, `.pdf`, `.txt`, and `.md`
   excerpts are treated identically; tables and numbered list steps are
   reproduced exactly.
5. **Academic in-text citations** — each factual sentence carries the bracketed
   number of its parent document, e.g. "The collateral ratio was raised to
   155% [1]."  The server appends a deterministic `References:` bibliography
   mapping each number to its source filename.
6. **Fluid professional structure** — no fixed section templates, emojis, or
   decorative icons; the layout adapts to the query (analytical paragraphs for
   strategy, numbered steps for workflows, tables for tabular source data).
7. **English corporate style** — short, direct, authoritative reporting
   sentences; multi-clause constructions are split into independent
   declarative clauses.
8. **No repetition loops** — back-to-back word/phrase repetition is forbidden.
9. **No technical leaks** — structural tags, chunk indicators, and similarity
   scores never appear in output.

---

## 5. Intent Routing Architecture

Implemented in `backend/services/intent.py` and wired into both `/query`
endpoints **before** any embedding call or vector search.

- **Zero-token gate** — classification is fully deterministic (normalisation +
  compiled regex full-matching).  No model call, no vector search, no latency.
- **Covered categories** — greetings ("hello", "good morning"), wellbeing
  checks ("how are you"), system status checks ("system ready?", "status
  check", "ping"), gratitude/farewells ("thanks", "goodbye"), and identity
  questions ("who are you").  Common Turkish legacy equivalents
  ("merhaba", "nasılsın", "sistem hazır mı") remain covered for continuity.
- **Domain-signal override** — if the query contains any financial/document
  signal ("Hello, what is the collateral ratio?"), it is always routed to the
  full RAG pipeline.  Small talk is only detected on short queries (≤ 80 chars)
  that *fully* match a casual pattern.
- **Bypass behaviour** — on a smalltalk match, the router immediately returns a
  polished corporate English persona reply with an empty `sources` array; the
  response schema is identical to a normal query response.

---

## 6. Retrieval Pipeline — 4-Stage Filtering

Implemented in `backend/services/retrieval.py`.  Only the densest,
highest-relevance chunks may reach the prompt template:

| Stage | Filter | Rule |
|---|---|---|
| 1 | Absolute threshold | Drop chunks with cosine similarity below `SCORE_THRESHOLD` (**0.25**) |
| 2 | Relative cutoff | Drop chunks scoring below `RELATIVE_SCORE_CUTOFF` (0.55) × best score |
| 3 | Deduplication | Drop repeated `(filename, chunk_index)` rows and whitespace-insensitive duplicate content produced by chunk overlap |
| 4 | Hard cap | Never return more than `MAX_CONTEXT_CHUNKS` (4), regardless of the requested `top_k` |

The vector search over-fetches (2 × the effective `top_k`) so that stages 2–3
can discard weak or duplicate candidates while still filling the cap with
high-density factual chunks.  This keeps token usage minimal per query.

---

## 7. Generation Safeguards

Implemented in `backend/services/generation.py`.

- **Deterministic inference** — `temperature=0.0`, with a long-form
  `max_tokens=2048` budget so exhaustive analytical answers are never
  truncated mid-clause.
- **Citation engine** — every unique parent document receives one stable
  reference number in relevance order; all chunks from the same file share it.
  The server strips any model-written bibliography and appends a deterministic
  `References:` block listing only the numbers actually cited (all sources as
  a fallback), guaranteeing precise chunk-to-file cross-referencing across
  mixed `.pdf` / `.docx` / `.txt` / `.md` uploads.
- **Structural tag stripper** — removes `<|answer text|>`-style tags,
  `(chunk #N)` indicators, and emoji/pictograph characters from both blocking
  and streamed output, holding incomplete trailing fragments across token
  boundaries.
- **Anti-repetition filter** — a deterministic backstop behind the prompt's
  no-repetition rule:
  - collapses connective loops ("commitment for commitment" → "commitment"),
    with an idiom allow-list so legitimate financial English such as
    "quarter over quarter" and "dollar for dollar" is never altered;
  - collapses immediately repeated multi-word phrases, and single words
    repeated three or more times consecutively;
  - removes consecutive duplicate sentences and duplicate lines;
  - Markdown table rows are exempt (cell patterns legitimately repeat).
- **Streaming loop guard** (`_StreamingLoopGuard`) — the SSE path buffers
  cleaned text at sentence/line granularity, runs the loop collapser on each
  completed segment, and suppresses segments that repeat the previously
  emitted one.  A degenerate loop can never reach the client mid-stream.
- **Fallback** — if streaming fails, the service falls back to a blocking
  completion with the same post-processing applied.

---

## 8. Project Structure

```
finansasistan-local-rag/
│
├── backend/
│   ├── main.py                  # FastAPI app, startup, CORS, routers
│   ├── config.py                # All tuneable constants + SYSTEM_PROMPT + NO_CONTEXT_ANSWER
│   ├── sanitize.py              # 6-layer input sanitization + filename hardening
│   ├── logging_config.py        # Structured stdout logging setup
│   ├── requirements.txt
│   │
│   ├── routers/
│   │   ├── documents.py         # GET/POST/DELETE /documents
│   │   └── query.py             # POST /query, GET /query/stream (SSE) + intent gate
│   │
│   ├── services/
│   │   ├── intent.py            # Zero-token intent classifier (smalltalk bypass)
│   │   ├── ingestion.py         # Extract → clean → chunk → embed → store
│   │   ├── retrieval.py         # Embed query → cosine search → 4-stage filter
│   │   └── generation.py        # Build prompt → Foundry Local → loop-guarded stream
│   │
│   └── db/
│       ├── database.py          # SQLite connection factory (row_factory=Row)
│       └── vector_store.py      # Schema, insert, delete, list, vectorised search
│
├── frontend/
│   ├── index.html
│   ├── vite.config.js           # @ alias → ./src
│   ├── tailwind.config.js       # shadcn CSS variable color tokens
│   ├── components.json          # shadcn registry config
│   ├── jsconfig.json            # Path alias for non-TypeScript Vite project
│   │
│   └── src/
│       ├── main.jsx
│       ├── App.jsx              # Shell layout: header, sidebar, chat area
│       ├── index.css            # Tailwind directives + Fluent acrylic styling
│       │
│       ├── api/
│       │   └── client.js        # Axios instance + all API call helpers + EventSource
│       │
│       └── components/
│           ├── ChatSection.jsx  # SSE streaming chat UI with source inspector
│           ├── DocumentUpload.jsx # Drag-and-drop upload + document list + delete
│           └── ui/
│               └── button.jsx   # shadcn Button (Tailwind v3 compatible)
│
├── data/
│   ├── docs/                    # Uploaded source documents (local only)
│   └── vector_store.db          # SQLite vector store (auto-created on startup)
│
├── .gitignore
└── README.md
```

---

## 9. Setup & Installation

### Prerequisites

| Requirement | Version |
|---|---|
| Python | ≥ 3.11 |
| Node.js | ≥ 18 |
| npm | ≥ 9 |
| Microsoft Foundry Local | Latest (install from https://aka.ms/foundry-local) |

### 9.1 Clone the Repository

```bash
git clone <repository-url>
cd finansasistan-local-rag
```

### 9.2 Backend — Python Dependencies

```bash
pip install -r backend/requirements.txt
```

### 9.3 Frontend — Node Dependencies

```bash
cd frontend
npm install
```

### 9.4 Foundry Local Model Download

On first query, the models are downloaded automatically by the Foundry Local SDK.
To pre-download them manually:

```bash
foundry model download phi-3.5-mini
foundry model download qwen3-embedding-0.6b
```

---

## 10. Running the Application

Open **two separate terminal windows** from the project root.

### Terminal 1 — Backend API

```bash
# From project root: finansasistan-local-rag/
python -m uvicorn backend.main:app --reload --port 8000
```

Expected output:
```
2026-07-08 17:00:00 | INFO | backend.main | Foundry Local RAG API ready.
Vector store: 0 document(s) indexed. Chat model: phi-3.5-mini | Embed model: qwen3-embedding-0.6b
INFO:     Uvicorn running on http://127.0.0.1:8000 (Press CTRL+C to quit)
```

### Terminal 2 — Frontend Dev Server

```bash
# From the frontend/ directory
cd frontend
npm run dev
```

Expected output:
```
  VITE vX.X.X  ready in XXX ms
  ➜  Local:   http://localhost:5173/
```

### Open in Browser

```
http://localhost:5173
```

### Diagnostics Endpoint

```
http://localhost:8000/api/status
```

Returns live document count, total chunk count, active model names, and server uptime.

---

## 11. Core Product Workflow

### Step 1 — Document Ingestion

1. User uploads a file (`.txt`, `.md`, `.pdf`, `.docx`) via the sidebar.
2. The filename is sanitized (`sanitize_filename`) at the router boundary.
3. Text is extracted with encoding-resilient fallback (`utf-8 → utf-8-sig → cp1254 → latin-1`).
4. Text is cleaned: line endings normalised, blank lines collapsed, whitespace deduplicated.
5. Text is split into overlapping chunks (`chunk_size=800`, `overlap=150` chars) at
   sentence boundaries — never mid-word.
6. Each chunk is embedded by `qwen3-embedding-0.6b` via Foundry Local.
7. Embeddings are serialised as `float32` BLOBs and batch-inserted into SQLite.
8. The document appears immediately in the sidebar with its chunk count.

### Step 2 — Intent Gate & Retrieval

1. The intent classifier inspects the raw query.  Greetings, gratitude, and
   status checks receive an instant corporate English reply — the RAG pipeline
   is bypassed entirely and zero tokens are spent.
2. Document queries are sanitized through the 6-layer pipeline.
3. The query is embedded into a single vector by `qwen3-embedding-0.6b`.
4. A NumPy matrix operation computes cosine similarity against all stored vectors
   simultaneously (no Python loop — one BLAS call).
5. The 4-stage filter runs: absolute threshold (0.25) → relative cutoff →
   deduplication → hard cap (4 chunks).

### Step 3 — Response Generation (SSE)

1. Retrieved chunks are formatted as numbered `[SOURCE N: filename]` blocks.
2. The `SYSTEM_PROMPT` (six responsible-AI rules) + context blocks + sanitized
   query are assembled into the message list.
3. `phi-3.5-mini` generates a response token by token via Foundry Local.
4. Output passes through the structural tag stripper and the streaming loop
   guard before leaving the server.
5. Tokens are streamed to the browser as Server-Sent Events (`data: <token>\n\n`).
6. After the final token, a `data: [SOURCES]{json}\n\n` frame carries source metadata.
7. The frontend appends each token in real time and renders source entries on completion.

---

## 12. API Reference

### Documents

| Method | Path | Description |
|---|---|---|
| `GET` | `/documents` | List all ingested documents with chunk counts |
| `POST` | `/documents/upload` | Upload and ingest a document (`multipart/form-data`) |
| `DELETE` | `/documents/{filename}` | Remove document from store and disk |

### Query

| Method | Path | Description |
|---|---|---|
| `POST` | `/query` | Blocking RAG query → `{answer, sources}` |
| `GET` | `/query/stream` | SSE streaming RAG query (`?question=…&top_k=…`) |

### Health

| Method | Path | Description |
|---|---|---|
| `GET` | `/` | Basic liveness check |
| `GET` | `/api/status` | Full diagnostics: doc count, chunk count, models, uptime |

Interactive API documentation is available at `http://localhost:8000/docs` (Swagger UI).

---

## 13. Configuration

All tuneable parameters live in `backend/config.py`:

```python
EMBED_MODEL           = "qwen3-embedding-0.6b"  # Foundry Local model alias
CHAT_MODEL            = "phi-3.5-mini"          # Foundry Local model alias

CHUNK_SIZE            = 800    # Maximum characters per text chunk
CHUNK_OVERLAP         = 150    # Overlap characters carried into the next chunk
TOP_K                 = 4      # Chunks fetched from vector store per query
SCORE_THRESHOLD       = 0.25   # Minimum cosine similarity to include a chunk
RELATIVE_SCORE_CUTOFF = 0.55   # Minimum fraction of the best chunk's score
MAX_CONTEXT_CHUNKS    = 4      # Hard cap on chunks injected into one prompt

NO_CONTEXT_ANSWER = "This information is not available in the uploaded documents."
```

To adjust retrieval sensitivity, raise `SCORE_THRESHOLD` (stricter) or lower it
(more permissive).  `MAX_CONTEXT_CHUNKS` should always be `≤ TOP_K`.

---

## License

Internal use only.  Not for public distribution.  All document content processed
by this system is subject to applicable data-retention and confidentiality
obligations.
