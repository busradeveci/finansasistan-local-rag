import { useEffect, useRef } from "react"

import type { EvidenceChunk } from "@/types/workstation"

import { useWorkstation } from "@/context/WorkstationContext"

import { FileText } from "lucide-react"

const HYPER_GLASS =
  "bg-white/58 backdrop-blur-md border border-white/74 shadow-[0_6px_16px_rgba(20,40,70,0.06),inset_0_1px_0_rgba(255,255,255,0.88)] rounded-full hover:bg-white/68 transition-all duration-200"

const GLASS_INNER =
  "bg-white/70 backdrop-blur-lg border border-white/74 shadow-[0_6px_18px_rgba(20,40,70,0.06),inset_0_1px_0_rgba(255,255,255,0.88)] rounded-3xl"

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
      <header className="mb-1 shrink-0 border-b border-white/40 pb-1.5">
        <h2 className="truncate text-badge font-bold uppercase tracking-wider text-[var(--ws-text)]">
          Retrieved Sources
        </h2>
        <p className="mt-0.5 truncate text-badge leading-snug tracking-wide text-[var(--ws-text-muted)]">
          Supporting Documents
        </p>
      </header>

      <div className="fluent-scrollbar min-h-0 flex-1 space-y-2 overflow-y-auto metric-display">
        {sources.length === 0 ? (
          <p className="text-body-sm leading-relaxed tracking-wide text-[var(--ws-text-muted)]">
            No active conversations.
          </p>
        ) : (
          <>
            <section>
              <p className="mb-1 text-badge font-semibold uppercase tracking-wider text-[var(--ws-text-muted)]">
                Retrieved Sources
              </p>
              <ul className="space-y-0.5">
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
                        className={`w-full px-2 py-1.5 text-left text-caption leading-snug tracking-wide transition-colors ${HYPER_GLASS} !rounded-2xl ${
                          isActive
                            ? "text-slate-800 ring-1 ring-blue-500/20"
                            : "text-slate-500"
                        }`}
                      >
                        <span className="truncate">
                          {s.ref != null && (
                            <span className="mr-0.5 font-bold tabular-nums text-[var(--ws-primary)]">
                              [{s.ref}]
                            </span>
                          )}
                          {s.filename}
                          {s.chunk_index != null && (
                            <span className="text-[var(--ws-text-muted)] tabular-nums"> · #{s.chunk_index}</span>
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
                  <p className="mb-1 text-badge font-semibold uppercase tracking-wider text-[var(--ws-text-muted)]">
                    Context
                  </p>
                  <pre className={`max-h-36 overflow-y-auto whitespace-pre-wrap break-words p-2.5 text-body-sm leading-relaxed tracking-wide text-slate-500 fluent-scrollbar ${GLASS_INNER}`}>
                    {active.content ?? active.preview}
                  </pre>
                </section>

                <section className="flex flex-wrap items-center gap-1 border-t border-white/40 pt-2 text-caption tracking-wide text-[var(--ws-text-muted)]">
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
