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
    <div className="flex h-full min-h-0 flex-1 overflow-hidden bg-white">
      <div className="w-64 shrink-0 overflow-y-auto border-r border-gray-200 bg-gray-50 p-4 fluent-scrollbar">
        <h1 className="mb-0.5 text-sm font-semibold text-[var(--ws-text)]">Knowledge Base</h1>
        <p className="mb-3 text-[11px] font-medium text-[var(--ws-text-muted)]">
          {documentInventory.length} docs · {totalChunks} chunks
        </p>
        <ul className="divide-y divide-gray-100">
          {documentInventory.map((d) => (
            <li key={d.filename}>
              <button
                type="button"
                onClick={() => setActive(d.filename)}
                className={`w-full border-l-2 px-2 py-2 text-left text-xs transition-colors ${
                  active === d.filename
                    ? "border-[var(--ws-primary)] bg-white font-medium text-[var(--ws-text)]"
                    : "border-transparent text-[var(--ws-text-secondary)] hover:bg-white"
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
            <h2 className="mb-4 truncate border-b border-gray-200 pb-3 text-base font-semibold text-[var(--ws-text)]">
              {active}
            </h2>
            <table className="ws-data-table">
              <thead>
                <tr>
                  <th>Chunk #</th>
                  <th>Characters</th>
                  <th>Preview</th>
                </tr>
              </thead>
              <tbody>
                {chunks.map((c) => (
                  <tr key={c.chunk_index}>
                    <td className="tabular-nums font-medium text-[var(--ws-text)]">{c.chunk_index}</td>
                    <td className="tabular-nums">{c.chars}</td>
                    <td className="max-w-md truncate">{c.preview}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}
      </div>
    </div>
  )
}
