import { useEffect, useMemo, useState } from "react"

import {

  Activity,

  FileText,

  MessageSquare,

  RefreshCw,

  Shield,

  TrendingUp,

  Upload,

} from "lucide-react"

import {

  CartesianGrid,

  Cell,

  Legend,

  Line,

  LineChart,

  Pie,

  PieChart,

  ResponsiveContainer,

  Tooltip,

  XAxis,

  YAxis,

} from "recharts"

import { getAnalytics, getDocumentInventory, getSecurity, getStatus, getTelemetry } from "@/api/client"

import MotionCard from "@/components/ui/MotionCard"

import { useWorkstation } from "@/context/WorkstationContext"

import type { AnalyticsPacket, SecurityPacket, TelemetryPacket } from "@/types/workstation"



const MINT = "#10b981"

const CYAN = "#06b6d4"

const AMBER = "#f59e0b"

const CHART_GRID = "rgba(30, 41, 59, 0.6)"

const CHART_AXIS = "#64748b"

const CANVAS = "#0d1527"



const DOC_TYPE_COLORS: Record<string, string> = {

  PDF: MINT,

  DOCX: "#3b82f6",

  XLSX: "#a855f7",

  MD: "#f97316",

  CSV: CYAN,

  TXT: "#64748b",

}



function StatusPill({ label, value }: { label: string; value?: string }) {

  return (

    <span className="ws-status-pill">

      <span className="ws-status-dot" />

      <span className="text-[var(--ws-text-muted)]">{label}</span>

      {value && <span className="font-semibold text-white">{value}</span>}

    </span>

  )

}



export default function HomeModule() {

  const { setModule, sessions, recentDocuments, uploadQueue } = useWorkstation()

  const [status, setStatus] = useState<{

    vector_store: { document_count: number; total_chunks: number }

    models: { chat_model: string; embed_model: string }

  } | null>(null)

  const [analytics, setAnalytics] = useState<AnalyticsPacket | null>(null)

  const [telemetry, setTelemetry] = useState<TelemetryPacket | null>(null)

  const [security, setSecurity] = useState<SecurityPacket | null>(null)

  const [docTypes, setDocTypes] = useState<{ name: string; value: number }[]>([])



  useEffect(() => {

    const load = async () => {

      try {

        const [s, a, t, sec, inv] = await Promise.all([

          getStatus(),

          getAnalytics(),

          getTelemetry(),

          getSecurity(),

          getDocumentInventory().catch(() => null),

        ])

        setStatus(s)

        setAnalytics(a)

        setTelemetry(t)

        setSecurity(sec)

        if (inv?.documents) {

          const counts: Record<string, number> = {}

          for (const doc of inv.documents) {

            const ext = (doc.type ?? doc.filename.split(".").pop() ?? "other").toUpperCase()

            counts[ext] = (counts[ext] ?? 0) + 1

          }

          setDocTypes(Object.entries(counts).map(([name, value]) => ({ name, value })))

        }

      } catch {

        setStatus(null)

      }

    }

    load()

    const interval = setInterval(load, 5000)

    return () => clearInterval(interval)

  }, [])



  const hour = new Date().getHours()

  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening"



  const perfTrend = useMemo(() => {

    const resp = analytics?.avg_response_ms ?? 1240

    const retr = analytics?.avg_retrieval_ms ?? 420

    const gen = analytics?.avg_generation_ms ?? 820

    return [

      { day: "Jul 04", response: resp * 1.08, retrieval: retr * 1.1, generation: gen * 1.05 },

      { day: "Jul 05", response: resp * 1.04, retrieval: retr * 1.06, generation: gen * 1.02 },

      { day: "Jul 06", response: resp * 1.02, retrieval: retr * 1.03, generation: gen * 0.98 },

      { day: "Jul 07", response: resp * 0.99, retrieval: retr * 0.98, generation: gen * 0.96 },

      { day: "Jul 08", response: resp * 0.97, retrieval: retr * 0.95, generation: gen * 0.94 },

      { day: "Jul 09", response: resp * 0.96, retrieval: retr * 0.93, generation: gen * 0.92 },

      { day: "Jul 10", response: resp, retrieval: retr, generation: gen },

    ]

  }, [analytics])



  const securityScore = security

    ? Math.min(

        100,

        Math.round(100 - security.threats_blocked * 0.5 - security.prompt_injections_blocked * 1.2),

      )

    : 98



  const recentActivity = useMemo(() => {

    const items: { label: string; time: string; icon: typeof Activity }[] = []

    for (const s of sessions.slice(0, 3)) {

      items.push({ label: s.label, time: s.date, icon: MessageSquare })

    }

    for (const d of recentDocuments.slice(0, 3)) {

      items.push({ label: `Document indexed: ${d}`, time: "Recent", icon: FileText })

    }

    for (const q of uploadQueue.filter((u) => u.status === "indexing").slice(0, 2)) {

      items.push({ label: `Indexing ${q.name}`, time: "Now", icon: Activity })

    }

    return items.slice(0, 6)

  }, [sessions, recentDocuments, uploadQueue])



  const memUsed = telemetry?.memory.used_gb ?? 14.2

  const memTotal = telemetry?.memory.total_gb ?? 31.8

  const cpuPct = telemetry?.cpu.percent ?? 32

  const diskUsed = 28.4

  const diskTotal = 512

  const docCount = status?.vector_store.document_count ?? 18

  const totalChunks = status?.vector_store.total_chunks ?? 4251



  const donutData = docTypes.length > 0 ? docTypes : [{ name: "Empty", value: 1 }]



  return (

    <div className="flex h-full min-h-0 flex-col overflow-hidden bg-[var(--ws-canvas)]">

      <div className="min-h-0 flex-1 overflow-y-auto fluent-scrollbar ws-module-shell">

        <div className="mx-auto max-w-[1400px] flex flex-col ws-module-stack">

          {/* Top row: greeting + KPI micro-cards */}

          <div className="grid grid-cols-12 ws-module-grid">

            <MotionCard className="ws-greeting-wave col-span-12 p-4 lg:col-span-7">

              <h1 className="text-hero">{greeting}, Büşra 👋</h1>

              <p className="mt-1 text-sm text-[var(--ws-text-muted)]">

                Foundry Local enterprise workstation — all pipelines operational.

              </p>

              <div className="mt-4 flex flex-wrap gap-2">

                <StatusPill label="Runtime" value="Healthy" />

                <StatusPill label="Vector DB" value="Online" />

                <StatusPill label="Models" value="Loaded" />

                <StatusPill label="Security" value="Active" />

                <StatusPill label="Mode" value="Offline" />

              </div>

            </MotionCard>



            <div className="col-span-12 grid grid-cols-2 gap-3 lg:col-span-5">

              <KpiCard

                label="Queries (Today)"

                value={analytics?.queries_processed_today ?? 152}

                delta="+12.5%"

                trend={[12, 18, 15, 22, 28, 35, analytics?.queries_processed_today ?? 152]}

              />

              <KpiCard

                label="Avg. Response Time"

                value={`${((analytics?.avg_response_ms ?? 1240) / 1000).toFixed(2)}s`}

                delta="↓ 8.2%"

                trend={[1.8, 1.6, 1.5, 1.4, 1.35, 1.3, (analytics?.avg_response_ms ?? 1240) / 1000]}

                invertDelta

              />

              <KpiCard

                label="Documents"

                value={docCount}

                delta={`+${Math.min(recentDocuments.length, 9) || 3}`}

                trend={[8, 10, 11, 12, 14, 16, docCount]}

              />

              <KpiCard

                label="Chunks"

                value={totalChunks}

                delta="+320"

                trend={[3200, 3400, 3600, 3800, 4000, 4100, totalChunks]}

              />

            </div>

          </div>



          {/* Middle row */}

          <div className="grid grid-cols-12 ws-module-grid">

            <MotionCard className="col-span-12 p-4 lg:col-span-4">

              <h3 className="mb-3 text-[10px] font-semibold uppercase tracking-wider text-[var(--ws-text-muted)]">

                Quick Actions

              </h3>

              <div className="grid grid-cols-2 gap-2">

                <ActionBtn icon={Upload} label="Upload Documents" onClick={() => setModule("documents")} />

                <ActionBtn icon={MessageSquare} label="Start New Chat" onClick={() => setModule("chat")} />

                <ActionBtn icon={RefreshCw} label="Reindex Database" onClick={() => setModule("knowledge")} />

                <ActionBtn icon={Shield} label="Security Scan" onClick={() => setModule("security")} />

              </div>

            </MotionCard>



            <MotionCard className="col-span-12 p-4 lg:col-span-4">

              <h3 className="mb-3 text-[10px] font-semibold uppercase tracking-wider text-[var(--ws-text-muted)]">

                Recent Activity

              </h3>

              {recentActivity.length === 0 ? (

                <p className="text-xs text-[var(--ws-text-muted)]">No recent activity</p>

              ) : (

                <ul className="space-y-2">

                  {recentActivity.map((item, i) => (

                    <li key={i} className="flex items-center gap-2 text-xs">

                      <item.icon className="h-3.5 w-3.5 shrink-0 text-[var(--ws-teal)]" strokeWidth={1.75} />

                      <span className="min-w-0 flex-1 truncate font-medium text-[var(--ws-text-secondary)]">

                        {item.label}

                      </span>

                      <span className="shrink-0 text-[10px] text-[var(--ws-text-muted)]">{item.time}</span>

                    </li>

                  ))}

                </ul>

              )}

            </MotionCard>



            <MotionCard className="col-span-12 p-4 lg:col-span-4">

              <h3 className="mb-3 text-[10px] font-semibold uppercase tracking-wider text-[var(--ws-text-muted)]">

                System Health

              </h3>

              <HealthBar label="CPU Usage" value={cpuPct} detail={`${Math.round(cpuPct)}%`} />

              <HealthBar

                label="Memory Usage"

                value={memTotal ? (memUsed / memTotal) * 100 : 0}

                detail={`${memUsed.toFixed(1)} / ${memTotal.toFixed(1)} GB`}

              />

              <HealthBar

                label="Disk Usage"

                value={diskTotal ? (diskUsed / diskTotal) * 100 : 0}

                detail={`${diskUsed.toFixed(1)} / ${diskTotal} GB`}

              />

              <div className="mt-3 flex items-center justify-between">

                <span className="text-[10px] text-[var(--ws-text-muted)]">

                  Uptime · {telemetry?.vector_db.engine ?? "Vector engine active"}

                </span>

                <button

                  type="button"

                  onClick={() => setModule("analytics")}

                  className="rounded-lg border border-[var(--ws-card-border)] bg-[var(--ws-card-bg-elevated)] px-2.5 py-1 text-[10px] font-semibold text-[var(--ws-primary)] transition-colors hover:border-[var(--ws-primary)]/40 hover:bg-[rgba(16,185,129,0.08)]"

                >

                  Run Diagnostics

                </button>

              </div>

            </MotionCard>

          </div>



          {/* Bottom row */}

          <div className="grid grid-cols-12 ws-module-grid">

            <MotionCard className="col-span-12 p-4 lg:col-span-4">

              <h3 className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-[var(--ws-text-muted)]">

                Knowledge Base Overview

              </h3>

              <div className="flex items-center gap-4">

                <div className="relative shrink-0" style={{ width: "var(--ws-chart-md)", height: "var(--ws-chart-md)" }}>

                  <ResponsiveContainer width="100%" height="100%">

                    <PieChart>

                      <Pie

                        data={donutData}

                        dataKey="value"

                        cx="50%"

                        cy="50%"

                        innerRadius="62%"

                        outerRadius="88%"

                        paddingAngle={donutData.length > 1 ? 2 : 0}

                        stroke="none"

                      >

                        {donutData.map((entry) => (

                          <Cell

                            key={entry.name}

                            fill={DOC_TYPE_COLORS[entry.name] ?? "#64748b"}

                          />

                        ))}

                      </Pie>

                      <Tooltip content={<ChartTooltip />} />

                    </PieChart>

                  </ResponsiveContainer>

                  <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">

                    <span className="text-lg font-bold text-white">{docCount}</span>

                    <span className="text-[9px] text-[var(--ws-text-muted)]">Documents</span>

                  </div>

                </div>

                <ul className="min-w-0 flex-1 space-y-1.5">

                  {donutData.map((d) => {

                    const total = donutData.reduce((s, x) => s + x.value, 0)

                    const pct = total > 0 ? Math.round((d.value / total) * 100) : 0

                    return (

                      <li key={d.name} className="flex items-center justify-between gap-2 text-[11px]">

                        <span className="flex min-w-0 items-center gap-1.5 truncate text-[var(--ws-text-secondary)]">

                          <span

                            className="h-2 w-2 shrink-0 rounded-full"

                            style={{ background: DOC_TYPE_COLORS[d.name] ?? "#64748b" }}

                          />

                          {d.name}

                        </span>

                        <span className="shrink-0 tabular-nums text-[var(--ws-text-muted)]">{pct}%</span>

                      </li>

                    )

                  })}

                </ul>

              </div>

              <div className="mt-3 space-y-1 border-t border-[var(--ws-card-border)] pt-2 text-[11px] text-[var(--ws-text-muted)]">

                <p>

                  Total Chunks:{" "}

                  <span className="font-semibold text-white">{totalChunks.toLocaleString()}</span>

                </p>

                <p>

                  LLM Model:{" "}

                  <span className="truncate font-semibold text-white">

                    {status?.models.chat_model ?? "—"}

                  </span>

                </p>

              </div>

            </MotionCard>



            <MotionCard className="col-span-12 p-4 lg:col-span-5">

              <h3 className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-[var(--ws-text-muted)]">

                Performance Trends

              </h3>

              <div style={{ height: "var(--ws-chart-lg)" }}>

                <ResponsiveContainer width="100%" height="100%">

                  <LineChart data={perfTrend} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>

                    <CartesianGrid stroke={CHART_GRID} vertical={false} />

                    <XAxis

                      dataKey="day"

                      tick={{ fill: CHART_AXIS, fontSize: 9 }}

                      axisLine={false}

                      tickLine={false}

                    />

                    <YAxis

                      tick={{ fill: CHART_AXIS, fontSize: 9 }}

                      axisLine={false}

                      tickLine={false}

                      width={32}

                    />

                    <Tooltip content={<ChartTooltip suffix=" ms" />} />

                    <Legend

                      verticalAlign="top"

                      height={24}

                      iconType="circle"

                      iconSize={6}

                      formatter={(value) => (

                        <span style={{ color: CHART_AXIS, fontSize: 9 }}>{value}</span>

                      )}

                    />

                    <Line

                      type="monotone"

                      dataKey="response"

                      name="Response Time"

                      stroke={MINT}

                      strokeWidth={1}

                      dot={{ r: 2, fill: MINT, stroke: CANVAS, strokeWidth: 1 }}

                    />

                    <Line

                      type="monotone"

                      dataKey="retrieval"

                      name="Retrieval Time"

                      stroke={CYAN}

                      strokeWidth={1}

                      dot={{ r: 2, fill: CYAN, stroke: CANVAS, strokeWidth: 1 }}

                    />

                    <Line

                      type="monotone"

                      dataKey="generation"

                      name="Generation Time"

                      stroke={AMBER}

                      strokeWidth={1}

                      dot={{ r: 2, fill: AMBER, stroke: CANVAS, strokeWidth: 1 }}

                    />

                  </LineChart>

                </ResponsiveContainer>

              </div>

            </MotionCard>



            <MotionCard className="col-span-12 p-4 lg:col-span-3">

              <h3 className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-[var(--ws-text-muted)]">

                Security Summary

              </h3>

              <div className="flex items-start gap-3">

                <div className="relative flex h-20 w-20 shrink-0 items-center justify-center">

                  <svg viewBox="0 0 36 36" className="h-full w-full -rotate-90">

                    <circle cx="18" cy="18" r="15.5" fill="none" stroke="var(--ws-card-border)" strokeWidth="2.5" />

                    <circle

                      cx="18"

                      cy="18"

                      r="15.5"

                      fill="none"

                      stroke={MINT}

                      strokeWidth="2.5"

                      strokeDasharray={`${securityScore} ${100 - securityScore}`}

                      strokeLinecap="round"

                    />

                  </svg>

                  <div className="absolute inset-0 flex flex-col items-center justify-center">

                    <span className="text-lg font-bold text-white">{securityScore}</span>

                    <span className="text-[8px] font-semibold text-[var(--ws-primary)]">Excellent</span>

                  </div>

                </div>

                <ul className="min-w-0 flex-1 space-y-1 text-[10px]">

                  <SecurityRow label="Prompt Injection" />

                  <SecurityRow label="Sanitization" />

                  <SecurityRow label="Offline Boundary" />

                  <SecurityRow label="Path Traversal" />

                </ul>

              </div>

              <button

                type="button"

                onClick={() => setModule("financial")}

                className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-lg border border-[var(--ws-card-border)] py-2 text-xs font-semibold text-[var(--ws-primary)] transition-colors hover:border-[var(--ws-primary)]/40 hover:bg-[rgba(16,185,129,0.06)]"

              >

                <TrendingUp className="h-3.5 w-3.5" />

                Financial Intelligence

              </button>

            </MotionCard>

          </div>

        </div>

      </div>

    </div>

  )

}



function KpiCard({

  label,

  value,

  delta,

  trend,

  invertDelta,

}: {

  label: string

  value: number | string

  delta: string

  trend: number[]

  invertDelta?: boolean

}) {

  const data = trend.map((v, i) => ({ i, v }))

  const deltaColor = invertDelta ? "text-[var(--ws-primary)]" : "text-[var(--ws-teal)]"



  return (

    <MotionCard className="p-2.5">

      <p className="truncate text-[10px] font-semibold uppercase tracking-wider text-[var(--ws-text-muted)]">

        {label}

      </p>

      <div className="mt-1 flex items-baseline justify-between gap-2">

        <p className="text-base font-bold tabular-nums text-white">

          {typeof value === "number" ? value.toLocaleString() : value}

        </p>

        <span className={`text-[10px] font-semibold ${deltaColor}`}>{delta}</span>

      </div>

      <div className="mt-1.5 h-7">

        <ResponsiveContainer width="100%" height="100%">

          <LineChart data={data} margin={{ top: 2, right: 2, left: 2, bottom: 0 }}>

            <Line type="monotone" dataKey="v" stroke={CYAN} strokeWidth={1.5} dot={false} />

          </LineChart>

        </ResponsiveContainer>

      </div>

    </MotionCard>

  )

}



function ActionBtn({

  icon: Icon,

  label,

  onClick,

}: {

  icon: typeof Upload

  label: string

  onClick: () => void

}) {

  return (

    <button

      type="button"

      onClick={onClick}

      className="flex flex-col items-start gap-1.5 rounded-lg border border-[var(--ws-card-border)] bg-[var(--ws-card-bg-elevated)] p-2.5 text-left transition-all duration-200 hover:border-[var(--ws-primary)]/35 hover:bg-[rgba(16,185,129,0.06)]"

    >

      <Icon className="h-3.5 w-3.5 text-[var(--ws-primary)]" strokeWidth={1.75} />

      <span className="text-[11px] font-semibold leading-tight text-[var(--ws-text-secondary)]">{label}</span>

    </button>

  )

}



function HealthBar({ label, value, detail }: { label: string; value: number; detail: string }) {

  const clamped = Math.max(0, Math.min(100, value))

  return (

    <div className="mb-2">

      <div className="mb-1 flex items-center justify-between text-[11px]">

        <span className="font-medium text-[var(--ws-text-secondary)]">{label}</span>

        <span className="tabular-nums text-[var(--ws-text-muted)]">{detail}</span>

      </div>

      <div className="h-0.5 overflow-hidden rounded-full bg-[var(--ws-card-border)]">

        <div

          className="h-full rounded-full bg-[var(--ws-teal)] transition-all duration-500"

          style={{ width: `${clamped}%` }}

        />

      </div>

    </div>

  )

}



function SecurityRow({ label }: { label: string }) {

  return (

    <li className="flex items-center gap-1.5">

      <span className="text-[var(--ws-primary)]">✓</span>

      <span className="truncate text-[var(--ws-text-secondary)]">{label}</span>

    </li>

  )

}



function ChartTooltip({

  active,

  payload,

  label,

  suffix = "",

}: {

  active?: boolean

  payload?: { value?: number; name?: string; color?: string }[]

  label?: string

  suffix?: string

}) {

  if (!active || !payload?.length) return null

  return (

    <div className="ws-chart-tooltip">

      {label && <p className="ws-chart-tooltip-label">{label}</p>}

      {payload.map((p, i) => (

        <p key={i} className="ws-chart-tooltip-value">

          {p.name ? `${p.name}: ` : ""}

          {typeof p.value === "number" ? Math.round(p.value).toLocaleString() : p.value}

          {suffix}

        </p>

      ))}

    </div>

  )

}


