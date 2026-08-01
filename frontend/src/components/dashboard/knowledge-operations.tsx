import { useMemo, useState } from "react"
import { FileText, FileSpreadsheet, FileType2, MoreHorizontal, Filter, Search } from "lucide-react"
import { useWorkstation } from "@/context/WorkstationContext"
import type { DocumentInventoryRow, UploadQueueItem } from "@/types/workstation"

type FileKind = "pdf" | "docx" | "xlsx" | "other"
type OpStatus = "Indexed" | "Processing" | "Queued" | "Failed"

type Operation = {
  name: string
  kind: FileKind
  size: string
  chunks: number
  status: OpStatus
  time: string
}

const GLASS_CARD =
  "bg-white/82 backdrop-blur-[14px] backdrop-saturate-[1.08] border border-white/78 shadow-[0_14px_36px_rgba(20,40,70,0.06)] rounded-3xl"

const HYPER_GLASS =
  "bg-white/72 backdrop-blur-sm border border-white/80 shadow-[0_4px_14px_rgba(20,40,70,0.05)] rounded-full hover:bg-white/86 transition-all duration-300"

const kindMeta: Record<FileKind, { icon: React.ComponentType<{ className?: string }>; color: string; label: string }> = {
  pdf: { icon: FileType2, color: "text-red-500", label: "PDF" },
  docx: { icon: FileText, color: "text-slate-800", label: "DOCX" },
  xlsx: { icon: FileSpreadsheet, color: "text-orange-600", label: "XLSX" },
  other: { icon: FileText, color: "text-slate-500", label: "FILE" },
}

const statusMeta: Record<OpStatus, string> = {
  Indexed: "border-orange-200/70 bg-orange-50/80 text-orange-700",
  Processing: "border-slate-200/80 bg-slate-50/90 text-slate-700",
  Queued: "border-amber-200/70 bg-amber-50/80 text-amber-700",
  Failed: "border-red-200/70 bg-red-50/80 text-red-700",
}

function inferKind(filename: string, type?: string): FileKind {
  const ext = (type || filename.split(".").pop() || "").toLowerCase()
  if (ext === "pdf") return "pdf"
  if (ext === "docx" || ext === "doc") return "docx"
  if (ext === "xlsx" || ext === "xls" || ext === "csv") return "xlsx"
  return "other"
}

function mapIndexState(state: string): OpStatus {
  const s = (state || "").toLowerCase()
  if (s.includes("fail")) return "Failed"
  if (s.includes("process") || s.includes("indexing")) return "Processing"
  if (s.includes("queue") || s.includes("pending")) return "Queued"
  return "Indexed"
}

function formatRelativeTime(iso: string | null | undefined): string {
  if (!iso) return "—"
  const then = new Date(iso).getTime()
  if (Number.isNaN(then)) return iso
  const diffMs = Date.now() - then
  const mins = Math.floor(diffMs / 60_000)
  if (mins < 1) return "just now"
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return new Date(iso).toLocaleDateString()
}

function rowFromInventory(doc: DocumentInventoryRow): Operation {
  return {
    name: doc.filename,
    kind: inferKind(doc.filename, doc.type || doc.file_type),
    size: "—",
    chunks: doc.chunks || 0,
    status: mapIndexState(doc.indexation_state),
    time: formatRelativeTime(doc.last_updated),
  }
}

function rowFromUpload(item: UploadQueueItem): Operation {
  const status: OpStatus =
    item.status === "failed" ? "Failed" : item.status === "success" ? "Indexed" : "Processing"
  return {
    name: item.name,
    kind: inferKind(item.name),
    size: "—",
    chunks: 0,
    status,
    time: "now",
  }
}

export function KnowledgeOperations() {
  const { documentInventory, documentInventoryLoading, uploadQueue } = useWorkstation()
  const [filter, setFilter] = useState("")

  const { operations, totalFilteredCount } = useMemo(() => {
    const uploadNames = new Set(uploadQueue.map((q) => q.name))
    const fromInventory = documentInventory
      .filter((d) => !uploadNames.has(d.filename))
      .map(rowFromInventory)
    const fromQueue = uploadQueue.map(rowFromUpload)
    const merged = [...fromQueue, ...fromInventory]

    const q = filter.trim().toLowerCase()
    const filtered = !q ? merged : merged.filter((o) => o.name.toLowerCase().includes(q))

    return {
      operations: filtered.slice(0, 7),
      totalFilteredCount: filtered.length,
    }
  }, [documentInventory, uploadQueue, filter])

  const total = documentInventory.length + uploadQueue.length

  return (
    <section className={`overflow-hidden ${GLASS_CARD}`}>
      <div className="flex items-center justify-between border-b border-white/50 px-4 py-3">
        <div className="flex items-center gap-2">
          <h2 className="text-xs font-semibold text-slate-900">Operations</h2>
          <span className={`${HYPER_GLASS} px-2 py-0.5 font-mono text-[10px] text-slate-600`}>
            {totalFilteredCount} / {total.toLocaleString()}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 h-3 w-3 -translate-y-1/2 text-slate-400" />
            <input
              type="search"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              placeholder="Filter operations…"
              aria-label="Filter documents"
              className={`h-7 w-36 pl-7 pr-3 text-[11px] text-slate-800 placeholder:text-slate-400 focus:outline-none ${HYPER_GLASS}`}
            />
          </div>
          <button
            type="button"
            className={`inline-flex items-center gap-1.5 px-3 py-1 text-[11px] font-medium text-slate-600 ${HYPER_GLASS}`}
          >
            <Filter className="h-3.5 w-3.5 text-slate-500" />
            Filter
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        {documentInventoryLoading && operations.length === 0 ? (
          <p className="px-4 py-6 text-center text-xs text-slate-400">Loading inventory…</p>
        ) : (
          <table className="w-full text-left text-[13px]">
            <thead>
              <tr className="border-b border-white/50 text-[10px] uppercase tracking-wider text-slate-400">
                <th className="px-4 py-2 font-semibold">Document</th>
                <th className="px-3 py-2 font-semibold">Chunks</th>
                <th className="px-3 py-2 font-semibold">Status</th>
                <th className="px-3 py-2 font-semibold">Ingested</th>
                <th className="px-4 py-2" />
              </tr>
            </thead>
            <tbody>
              {operations.length === 0 ? (
                <tr className="bg-transparent">
                  <td colSpan={5} className="px-4 py-6 text-center text-xs text-slate-400">
                    No matching operations found
                  </td>
                </tr>
              ) : (
                operations.map((op) => {
                  const meta = kindMeta[op.kind] || kindMeta.other
                  const Icon = meta.icon
                  return (
                    <tr
                      key={op.name}
                      className="border-b border-white/50 bg-transparent transition-colors hover:bg-white/35"
                    >
                      <td className="px-4 py-2">
                        <div className="flex items-center gap-2.5">
                          <div className={`flex h-7 w-7 shrink-0 items-center justify-center ${HYPER_GLASS} !rounded-2xl`}>
                            <Icon className={"h-3.5 w-3.5 " + meta.color} />
                          </div>
                          <div className="min-w-0">
                            <div className="truncate font-medium text-slate-800">{op.name}</div>
                            <div className="font-mono text-[10px] text-slate-400">{meta.label}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-2 font-mono tabular-nums text-slate-600">
                        {op.chunks > 0 ? op.chunks : "—"}
                      </td>
                      <td className="px-3 py-2">
                        <span
                          className={
                            `inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-medium ${statusMeta[op.status]} ` +
                            "shadow-[0_4px_14px_rgba(20,40,70,0.04)]"
                          }
                        >
                          {op.status}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-[11px] text-slate-400">{op.time}</td>
                      <td className="px-4 py-2 text-right">
                        <button
                          type="button"
                          aria-label={`Actions for ${op.name}`}
                          className="inline-flex h-6 w-6 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-white/30 hover:text-slate-600"
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        )}
      </div>

      <div className="flex items-center justify-between border-t border-white/40 px-4 py-2 text-[11px] text-slate-500">
        <span>
          Showing {operations.length} of {totalFilteredCount} filtered operations
        </span>
      </div>
    </section>
  )
}