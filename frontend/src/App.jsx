import { useRef, useState } from "react"
import ChatSection from "./components/ChatSection"
import DocumentUpload from "./components/DocumentUpload"

// ── Static data ──────────────────────────────────────────────────────────────

const CHAT_MODELS = [
  { id: "phi-3.5-mini",  label: "phi-3.5-mini",  tag: "Active",             available: true  },
  { id: "phi-4-mini",    label: "phi-4-mini",     tag: "Soon",               available: false },
  { id: "llama-3.1-8b", label: "llama-3.1-8b",   tag: "Insufficient VRAM",  available: false, warn: true },
]

const TELEMETRY = [
  { label: "Lokal CPU Yükü",   value: "14%",             pct: 14 },
  { label: "Bellek Tüketimi",  value: "1.2 GB / 16 GB",  pct: 8  },
  { label: "Vektör Boyutu",    value: "512 dim / chunk",  pct: 100 },
]

const SECURITY_LOGS = [
  "✓ Giriş Temizleme (Sanitization) Aktif",
  "✓ Prompt Injection Filtresi Devrede",
  "✓ Path Traversal Blokajı [REDACTED] Hazır",
  "✓ Context Chunk Sınırı: MAX=4 Zorunlu",
]

const AUDIT_SESSIONS = [
  { id: 104, date: "16.06.2026 21:09", label: "Air-Gapped Compliance" },
  { id: 103, date: "15.06.2026 14:22", label: "Local Policy Review"   },
  { id: 102, date: "14.06.2026 09:15", label: "BDDK Audit Pass"       },
]

// ── Icon atoms ───────────────────────────────────────────────────────────────

const ShieldIcon  = ({ c }) => <svg xmlns="http://www.w3.org/2000/svg" className={c} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
const FileIcon    = ({ c }) => <svg xmlns="http://www.w3.org/2000/svg" className={c} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
const CpuIcon     = ({ c }) => <svg xmlns="http://www.w3.org/2000/svg" className={c} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="4" width="16" height="16" rx="2"/><rect x="9" y="9" width="6" height="6"/><line x1="9" y1="1" x2="9" y2="4"/><line x1="15" y1="1" x2="15" y2="4"/><line x1="9" y1="20" x2="9" y2="23"/><line x1="15" y1="20" x2="15" y2="23"/><line x1="20" y1="9" x2="23" y2="9"/><line x1="20" y1="15" x2="23" y2="15"/><line x1="1" y1="9" x2="4" y2="9"/><line x1="1" y1="15" x2="4" y2="15"/></svg>
const LockIcon    = ({ c }) => <svg xmlns="http://www.w3.org/2000/svg" className={c} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
const ChatIcon    = ({ c }) => <svg xmlns="http://www.w3.org/2000/svg" className={c} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
const HistoryIcon = ({ c }) => <svg xmlns="http://www.w3.org/2000/svg" className={c} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="12 8 12 12 14 14"/><path d="M3.05 11a9 9 0 1 0 .5-4"/><polyline points="3 3 3 9 9 9"/></svg>
const ChevronIcon = ({ c }) => <svg xmlns="http://www.w3.org/2000/svg" className={c} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"/></svg>

// ── Reusable sidebar section card ─────────────────────────────────────────────

function SidebarSection({ icon, title, children }) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/60 overflow-hidden flex-shrink-0">
      <div className="flex items-center gap-2.5 px-4 py-2.5 border-b border-slate-800">
        {icon}
        <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">{title}</span>
      </div>
      <div className="p-3">{children}</div>
    </div>
  )
}

function TelemetryRow({ label, value, pct }) {
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center justify-between">
        <span className="text-[10px] text-slate-500">{label}</span>
        <span className="font-mono text-[10px] text-emerald-400">{value}</span>
      </div>
      <div className="h-0.5 w-full rounded-full bg-slate-800">
        <div className="h-0.5 rounded-full bg-gradient-to-r from-emerald-600 to-emerald-400" style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}

// ── Model switcher dropdown ───────────────────────────────────────────────────

function ModelSwitcher({ onSwitch }) {
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(CHAT_MODELS[0])
  const ref = useRef(null)

  const select = (model) => {
    if (!model.available) return
    setActive(model)
    setOpen(false)
    onSwitch(model)
  }

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between gap-2 rounded-lg bg-slate-950 border border-slate-700 px-3 py-2 text-left transition-colors hover:border-emerald-800"
      >
        <div className="flex items-center gap-2">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
          <span className="font-mono text-[11px] font-semibold text-emerald-300">{active.label}</span>
          <span className="rounded bg-emerald-950 px-1.5 py-0.5 text-[9px] font-bold text-emerald-500 ring-1 ring-emerald-900">
            {active.tag}
          </span>
        </div>
        <ChevronIcon c={`h-3.5 w-3.5 text-slate-500 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="absolute top-full mt-1 left-0 right-0 z-50 rounded-lg border border-slate-700 bg-slate-950 shadow-2xl shadow-black/60 overflow-hidden">
          {CHAT_MODELS.map((m) => (
            <button
              key={m.id}
              onClick={() => select(m)}
              disabled={!m.available}
              className={[
                "w-full flex items-center justify-between px-3 py-2 text-left transition-colors",
                m.available
                  ? "hover:bg-slate-800 cursor-pointer"
                  : "cursor-not-allowed opacity-50",
              ].join(" ")}
            >
              <div className="flex items-center gap-2">
                <span className={`h-1.5 w-1.5 rounded-full shrink-0 ${m.available ? "bg-emerald-500" : "bg-slate-600"}`} />
                <span className={`font-mono text-[11px] font-semibold ${m.warn ? "text-amber-400" : "text-slate-300"}`}>
                  {m.label}
                </span>
              </div>
              <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ring-1 ${
                m.available
                  ? "text-emerald-500 ring-emerald-900 bg-emerald-950"
                  : m.warn
                  ? "text-amber-500 ring-amber-900 bg-amber-950/30"
                  : "text-slate-500 ring-slate-800 bg-slate-900"
              }`}>
                {m.tag}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Root component ───────────────────────────────────────────────────────────

export default function App() {
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
    <div className="h-screen overflow-hidden bg-slate-900 text-slate-100 font-sans flex flex-col">

      {/* ══ Navbar ═══════════════════════════════════════════════════════════ */}
      <header className="h-14 shrink-0 bg-slate-900 border-b border-slate-800 px-6 flex items-center justify-between z-20">
        <div className="flex items-center gap-3">
          <div className="relative flex items-center justify-center">
            <span className="absolute inset-0 rounded-full bg-emerald-500/20 blur-md" />
            <ShieldIcon c="relative h-6 w-6 text-emerald-400" />
          </div>
          <div className="flex flex-col leading-tight">
            <span className="text-lg font-extrabold tracking-tight text-white">FinansAsistan</span>
            <span className="text-[9px] font-medium tracking-widest uppercase text-slate-500">Kurumsal Lokal RAG Platformu</span>
          </div>
          <div className="ml-2 h-4 w-px bg-slate-700" />
          <span className="rounded bg-slate-800 px-2 py-0.5 font-mono text-[10px] font-semibold text-slate-400 ring-1 ring-slate-700">v1.0.0 CORE-LOKAL</span>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-1.5 text-[10px] text-slate-500">
            Sistem Durumu:
            <span className="flex items-center gap-1 text-emerald-400 font-semibold">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />Kararlı
            </span>
          </div>
          <div className="h-3.5 w-px bg-slate-700" />
          <div className="flex items-center gap-1.5 rounded-lg bg-emerald-950/80 px-2.5 py-1 ring-1 ring-emerald-800/60 select-none">
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75 animate-ping" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
            </span>
            <span className="text-[10px] font-semibold text-emerald-300">🛡️ GÜVENLİ HAT · %100 ÇEVRİMDIŞI</span>
            <span className="hidden lg:block text-[9px] font-medium text-emerald-600 border-l border-emerald-800 pl-2">BDDK UYUMLU</span>
          </div>
        </div>
      </header>

      {/* ══ Main workspace ═══════════════════════════════════════════════════ */}
      <div className="flex flex-1 overflow-hidden" style={{ height: "calc(100vh - 3.5rem)" }}>

        {/* ── Left sidebar ─────────────────────────────────────────────────── */}
        <aside className="w-[340px] shrink-0 border-r border-slate-800 bg-slate-950/50 flex flex-col overflow-hidden">
          {/* Scrollable interior */}
          <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4
                          scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent">

            {/* A — Document management */}
            <SidebarSection icon={<FileIcon c="h-3 w-3 text-slate-500" />} title="Bilgi Tabanı Yönetimi">
              <DocumentUpload />
            </SidebarSection>

            {/* B — System telemetry + model switcher */}
            <SidebarSection icon={<CpuIcon c="h-3 w-3 text-slate-500" />} title="Sistem Telemetrisi">
              {/* Embed model static badge */}
              <div className="flex items-center gap-1.5 rounded-lg bg-sky-950/60 ring-1 ring-sky-800/50 px-2.5 py-1.5 mb-3">
                <span className="h-1.5 w-1.5 rounded-full bg-sky-400 animate-pulse shrink-0" />
                <div className="flex flex-col leading-none">
                  <span className="font-mono text-[10px] font-bold text-sky-300">qwen3-embedding-0.6b</span>
                  <span className="text-[9px] text-slate-500 mt-0.5">Gömme Modeli</span>
                </div>
              </div>

              {/* Interactive chat model switcher */}
              <p className="text-[9px] font-bold uppercase tracking-widest text-slate-600 mb-1.5">Dil Modeli</p>
              <ModelSwitcher onSwitch={handleModelSwitch} />

              {/* Metrics */}
              <div className="flex flex-col gap-2.5 mt-3">
                {TELEMETRY.map(t => <TelemetryRow key={t.label} {...t} />)}
                <div className="flex items-center justify-between pt-1.5 border-t border-slate-800">
                  <span className="text-[10px] text-slate-500">Vektör Veri Tabanı</span>
                  <span className="flex items-center gap-1.5 font-mono text-[10px] font-semibold text-emerald-400">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />SQLite Active
                  </span>
                </div>
              </div>
            </SidebarSection>

            {/* C — Cyber security audit */}
            <SidebarSection icon={<LockIcon c="h-3 w-3 text-slate-500" />} title="Siber Güvenlik Denetimi">
              <div className="flex flex-col gap-2">
                {SECURITY_LOGS.map((line, i) => (
                  <div key={i} className="flex items-start gap-2 rounded-lg bg-slate-950/60 px-2.5 py-1.5 border border-slate-800/80">
                    <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500" />
                    <span className="font-mono text-[10px] leading-relaxed text-emerald-400/90 break-all">{line}</span>
                  </div>
                ))}
                <p className="mt-0.5 text-right font-mono text-[9px] text-slate-700">
                  {new Date().toLocaleTimeString("tr-TR")} — Nominal
                </p>
              </div>
            </SidebarSection>

            {/* D — Audit session history */}
            <SidebarSection icon={<HistoryIcon c="h-3 w-3 text-slate-500" />} title="Geçmiş Analiz Oturumları">
              <div className="flex flex-col gap-1.5">
                {AUDIT_SESSIONS.map(s => (
                  <button
                    key={s.id}
                    onClick={() => handleAuditClick(s.id)}
                    className={[
                      "w-full text-left rounded-lg px-3 py-2 border transition-all",
                      flashedAudit === s.id
                        ? "border-emerald-700 bg-emerald-950/50"
                        : "border-slate-800 bg-slate-950/40 hover:border-slate-700 hover:bg-slate-900",
                    ].join(" ")}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-mono text-[9px] text-slate-500">{s.date}</span>
                      <span className="rounded text-[8px] font-bold px-1.5 py-0.5 bg-slate-800 text-slate-400 ring-1 ring-slate-700">
                        #{s.id}
                      </span>
                    </div>
                    <p className="text-[10px] font-medium text-slate-300 mt-0.5">{s.label}</p>
                    {flashedAudit === s.id && (
                      <p className="text-[9px] text-emerald-400 mt-1 font-mono">✓ Oturum kaydı doğrulandı</p>
                    )}
                  </button>
                ))}
              </div>
            </SidebarSection>
          </div>
        </aside>

        {/* ── Right chat hub ────────────────────────────────────────────────── */}
        <main className="flex-1 min-w-0 bg-slate-900 p-4 flex flex-col overflow-hidden">

          {/* Runtime reconfiguration banner */}
          {runtimeBanner && (
            <div className="shrink-0 mb-3 flex items-center gap-3 rounded-xl border border-amber-800/60
                            bg-amber-950/60 px-4 py-2.5 text-xs text-amber-300 shadow-lg animate-pulse">
              <span className="text-base">⚠️</span>
              <div>
                <span className="font-bold">System:</span>{" "}
                Re-configuring local inference runtime to{" "}
                <span className="font-mono font-semibold text-amber-200">{runtimeBanner}</span>
                {" "}… Optimizing NPU/CPU matrix dimensions for banking-isolated data streams.
              </div>
            </div>
          )}

          {/* Floating chat card */}
          <div className="flex-1 flex flex-col min-h-0 rounded-2xl border border-slate-800/80 bg-slate-950 shadow-2xl overflow-hidden">

            {/* Card header */}
            <div className="shrink-0 px-5 py-3 border-b border-slate-800 bg-gradient-to-r from-slate-950 to-slate-900 flex items-center justify-between gap-4">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="relative shrink-0">
                  <span className="absolute inset-0 rounded-lg bg-emerald-500/15 blur-sm" />
                  <div className="relative flex h-8 w-8 items-center justify-center rounded-lg bg-slate-800 ring-1 ring-slate-700">
                    <ChatIcon c="h-4 w-4 text-emerald-400" />
                  </div>
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-bold text-white tracking-tight truncate">⚡ Kurumsal Güvenli Analiz Hattı</p>
                  <p className="text-[10px] text-slate-500 truncate mt-0.5">
                    Yüklenen finansal politikalar kapsamında tamamen yalıtılmış oturum.
                  </p>
                </div>
              </div>
              <div className="shrink-0 flex items-center gap-1.5 rounded-lg bg-slate-900 px-2.5 py-1.5 ring-1 ring-slate-800">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[10px] font-semibold text-slate-400 whitespace-nowrap">Yalıtılmış Oturum</span>
              </div>
            </div>

            {/* Chat content */}
            <div className="flex-1 flex flex-col min-h-0">
              <ChatSection />
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
