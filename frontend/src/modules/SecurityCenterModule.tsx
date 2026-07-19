import { useEffect, useMemo, useState } from "react"
import { getSecurity } from "@/api/client"
import type { SecurityPacket } from "@/types/workstation"

export default function SecurityCenterModule() {
  const [data, setData] = useState<SecurityPacket | null>(null)

  useEffect(() => {
    const poll = () => getSecurity().then(setData).catch(() => setData(null))
    poll()
    const t = setInterval(poll, 5000)
    return () => clearInterval(t)
  }, [])

  const guardMap = useMemo(
    () =>
      data
        ? [
            { label: "Offline Mode", enabled: data.offline_mode },
            { label: "Prompt Injection Protection", enabled: data.prompt_injection_protection },
            { label: "Sanitization Pipeline", enabled: data.sanitization_layers > 0 },
            { label: "Path Traversal Guard", enabled: data.path_traversal_guard },
            { label: "Context Overflow Protection", enabled: data.context_overflow_protection },
          ]
        : [],
    [data],
  )

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden">
      <div className="min-h-0 flex-1 space-y-6 overflow-y-auto fluent-scrollbar ws-module-shell">
        <header className="border-b border-gray-200 pb-4">
          <h1 className="text-page-title">Security Center</h1>
          <p className="text-xs font-medium text-[var(--ws-text-muted)]">
            Hardened threat mitigation and audit readouts
          </p>
        </header>

        <section className="flex flex-wrap gap-x-4 gap-y-2 border-b border-gray-200 pb-4">
          {guardMap.map((g) => (
            <span
              key={g.label}
              className="inline-flex items-center gap-1.5 text-[11px] font-medium"
              style={{
                color: g.enabled ? "var(--ws-success)" : "var(--ws-danger)",
              }}
            >
              <span
                className="inline-block h-1.5 w-1.5 rounded-full"
                style={{ background: g.enabled ? "var(--ws-success)" : "var(--ws-danger)" }}
              />
              {g.label}: {g.enabled ? "Enabled" : "Disabled"}
            </span>
          ))}
          {data && (
            <span className="text-[11px] font-medium text-[var(--ws-text-secondary)]">
              Sanitization: {data.sanitization_layers} Active Layers
            </span>
          )}
        </section>

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

            <div className="mt-6">
              <p className="mb-3 text-[10px] font-semibold uppercase tracking-wider text-[var(--ws-text-muted)]">
                Threat & Sanitization Map
              </p>
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
                  <MapRow label="Sanitization Layers" value={data.sanitization_layers} />
                </tbody>
              </table>
            </div>
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
