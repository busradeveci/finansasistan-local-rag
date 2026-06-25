import { useRef, useState } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import ChatSection from "./components/ChatSection"
import DocumentUpload from "./components/DocumentUpload"

const SIDEBAR_WIDTH = 300

const CHAT_MODELS = [
  { id: "phi-3.5-mini",  label: "phi-3.5-mini",  tag: "Active",             available: true  },
  { id: "phi-4-mini",    label: "phi-4-mini",     tag: "Pending",            available: false },
  { id: "llama-3.1-8b", label: "llama-3.1-8b",   tag: "VRAM insufficient",  available: false, warn: true },
]

const TELEMETRY = [
  { label: "CPU",    value: "14%",           pct: 14 },
  { label: "Memory", value: "1.2 / 16 GB",   pct: 8  },
  { label: "Vector", value: "1024 dim",      pct: 100 },
]

const SECURITY_LOGS = [
  "Sanitization pipeline active",
  "Prompt injection filter enabled",
  "Path traversal guard enabled",
  "Context chunk cap: MAX=4",
]

const AUDIT_SESSIONS = [
  { id: 104, date: "16.06.2026 21:09", label: "Air-Gapped Compliance" },
  { id: 103, date: "15.06.2026 14:22", label: "Local Policy Review"   },
  { id: 102, date: "14.06.2026 09:15", label: "BDDK Audit Pass"       },
]

function asciiBar(pct, width = 10) {
  const filled = Math.max(0, Math.min(width, Math.round((pct / 100) * width)))
  return `[${"█".repeat(filled)}${"░".repeat(width - filled)}] ${pct}%`
}

function PanelSection({ title, children }) {
  return (
    <section className="fluent-border fluent-acrylic-subtle overflow-hidden flex-shrink-0 rounded-sm">
      <header className="fluent-border-b px-3 py-2 bg-[rgba(255,255,255,0.4)]">
        <span className="text-[11px] font-semibold text-[#2c3e50]">{title}</span>
      </header>
      <div className="p-3">{children}</div>
    </section>
  )
}

function TelemetryRow({ label, value, pct }) {
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-[11px]">
        <span className="text-[var(--fluent-text-muted)]">{label}</span>
        <span className="text-[var(--fluent-text)]">{value}</span>
      </div>
      <p className="fluent-report-mono text-[10px] text-[#0078d4]">{asciiBar(pct)}</p>
    </div>
  )
}

function ModelSwitcher({ onSwitch }) {
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(CHAT_MODELS[0])

  const select = (model) => {
    if (!model.available) return
    setActive(model)
    setOpen(false)
    onSwitch(model)
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between fluent-border fluent-acrylic px-2 py-1.5 text-left fluent-transition hover:border-[rgba(0,0,0,0.1)] rounded-sm"
      >
        <span className="text-[12px] text-[#0078d4] font-medium">{active.label}</span>
        <span className="text-[10px] text-[var(--fluent-text-muted)]">{open ? "▴" : "▾"}</span>
      </button>

      {open && (
        <div className="absolute top-full left-0 right-0 z-50 fluent-border fluent-acrylic mt-px overflow-hidden rounded-sm shadow-sm">
          {CHAT_MODELS.map((m) => (
            <button
              key={m.id}
              type="button"
              onClick={() => select(m)}
              disabled={!m.available}
              className={[
                "w-full flex items-center justify-between px-2 py-1.5 text-left text-[11px] fluent-border-b last:border-b-0 fluent-transition",
                m.available ? "hover:bg-[rgba(0,0,0,0.03)] cursor-pointer" : "opacity-40 cursor-not-allowed",
              ].join(" ")}
            >
              <span className={m.warn ? "text-[#ca5010]" : "text-[var(--fluent-text)]"}>{m.label}</span>
              <span className="text-[var(--fluent-text-muted)]">{m.tag}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export default function App() {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [runtimeBanner, setRuntimeBanner] = useState(null)
  const [flashedAudit, setFlashedAudit] = useState(null)
  const bannerTimer = useRef(null)

  const handleModelSwitch = (model) => {
    if (bannerTimer.current) clearTimeout(bannerTimer.current)
    setRuntimeBanner(model.label)
    bannerTimer.current = setTimeout(() => setRuntimeBanner(null), 4000)
  }

  const handleAuditClick = (id) => {
    setFlashedAudit(id)
    setTimeout(() => setFlashedAudit(null), 2000)
  }

  return (
    <div className="h-screen overflow-hidden fluent-canvas flex flex-col">

      {/* App header — no fake window controls */}
      <header className="shrink-0 fluent-acrylic fluent-border-b px-5 py-3 flex items-center justify-between">
        <div className="min-w-0">
          <h1 className="text-[15px] font-semibold text-[#1f2937] tracking-tight">FinansAsistan</h1>
          <p className="text-[11px] text-[var(--fluent-text-muted)] mt-0.5">Local RAG · Executive Reporting Console</p>
        </div>
        <div className="flex items-center gap-3 text-[11px] text-[var(--fluent-text-muted)]">
          <span>Foundry Local</span>
          <span className="text-[rgba(0,0,0,0.15)]">|</span>
          <span className="text-[#0078d4] font-medium">Online</span>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden min-h-0 relative">

        {/* Collapsible sidebar */}
        <aside
          className="shrink-0 flex flex-col overflow-hidden fluent-transition fluent-acrylic fluent-border-r"
          style={{
            width: sidebarOpen ? SIDEBAR_WIDTH : 0,
            opacity: sidebarOpen ? 1 : 0,
            pointerEvents: sidebarOpen ? "auto" : "none",
          }}
        >
          <div
            className="flex-1 overflow-y-auto p-3 flex flex-col gap-3 fluent-scrollbar"
            style={{ width: SIDEBAR_WIDTH }}
          >
            <PanelSection title="Document Vault">
              <DocumentUpload />
            </PanelSection>

            <PanelSection title="System Telemetry">
              <p className="text-[11px] text-[var(--fluent-text-muted)] mb-2">LLM · phi-3.5-mini</p>
              <p className="text-[11px] text-[var(--fluent-text-muted)] mb-3">Embed · qwen3-embedding-0.6b</p>
              <ModelSwitcher onSwitch={handleModelSwitch} />
              <div className="mt-3 space-y-3">
                {TELEMETRY.map(t => <TelemetryRow key={t.label} {...t} />)}
                <p className="text-[11px] fluent-border-t pt-2">
                  <span className="text-[var(--fluent-text-muted)]">Vector DB · </span>
                  <span className="text-[#0078d4]">SQLite active</span>
                </p>
              </div>
            </PanelSection>

            <PanelSection title="Security Log">
              <div className="space-y-1.5">
                {SECURITY_LOGS.map((line, i) => (
                  <p key={i} className="text-[11px] text-[var(--fluent-text)] flex gap-2">
                    <span className="text-[#0078d4]">✓</span>{line}
                  </p>
                ))}
              </div>
            </PanelSection>

            <PanelSection title="Session History">
              <div className="space-y-1">
                {AUDIT_SESSIONS.map(s => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => handleAuditClick(s.id)}
                    className={[
                      "w-full text-left fluent-border px-2 py-1.5 fluent-transition rounded-sm",
                      flashedAudit === s.id
                        ? "border-[rgba(0,120,212,0.35)] bg-[rgba(0,120,212,0.06)]"
                        : "hover:bg-[rgba(0,0,0,0.03)]",
                    ].join(" ")}
                  >
                    <p className="text-[10px] text-[var(--fluent-text-muted)]">{s.date}</p>
                    <p className="text-[11px] text-[var(--fluent-text)]">{s.label}</p>
                  </button>
                ))}
              </div>
            </PanelSection>
          </div>
        </aside>

        {/* Sidebar collapse toggle */}
        <button
          type="button"
          onClick={() => setSidebarOpen(v => !v)}
          aria-label={sidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
          className="absolute z-20 top-1/2 -translate-y-1/2 fluent-acrylic fluent-border rounded-sm p-1.5 fluent-transition hover:bg-[rgba(255,255,255,0.9)] shadow-sm"
          style={{
            left: sidebarOpen ? SIDEBAR_WIDTH - 14 : 8,
            transition: "left 0.3s cubic-bezier(0.1, 0.9, 0.2, 1), background 0.2s ease",
          }}
        >
          {sidebarOpen
            ? <ChevronLeft className="h-4 w-4 text-[var(--fluent-text-muted)]" strokeWidth={1.5} />
            : <ChevronRight className="h-4 w-4 text-[var(--fluent-text-muted)]" strokeWidth={1.5} />
          }
        </button>

        {/* Main workspace — expands when sidebar collapsed */}
        <main className="flex-1 min-w-0 flex flex-col overflow-hidden fluent-acrylic">

          {runtimeBanner && (
            <div className="shrink-0 fluent-border-b px-4 py-2 text-[11px] text-[var(--fluent-text)] bg-[rgba(0,120,212,0.06)]">
              Re-configuring runtime → <span className="text-[#0078d4] font-medium">{runtimeBanner}</span>
            </div>
          )}

          <div className="flex-1 flex flex-col min-h-0">
            <ChatSection />
          </div>
        </main>
      </div>
    </div>
  )
}
