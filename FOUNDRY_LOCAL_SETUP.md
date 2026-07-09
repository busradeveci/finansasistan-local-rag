# Microsoft Foundry Local — Windows Setup Guide

**For:** FinansAsistan Local RAG Platform  
**Requirement:** Windows 10/11 (64-bit), 8 GB RAM minimum (16 GB recommended)  
**Goal:** Run `phi-3.5-mini` (chat) and `qwen3-embedding-0.6b` (embeddings) 100% offline.

---

## Step 1 — Install Foundry Local CLI

Open **PowerShell as Administrator** and run:

```powershell
winget install Microsoft.FoundryLocal
```

After installation, close and reopen PowerShell so the `foundry` command is on your PATH.

**Verify the installation:**

```powershell
foundry --version
```

Expected output example: `foundry 0.x.x`

---

## Step 2 — Start the Foundry Local Service

The Foundry Local background service must be running before your Python backend can call the SDK.

```powershell
foundry service start
```

**Check the service is running:**

```powershell
foundry service status
```

Expected output: `Service is running on http://localhost:<PORT>`

> **Note:** The service starts automatically with Windows after first setup.  
> If you ever need to stop it: `foundry service stop`

---

## Step 3 — Download the Models

Download both models the backend requires. These downloads happen only once and are cached locally.

### Chat model — phi-3.5-mini

```powershell
foundry model download phi-3.5-mini
```

Typical download size: ~2.4 GB. This may take several minutes depending on your connection.

### Embedding model — qwen3-embedding-0.6b

```powershell
foundry model download qwen3-embedding-0.6b
```

Typical download size: ~450 MB.

**List all cached (downloaded) models to confirm:**

```powershell
foundry model list --cached
```

You should see both `phi-3.5-mini` and `qwen3-embedding-0.6b` in the output.

---

## Step 4 — Verify Models Load Correctly

Test that the chat model responds before starting the FastAPI backend:

```powershell
foundry model run phi-3.5-mini
```

Type a simple prompt like `Hello` and press Enter. If you get a response, the model is working. Press `Ctrl+C` to exit.

---

## Step 5 — Install the Python SDK

Inside your Python virtual environment (the same one you use for the FastAPI backend):

```powershell
# Activate your venv first, e.g.:
# .venv\Scripts\Activate.ps1

pip install foundry-local-sdk
```

> **Critical:** The package name is `foundry-local-sdk` (with `sdk` suffix).  
> The Python module name is `foundry_local_sdk` (underscore, with `_sdk`).  
> Do NOT install the old `foundry-local` package — it uses a different API.

Verify the install:

```powershell
python -c "from foundry_local_sdk import FoundryLocalManager; print('SDK OK')"
```

Expected output: `SDK OK`

---

## Step 6 — Install All Backend Dependencies

```powershell
cd C:\Users\busra\workspace\finansasistan-local-rag\backend
pip install -r requirements.txt
```

---

## Step 7 — Run the FinansAsistan Backend

```powershell
cd C:\Users\busra\workspace\finansasistan-local-rag
python -m uvicorn backend.main:app --reload --port 8000
```

On the **first query**, you will see log lines similar to:

```
INFO | backend.services.retrieval  | Initialising embedding model 'qwen3-embedding-0.6b'...
INFO | backend.services.retrieval  | Downloading embedding model 'qwen3-embedding-0.6b' (skipped if cached)...
INFO | backend.services.retrieval  | Embedding model 'qwen3-embedding-0.6b' ready.
INFO | backend.services.generation | Initialising chat model 'phi-3.5-mini' via Foundry Local SDK...
INFO | backend.services.generation | Chat model 'phi-3.5-mini' ready in X.X s.
```

Model loading is **lazy** — it happens on the first API call, not at server start. Subsequent requests use the already-loaded models instantly.

---

## Step 8 — Run the Frontend

In a separate PowerShell window:

```powershell
cd C:\Users\busra\workspace\finansasistan-local-rag\frontend
npm install       # only needed once
npm run dev
```

Open your browser at **http://localhost:5173**

---

## Diagnostic — Health Check Endpoints

Once the backend is running, verify everything is working:

### Basic health check
```
GET http://localhost:8000/
```
Expected: `{"status": "ok", "message": "Foundry Local RAG workstation is running."}`

### Full system status (document count, models, uptime)
```
GET http://localhost:8000/api/status
```
Expected response includes:
```json
{
  "status": "ok",
  "uptime_seconds": 12.3,
  "vector_store": { "document_count": 0, "total_chunks": 0, "documents": [] },
  "models": { "chat_model": "phi-3.5-mini", "embed_model": "qwen3-embedding-0.6b" },
  "runtime": "local — no cloud dependency"
}
```

---

## Troubleshooting

| Symptom | Cause | Fix |
|---|---|---|
| `ModuleNotFoundError: No module named 'foundry_local_sdk'` | Wrong package installed | `pip install foundry-local-sdk` (with `-sdk`) |
| `ImportError` when importing `from foundry_local import ...` | Old package (`foundry-local`) installed | Uninstall it: `pip uninstall foundry-local` |
| `foundry: command not found` | CLI not on PATH | Restart PowerShell after `winget install` |
| Service not running error | Background service stopped | `foundry service start` |
| Model download fails | Insufficient disk space | Free at least 5 GB on the target drive |
| Slow first response (30–60 s) | Model loading into RAM | Normal on first call; subsequent calls are fast |
| `VRAM insufficient` for llama-3.1-8b | GPU memory too small | Use `phi-3.5-mini` (CPU-compatible) |

---

## Architecture Summary

```
[Browser] ──── http://localhost:5173 ────► [React + Vite Frontend]
                                                     │
                                                     │ HTTP (REST + SSE)
                                                     ▼
[FastAPI Backend] ──── Python ────► [foundry_local_sdk]
         │                                   │
         │                                   ▼
         │                         [Foundry Local Service]
         │                           (localhost:PORT)
         │                        ┌──────────┴──────────┐
         │                        │                      │
         │                   phi-3.5-mini      qwen3-embedding-0.6b
         │                   (chat / LLM)      (vector embeddings)
         │
         └──── SQLite ────► [data/vector_store.db]
                             (chunk text + float32 blobs)
```

**Zero external network calls after model download.**  
All inference runs on your local CPU/NPU/GPU.  
BDDK-compliant: no data ever leaves your machine.
