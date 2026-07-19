import { useRef, useState } from "react"

import { AlertCircle, FileSpreadsheet, FileText, Loader2, Table2, Trash2, Upload } from "lucide-react"

import { deleteDocument } from "@/api/client"

import { useWorkstation } from "@/context/WorkstationContext"

import type { DocumentInventoryRow } from "@/types/workstation"

const ALLOWED = [".txt", ".md", ".pdf", ".docx", ".xlsx", ".csv"]

const HYPER_GLASS =
  "bg-white/30 backdrop-blur-md border border-white/60 shadow-[0_4px_12px_rgba(0,0,0,0.05),inset_0_1px_1px_rgba(255,255,255,0.9)] rounded-full hover:bg-white/40 transition-all duration-300"

const GLASS_INNER =
  "bg-white/20 backdrop-blur-2xl backdrop-saturate-[1.1] border border-white/40 shadow-[0_8px_30px_rgb(0,0,0,0.04),inset_0_1px_0_rgba(255,255,255,0.8),inset_0_-1px_0_rgba(255,255,255,0.2)] rounded-3xl"

function documentTypeIcon(filename: string, type?: string) {
  const ext = (type || filename.split(".").pop() || "").toLowerCase()
  if (ext === "xlsx") {
    return <FileSpreadsheet className="h-3.5 w-3.5 shrink-0 text-[var(--ws-chart-purple)]" strokeWidth={1.75} />
  }
  if (ext === "csv") {
    return <Table2 className="h-3.5 w-3.5 shrink-0 text-[var(--ws-primary)]" strokeWidth={1.75} />
  }
  return <FileText className="h-3.5 w-3.5 shrink-0 text-slate-500" strokeWidth={1.75} />
}

export default function DocumentsModule() {
  const {
    documentInventory,
    documentInventoryLoading,
    documentInventoryError,
    refreshDocumentInventory,
    uploadQueue,
    uploadFiles,
  } = useWorkstation()

  const [search, setSearch] = useState("")
  const [dragOver, setDragOver] = useState(false)
  const [selected, setSelected] = useState<DocumentInventoryRow | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const filtered = documentInventory.filter((r) =>
    r.filename.toLowerCase().includes(search.toLowerCase()),
  )

  const handleFiles = (files: File[]) => {
    if (inputRef.current) inputRef.current.value = ""
    uploadFiles(files)
  }

  return (
    <div className="flex h-full min-h-0 flex-1 gap-6 overflow-hidden p-1">
      <div className="flex min-h-0 flex-1 flex-col gap-6 overflow-y-auto fluent-scrollbar ws-module-shell">
        <header>
          <h1 className="text-page-title">Documents</h1>
          <p className="mt-1 text-xs font-medium text-slate-600/80">
            Asset ingestion, vectorization, and index management
          </p>
        </header>

        {documentInventoryError && (
          <div className="flex items-center gap-2 rounded-2xl border border-red-200/80 bg-red-50/80 px-4 py-3 text-xs text-red-700 backdrop-blur-sm">
            <AlertCircle className="h-3.5 w-3.5 shrink-0" />
            <span className="flex-1">{documentInventoryError}</span>
            <button
              type="button"
              onClick={() => refreshDocumentInventory()}
              className="text-[11px] font-semibold underline"
            >
              Retry
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
          <div
            onDragOver={(e) => {
              e.preventDefault()
              setDragOver(true)
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => {
              e.preventDefault()
              setDragOver(false)
              handleFiles(Array.from(e.dataTransfer.files))
            }}
            onClick={() => inputRef.current?.click()}
            className={`ws-glass-panel cursor-pointer text-left transition-all duration-200 xl:col-span-2 ${
              dragOver ? "border-blue-300/60 bg-white/30" : "hover:bg-white/30"
            }`}
          >
            <input
              ref={inputRef}
              type="file"
              multiple
              accept={ALLOWED.join(",")}
              className="hidden"
              onChange={(e) => {
                handleFiles(Array.from(e.target.files || []))
              }}
            />
            <div className="flex items-start gap-4">
              <div className={`flex h-10 w-10 shrink-0 items-center justify-center ${HYPER_GLASS} !rounded-2xl`}>
                <Upload className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-900">
                  Import Documents (.txt, .md, .pdf, .docx, .xlsx, .csv)
                </p>
                <p className="mt-1 text-[11px] font-medium text-slate-600/80">
                  {dragOver ? "Release to index" : "Drag and drop or click to browse — uploads continue in background"}
                </p>
              </div>
            </div>
          </div>

          <div className="ws-glass-panel flex flex-col justify-center">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-600/70">Indexed Assets</p>
            <p className="mt-1 text-3xl font-semibold tabular-nums tracking-tight text-slate-800">
              {documentInventory.length.toLocaleString()}
            </p>
            <p className="mt-1 text-xs text-slate-600/80">Documents in vector store</p>
          </div>
        </div>

        {uploadQueue.length > 0 && (
          <div className="ws-glass-panel-compact overflow-hidden p-0">
            <div className="border-b border-white/50 px-6 py-3">
              <h2 className="text-sm font-semibold text-slate-900">Upload Queue</h2>
            </div>
            <ul className="divide-y divide-white/40">
              {uploadQueue.map((q) => (
                <li key={q.name} className="flex items-center gap-2 px-6 py-3 text-xs">
                  {q.status === "indexing" ? (
                    <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin text-blue-600" />
                  ) : (
                    documentTypeIcon(q.name)
                  )}
                  <span className="flex-1 truncate text-slate-600/90">{q.name}</span>
                  <span
                    className={`px-2 py-0.5 text-[10px] font-semibold ${HYPER_GLASS}`}
                    style={{ color: q.status === "failed" ? "var(--ws-danger)" : "var(--ws-primary)" }}
                  >
                    {q.status === "indexing" ? "Indexing…" : q.status === "success" ? "Parsed Successfully" : q.detail}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="ws-glass-panel flex min-h-0 flex-1 flex-col">
          <div className="mb-4 flex items-center justify-between gap-4 border-b border-white/50 pb-4">
            <div>
              <h2 className="text-section-title">Document Inventory</h2>
              <p className="mt-0.5 text-xs text-slate-600/80">Browse and manage indexed files</p>
            </div>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search documents…"
              className={`w-full max-w-xs px-3 py-2 text-xs text-slate-800 placeholder:text-slate-500 focus:outline-none ${HYPER_GLASS}`}
            />
          </div>

          {documentInventoryLoading && documentInventory.length === 0 ? (
            <div className="flex items-center gap-2 py-8 text-xs text-slate-600/80">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading inventory…
            </div>
          ) : (
            <div className="min-h-0 flex-1 overflow-x-auto">
              <table className="ws-data-table">
                <thead>
                  <tr>
                    {["Filename", "Type", "Chunks", "Vector Matrix", "State", "Updated", "Actions"].map((h) => (
                      <th key={h}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-slate-600/70">
                        No documents indexed yet
                      </td>
                    </tr>
                  ) : (
                    filtered.map((row) => (
                      <tr
                        key={row.filename}
                        className="ws-row-interactive cursor-pointer"
                        onClick={() => setSelected(row)}
                      >
                        <td className="max-w-[200px]">
                          <span className="flex min-w-0 items-center gap-1.5">
                            {documentTypeIcon(row.filename, row.type)}
                            <span className="truncate">{row.filename}</span>
                          </span>
                        </td>
                        <td>{row.type}</td>
                        <td className="tabular-nums font-medium text-slate-800">{row.chunks}</td>
                        <td className="tabular-nums">{row.embedding_dimensions} dim</td>
                        <td className="text-blue-600">{row.indexation_state}</td>
                        <td>
                          {row.last_updated ? new Date(row.last_updated).toLocaleDateString() : "—"}
                        </td>
                        <td>
                          <button
                            type="button"
                            onClick={async (e) => {
                              e.stopPropagation()
                              try {
                                await deleteDocument(row.filename)
                                if (selected?.filename === row.filename) setSelected(null)
                                await refreshDocumentInventory()
                              } catch {
                                /* refreshDocumentInventory surfaces errors via context alerts */
                              }
                            }}
                            className="rounded-lg p-1 transition-colors hover:bg-white/50 hover:text-red-600"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {selected && (
        <aside className="ws-glass-panel w-72 shrink-0 overflow-y-auto fluent-scrollbar !p-5">
          <h2 className="mb-4 text-xs font-semibold uppercase tracking-wider text-slate-600/70">
            Document Inspector
          </h2>
          <dl className="space-y-4 text-[11px]">
            <div>
              <dt className="font-semibold uppercase tracking-wider text-slate-600/70">File</dt>
              <dd className="mt-1.5 flex items-center gap-1.5 text-slate-600/90">
                {documentTypeIcon(selected.filename, selected.type)}
                <span>{selected.filename}</span>
              </dd>
            </div>
            <div>
              <dt className="font-semibold uppercase tracking-wider text-slate-600/70">Chunks</dt>
              <dd className="mt-1.5 text-slate-900">{selected.chunks}</dd>
            </div>
            <div>
              <dt className="font-semibold uppercase tracking-wider text-slate-600/70">Embedding</dt>
              <dd className="mt-1.5 text-slate-600/90">
                {selected.embedding_model} · {selected.embedding_dimensions}d
              </dd>
            </div>
            <div>
              <dt className="font-semibold uppercase tracking-wider text-slate-600/70">Index health</dt>
              <dd className="mt-1.5 text-slate-900">{selected.indexation_state}</dd>
            </div>
            <div>
              <dt className="font-semibold uppercase tracking-wider text-slate-600/70">Path</dt>
              <dd className="mt-1.5 break-all text-slate-600/90">{selected.path}</dd>
            </div>
          </dl>
        </aside>
      )}
    </div>
  )
}
