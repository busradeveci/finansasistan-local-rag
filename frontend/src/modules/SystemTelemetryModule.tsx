import React, { useState, useEffect } from "react"
import {
  Activity,
  Cpu,
  HardDrive,
  Network,
  Server,
  Thermometer,
  Clock,
  Wifi,
  Monitor,
  Layers,
  ScrollText,
  Inbox,
} from "lucide-react"

import { CardHeading, LiveDot, Panel } from "@/components/workstation/overview/primitives"

const NOT_AVAILABLE = "Not available"

/* ── Status badge ─────────────────────────────────────────────────────── */

function StateBadge({
  tone,
  label,
  live,
}: {
  tone: "emerald" | "amber"
  label: string
  live?: boolean
}) {
  if (tone === "emerald") {
    return (
      <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-emerald-200/70 bg-emerald-50/80 px-2.5 py-1 text-[10.5px] font-semibold text-emerald-700">
        {live ? <LiveDot className="text-emerald-500" /> : <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />}
        {label}
      </span>
    )
  }
  return (
    <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-amber-200/70 bg-amber-50/80 px-2.5 py-1 text-[10.5px] font-semibold text-amber-700">
      <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
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

/* ── Metric tile ──────────────────────────────────────────────────────── */

function MetricTile({
  icon: Icon,
  label,
  value,
  sub,
  compact,
}: {
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>
  label: string
  value: string | null
  sub?: string
  compact?: boolean
}) {
  const available = value != null
  return (
    <div className="vv-tile vv-tile--hover flex min-w-0 flex-col gap-1.5 px-3.5 py-3">
      <div className="flex items-center gap-1.5">
        <Icon className="h-3.5 w-3.5 shrink-0 text-slate-400" strokeWidth={1.9} />
        <span className="vv-eyebrow truncate">{label}</span>
      </div>
      {available ? (
        <span
          className={`${compact ? "text-[13px]" : "text-[17px]"} leading-tight tabular-nums font-semibold text-slate-700`}
        >
          {value}
        </span>
      ) : (
        <span className="text-[13px] font-normal leading-tight text-slate-400">{NOT_AVAILABLE}</span>
      )}
      {sub && <span className="text-[10.5px] font-medium leading-snug text-slate-400">{sub}</span>}
    </div>
  )
}

/* ── Timeline region (honest empty state) ─────────────────────────────── */

function TimelineRegion({ title }: { title: string }) {
  return (
    <div className="vv-tile flex flex-col gap-2 px-3.5 py-3">
      <span className="vv-eyebrow">{title}</span>
      <div className="relative flex h-24 items-center justify-center overflow-hidden rounded-xl border border-white/70 bg-white/40">
        <span className="absolute inset-x-4 bottom-7 h-px bg-slate-200/60" aria-hidden="true" />
        <span className="text-[10.5px] font-medium text-slate-400">No historical data</span>
      </div>
    </div>
  )
}

/* ── Stat row (Storage / Network) ─────────────────────────────────────── */

function StatRow({
  label,
  value,
  mono,
}: {
  label: string
  value: React.ReactNode
  mono?: boolean
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-2.5 first:pt-0 last:pb-0">
      <span className="vv-eyebrow shrink-0">{label}</span>
      {value != null && value !== "" ? (
        <span
          className={`min-w-0 truncate text-right font-semibold text-slate-700 ${
            mono ? "font-mono text-[11.5px]" : "text-[12.5px] tabular-nums"
          }`}
          title={mono && typeof value === "string" ? value : undefined}
        >
          {value}
        </span>
      ) : (
        <span className="text-[12px] font-normal text-slate-400">{NOT_AVAILABLE}</span>
      )}
    </div>
  )
}

function StatusPill({ tone, label }: { tone: "emerald" | "slate"; label: string }) {
  const cls =
    tone === "emerald"
      ? "border-emerald-200/70 bg-emerald-50/80 text-emerald-700"
      : "border-white/80 bg-white/70 text-slate-500"
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[10.5px] font-semibold ${cls}`}>
      {tone === "emerald" && <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />}
      {label}
    </span>
  )
}

/* ── Log level badge ──────────────────────────────────────────────────── */

function LevelBadge({ level }: { level?: string }) {
  const l = (level || "").toUpperCase()
  let cls = "border-white/80 bg-white/70 text-slate-500"
  if (l.includes("WARN")) cls = "border-amber-200/70 bg-amber-50/80 text-amber-700"
  else if (l.includes("ERROR") || l.includes("CRIT") || l.includes("FAIL"))
    cls = "border-rose-200/70 bg-rose-50/80 text-rose-600"
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.06em] ${cls}`}
    >
      {level}
    </span>
  )
}

/* ═══════════════════════════════════════════════════════════════════════
   System Telemetry — operational console for the local workstation host.
   ═══════════════════════════════════════════════════════════════════════ */

export default function SystemTelemetryModule() {
  const [activeTab, setActiveTab] = useState("All")
  const tabs = ["All", "System", "Runtime", "Storage", "Security"]

  const [telemetry, setTelemetry] = useState<any>(null)

  useEffect(() => {
    const fetchTelemetry = async () => {
      try {
        const res = await fetch("http://127.0.0.1:8000/api/v1/telemetry/system")
        if (res.ok) {
          const data = await res.json()
          setTelemetry(data)
        }
      } catch (err) {
        // Honest data integrity: do not simulate on error
      }
    }

    fetchTelemetry()
    const interval = setInterval(fetchTelemetry, 3000)
    return () => clearInterval(interval)
  }, [])

  const logs = telemetry?.logs || []
  const filteredLogs = logs.filter((log: any) => {
    if (activeTab === "All") return true
    const tabLower = activeTab.toLowerCase()
    return log.level?.toLowerCase() === tabLower || log.component?.toLowerCase().includes(tabLower)
  })

  const cpuUsage = telemetry?.cpu?.percent != null ? `${telemetry.cpu.percent}%` : null
  const ramUsage = telemetry?.memory?.percent != null ? `${telemetry.memory.percent}%` : null
  const diskUsage = telemetry?.storage?.percent != null ? `${telemetry.storage.percent}%` : null
  const uptime = telemetry?.system?.uptime ?? null
  const cpuTemp = telemetry?.cpu?.temperature != null ? `${telemetry.cpu.temperature}°C` : null
  const gpuUsage = telemetry?.gpu?.percent != null ? `${telemetry.gpu.percent}%` : null
  const vramUsage = telemetry?.gpu?.vram != null ? `${telemetry.gpu.vram} GB` : null
  const diskIo =
    telemetry?.storage?.read_mbps != null
      ? `${telemetry.storage.read_mbps} MB/s / ${telemetry.storage.write_mbps} MB/s`
      : null
  const netIo =
    telemetry?.network?.bytes_sent_sec != null
      ? `${telemetry.network.bytes_sent_sec} B/s / ${telemetry.network.bytes_recv_sec} B/s`
      : null

  const offlineMode =
    telemetry?.network?.offline_mode != null ? (telemetry.network.offline_mode ? "Active" : "Inactive") : null
  const localhostEndpoint = telemetry?.network?.localhost_endpoint ?? null
  const activeConnections = telemetry?.network?.active_connections ?? null
  const zeroOutbound =
    telemetry?.network?.zero_outbound != null ? (telemetry.network.zero_outbound ? "Verified" : "Unverified") : null

  return (
    <div className="flex h-full min-h-0 w-full flex-col overflow-hidden p-4 sm:p-5 lg:p-6">
      <div className="mx-auto flex h-full min-h-0 w-full max-w-[1680px] flex-col gap-5">
        {/* Header ─────────────────────────────────────────────────────── */}
        <header className="flex flex-none flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <span className="vv-plate h-8 w-8">
              <Activity className="h-[16px] w-[16px]" strokeWidth={1.9} />
            </span>
            <div className="min-w-0">
              <h1 className="vv-title-section">System Telemetry</h1>
              <p className="vv-caption mt-0.5">
                Monitor the health and operational status of the local workstation hosting the Enterprise Local RAG
                platform.
              </p>
            </div>
          </div>
          {telemetry ? (
            <StateBadge tone="emerald" label="Live Telemetry" live />
          ) : (
            <StateBadge tone="amber" label="Backend Pending" />
          )}
        </header>

        <div className="fluent-scrollbar min-h-0 flex-1 overflow-y-auto pb-6">
          <div className="flex flex-col gap-5">
            {/* 1. Machine Health ──────────────────────────────────────── */}
            <Panel className="p-5 sm:p-6" delay={0}>
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <CardHeading icon={Server} title="Machine Health" />
                <span className="text-[11px] font-medium text-slate-400">
                  {telemetry ? "Live workstation metrics" : NOT_AVAILABLE}
                </span>
              </div>

              <GroupLabel label="System Resources" />
              <div className="grid grid-cols-2 gap-2.5 md:grid-cols-4">
                <MetricTile icon={Cpu} label="CPU Usage" value={cpuUsage} />
                <MetricTile icon={Activity} label="RAM Usage" value={ramUsage} />
                <MetricTile icon={HardDrive} label="Disk Usage" value={diskUsage} />
                <MetricTile icon={Clock} label="System Uptime" value={uptime} />
              </div>

              <div className="mt-5">
                <GroupLabel label="Processing & I/O" />
              </div>
              <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 xl:grid-cols-5">
                <MetricTile
                  icon={Thermometer}
                  label="CPU Temperature"
                  value={cpuTemp}
                  sub="Reserved for future backend support"
                />
                <MetricTile icon={Monitor} label="GPU Usage" value={gpuUsage} />
                <MetricTile icon={Layers} label="VRAM Usage" value={vramUsage} />
                <MetricTile icon={Activity} label="Disk Read / Write" value={diskIo} compact />
                <MetricTile icon={Wifi} label="Network Sent / Recv" value={netIo} compact />
              </div>
            </Panel>

            {/* 2. Hardware Monitoring ─────────────────────────────────── */}
            <Panel className="p-5 sm:p-6" delay={70}>
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <CardHeading icon={Cpu} title="Hardware Monitoring" />
                <span className="text-[11px] font-medium text-slate-400">Timeline history not recorded</span>
              </div>
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <TimelineRegion title="CPU Usage Timeline" />
                <TimelineRegion title="RAM Usage Timeline" />
                <TimelineRegion title="GPU Usage Timeline" />
                <TimelineRegion title="Disk I/O Timeline" />
              </div>
            </Panel>

            {/* 3. System Logs ─────────────────────────────────────────── */}
            <Panel className="overflow-hidden p-0" delay={140}>
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/60 px-5 py-3.5">
                <CardHeading icon={ScrollText} title="System Logs" />
                <div className="inline-flex items-center gap-1 rounded-full border border-white/70 bg-white/45 p-1 shadow-[inset_0_1px_0_rgba(255,255,255,0.8)]">
                  {tabs.map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab)}
                      className={`rounded-full px-3 py-1 text-[11.5px] font-medium transition-all duration-200 ${
                        activeTab === tab
                          ? "bg-white text-[var(--vv-accent-deep)] shadow-[0_1px_2px_rgba(16,32,64,0.08)]"
                          : "text-slate-500 hover:text-slate-700"
                      }`}
                    >
                      {tab}
                    </button>
                  ))}
                </div>
              </div>

              <div className="max-h-[440px] overflow-auto">
                <table className="w-full border-collapse text-left">
                  <thead className="sticky top-0 z-10 bg-white/55 backdrop-blur-md">
                    <tr>
                      <th className="border-b border-white/60 px-5 py-2.5 text-[10.5px] font-semibold uppercase tracking-[0.09em] text-slate-400">
                        Timestamp
                      </th>
                      <th className="border-b border-white/60 px-5 py-2.5 text-[10.5px] font-semibold uppercase tracking-[0.09em] text-slate-400">
                        Level
                      </th>
                      <th className="border-b border-white/60 px-5 py-2.5 text-[10.5px] font-semibold uppercase tracking-[0.09em] text-slate-400">
                        Component
                      </th>
                      <th className="border-b border-white/60 px-5 py-2.5 text-[10.5px] font-semibold uppercase tracking-[0.09em] text-slate-400">
                        Message
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredLogs.length > 0 ? (
                      filteredLogs.map((log: any, i: number) => (
                        <tr
                          key={i}
                          className="group border-b border-white/45 transition-colors duration-200 hover:bg-white/55"
                        >
                          <td className="whitespace-nowrap px-5 py-2 font-mono text-[11px] text-slate-400">
                            {log.timestamp}
                          </td>
                          <td className="px-5 py-2">
                            <LevelBadge level={log.level} />
                          </td>
                          <td className="px-5 py-2 text-[12px] font-semibold text-slate-700">
                            <span className="block max-w-[220px] truncate" title={log.component}>
                              {log.component}
                            </span>
                          </td>
                          <td className="px-5 py-2 text-[12px] text-slate-600">
                            <span className="block max-w-[520px] truncate" title={log.message}>
                              {log.message}
                            </span>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={4} className="py-14 text-center">
                          <div className="mx-auto flex max-w-xs flex-col items-center justify-center text-slate-400">
                            <span
                              className="vv-plate mb-3 h-11 w-11"
                              style={{
                                color: "#94a3b8",
                                background: "rgba(148,163,184,0.12)",
                                boxShadow: "inset 0 0 0 1px rgba(148,163,184,0.2)",
                              }}
                            >
                              <Inbox className="h-5 w-5" strokeWidth={1.7} />
                            </span>
                            <p className="text-[12.5px] font-medium text-slate-500">No log entries</p>
                            <p className="mt-1 text-[11px] font-normal leading-relaxed text-slate-400">
                              No data yet. System log activity will appear here.
                            </p>
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </Panel>

            {/* 4. Storage Health + Network ────────────────────────────── */}
            <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
              <Panel className="p-5 sm:p-6" delay={210}>
                <CardHeading icon={HardDrive} title="Storage Health" />
                <div className="mt-3 divide-y divide-white/50">
                  <StatRow label="Total Disk Capacity" value={telemetry?.storage?.total_capacity ?? null} />
                  <StatRow label="Available Space" value={telemetry?.storage?.available_space ?? null} />
                  <StatRow label="SQLite Database Size" value={telemetry?.storage?.sqlite_size ?? null} />
                  <StatRow label="Vector Database Size" value={telemetry?.storage?.vector_size ?? null} />
                </div>
              </Panel>

              <Panel className="p-5 sm:p-6" delay={280}>
                <CardHeading icon={Network} title="Network" />
                <div className="mt-3 divide-y divide-white/50">
                  <StatRow
                    label="Offline Mode"
                    value={offlineMode != null ? <StatusPill tone={offlineMode === "Active" ? "emerald" : "slate"} label={offlineMode} /> : null}
                  />
                  <StatRow label="Localhost Endpoint" value={localhostEndpoint} mono />
                  <StatRow label="Active Local Connections" value={activeConnections != null ? String(activeConnections) : null} />
                  <StatRow
                    label="Zero Outbound Requests"
                    value={zeroOutbound != null ? <StatusPill tone={zeroOutbound === "Verified" ? "emerald" : "slate"} label={zeroOutbound} /> : null}
                  />
                </div>
              </Panel>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
