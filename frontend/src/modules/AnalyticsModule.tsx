import { useEffect, useRef, useState } from "react"
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  RadialBar,
  RadialBarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import { getAnalytics, getSecurity, getTelemetry } from "@/api/client"
import type { AnalyticsPacket, SecurityPacket, TelemetryPacket } from "@/types/workstation"

const PRIMARY = "#1b1a1f"
const SECONDARY = "#6b6a68"
const GRID = "rgba(79, 78, 77, 0.2)"
const CANVAS = "#fcfcfc"
const DANGER = "#8b4a42"

const MAX_SPARK_POINTS = 24
const MAX_STORAGE_POINTS = 8
const MAX_RISK_SESSIONS = 5

type SparkPoint = { t: number; v: number }
type StoragePoint = { label: string; vectors: number }
type RiskSession = { session: string; score: number }

export default function AnalyticsModule() {
  const [analytics, setAnalytics] = useState<AnalyticsPacket | null>(null)
  const [telemetry, setTelemetry] = useState<TelemetryPacket | null>(null)
  const [security, setSecurity] = useState<SecurityPacket | null>(null)
  const [loading, setLoading] = useState(true)

  const [latencyHistory, setLatencyHistory] = useState<SparkPoint[]>([])
  const [queryRateHistory, setQueryRateHistory] = useState<SparkPoint[]>([])
  const [storageHistory, setStorageHistory] = useState<StoragePoint[]>([])
  const [riskSessions, setRiskSessions] = useState<RiskSession[]>([])

  const prevQueries = useRef(0)
  const pollTick = useRef(0)

  useEffect(() => {
    const poll = async () => {
      try {
        const [a, t, s] = await Promise.all([getAnalytics(), getTelemetry(), getSecurity()])
        setAnalytics(a)
        setTelemetry(t)
        setSecurity(s)

        pollTick.current += 1
        const tick = pollTick.current

        setLatencyHistory((prev) =>
          trimSpark([...prev, { t: tick, v: a.avg_response_ms || 0 }], MAX_SPARK_POINTS),
        )

        const queryDelta = Math.max(0, a.queries_processed_today - prevQueries.current)
        prevQueries.current = a.queries_processed_today
        setQueryRateHistory((prev) =>
          trimSpark([...prev, { t: tick, v: queryDelta }], MAX_SPARK_POINTS),
        )

        setStorageHistory((prev) => {
          const next = [
            ...prev,
            { label: formatStorageLabel(prev.length), vectors: t.vector_db.vectors },
          ]
          return next.slice(-MAX_STORAGE_POINTS)
        })

        if (queryDelta > 0) {
          const score = computeRiskScore(s, a)
          setRiskSessions((prev) => {
            const next = [
              ...prev,
              { session: `S${prev.length + 1}`, score },
            ]
            return next.slice(-MAX_RISK_SESSIONS)
          })
        }
      } catch {
        setAnalytics(null)
        setTelemetry(null)
        setSecurity(null)
      } finally {
        setLoading(false)
      }
    }

    poll()
    const interval = setInterval(poll, 3000)
    return () => clearInterval(interval)
  }, [])

  const memPercent =
    telemetry?.memory.percent ??
    (telemetry
      ? Math.round((telemetry.memory.used_gb / telemetry.memory.total_gb) * 100)
      : 0)

  const successCount = Math.max(
    0,
    (analytics?.queries_processed_today ?? 0) - (security?.threats_blocked ?? 0),
  )
  const failureCount = security?.threats_blocked ?? 0
  const queryOutcome = [
    { name: "Success", value: successCount || 1, color: PRIMARY },
    { name: "Failure", value: failureCount, color: DANGER },
  ].filter((d) => d.value > 0)

  const cpuGauge = [{ name: "CPU", value: telemetry?.cpu.percent ?? 0, fill: gaugeColor(telemetry?.cpu.percent ?? 0) }]
  const ramGauge = [{ name: "RAM", value: memPercent, fill: gaugeColor(memPercent) }]

  const latestLatency = analytics?.avg_response_ms ?? 0
  const latestQueryRate = queryRateHistory.at(-1)?.v ?? 0
  const hasData = analytics || telemetry

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden p-3 metric-display">
      <header className="shrink-0 pb-2">
        <h1 className="text-page-title text-midnight">Executive Intelligence</h1>
        <p className="mt-0.5 truncate text-sm font-medium text-stone">
          Real-time pipeline telemetry and risk posture
        </p>
      </header>

      <div className="flex h-[calc(100vh-160px)] min-h-0 flex-col gap-3 overflow-y-auto fluent-scrollbar">
        {/* ── Performance Overview ── */}
        <section className="shrink-0">
          <SectionLabel>Performance Overview</SectionLabel>
          {loading && !hasData ? (
            <EmptyState message="Loading pipeline metrics…" />
          ) : (
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              <SparkCard
                label="Latency"
                unit="ms"
                value={latestLatency}
                data={latencyHistory.length > 1 ? latencyHistory : seedSpark(latestLatency)}
                color={PRIMARY}
              />
              <SparkCard
                label="Query Frequency"
                unit="/poll"
                value={latestQueryRate}
                data={queryRateHistory.length > 1 ? queryRateHistory : seedSpark(latestQueryRate)}
                color={SECONDARY}
              />
            </div>
          )}
        </section>

        {/* ── System Health ── */}
        <section className="min-h-0 flex-1">
          <SectionLabel>System Health</SectionLabel>
          {loading && !telemetry ? (
            <EmptyState message="Polling system telemetry…" />
          ) : !telemetry ? (
            <EmptyState message="Telemetry unavailable — ensure the backend is running on port 8000." />
          ) : (
            <div className="grid min-h-[220px] grid-cols-1 gap-2 lg:grid-cols-3">
              <GlassPanel title="Query Success vs. Failure" className="min-h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={queryOutcome}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius="58%"
                      outerRadius="82%"
                      paddingAngle={queryOutcome.length > 1 ? 2 : 0}
                      stroke="none"
                    >
                      {queryOutcome.map((entry) => (
                        <Cell key={entry.name} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip content={<GlassTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
                <DonutLegend items={queryOutcome} />
              </GlassPanel>

              <GlassPanel title="Resource Utilization" className="min-h-[200px]">
                <div className="flex h-full items-center justify-around gap-2 px-1">
                  <GaugeRing label="CPU" percent={telemetry.cpu.percent} data={cpuGauge} />
                  <GaugeRing label="RAM" percent={memPercent} data={ramGauge} detail={`${telemetry.memory.used_gb} / ${telemetry.memory.total_gb} GB`} />
                </div>
              </GlassPanel>

              <GlassPanel title="Vector Database Storage" className="min-h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={storageHistory.length > 0 ? storageHistory : [{ label: "—", vectors: telemetry.vector_db.vectors }]}
                    margin={{ top: 4, right: 4, left: -20, bottom: 0 }}
                  >
                    <XAxis
                      dataKey="label"
                      tick={{ fill: SECONDARY, fontSize: 10 }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      tick={{ fill: SECONDARY, fontSize: 10 }}
                      axisLine={false}
                      tickLine={false}
                      width={36}
                    />
                    <Tooltip content={<GlassTooltip />} cursor={{ fill: "rgba(27, 26, 31, 0.04)" }} />
                    <Bar dataKey="vectors" radius={[2, 2, 0, 0]} maxBarSize={28}>
                      {storageHistory.map((_, i) => (
                        <Cell key={i} fill={i === storageHistory.length - 1 ? PRIMARY : "rgba(27, 26, 31, 0.35)"} />
                      ))}
                      {storageHistory.length === 0 && <Cell fill={PRIMARY} />}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
                <p className="mt-1 text-center text-[11px] text-stone">
                  {telemetry.vector_db.vectors.toLocaleString()} vectors · {telemetry.vector_db.documents} docs
                </p>
              </GlassPanel>
            </div>
          )}
        </section>

        {/* ── Risk Telemetry ── */}
        <section className="shrink-0 pb-1">
          <SectionLabel>Risk Telemetry</SectionLabel>
          <GlassPanel title="Risk Score Distribution — Last 5 Analysis Sessions" className="min-h-[160px]">
            {riskSessions.length === 0 ? (
              <div className="flex h-full min-h-[120px] items-center justify-center">
                <p className="text-sm text-stone">
                  Risk scores populate after analysis sessions complete.
                </p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={140}>
                <AreaChart
                  data={riskSessions}
                  margin={{ top: 8, right: 12, left: -16, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="riskGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={PRIMARY} stopOpacity={0.18} />
                      <stop offset="100%" stopColor={PRIMARY} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis
                    dataKey="session"
                    tick={{ fill: SECONDARY, fontSize: 11 }}
                    axisLine={{ stroke: GRID }}
                    tickLine={false}
                  />
                  <YAxis
                    domain={[0, 100]}
                    tick={{ fill: SECONDARY, fontSize: 10 }}
                    axisLine={false}
                    tickLine={false}
                    width={32}
                    ticks={[0, 25, 50, 75, 100]}
                  />
                  <Tooltip content={<GlassTooltip suffix=" pts" />} />
                  <Area
                    type="monotone"
                    dataKey="score"
                    stroke={PRIMARY}
                    strokeWidth={2}
                    fill="url(#riskGradient)"
                    dot={{ r: 3, fill: PRIMARY, stroke: CANVAS, strokeWidth: 2 }}
                    activeDot={{ r: 5, fill: PRIMARY, stroke: CANVAS, strokeWidth: 2 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
            {security && (
              <p className="mt-1 text-center text-[11px] text-stone">
                Current tier: {security.risk_tier}
              </p>
            )}
          </GlassPanel>
        </section>
      </div>
    </div>
  )
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="mb-1.5 text-section-title text-midnight">{children}</h2>
  )
}

function GlassPanel({
  title,
  children,
  className = "",
}: {
  title: string
  children: React.ReactNode
  className?: string
}) {
  return (
    <div className={`ws-stat-card ws-interactive flex flex-col overflow-hidden p-2.5 ${className}`}>
      <p className="mb-1 shrink-0 truncate text-[11px] font-semibold uppercase tracking-wide text-stone">
        {title}
      </p>
      <div className="min-h-0 flex-1">{children}</div>
    </div>
  )
}

function SparkCard({
  label,
  unit,
  value,
  data,
  color,
}: {
  label: string
  unit: string
  value: number
  data: SparkPoint[]
  color: string
}) {
  return (
    <div className="ws-stat-card ws-interactive flex min-h-[88px] flex-col p-2.5">
      <div className="mb-1 flex items-baseline justify-between gap-2">
        <p className="truncate text-[11px] font-semibold uppercase tracking-wide text-stone">{label}</p>
        <p className="shrink-0 text-sm font-semibold text-midnight tabular-nums">
          {value.toLocaleString(undefined, { maximumFractionDigits: 1 })}
          <span className="ml-0.5 text-[10px] font-medium text-stone">{unit}</span>
        </p>
      </div>
      <div className="min-h-[48px] flex-1">
        <ResponsiveContainer width="100%" height={48}>
          <LineChart data={data} margin={{ top: 4, right: 4, left: 4, bottom: 0 }}>
            <Line
              type="monotone"
              dataKey="v"
              stroke={color}
              strokeWidth={1.75}
              dot={false}
              activeDot={false}
              isAnimationActive={false}
            />
            <Tooltip content={<GlassTooltip />} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

function GaugeRing({
  label,
  percent,
  data,
  detail,
}: {
  label: string
  percent: number
  data: { name: string; value: number; fill: string }[]
  detail?: string
}) {
  const clamped = Math.max(0, Math.min(100, Math.round(percent)))
  return (
    <div className="flex flex-col items-center">
      <div className="relative h-[88px] w-[88px]">
        <ResponsiveContainer width="100%" height="100%">
          <RadialBarChart
            cx="50%"
            cy="50%"
            innerRadius="68%"
            outerRadius="100%"
            barSize={6}
            data={data}
            startAngle={210}
            endAngle={-30}
          >
            <RadialBar
              background={{ fill: GRID }}
              dataKey="value"
              cornerRadius={3}
              stroke="none"
            />
          </RadialBarChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-lg font-semibold text-midnight tabular-nums">{clamped}%</span>
        </div>
      </div>
      <p className="mt-0.5 text-[11px] font-semibold text-midnight">{label}</p>
      {detail && <p className="text-[10px] text-stone tabular-nums">{detail}</p>}
    </div>
  )
}

function DonutLegend({ items }: { items: { name: string; value: number; color: string }[] }) {
  return (
    <div className="mt-1 flex justify-center gap-3">
      {items.map((item) => (
        <div key={item.name} className="flex items-center gap-1">
          <span className="h-2 w-2 rounded-full" style={{ background: item.color }} />
          <span className="text-[10px] text-stone">
            {item.name} <span className="font-semibold text-midnight">{item.value}</span>
          </span>
        </div>
      ))}
    </div>
  )
}

function GlassTooltip({
  active,
  payload,
  label,
  suffix = "",
}: {
  active?: boolean
  payload?: { name?: string; value?: number; color?: string }[]
  label?: string
  suffix?: string
}) {
  if (!active || !payload?.length) return null
  return (
    <div
      className="rounded-sm border border-[#4f4e4d]/40 bg-white px-2 py-1 text-[11px] shadow-sm"
      style={{
        color: PRIMARY,
      }}
    >
      {label && <p className="mb-0.5 text-stone">{label}</p>}
      {payload.map((p, i) => (
        <p key={i} className="font-semibold tabular-nums">
          {p.name ? `${p.name}: ` : ""}
          {typeof p.value === "number" ? p.value.toLocaleString() : p.value}
          {suffix}
        </p>
      ))}
    </div>
  )
}

function EmptyState({ message }: { message: string }) {
  return <p className="text-sm text-stone">{message}</p>
}

function trimSpark(points: SparkPoint[], max: number): SparkPoint[] {
  return points.slice(-max)
}

function seedSpark(value: number): SparkPoint[] {
  return Array.from({ length: 8 }, (_, i) => ({ t: i, v: value }))
}

function formatStorageLabel(index: number): string {
  const labels = ["T-6", "T-5", "T-4", "T-3", "T-2", "T-1", "Now"]
  return labels[index] ?? `T${index}`
}

function gaugeColor(percent: number): string {
  if (percent >= 85) return DANGER
  if (percent >= 60) return SECONDARY
  return PRIMARY
}

function computeRiskScore(security: SecurityPacket, analytics: AnalyticsPacket): number {
  const total = Math.max(analytics.queries_processed_today, 1)
  const threatRate = (security.threats_blocked / total) * 100
  const injectionRate = (security.prompt_injections_blocked / total) * 100
  const tierBoost = security.risk_tier.toLowerCase().includes("elevated") ? 35 : 10
  return Math.min(100, Math.round(threatRate * 2 + injectionRate * 3 + tierBoost))
}
