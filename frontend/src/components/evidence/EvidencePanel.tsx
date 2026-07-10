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
    <aside className="flex h-full w-full max-w-xs shrink-0 flex-col overflow-hidden rounded-sm p-2 ws-glass">
      <header className="mb-1.5 shrink-0 border-b border-glass pb-1.5">
        <h2 className="truncate text-card-title text-midnight">
          Evidence Panel
        </h2>
        <p className="mt-0.5 truncate text-sm text-stone">
          Retrieved sources &amp; chunk audit
        </p>
      </header>

      <div className="fluent-scrollbar min-h-0 flex-1 space-y-2 overflow-y-auto metric-display">
        {sources.length === 0 ? (
          <p className="text-sm text-stone">
            Run a query to populate retrieved sources and similarity metrics.
          </p>
        ) : (
          <>
            <section>
              <p className="mb-1.5 text-sm font-semibold uppercase tracking-wide text-stone">
                Retrieved Sources
              </p>
              <ul className="space-y-0.5">
                {sources.map((s, i) => (
                  <li key={`${s.filename}-${s.chunk_index}-${i}`}>
                    <button
                      type="button"
                      onClick={() => onSelect(s)}
                      className={`w-full rounded-sm border border-solid px-2 py-1 text-left text-sm transition-all duration-200 ease-in-out ${
                        active === s
                          ? "border-stone ws-glass-elevated text-midnight backdrop-blur-glass"
                          : "border-transparent text-midnight ws-interactive"
                      }`}
                    >
                      <span className="truncate">
                        {s.ref != null && <span className="font-medium tabular-nums">[{s.ref}] </span>}
                        {s.filename}
                        {s.chunk_index != null && (
                          <span className="text-stone tabular-nums">
                            {" "}
                            · chunk #{s.chunk_index}
                          </span>
                        )}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            </section>

            {active && (
              <>
                <section className="grid grid-cols-2 gap-1.5">
                  <Metric label="Similarity" value={`${((active.score ?? 0) * 100).toFixed(1)}%`} />
                  <Metric
                    label="Confidence"
                    value={`${active.confidence ?? Math.round((active.score ?? 0) * 100)}%`}
                  />
                </section>

                <section>
                  <p className="mb-1.5 text-sm font-semibold uppercase tracking-wide text-stone">
                    Chunk Preview
                  </p>
                  <pre className="max-h-36 overflow-y-auto whitespace-pre-wrap break-words rounded-sm border border-solid border-glass bg-glass p-2 text-sm leading-relaxed text-midnight fluent-scrollbar">
                    {active.content ?? active.preview}
                  </pre>
                </section>

                <section className="space-y-0.5 text-sm text-stone">
                  {active.ref != null && (
                    <p className="truncate">
                      <span className="font-medium text-midnight">Reference:</span>{" "}
                      <span className="tabular-nums">[{active.ref}]</span>
                    </p>
                  )}
                  <p className="truncate">
                    <span className="font-medium text-midnight">Document:</span>{" "}
                    {active.filename}
                  </p>
                  <p className="truncate">
                    <span className="font-medium text-midnight">Type:</span>{" "}
                    {(active.file_type ?? "file").toUpperCase()}
                  </p>
                  {active.chunk_index != null && (
                    <p className="truncate">
                      <span className="font-medium text-midnight">Chunk index:</span>{" "}
                      <span className="tabular-nums">{active.chunk_index}</span>
                    </p>
                  )}
                  <p className="truncate">
                    <span className="font-medium text-midnight">Raw score:</span>{" "}
                    <span className="tabular-nums">{(active.score ?? 0).toFixed(4)}</span>
                  </p>
                  <p className="truncate">
                    <span className="font-medium text-midnight">Confidence:</span>{" "}
                    <span className="tabular-nums">
                      {active.confidence ?? Math.round((active.score ?? 0) * 100)}%
                    </span>
                  </p>
                  <button
                    type="button"
                    onClick={() => setModule("documents")}
                    className="ws-toolbar-btn mt-1.5 text-sm"
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
    <div className="ws-stat-card flex min-h-[48px] flex-col justify-center p-2">
      <p className="truncate text-sm font-semibold uppercase tracking-wide text-stone">{label}</p>
      <p className="mt-0.5 truncate text-card-title text-midnight tabular-nums">{value}</p>
    </div>
  )
}
