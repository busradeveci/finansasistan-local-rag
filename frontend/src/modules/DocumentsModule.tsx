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

    return <Table2 className="h-3.5 w-3.5 shrink-0 text-[var(--ws-teal)]" strokeWidth={1.75} />

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

    <div className="flex h-full min-h-0 flex-1 overflow-hidden bg-[var(--ws-canvas)]">

      <div className="flex min-h-0 flex-1 flex-col space-y-2.5 overflow-y-auto fluent-scrollbar ws-module-shell">

        <header>

          <h1 className="text-page-title text-white">Documents</h1>

          <p className="text-xs font-medium text-[var(--ws-text-muted)]">

            Asset ingestion, vectorization, and index management

          </p>

        </header>



        {documentInventoryError && (

          <div

            className="flex items-center gap-2 rounded-lg border border-solid px-2.5 py-1.5 text-xs"

            style={{

              color: "var(--ws-danger)",

              borderColor: "rgba(239, 68, 68, 0.25)",

              background: "rgba(239, 68, 68, 0.08)",

            }}

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

          className={`cursor-pointer rounded-xl border-2 border-dashed p-5 text-center transition-colors ${

            dragOver

              ? "border-[var(--ws-primary)] bg-[rgba(16,185,129,0.06)]"

              : "border-[var(--ws-card-border)] bg-[var(--ws-card-bg)]"

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

          <Upload className="mx-auto mb-2 h-5 w-5 text-[var(--ws-primary)]" />

          <p className="text-sm font-medium text-white">

            Import Documents (.txt, .md, .pdf, .docx, .xlsx, .csv)

          </p>

          <p className="mt-0.5 text-[11px] font-medium text-[var(--ws-text-muted)]">

            {dragOver ? "Release to index" : "Drag and drop or click to browse — uploads continue in background"}

          </p>

        </div>



        {uploadQueue.length > 0 && (

          <ul className="space-y-1">

            {uploadQueue.map((q) => (

              <li key={q.name} className="ws-card flex items-center gap-2 px-2.5 py-1.5 text-xs">

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

          className="ws-input-bar w-full px-2.5 py-1.5 text-xs text-white placeholder:text-[var(--ws-text-muted)] focus:outline-none"

        />



        {documentInventoryLoading && documentInventory.length === 0 ? (

          <div className="flex items-center justify-center gap-2 py-6 text-xs text-[var(--ws-text-muted)]">

            <Loader2 className="h-4 w-4 animate-spin" />

            Loading inventory…

          </div>

        ) : (

          <div className="ws-card overflow-x-auto">

            <table className="w-full text-xs">

              <thead>

                <tr className="border-b border-[var(--ws-card-border)] text-left text-[var(--ws-text-muted)]">

                  {["Filename", "Type", "Chunks", "Vector Matrix", "State", "Updated", "Actions"].map((h) => (

                    <th key={h} className="px-2.5 py-1.5 font-semibold">

                      {h}

                    </th>

                  ))}

                </tr>

              </thead>

              <tbody>

                {filtered.length === 0 ? (

                  <tr>

                    <td colSpan={7} className="px-2.5 py-6 text-center text-[var(--ws-text-muted)]">

                      No documents indexed yet

                    </td>

                  </tr>

                ) : (

                  filtered.map((row) => (

                    <tr

                      key={row.filename}

                      className="ws-row-interactive cursor-pointer border-b border-[var(--ws-card-border)]"

                      onClick={() => setSelected(row)}

                    >

                      <td className="max-w-[200px] px-2.5 py-1.5">

                        <span className="flex min-w-0 items-center gap-1.5">

                          {documentTypeIcon(row.filename, row.type)}

                          <span className="truncate text-[var(--ws-text-secondary)]">{row.filename}</span>

                        </span>

                      </td>

                      <td className="px-2.5 py-1.5 text-[var(--ws-text-muted)]">{row.type}</td>

                      <td className="px-2.5 py-1.5 tabular-nums text-white">{row.chunks}</td>

                      <td className="px-2.5 py-1.5 tabular-nums text-[var(--ws-text-muted)]">

                        {row.embedding_dimensions} dim

                      </td>

                      <td className="px-2.5 py-1.5 text-[var(--ws-primary)]">{row.indexation_state}</td>

                      <td className="px-2.5 py-1.5 text-[var(--ws-text-muted)]">

                        {row.last_updated ? new Date(row.last_updated).toLocaleDateString() : "—"}

                      </td>

                      <td className="px-2.5 py-1.5">

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

                          className="rounded p-1 hover:text-[var(--ws-danger)]"

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

        <aside className="w-72 shrink-0 overflow-y-auto border-l border-[var(--ws-card-border)] bg-[var(--ws-card-bg)] p-4 fluent-scrollbar">

          <h2 className="mb-2 text-xs font-semibold text-white">Document Inspector</h2>

          <dl className="space-y-1.5 text-[11px] text-[var(--ws-text-muted)]">

            <div>

              <dt className="font-medium text-white">File</dt>

              <dd className="mt-0.5 flex items-center gap-1.5">

                {documentTypeIcon(selected.filename, selected.type)}

                <span className="text-[var(--ws-text-secondary)]">{selected.filename}</span>

              </dd>

            </div>

            <div>

              <dt className="font-medium text-white">Chunks</dt>

              <dd>{selected.chunks}</dd>

            </div>

            <div>

              <dt className="font-medium text-white">Embedding</dt>

              <dd>

                {selected.embedding_model} · {selected.embedding_dimensions}d

              </dd>

            </div>

            <div>

              <dt className="font-medium text-white">Index health</dt>

              <dd>{selected.indexation_state}</dd>

            </div>

            <div>

              <dt className="font-medium text-white">Path</dt>

              <dd className="break-all">{selected.path}</dd>

            </div>

          </dl>

        </aside>

      )}

    </div>

  )

}


