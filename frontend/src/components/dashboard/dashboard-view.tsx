import { KpiStrip } from "@/components/dashboard/kpi-strip"
import { KnowledgeOperations } from "@/components/dashboard/knowledge-operations"
import { SystemTelemetry } from "@/components/dashboard/system-telemetry"
import { LlmRouting } from "@/components/dashboard/llm-routing"
import { useDashboardData } from "@/components/dashboard/use-dashboard-data"
import { useWorkstation } from "@/context/WorkstationContext"

const HERO_BULLETS = ["Active Knowledge Base", "Zero Outbound Leaks"]

function IntegrityGauge() {
  const size = 210
  const strokeWidth = 12
  const progress = 98
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const dashOffset = circumference - (progress / 100) * circumference

  return (
    <div className="relative flex items-center justify-center">
      <svg
        viewBox={`0 0 ${size} ${size}`}
        className="h-[210px] w-[210px] drop-shadow-[0_12px_26px_rgba(255,255,255,0.18)]"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id="integrityRingGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="45%" stopColor="#e7f6ff" />
            <stop offset="100%" stopColor="#bfe5ff" />
          </linearGradient>
        </defs>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="rgba(255,255,255,0.34)"
          strokeWidth={strokeWidth}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="url(#integrityRingGradient)"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={`${circumference} ${circumference}`}
          strokeDashoffset={dashOffset}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </svg>
      <div className="absolute flex flex-col items-center text-center text-white">
        <span className="rounded-full bg-white/20 px-4 py-1 text-lg font-semibold tracking-tight shadow-[inset_0_1px_0_rgba(255,255,255,0.35)]">
          98%
        </span>
        <span className="mt-2 text-sm font-medium tracking-tight text-white/95">Platform Integrity</span>
      </div>
    </div>
  )
}

export function DashboardView() {
  const { status, analytics, telemetry, security, loading } = useDashboardData()
  const { documentIndex } = useWorkstation()

  return (
    <div className="relative overflow-hidden rounded-[32px] border border-white/60 bg-[#F5F8FC] p-4 shadow-[0_24px_70px_rgba(86,120,160,0.08)] sm:p-5 lg:p-6">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_16%_16%,rgba(135,206,250,0.34)_0%,transparent_32%),radial-gradient(circle_at_82%_18%,rgba(191,219,254,0.28)_0%,transparent_28%),radial-gradient(circle_at_52%_88%,rgba(219,234,254,0.42)_0%,transparent_34%)]" />

      <div className="relative grid gap-5">
        <div className="grid gap-5 xl:grid-cols-[minmax(0,0.94fr)_minmax(0,1.06fr)] xl:items-stretch">
          <section className="relative overflow-hidden rounded-[28px] bg-[linear-gradient(160deg,#7ec9f4_0%,#8cd7f6_48%,#72bff0_100%)] p-6 text-white shadow-[0_28px_70px_rgba(74,133,180,0.22)] sm:p-7 lg:min-h-[520px] lg:p-8">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_16%_18%,rgba(255,255,255,0.28)_0%,transparent_28%),radial-gradient(circle_at_78%_20%,rgba(255,255,255,0.18)_0%,transparent_24%),radial-gradient(circle_at_52%_82%,rgba(255,255,255,0.10)_0%,transparent_34%)]" />
            <div className="relative flex h-full min-h-[460px] flex-col justify-between">
              <div>
                <h1 className="text-3xl font-semibold tracking-[-0.03em] text-white sm:text-[2.15rem]">Operational Status</h1>
                <p className="mt-2 text-sm font-medium tracking-tight text-white/94 sm:text-[1.02rem]">
                  BetaVector Runtime · Platform Integrity 98%
                </p>
              </div>

              <div className="flex flex-1 items-center justify-center py-8">
                <IntegrityGauge />
              </div>

              <div className="space-y-5">
                <div className="flex items-center gap-3 text-sm font-semibold tracking-[0.08em] text-white/95">
                  <span className="h-2.5 w-2.5 rounded-full bg-white shadow-[0_0_0_4px_rgba(255,255,255,0.18)]" />
                  <span>100% Air-Gapped</span>
                </div>

                <div className="grid gap-3 border-t border-white/25 pt-5 sm:grid-cols-2 sm:gap-4">
                  {HERO_BULLETS.map((bullet, index) => (
                    <div key={bullet} className="flex items-start gap-3 text-sm font-medium text-white/95">
                      <span
                        className={
                          "mt-2 h-2.5 w-2.5 shrink-0 rounded-full shadow-[0_0_0_4px_rgba(255,255,255,0.1)] " +
                          (index === 0 ? "bg-white" : "bg-sky-100")
                        }
                      />
                      <span className="leading-snug">{bullet}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <KpiStrip analytics={analytics} status={status} vectorCount={documentIndex?.vectors ?? null} />
          </div>
        </div>

        <div className="grid gap-5 xl:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)]">
          <SystemTelemetry telemetry={telemetry} security={security} />
          <KnowledgeOperations />
        </div>

        <LlmRouting status={status} analytics={analytics} loading={loading} />
      </div>
    </div>
  )
}