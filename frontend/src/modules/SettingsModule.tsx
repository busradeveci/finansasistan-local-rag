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

const HYPER_GLASS =
  "bg-white/30 backdrop-blur-md border border-white/60 shadow-[0_4px_12px_rgba(0,0,0,0.05),inset_0_1px_1px_rgba(255,255,255,0.9)] rounded-full hover:bg-white/40 transition-all duration-300"

const GLASS_INNER =
  "bg-white/20 backdrop-blur-2xl backdrop-saturate-[1.1] border border-white/40 shadow-[0_8px_30px_rgb(0,0,0,0.04),inset_0_1px_0_rgba(255,255,255,0.8),inset_0_-1px_0_rgba(255,255,255,0.2)] rounded-3xl p-4"

export default function SettingsModule() {
  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden ws-module-shell">
      <header className="mb-6 shrink-0">
        <h1 className="text-page-title">Settings</h1>
        <p className="mt-1 truncate text-sm font-medium text-slate-600/80">
          Local model orchestration and retrieval parameters
        </p>
      </header>

      <div className="grid min-h-0 flex-1 grid-cols-1 gap-6 overflow-y-auto fluent-scrollbar lg:grid-cols-2">
        <section className="ws-glass-panel flex min-h-0 flex-col">
          <div className="mb-4 border-b border-white/50 pb-4">
            <h2 className="text-section-title">Chat Model</h2>
            <p className="mt-1 text-sm text-slate-600/80">Active local inference and embedding models</p>
          </div>
          <ul className="divide-y divide-white/40">
            {MODELS.map((m) => (
              <li
                key={m.id}
                className="ws-settings-row flex items-center justify-between gap-3 px-2 py-3 text-sm"
              >
                <span className="truncate font-medium text-slate-900">{m.label}</span>
                <span className={`shrink-0 px-2.5 py-0.5 text-xs font-semibold text-blue-600 ${HYPER_GLASS}`}>
                  {m.status}
                </span>
              </li>
            ))}
          </ul>
        </section>

        <section className="ws-glass-panel flex min-h-0 flex-col">
          <div className="mb-4 border-b border-white/50 pb-4">
            <h2 className="text-section-title">Retrieval Parameters</h2>
            <p className="mt-1 text-sm text-slate-600/80">Vector search and chunking configuration</p>
          </div>
          <ul className="divide-y divide-white/40">
            {RETRIEVAL_PARAMS.map((p) => (
              <li
                key={p.label}
                className="ws-settings-row flex items-center justify-between gap-3 px-2 py-3 text-sm"
              >
                <span className="truncate font-medium text-slate-600/80">{p.label}</span>
                <span className="shrink-0 font-semibold tabular-nums text-slate-800">{p.value}</span>
              </li>
            ))}
          </ul>
        </section>

        <section className="ws-glass-panel lg:col-span-2">
          <h2 className="text-section-title">Runtime</h2>
          <p className="mt-2 text-sm leading-relaxed text-slate-600/80">
            Microsoft Foundry Local · 100% offline · No cloud egress
          </p>
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className={GLASS_INNER}>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Deployment</p>
              <p className="mt-1 text-sm font-semibold text-slate-800">Air-gapped</p>
            </div>
            <div className={GLASS_INNER}>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Network</p>
              <p className="mt-1 text-sm font-semibold text-slate-800">Zero egress</p>
            </div>
            <div className={GLASS_INNER}>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Platform</p>
              <p className="mt-1 text-sm font-semibold text-slate-800">Foundry Local</p>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}
