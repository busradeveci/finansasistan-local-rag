import { useRef, useState, useEffect } from "react"
import { AlertCircle, FileSpreadsheet, FileText, Loader2, Trash2, UploadCloud, Search, MoreVertical, FileCode, Database, HardDrive } from "lucide-react"

import { deleteDocument } from "@/api/client"
import { useWorkstation } from "@/context/WorkstationContext"
import type { DocumentInventoryRow } from "@/types/workstation"

const ALLOWED = [".txt", ".md", ".pdf", ".docx", ".xlsx", ".csv"]

function documentTypeIcon(filename: string, type?: string) {
  const ext = (type || filename.split(".").pop() || "").toLowerCase()
  if (ext === "xlsx" || ext === "csv") {
    return <FileSpreadsheet className="h-4 w-4 shrink-0 text-emerald-600" strokeWidth={2} />
  }
  if (ext === "md" || ext === "txt") {
    return <FileCode className="h-4 w-4 shrink-0 text-amber-600" strokeWidth={2} />
  }
  return <FileText className="h-4 w-4 shrink-0 text-blue-600" strokeWidth={2} />
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
        className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 transition-colors focus:outline-none focus:ring-2 focus:ring-[#007FFF]/30"
      >
        <MoreVertical className="h-4 w-4" />
      </button>

      {open && (
        <div className="absolute right-0 mt-1 w-40 rounded-xl bg-white/95 backdrop-blur-md shadow-lg border border-slate-200/70 z-50 py-1 text-left">
          <button className="w-full text-left px-4 py-2 text-[11px] font-medium text-slate-700 hover:bg-slate-50 transition-colors">
            View Chunks
          </button>
          <button className="w-full text-left px-4 py-2 text-[11px] font-medium text-slate-700 hover:bg-slate-50 transition-colors">
            Re-index
          </button>
          <div className="h-px bg-slate-100 my-1 mx-2" />
          <button 
            onClick={async (e) => {
              e.stopPropagation();
              try {
                await deleteDocument(row.filename);
                await refreshDocumentInventory();
              } catch (err) {}
              setOpen(false);
            }}
            className="w-full text-left px-4 py-2 text-[11px] font-medium text-rose-600 hover:bg-rose-50 transition-colors"
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
      className={`bg-white/50 backdrop-blur-md border-2 border-dashed transition-all rounded-2xl p-6 flex flex-col items-center justify-center cursor-pointer ${
        dragOver ? "border-[#007FFF] bg-white/70" : "border-blue-200/80 hover:border-[#007FFF] hover:bg-white/70"
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
      <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-2 shadow-sm">
        <UploadCloud className="h-5 w-5" />
      </div>
      <p className="text-xs font-semibold text-slate-700">Drag and drop enterprise documents or click to browse</p>
      <p className="mt-1 text-[11px] text-slate-400">Supports PDF, DOCX, TXT, MD (Max 50MB per file)</p>
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
    <div className="flex h-full min-h-0 flex-1 flex-col gap-6 overflow-hidden p-4 sm:p-6 lg:p-8 bg-slate-50/30">
      <header className="flex-none">
        <h1 className="text-xl font-bold text-slate-800 tracking-tight">Document Management</h1>
        <p className="mt-1 text-[11px] font-medium text-slate-500">
          Upload, process, and manage enterprise documents for SQLite vector index pipeline.
        </p>
      </header>

      {documentInventoryError && (
        <div className="flex items-center gap-2 rounded-xl border border-red-200/70 bg-red-50/70 px-4 py-3 text-xs text-red-700 backdrop-blur-sm shadow-sm flex-none">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span className="flex-1 font-medium">{documentInventoryError}</span>
          <button
            type="button"
            onClick={() => refreshDocumentInventory()}
            className="text-[11px] font-bold underline underline-offset-2 hover:text-red-800 transition-colors"
          >
            Retry
          </button>
        </div>
      )}

      {isEmpty ? (
        <div className="flex-1 flex flex-col items-center justify-center">
          <div className="w-full max-w-2xl">
            <Dropzone handleFiles={handleFiles} inputRef={inputRef} dragOver={dragOver} setDragOver={setDragOver} />
          </div>
        </div>
      ) : (
        <div className="flex flex-col min-h-0 flex-1 gap-6">
          <div className="flex-none">
            <Dropzone handleFiles={handleFiles} inputRef={inputRef} dragOver={dragOver} setDragOver={setDragOver} />
          </div>

          {uploadQueue.length > 0 && (
            <div className="bg-white/60 backdrop-blur-md border border-white/80 shadow-sm rounded-2xl overflow-hidden flex-none">
              <div className="px-4 py-2.5 bg-blue-50/50 border-b border-blue-100/50">
                <h2 className="text-[11px] font-bold text-blue-800 uppercase tracking-wider">Active Processing Queue</h2>
              </div>
              <ul className="divide-y divide-slate-100/70">
                {uploadQueue.map((q) => (
                  <li key={q.name} className="flex items-center gap-3 px-4 py-2.5 text-xs">
                    {q.status === "indexing" ? (
                      <Loader2 className="h-4 w-4 shrink-0 animate-spin text-blue-600" />
                    ) : (
                      documentTypeIcon(q.name)
                    )}
                    <span className="flex-1 font-medium text-slate-700 truncate">{q.name}</span>
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border`}
                      style={{ 
                        backgroundColor: q.status === "failed" ? "rgb(255 241 242)" : "rgb(239 246 255)",
                        borderColor: q.status === "failed" ? "rgb(254 205 211)" : "rgb(191 219 254)",
                        color: q.status === "failed" ? "rgb(190 18 60)" : "rgb(29 78 216)" 
                      }}
                    >
                      {q.status === "indexing" ? "PROCESSING" : q.status === "success" ? "INDEXED" : q.detail}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="bg-white/60 backdrop-blur-md border border-white/80 shadow-sm rounded-2xl overflow-hidden flex flex-col min-h-0 flex-1">
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100/70 bg-white/40 flex-wrap gap-3">
              <div className="flex items-center gap-2">
                {["All Documents", "Indexed", "Processing", "Failed"].map((pill) => (
                  <button
                    key={pill}
                    onClick={() => setFilterMode(pill)}
                    className={`px-3 py-1 rounded-full text-[11px] font-semibold transition-colors ${
                      filterMode === pill 
                        ? "bg-[#007FFF] text-white shadow-sm" 
                        : "bg-white/60 text-slate-600 hover:bg-white/80 border border-slate-200/60"
                    }`}
                  >
                    {pill}
                  </button>
                ))}
              </div>
              <div className="relative">
                <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-slate-400" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search documents..."
                  className="pl-8 text-xs placeholder:text-slate-400 bg-white/70 border border-slate-200/80 rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-[#007FFF]/30 focus:outline-none transition-all w-64 shadow-sm"
                />
              </div>
            </div>

            <div className="overflow-auto min-h-0 flex-1">
              {documentInventoryLoading && documentInventory.length === 0 ? (
                <div className="py-12 flex flex-col items-center justify-center text-slate-400">
                  <Loader2 className="h-6 w-6 mb-3 text-slate-300 animate-spin" />
                  <p className="text-xs font-medium text-slate-500">Loading documents...</p>
                </div>
              ) : (
                <table className="w-full text-left border-collapse whitespace-nowrap">
                  <thead className="bg-slate-50/50 backdrop-blur-sm sticky top-0 z-10">
                    <tr>
                      <th className="px-4 py-2.5 text-[11px] font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-200/60">Filename</th>
                      <th className="px-4 py-2.5 text-[11px] font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-200/60">Status</th>
                      <th className="px-4 py-2.5 text-[11px] font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-200/60">Chunks</th>
                      <th className="px-4 py-2.5 text-[11px] font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-200/60">Ingestion Date</th>
                      <th className="px-4 py-2.5 text-[11px] font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-200/60 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-12 text-center">
                          <div className="flex flex-col items-center justify-center text-slate-400">
                            <HardDrive className="h-8 w-8 mb-3 text-slate-300" strokeWidth={1.5} />
                            <p className="text-xs font-medium text-slate-500">No documents found matching criteria.</p>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      filtered.map((row) => (
                        <tr key={row.filename} className="h-11 border-b border-slate-100/70 hover:bg-white/50 transition-colors group">
                          <td className="px-4 py-2">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-lg bg-white border border-slate-100 shadow-sm flex items-center justify-center shrink-0">
                                {documentTypeIcon(row.filename, row.type)}
                              </div>
                              <div className="flex flex-col min-w-0">
                                <span className="text-xs font-semibold text-slate-700 truncate">{row.filename}</span>
                                <span className="text-[10px] text-slate-400">{(row.chunks * 0.12 + 0.5).toFixed(1)} MB</span>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-2">
                            {row.indexation_state.toLowerCase().includes("process") ? (
                              <span className="inline-flex items-center gap-1.5 bg-blue-50 text-blue-700 border border-blue-200/60 text-[10px] font-bold px-2.5 py-0.5 rounded-full">
                                <span className="relative flex h-1.5 w-1.5">
                                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-blue-500"></span>
                                </span>
                                PROCESSING
                              </span>
                            ) : row.indexation_state.toLowerCase().includes("fail") ? (
                              <span className="inline-flex items-center bg-rose-50 text-rose-700 border border-rose-200/60 text-[10px] font-bold px-2.5 py-0.5 rounded-full">
                                FAILED
                              </span>
                            ) : (
                              <span className="inline-flex items-center bg-emerald-50 text-emerald-700 border border-emerald-200/60 text-[10px] font-bold px-2.5 py-0.5 rounded-full">
                                INDEXED
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-2">
                            <span className="inline-flex items-center gap-1 bg-slate-100 text-slate-600 border border-slate-200/60 text-[10px] font-medium px-2 py-0.5 rounded-md shadow-sm">
                              <Database className="h-3 w-3 text-slate-400" />
                              {row.chunks} Chunks
                            </span>
                          </td>
                          <td className="px-4 py-2 text-[11px] text-slate-600 font-medium">
                            {row.last_updated ? formatTimestamp(row.last_updated) : "Just now"}
                          </td>
                          <td className="px-4 py-2 text-right">
                            <ActionMenu row={row} refreshDocumentInventory={refreshDocumentInventory} />
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
