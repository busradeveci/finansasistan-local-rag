import { Cpu, MemoryStick, Ban, FolderLock, ScanText, ShieldAlert, Eye } from "lucide-react"
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
  active: boolean
}

const GLASS_CARD =
  "bg-white/50 backdrop-blur-md border border-white/70 shadow-sm rounded-2xl p-5"

const HYPER_GLASS =
  "bg-white/72 backdrop-blur-sm border border-white/80 shadow-[0_4px_14px_rgba(20,40,70,0.05)] rounded-full hover:bg-white/86 transition-all duration-300"

function MeterCard({ meter }: { meter: Meter }) {
  const Icon = meter.icon
  const color =
    meter.value >= 80 ? "bg-red-500" : meter.value >= 60 ? "bg-amber-400" : "bg-blue-600"
  return (
    <div className="flex flex-col gap-1 bg-white/60 hover:bg-white/80 transition-all border border-white/80 shadow-xs rounded-xl p-3.5">
      <div className="flex items-center justify-between">
        <span className="flex items-center gap-1.5 text-[10px] font-bold tracking-wider text-slate-400 uppercase">
          <Icon className="h-4 w-4 text-slate-400" />
          {meter.label}
        </span>
        <span className="text-base font-bold text-slate-800">{meter.value}%</span>
      </div>
      <div className="h-2 rounded-full bg-slate-100 overflow-hidden mt-0.5">
        <div
          className={"h-full rounded-full transition-all duration-500 " + color}
          style={{ width: `${meter.value}%` }}
        />
      </div>
      <div className="text-[11px] text-slate-500 font-normal mt-1">{meter.detail}</div>
    </div>
  )
}

function LayerCard({ layer }: { layer: Layer }) {
  const Icon = layer.icon
  return (
    <div className="bg-white/50 hover:bg-white/80 transition-all border border-white/70 shadow-xs rounded-xl p-2.5 flex flex-col items-center text-center">
      <div className="w-6 h-6 rounded-lg bg-blue-50/80 text-blue-600 flex items-center justify-center mb-1.5">
        <Icon className="h-3.5 w-3.5" />
      </div>
      <div className="text-[11px] font-semibold text-slate-600 leading-tight mb-1 max-w-[110px] min-h-[26px] flex items-center justify-center text-center">
        {layer.short}
      </div>
      <div className={layer.active ? "text-[9px] font-bold tracking-widest text-emerald-600 uppercase bg-emerald-50/80 px-2 py-0.5 rounded-full border border-emerald-200/50 mb-1" : "text-[9px] font-bold tracking-widest text-slate-400 uppercase bg-slate-50/80 px-2 py-0.5 rounded-full border border-slate-200/50 mb-1"}>
        {layer.active ? "Active" : "Offline"}
      </div>
      <div className="text-[10px] font-medium text-slate-400">
        {layer.blocked} {layer.blocked === 1 ? 'Event' : 'Events'}
      </div>
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

  const pipelineActive = security?.prompt_injection_protection ?? false
  const contextGuardActive = security?.context_overflow_protection ?? false

  const layers: Layer[] = [
    {
      label: "Prompt Injection",
      short: "Prompt Injection Guard",
      icon: Ban,
      blocked: security?.prompt_injections_blocked ?? 0,
      active: pipelineActive,
    },
    {
      label: "Path Traversal",
      short: "Traversal Guard",
      icon: FolderLock,
      blocked: security?.path_traversal_guard ? security.uploads_rejected : 0,
      active: security?.path_traversal_guard ?? false,
    },
    {
      label: "Global PII Redaction",
      short: "Global PII Redaction",
      icon: ScanText,
      blocked: security?.sanitized_queries ?? 0,
      active: pipelineActive,
    },
    {
      label: "Output Grounding",
      short: "Output Grounding",
      icon: Eye,
      blocked: security?.threats_blocked ?? 0,
      active: pipelineActive,
    },
    {
      label: "Context Overflow",
      short: "Context Overflow Guard",
      icon: ShieldAlert,
      blocked: contextGuardActive ? (security?.sanitization_layers ?? 0) : 0,
      active: contextGuardActive,
    },
  ]

  const sanitizationActive = pipelineActive

  return (
    <section
      aria-label="VectorVault security pipeline and system telemetry"
      className={`${GLASS_CARD} overflow-hidden mt-3 xl:-mt-16 relative z-10`}
    >
      <div className="flex items-center justify-between border-b border-white/50 pb-3.5 mb-3.5">
        <div className="flex flex-col gap-0.5">
          <h2 className="text-sm font-semibold tracking-tight text-slate-900">VectorVault Security Pipeline</h2>
          <p className="text-[10px] text-slate-500 font-medium uppercase tracking-wider">
            AI Guardrails · System Telemetry
          </p>
        </div>
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider ${
            sanitizationActive ? "text-emerald-700" : "text-slate-500"
          } ${HYPER_GLASS}`}
        >
          <span className="relative flex h-1.5 w-1.5">
            {sanitizationActive && (
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
            )}
            <span className={`relative inline-flex h-1.5 w-1.5 rounded-full ${sanitizationActive ? "bg-emerald-500" : "bg-slate-400"}`} />
          </span>
          {sanitizationActive ? "Sanitization Active" : "Sanitization Offline"}
        </span>
      </div>
      <div className="flex flex-col gap-3">
        {/* System meters */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {meters.map((m) => (
            <MeterCard key={m.label} meter={m} />
          ))}
        </div>
        {/* Security layer cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2.5 mt-3">
          {layers.map((l) => (
            <LayerCard key={l.label} layer={l} />
          ))}
        </div>
      </div>
    </section>
  )
}