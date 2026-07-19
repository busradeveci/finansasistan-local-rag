import { useMemo, useState } from "react"
import { FileText, FileSpreadsheet, FileType2, MoreHorizontal, Filter } from "lucide-react"
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

const kindMeta: Record<FileKind, { icon: React.ComponentType<{ className?: string }>; color: string; label: string }> = {
  pdf: { icon: FileType2, color: "text-red-500", label: "PDF" },
  docx: { icon: FileText, color: "text-[#1c1917]", label: "DOCX" },
  xlsx: { icon: FileSpreadsheet, color: "text-orange-600", label: "XLSX" },
  other: { icon: FileText, color: "text-stone-500", label: "FILE" },
}

const statusMeta: Record<OpStatus, string> = {
  Indexed: "border-orange-200 bg-orange-50 text-orange-700",
  Processing: "border-[#1c1917]/20 bg-[#f5f5f4] text-[#1c1917]",
  Queued: "border-amber-200 bg-amber-50 text-amber-700",
  Failed: "border-red-200 bg-red-50 text-red-700",
}

function inferKind(filename: string, type?: string): FileKind {
  const ext = (type || filename.split(".").pop() || "").toLowerCase()
  if (ext === "pdf") return "pdf"
  if (ext === "docx" || ext === "doc") return "docx"
  if (ext === "xlsx" || ext === "xls" || ext === "csv") return "xlsx"
  return "other"
}

function mapIndexState(state: string): OpStatus {
  const s = state.toLowerCase()
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
    chunks: doc.chunks,
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

  const operations = useMemo(() => {
    const uploadNames = new Set(uploadQueue.map((q) => q.name))
    const fromInventory = documentInventory
      .filter((d) => !uploadNames.has(d.filename))
      .map(rowFromInventory)
    const fromQueue = uploadQueue.map(rowFromUpload)
    const merged = [...fromQueue, ...fromInventory]
    const q = filter.trim().toLowerCase()
    if (!q) return merged.slice(0, 7)
    return merged.filter((o) => o.name.toLowerCase().includes(q)).slice(0, 7)
  }, [documentInventory, uploadQueue, filter])

  const total = documentInventory.length

  return (
    <section className="rounded-sm border border-stone-200 bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-stone-200 px-3.5 py-2.5">
        <div className="flex items-center gap-2">
          <h2 className="text-xs font-semibold text-stone-900">Recent Knowledge Operations</h2>
          <span className="rounded bg-stone-100 px-1.5 py-0.5 font-mono text-[10px] text-stone-500">
            {operations.length} / {total.toLocaleString()}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="search"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder="Filter…"
            aria-label="Filter documents"
            className="h-7 w-32 rounded-sm border border-stone-200 bg-stone-50 px-2 text-[11px] text-stone-700 placeholder:text-stone-400 focus:border-[#1c1917] focus:bg-white focus:outline-none"
          />
          <button
            type="button"
            className="inline-flex items-center gap-1.5 rounded-sm border border-stone-200 bg-white px-2 py-1 text-[11px] font-medium text-stone-600 hover:bg-stone-50"
          >
            <Filter className="h-3.5 w-3.5" />
            Filter
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        {documentInventoryLoading && operations.length === 0 ? (
          <p className="px-3.5 py-6 text-center text-xs text-stone-400">Loading inventory…</p>
        ) : (
          <table className="w-full text-left text-[13px]">
            <thead>
              <tr className="border-b border-stone-200 text-[10px] uppercase tracking-wider text-stone-400">
                <th className="px-3.5 py-2 font-semibold">Document</th>
                <th className="px-3 py-2 font-semibold">Chunks</th>
                <th className="px-3 py-2 font-semibold">Status</th>
                <th className="px-3 py-2 font-semibold">Ingested</th>
                <th className="px-3.5 py-2" />
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {operations.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-3.5 py-6 text-center text-xs text-stone-400">
                    No documents indexed yet
                  </td>
                </tr>
              ) : (
                operations.map((op) => {
                  const meta = kindMeta[op.kind]
                  const Icon = meta.icon
                  return (
                    <tr key={op.name} className="transition-colors hover:bg-stone-50/70">
                      <td className="px-3.5 py-2">
                        <div className="flex items-center gap-2.5">
                          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-sm border border-stone-200 bg-stone-50">
                            <Icon className={"h-3.5 w-3.5 " + meta.color} />
                          </div>
                          <div className="min-w-0">
                            <div className="truncate font-medium text-stone-800">{op.name}</div>
                            <div className="font-mono text-[10px] text-stone-400">{meta.label}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-2 font-mono tabular-nums text-stone-600">
                        {op.chunks > 0 ? op.chunks : "—"}
                      </td>
                      <td className="px-3 py-2">
                        <span
                          className={
                            "inline-flex items-center rounded-sm border px-1.5 py-0.5 text-[11px] font-medium " +
                            statusMeta[op.status]
                          }
                        >
                          {op.status}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-[11px] text-stone-400">{op.time}</td>
                      <td className="px-3.5 py-2 text-right">
                        <button
                          type="button"
                          aria-label={`Actions for ${op.name}`}
                          className="inline-flex h-6 w-6 items-center justify-center rounded-sm text-stone-400 hover:bg-stone-100 hover:text-stone-600"
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

      <div className="flex items-center justify-between border-t border-stone-200 px-3.5 py-2 text-[11px] text-stone-500">
        <span>
          Showing {operations.length} of {total.toLocaleString()} documents
        </span>
      </div>
    </section>
  )
}
