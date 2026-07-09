const MODELS = [
  { id: "phi-3.5-mini", label: "phi-3.5-mini", status: "Active" },
  { id: "qwen3-embedding-0.6b", label: "qwen3-embedding-0.6b", status: "Active (Embed)" },
  { id: "phi-4-mini", label: "phi-4-mini", status: "Pending" },
]

export default function SettingsModule() {
  return (
    <div className="flex-1 overflow-y-auto fluent-scrollbar p-6 space-y-6 max-w-2xl">
      <header>
        <h1 className="text-[18px] font-semibold">Settings</h1>
        <p className="text-[12px] text-[var(--ws-text-secondary)]">
          Local model orchestration and retrieval parameters
        </p>
      </header>

      <section className="ws-card p-4 space-y-3">
        <h2 className="text-[12px] font-semibold">Chat Model</h2>
        {MODELS.map((m) => (
          <div key={m.id} className="flex justify-between text-[13px] py-2 border-b last:border-0" style={{ borderColor: "var(--ws-border)" }}>
            <span>{m.label}</span>
            <span className="text-[var(--ws-text-secondary)]">{m.status}</span>
          </div>
        ))}
      </section>

      <section className="ws-card p-4 space-y-3">
        <h2 className="text-[12px] font-semibold">Retrieval Parameters</h2>
        <Param label="Score Threshold" value="0.25" />
        <Param label="Relative Cutoff" value="0.55" />
        <Param label="Max Context Chunks" value="4" />
        <Param label="Chunk Size" value="800 characters" />
        <Param label="Chunk Overlap" value="150 characters" />
      </section>

      <section className="ws-card p-4">
        <h2 className="text-[12px] font-semibold mb-2">Runtime</h2>
        <p className="text-[12px] text-[var(--ws-text-secondary)]">
          Microsoft Foundry Local · 100% offline · No cloud egress
        </p>
      </section>
    </div>
  )
}

function Param({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between text-[13px]">
      <span className="text-[var(--ws-text-secondary)]">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  )
}
