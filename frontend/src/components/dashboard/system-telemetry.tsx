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

const GLASS_CARD =
  "bg-white/70 backdrop-blur-[10px] backdrop-saturate-[1.02] border border-white/60 shadow-[0_10px_30px_rgba(20,40,70,0.05)] rounded-3xl"

const HYPER_GLASS =
  "bg-white/60 backdrop-blur-sm border border-white/70 shadow-[0_4px_14px_rgba(20,40,70,0.04)] rounded-full hover:bg-white/75 transition-all duration-300"

function MeterCard({ meter }: { meter: Meter }) {
  const Icon = meter.icon
  const color =
    meter.value >= 80 ? "bg-red-500" : meter.value >= 60 ? "bg-amber-400" : "bg-blue-600"
  return (
    <div className="flex flex-col gap-2 px-4 py-4">
      <div className="flex items-center justify-between">
        <span className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-600/80">
          <Icon className="h-3.5 w-3.5 text-slate-500" />
          {meter.label}
        </span>
        <span className="font-mono text-xs font-semibold tabular-nums text-slate-800">{meter.value}%</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-white/50">
        <div
          className={"h-full rounded-full transition-all duration-500 " + color}
          style={{ width: `${meter.value}%` }}
        />
      </div>
      <div className="font-mono text-[10px] text-slate-600/70">{meter.detail}</div>
    </div>
  )
}

function LayerCard({ layer }: { layer: Layer }) {
  const Icon = layer.icon
  return (
      <div className="flex items-center gap-3 px-4 py-4">
      <div className={`flex h-8 w-8 shrink-0 items-center justify-center text-slate-600 ${HYPER_GLASS} !rounded-2xl`}>
        <Icon className="h-3.5 w-3.5 text-slate-600" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="truncate text-[11px] font-medium text-slate-900">{layer.short}</div>
        <div className="text-[10px] text-slate-600/70">blocked today</div>
      </div>
      <span className="font-mono text-sm font-semibold tabular-nums text-slate-800">{layer.blocked}</span>
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
      label: "CPU Utilization",
      icon: Cpu,
      value: cpuPct,
      detail: telemetry ? `${cpuPct}% utilization` : "—",
    },
    {
      label: "Memory Usage",
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
      className={`${GLASS_CARD} overflow-hidden`}
    >
      <div className="flex items-center justify-between border-b border-white/50 px-6 py-3.5">
        <h2 className="text-sm font-semibold tracking-tight text-slate-900">Telemetry</h2>
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider ${
            sanitizationActive ? "text-emerald-700" : "text-slate-500"
          } ${HYPER_GLASS}`}
        >
          <span className="relative flex h-1.5 w-1.5">
            {sanitizationActive && (
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
            )}
            <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
          </span>
          {sanitizationActive ? "Active" : "Offline"}
        </span>
      </div>
      <div className="grid grid-cols-2 divide-x divide-y divide-white/40 sm:grid-cols-3 sm:divide-y-0 lg:grid-cols-5">
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
