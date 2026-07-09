import { useRef, useState } from "react"

import { AlertCircle, Loader2, Trash2, Upload } from "lucide-react"

import { deleteDocument } from "@/api/client"

import { useWorkstation } from "@/context/WorkstationContext"

import type { DocumentInventoryRow } from "@/types/workstation"



const ALLOWED = [".txt", ".md", ".pdf", ".docx"]



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

    r.filename.toLowerCase().includes(search.toLowerCase())

  )



  const handleFiles = (files: File[]) => {

    if (inputRef.current) inputRef.current.value = ""

    uploadFiles(files)

  }



  return (

    <div className="flex-1 min-h-0 flex overflow-hidden">

      <div className="flex-1 overflow-y-auto fluent-scrollbar p-6 space-y-4">

        <header>

          <h1 className="text-[18px] font-semibold">Documents</h1>

          <p className="text-[12px] text-[var(--ws-text-secondary)]">

            Asset ingestion, vectorization, and index management

          </p>

        </header>



        {documentInventoryError && (

          <div

            className="flex items-center gap-2 text-[12px] px-3 py-2 rounded-md border"

            style={{ color: "var(--ws-danger)", borderColor: "rgba(209,52,56,0.25)", background: "rgba(209,52,56,0.06)" }}

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

          onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}

          onDragLeave={() => setDragOver(false)}

          onDrop={(e) => {
            e.preventDefault()
            setDragOver(false)
            handleFiles(Array.from(e.dataTransfer.files))
          }}

          onClick={() => inputRef.current?.click()}

          className={`rounded-md border-2 border-dashed p-8 text-center cursor-pointer fluent-transition ${

            dragOver ? "border-[var(--ws-primary)] bg-[rgba(0,120,212,0.04)]" : "border-[var(--ws-border)]"

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

          <Upload className="h-5 w-5 mx-auto mb-2" style={{ color: "var(--ws-primary)" }} />

          <p className="text-[13px] font-medium">Import Documents (.txt, .md, .pdf, .docx)</p>

          <p className="text-[11px] text-[var(--ws-text-secondary)] mt-1">

            {dragOver ? "Release to index" : "Drag and drop or click to browse — uploads continue in background"}

          </p>

        </div>



        {uploadQueue.length > 0 && (

          <ul className="space-y-1">

            {uploadQueue.map((q) => (

              <li key={q.name} className="flex items-center gap-2 text-[12px] ws-card px-3 py-2">

                {q.status === "indexing" && <Loader2 className="h-3.5 w-3.5 animate-spin" />}

                <span className="flex-1 truncate">{q.name}</span>

                <span style={{ color: q.status === "failed" ? "var(--ws-danger)" : "var(--ws-success)" }}>

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

          className="ws-input-bar w-full px-3 py-2 text-[13px] focus:outline-none"

        />



        {documentInventoryLoading && documentInventory.length === 0 ? (

          <div className="flex items-center gap-2 text-[12px] text-[var(--ws-text-secondary)] py-8 justify-center">

            <Loader2 className="h-4 w-4 animate-spin" />

            Loading inventory…

          </div>

        ) : (

          <div className="ws-card overflow-x-auto">

            <table className="w-full text-[12px]">

              <thead>

                <tr className="border-b text-left text-[var(--ws-text-secondary)]" style={{ borderColor: "var(--ws-border)" }}>

                  {["Filename", "Type", "Chunks", "Vector Matrix", "State", "Updated", "Actions"].map((h) => (

                    <th key={h} className="px-3 py-2 font-semibold">{h}</th>

                  ))}

                </tr>

              </thead>

              <tbody>

                {filtered.length === 0 ? (

                  <tr>

                    <td colSpan={7} className="px-3 py-8 text-center text-[var(--ws-text-secondary)]">

                      No documents indexed yet

                    </td>

                  </tr>

                ) : (

                  filtered.map((row) => (

                    <tr

                      key={row.filename}

                      className="border-b hover:bg-[rgba(0,0,0,0.02)] cursor-pointer"

                      style={{ borderColor: "var(--ws-border)" }}

                      onClick={() => setSelected(row)}

                    >

                      <td className="px-3 py-2 max-w-[200px] truncate">{row.filename}</td>

                      <td className="px-3 py-2">{row.type}</td>

                      <td className="px-3 py-2">{row.chunks}</td>

                      <td className="px-3 py-2">{row.embedding_dimensions} dim</td>

                      <td className="px-3 py-2">{row.indexation_state}</td>

                      <td className="px-3 py-2 text-[var(--ws-text-secondary)]">

                        {row.last_updated ? new Date(row.last_updated).toLocaleDateString() : "—"}

                      </td>

                      <td className="px-3 py-2">

                        <button

                          type="button"

                          onClick={async (e) => {

                            e.stopPropagation()

                            try {

                              await deleteDocument(row.filename)

                              if (selected?.filename === row.filename) setSelected(null)

                              await refreshDocumentInventory()

                            } catch {

                              // refreshDocumentInventory surfaces errors via context alerts

                            }

                          }}

                          className="p-1 rounded hover:text-[var(--ws-danger)]"

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

        <aside className="w-72 shrink-0 border-l p-4 overflow-y-auto fluent-scrollbar" style={{ borderColor: "var(--ws-border)" }}>

          <h2 className="text-[12px] font-semibold mb-3">Document Inspector</h2>

          <dl className="text-[11px] space-y-2 text-[var(--ws-text-secondary)]">

            <div><dt className="font-medium text-[var(--ws-text)]">File</dt><dd>{selected.filename}</dd></div>

            <div><dt className="font-medium text-[var(--ws-text)]">Chunks</dt><dd>{selected.chunks}</dd></div>

            <div><dt className="font-medium text-[var(--ws-text)]">Embedding</dt><dd>{selected.embedding_model} · {selected.embedding_dimensions}d</dd></div>

            <div><dt className="font-medium text-[var(--ws-text)]">Index health</dt><dd>{selected.indexation_state}</dd></div>

            <div><dt className="font-medium text-[var(--ws-text)]">Path</dt><dd className="break-all">{selected.path}</dd></div>

          </dl>

        </aside>

      )}

    </div>

  )

}
