import { useEffect, useMemo, useState } from "react"
import { getSecurity } from "@/api/client"
import type { SecurityPacket } from "@/types/workstation"
import {
  ServerOff,
  AlertTriangle,
  EyeOff,
  FolderLock,
  FileText,
  Database,
  ChevronDown,
  ChevronUp,
  ShieldCheck,
  ShieldAlert,
  Activity
} from "lucide-react"

const PII_CATEGORIES = [
  { label: "Email Addresses",                  example: "user@domain.com" },
  { label: "Phone Numbers (International)",    example: "+1 / +44 / +90 / all formats" },
  { label: "Credit / Debit Card Numbers",      example: "PAN, full card numbers" },
  { label: "Financial Account Identifiers",    example: "IBAN, SWIFT/BIC, routing numbers" },
  { label: "Government-Issued ID Numbers",     example: "National IDs, SSN, tax IDs" },
  { label: "Passport Numbers",                 example: "All issuing countries" },
  { label: "API Keys & Secrets",               example: "Bearer tokens, OAuth secrets, private keys" },
  { label: "Passwords & Credentials",          example: "Plaintext passwords, hashed credentials" },
]

const PIPELINE_LAYERS = [
  {
    id: "offline_mode",
    title: "Offline Mode / Air-Gap",
    description: "No external transmission. All inference runs entirely on-device.",
    icon: ServerOff,
  },
  {
    id: "prompt_injection_protection",
    title: "Prompt Injection Detection",
    description: "Blocks adversarial payloads and attempts to override system instructions.",
    countKey: "prompt_injections_blocked",
    icon: AlertTriangle,
  },
  {
    id: "sanitization_pipeline",
    title: "International PII Redaction",
    description: "Automatic redaction of sensitive identifiers pre-query and pre-render.",
    countKey: "sanitized_queries",
    icon: EyeOff,
  },
  {
    id: "path_traversal_guard",
    title: "Path Traversal & Upload Guard",
    description: "Filename sanitization to block path traversal and dangerous characters.",
    countKey: "uploads_rejected",
    icon: FolderLock,
  },
  {
    id: "context_overflow_protection",
    title: "Context Overflow Protection",
    description: "Truncates excessively large inputs to prevent context window manipulation.",
    countKey: "context_overflows_blocked",
    icon: FileText,
  },
  {
    id: "output_grounding",
    title: "Output Grounding & Hallucination Prevention",
    description: "Enforces evidence citation and confidence thresholds for all LLM responses.",
    countKey: "grounding_violations",
    icon: Database,
  },
]

function isLayerEnabled(id: string, data: SecurityPacket): boolean | null {
  switch (id) {
    case "offline_mode":                return data.offline_mode ?? null
    case "prompt_injection_protection": return data.prompt_injection_protection ?? null
    case "sanitization_pipeline":       return data.sanitization_layers > 0 ? true : null
    case "path_traversal_guard":        return data.path_traversal_guard ?? null
    case "context_overflow_protection": return data.context_overflow_protection ?? null
    case "output_grounding":            return null
    default: return false
  }
}

function getLayerCount(countKey: string | undefined, data: SecurityPacket): number | null {
  if (!countKey) return null
  const val = (data as any)[countKey]
  return val !== undefined && val !== null ? val : null
}

function MetricCard({ label, value }: { label: string; value: number | null }) {
  return (
    <div className="ws-glass-panel flex flex-col p-5 transition-all hover:bg-slate-50/50">
      <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--ws-text-muted)] mb-2">
        {label}
      </span>
      {value !== null ? (
        <span className="text-3xl font-semibold tabular-nums text-[var(--ws-text)]">
          {value.toLocaleString()}
        </span>
      ) : (
        <span className="text-[11px] font-medium text-[var(--ws-text-muted)] italic mt-2">
          Awaiting Backend Integration
        </span>
      )}
    </div>
  )
}

function CompactMetricGridItem({ label, value }: { label: string; value: number | null }) {
  return (
    <div className="ws-glass-panel-compact flex items-center justify-between p-4 hover:bg-slate-50/50 transition-colors">
      <span className="text-[13px] font-semibold text-[var(--ws-text)]">{label}</span>
      {value !== null ? (
        <span className="text-sm font-bold tabular-nums text-[var(--ws-primary)]">
          {value.toLocaleString()}
        </span>
      ) : (
        <span className="text-[11px] text-[var(--ws-text-muted)] italic">
          Awaiting Backend Integration
        </span>
      )}
    </div>
  )
}

export default function SecurityCenterModule() {
  const [data, setData] = useState<SecurityPacket | null>(null)
  const [loading, setLoading] = useState(true)
  const [piiExpanded, setPiiExpanded] = useState(false)

  useEffect(() => {
    const poll = () =>
      getSecurity()
        .then((d) => { setData(d); setLoading(false) })
        .catch(() => { setData(null); setLoading(false) })
    poll()
    const t = setInterval(poll, 5000)
    return () => clearInterval(t)
  }, [])

  const activeCount = useMemo(() => {
    if (!data) return 0
    return PIPELINE_LAYERS.filter((l) => isLayerEnabled(l.id, data) === true).length
  }, [data])

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden">
      <div className="min-h-0 flex-1 space-y-8 overflow-y-auto fluent-scrollbar ws-module-shell pb-10">

        {/* Header */}
        <header className="border-b border-gray-100 pb-5">
          <div className="flex items-center gap-3">
            <ShieldCheck className="h-7 w-7 text-[var(--ws-primary)]" />
            <h1 className="text-page-title text-[var(--ws-text)]">Security Center</h1>
          </div>
          <p className="mt-2 text-sm font-medium text-[var(--ws-text-muted)]">
            Enterprise threat mitigation, Zero Trust architecture, and active telemetry.
          </p>
        </header>

        {loading && !data && (
          <div className="flex items-center gap-2 text-sm text-[var(--ws-text-muted)]">
            <Activity className="h-4 w-4 animate-spin" />
            Loading security telemetry…
          </div>
        )}

        {data && (
          <>
            {/* Security Status */}
            <section className="space-y-4">
              <h2 className="text-section-title">Security Status</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="ws-glass-panel p-5 flex items-center justify-between">
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-wider text-[var(--ws-text-muted)]">Total Security Risk Tier</p>
                    <p className="mt-1.5 text-xl font-bold text-[var(--ws-primary)]">{data.risk_tier ?? "Awaiting Backend Integration"}</p>
                  </div>
                  <ShieldAlert className="h-10 w-10 text-[var(--ws-primary)] opacity-80" />
                </div>
                <div className="ws-glass-panel p-5 flex flex-col justify-center">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-[var(--ws-text-muted)] mb-2">Active Controls</p>
                  <div className="flex items-center gap-2">
                    <span className="text-2xl font-bold text-[var(--ws-success)]">{activeCount}</span>
                    <span className="text-sm font-medium text-[var(--ws-text-muted)]">/ {PIPELINE_LAYERS.length} Operational</span>
                  </div>
                </div>
              </div>
            </section>

            {/* Threat Dashboard */}
            <section className="space-y-4">
              <h2 className="text-section-title">Threat Dashboard</h2>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <MetricCard label="Threats Blocked" value={data.threats_blocked ?? null} />
                <MetricCard label="Injections Intercepted" value={data.prompt_injections_blocked ?? null} />
                <MetricCard label="Uploads Deflected" value={data.uploads_rejected ?? null} />
                <MetricCard label="Queries Sanitized" value={data.sanitized_queries ?? null} />
              </div>
            </section>
          </>
        )}

        {/* AI Security Pipeline */}
        <section className="space-y-4">
          <h2 className="text-section-title">AI Security Pipeline</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {PIPELINE_LAYERS.map((layer) => {
              const enabled = data ? isLayerEnabled(layer.id, data) : null
              const count = data ? getLayerCount(layer.countKey, data) : null
              const Icon = layer.icon
              return (
                <div key={layer.id} className="ws-glass-panel-compact flex flex-col p-5 transition-all hover:bg-slate-50/50">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="rounded-md bg-slate-100 p-2">
                        <Icon className="h-4 w-4 text-[var(--ws-primary)]" />
                      </div>
                      <span className="text-[13px] font-bold text-[var(--ws-text)]">{layer.title}</span>
                    </div>
                  </div>
                  <p className="text-xs font-medium text-[var(--ws-text-muted)] mb-5 flex-1 leading-relaxed">
                    {layer.description}
                  </p>
                  <div className="flex items-center justify-between border-t border-gray-100 pt-3 mt-auto">
                    <div className="flex items-center gap-1.5">
                      <span
                        className="inline-block h-2 w-2 rounded-full"
                        style={{
                          background: enabled === null ? "var(--ws-text-muted)" : enabled ? "var(--ws-success)" : "var(--ws-danger)"
                        }}
                      />
                      <span className="text-[11px] font-bold uppercase tracking-wider" style={{ color: enabled === null ? "var(--ws-text-muted)" : enabled ? "var(--ws-success)" : "var(--ws-danger)" }}>
                        {enabled === null ? "Awaiting Integration" : enabled ? "Active" : "Inactive"}
                      </span>
                    </div>
                    {layer.countKey && (
                      <span className="text-[11px] font-bold text-[var(--ws-text)] tabular-nums">
                        {count !== null ? count.toLocaleString() : <span className="text-[10px] text-[var(--ws-text-muted)] italic font-medium normal-case">Awaiting Integration</span>}
                      </span>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </section>

        {/* Global PII Redaction Categories */}
        <section className="space-y-3">
          <div
            className="flex items-center justify-between cursor-pointer ws-glass-panel p-5 hover:bg-slate-50/50 transition-colors"
            onClick={() => setPiiExpanded(!piiExpanded)}
          >
            <div>
              <h2 className="text-sm font-bold text-[var(--ws-text)]">Global PII Redaction Categories ({PII_CATEGORIES.length})</h2>
              <p className="text-xs font-medium text-[var(--ws-text-muted)] mt-1">Automatic redaction applied uniformly across all documents and queries.</p>
            </div>
            <div className="flex items-center gap-2 text-[var(--ws-text-muted)] text-[13px] font-bold uppercase tracking-wider bg-slate-100/50 px-3 py-1.5 rounded-md">
              {piiExpanded ? "Collapse" : "Expand"}
              {piiExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </div>
          </div>
          
          {piiExpanded && (
            <div className="ws-glass-panel overflow-hidden">
              <table className="ws-data-table">
                <thead>
                  <tr>
                    <th>Category</th>
                    <th>Examples / Scope</th>
                    <th className="text-right">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {PII_CATEGORIES.map((cat) => (
                    <tr key={cat.label}>
                      <td className="font-semibold text-[var(--ws-text)] text-[13px]">{cat.label}</td>
                      <td className="text-[var(--ws-text-muted)] text-[13px] font-medium">{cat.example}</td>
                      <td className="text-right">
                        <span className="inline-flex items-center justify-end gap-1.5 text-xs font-bold uppercase tracking-wider text-[var(--ws-success)]">
                          <span className="h-1.5 w-1.5 rounded-full bg-[var(--ws-success)]" />
                          Active
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* Threat & Sanitization Map */}
        <section className="space-y-4">
          <h2 className="text-section-title">Threat &amp; Sanitization Map</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <CompactMetricGridItem label="Sanitized Queries" value={data ? (data.sanitized_queries ?? null) : null} />
            <CompactMetricGridItem label="Prompt Injection Attempts" value={data ? (data.prompt_injections_blocked ?? null) : null} />
            <CompactMetricGridItem label="Rejected Uploads" value={data ? (data.uploads_rejected ?? null) : null} />
            <CompactMetricGridItem label="Grounding Violations" value={data ? ((data as any).grounding_violations ?? null) : null} />
          </div>
        </section>

      </div>
    </div>
  )
}
