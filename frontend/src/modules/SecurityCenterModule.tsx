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
    <div className="flex h-full min-h-0 flex-col overflow-hidden bg-[var(--ws-canvas)]">
      <div className="min-h-0 flex-1 space-y-3 overflow-y-auto fluent-scrollbar ws-module-shell">
        <header>
          <h1 className="text-page-title text-white">Security Center</h1>
          <p className="text-xs font-medium text-[var(--ws-text-muted)]">
            Hardened threat mitigation and audit readouts
          </p>
        </header>

        <section className="flex flex-wrap gap-2">
          {guardMap.map((g) => (
            <span
              key={g.label}
              className="rounded-full border px-2.5 py-1 text-[11px] font-medium"
              style={{
                color: g.enabled ? "var(--ws-primary)" : "var(--ws-danger)",
                borderColor: g.enabled ? "rgba(16, 185, 129, 0.25)" : "rgba(239, 68, 68, 0.25)",
                background: g.enabled ? "rgba(16, 185, 129, 0.08)" : "rgba(239, 68, 68, 0.08)",
              }}
            >
              <span className="mr-1.5 inline-block h-1.5 w-1.5 rounded-full bg-current" />
              {g.label}: {g.enabled ? "Enabled" : "Disabled"}
            </span>
          ))}
          {data && (
            <span className="rounded-full border border-[var(--ws-card-border)] bg-[var(--ws-card-bg)] px-2.5 py-1 text-[11px] font-medium text-[var(--ws-text-secondary)]">
              Sanitization: {data.sanitization_layers} Active Layers
            </span>
          )}
        </section>

        {data && (
          <section>
            <h2 className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-[var(--ws-text-muted)]">
              Live Threat Dashboard
            </h2>
            <div className="grid grid-cols-12 gap-3">
              <Metric label="Threats Blocked" value={data.threats_blocked} className="col-span-6 lg:col-span-4" />
              <Metric label="Prompt Injections Intercepted" value={data.prompt_injections_blocked} className="col-span-6 lg:col-span-4" />
              <Metric label="Invalid Uploads Deflected" value={data.uploads_rejected} className="col-span-6 lg:col-span-4" />
              <Metric label="Sanitized Queries Managed" value={data.sanitized_queries} className="col-span-6 lg:col-span-4" />
              <div className="ws-card col-span-12 p-3 lg:col-span-8">
                <p className="text-[10px] font-medium uppercase text-[var(--ws-text-muted)]">
                  Total Security Risk Tier
                </p>
                <p className="mt-1 text-lg font-semibold text-[var(--ws-primary)]">{data.risk_tier}</p>
              </div>
              <div className="ws-card col-span-12 p-3">
                <p className="mb-1.5 text-[10px] font-medium uppercase text-[var(--ws-text-muted)]">
                  Threat & Sanitization Map
                </p>
                <div className="grid gap-1.5 text-[11px] sm:grid-cols-2 lg:grid-cols-3">
                  <MapCell label="Sanitized Queries" value={data.sanitized_queries} />
                  <MapCell label="Prompt Injections" value={data.prompt_injections_blocked} />
                  <MapCell label="Rejected Uploads" value={data.uploads_rejected} />
                  <MapCell label="Threats Blocked" value={data.threats_blocked} />
                  <MapCell label="Sanitization Layers" value={data.sanitization_layers} />
                </div>
              </div>
            </div>
          </section>
        )}
      </div>
    </div>
  )
}

function Metric({ label, value, className = "" }: { label: string; value: number; className?: string }) {
  return (
    <div className={`ws-card p-3 ${className}`}>
      <p className="text-[10px] font-medium uppercase text-[var(--ws-text-muted)]">{label}</p>
      <p className="mt-1 text-2xl font-semibold text-white">{value}</p>
    </div>
  )
}

function MapCell({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-[var(--ws-card-border)] bg-[var(--ws-card-bg-elevated)] px-2 py-1.5">
      <p className="text-[10px] font-medium text-[var(--ws-text-muted)]">{label}</p>
      <p className="text-[13px] font-semibold text-white">{value}</p>
    </div>
  )
}
