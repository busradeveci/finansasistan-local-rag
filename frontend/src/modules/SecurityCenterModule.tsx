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
    [data]
  )

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden">
      <div className="min-h-0 flex-1 overflow-y-auto fluent-scrollbar p-4 space-y-4">
      <header>
        <h1 className="text-[18px] font-semibold">Security Center</h1>
        <p className="text-[12px] font-medium text-[var(--ws-text-secondary)]">
          Hardened threat mitigation and audit readouts
        </p>
      </header>

      <section className="flex flex-wrap gap-2">
        {guardMap.map((g) => (
          <span
            key={g.label}
            className="px-2.5 py-1 rounded-sm text-[11px] font-medium border"
            style={{
              color: g.enabled ? "var(--ws-success)" : "var(--ws-danger)",
              borderColor: g.enabled ? "rgba(16,124,16,0.25)" : "rgba(209,52,56,0.25)",
              background: g.enabled ? "rgba(16,124,16,0.06)" : "rgba(209,52,56,0.06)",
            }}
          >
            {g.label}: {g.enabled ? "Enabled" : "Disabled"}
          </span>
        ))}
        {data && (
          <span className="px-2.5 py-1 rounded-sm text-[11px] font-medium border" style={{ borderColor: "var(--ws-border)" }}>
            Sanitization: {data.sanitization_layers} Active Layers
          </span>
        )}
      </section>

      {data && (
        <section>
          <h2 className="text-[11px] font-semibold uppercase tracking-wide text-[var(--ws-text-secondary)] mb-2">
            Live Threat Dashboard
          </h2>
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-2">
            <Metric label="Threats Blocked" value={data.threats_blocked} />
            <Metric label="Prompt Injections Intercepted" value={data.prompt_injections_blocked} />
            <Metric label="Invalid Uploads Deflected" value={data.uploads_rejected} />
            <Metric label="Sanitized Queries Managed" value={data.sanitized_queries} />
            <div className="ws-card p-3 col-span-2">
              <p className="text-[10px] font-medium uppercase text-[var(--ws-text-secondary)]">Total Security Risk Tier</p>
              <p className="text-[18px] font-semibold mt-1" style={{ color: "var(--ws-success)" }}>
                {data.risk_tier}
              </p>
            </div>
            <div className="ws-card p-3 col-span-2 lg:col-span-3">
              <p className="text-[10px] font-medium uppercase text-[var(--ws-text-secondary)] mb-1.5">Threat & Sanitization Map</p>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-1.5 text-[11px]">
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

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="ws-card p-3">
      <p className="text-[10px] font-medium uppercase text-[var(--ws-text-secondary)]">{label}</p>
      <p className="text-[24px] font-semibold mt-1 text-[var(--ws-text)]">{value}</p>
    </div>
  )
}

function MapCell({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-sm border border-solid px-2 py-1.5" style={{ borderColor: "var(--ws-border)", background: "rgba(0,0,0,0.01)" }}>
      <p className="text-[10px] font-medium text-[var(--ws-text-secondary)]">{label}</p>
      <p className="text-[13px] font-semibold text-[var(--ws-text)]">{value}</p>
    </div>
  )
}
