import { useEffect, useRef } from "react"

import type { EvidenceChunk } from "@/types/workstation"

import { useWorkstation } from "@/context/WorkstationContext"

import { FileText, Library } from "lucide-react"

interface Props {
  sources: EvidenceChunk[]
  selected: EvidenceChunk | null
  onSelect: (chunk: EvidenceChunk) => void
}

function chunkDomId(chunk: EvidenceChunk, index: number): string {
  return `evidence-chunk-${chunk.ref ?? index}-${chunk.chunk_index ?? index}`
}

export default function EvidencePanel({ sources, selected, onSelect }: Props) {
  const { setModule } = useWorkstation()
  const active = selected ?? sources[0] ?? null
  const chunkRefs = useRef<Record<string, HTMLLIElement | null>>({})

  useEffect(() => {
    if (!active) return
    const key = String(active.ref ?? active.chunk_index ?? active.filename)
    const node = chunkRefs.current[key]
    node?.scrollIntoView({ behavior: "smooth", block: "nearest" })
  }, [active])

  return (
    <aside className="ws-evidence-panel flex h-full w-full shrink-0 flex-col overflow-hidden">
      <header className="mb-3 flex shrink-0 items-center gap-2.5 border-b border-white/50 pb-3">
        <span className="vv-chat-avatar vv-chat-avatar--assistant">
          <Library className="h-3.5 w-3.5" strokeWidth={1.9} />
        </span>
        <div className="min-w-0">
          <h2 className="vv-title-card truncate">Retrieved Sources</h2>
          <p className="vv-caption truncate">Evidence grounding this answer</p>
        </div>
      </header>

      <div className="fluent-scrollbar min-h-0 flex-1 space-y-3 overflow-y-auto metric-display">
        {sources.length === 0 ? (
          <div className="vv-rise flex h-full flex-col items-center justify-center px-4 py-8 text-center">
            <span className="vv-chat-empty-icon mb-4">
              <Library className="h-6 w-6" strokeWidth={1.7} />
            </span>
            <p className="vv-title-card mb-1.5">No sources yet</p>
            <p className="vv-caption max-w-[220px]">
              Ask a question and the documents used to ground the answer will appear here with
              similarity and confidence scores.
            </p>
          </div>
        ) : (
          <>
            <section>
              <p className="vv-eyebrow mb-2">Retrieved Sources</p>
              <ul className="space-y-1.5">
                {sources.map((s, i) => {
                  const domKey = String(s.ref ?? s.chunk_index ?? i)
                  const isActive =
                    active === s ||
                    (active?.ref != null && active.ref === s.ref) ||
                    (active?.filename === s.filename && active?.chunk_index === s.chunk_index)
                  return (
                    <li
                      key={`${s.filename}-${s.chunk_index}-${i}`}
                      ref={(el) => {
                        chunkRefs.current[domKey] = el
                      }}
                      id={chunkDomId(s, i)}
                    >
                      <button
                        type="button"
                        onClick={() => onSelect(s)}
                        className={`vv-tile vv-focus flex w-full items-center gap-2 px-2.5 py-2 text-left transition-all ${
                          isActive
                            ? "ring-1 ring-[var(--vv-accent)]/25"
                            : "vv-tile--hover"
                        }`}
                      >
                        {s.ref != null && (
                          <span className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-[var(--vv-accent-tint)] text-[10.5px] font-semibold tabular-nums text-[var(--vv-accent)]">
                            {s.ref}
                          </span>
                        )}
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-[12px] font-medium text-slate-700">
                            {s.filename}
                          </span>
                          {s.chunk_index != null && (
                            <span className="block text-[10.5px] font-medium tabular-nums text-slate-400">
                              Chunk #{s.chunk_index}
                            </span>
                          )}
                        </span>
                      </button>
                    </li>
                  )
                })}
              </ul>
            </section>

            {active && (
              <>
                <section className="flex flex-wrap gap-1.5">
                  <MetaBadge label="Similarity" value={`${((active.score ?? 0) * 100).toFixed(1)}%`} />
                  <MetaBadge
                    label="Confidence"
                    value={`${active.confidence ?? Math.round((active.score ?? 0) * 100)}%`}
                  />
                  {active.chunk_index != null && (
                    <MetaBadge label="Chunk" value={`#${active.chunk_index}`} />
                  )}
                  {active.ref != null && <MetaBadge label="Ref" value={`[${active.ref}]`} />}
                  <MetaBadge label="Score" value={(active.score ?? 0).toFixed(4)} />
                </section>

                <section>
                  <p className="vv-eyebrow mb-2">Context</p>
                  <div className="vv-tile vv-evidence-context max-h-40 overflow-y-auto whitespace-pre-wrap break-words p-3 fluent-scrollbar">
                    {active.content ?? active.preview}
                  </div>
                </section>

                <section className="flex flex-wrap items-center gap-1.5 border-t border-white/50 pt-3 text-caption tracking-wide text-[var(--ws-text-muted)]">
                  <span className="truncate">
                    <span className="font-semibold text-[var(--ws-text-secondary)]">{active.filename}</span>
                    {" · "}
                    {(active.file_type ?? "file").toUpperCase()}
                  </span>
                  <button
                    type="button"
                    onClick={() => setModule("documents")}
                    className="ws-toolbar-btn mt-0.5 text-[10px]"
                  >
                    <FileText className="h-3 w-3" strokeWidth={1.75} />
                    Documents
                  </button>
                </section>
              </>
            )}
          </>
        )}
      </div>
    </aside>
  )
}

function MetaBadge({ label, value }: { label: string; value: string }) {
  return (
    <span className="ws-badge">
      <span>{label}</span>
      <span className="ws-badge-value">{value}</span>
    </span>
  )
}
