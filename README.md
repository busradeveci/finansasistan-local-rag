# FinansAsistan — Secure & Enterprise Local RAG Platform

> A 100 % offline, BDDK-compliant Retrieval-Augmented Generation assistant for
> internal banking documentation.  No cloud API calls.  No data egress.
> Every inference, embedding, and vector search runs on the local machine.

---

## Table of Contents

1. [Overview](#1-overview)
2. [Architecture](#2-architecture)
3. [Tech Stack](#3-tech-stack)
4. [Security Architecture](#4-security-architecture)
5. [Project Structure](#5-project-structure)
6. [Setup & Installation](#6-setup--installation)
7. [Running the Application](#7-running-the-application)
8. [Core Product Workflow](#8-core-product-workflow)
9. [API Reference](#9-api-reference)
10. [Configuration](#10-configuration)

---

## 1. Overview

**FinansAsistan** is an enterprise-grade, fully air-gapped document assistant built
for Turkish banking institutions operating under **BDDK** (Banking Regulation and
Supervision Agency) data-privacy requirements.

### Problem Statement

Internal banking teams need rapid, accurate answers from large policy corpora —
regulatory circulars, internal procedures, compliance documents — without
transmitting sensitive data to third-party LLM providers.

### Solution

FinansAsistan ingests institutional documents locally, stores semantically-indexed
vector embeddings in an embedded SQLite database, and answers natural-language
queries using a locally-running small language model.  Every component of the
inference pipeline runs on-device:

| Concern | Guarantee |
|---|---|
| Data residency | All documents and embeddings remain on the local machine |
| Model inference | Phi-3.5 Mini runs via Microsoft Foundry Local — no network calls |
| Regulatory compliance | BDDK data-privacy rules enforced at the prompt and router layers |
| Auditability | Structured logging with per-request timing across every pipeline stage |

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
│  ┌──────▼──────────────────▼──────────────────────────────────┐ │
│  │               Sanitization Layer (sanitize.py)             │ │
│  │   Unicode · Control Chars · HTML Tags · Prompt Injection   │ │
│  │   Length Cap · Path Traversal · Filename Hardening         │ │
│  └──────┬──────────────────┬──────────────────────────────────┘ │
│         │                  │                                    │
│  ┌──────▼──────┐   ┌───────▼────────────────────────────────┐  │
│  │  Ingestion  │   │             Retrieval Pipeline          │  │
│  │  Service    │   │                                         │  │
│  │             │   │  embed_query()  ──►  vector_store.search│  │
│  │ extract     │   │  (Qwen3 embed)      (NumPy matrix ops)  │  │
│  │ clean       │   └───────────────────────────┬────────────┘  │
│  │ chunk       │                               │ top-k chunks  │
│  │ embed       │   ┌───────────────────────────▼────────────┐  │
│  │ store       │   │         Generation Service             │  │
│  └──────┬──────┘   │  _enforce_chunk_limit()                │  │
│         │          │  _build_context() → numbered blocks    │  │
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
              Query Sanitization (6-layer sanitizer)
                             │
                             ▼
              Query Embedding  (Qwen3 embed, single vector)
                             │
                             ▼
              Vectorised Cosine Similarity  (NumPy matrix dot)
              Score threshold filter  (≥ 0.10)
              Hard chunk cap  (MAX_CONTEXT_CHUNKS = 4)
                             │
                             ▼
              Prompt Assembly  (numbered KAYNAK blocks + SYSTEM_PROMPT)
                             │
                             ▼
              Phi-3.5 Mini Inference  →  SSE token stream  →  Browser
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

The `SYSTEM_PROMPT` enforces six non-negotiable model behaviours:

1. **Context-only answers** — model may not use training-data knowledge.
2. **Zero hallucination** — no inference or extrapolation beyond stated facts.
3. **Turkish output** — responses always in Turkish.
4. **Mandatory citations** — every response ends with `Kaynaklar: [doc, …]`.
5. **BDDK data privacy** — PII, account numbers, and customer IDs must never be echoed.
6. **Topic scope enforcement** — off-topic requests are politely declined.

### 4.5 Score Threshold Filtering (`backend/services/retrieval.py`)

Chunks with cosine similarity below **0.10** are discarded before reaching the LLM.
This prevents semantically unrelated documents from being hallucination-inducing noise
inside the context window.

---

## 5. Project Structure

```
finansasistan-local-rag/
│
├── backend/
│   ├── main.py                  # FastAPI app, startup, CORS, routers
│   ├── config.py                # All tuneable constants (models, chunk sizes, thresholds)
│   ├── sanitize.py              # 6-layer input sanitization + filename hardening
│   ├── logging_config.py        # Structured stdout logging setup
│   ├── requirements.txt
│   │
│   ├── routers/
│   │   ├── documents.py         # GET/POST/DELETE /documents
│   │   └── query.py             # POST /query, GET /query/stream (SSE)
│   │
│   ├── services/
│   │   ├── ingestion.py         # Extract → clean → chunk → embed → store
│   │   ├── retrieval.py         # Embed query → cosine search → threshold filter
│   │   └── generation.py        # Build prompt → Foundry Local → stream tokens
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
│       ├── App.jsx              # Shell layout: navbar, sidebar, chat area
│       ├── index.css            # Tailwind directives + dot-pattern background
│       │
│       ├── api/
│       │   └── client.js        # Axios instance + all API call helpers + EventSource
│       │
│       └── components/
│           ├── ChatSection.jsx  # SSE streaming chat UI with source badges
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

## 6. Setup & Installation

### Prerequisites

| Requirement | Version |
|---|---|
| Python | ≥ 3.11 |
| Node.js | ≥ 18 |
| npm | ≥ 9 |
| Microsoft Foundry Local | Latest (install from https://aka.ms/foundry-local) |

### 6.1 Clone the Repository

```bash
git clone <repository-url>
cd finansasistan-local-rag
```

### 6.2 Backend — Python Dependencies

```bash
pip install -r backend/requirements.txt
```

### 6.3 Frontend — Node Dependencies

```bash
cd frontend
npm install
```

### 6.4 Foundry Local Model Download

On first query, the models are downloaded automatically by the Foundry Local SDK.
To pre-download them manually:

```bash
foundry model download phi-3.5-mini
foundry model download qwen3-embedding-0.6b
```

---

## 7. Running the Application

Open **two separate terminal windows** from the project root.

### Terminal 1 — Backend API

```bash
# From project root: finansasistan-local-rag/
python -m uvicorn backend.main:app --reload --port 8000
```

Expected output:
```
2026-06-16 21:00:00 | INFO | backend.main | FinansAsistan API ready.
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

## 8. Core Product Workflow

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

### Step 2 — Query & Retrieval

1. User types a question; it is sanitized through the 6-layer pipeline.
2. The query is embedded into a single vector by `qwen3-embedding-0.6b`.
3. A NumPy matrix operation computes cosine similarity against all stored vectors
   simultaneously (no Python loop — one BLAS call).
4. Results below the `SCORE_THRESHOLD` (0.10) are discarded.
5. The top `MAX_CONTEXT_CHUNKS` (4) results are returned.

### Step 3 — Response Generation (SSE)

1. Retrieved chunks are formatted as numbered `[KAYNAK N: filename]` blocks.
2. The `SYSTEM_PROMPT` (6 responsible-AI rules) + context blocks + sanitized query
   are assembled into the message list.
3. `phi-3.5-mini` generates a response token by token via Foundry Local.
4. Tokens are streamed to the browser as Server-Sent Events (`data: <token>\n\n`).
5. After the final token, a `data: [SOURCES]{json}\n\n` frame carries source metadata.
6. The frontend appends each token in real-time and renders source badges on completion.

---

## 9. API Reference

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

## 10. Configuration

All tuneable parameters live in `backend/config.py`:

```python
EMBED_MODEL        = "qwen3-embedding-0.6b"  # Foundry Local model alias
CHAT_MODEL         = "phi-3.5-mini"           # Foundry Local model alias

CHUNK_SIZE         = 800    # Maximum characters per text chunk
CHUNK_OVERLAP      = 150    # Overlap characters carried into the next chunk
TOP_K              = 4      # Chunks fetched from vector store per query
SCORE_THRESHOLD    = 0.10   # Minimum cosine similarity to include a chunk
MAX_CONTEXT_CHUNKS = 4      # Hard cap on chunks injected into one prompt
```

To adjust retrieval sensitivity, raise `SCORE_THRESHOLD` (stricter) or lower it
(more permissive).  `MAX_CONTEXT_CHUNKS` should always be `≤ TOP_K`.

---

## License

Internal use only.  Not for public distribution.  All document content processed
by this system is subject to BDDK data-retention and confidentiality obligations.
