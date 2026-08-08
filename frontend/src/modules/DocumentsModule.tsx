import { useRef, useState, useEffect } from "react"
import { AlertCircle, Clock, Database, FileCode, Files, FileSpreadsheet, FileText, HardDrive, Loader2, MoreVertical, Search, UploadCloud } from "lucide-react"

import { deleteDocument } from "@/api/client"
import { useWorkstation } from "@/context/WorkstationContext"
import { Panel } from "@/components/workstation/overview/primitives"
import type { DocumentInventoryRow } from "@/types/workstation"

const ALLOWED = [".txt", ".md", ".pdf", ".docx", ".xlsx", ".csv"]

function documentTypeIcon(filename: string, type?: string) {
  const ext = (type || filename.split(".").pop() || "").toLowerCase()
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

function formatTimestamp(isoString: string) {
  const d = new Date(isoString);
  const now = new Date();
  const diffMin = Math.round((now.getTime() - d.getTime()) / 60000);
  if (diffMin < 1) return "Just now";
  if (diffMin < 60) return `${diffMin} min ago`;
  if (diffMin < 1440) return `${Math.round(diffMin / 60)} hours ago`;
  
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function ActionMenu({ row, refreshDocumentInventory }: { row: DocumentInventoryRow, refreshDocumentInventory: () => void }) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [open]);

  return (
    <div className="relative inline-block text-left" ref={menuRef}>
      <button 
        onClick={(e) => {
          e.stopPropagation();
          setOpen(!open);
        }}
        className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-white/70 hover:text-slate-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--vv-accent-ring)]"
      >
        <MoreVertical className="h-4 w-4" />
      </button>

      {open && (
        <div className="absolute right-0 z-50 mt-1.5 w-44 rounded-2xl border border-white/70 bg-white/85 py-1.5 text-left shadow-[0_12px_34px_rgba(16,32,64,0.14)] backdrop-blur-xl">
          <button className="w-full px-4 py-2 text-left text-[11.5px] font-medium text-slate-600 transition-colors hover:bg-white/70 hover:text-slate-800">
            View Chunks
          </button>
          <button className="w-full px-4 py-2 text-left text-[11.5px] font-medium text-slate-600 transition-colors hover:bg-white/70 hover:text-slate-800">
            Re-index
          </button>
          <div className="mx-3 my-1 h-px bg-white/70" />
          <button 
            onClick={async (e) => {
              e.stopPropagation();
              try {
                await deleteDocument(row.filename);
                await refreshDocumentInventory();
              } catch (err) {}
              setOpen(false);
            }}
            className="w-full px-4 py-2 text-left text-[11.5px] font-medium text-rose-600 transition-colors hover:bg-rose-50/80"
          >
            Delete Document
          </button>
        </div>
      )}
    </div>
  )
}

function Dropzone({ 
  handleFiles, 
  inputRef, 
  dragOver, 
  setDragOver 
}: { 
  handleFiles: (files: File[]) => void, 
  inputRef: React.RefObject<HTMLInputElement | null>,
  dragOver: boolean,
  setDragOver: (val: boolean) => void
}) {
  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
      onDragLeave={() => setDragOver(false)}
      onDrop={(e) => { e.preventDefault(); setDragOver(false); handleFiles(Array.from(e.dataTransfer.files)) }}
      onClick={() => inputRef.current?.click()}
      className={`group flex cursor-pointer items-center justify-center gap-4 rounded-3xl border border-dashed px-6 py-5 backdrop-blur-xl transition-all duration-300 ${
        dragOver
          ? "border-[var(--vv-accent)] bg-[var(--vv-accent-tint)] shadow-[0_10px_28px_rgba(37,99,235,0.12)]"
          : "border-[#b6c6e0] bg-white/45 hover:border-[var(--vv-accent)] hover:bg-white/65"
      }`}
    >
      <input
        ref={inputRef}
        type="file"
        multiple
        accept={ALLOWED.join(",")}
        className="hidden"
        onChange={(e) => { handleFiles(Array.from(e.target.files || [])) }}
      />
      <span className={`vv-plate h-11 w-11 transition-transform duration-300 ${dragOver ? "scale-105" : "group-hover:scale-105"}`}>
        <UploadCloud className="h-[20px] w-[20px]" strokeWidth={1.9} />
      </span>
      <div className="flex min-w-0 flex-col">
        <p className="text-[13px] font-semibold text-slate-700">Drag and drop enterprise documents or click to browse</p>
        <p className="vv-caption mt-0.5">Supports PDF, DOCX, TXT, MD (Max 50MB per file)</p>
      </div>
    </div>
  );
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
  const [filterMode, setFilterMode] = useState("All Documents")
  const [dragOver, setDragOver] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  let filtered = documentInventory.filter((r) =>
    r.filename.toLowerCase().includes(search.toLowerCase()),
  )
  
  if (filterMode === "Indexed") {
    filtered = filtered.filter(r => !r.indexation_state.toLowerCase().includes("process") && !r.indexation_state.toLowerCase().includes("fail"))
  } else if (filterMode === "Processing") {
    filtered = filtered.filter(r => r.indexation_state.toLowerCase().includes("process"))
  } else if (filterMode === "Failed") {
    filtered = filtered.filter(r => r.indexation_state.toLowerCase().includes("fail"))
  }

  const handleFiles = (files: File[]) => {
    if (inputRef.current) inputRef.current.value = ""
    uploadFiles(files)
  }

  const isEmpty = documentInventory.length === 0 && uploadQueue.length === 0 && !documentInventoryLoading;

  return (
    <div className="flex h-full min-h-0 w-full flex-col overflow-hidden p-4 sm:p-5 lg:p-6">
      <div className="mx-auto flex h-full min-h-0 w-full max-w-[1680px] flex-col gap-5">
        <header className="flex flex-none items-center gap-2.5">
          <span className="vv-plate h-8 w-8">
            <Files className="h-[16px] w-[16px]" strokeWidth={1.9} />
          </span>
          <div className="min-w-0">
            <h1 className="vv-title-section">Document Management</h1>
            <p className="vv-caption mt-0.5">
              Upload, process, and manage enterprise documents for SQLite vector index pipeline.
            </p>
          </div>
        </header>

        {documentInventoryError && (
          <div className="flex flex-none items-center gap-2 rounded-2xl border border-rose-200/70 bg-rose-50/70 px-4 py-3 text-[12.5px] text-rose-700 shadow-[0_1px_2px_rgba(16,32,64,0.04)] backdrop-blur-sm">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span className="flex-1 font-medium">{documentInventoryError}</span>
            <button
              type="button"
              onClick={() => refreshDocumentInventory()}
              className="text-[11.5px] font-semibold underline underline-offset-2 transition-colors hover:text-rose-800"
            >
              Retry
            </button>
          </div>
        )}

        {isEmpty ? (
          <div className="flex flex-1 flex-col items-center justify-center">
            <div className="w-full max-w-2xl">
              <Dropzone handleFiles={handleFiles} inputRef={inputRef} dragOver={dragOver} setDragOver={setDragOver} />
            </div>
          </div>
        ) : (
          <div className="flex min-h-0 flex-1 flex-col gap-5">
            <div className="flex-none">
              <Dropzone handleFiles={handleFiles} inputRef={inputRef} dragOver={dragOver} setDragOver={setDragOver} />
            </div>

            {uploadQueue.length > 0 && (
              <Panel className="flex-none overflow-hidden p-0" delay={70}>
                <div className="border-b border-white/60 px-5 py-3">
                  <h2 className="vv-eyebrow">Active Processing Queue</h2>
                </div>
                <ul className="divide-y divide-white/50">
                  {uploadQueue.map((q) => (
                    <li key={q.name} className="flex items-center gap-3 px-5 py-2.5 text-[12.5px]">
                      {q.status === "indexing" ? (
                        <Loader2 className="h-4 w-4 shrink-0 animate-spin text-[#2563eb]" />
                      ) : (
                        documentTypeIcon(q.name)
                      )}
                      <span className="flex-1 truncate font-medium text-slate-700">{q.name}</span>
                      <span
                        className="rounded-full border px-2.5 py-0.5 text-[10.5px] font-semibold"
                        style={{ 
                          backgroundColor: q.status === "failed" ? "rgb(255 241 242)" : "rgba(255,255,255,0.7)",
                          borderColor: q.status === "failed" ? "rgb(254 205 211)" : "rgba(255,255,255,0.85)",
                          color: q.status === "failed" ? "rgb(190 18 60)" : "rgb(100 116 139)" 
                        }}
                      >
                        {q.status === "indexing" ? "PROCESSING" : q.status === "success" ? "INDEXED" : q.detail}
                      </span>
                    </li>
                  ))}
                </ul>
              </Panel>
            )}

            <Panel className="flex min-h-0 flex-1 flex-col overflow-hidden p-0" delay={140}>
              <div className="flex flex-none flex-wrap items-center justify-between gap-3 border-b border-white/60 px-5 py-3">
                <div className="inline-flex items-center gap-1 rounded-full border border-white/70 bg-white/45 p-1 shadow-[inset_0_1px_0_rgba(255,255,255,0.8)]">
                  {["All Documents", "Indexed", "Processing", "Failed"].map((pill) => (
                    <button
                      key={pill}
                      onClick={() => setFilterMode(pill)}
                      className={`rounded-full px-3 py-1 text-[11.5px] font-medium transition-all duration-200 ${
                        filterMode === pill 
                          ? "bg-white text-[var(--vv-accent-deep)] shadow-[0_1px_2px_rgba(16,32,64,0.08)]" 
                          : "text-slate-500 hover:text-slate-700"
                      }`}
                    >
                      {pill}
                    </button>
                  ))}
                </div>
                <div className="ws-input-bar flex w-full items-center gap-2 sm:w-64">
                  <Search className="h-3.5 w-3.5 shrink-0 text-slate-400" strokeWidth={1.9} />
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search documents..."
                    className="min-w-0 flex-1 border-0 bg-transparent p-0 text-[12.5px] font-medium text-slate-700 placeholder:font-normal placeholder:text-slate-400 focus:outline-none"
                  />
                </div>
              </div>

              <div className="min-h-0 flex-1 overflow-auto">
                {documentInventoryLoading && documentInventory.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-14 text-slate-400">
                    <Loader2 className="mb-3 h-6 w-6 animate-spin text-slate-300" />
                    <p className="text-[12.5px] font-medium text-slate-500">Loading documents...</p>
                  </div>
                ) : (
                  <table className="w-full border-collapse whitespace-nowrap text-left">
                    <thead className="sticky top-0 z-10 bg-white/55 backdrop-blur-md">
                      <tr>
                        <th className="border-b border-white/60 px-5 py-2.5 text-[10.5px] font-semibold uppercase tracking-[0.09em] text-slate-400">Filename</th>
                        <th className="border-b border-white/60 px-5 py-2.5 text-[10.5px] font-semibold uppercase tracking-[0.09em] text-slate-400">Status</th>
                        <th className="border-b border-white/60 px-5 py-2.5 text-[10.5px] font-semibold uppercase tracking-[0.09em] text-slate-400">Chunks</th>
                        <th className="border-b border-white/60 px-5 py-2.5 text-[10.5px] font-semibold uppercase tracking-[0.09em] text-slate-400">Ingestion Date</th>
                        <th className="border-b border-white/60 px-5 py-2.5 text-right text-[10.5px] font-semibold uppercase tracking-[0.09em] text-slate-400">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filtered.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="py-14 text-center">
                            <div className="flex flex-col items-center justify-center text-slate-400">
                              <span className="vv-plate mb-3 h-11 w-11" style={{ color: "#94a3b8", background: "rgba(148,163,184,0.12)", boxShadow: "inset 0 0 0 1px rgba(148,163,184,0.2)" }}>
                                <HardDrive className="h-5 w-5" strokeWidth={1.7} />
                              </span>
                              <p className="text-[12.5px] font-medium text-slate-500">No documents found matching criteria.</p>
                            </div>
                          </td>
                        </tr>
                      ) : (
                        filtered.map((row) => (
                          <tr key={row.filename} className="group border-b border-white/45 transition-colors duration-200 hover:bg-white/55">
                            <td className="px-5 py-2.5">
                              <div className="flex items-center gap-3">
                                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[10px] border border-white/80 bg-white/80 shadow-[0_1px_2px_rgba(16,32,64,0.05)]">
                                  {documentTypeIcon(row.filename, row.type)}
                                </span>
                                <div className="flex min-w-0 flex-col">
                                  <span className="truncate text-[12.5px] font-semibold text-slate-700">{row.filename}</span>
                                  <span className="text-[10.5px] font-medium text-slate-400">{(row.chunks * 0.12 + 0.5).toFixed(1)} MB</span>
                                </div>
                              </div>
                            </td>
                            <td className="px-5 py-2.5">
                              {row.indexation_state.toLowerCase().includes("process") ? (
                                <span className="inline-flex items-center gap-1.5 rounded-full border border-white/80 bg-white/70 px-2.5 py-0.5 text-[10.5px] font-semibold text-slate-500">
                                  <span className="relative flex h-1.5 w-1.5">
                                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-slate-400 opacity-75"></span>
                                    <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-slate-500"></span>
                                  </span>
                                  PROCESSING
                                </span>
                              ) : row.indexation_state.toLowerCase().includes("fail") ? (
                                <span className="inline-flex items-center rounded-full border border-rose-200/70 bg-rose-50/80 px-2.5 py-0.5 text-[10.5px] font-semibold text-rose-600">
                                  FAILED
                                </span>
                              ) : (
                                <span
                                  className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-[10.5px] font-semibold"
                                  style={{ color: "var(--vv-accent-deep)", background: "var(--vv-accent-tint)", borderColor: "var(--vv-accent-ring)" }}
                                >
                                  INDEXED
                                </span>
                              )}
                            </td>
                            <td className="px-5 py-2.5">
                              <span className="inline-flex items-center gap-1.5 rounded-md border border-white/80 bg-white/70 px-2 py-0.5 text-[10.5px] font-medium tabular-nums text-slate-500 shadow-[0_1px_2px_rgba(16,32,64,0.04)]">
                                <Database className="h-3 w-3 text-[#2563eb]" strokeWidth={2} />
                                {row.chunks} chunks
                              </span>
                            </td>
                            <td className="px-5 py-2.5">
                              <span className="inline-flex items-center gap-1.5 text-[11px] font-medium tabular-nums text-slate-400">
                                <Clock className="h-3 w-3 text-slate-300" strokeWidth={2} />
                                {row.last_updated ? formatTimestamp(row.last_updated) : "Just now"}
                              </span>
                            </td>
                            <td className="px-5 py-2.5 text-right">
                              <ActionMenu row={row} refreshDocumentInventory={refreshDocumentInventory} />
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                )}
              </div>
            </Panel>
          </div>
        )}
      </div>
    </div>
  )
}
