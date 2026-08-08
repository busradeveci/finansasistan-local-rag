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
    strategy?: string
  }
  generation?: {
    max_response_tokens: number
    temperature: number
    top_p: number
    streaming: boolean
  }
  embedding?: {
    model: string
    dimensions: number | null
    distance_metric: string
    vector_store: string
    precision: string
  }
  indexing: {
    chunk_size: number
    chunk_overlap: number
    supported_file_types?: string[]
    index_storage?: string
    embedding_pipeline?: string
  }
  source?: {
    config_file: string
    environment_variables: string
    provider: string
  }
}

const NOT_CONFIGURED = "Not configured"
const NOT_AVAILABLE = "Not available"

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
          <RefreshCw className="mb-4 h-8 w-8 animate-spin text-[#000080]" />
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

  const CARD_CLASS = "relative p-6 rounded-2xl bg-white/90 backdrop-blur-md border border-slate-200/60 shadow-sm flex flex-col justify-between"
  const ROW_CLASS = "flex items-center justify-between py-3 border-b border-slate-100/70 last:border-none"
  const LABEL_CLASS = "text-sm font-medium text-slate-700"
  const VALUE_CLASS = "text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-50 text-slate-700 border border-slate-200/60"
  const BADGE_CLASS = "text-xs font-semibold px-2.5 py-1 rounded-full bg-[#000080]/5 text-[#000080] border border-[#000080]/10"

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden ws-module-shell bg-transparent p-4 sm:p-6 lg:p-8">
      <header className="mb-6 shrink-0">
        <h1 className="text-xl font-bold text-slate-800 tracking-tight">Settings</h1>
        <p className="mt-1 truncate text-sm font-medium text-slate-500">
          Platform configuration center for retrieval, model orchestration, and RAG behavior
        </p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 overflow-y-auto fluent-scrollbar p-1">
        
        {/* 1. AI Models */}
        <section className={CARD_CLASS}>
          <div>
            <div className="mb-4 pb-2 border-b border-slate-100">
              <h2 className="text-lg font-semibold text-slate-800 tracking-tight">AI Models</h2>
              <p className="mt-1 text-xs text-slate-500 font-medium">Configured local orchestration models</p>
            </div>
            <div className="flex flex-col">
              <div className={ROW_CLASS}>
                <div className="flex flex-col">
                  <span className={LABEL_CLASS}>{config?.models.chat_model || NOT_CONFIGURED}</span>
                  <span className="text-xs text-slate-500 font-medium">Backend Config</span>
                </div>
                <span className={BADGE_CLASS}>Active (Chat)</span>
              </div>
              <div className={ROW_CLASS}>
                <div className="flex flex-col">
                  <span className={LABEL_CLASS}>{config?.models.embed_model || NOT_CONFIGURED}</span>
                  <span className="text-xs text-slate-500 font-medium">Backend Config</span>
                </div>
                <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/60">Active (Embed)</span>
              </div>
              <div className={ROW_CLASS}>
                <div className="flex flex-col">
                  <span className={LABEL_CLASS}>{config?.models.router_model || NOT_CONFIGURED}</span>
                  <span className="text-xs text-slate-500 font-medium">Backend Config</span>
                </div>
                <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-purple-50 text-purple-700 border border-purple-200/60">Active (Router)</span>
              </div>
            </div>
          </div>
        </section>

        {/* 2. Retrieval Configuration */}
        <section className={CARD_CLASS}>
          <div>
            <div className="mb-4 pb-2 border-b border-slate-100">
              <h2 className="text-lg font-semibold text-slate-800 tracking-tight">Retrieval Configuration</h2>
              <p className="mt-1 text-xs text-slate-500 font-medium">Vector search backend parameters</p>
            </div>
            <div className="flex flex-col">
              <div className={ROW_CLASS}>
                <span className={LABEL_CLASS}>Score Threshold</span>
                <span className={VALUE_CLASS}>{config?.retrieval.score_threshold ?? NOT_AVAILABLE}</span>
              </div>
              <div className={ROW_CLASS}>
                <span className={LABEL_CLASS}>Relative Cutoff</span>
                <span className={VALUE_CLASS}>{config?.retrieval.relative_cutoff ?? NOT_AVAILABLE}</span>
              </div>
              <div className={ROW_CLASS}>
                <span className={LABEL_CLASS}>Maximum Context Chunks</span>
                <span className={VALUE_CLASS}>{config?.retrieval.max_context_chunks ?? NOT_AVAILABLE}</span>
              </div>
              <div className={ROW_CLASS}>
                <span className={LABEL_CLASS}>Chunk Size</span>
                <span className={VALUE_CLASS}>{config?.indexing.chunk_size ? `${config.indexing.chunk_size} chars` : NOT_AVAILABLE}</span>
              </div>
              <div className={ROW_CLASS}>
                <span className={LABEL_CLASS}>Chunk Overlap</span>
                <span className={VALUE_CLASS}>{config?.indexing.chunk_overlap ? `${config.indexing.chunk_overlap} chars` : NOT_AVAILABLE}</span>
              </div>
              <div className={ROW_CLASS}>
                <span className={LABEL_CLASS}>Top-K Retrieval</span>
                <span className={VALUE_CLASS}>{config?.retrieval.top_k ?? NOT_AVAILABLE}</span>
              </div>
              <div className={ROW_CLASS}>
                <span className={LABEL_CLASS}>Retrieval Strategy</span>
                <span className={VALUE_CLASS}>{config?.retrieval.strategy ?? NOT_AVAILABLE}</span>
              </div>
            </div>
          </div>
        </section>

        {/* 3. Generation Configuration */}
        <section className={CARD_CLASS}>
          <div>
            <div className="mb-4 pb-2 border-b border-slate-100">
              <h2 className="text-lg font-semibold text-slate-800 tracking-tight">Generation Configuration</h2>
              <p className="mt-1 text-xs text-slate-500 font-medium">Inference parameters</p>
            </div>
            <div className="flex flex-col">
              <div className={ROW_CLASS}>
                <span className={LABEL_CLASS}>Maximum Response Tokens</span>
                <span className={VALUE_CLASS}>{config?.generation?.max_response_tokens ?? NOT_AVAILABLE}</span>
              </div>
              <div className={ROW_CLASS}>
                <span className={LABEL_CLASS}>Temperature</span>
                <span className={VALUE_CLASS}>{config?.generation?.temperature ?? NOT_AVAILABLE}</span>
              </div>
              <div className={ROW_CLASS}>
                <span className={LABEL_CLASS}>Top P</span>
                <span className={VALUE_CLASS}>{config?.generation?.top_p ?? NOT_AVAILABLE}</span>
              </div>
              <div className={ROW_CLASS}>
                <span className={LABEL_CLASS}>Frequency Penalty</span>
                <span className={VALUE_CLASS}>{NOT_CONFIGURED}</span>
              </div>
              <div className={ROW_CLASS}>
                <span className={LABEL_CLASS}>Presence Penalty</span>
                <span className={VALUE_CLASS}>{NOT_CONFIGURED}</span>
              </div>
              <div className={ROW_CLASS}>
                <span className={LABEL_CLASS}>Streaming Enabled</span>
                <span className={VALUE_CLASS}>{config?.generation ? (config.generation.streaming ? "Enabled" : "Disabled") : NOT_AVAILABLE}</span>
              </div>
            </div>
          </div>
        </section>

        {/* 4. Embedding Configuration */}
        <section className={CARD_CLASS}>
          <div>
            <div className="mb-4 pb-2 border-b border-slate-100">
              <h2 className="text-lg font-semibold text-slate-800 tracking-tight">Embedding Configuration</h2>
              <p className="mt-1 text-xs text-slate-500 font-medium">Vector generation settings</p>
            </div>
            <div className="flex flex-col">
              <div className={ROW_CLASS}>
                <span className={LABEL_CLASS}>Embedding Model</span>
                <span className={VALUE_CLASS}>{config?.embedding?.model || config?.models.embed_model || NOT_CONFIGURED}</span>
              </div>
              <div className={ROW_CLASS}>
                <span className={LABEL_CLASS}>Vector Dimensions</span>
                <span className={VALUE_CLASS}>{config?.embedding?.dimensions ?? "No data yet"}</span>
              </div>
              <div className={ROW_CLASS}>
                <span className={LABEL_CLASS}>Distance Metric</span>
                <span className={VALUE_CLASS}>{config?.embedding?.distance_metric ?? NOT_AVAILABLE}</span>
              </div>
              <div className={ROW_CLASS}>
                <span className={LABEL_CLASS}>Vector Store Type</span>
                <span className={VALUE_CLASS}>{config?.embedding?.vector_store ?? NOT_AVAILABLE}</span>
              </div>
              <div className={ROW_CLASS}>
                <span className={LABEL_CLASS}>Embedding Precision</span>
                <span className={VALUE_CLASS}>{config?.embedding?.precision ?? NOT_AVAILABLE}</span>
              </div>
            </div>
          </div>
        </section>

        {/* 5. Indexing Configuration */}
        <section className={CARD_CLASS}>
          <div>
            <div className="mb-4 pb-2 border-b border-slate-100">
              <h2 className="text-lg font-semibold text-slate-800 tracking-tight">Indexing Configuration</h2>
              <p className="mt-1 text-xs text-slate-500 font-medium">Document processing pipeline</p>
            </div>
            <div className="flex flex-col">
              <div className={ROW_CLASS}>
                <span className={LABEL_CLASS}>Chunk Size</span>
                <span className={VALUE_CLASS}>{config?.indexing.chunk_size ? `${config.indexing.chunk_size} chars` : NOT_AVAILABLE}</span>
              </div>
              <div className={ROW_CLASS}>
                <span className={LABEL_CLASS}>Chunk Overlap</span>
                <span className={VALUE_CLASS}>{config?.indexing.chunk_overlap ? `${config.indexing.chunk_overlap} chars` : NOT_AVAILABLE}</span>
              </div>
              <div className={ROW_CLASS}>
                <span className={LABEL_CLASS}>Supported File Types</span>
                <span className={VALUE_CLASS}>{config?.indexing.supported_file_types?.join(", ") ?? NOT_AVAILABLE}</span>
              </div>
              <div className={ROW_CLASS}>
                <span className={LABEL_CLASS}>Index Storage</span>
                <span className={VALUE_CLASS}>{config?.indexing.index_storage ?? NOT_AVAILABLE}</span>
              </div>
              <div className={ROW_CLASS}>
                <span className={LABEL_CLASS}>Embedding Pipeline</span>
                <span className={VALUE_CLASS}>{config?.indexing.embedding_pipeline ?? NOT_AVAILABLE}</span>
              </div>
            </div>
          </div>
        </section>

        {/* 6. Configuration Source */}
        <section className={`${CARD_CLASS} lg:col-span-2`}>
          <div>
            <div className="mb-4 pb-2 border-b border-slate-100">
              <h2 className="text-lg font-semibold text-slate-800 tracking-tight">Configuration Source</h2>
              <p className="mt-1 text-xs text-slate-500 font-medium">Origin of active platform settings</p>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div className="bg-white rounded-xl p-4 border border-slate-200/60 shadow-sm text-center">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Configuration File</p>
                <p className="mt-1.5 text-xs font-semibold text-slate-600 font-mono">{config?.source?.config_file ?? NOT_AVAILABLE}</p>
              </div>
              <div className="bg-white rounded-xl p-4 border border-slate-200/60 shadow-sm text-center">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Environment Variables</p>
                <p className="mt-1.5 text-xs font-semibold text-slate-400 italic">{config?.source?.environment_variables ?? NOT_AVAILABLE}</p>
              </div>
              <div className="bg-[#000080]/5 rounded-xl p-4 border border-[#000080]/20 shadow-sm text-center">
                <p className="text-[10px] font-bold uppercase tracking-wider text-[#000080]/60">Backend Config</p>
                <p className="mt-1.5 text-sm font-bold text-[#000080]">Loaded Successfully</p>
              </div>
            </div>
          </div>
        </section>

      </div>
    </div>
  )
}
