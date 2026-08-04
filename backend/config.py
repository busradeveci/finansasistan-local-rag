from pathlib import Path

ROOT_DIR = Path(__file__).resolve().parents[1]
DATA_DIR = ROOT_DIR / "data"
DOCS_DIR = DATA_DIR / "vault"
DB_PATH = DATA_DIR / "vectorvault.db"

EMBED_MODEL = "qwen3-embedding-0.6b"
CHAT_MODEL = "phi-3.5-mini"
ROUTER_MODEL = "phi-4-mini"  # primary semantic agent — offline intent classification

# Foundry Local embedding batch size — hard cap of 4 for CPU-only inference.
# With CHUNK_SIZE=3000, batch=4 limits each API request to ~12,000 chars, which
# completes in 15-20 s per batch and stays well within the SDK timeout budget.
# Raising this on CPU-only machines risks FoundryLocalException: Operation was cancelled.
EMBED_BATCH_SIZE = 4
EMBED_MAX_RETRIES = 3

# Pause between embedding batches (seconds).  Keeps the Foundry CPU inference
# engine from overheating between bursts while being 5× shorter than the old 0.5 s.
EMBED_INTER_BATCH_SLEEP_S = 0.1

# Recursive Character Chunker target dimensions (~800 tokens @ ~3.75 chars/token).
CHUNK_SIZE = 3000    # characters per chunk
CHUNK_OVERLAP = 450  # overlap (~150 tokens) preserves cross-boundary continuity

# Ordered separator list for the Recursive Character Chunker.
# Tried in priority order; the splitter recurses down the list when a sub-piece
# still exceeds CHUNK_SIZE.  Markdown structure is preserved because header
# patterns rank above plain newlines.
RECURSIVE_CHUNK_SEPARATORS: list[str] = [
    "\n\n\n",   # explicit section breaks
    "\n## ",    # H2 markdown headings
    "\n# ",     # H1 markdown headings
    "\n\n",     # paragraph breaks
    ".\n",      # sentence end followed by newline
    "!\n",
    "?\n",
    "\n",       # line breaks
    ". ",       # mid-paragraph sentence boundaries
    "! ",
    "? ",
    "; ",       # clause boundaries
    ", ",       # sub-clause boundaries
    " ",        # word boundary (last resort)
    "",         # character boundary (absolute fallback)
]
TOP_K = 8

# Minimum cosine similarity score to include a chunk in the context.
# Single source of truth for retrieval — chunks below this threshold are
# semantically unrelated noise and are dropped before prompt assembly.
SCORE_THRESHOLD = 0.15

# Chunks scoring below this fraction of the best-matching chunk's score are
# dropped even if they pass SCORE_THRESHOLD.  Keeps the context window dense:
# a 0.70-score hit should not drag in loosely related 0.28-score tails.
RELATIVE_SCORE_CUTOFF = 0.55

# Hard upper bound on context chunks injected into a single prompt.
# Prevents prompt-stuffing / memory-overflow attacks regardless of TOP_K or
# what the caller requests.  Must be <= TOP_K.
MAX_CONTEXT_CHUNKS = 8

# Canonical refusal sentence.  The model is contractually bound to emit exactly
# this string when the retrieved context does not contain the answer, and the
# router returns it verbatim when retrieval yields zero chunks.
NO_CONTEXT_ANSWER = "This information is not available in the uploaded documents."

SYSTEM_PROMPT = "You are an enterprise AI assistant. Answer the user question accurately using ONLY the provided context chunks. Cite sources inline as [1], [2]. If the context lacks enough details, state that information is unavailable."
