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
    <div className="bg-white/90 backdrop-blur-md border border-slate-200/60 shadow-sm rounded-2xl flex flex-col p-5 transition-all hover:bg-slate-50 hover:shadow-md">
      <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">
        {label}
      </span>
      {value !== null ? (
        <span className="text-3xl font-bold tabular-nums text-slate-800 tracking-tight">
          {value.toLocaleString()}
        </span>
      ) : (
        <span className="text-[11px] font-medium text-slate-400 italic mt-2">
          Not available
        </span>
      )}
    </div>
  )
}

function CompactMetricGridItem({ label, value }: { label: string; value: number | null }) {
  return (
    <div className="bg-white/90 backdrop-blur-md border border-slate-200/60 shadow-sm rounded-2xl flex items-center justify-between p-4 hover:bg-slate-50 transition-colors">
      <span className="text-[13px] font-semibold text-slate-800">{label}</span>
      {value !== null ? (
        <span className="text-sm font-bold tabular-nums text-[#000080]">
          {value.toLocaleString()}
        </span>
      ) : (
        <span className="text-[11px] text-slate-400 italic">
          Not available
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
    <div className="flex h-full min-h-0 flex-col overflow-hidden bg-transparent p-4 sm:p-6 lg:p-8">
      <div className="min-h-0 flex-1 space-y-8 overflow-y-auto fluent-scrollbar pb-10">

        {/* Header */}
        <header className="border-b border-slate-200/60 pb-5 shrink-0">
          <div className="flex items-center gap-3">
            <ShieldCheck className="h-7 w-7 text-[#000080]" />
            <h1 className="text-xl font-bold tracking-tight text-slate-800">Security Center</h1>
          </div>
          <p className="mt-2 text-sm font-medium text-slate-500">
            Enterprise threat mitigation, Zero Trust architecture, and active telemetry.
          </p>
        </header>

        {loading && !data && (
          <div className="flex items-center gap-2 text-sm text-slate-500 font-medium shrink-0">
            <Activity className="h-4 w-4 animate-spin" />
            Loading security telemetry…
          </div>
        )}

        {data && (
          <>
            {/* Security Status */}
            <section className="space-y-4 shrink-0">
              <h2 className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Security Status</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white/90 backdrop-blur-md border border-slate-200/60 shadow-sm rounded-2xl p-5 flex items-center justify-between hover:shadow-md transition-shadow">
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total Security Risk Tier</p>
                    <p className="mt-1.5 text-xl font-bold text-[#000080]">{data.risk_tier ?? "Not available"}</p>
                  </div>
                  <ShieldAlert className="h-10 w-10 text-[#000080] opacity-80" />
                </div>
                <div className="bg-white/90 backdrop-blur-md border border-slate-200/60 shadow-sm rounded-2xl p-5 flex flex-col justify-center hover:shadow-md transition-shadow">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">Active Controls</p>
                  <div className="flex items-center gap-2">
                    <span className="text-3xl font-bold text-emerald-600">{activeCount}</span>
                    <span className="text-sm font-semibold text-slate-400">/ {PIPELINE_LAYERS.length} Operational</span>
                  </div>
                </div>
              </div>
            </section>

            {/* Threat Dashboard */}
            <section className="space-y-4 shrink-0">
              <h2 className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Threat Dashboard</h2>
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
        <section className="space-y-4 shrink-0">
          <h2 className="text-[11px] font-bold uppercase tracking-wider text-slate-400">AI Security Pipeline</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {PIPELINE_LAYERS.map((layer) => {
              const enabled = data ? isLayerEnabled(layer.id, data) : null
              const count = data ? getLayerCount(layer.countKey, data) : null
              const Icon = layer.icon
              return (
                <div key={layer.id} className="bg-white/90 backdrop-blur-md border border-slate-200/60 shadow-sm rounded-2xl flex flex-col p-5 transition-all hover:bg-slate-50 hover:shadow-md">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="rounded-xl bg-[#000080]/5 border border-[#000080]/10 p-2">
                        <Icon className="h-4 w-4 text-[#000080]" />
                      </div>
                      <span className="text-sm font-bold text-slate-800">{layer.title}</span>
                    </div>
                  </div>
                  <p className="text-[11px] font-medium text-slate-500 mb-5 flex-1 leading-relaxed">
                    {layer.description}
                  </p>
                  <div className="flex items-center justify-between border-t border-slate-100 pt-3 mt-auto">
                    <div className="flex items-center gap-1.5">
                      <span
                        className="inline-block h-2 w-2 rounded-full"
                        style={{
                          background: enabled === null ? "#cbd5e1" : enabled ? "#10b981" : "#ef4444"
                        }}
                      />
                      <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: enabled === null ? "#94a3b8" : enabled ? "#059669" : "#dc2626" }}>
                        {enabled === null ? "Not reported" : enabled ? "Active" : "Inactive"}
                      </span>
                    </div>
                    {layer.countKey && (
                      <span className="text-[11px] font-bold text-slate-700 tabular-nums">
                        {count !== null ? count.toLocaleString() : <span className="text-[10px] text-slate-400 italic font-medium normal-case">Not reported</span>}
                      </span>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </section>

        {/* Global PII Redaction Categories */}
        <section className="space-y-3 shrink-0">
          <div
            className="flex items-center justify-between cursor-pointer bg-white/90 backdrop-blur-md border border-slate-200/60 shadow-sm rounded-2xl p-5 hover:bg-slate-50 transition-colors"
            onClick={() => setPiiExpanded(!piiExpanded)}
          >
            <div>
              <h2 className="text-sm font-bold text-slate-800">Global PII Redaction Categories ({PII_CATEGORIES.length})</h2>
              <p className="text-[11px] font-medium text-slate-500 mt-1">Automatic redaction applied uniformly across all documents and queries.</p>
            </div>
            <div className="flex items-center gap-2 text-[#000080] text-[10px] font-bold uppercase tracking-wider bg-[#000080]/5 border border-[#000080]/10 px-3 py-1.5 rounded-full">
              {piiExpanded ? "Collapse" : "Expand"}
              {piiExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </div>
          </div>
          
          {piiExpanded && (
            <div className="bg-white/90 backdrop-blur-md border border-slate-200/60 shadow-sm rounded-2xl overflow-hidden">
              <table className="w-full text-left border-collapse whitespace-nowrap">
                <thead className="bg-slate-50 border-b border-slate-200/60">
                  <tr>
                    <th className="px-5 py-3 text-[10px] font-bold uppercase tracking-wider text-slate-400">Category</th>
                    <th className="px-5 py-3 text-[10px] font-bold uppercase tracking-wider text-slate-400">Examples / Scope</th>
                    <th className="px-5 py-3 text-[10px] font-bold uppercase tracking-wider text-slate-400 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {PII_CATEGORIES.map((cat) => (
                    <tr key={cat.label} className="hover:bg-slate-50/50">
                      <td className="px-5 py-3 font-semibold text-slate-800 text-xs">{cat.label}</td>
                      <td className="px-5 py-3 text-slate-500 text-[11px] font-medium">{cat.example}</td>
                      <td className="px-5 py-3 text-right">
                        <span className="inline-flex items-center justify-end gap-1.5 text-[10px] font-bold uppercase tracking-wider text-emerald-600">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
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
        <section className="space-y-4 shrink-0">
          <h2 className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Threat &amp; Sanitization Map</h2>
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
