import type { EvidenceChunk } from "@/types/workstation"
import { useWorkstation } from "@/context/WorkstationContext"
import { FileText } from "lucide-react"

interface Props {
  sources: EvidenceChunk[]
  selected: EvidenceChunk | null
  onSelect: (chunk: EvidenceChunk) => void
}

export default function EvidencePanel({ sources, selected, onSelect }: Props) {
  const { setModule } = useWorkstation()
  const active = selected ?? sources[0] ?? null

  return (
    <aside
      className="shrink-0 flex flex-col h-full ws-surface border-l overflow-hidden"
      style={{ width: "var(--ws-evidence-width)", borderColor: "var(--ws-border)" }}
    >
      <header className="shrink-0 px-4 py-3 border-b" style={{ borderColor: "var(--ws-border)" }}>
        <h2 className="text-[12px] font-semibold text-[var(--ws-text)]">Evidence Panel</h2>
        <p className="text-[10px] text-[var(--ws-text-secondary)] mt-0.5">
          Retrieved sources &amp; chunk audit
        </p>
      </header>

      <div className="flex-1 min-h-0 overflow-y-auto fluent-scrollbar px-4 py-3 space-y-3">
        {sources.length === 0 ? (
          <p className="text-[12px] text-[var(--ws-text-secondary)]">
            Run a query to populate retrieved sources and similarity metrics.
          </p>
        ) : (
          <>
            <section>
              <p className="text-[10px] font-semibold uppercase tracking-wide text-[var(--ws-text-secondary)] mb-2">
                Retrieved Sources
              </p>
              <ul className="space-y-1">
                {sources.map((s, i) => (
                  <li key={`${s.filename}-${s.chunk_index}-${i}`}>
                    <button
                      type="button"
                      onClick={() => onSelect(s)}
                      className={`w-full text-left px-2 py-1.5 rounded-md text-[12px] fluent-transition ${
                        active === s
                          ? "bg-[rgba(0,120,212,0.08)] text-[var(--ws-primary)]"
                          : "hover:bg-[rgba(0,0,0,0.03)] text-[var(--ws-text)]"
                      }`}
                    >
                      {s.ref != null && <span className="font-medium">[{s.ref}] </span>}
                      {s.filename}
                      {s.chunk_index != null && (
                        <span className="text-[var(--ws-text-secondary)]">
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
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-[var(--ws-text-secondary)] mb-2">
                    Chunk Preview
                  </p>
                  <pre className="ws-card p-3 text-[11px] leading-relaxed whitespace-pre-wrap break-words max-h-48 overflow-y-auto fluent-scrollbar text-[var(--ws-text)]">
                    {active.content ?? active.preview}
                  </pre>
                </section>

                <section className="text-[11px] space-y-1 text-[var(--ws-text-secondary)]">
                  {active.ref != null && (
                    <p>
                      <span className="font-medium text-[var(--ws-text)]">Reference:</span>{" "}
                      [{active.ref}]
                    </p>
                  )}
                  <p>
                    <span className="font-medium text-[var(--ws-text)]">Document:</span>{" "}
                    {active.filename}
                  </p>
                  <p>
                    <span className="font-medium text-[var(--ws-text)]">Type:</span>{" "}
                    {(active.file_type ?? "file").toUpperCase()}
                  </p>
                  {active.chunk_index != null && (
                    <p>
                      <span className="font-medium text-[var(--ws-text)]">Chunk index:</span>{" "}
                      {active.chunk_index}
                    </p>
                  )}
                  <p>
                    <span className="font-medium text-[var(--ws-text)]">Raw score:</span>{" "}
                    {(active.score ?? 0).toFixed(4)}
                  </p>
                  <p>
                    <span className="font-medium text-[var(--ws-text)]">Confidence:</span>{" "}
                    {active.confidence ?? Math.round((active.score ?? 0) * 100)}%
                  </p>
                  <button
                    type="button"
                    onClick={() => setModule("documents")}
                    className="inline-flex items-center gap-1 mt-2 text-[var(--ws-primary)] hover:underline"
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
    <div className="ws-card px-2 py-2">
      <p className="text-[9px] uppercase tracking-wide text-[var(--ws-text-secondary)]">{label}</p>
      <p className="text-[14px] font-semibold text-[var(--ws-primary)] mt-0.5">{value}</p>
    </div>
  )
}
