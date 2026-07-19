import { useRef, useState } from "react"

import { AlertCircle, FileSpreadsheet, FileText, Loader2, Table2, Trash2, Upload } from "lucide-react"

import { deleteDocument } from "@/api/client"

import { useWorkstation } from "@/context/WorkstationContext"

import type { DocumentInventoryRow } from "@/types/workstation"

const ALLOWED = [".txt", ".md", ".pdf", ".docx", ".xlsx", ".csv"]

function documentTypeIcon(filename: string, type?: string) {
  const ext = (type || filename.split(".").pop() || "").toLowerCase()
  if (ext === "xlsx") {
    return <FileSpreadsheet className="h-3.5 w-3.5 shrink-0 text-[var(--ws-chart-purple)]" strokeWidth={1.75} />
  }
  if (ext === "csv") {
    return <Table2 className="h-3.5 w-3.5 shrink-0 text-[var(--ws-primary)]" strokeWidth={1.75} />
  }
  return <FileText className="h-3.5 w-3.5 shrink-0 text-[var(--ws-text-muted)]" strokeWidth={1.75} />
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
    <div className="flex h-full min-h-0 flex-1 overflow-hidden bg-white">
      <div className="flex min-h-0 flex-1 flex-col space-y-4 overflow-y-auto fluent-scrollbar ws-module-shell">
        <header className="border-b border-gray-200 pb-4">
          <h1 className="text-page-title">Documents</h1>
          <p className="text-xs font-medium text-[var(--ws-text-muted)]">
            Asset ingestion, vectorization, and index management
          </p>
        </header>

        {documentInventoryError && (
          <div
            className="flex items-center gap-2 rounded-sm border border-red-200 bg-red-50 px-2.5 py-1.5 text-xs text-[var(--ws-danger)]"
          >
            <AlertCircle className="h-3.5 w-3.5 shrink-0" />
            <span className="flex-1">{documentInventoryError}</span>
            <button
              type="button"
              onClick={() => refreshDocumentInventory()}
              className="text-[11px] font-medium underline"
            >
              Retry
            </button>
          </div>
        )}

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
          className={`cursor-pointer rounded-sm border border-dashed px-4 py-4 text-left transition-colors ${
            dragOver
              ? "border-[var(--ws-primary)] bg-blue-50"
              : "border-gray-300 bg-gray-50 hover:border-gray-400"
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
          <div className="flex items-start gap-3">
            <Upload className="mt-0.5 h-5 w-5 shrink-0 text-[var(--ws-primary)]" />
            <div>
              <p className="text-sm font-medium text-[var(--ws-text)]">
                Import Documents (.txt, .md, .pdf, .docx, .xlsx, .csv)
              </p>
              <p className="mt-0.5 text-[11px] font-medium text-[var(--ws-text-muted)]">
                {dragOver ? "Release to index" : "Drag and drop or click to browse — uploads continue in background"}
              </p>
            </div>
          </div>
        </div>

        {uploadQueue.length > 0 && (
          <ul className="divide-y divide-gray-100 border-b border-gray-200">
            {uploadQueue.map((q) => (
              <li key={q.name} className="flex items-center gap-2 py-2 text-xs">
                {q.status === "indexing" ? (
                  <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin text-[var(--ws-primary)]" />
                ) : (
                  documentTypeIcon(q.name)
                )}
                <span className="flex-1 truncate text-[var(--ws-text-secondary)]">{q.name}</span>
                <span
                  className="text-[10px] font-medium"
                  style={{ color: q.status === "failed" ? "var(--ws-danger)" : "var(--ws-primary)" }}
                >
                  {q.status === "indexing" ? "Indexing…" : q.status === "success" ? "Parsed Successfully" : q.detail}
                </span>
              </li>
            ))}
          </ul>
        )}

        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search documents…"
          className="w-full border-0 border-b border-gray-200 bg-transparent px-0 py-1.5 text-xs text-[var(--ws-text)] placeholder:text-[var(--ws-text-muted)] focus:border-[var(--ws-primary)] focus:outline-none"
        />

        {documentInventoryLoading && documentInventory.length === 0 ? (
          <div className="flex items-center gap-2 py-6 text-xs text-[var(--ws-text-muted)]">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading inventory…
          </div>
        ) : (
          <div className="overflow-x-auto">
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
                    <td colSpan={7} className="py-6 text-center text-[var(--ws-text-muted)]">
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
                      <td className="tabular-nums font-medium text-[var(--ws-text)]">{row.chunks}</td>
                      <td className="tabular-nums">{row.embedding_dimensions} dim</td>
                      <td className="text-[var(--ws-primary)]">{row.indexation_state}</td>
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
                          className="rounded-sm p-1 hover:text-[var(--ws-danger)]"
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

      {selected && (
        <aside className="w-72 shrink-0 overflow-y-auto border-l border-gray-200 bg-gray-50 p-4 fluent-scrollbar">
          <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-[var(--ws-text-muted)]">
            Document Inspector
          </h2>
          <dl className="space-y-3 text-[11px]">
            <div>
              <dt className="font-semibold uppercase tracking-wider text-[var(--ws-text-muted)]">File</dt>
              <dd className="mt-1 flex items-center gap-1.5 text-[var(--ws-text-secondary)]">
                {documentTypeIcon(selected.filename, selected.type)}
                <span>{selected.filename}</span>
              </dd>
            </div>
            <div>
              <dt className="font-semibold uppercase tracking-wider text-[var(--ws-text-muted)]">Chunks</dt>
              <dd className="mt-1 text-[var(--ws-text)]">{selected.chunks}</dd>
            </div>
            <div>
              <dt className="font-semibold uppercase tracking-wider text-[var(--ws-text-muted)]">Embedding</dt>
              <dd className="mt-1 text-[var(--ws-text-secondary)]">
                {selected.embedding_model} · {selected.embedding_dimensions}d
              </dd>
            </div>
            <div>
              <dt className="font-semibold uppercase tracking-wider text-[var(--ws-text-muted)]">Index health</dt>
              <dd className="mt-1 text-[var(--ws-text)]">{selected.indexation_state}</dd>
            </div>
            <div>
              <dt className="font-semibold uppercase tracking-wider text-[var(--ws-text-muted)]">Path</dt>
              <dd className="mt-1 break-all text-[var(--ws-text-secondary)]">{selected.path}</dd>
            </div>
          </dl>
        </aside>
      )}
    </div>
  )
}
