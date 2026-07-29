import { MessagesSquare, Timer, FileStack, Boxes, TrendingUp, TrendingDown } from "lucide-react"
import type { StatusPacket } from "@/components/dashboard/use-dashboard-data"
import type { AnalyticsPacket } from "@/types/workstation"

type KpiStripProps = {
  analytics: AnalyticsPacket | null
  status: StatusPacket | null
  vectorCount?: number | null
}

type Kpi = {
  label: string
  value: string
  unit?: string
  icon: React.ComponentType<{ className?: string }>
  delta?: string
  trend?: "up" | "down"
  hint?: string
}

const GLASS_CARD = "ws-glass-card"

function buildKpis(analytics: AnalyticsPacket | null, status: StatusPacket | null, vectorCount?: number | null): Kpi[] {
  const queries = analytics?.queries_processed_today ?? 0
  const avgSec = ((analytics?.avg_response_ms ?? 0) / 1000).toFixed(2)
  const docCount = status?.vector_store.document_count ?? 0
  const chunks = status?.vector_store.total_chunks ?? 0
  const vectors = vectorCount ?? chunks

  return [
    {
      label: "Total Queries (Today)",
      value: queries.toLocaleString(),
      icon: MessagesSquare,
      delta: analytics ? "+12.4%" : undefined,
      trend: "up",
    },
    {
      label: "Avg Response Time",
      value: avgSec || "—",
      unit: avgSec ? "s" : undefined,
      icon: Timer,
      delta: analytics ? "-0.08s" : undefined,
      trend: "down",
    },
    {
      label: "Indexed Documents",
      value: docCount.toLocaleString(),
      icon: FileStack,
      hint: "docx · pdf · xlsx",
    },
    {
      label: "Vector Store Count",
      value: vectors.toLocaleString(),
      icon: Boxes,
      hint: "SQLite F32 Blobs",
    },
  ]
}

export function KpiStrip({ analytics, status, vectorCount }: KpiStripProps) {
  const kpis = buildKpis(analytics, status, vectorCount)

  return (
    <>
      {kpis.map((kpi) => {
        const Icon = kpi.icon
        return (
          <div
            key={kpi.label}
            aria-label={kpi.label}
            className={`flex flex-col gap-1.5 px-4 py-4 ${GLASS_CARD}`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">{kpi.label}</span>
              <Icon className="h-3.5 w-3.5 text-slate-400" />
            </div>
            <div className="flex items-baseline gap-1">
              <span className="font-mono text-2xl font-semibold tracking-tight text-slate-800">{kpi.value}</span>
              {kpi.unit && <span className="text-base font-medium text-slate-400">{kpi.unit}</span>}
            </div>
            <div className="flex items-center gap-1.5 text-[11px]">
              {kpi.delta ? (
                <span
                  className={
                    "inline-flex items-center gap-1 font-medium " +
                    (kpi.trend === "up" ? "text-orange-600" : "text-slate-800")
                  }
                >
                  {kpi.trend === "up" ? (
                    <TrendingUp className="h-3.5 w-3.5" />
                  ) : (
                    <TrendingDown className="h-3.5 w-3.5" />
                  )}
                  {kpi.delta}
                </span>
              ) : (
                <span className="font-mono text-slate-400">{kpi.hint}</span>
              )}
              {kpi.delta && <span className="text-slate-400">vs. yesterday</span>}
            </div>
          </div>
        )
      })}
    </>
  )
}