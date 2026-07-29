import { Shield, Database, Wifi } from "lucide-react"
import { KpiStrip } from "@/components/dashboard/kpi-strip"
import { KnowledgeOperations } from "@/components/dashboard/knowledge-operations"
import { SystemTelemetry } from "@/components/dashboard/system-telemetry"
import { LlmRouting } from "@/components/dashboard/llm-routing"
import { useDashboardData } from "@/components/dashboard/use-dashboard-data"
import { useWorkstation } from "@/context/WorkstationContext"

export function DashboardView() {
  const { status, analytics, telemetry, security, loading } = useDashboardData()
  const { documentIndex } = useWorkstation()

  const securityPct = 98

  // Circular gauge SVG — 98%
  const gaugeRadius = 36
  const gaugeCircumference = 2 * Math.PI * gaugeRadius
  const gaugeOffset = gaugeCircumference - (securityPct / 100) * gaugeCircumference

  return (
    <div className="grid grid-cols-12 gap-6">
      {/* ===== HERO CARD (Top Left) — Solid matte slate-blue ===== */}
      <div
        className="col-span-12 flex flex-col justify-between rounded-2xl p-6 text-white lg:col-span-5"
        style={{
          background: "linear-gradient(135deg, #74a0ba 0%, #8eb5cb 100%)",
          boxShadow: "0 10px 40px rgba(116, 160, 186, 0.25), inset 0 1px 0 rgba(255,255,255,0.2)",
        }}
      >
        {/* Top section */}
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-white/80" />
              <span className="text-[11px] font-semibold uppercase tracking-wider text-white/70">
                System Node: Active
              </span>
            </div>
            <h2 className="mt-2 text-xl font-bold tracking-tight">VaultMind</h2>
            <p className="mt-0.5 text-[13px] font-medium text-white/80">
              Security Integrity {securityPct}%
            </p>
          </div>

          {/* Circular gauge */}
          <div className="relative flex h-[88px] w-[88px] items-center justify-center shrink-0">
            <svg className="h-full w-full -rotate-90" viewBox="0 0 80 80">
              <circle
                cx="40"
                cy="40"
                r={gaugeRadius}
                fill="none"
                stroke="rgba(255,255,255,0.15)"
                strokeWidth="5"
              />
              <circle
                cx="40"
                cy="40"
                r={gaugeRadius}
                fill="none"
                stroke="rgba(255,255,255,0.9)"
                strokeWidth="5"
                strokeLinecap="round"
                strokeDasharray={gaugeCircumference}
                strokeDashoffset={gaugeOffset}
                className="transition-all duration-700 ease-out"
              />
            </svg>
            <span className="absolute text-lg font-bold text-white">{securityPct}%</span>
          </div>
        </div>

        {/* Bottom pill indicators */}
        <div className="mt-4 flex items-center gap-3">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1.5 text-[11px] font-medium text-white backdrop-blur-sm">
            <Database className="h-3.5 w-3.5 text-white/70" />
            Active Knowledge Base
          </div>
          <div className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1.5 text-[11px] font-medium text-white backdrop-blur-sm">
            <Wifi className="h-3.5 w-3.5 text-white/70" />
            Zero Outbound Leaks
          </div>
        </div>
      </div>

      {/* ===== KPI STRIP (Top Right) — 4 KPI cards ===== */}
      <div className="col-span-12 lg:col-span-7">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <KpiStrip analytics={analytics} status={status} vectorCount={documentIndex?.vectors ?? null} />
        </div>
      </div>

      {/* ===== SYSTEM TELEMETRY ===== */}
      <div className="col-span-12 lg:col-span-5">
        <SystemTelemetry telemetry={telemetry} security={security} />
      </div>

      {/* ===== KNOWLEDGE OPERATIONS ===== */}
      <div className="col-span-12 lg:col-span-7">
        <KnowledgeOperations />
      </div>

      {/* ===== LLM ROUTING ===== */}
      <div className="col-span-12">
        <LlmRouting status={status} analytics={analytics} loading={loading} />
      </div>
    </div>
  )
}