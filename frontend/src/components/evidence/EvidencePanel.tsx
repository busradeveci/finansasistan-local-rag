import type { EvidenceChunk } from "@/types/workstation"
import { useWorkstation } from "@/context/WorkstationContext"
import { FileText, X } from "lucide-react"

interface Props {
  sources: EvidenceChunk[]
  selected: EvidenceChunk | null
  onSelect: (chunk: EvidenceChunk) => void
  onToggle?: () => void
}

export default function EvidencePanel({ sources, selected, onSelect, onToggle }: Props) {
  const { setModule } = useWorkstation()
  const active = selected ?? sources[0] ?? null

  return (
    <aside className="flex h-full w-full max-w-sm shrink-0 flex-col overflow-hidden ws-glass rounded-2xl p-4 shadow-glass">
      <header className="shrink-0 pb-3 mb-3 border-b border-glass">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h2 className="text-card-title text-navy-900">
              Evidence Panel
            </h2>
            <p className="mt-0.5 text-caption text-navy-700">
              Retrieved sources &amp; chunk audit
            </p>
          </div>
          {onToggle && (
            <button
              type="button"
              onClick={onToggle}
              className="inline-flex items-center justify-center rounded-xl p-1.5 text-navy-500 hover:bg-white/40 hover:text-navy-900 transition-all duration-200 ease-[cubic-bezier(0.2,0,0,1)]"
              aria-label="Collapse evidence panel"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </header>

      <div className="flex-1 min-h-0 overflow-y-auto fluent-scrollbar space-y-3 metric-display">
        {sources.length === 0 ? (
          <p className="text-body-sm text-navy-700">
            Run a query to populate retrieved sources and similarity metrics.
          </p>
        ) : (
          <>
            <section>
              <p className="text-badge font-semibold uppercase tracking-wide text-navy-500 mb-2">
                Retrieved Sources
              </p>
              <ul className="space-y-1">
                {sources.map((s, i) => (
                  <li key={`${s.filename}-${s.chunk_index}-${i}`}>
                    <button
                      type="button"
                      onClick={() => onSelect(s)}
                      className={`w-full text-left px-2.5 py-2 rounded-xl text-body-sm transition-all duration-200 ease-[cubic-bezier(0.2,0,0,1)] ${
                        active === s
                          ? "bg-white/55 backdrop-blur-glass text-navy-900 border border-navy-500/25 shadow-glass"
                          : "text-navy-900 hover:bg-white/40 border border-transparent"
                      }`}
                    >
                      {s.ref != null && <span className="font-medium tabular-nums">[{s.ref}] </span>}
                      {s.filename}
                      {s.chunk_index != null && (
                        <span className="text-navy-500 tabular-nums">
                          {" "}
                          · chunk #{s.chunk_index}
                        </span>
                      )}
                    </button>
                  </li>
                ))}
              </ul>
            </section>

            {active && (
              <>
                <section className="grid grid-cols-2 gap-2">
                  <Metric label="Similarity" value={`${((active.score ?? 0) * 100).toFixed(1)}%`} />
                  <Metric
                    label="Confidence"
                    value={`${active.confidence ?? Math.round((active.score ?? 0) * 100)}%`}
                  />
                </section>

                <section>
                  <p className="text-badge font-semibold uppercase tracking-wide text-navy-500 mb-2">
                    Chunk Preview
                  </p>
                  <pre className="rounded-xl border border-glass bg-white/45 backdrop-blur-glass p-3 text-caption leading-relaxed whitespace-pre-wrap break-words max-h-48 overflow-y-auto fluent-scrollbar text-navy-900 shadow-glass">
                    {active.content ?? active.preview}
                  </pre>
                </section>

                <section className="text-caption space-y-1 text-navy-700">
                  {active.ref != null && (
                    <p>
                      <span className="font-medium text-navy-900">Reference:</span>{" "}
                      <span className="tabular-nums">[{active.ref}]</span>
                    </p>
                  )}
                  <p>
                    <span className="font-medium text-navy-900">Document:</span>{" "}
                    {active.filename}
                  </p>
                  <p>
                    <span className="font-medium text-navy-900">Type:</span>{" "}
                    {(active.file_type ?? "file").toUpperCase()}
                  </p>
                  {active.chunk_index != null && (
                    <p>
                      <span className="font-medium text-navy-900">Chunk index:</span>{" "}
                      <span className="tabular-nums">{active.chunk_index}</span>
                    </p>
                  )}
                  <p>
                    <span className="font-medium text-navy-900">Raw score:</span>{" "}
                    <span className="tabular-nums">{(active.score ?? 0).toFixed(4)}</span>
                  </p>
                  <p>
                    <span className="font-medium text-navy-900">Confidence:</span>{" "}
                    <span className="tabular-nums">
                      {active.confidence ?? Math.round((active.score ?? 0) * 100)}%
                    </span>
                  </p>
                  <button
                    type="button"
                    onClick={() => setModule("documents")}
                    className="inline-flex items-center gap-1 mt-2 text-body-sm text-navy-700 hover:text-navy-900 hover:underline"
                  >
                    <FileText className="h-3 w-3" strokeWidth={1.75} />
                    Open in Document Vault
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

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="ws-stat-card p-4 rounded-2xl">
      <p className="text-badge font-semibold uppercase tracking-wide text-navy-500">{label}</p>
      <p className="text-card-title text-navy-900 mt-1 tabular-nums">{value}</p>
    </div>
  )
}
