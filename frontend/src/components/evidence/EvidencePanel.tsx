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
    <aside className="flex h-full w-full max-w-sm shrink-0 flex-col overflow-hidden bg-white rounded-2xl border border-slate-200/80 p-4 shadow-sm">
      <header className="shrink-0 pb-3 mb-3 border-b border-slate-200/80">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h2 className="font-heading text-[12px] font-semibold text-navy-900">
              Evidence Panel
            </h2>
            <p className="mt-0.5 text-[10px] text-navy-300">
              Retrieved sources &amp; chunk audit
            </p>
          </div>
          {onToggle && (
            <button
              type="button"
              onClick={onToggle}
              className="inline-flex items-center justify-center rounded-xl p-1.5 text-navy-300 hover:bg-teal-50 hover:text-teal-700 transition-all duration-300 ease-[cubic-bezier(0.175,0.885,0.32,1.275)]"
              aria-label="Collapse evidence panel"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </header>

      <div className="flex-1 min-h-0 overflow-y-auto fluent-scrollbar space-y-3">
        {sources.length === 0 ? (
          <p className="text-[12px] text-navy-300">
            Run a query to populate retrieved sources and similarity metrics.
          </p>
        ) : (
          <>
            <section>
              <p className="text-[10px] font-semibold uppercase tracking-wide text-navy-300 mb-2">
                Retrieved Sources
              </p>
              <ul className="space-y-1">
                {sources.map((s, i) => (
                  <li key={`${s.filename}-${s.chunk_index}-${i}`}>
                    <button
                      type="button"
                      onClick={() => onSelect(s)}
                      className={`w-full text-left px-2.5 py-2 rounded-xl text-[12px] transition-all duration-300 ease-[cubic-bezier(0.175,0.885,0.32,1.275)] ${
                        active === s
                          ? "bg-teal-50 text-teal-700 border border-teal-500/20"
                          : "text-navy-900 hover:bg-slate-50 border border-transparent"
                      }`}
                    >
                      {s.ref != null && <span className="font-medium">[{s.ref}] </span>}
                      {s.filename}
                      {s.chunk_index != null && (
                        <span className="text-navy-300">
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
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-navy-300 mb-2">
                    Chunk Preview
                  </p>
                  <pre className="rounded-xl border border-slate-200/80 bg-teal-50/20 p-3 text-[11px] leading-relaxed whitespace-pre-wrap break-words max-h-48 overflow-y-auto fluent-scrollbar text-navy-900 shadow-sm">
                    {active.content ?? active.preview}
                  </pre>
                </section>

                <section className="text-[11px] space-y-1 text-navy-300">
                  {active.ref != null && (
                    <p>
                      <span className="font-medium text-navy-900">Reference:</span>{" "}
                      [{active.ref}]
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
                      {active.chunk_index}
                    </p>
                  )}
                  <p>
                    <span className="font-medium text-navy-900">Raw score:</span>{" "}
                    {(active.score ?? 0).toFixed(4)}
                  </p>
                  <p>
                    <span className="font-medium text-navy-900">Confidence:</span>{" "}
                    {active.confidence ?? Math.round((active.score ?? 0) * 100)}%
                  </p>
                  <button
                    type="button"
                    onClick={() => setModule("documents")}
                    className="inline-flex items-center gap-1 mt-2 text-teal-700 hover:underline"
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
    <div className="bg-white p-4 rounded-[30px] shadow-sm border border-slate-200/80 hover:border-teal-500/30 hover:shadow-md transition-all duration-300 ease-[cubic-bezier(0.175,0.885,0.32,1.275)]">
      <p className="text-[9px] uppercase tracking-wide text-navy-300">{label}</p>
      <p className="text-[14px] font-semibold text-teal-700 mt-0.5">{value}</p>
    </div>
  )
}
