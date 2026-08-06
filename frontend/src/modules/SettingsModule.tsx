import { useState, useEffect } from "react"
import { getConfig } from "@/api/client"
import { AlertCircle, RefreshCw } from "lucide-react"

interface PlatformConfig {
  models: {
    chat_model: string
    embed_model: string
    router_model: string
  }
  retrieval: {
    score_threshold: number
    relative_cutoff: number
    max_context_chunks: number
    top_k: number
  }
  indexing: {
    chunk_size: number
    chunk_overlap: number
  }
}

export default function SettingsModule() {
  const [config, setConfig] = useState<PlatformConfig | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchConfig = () => {
    setLoading(true)
    setError(null)
    getConfig()
      .then((data) => setConfig(data))
      .catch((err) => setError(err.message || "Failed to load configuration"))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    fetchConfig()
  }, [])

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center ws-module-shell">
        <div className="flex flex-col items-center text-slate-500">
          <RefreshCw className="mb-4 h-8 w-8 animate-spin text-blue-500" />
          <p className="text-sm font-medium">Loading platform configuration...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex h-full items-center justify-center ws-module-shell">
        <div className="flex flex-col items-center text-red-500">
          <AlertCircle className="mb-4 h-8 w-8" />
          <p className="text-sm font-medium">{error}</p>
          <button
            onClick={fetchConfig}
            className="mt-4 rounded-full bg-red-100 px-4 py-2 text-sm font-semibold text-red-600 hover:bg-red-200 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  const CARD_CLASS = "relative p-6 rounded-2xl bg-white/70 dark:bg-slate-900/70 backdrop-blur-md border border-white/50 dark:border-slate-800 shadow-sm flex flex-col justify-between"
  const ROW_CLASS = "flex items-center justify-between py-3 border-b border-slate-100 dark:border-slate-800/50 last:border-none"
  const LABEL_CLASS = "text-sm font-medium text-slate-700"
  const VALUE_CLASS = "text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300"
  const BADGE_CLASS = "text-xs font-semibold px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-600"

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden ws-module-shell">
      <header className="mb-6 shrink-0">
        <h1 className="text-page-title">Settings</h1>
        <p className="mt-1 truncate text-sm font-medium text-slate-600/80">
          Platform configuration center for retrieval, model orchestration, and RAG behavior
        </p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 overflow-y-auto fluent-scrollbar p-1">
        
        {/* 1. AI Models */}
        <section className={CARD_CLASS}>
          <div>
            <div className="mb-4 pb-2 border-b border-slate-100 dark:border-slate-800/50">
              <h2 className="text-lg font-semibold text-slate-900">AI Models</h2>
              <p className="mt-1 text-sm text-slate-500">Configured local orchestration models</p>
            </div>
            <div className="flex flex-col">
              <div className={ROW_CLASS}>
                <div className="flex flex-col">
                  <span className={LABEL_CLASS}>{config?.models.chat_model || "Awaiting Backend Integration"}</span>
                  <span className="text-xs text-slate-500">Backend Config</span>
                </div>
                <span className={BADGE_CLASS}>Active (Chat)</span>
              </div>
              <div className={ROW_CLASS}>
                <div className="flex flex-col">
                  <span className={LABEL_CLASS}>{config?.models.embed_model || "Awaiting Backend Integration"}</span>
                  <span className="text-xs text-slate-500">Backend Config</span>
                </div>
                <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-600">Active (Embed)</span>
              </div>
              <div className={ROW_CLASS}>
                <div className="flex flex-col">
                  <span className={LABEL_CLASS}>{config?.models.router_model || "Awaiting Backend Integration"}</span>
                  <span className="text-xs text-slate-500">Backend Config</span>
                </div>
                <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-purple-50 text-purple-600">Active (Router)</span>
              </div>
            </div>
          </div>
        </section>

        {/* 2. Retrieval Configuration */}
        <section className={CARD_CLASS}>
          <div>
            <div className="mb-4 pb-2 border-b border-slate-100 dark:border-slate-800/50">
              <h2 className="text-lg font-semibold text-slate-900">Retrieval Configuration</h2>
              <p className="mt-1 text-sm text-slate-500">Vector search backend parameters</p>
            </div>
            <div className="flex flex-col">
              <div className={ROW_CLASS}>
                <span className={LABEL_CLASS}>Score Threshold</span>
                <span className={VALUE_CLASS}>{config?.retrieval.score_threshold ?? "Awaiting Backend Integration"}</span>
              </div>
              <div className={ROW_CLASS}>
                <span className={LABEL_CLASS}>Relative Cutoff</span>
                <span className={VALUE_CLASS}>{config?.retrieval.relative_cutoff ?? "Awaiting Backend Integration"}</span>
              </div>
              <div className={ROW_CLASS}>
                <span className={LABEL_CLASS}>Maximum Context Chunks</span>
                <span className={VALUE_CLASS}>{config?.retrieval.max_context_chunks ?? "Awaiting Backend Integration"}</span>
              </div>
              <div className={ROW_CLASS}>
                <span className={LABEL_CLASS}>Chunk Size</span>
                <span className={VALUE_CLASS}>{config?.indexing.chunk_size ? `${config.indexing.chunk_size} chars` : "Awaiting Backend Integration"}</span>
              </div>
              <div className={ROW_CLASS}>
                <span className={LABEL_CLASS}>Chunk Overlap</span>
                <span className={VALUE_CLASS}>{config?.indexing.chunk_overlap ? `${config.indexing.chunk_overlap} chars` : "Awaiting Backend Integration"}</span>
              </div>
              <div className={ROW_CLASS}>
                <span className={LABEL_CLASS}>Top-K Retrieval</span>
                <span className={VALUE_CLASS}>{config?.retrieval.top_k ?? "Awaiting Backend Integration"}</span>
              </div>
              <div className={ROW_CLASS}>
                <span className={LABEL_CLASS}>Retrieval Strategy</span>
                <span className={VALUE_CLASS}>Awaiting Backend Integration</span>
              </div>
            </div>
          </div>
        </section>

        {/* 3. Generation Configuration */}
        <section className={CARD_CLASS}>
          <div>
            <div className="mb-4 pb-2 border-b border-slate-100 dark:border-slate-800/50">
              <h2 className="text-lg font-semibold text-slate-900">Generation Configuration</h2>
              <p className="mt-1 text-sm text-slate-500">Inference parameters</p>
            </div>
            <div className="flex flex-col">
              {["Maximum Response Tokens", "Temperature", "Top P", "Frequency Penalty", "Presence Penalty", "Streaming Enabled"].map(label => (
                <div key={label} className={ROW_CLASS}>
                  <span className={LABEL_CLASS}>{label}</span>
                  <span className={VALUE_CLASS}>Awaiting Backend Integration</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 4. Embedding Configuration */}
        <section className={CARD_CLASS}>
          <div>
            <div className="mb-4 pb-2 border-b border-slate-100 dark:border-slate-800/50">
              <h2 className="text-lg font-semibold text-slate-900">Embedding Configuration</h2>
              <p className="mt-1 text-sm text-slate-500">Vector generation settings</p>
            </div>
            <div className="flex flex-col">
              <div className={ROW_CLASS}>
                <span className={LABEL_CLASS}>Embedding Model</span>
                <span className={VALUE_CLASS}>{config?.models.embed_model || "Awaiting Backend Integration"}</span>
              </div>
              {["Vector Dimensions", "Distance Metric", "Vector Store Type", "Embedding Precision"].map(label => (
                <div key={label} className={ROW_CLASS}>
                  <span className={LABEL_CLASS}>{label}</span>
                  <span className={VALUE_CLASS}>Awaiting Backend Integration</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 5. Indexing Configuration */}
        <section className={CARD_CLASS}>
          <div>
            <div className="mb-4 pb-2 border-b border-slate-100 dark:border-slate-800/50">
              <h2 className="text-lg font-semibold text-slate-900">Indexing Configuration</h2>
              <p className="mt-1 text-sm text-slate-500">Document processing pipeline</p>
            </div>
            <div className="flex flex-col">
              <div className={ROW_CLASS}>
                <span className={LABEL_CLASS}>Chunk Size</span>
                <span className={VALUE_CLASS}>{config?.indexing.chunk_size ? `${config.indexing.chunk_size} chars` : "Awaiting Backend Integration"}</span>
              </div>
              <div className={ROW_CLASS}>
                <span className={LABEL_CLASS}>Chunk Overlap</span>
                <span className={VALUE_CLASS}>{config?.indexing.chunk_overlap ? `${config.indexing.chunk_overlap} chars` : "Awaiting Backend Integration"}</span>
              </div>
              {["Supported File Types", "Index Storage", "Embedding Pipeline"].map(label => (
                <div key={label} className={ROW_CLASS}>
                  <span className={LABEL_CLASS}>{label}</span>
                  <span className={VALUE_CLASS}>Awaiting Backend Integration</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 6. Configuration Source */}
        <section className={`${CARD_CLASS} lg:col-span-2`}>
          <div>
            <div className="mb-4 pb-2 border-b border-slate-100 dark:border-slate-800/50">
              <h2 className="text-lg font-semibold text-slate-900">Configuration Source</h2>
              <p className="mt-1 text-sm text-slate-500">Origin of active platform settings</p>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div className="bg-white/50 dark:bg-slate-800/50 rounded-xl p-4 border border-slate-200 dark:border-slate-700">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Configuration File</p>
                <p className="mt-1 text-sm font-semibold text-slate-400">Awaiting Backend Integration</p>
              </div>
              <div className="bg-white/50 dark:bg-slate-800/50 rounded-xl p-4 border border-slate-200 dark:border-slate-700">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Environment Variables</p>
                <p className="mt-1 text-sm font-semibold text-slate-400">Awaiting Backend Integration</p>
              </div>
              <div className="bg-white/50 dark:bg-slate-800/50 rounded-xl p-4 border-t-2 border-t-blue-500 border-x-slate-200 border-b-slate-200 dark:border-x-slate-700 dark:border-b-slate-700">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Backend Config</p>
                <p className="mt-1 text-sm font-semibold text-blue-600">Loaded Successfully</p>
              </div>
            </div>
          </div>
        </section>

      </div>
    </div>
  )
}
