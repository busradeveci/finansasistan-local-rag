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
  Activity,
  Waypoints,
  ScanEye,
} from "lucide-react"

import { CardHeading, LiveDot, Panel } from "@/components/workstation/overview/primitives"

const NOT_AVAILABLE = "Not available"
const NOT_REPORTED = "Not reported"

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

/* ── Status badge ─────────────────────────────────────────────────────── */

function StateBadge({
  tone,
  label,
  live,
}: {
  tone: "emerald" | "amber" | "rose" | "neutral"
  label: string
  live?: boolean
}) {
  const cls =
    tone === "emerald"
      ? "border-emerald-200/70 bg-emerald-50/80 text-emerald-700"
      : tone === "amber"
        ? "border-amber-200/70 bg-amber-50/80 text-amber-700"
        : tone === "rose"
          ? "border-rose-200/70 bg-rose-50/80 text-rose-600"
          : "border-white/80 bg-white/70 text-slate-400"
  const dot =
    tone === "emerald" ? "bg-emerald-500" : tone === "amber" ? "bg-amber-500" : tone === "rose" ? "bg-rose-500" : null
  return (
    <span
      className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10.5px] font-semibold ${cls}`}
    >
      {live ? (
        <LiveDot className="text-emerald-500" />
      ) : dot ? (
        <span className={`h-1.5 w-1.5 rounded-full ${dot}`} />
      ) : null}
      {label}
    </span>
  )
}

/* ── Group divider ────────────────────────────────────────────────────── */

function GroupLabel({ label }: { label: string }) {
  return (
    <div className="mb-2 flex items-center gap-2">
      <span className="vv-eyebrow">{label}</span>
      <span className="h-px flex-1 bg-white/60" />
    </div>
  )
}

/* ── Threat summary metric tile ───────────────────────────────────────── */

function ThreatMetric({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>
  label: string
  value: number | null
}) {
  return (
    <div className="vv-tile vv-tile--hover flex min-w-0 flex-col gap-1.5 px-3.5 py-3">
      <div className="flex items-center gap-1.5">
        <Icon className="h-3.5 w-3.5 shrink-0 text-slate-400" strokeWidth={1.9} />
        <span className="vv-eyebrow truncate">{label}</span>
      </div>
      {value != null ? (
        <span className="text-[19px] leading-tight tabular-nums font-semibold text-slate-700">
          {value.toLocaleString()}
        </span>
      ) : (
        <span className="text-[13px] font-normal leading-tight text-slate-400">{NOT_AVAILABLE}</span>
      )}
    </div>
  )
}

/* ── Threat / sanitization map row ────────────────────────────────────── */

function MapRow({ label, value }: { label: string; value: number | null }) {
  return (
    <div className="flex items-center justify-between gap-4 py-2.5 first:pt-0 last:pb-0">
      <span className="vv-eyebrow shrink-0">{label}</span>
      {value != null ? (
        <span className="text-right text-[13px] font-semibold tabular-nums text-slate-700">
          {value.toLocaleString()}
        </span>
      ) : (
        <span className="text-[12px] font-normal text-slate-400">{NOT_AVAILABLE}</span>
      )}
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════════════
   Security Center — enterprise Zero Trust console for the local RAG host.
   ═══════════════════════════════════════════════════════════════════════ */

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

  const riskTier = data?.risk_tier ?? null
  const groundingViolations = data ? ((data as any).grounding_violations ?? null) : null

  return (
    <div className="flex h-full min-h-0 w-full flex-col overflow-hidden p-4 sm:p-5 lg:p-6">
      <div className="mx-auto flex h-full min-h-0 w-full max-w-[1680px] flex-col gap-5">
        {/* Header ─────────────────────────────────────────────────────── */}
        <header className="flex flex-none flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <ShieldCheck className="h-[18px] w-[18px] shrink-0 text-slate-500" strokeWidth={1.9} />
            <div className="min-w-0">
              <h1 className="vv-title-section">Security Center</h1>
              <p className="vv-caption mt-0.5">
                Enterprise threat mitigation, Zero Trust architecture, and active telemetry.
              </p>
            </div>
          </div>
          {data ? (
            riskTier ? (
              <StateBadge tone="emerald" label={`${riskTier} Risk`} live />
            ) : (
              <StateBadge tone="emerald" label="Telemetry Active" live />
            )
          ) : (
            <StateBadge tone="amber" label={loading ? "Connecting…" : "Backend Pending"} />
          )}
        </header>

        <div className="fluent-scrollbar min-h-0 flex-1 overflow-y-auto pb-6">
          <div className="flex flex-col gap-5">
            {/* 1. Security Overview ───────────────────────────────────── */}
            <Panel className="p-5 sm:p-6" delay={0}>
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <CardHeading icon={ShieldCheck} title="Security Overview" />
                <span className="flex items-center gap-1.5 text-[11px] font-medium text-slate-400">
                  {loading && !data && <Activity className="h-3.5 w-3.5 animate-spin" />}
                  {data ? "Live security telemetry" : loading ? "Loading telemetry…" : NOT_AVAILABLE}
                </span>
              </div>

              <GroupLabel label="Security Status" />
              <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                <div className="vv-tile flex items-center gap-3 px-4 py-3">
                  <span className="vv-plate h-8 w-8">
                    <ShieldAlert className="h-4 w-4" strokeWidth={1.9} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="vv-eyebrow truncate">Total Security Risk Tier</div>
                    <div className="mt-0.5 truncate text-[14px] font-semibold text-slate-700">
                      {riskTier ?? NOT_AVAILABLE}
                    </div>
                  </div>
                  {riskTier && <StateBadge tone="emerald" label="Healthy" />}
                </div>

                <div className="vv-tile flex items-center gap-3 px-4 py-3">
                  <span className="vv-plate h-8 w-8">
                    <ShieldCheck className="h-4 w-4" strokeWidth={1.9} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="vv-eyebrow truncate">Active Controls</div>
                    <div className="mt-0.5 flex items-baseline gap-1.5">
                      <span className="text-[15px] font-semibold tabular-nums text-slate-700">
                        {activeCount}
                        <span className="text-slate-400"> / {PIPELINE_LAYERS.length}</span>
                      </span>
                    </div>
                  </div>
                  <StateBadge tone="emerald" label="Operational" />
                </div>
              </div>

              <div className="mt-5">
                <GroupLabel label="Threat Summary" />
              </div>
              <div className="grid grid-cols-2 gap-2.5 lg:grid-cols-4">
                <ThreatMetric icon={ShieldAlert} label="Threats Blocked" value={data?.threats_blocked ?? null} />
                <ThreatMetric icon={AlertTriangle} label="Injections Intercepted" value={data?.prompt_injections_blocked ?? null} />
                <ThreatMetric icon={FolderLock} label="Uploads Deflected" value={data?.uploads_rejected ?? null} />
                <ThreatMetric icon={EyeOff} label="Queries Sanitized" value={data?.sanitized_queries ?? null} />
              </div>
            </Panel>

            {/* 2. AI Security Pipeline ────────────────────────────────── */}
            <Panel className="p-5 sm:p-6" delay={70}>
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <CardHeading icon={Waypoints} title="AI Security Pipeline" />
                <span className="text-[11px] font-medium text-slate-400">Layered request-to-response defenses</span>
              </div>

              <div className="grid grid-cols-1 gap-2.5 lg:grid-cols-2">
                {PIPELINE_LAYERS.map((layer) => {
                  const enabled = data ? isLayerEnabled(layer.id, data) : null
                  const count = data ? getLayerCount(layer.countKey, data) : null
                  const Icon = layer.icon
                  return (
                    <div
                      key={layer.id}
                      className="vv-tile vv-tile--hover flex items-center gap-3 px-3.5 py-3"
                    >
                      <span className="vv-plate h-8 w-8">
                        <Icon className="h-4 w-4" strokeWidth={1.9} />
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-[13px] font-semibold text-slate-700">{layer.title}</div>
                        <p className="mt-0.5 text-[12px] font-medium leading-snug text-slate-400 line-clamp-2 sm:truncate">
                          {layer.description}
                        </p>
                      </div>
                      <div className="flex shrink-0 flex-col items-end gap-1.5">
                        <StateBadge
                          tone={enabled === null ? "neutral" : enabled ? "emerald" : "rose"}
                          label={enabled === null ? NOT_REPORTED : enabled ? "Active" : "Inactive"}
                        />
                        {layer.countKey && (
                          count !== null ? (
                            <span className="text-[11px] font-semibold tabular-nums text-slate-500">
                              {count.toLocaleString()}
                            </span>
                          ) : (
                            <span className="text-[10.5px] font-normal text-slate-400">{NOT_REPORTED}</span>
                          )
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </Panel>

            {/* 3. Global PII Redaction Categories ─────────────────────── */}
            <Panel className="overflow-hidden p-0" delay={140}>
              <button
                type="button"
                onClick={() => setPiiExpanded(!piiExpanded)}
                className="flex w-full items-center justify-between gap-3 px-5 py-3.5 text-left transition-colors hover:bg-white/45"
              >
                <div className="flex min-w-0 items-center gap-2.5">
                  <span className="vv-plate h-7 w-7">
                    <ScanEye className="h-[15px] w-[15px]" strokeWidth={1.9} />
                  </span>
                  <div className="min-w-0">
                    <h2 className="vv-title-card truncate">
                      Global PII Redaction Categories ({PII_CATEGORIES.length})
                    </h2>
                    <p className="vv-caption mt-0.5 truncate">
                      Automatic redaction applied uniformly across all documents and queries.
                    </p>
                  </div>
                </div>
                <span className="inline-flex shrink-0 items-center gap-1 rounded-full border border-white/85 bg-white/65 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.09em] text-slate-500 shadow-[0_1px_2px_rgba(16,32,64,0.04)]">
                  {piiExpanded ? "Collapse" : "Expand"}
                  {piiExpanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                </span>
              </button>

              {piiExpanded && (
                <div className="overflow-x-auto border-t border-white/60">
                  <table className="w-full border-collapse whitespace-nowrap text-left">
                    <thead className="sticky top-0 z-10 bg-white/55 backdrop-blur-md">
                      <tr>
                        <th className="border-b border-white/60 px-5 py-2.5 text-[10.5px] font-semibold uppercase tracking-[0.09em] text-slate-400">
                          Category
                        </th>
                        <th className="border-b border-white/60 px-5 py-2.5 text-[10.5px] font-semibold uppercase tracking-[0.09em] text-slate-400">
                          Examples / Scope
                        </th>
                        <th className="border-b border-white/60 px-5 py-2.5 text-right text-[10.5px] font-semibold uppercase tracking-[0.09em] text-slate-400">
                          Status
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {PII_CATEGORIES.map((cat) => (
                        <tr
                          key={cat.label}
                          className="border-b border-white/45 transition-colors duration-200 hover:bg-white/55"
                        >
                          <td className="px-5 py-2 text-[12.5px] font-semibold text-slate-700">{cat.label}</td>
                          <td className="px-5 py-2 text-[12px] text-slate-500">{cat.example}</td>
                          <td className="px-5 py-2 text-right">
                            <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200/70 bg-emerald-50/80 px-2.5 py-0.5 text-[10px] font-semibold text-emerald-700">
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
            </Panel>

            {/* 4. Threat & Sanitization Map ───────────────────────────── */}
            <Panel className="p-5 sm:p-6" delay={210}>
              <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                <CardHeading icon={Activity} title="Threat &amp; Sanitization Map" />
                <span className="text-[11px] font-medium text-slate-400">Cumulative interception counters</span>
              </div>
              <div className="grid grid-cols-1 gap-x-8 sm:grid-cols-2">
                <div className="divide-y divide-white/50">
                  <MapRow label="Sanitized Queries" value={data?.sanitized_queries ?? null} />
                  <MapRow label="Prompt Injection Attempts" value={data?.prompt_injections_blocked ?? null} />
                </div>
                <div className="divide-y divide-white/50">
                  <MapRow label="Rejected Uploads" value={data?.uploads_rejected ?? null} />
                  <MapRow label="Grounding Violations" value={groundingViolations} />
                </div>
              </div>
            </Panel>
          </div>
        </div>
      </div>
    </div>
  )
}
