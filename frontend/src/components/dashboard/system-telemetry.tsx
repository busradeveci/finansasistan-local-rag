import { Cpu, MemoryStick, Ban, FolderLock, ScanText } from "lucide-react"
import type { SecurityPacket, TelemetryPacket } from "@/types/workstation"

type SystemTelemetryProps = {
  telemetry: TelemetryPacket | null
  security: SecurityPacket | null
}

type Meter = {
  label: string
  icon: React.ComponentType<{ className?: string }>
  value: number
  detail: string
}

type Layer = {
  label: string
  short: string
  icon: React.ComponentType<{ className?: string }>
  blocked: number
}

function MeterCard({ meter }: { meter: Meter }) {
  const Icon = meter.icon
  const color = meter.value >= 80 ? "bg-red-500" : meter.value >= 60 ? "bg-amber-500" : "bg-[#1c1917]"
  return (
    <div className="flex flex-col gap-1.5 px-3.5 py-3">
      <div className="flex items-center justify-between">
        <span className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-stone-400">
          <Icon className="h-3.5 w-3.5 text-stone-400" />
          {meter.label}
        </span>
        <span className="font-mono text-xs font-semibold tabular-nums text-stone-700">{meter.value}%</span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-stone-100">
        <div className={"h-full rounded-full " + color} style={{ width: `${meter.value}%` }} />
      </div>
      <div className="font-mono text-[10px] text-stone-400">{meter.detail}</div>
    </div>
  )
}

function LayerCard({ layer }: { layer: Layer }) {
  const Icon = layer.icon
  return (
    <div className="flex items-center gap-2.5 px-3.5 py-3">
      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-sm border border-stone-200 bg-stone-50">
        <Icon className="h-3.5 w-3.5 text-stone-500" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="truncate text-[11px] font-medium text-stone-700">{layer.short}</div>
        <div className="text-[10px] text-stone-400">blocked today</div>
      </div>
      <span className="font-mono text-sm font-semibold tabular-nums text-stone-900">{layer.blocked}</span>
    </div>
  )
}

export function SystemTelemetry({ telemetry, security }: SystemTelemetryProps) {
  const cpuPct = Math.round(telemetry?.cpu.percent ?? 0)
  const memPct = Math.round(telemetry?.memory.percent ?? 0)
  const memUsed = telemetry?.memory.used_gb ?? 0
  const memTotal = telemetry?.memory.total_gb ?? 0

  const meters: Meter[] = [
    {
      label: "CPU",
      icon: Cpu,
      value: cpuPct,
      detail: telemetry ? `${cpuPct}% utilization` : "—",
    },
    {
      label: "RAM",
      icon: MemoryStick,
      value: memPct,
      detail: memTotal > 0 ? `${memUsed.toFixed(1)} / ${memTotal.toFixed(1)} GB` : "—",
    },
  ]

  const layers: Layer[] = [
    {
      label: "Prompt Injection",
      short: "Injection Filter",
      icon: Ban,
      blocked: security?.prompt_injections_blocked ?? 0,
    },
    {
      label: "Path Traversal",
      short: "Traversal Guard",
      icon: FolderLock,
      blocked: security?.path_traversal_guard ? security.uploads_rejected : 0,
    },
    {
      label: "PII Redaction",
      short: "PII Redaction",
      icon: ScanText,
      blocked: security?.sanitized_queries ?? 0,
    },
  ]

  const sanitizationActive = security?.prompt_injection_protection ?? false

  return (
    <section
      aria-label="System telemetry and sanitization"
      className="rounded-sm border border-stone-200 bg-white shadow-sm"
    >
      <div className="flex items-center justify-between border-b border-stone-200 px-3.5 py-2">
        <h2 className="text-xs font-semibold text-stone-900">System Telemetry</h2>
        <span className="inline-flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-orange-600">
          <span className="relative flex h-1.5 w-1.5">
            {sanitizationActive && (
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-orange-400 opacity-60" />
            )}
            <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-orange-500" />
          </span>
          {sanitizationActive ? "Live · Sanitization Active" : "Telemetry Offline"}
        </span>
      </div>
      <div className="grid grid-cols-2 divide-x divide-y divide-stone-200 sm:grid-cols-3 sm:divide-y-0 lg:grid-cols-5">
        {meters.map((m) => (
          <MeterCard key={m.label} meter={m} />
        ))}
        {layers.map((l) => (
          <LayerCard key={l.label} layer={l} />
        ))}
      </div>
    </section>
  )
}
