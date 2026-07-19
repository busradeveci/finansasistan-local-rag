const MODELS = [
  { id: "phi-3.5-mini", label: "phi-3.5-mini", status: "Active (Chat)" },
  { id: "qwen3-embedding-0.6b", label: "qwen3-embedding-0.6b", status: "Active (Embed)" },
  { id: "phi-4-mini", label: "phi-4-mini", status: "Active (Semantic Router)" },
]

const RETRIEVAL_PARAMS = [
  { label: "Score Threshold", value: "0.25" },
  { label: "Relative Cutoff", value: "0.55" },
  { label: "Max Context Chunks", value: "4" },
  { label: "Chunk Size", value: "800 characters" },
  { label: "Chunk Overlap", value: "150 characters" },
]

export default function SettingsModule() {
  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden bg-white ws-module-shell">
      <header className="shrink-0 border-b border-gray-200 pb-4">
        <h1 className="text-section-title">Settings</h1>
        <p className="mt-0.5 truncate text-sm font-medium text-[var(--ws-text-muted)]">
          Local model orchestration and retrieval parameters
        </p>
      </header>

      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto fluent-scrollbar pt-4">
        <section className="shrink-0 border-b border-gray-200 pb-3">
          <h2 className="text-sm font-semibold text-[var(--ws-text)]">Chat Model</h2>
        </section>
        <ul className="shrink-0 divide-y divide-gray-100 border-b border-gray-200">
          {MODELS.map((m) => (
            <li
              key={m.id}
              className="ws-settings-row flex items-center justify-between gap-3 px-1 py-2.5 text-sm"
            >
              <span className="truncate font-medium text-[var(--ws-text)]">{m.label}</span>
              <span className="shrink-0 text-xs text-[var(--ws-primary)]">{m.status}</span>
            </li>
          ))}
        </ul>

        <section className="shrink-0 border-b border-gray-200 py-3">
          <h2 className="text-sm font-semibold text-[var(--ws-text)]">Retrieval Parameters</h2>
        </section>
        <ul className="shrink-0 divide-y divide-gray-100 border-b border-gray-200">
          {RETRIEVAL_PARAMS.map((p) => (
            <li
              key={p.label}
              className="ws-settings-row flex items-center justify-between gap-3 px-1 py-2.5 text-sm"
            >
              <span className="truncate font-medium text-[var(--ws-text-muted)]">{p.label}</span>
              <span className="shrink-0 font-medium tabular-nums text-[var(--ws-text)]">{p.value}</span>
            </li>
          ))}
        </ul>

        <section className="shrink-0 py-3">
          <h2 className="text-sm font-semibold text-[var(--ws-text)]">Runtime</h2>
          <p className="mt-0.5 truncate text-sm text-[var(--ws-text-muted)]">
            Microsoft Foundry Local · 100% offline · No cloud egress
          </p>
        </section>
      </div>
    </div>
  )
}
