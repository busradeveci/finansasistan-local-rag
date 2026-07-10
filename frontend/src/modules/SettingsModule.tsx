const MODELS = [
  { id: "phi-3.5-mini", label: "phi-3.5-mini", status: "Active" },
  { id: "qwen3-embedding-0.6b", label: "qwen3-embedding-0.6b", status: "Active (Embed)" },
  { id: "phi-4-mini", label: "phi-4-mini", status: "Pending" },
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
    <div className="flex h-full min-h-0 flex-col overflow-hidden bg-[var(--ws-canvas)] ws-module-shell">
      <header className="shrink-0 pb-4">
        <h1 className="text-section-title text-white">Settings</h1>
        <p className="mt-0.5 truncate text-sm font-medium text-[var(--ws-text-muted)]">
          Local model orchestration and retrieval parameters
        </p>
      </header>

      <div className="ws-card flex min-h-0 flex-1 flex-col overflow-y-auto fluent-scrollbar p-4">
        <section className="shrink-0 border-b border-[var(--ws-card-border)] pb-3">
          <h2 className="text-sm font-semibold text-white">Chat Model</h2>
        </section>
        <ul className="shrink-0 divide-y border-b border-[var(--ws-card-border)]">
          {MODELS.map((m) => (
            <li
              key={m.id}
              className="ws-settings-row flex items-center justify-between gap-3 rounded-sm px-2 py-2 text-sm"
            >
              <span className="truncate font-medium text-white">{m.label}</span>
              <span className="shrink-0 text-xs text-[var(--ws-primary)]">{m.status}</span>
            </li>
          ))}
        </ul>

        <section className="shrink-0 border-b border-[var(--ws-card-border)] py-3">
          <h2 className="text-sm font-semibold text-white">Retrieval Parameters</h2>
        </section>
        <ul className="shrink-0 divide-y border-b border-[var(--ws-card-border)]">
          {RETRIEVAL_PARAMS.map((p) => (
            <li
              key={p.label}
              className="ws-settings-row flex items-center justify-between gap-3 rounded-sm px-2 py-2 text-sm"
            >
              <span className="truncate font-medium text-[var(--ws-text-muted)]">{p.label}</span>
              <span className="shrink-0 font-medium tabular-nums text-white">{p.value}</span>
            </li>
          ))}
        </ul>

        <section className="shrink-0 py-3">
          <h2 className="text-sm font-semibold text-white">Runtime</h2>
          <p className="mt-0.5 truncate text-sm text-[var(--ws-text-muted)]">
            Microsoft Foundry Local · 100% offline · No cloud egress
          </p>
        </section>
      </div>
    </div>
  )
}
