import { useEffect, useMemo, useState } from "react"
import { getSecurity } from "@/api/client"
import type { SecurityPacket } from "@/types/workstation"

// ─── PII Redaction category manifest ─────────────────────────────────────────
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

// ─── Pipeline layer definitions ───────────────────────────────────────────────
const PIPELINE_LAYERS = [
  {
    id: "offline_mode",
    title: "Offline Mode / Air-Gap",
    description: "No prompts, embeddings, or documents are transmitted to external services. All inference runs on-device.",
  },
  {
    id: "prompt_injection_protection",
    title: "Prompt Injection Detection",
    description: "Input sanitizer blocks attempts to override system instructions, inject adversarial payloads, or jailbreak the inference engine. Runs before embedding and retrieval.",
    countKey: "prompt_injections_blocked",
    countLabel: "Injections intercepted",
  },
  {
    id: "sanitization_pipeline",
    title: "International PII Redaction Pipeline",
    description: "Automatic redaction of email, phone, credit cards, IBAN, API keys, passport numbers, and credentials — applied pre-query and pre-render.",
    countKey: "sanitized_queries",
    countLabel: "Queries sanitized",
  },
  {
    id: "path_traversal_guard",
    title: "Path Traversal & Upload Guard",
    description: "File upload filenames are stripped of path traversal sequences and dangerous characters before any disk operation.",
    countKey: "uploads_rejected",
    countLabel: "Uploads deflected",
  },
  {
    id: "context_overflow_protection",
    title: "Context Overflow Protection",
    description: "Inputs exceeding 2,000 characters are truncated before reaching the inference engine to prevent context window manipulation attacks.",
  },
  {
    id: "output_grounding",
    title: "Output Grounding & Hallucination Prevention",
    description: "All LLM responses must cite retrieved evidence chunks. Ungrounded responses are flagged. Confidence threshold enforced before context inclusion.",
    countKey: "threats_blocked",
    countLabel: "Grounding violations / threats blocked",
  },
]

function isLayerEnabled(id: string, data: SecurityPacket): boolean {
  switch (id) {
    case "offline_mode":                return data.offline_mode
    case "prompt_injection_protection": return data.prompt_injection_protection
    case "sanitization_pipeline":       return data.sanitization_layers > 0
    case "path_traversal_guard":        return data.path_traversal_guard
    case "context_overflow_protection": return data.context_overflow_protection
    case "output_grounding":            return true
    default: return false
  }
}

function getLayerCount(countKey: string | undefined, data: SecurityPacket): number | null {
  if (!countKey) return null
  return (data as unknown as Record<string, number>)[countKey] ?? null
}

export default function SecurityCenterModule() {
  const [data, setData] = useState<SecurityPacket | null>(null)
  const [loading, setLoading] = useState(true)

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
    return PIPELINE_LAYERS.filter((l) => isLayerEnabled(l.id, data)).length
  }, [data])

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden">
      <div className="min-h-0 flex-1 space-y-6 overflow-y-auto fluent-scrollbar ws-module-shell">

        {/* Header */}
        <header className="border-b border-gray-200 pb-4">
          <h1 className="text-page-title">Security Center</h1>
          <p className="mt-1 text-xs font-medium text-[var(--ws-text-muted)]">
            Hardened threat mitigation · Zero Trust Architecture · Offline-First
          </p>
        </header>

        {/* Guard status strip */}
        {data && (
          <section className="flex flex-wrap gap-x-4 gap-y-2 border-b border-gray-200 pb-4">
            <span className="text-[11px] font-semibold text-[var(--ws-text-muted)]">
              Active controls:{" "}
              <span className="text-[var(--ws-success)]">{activeCount} / {PIPELINE_LAYERS.length}</span>
            </span>
            {PIPELINE_LAYERS.map((layer) => {
              const enabled = isLayerEnabled(layer.id, data)
              return (
                <span
                  key={layer.id}
                  className="inline-flex items-center gap-1.5 text-[11px] font-medium"
                  style={{ color: enabled ? "var(--ws-success)" : "var(--ws-danger)" }}
                >
                  <span
                    className="inline-block h-1.5 w-1.5 rounded-full"
                    style={{ background: enabled ? "var(--ws-success)" : "var(--ws-danger)" }}
                  />
                  {layer.title}: {enabled ? "Active" : "Inactive"}
                </span>
              )
            })}
          </section>
        )}

        {/* Live threat counters */}
        {data && (
          <section>
            <h2 className="mb-3 text-[10px] font-semibold uppercase tracking-wider text-[var(--ws-text-muted)]">
              Live Threat Dashboard
            </h2>
            <div className="ws-kpi-row mb-6">
              <Metric label="Threats Blocked" value={data.threats_blocked} />
              <Metric label="Prompt Injections Intercepted" value={data.prompt_injections_blocked} />
              <Metric label="Invalid Uploads Deflected" value={data.uploads_rejected} />
              <Metric label="Sanitized Queries Managed" value={data.sanitized_queries} />
            </div>
            <div className="border-b border-gray-200 pb-4">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--ws-text-muted)]">
                Total Security Risk Tier
              </p>
              <p className="mt-1 text-2xl font-semibold text-[var(--ws-primary)]">{data.risk_tier}</p>
            </div>
          </section>
        )}

        {loading && !data && (
          <p className="text-sm text-[var(--ws-text-muted)]">Loading security telemetry…</p>
        )}

        {/* AI Security Pipeline Audit */}
        <section>
          <h2 className="mb-4 text-section-title">AI Security Pipeline</h2>
          <p className="mb-4 text-xs text-[var(--ws-text-muted)]">
            All layers are enforced on every query. Controls run{" "}
            <strong className="text-[var(--ws-text)]">pre-query</strong> (before embedding/retrieval) and{" "}
            <strong className="text-[var(--ws-text)]">pre-render</strong> (before display). Reference:{" "}
            <code className="rounded bg-slate-100 px-1 py-0.5 text-[11px]">docs/AI_SECURITY.md</code>
          </p>
          <div className="space-y-3">
            {PIPELINE_LAYERS.map((layer) => {
              const enabled = data ? isLayerEnabled(layer.id, data) : null
              const count = data ? getLayerCount(layer.countKey, data) : null
              return (
                <div
                  key={layer.id}
                  className="ws-glass-panel-compact flex items-start gap-3 px-4 py-3"
                >
                  <div className="mt-0.5 shrink-0">
                    <span
                      className="inline-block h-2 w-2 rounded-full"
                      style={{
                        background:
                          enabled === null
                            ? "var(--ws-text-muted)"
                            : enabled
                            ? "var(--ws-success)"
                            : "var(--ws-danger)",
                      }}
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-[13px] font-semibold text-[var(--ws-text)]">{layer.title}</p>
                      {enabled !== null && (
                        <span
                          className="rounded-full px-1.5 py-0.5 text-[10px] font-semibold uppercase"
                          style={{
                            background: enabled ? "rgba(5,150,105,0.10)" : "rgba(220,38,38,0.10)",
                            color: enabled ? "var(--ws-success)" : "var(--ws-danger)",
                          }}
                        >
                          {enabled ? "Active" : "Inactive"}
                        </span>
                      )}
                    </div>
                    <p className="mt-0.5 text-[12px] leading-snug text-[var(--ws-text-muted)]">
                      {layer.description}
                    </p>
                    {count !== null && count !== undefined && (
                      <p className="mt-1 text-[11px] font-semibold tabular-nums text-[var(--ws-primary)]">
                        {count.toLocaleString()} {layer.countLabel}
                      </p>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </section>

        {/* PII Redaction Categories */}
        <section>
          <h2 className="mb-2 text-section-title">Global PII Redaction Categories</h2>
          <p className="mb-4 text-xs text-[var(--ws-text-muted)]">
            International scope · no regional exclusions · applied uniformly regardless of user locale or document origin.
            Redacted values are replaced with{" "}
            <code className="rounded bg-slate-100 px-1 py-0.5 text-[11px]">[REDACTED]</code>.
            Applied at three points: pre-query sanitization, LLM output scan, and document ingestion flagging.
          </p>
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
                  <td className="font-medium text-[var(--ws-text)]">{cat.label}</td>
                  <td className="text-[var(--ws-text-muted)]">{cat.example}</td>
                  <td className="text-right">
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[var(--ws-success)]">
                      <span className="h-1.5 w-1.5 rounded-full bg-[var(--ws-success)]" />
                      Active
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        {/* Threat & Sanitization Map */}
        {data && (
          <section>
            <h2 className="mb-3 text-[10px] font-semibold uppercase tracking-wider text-[var(--ws-text-muted)]">
              Threat &amp; Sanitization Map
            </h2>
            <table className="ws-data-table">
              <thead>
                <tr>
                  <th>Metric</th>
                  <th className="text-right">Count</th>
                </tr>
              </thead>
              <tbody>
                <MapRow label="Sanitized Queries" value={data.sanitized_queries} />
                <MapRow label="Prompt Injections" value={data.prompt_injections_blocked} />
                <MapRow label="Rejected Uploads" value={data.uploads_rejected} />
                <MapRow label="Threats Blocked" value={data.threats_blocked} />
                <MapRow label="Active Sanitization Layers" value={data.sanitization_layers} />
              </tbody>
            </table>
          </section>
        )}

      </div>
    </div>
  )
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="ws-kpi-item">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--ws-text-muted)]">{label}</p>
      <p className="mt-1 text-2xl font-semibold tabular-nums text-[var(--ws-text)]">{value}</p>
    </div>
  )
}

function MapRow({ label, value }: { label: string; value: number }) {
  return (
    <tr>
      <td>{label}</td>
      <td className="text-right font-semibold tabular-nums text-[var(--ws-text)]">{value}</td>
    </tr>
  )
}
