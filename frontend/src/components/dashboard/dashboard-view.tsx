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
    <div className="flex flex-col gap-3">
      <div className="flex items-end justify-between">
        <div className="flex flex-col">
          <h1 className="text-base font-semibold tracking-tight text-stone-900">Workstation Dashboard</h1>
          <p className="text-xs text-stone-500">Offline retrieval-augmented generation node · Operations</p>
        </div>
        <span className="hidden font-mono text-[11px] text-stone-400 md:block">node-01 · air-gapped</span>
      </div>

      <KpiStrip analytics={analytics} status={status} vectorCount={documentIndex?.vectors ?? null} />

      <SystemTelemetry telemetry={telemetry} security={security} />

      <KnowledgeOperations />

      <LlmRouting status={status} analytics={analytics} loading={loading} />
    </div>
  )
}
