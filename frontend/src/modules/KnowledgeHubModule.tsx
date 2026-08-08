import { useEffect, useMemo, useState, type ReactNode } from "react"
import {
  Activity,
  ChevronDown,
  ChevronUp,
  Clock,
  Database,
  FileCode,
  FileSpreadsheet,
  FileText,
  Gauge,
  Info,
  Layers,
  Maximize2,
  Minimize2,
  Search,
  SearchX,
  Server,
} from "lucide-react"
import { getDocumentChunks } from "@/api/client"
import { useWorkstation } from "@/context/WorkstationContext"
import { Panel } from "@/components/workstation/overview/primitives"
import type { ChunkIndexRow } from "@/types/workstation"

const NOT_AVAILABLE = "Not available"
const NO_DATA = "No data yet"
const NOT_REPORTED = "Not reported"
const DASH = "—"

function documentTypeIcon(filename: string) {
  const ext = (filename.split(".").pop() || "").toLowerCase()
  if (ext === "xlsx" || ext === "xls" || ext === "csv") {
    return <FileSpreadsheet className="h-4 w-4 shrink-0 text-emerald-600" strokeWidth={1.9} />
  }
  if (ext === "md" || ext === "txt") {
    return <FileCode className="h-4 w-4 shrink-0 text-amber-600" strokeWidth={1.9} />
  }
  if (ext === "pdf") {
    return <FileText className="h-4 w-4 shrink-0 text-rose-500" strokeWidth={1.9} />
  }
  return <FileText className="h-4 w-4 shrink-0 text-[#2563eb]" strokeWidth={1.9} />
}

/* ── Overview KPI tile ─────────────────────────────────────────────────── */

function KpiTile({ label, value, muted }: { label: string; value: string; muted?: boolean }) {
  return (
    <div className="vv-tile vv-tile--hover flex min-w-0 flex-col justify-center px-3.5 py-3">
      <div className="vv-eyebrow mb-1.5 truncate" title={label}>{label}</div>
      {muted ? (
        <p className="truncate text-[12px] font-normal not-italic text-slate-400" title={value}>
          {value}
        </p>
      ) : (
        <p className="truncate text-[13.5px] font-semibold tabular-nums text-slate-700" title={value}>
          {value}
        </p>
      )}
    </div>
  )
}

/* ── Statistics card ───────────────────────────────────────────────────── */

function StatCard({
  icon: Icon,
  label,
  value,
  caption,
  placeholder = DASH,
}: {
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>
  label: string
  value?: string
  caption?: string
  placeholder?: string
}) {
  return (
    <div className="vv-tile px-3.5 py-3">
      <div className="mb-1.5 flex items-center gap-1.5">
        <Icon className="h-3.5 w-3.5 text-slate-400" strokeWidth={1.9} />
        <span className="vv-eyebrow">{label}</span>
      </div>
      {value == null ? (
        <p className="truncate text-[12px] font-normal not-italic text-slate-400" title={placeholder}>
          {placeholder}
        </p>
      ) : (
        <p className="flex items-baseline gap-1">
          <span className="text-[15px] font-semibold tabular-nums text-slate-700">{value}</span>
          {caption && <span className="text-[10.5px] font-medium text-slate-400">{caption}</span>}
        </p>
      )}
    </div>
  )
}

/* ── Neutral metadata pill ─────────────────────────────────────────────── */

function Pill({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-white/85 bg-white/65 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.09em] text-slate-500 shadow-[0_1px_2px_rgba(16,32,64,0.04)]">
      {children}
    </span>
  )
}

export default function KnowledgeHubModule() {
  const { documentInventory, documentIndex } = useWorkstation()
  const [active, setActive] = useState<string | null>(null)
  const [chunks, setChunks] = useState<ChunkIndexRow[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [expandedChunks, setExpandedChunks] = useState<Record<number, boolean>>({})

  useEffect(() => {
    if (!active) {
      setChunks([])
      return
    }
    getDocumentChunks(active).then(setChunks).catch(() => setChunks([]))
  }, [active, documentInventory])

  useEffect(() => {
    setExpandedChunks({})
  }, [active])

  const toggleChunk = (index: number) => {
    setExpandedChunks((prev) => ({ ...prev, [index]: !prev[index] }))
  }

  const totalChunks = useMemo(
    () => documentInventory.reduce((n, d) => n + d.chunks, 0),
    [documentInventory],
  )

  const hasDocs = documentInventory.length > 0
  const embeddingModel = documentInventory[0]?.embedding_model || (hasDocs ? NOT_AVAILABLE : NO_DATA)
  const rawDimensions = documentIndex?.dimensions
  const vectorDimensions = rawDimensions ? rawDimensions.toLocaleString() : NO_DATA
  const vectorStoreType = documentIndex?.vector_store ?? NOT_AVAILABLE
  const databaseSize =
    documentIndex?.db_size_mb != null ? `${documentIndex.db_size_mb.toLocaleString()} MB` : NOT_AVAILABLE

  const lastIndexDate = useMemo(() => {
    const dates = documentInventory
      .map((d) => (d.last_updated ? new Date(d.last_updated).getTime() : 0))
      .filter((t) => t > 0)
    if (dates.length === 0) return NO_DATA
    return new Date(Math.max(...dates)).toLocaleString([], {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }, [documentInventory])

  const filteredInventory = useMemo(
    () =>
      documentInventory.filter((d) =>
        d.filename.toLowerCase().includes(searchQuery.toLowerCase()),
      ),
    [documentInventory, searchQuery],
  )

  // Derived purely from the already-fetched chunk rows (chars is backend data).
  const chunkStats = useMemo(() => {
    if (chunks.length === 0) return null
    const sizes = chunks.map((c) => c.chars)
    const total = sizes.reduce((a, b) => a + b, 0)
    return {
      avg: Math.round(total / sizes.length),
      max: Math.max(...sizes),
      min: Math.min(...sizes),
    }
  }, [chunks])

  const MUTED = new Set([NOT_AVAILABLE, NO_DATA, NOT_REPORTED, DASH])
  const kpis: { label: string; value: string; muted?: boolean }[] = [
    { label: "Indexed Documents", value: documentInventory.length.toLocaleString() },
    { label: "Total Chunks", value: totalChunks.toLocaleString() },
    { label: "Embedding Model", value: embeddingModel, muted: MUTED.has(embeddingModel) },
    { label: "Vector Dimensions", value: vectorDimensions, muted: MUTED.has(vectorDimensions) },
    { label: "Vector Store Type", value: vectorStoreType, muted: MUTED.has(vectorStoreType) },
    { label: "Database Size", value: databaseSize, muted: MUTED.has(databaseSize) },
    { label: "Last Index Operation", value: lastIndexDate, muted: MUTED.has(lastIndexDate) },
  ]

  return (
    <div className="flex h-full min-h-0 w-full flex-col overflow-hidden p-4 sm:p-5 lg:p-6">
      <div className="mx-auto flex h-full min-h-0 w-full max-w-[1680px] flex-col gap-5">
        {/* ── 1. Knowledge Overview ─────────────────────────────────────── */}
        <Panel className="shrink-0 p-5" delay={0}>
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <Server className="h-[18px] w-[18px] shrink-0 text-slate-500" strokeWidth={1.9} />
              <div>
                <h1 className="vv-title-section">Knowledge Overview</h1>
                <p className="vv-caption mt-0.5">Enterprise knowledge repository · index telemetry</p>
              </div>
            </div>
            <Pill>
              <Database className="h-3 w-3" strokeWidth={2} />
              {documentInventory.length.toLocaleString()} indexed
            </Pill>
          </div>

          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-7">
            {kpis.map((kpi) => (
              <KpiTile key={kpi.label} label={kpi.label} value={kpi.value} muted={kpi.muted} />
            ))}
          </div>
        </Panel>

        {/* ── Main working area ─────────────────────────────────────────── */}
        <div className="flex min-h-0 flex-1 flex-col gap-5 lg:flex-row">
          {/* Left — search + document inventory */}
          <div className="flex min-h-0 shrink-0 flex-col gap-3 lg:w-[300px] xl:w-[330px] 2xl:w-[372px]">
            <div className="ws-input-bar flex shrink-0 items-center gap-2.5">
              <Search className="h-4 w-4 shrink-0 text-slate-400" strokeWidth={1.9} />
              <input
                type="search"
                placeholder="Search indexed documents..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                aria-label="Search indexed documents"
                className="min-w-0 flex-1 border-0 bg-transparent p-0 text-[13px] font-medium text-slate-700 placeholder:font-normal placeholder:text-slate-400 focus:outline-none"
              />
            </div>

            <Panel className="flex min-h-0 flex-1 flex-col overflow-hidden p-2.5" delay={70}>
              {filteredInventory.length === 0 ? (
                <div className="flex flex-1 flex-col items-center justify-center p-6 text-center">
                  <span className="vv-plate mb-3 h-11 w-11" style={{ color: "#94a3b8" }}>
                    <SearchX className="h-5 w-5" strokeWidth={1.7} />
                  </span>
                  <p className="text-[13px] font-medium text-slate-500">No documents found</p>
                  <p className="vv-caption mt-1">Try a different search term.</p>
                </div>
              ) : (
                <ul className="fluent-scrollbar flex flex-1 flex-col gap-2 overflow-y-auto pr-0.5">
                  {filteredInventory.map((d) => {
                    const isActive = active === d.filename
                    const docDate = d.last_updated
                      ? new Date(d.last_updated).toLocaleDateString([], {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })
                      : DASH
                    const docType = d.type || d.file_type || DASH

                    return (
                      <li key={d.filename}>
                        <button
                          type="button"
                          onClick={() => setActive(d.filename)}
                          aria-pressed={isActive}
                          className={`vv-kh-doc flex flex-col gap-3 p-3 ${isActive ? "vv-kh-doc--active" : ""}`}
                        >
                          <div className="flex w-full items-start gap-2.5">
                            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[10px] border border-white/80 bg-white/80 shadow-[0_1px_2px_rgba(16,32,64,0.05)]">
                              {documentTypeIcon(d.filename)}
                            </span>
                            <div className="flex min-w-0 flex-1 flex-col">
                              <span
                                className={`truncate text-[12.5px] font-semibold ${isActive ? "text-[#1d4ed8]" : "text-slate-700"}`}
                                title={d.filename}
                              >
                                {d.filename}
                              </span>
                              <div className="mt-0.5 flex items-center gap-2 text-[10.5px] text-slate-400">
                                <span className="truncate font-medium">{docType}</span>
                                <span className="flex shrink-0 items-center gap-1">
                                  <Clock className="h-3 w-3" strokeWidth={2} />
                                  {docDate}
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="flex flex-wrap items-center gap-1.5 border-t border-white/60 pt-2.5">
                            <span className="inline-flex items-center gap-1 rounded-md border border-white/80 bg-white/70 px-2 py-0.5 text-[10px] font-medium text-slate-500">
                              <Activity className="h-3 w-3 text-slate-400" strokeWidth={2} />
                              {d.indexation_state}
                            </span>
                            <span className="vv-kh-chip !py-0.5 !text-[10px]">
                              {d.chunks.toLocaleString()} chunks
                            </span>
                          </div>
                        </button>
                      </li>
                    )
                  })}
                </ul>
              )}
            </Panel>
          </div>

          {/* Right — document inspector / knowledge statistics */}
          <Panel className="flex min-h-0 flex-1 flex-col overflow-hidden p-5 sm:p-6" delay={140}>
            {!active ? (
              /* ── Empty state + Knowledge Statistics ─────────────────── */
              <div className="flex flex-1 flex-col items-center justify-center">
                <div className="mb-8 flex flex-col items-center text-center">
                  <span className="vv-plate mb-4 h-12 w-12">
                    <Database className="h-6 w-6" strokeWidth={1.6} />
                  </span>
                  <h2 className="vv-title-section mb-1.5">Knowledge Statistics</h2>
                  <p className="vv-body max-w-sm text-slate-500">
                    Select a document from the inventory to inspect its vectorised chunk rows and embedding
                    telemetry.
                  </p>
                </div>

                <div className="grid w-full max-w-2xl grid-cols-2 gap-2.5 sm:grid-cols-4">
                  <StatCard icon={Gauge} label="Average Chunk Size" placeholder={DASH} />
                  <StatCard icon={Layers} label="Average Tokens" placeholder={NOT_REPORTED} />
                  <StatCard icon={Maximize2} label="Largest Chunk" placeholder={DASH} />
                  <StatCard icon={Minimize2} label="Smallest Chunk" placeholder={DASH} />
                </div>
              </div>
            ) : (
              <div className="flex h-full min-h-0 flex-col">
                {/* Inspector header */}
                <div className="mb-4 flex shrink-0 flex-wrap items-start justify-between gap-3 border-b border-white/60 pb-4">
                  <div className="flex min-w-0 items-center gap-2.5">
                    <span className="vv-plate h-8 w-8">
                      <Info className="h-[16px] w-[16px]" strokeWidth={1.9} />
                    </span>
                    <div className="min-w-0">
                      <h2 className="vv-title-card truncate" title={active}>
                        {active}
                      </h2>
                      <p className="vv-caption mt-0.5">RAG chunk inspector · embedding analysis</p>
                    </div>
                  </div>
                  <Pill>
                    <Layers className="h-3 w-3" strokeWidth={2} />
                    {chunks.length.toLocaleString()} chunks
                  </Pill>
                </div>

                {/* Knowledge Statistics — derived from loaded chunk rows */}
                <div className="mb-4 grid shrink-0 grid-cols-2 gap-2.5 sm:grid-cols-4">
                  <StatCard
                    icon={Gauge}
                    label="Average Chunk Size"
                    value={chunkStats ? chunkStats.avg.toLocaleString() : undefined}
                    caption="chars"
                  />
                  <StatCard icon={Layers} label="Average Tokens" placeholder={NOT_REPORTED} />
                  <StatCard
                    icon={Maximize2}
                    label="Largest Chunk"
                    value={chunkStats ? chunkStats.max.toLocaleString() : undefined}
                    caption="chars"
                  />
                  <StatCard
                    icon={Minimize2}
                    label="Smallest Chunk"
                    value={chunkStats ? chunkStats.min.toLocaleString() : undefined}
                    caption="chars"
                  />
                </div>

                {/* Chunk cards */}
                {chunks.length === 0 ? (
                  <div className="flex flex-1 flex-col items-center justify-center text-center">
                    <p className="vv-caption">Loading chunk index…</p>
                  </div>
                ) : (
                  <div className="fluent-scrollbar grid min-h-0 flex-1 auto-rows-min gap-3.5 overflow-y-auto pr-1 xl:grid-cols-2">
                    {chunks.map((c, i) => {
                      const isExpanded = expandedChunks[c.chunk_index] || false
                      return (
                        <div
                          key={c.chunk_index}
                          className="vv-tile vv-rise flex flex-col gap-3 self-start p-4"
                          style={{ animationDelay: `${Math.min(i, 10) * 45}ms` }}
                        >
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <span className="vv-kh-chip">
                              CHUNK-{c.chunk_index.toString().padStart(3, "0")}
                            </span>
                            <div className="flex items-center gap-4">
                              <div className="flex flex-col items-end">
                                <span className="vv-eyebrow">Characters</span>
                                <span className="text-[12.5px] font-semibold tabular-nums text-slate-700">
                                  {c.chars.toLocaleString()}
                                </span>
                              </div>
                              <div className="flex min-w-0 flex-col items-end">
                                <span className="vv-eyebrow">Tokens</span>
                                <span className="max-w-[140px] truncate text-[11px] font-normal not-italic text-slate-400" title={NOT_REPORTED}>
                                  {NOT_REPORTED}
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="border-t border-white/60 pt-3">
                            <div className="mb-1.5 flex items-center justify-between">
                              <span className="vv-eyebrow">Preview</span>
                              <span className="vv-eyebrow text-slate-300">Order {c.chunk_index}</span>
                            </div>
                            <p className={`vv-kh-preview ${isExpanded ? "" : "line-clamp-4"}`}>{c.preview}</p>
                            <button
                              type="button"
                              onClick={() => toggleChunk(c.chunk_index)}
                              className="mt-2.5 inline-flex items-center gap-1.5 text-[11px] font-medium text-slate-500 transition-colors hover:text-[#1d4ed8]"
                            >
                              {isExpanded ? (
                                <>
                                  <ChevronUp className="h-3.5 w-3.5" strokeWidth={2} /> Collapse preview
                                </>
                              ) : (
                                <>
                                  <ChevronDown className="h-3.5 w-3.5" strokeWidth={2} /> Expand full chunk
                                </>
                              )}
                            </button>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            )}
          </Panel>
        </div>
      </div>
    </div>
  )
}
