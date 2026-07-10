import { useEffect, useState } from "react"
import { getDocumentChunks } from "@/api/client"
import { useWorkstation } from "@/context/WorkstationContext"
import type { ChunkIndexRow } from "@/types/workstation"

export default function KnowledgeBaseModule() {
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
    <div className="flex h-full min-h-0 flex-1 overflow-hidden bg-[var(--ws-canvas)]">
      <div className="w-64 shrink-0 overflow-y-auto border-r border-[var(--ws-card-border)] bg-[var(--ws-card-bg)] p-4 fluent-scrollbar">
        <h1 className="mb-0.5 text-sm font-semibold text-white">Knowledge Base</h1>
        <p className="mb-3 text-[11px] font-medium text-[var(--ws-text-muted)]">
          {documentInventory.length} docs · {totalChunks} chunks
        </p>
        <ul className="space-y-0.5">
          {documentInventory.map((d) => (
            <li key={d.filename}>
              <button
                type="button"
                onClick={() => setActive(d.filename)}
                className={`w-full rounded-lg border border-solid px-2 py-1.5 text-left text-xs transition-colors ${
                  active === d.filename
                    ? "border-[var(--ws-primary)]/40 bg-[rgba(16,185,129,0.1)] font-medium text-white"
                    : "border-transparent text-[var(--ws-text-secondary)] hover:bg-[var(--ws-card-bg-elevated)]"
                }`}
              >
                <span className="block truncate">{d.filename}</span>
                <span className="block text-[10px] font-medium text-[var(--ws-text-muted)]">
                  {d.chunks} chunks
                </span>
              </button>
            </li>
          ))}
        </ul>
      </div>
      <div className="flex-1 overflow-y-auto ws-module-shell fluent-scrollbar">
        {!active ? (
          <p className="text-sm font-medium text-[var(--ws-text-muted)]">
            Select a document to inspect chunk-level index rows.
          </p>
        ) : (
          <>
            <h2 className="mb-3 truncate text-base font-semibold text-white">{active}</h2>
            <div className="ws-card overflow-hidden">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-[var(--ws-card-border)] text-left text-[var(--ws-text-muted)]">
                    <th className="px-2.5 py-1.5 font-semibold">Chunk #</th>
                    <th className="px-2.5 py-1.5 font-semibold">Characters</th>
                    <th className="px-2.5 py-1.5 font-semibold">Preview</th>
                  </tr>
                </thead>
                <tbody>
                  {chunks.map((c) => (
                    <tr key={c.chunk_index} className="border-b border-[var(--ws-card-border)]">
                      <td className="px-2.5 py-1.5 tabular-nums text-white">{c.chunk_index}</td>
                      <td className="px-2.5 py-1.5 tabular-nums text-[var(--ws-text-muted)]">{c.chars}</td>
                      <td className="max-w-md truncate px-2.5 py-1.5 text-[var(--ws-text-secondary)]">
                        {c.preview}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
