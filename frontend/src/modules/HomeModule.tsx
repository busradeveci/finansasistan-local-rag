import { useEffect, useState } from "react"
import { FileText, MessageSquare, RefreshCw, Upload } from "lucide-react"
import { getStatus } from "@/api/client"
import { useWorkstation } from "@/context/WorkstationContext"

function StatusPill({ label }: { label: string }) {
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-sm border border-[#4f4e4d]/30 bg-white px-2.5 py-1 text-[11px] font-medium shadow-sm"
      style={{ color: "var(--ws-success)" }}
    >
      <span className="h-1.5 w-1.5 rounded-sm" style={{ background: "var(--ws-success)" }} />
      {label}
    </span>
  )
}

export default function HomeModule() {
  const { setModule, sessions, recentDocuments } = useWorkstation()
  const [status, setStatus] = useState<{
    vector_store: { document_count: number; total_chunks: number }
    models: { chat_model: string; embed_model: string }
  } | null>(null)

  useEffect(() => {
    getStatus().then(setStatus).catch(() => setStatus(null))
  }, [])

  const hour = new Date().getHours()
  const greeting =
    hour < 12 ? "Good Morning" : hour < 18 ? "Good Afternoon" : "Good Evening"

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden">
      <div className="min-h-0 flex-1 overflow-y-auto fluent-scrollbar p-4 space-y-4">
      <header>
        <h1 className="text-[22px] font-semibold text-[var(--ws-text)]">
          {greeting}, Büşra
        </h1>
        <p className="text-[13px] font-medium text-[var(--ws-text-secondary)] mt-0.5">
          Foundry Local enterprise workstation — all pipelines operational.
        </p>
      </header>

      <div className="flex flex-wrap gap-2">
        <StatusPill label="Local Models Ready" />
        <StatusPill label="Vector Database Ready" />
        <StatusPill label="Security Enabled" />
        <StatusPill label="Offline Mode" />
      </div>

      <section>
        <h2 className="text-[12px] font-semibold uppercase tracking-wide text-[var(--ws-text-secondary)] mb-2">
          Quick Actions
        </h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
          <ActionCard icon={Upload} label="Upload Documents" onClick={() => setModule("documents")} />
          <ActionCard icon={MessageSquare} label="Start Chat" onClick={() => setModule("chat")} />
          <ActionCard icon={RefreshCw} label="Reindex Database" onClick={() => setModule("knowledge")} />
          <ActionCard icon={FileText} label="System Health" onClick={() => setModule("analytics")} />
        </div>
      </section>

      <div className="grid lg:grid-cols-3 gap-2.5">
        <Widget title="Recent Documents">
          {recentDocuments.length === 0 ? (
            <p className="text-[12px] text-[var(--ws-text-secondary)]">No recent uploads</p>
          ) : (
            <ul className="text-[12px] space-y-1">
              {recentDocuments.map((d) => (
                <li key={d} className="truncate">{d}</li>
              ))}
            </ul>
          )}
        </Widget>
        <Widget title="Recent Conversations">
          {sessions.length === 0 ? (
            <p className="text-[12px] text-[var(--ws-text-secondary)]">No sessions yet</p>
          ) : (
            <ul className="text-[12px] space-y-1">
              {sessions.slice(0, 5).map((s) => (
                <li key={s.id}>{s.label} · {s.date}</li>
              ))}
            </ul>
          )}
        </Widget>
        <Widget title="Knowledge Base Metrics">
          {status ? (
            <ul className="text-[12px] space-y-1 text-[var(--ws-text)]">
              <li>{status.vector_store.document_count} documents</li>
              <li>{status.vector_store.total_chunks.toLocaleString()} chunks</li>
              <li>Embedding: {status.models.embed_model}</li>
              <li>LLM: {status.models.chat_model}</li>
            </ul>
          ) : (
            <p className="text-[12px] text-[var(--ws-text-secondary)]">Loading metrics…</p>
          )}
        </Widget>
      </div>
      </div>
    </div>
  )
}

function ActionCard({
  icon: Icon,
  label,
  onClick,
}: {
  icon: typeof Upload
  label: string
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="ws-card p-3 text-left ws-interactive"
    >
      <Icon className="h-4 w-4 mb-2" style={{ color: "var(--ws-primary)" }} strokeWidth={1.75} />
      <span className="text-[13px] font-medium text-[var(--ws-text)]">{label}</span>
    </button>
  )
}

function Widget({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="ws-card ws-interactive p-3">
      <h3 className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-[var(--ws-text-secondary)]">
        {title}
      </h3>
      {children}
    </div>
  )
}
