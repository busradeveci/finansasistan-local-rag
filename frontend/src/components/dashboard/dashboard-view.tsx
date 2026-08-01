import { KpiStrip } from "@/components/dashboard/kpi-strip"
import { KnowledgeOperations } from "@/components/dashboard/knowledge-operations"
import { SystemTelemetry } from "@/components/dashboard/system-telemetry"
import { LlmRouting } from "@/components/dashboard/llm-routing"
import { useDashboardData } from "@/components/dashboard/use-dashboard-data"
import { useWorkstation } from "@/context/WorkstationContext"

export function DashboardView() {
  const { status, analytics, telemetry, security, loading } = useDashboardData()
  const { documentIndex } = useWorkstation()

  return (
    <div className="grid grid-cols-12 gap-6 rounded-3xl border border-white/50 bg-white/35 p-4 shadow-[0_8px_32px_rgba(40,60,90,0.05)] backdrop-blur-[10px] sm:p-5 lg:p-6">
      <div className="col-span-12 flex items-end justify-between">
        <div className="flex flex-col">
          <h1 className="text-base font-semibold tracking-tight text-slate-900">Workstation</h1>
          <p className="text-xs text-slate-500">Enterprise knowledge operations overview.</p>
        </div>
        <span className="hidden rounded-full border border-sky-100/80 bg-sky-50/80 px-3 py-1 font-mono text-[11px] text-sky-700 md:block">
          node-01 · air-gapped
        </span>
      </div>

      <KpiStrip analytics={analytics} status={status} vectorCount={documentIndex?.vectors ?? null} />

      <div className="col-span-12 lg:col-span-5">
        <SystemTelemetry telemetry={telemetry} security={security} />
      </div>

      <div className="col-span-12 lg:col-span-7">
        <KnowledgeOperations />
      </div>

      <div className="col-span-12">
        <LlmRouting status={status} analytics={analytics} loading={loading} />
      </div>
    </div>
  )
}
