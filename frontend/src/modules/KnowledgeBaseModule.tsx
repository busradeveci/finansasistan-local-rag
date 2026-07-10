import { useEffect, useState } from "react"
import { getDocumentChunks } from "@/api/client"
import { useWorkstation } from "@/context/WorkstationContext"
import type { ChunkIndexRow } from "@/types/workstation"

export default function KnowledgeBaseModule() {
  const { documentInventory } = useWorkstation()
  const [active, setActive] = useState<string | null>(null)
  const [chunks, setChunks] = useState<ChunkIndexRow[]>([])

  useEffect(() => {
    if (!active) { setChunks([]); return }
    getDocumentChunks(active).then(setChunks).catch(() => setChunks([]))
  }, [active, documentInventory])

  const totalChunks = documentInventory.reduce((n, d) => n + d.chunks, 0)

  return (
    <div className="flex h-full min-h-0 flex-1 overflow-hidden">
      <div className="w-64 shrink-0 border-r overflow-y-auto fluent-scrollbar p-3" style={{ borderColor: "var(--ws-border)" }}>
        <h1 className="text-[14px] font-semibold mb-0.5">Knowledge Base</h1>
        <p className="text-[11px] font-medium text-[var(--ws-text-secondary)] mb-3">
          {documentInventory.length} docs · {totalChunks} chunks
        </p>
        <ul className="space-y-0.5">
          {documentInventory.map((d) => (
            <li key={d.filename}>
              <button
                type="button"
                onClick={() => setActive(d.filename)}
                className={`w-full rounded-sm border border-solid px-2 py-1.5 text-left text-[12px] transition-[border-color] duration-200 ${
                  active === d.filename
                    ? "border-[#a8a097] bg-[rgba(33,31,71,0.08)] font-medium text-[var(--ws-primary)]"
                    : "border-transparent ws-interactive"
                }`}
              >
                {d.filename}
                <span className="block text-[10px] font-medium text-[var(--ws-text-secondary)]">{d.chunks} chunks</span>
              </button>
            </li>
          ))}
        </ul>
      </div>
      <div className="flex-1 overflow-y-auto fluent-scrollbar p-4">
        {!active ? (
          <p className="text-[13px] font-medium text-[var(--ws-text-secondary)]">Select a document to inspect chunk-level index rows.</p>
        ) : (
          <>
            <h2 className="text-[15px] font-semibold mb-3">{active}</h2>
            <div className="ws-card overflow-hidden">
              <table className="w-full text-[12px]">
                <thead>
                  <tr className="border-b text-left" style={{ borderColor: "var(--ws-border)" }}>
                    <th className="px-2.5 py-1.5 font-semibold">Chunk #</th>
                    <th className="px-2.5 py-1.5 font-semibold">Characters</th>
                    <th className="px-2.5 py-1.5 font-semibold">Preview</th>
                  </tr>
                </thead>
                <tbody>
                  {chunks.map((c) => (
                    <tr key={c.chunk_index} className="border-b" style={{ borderColor: "var(--ws-border)" }}>
                      <td className="px-2.5 py-1.5 tabular-nums">{c.chunk_index}</td>
                      <td className="px-2.5 py-1.5 tabular-nums">{c.chars}</td>
                      <td className="px-2.5 py-1.5 text-[var(--ws-text-secondary)] max-w-md truncate">{c.preview}</td>
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
