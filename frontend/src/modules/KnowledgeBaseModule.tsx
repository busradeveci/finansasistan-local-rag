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

    <div className="flex-1 min-h-0 flex overflow-hidden">

      <div className="w-64 shrink-0 border-r overflow-y-auto fluent-scrollbar p-4" style={{ borderColor: "var(--ws-border)" }}>

        <h1 className="text-[14px] font-semibold mb-1">Knowledge Base</h1>

        <p className="text-[11px] text-[var(--ws-text-secondary)] mb-4">

          {documentInventory.length} docs · {totalChunks} chunks

        </p>

        <ul className="space-y-1">

          {documentInventory.map((d) => (

            <li key={d.filename}>

              <button

                type="button"

                onClick={() => setActive(d.filename)}

                className={`w-full text-left px-2 py-1.5 rounded-md text-[12px] ${

                  active === d.filename ? "bg-[rgba(0,120,212,0.08)] text-[var(--ws-primary)]" : "hover:bg-[rgba(0,0,0,0.03)]"

                }`}

              >

                {d.filename}

                <span className="block text-[10px] text-[var(--ws-text-secondary)]">{d.chunks} chunks</span>

              </button>

            </li>

          ))}

        </ul>

      </div>

      <div className="flex-1 overflow-y-auto fluent-scrollbar p-6">

        {!active ? (

          <p className="text-[13px] text-[var(--ws-text-secondary)]">Select a document to inspect chunk-level index rows.</p>

        ) : (

          <>

            <h2 className="text-[15px] font-semibold mb-4">{active}</h2>

            <div className="ws-card overflow-hidden">

              <table className="w-full text-[12px]">

                <thead>

                  <tr className="border-b text-left" style={{ borderColor: "var(--ws-border)" }}>

                    <th className="px-3 py-2">Chunk #</th>

                    <th className="px-3 py-2">Characters</th>

                    <th className="px-3 py-2">Preview</th>

                  </tr>

                </thead>

                <tbody>

                  {chunks.map((c) => (

                    <tr key={c.chunk_index} className="border-b" style={{ borderColor: "var(--ws-border)" }}>

                      <td className="px-3 py-2">{c.chunk_index}</td>

                      <td className="px-3 py-2">{c.chars}</td>

                      <td className="px-3 py-2 text-[var(--ws-text-secondary)] max-w-md truncate">{c.preview}</td>

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

