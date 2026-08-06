import { useEffect, useState } from "react"
import { getDocumentChunks } from "@/api/client"
import { useWorkstation } from "@/context/WorkstationContext"
import type { ChunkIndexRow } from "@/types/workstation"
import { Database, FileText, FileCode, FileSpreadsheet } from "lucide-react"

function documentTypeIcon(filename: string) {
  const ext = (filename.split(".").pop() || "").toLowerCase()
  if (ext === "xlsx" || ext === "csv") {
    return <FileSpreadsheet className="h-4 w-4 shrink-0 text-emerald-600" strokeWidth={2} />
  }
  if (ext === "md" || ext === "txt") {
    return <FileCode className="h-4 w-4 shrink-0 text-amber-600" strokeWidth={2} />
  }
  return <FileText className="h-4 w-4 shrink-0 text-blue-600" strokeWidth={2} />
}

export default function KnowledgeHubModule() {
  const { documentInventory } = useWorkstation()
  const [active, setActive] = useState<string | null>(null)
  const [chunks, setChunks] = useState<ChunkIndexRow[]>([])

  useEffect(() => {
    if (!active) {
      setChunks([])
      return
    }
    getDocumentChunks(active).then(setChunks).catch(() => setChunks([]))
  }, [active, documentInventory])

  const totalChunks = documentInventory.reduce((n, d) => n + d.chunks, 0)

  return (
    <div className="flex h-full min-h-0 flex-1 overflow-hidden p-4 sm:p-6 lg:p-8 bg-slate-50/30 gap-6">
      {/* Left Panel */}
      <div className="w-80 shrink-0 overflow-y-auto fluent-scrollbar bg-white/60 backdrop-blur-md border border-white/80 shadow-sm rounded-2xl p-4 flex flex-col min-h-0">
        <h1 className="mb-1 text-sm font-bold text-slate-800 tracking-tight">Knowledge Hub</h1>
        <p className="mb-4 text-[11px] font-medium text-slate-500">
          {documentInventory.length} docs · {totalChunks} chunks indexed
        </p>
        <ul className="flex flex-col gap-2 overflow-y-auto min-h-0 flex-1">
          {documentInventory.map((d) => {
            const isActive = active === d.filename;
            return (
              <li key={d.filename}>
                <button
                  type="button"
                  onClick={() => setActive(d.filename)}
                  className={`w-full flex items-start gap-3 p-3 rounded-xl transition-all text-left ${
                    isActive
                      ? "bg-[#007FFF]/10 border border-[#007FFF]/30 shadow-sm"
                      : "bg-white/40 border border-transparent hover:bg-white/60 hover:border-slate-200/50"
                  }`}
                >
                  <div className="mt-0.5 bg-white p-1.5 rounded-lg border border-slate-100 shadow-sm shrink-0">
                    {documentTypeIcon(d.filename)}
                  </div>
                  <div className="flex flex-col min-w-0 flex-1">
                    <span className={`text-xs truncate ${isActive ? "text-blue-900 font-semibold" : "text-slate-700 font-medium"}`}>
                      {d.filename}
                    </span>
                    <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                      <span className="inline-flex items-center gap-1 bg-slate-100 text-slate-600 text-[10px] font-semibold px-2 py-0.5 rounded-md">
                        <Database className="h-3 w-3 text-slate-400" />
                        {d.chunks} Chunks
                      </span>
                      <span className="inline-flex items-center bg-blue-50 text-blue-700 border border-blue-200/60 text-[10px] font-bold px-2 py-0.5 rounded-md">
                        SQLite F32
                      </span>
                    </div>
                  </div>
                </button>
              </li>
            );
          })}
        </ul>
      </div>

      {/* Right Panel */}
      <div className="flex-1 flex flex-col min-h-0">
        {!active ? (
          <div className="flex-1 flex flex-col items-center justify-center bg-white/60 backdrop-blur-md border border-white/80 shadow-sm rounded-2xl p-8 h-full">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-500 flex items-center justify-center mb-4 shadow-sm border border-blue-100/50">
              <Database className="h-6 w-6" strokeWidth={1.5} />
            </div>
            <h3 className="text-sm font-semibold text-slate-700 mb-1">No Document Selected</h3>
            <p className="text-xs font-medium text-slate-500">
              Select an indexed document to inspect vector chunk rows.
            </p>
          </div>
        ) : (
          <div className="flex flex-col h-full">
            <div className="mb-4">
              <h2 className="text-lg font-bold text-slate-800 tracking-tight truncate">
                {active}
              </h2>
              <p className="text-[11px] font-medium text-slate-500 mt-0.5">
                RAG Chunk Inspector · Embedding Analysis
              </p>
            </div>
            <div className="flex-1 overflow-y-auto fluent-scrollbar flex flex-col gap-4 pb-4 pr-2">
              {chunks.map((c) => (
                <div key={c.chunk_index} className="bg-white/70 backdrop-blur-md border border-white/80 rounded-xl p-4 shadow-xs flex flex-col gap-3 transition-shadow hover:shadow-sm">
                  {/* Header Row */}
                  <div className="flex items-center justify-between border-b border-slate-100/70 pb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-700 bg-slate-100 px-2 py-1 rounded-md border border-slate-200/60">
                        CHUNK-{(c.chunk_index).toString().padStart(3, '0')}
                      </span>
                      <span className="text-[11px] font-semibold text-slate-500">
                        {c.chars} Tokens
                      </span>
                    </div>
                    <span className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200/60 text-[10px] font-bold px-2.5 py-1 rounded-md">
                      <Database className="h-3 w-3" />
                      SQLite F32 Blob
                    </span>
                  </div>
                  {/* Text Preview */}
                  <div className="text-xs text-slate-700 bg-slate-50/80 p-3 rounded-lg border border-slate-200/50 font-mono leading-relaxed whitespace-pre-wrap break-words max-h-48 overflow-y-auto custom-scrollbar">
                    {c.preview}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
