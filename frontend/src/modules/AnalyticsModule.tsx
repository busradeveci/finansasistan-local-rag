import { useEffect, useState } from "react"
import { getAnalytics, getTelemetry } from "@/api/client"
import type { AnalyticsPacket, TelemetryPacket } from "@/types/workstation"

export default function AnalyticsModule() {
  const [analytics, setAnalytics] = useState<AnalyticsPacket | null>(null)
  const [telemetry, setTelemetry] = useState<TelemetryPacket | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const poll = async () => {
      try {
        const [a, t] = await Promise.all([getAnalytics(), getTelemetry()])
        setAnalytics(a)
        setTelemetry(t)
      } catch {
        setAnalytics(null)
        setTelemetry(null)
      } finally {
        setLoading(false)
      }
    }
    poll()
    const t = setInterval(poll, 3000)
    return () => clearInterval(t)
  }, [])

  const perfCards = analytics
    ? [
        { label: "Queries Processed Today", value: String(analytics.queries_processed_today) },
        { label: "Avg Response Time", value: `${analytics.avg_response_ms} ms` },
        { label: "Avg Retrieval Time", value: `${analytics.avg_retrieval_ms} ms` },
        { label: "Avg Generation Time", value: `${analytics.avg_generation_ms} ms` },
        { label: "Embedding Latency", value: `${analytics.avg_embedding_ms} ms` },
        { label: "Context Tokens Accumulated", value: analytics.context_tokens_accumulated.toLocaleString() },
      ]
    : []

  const memPercent =
    telemetry?.memory.percent ??
    (telemetry
      ? Math.round((telemetry.memory.used_gb / telemetry.memory.total_gb) * 100)
      : 0)

  return (
    <div className="flex-1 overflow-y-auto fluent-scrollbar p-6 space-y-8 metric-display">
      <header>
        <h1 className="text-page-title text-navy-900">Analytics</h1>
        <p className="text-body-sm text-navy-700 mt-1">
          Real-time pipeline performance and system telemetry
        </p>
      </header>

      <section>
        <h2 className="text-section-title text-navy-900 mb-4">
          Performance
        </h2>
        {loading && perfCards.length === 0 ? (
          <p className="text-body-sm text-navy-700">Loading pipeline metrics…</p>
        ) : perfCards.length === 0 ? (
          <p className="text-body-sm text-navy-700">
            No query samples yet — metrics populate after the first chat request.
          </p>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
            {perfCards.map((c) => (
              <div key={c.label} className="ws-stat-card p-5">
                <p className="text-badge font-semibold uppercase tracking-wide text-navy-500">{c.label}</p>
                <p className="text-section-title text-navy-900 mt-2 tabular-nums">
                  {c.value}
                </p>
              </div>
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="text-section-title text-navy-900 mb-4">
          System Telemetry
        </h2>
        {loading && !telemetry ? (
          <p className="text-body-sm text-navy-700">Polling /api/telemetry…</p>
        ) : !telemetry ? (
          <p className="text-body-sm text-navy-700">
            Telemetry unavailable — ensure the backend is running on port 8000.
          </p>
        ) : (
          <div className="grid lg:grid-cols-2 gap-4">
            <div className="ws-card p-5 space-y-5">
              <UsageBar
                label="CPU Usage"
                percent={telemetry.cpu.percent}
                detail={`${Math.round(telemetry.cpu.percent)}% utilized`}
              />
              <UsageBar
                label="Memory"
                percent={memPercent}
                detail={`${telemetry.memory.used_gb} / ${telemetry.memory.total_gb} GB`}
              />
              <UsageBar
                label="GPU Usage"
                percent={telemetry.gpu.available ? (telemetry.gpu.percent ?? 0) : 0}
                detail={
                  telemetry.gpu.available
                    ? `${telemetry.gpu.percent ?? 0}% utilized`
                    : "N/A — CPU-only runtime"
                }
                inactive={!telemetry.gpu.available}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <TelCard label="Vector Engine" value={telemetry.vector_db.engine} />
              <TelCard label="Indexed Vectors" value={String(telemetry.vector_db.vectors)} />
              <TelCard label="Dimensions" value={`${telemetry.vector_db.dimensions}d`} />
              <TelCard label="Documents" value={String(telemetry.vector_db.documents)} />
            </div>
          </div>
        )}
      </section>
    </div>
  )
}

function UsageBar({
  label,
  percent,
  detail,
  inactive = false,
}: {
  label: string
  percent: number
  detail: string
  inactive?: boolean
}) {
  const clamped = Math.max(0, Math.min(100, Math.round(percent)))
  const fillColor =
    inactive ? "var(--ws-text-muted)" : clamped >= 85 ? "var(--ws-danger)" : clamped >= 60 ? "#CA5010" : "var(--ws-primary)"

  return (
    <div>
      <div className="flex items-baseline justify-between gap-2 mb-2">
        <p className="text-body-sm font-semibold text-navy-900">{label}</p>
        <p className="text-caption text-navy-700 tabular-nums">{detail}</p>
      </div>
      <div
        className="h-2.5 rounded-full overflow-hidden bg-white/40"
        role="progressbar"
        aria-valuenow={clamped}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={label}
      >
        <div
          className="h-full rounded-full fluent-transition"
          style={{
            width: inactive ? "0%" : `${clamped}%`,
            background: fillColor,
          }}
        />
      </div>
    </div>
  )
}

function TelCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="ws-stat-card p-4">
      <p className="text-badge font-semibold uppercase tracking-wide text-navy-500">{label}</p>
      <p className="text-card-title text-navy-900 mt-2 tabular-nums">{value}</p>
    </div>
  )
}
