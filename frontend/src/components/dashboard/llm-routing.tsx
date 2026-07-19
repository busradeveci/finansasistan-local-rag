import { Route, Cpu, Sigma, ArrowRight, CircuitBoard } from "lucide-react"
import { useDashboardData, type StatusPacket } from "@/components/dashboard/use-dashboard-data"
import type { AnalyticsPacket } from "@/types/workstation"

type Node = {
  model: string
  role: string
  icon: React.ComponentType<{ className?: string }>
  load: string
  status: "Active" | "Standby"
}

type LlmRoutingProps = {
  status?: StatusPacket | null
  analytics?: AnalyticsPacket | null
  loading?: boolean
}

export function LlmRouting(props: LlmRoutingProps = {}) {
  const polled = useDashboardData(undefined, props.status === undefined)
  const status = props.status !== undefined ? props.status : polled.status
  const analytics = props.analytics !== undefined ? props.analytics : polled.analytics
  const loading = props.loading !== undefined ? props.loading : polled.loading

  const routerModel = status?.models.router_model ?? "phi-4-mini"
  const chatModel = status?.models.chat_model ?? "phi-3.5-mini"
  const embedModel = status?.models.embed_model ?? "qwen3-embedding-0.6b"

  const chatLoad =
    analytics && analytics.queries_processed_today > 0
      ? `${Math.min(99, Math.round((analytics.avg_generation_ms / 2000) * 100))}% throughput`
      : "idle"

  const targets: Node[] = [
    {
      model: chatModel,
      role: "LOCAL_RAG",
      icon: CircuitBoard,
      load: chatLoad,
      status: "Active",
    },
    {
      model: embedModel,
      role: "EMBEDDING",
      icon: Sigma,
      load: analytics ? `${analytics.avg_embedding_ms.toFixed(0)}ms avg` : "—",
      status: "Active",
    },
  ]

  return (
    <section className="rounded-sm border border-stone-200 bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-stone-200 px-3.5 py-2.5">
        <div className="flex items-center gap-2">
          <Route className="h-4 w-4 text-[#1c1917]" />
          <h2 className="text-xs font-semibold text-stone-900">Active LLM Routing</h2>
        </div>
        <span className="font-mono text-[10px] text-stone-400">
          {loading ? "SYNCING…" : "SEMANTIC ROUTER v2"}
        </span>
      </div>

      <div className="grid grid-cols-1 items-stretch gap-3 p-3.5 md:grid-cols-[minmax(220px,1fr)_auto_1.4fr]">
        <div className="flex flex-col justify-center rounded-sm border border-[#1c1917]/20 bg-[#f5f5f4] p-3">
          <div className="mb-1.5 flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-sm bg-[#1c1917] text-white">
              <Cpu className="h-4 w-4" />
            </div>
            <div>
              <div className="font-mono text-[13px] font-semibold text-[#1c1917]">{routerModel}</div>
              <div className="text-[10px] font-medium uppercase tracking-wider text-[#1c1917]/70">
                Semantic Router
              </div>
            </div>
          </div>
          <p className="text-[11px] leading-relaxed text-stone-600">
            Classifies intent and distributes each query to the optimal downstream handler.
          </p>
        </div>

        <div className="flex items-center justify-center" aria-hidden="true">
          <div className="flex flex-col items-center gap-1 text-stone-300">
            <ArrowRight className="hidden h-5 w-5 md:block" />
            <span className="hidden font-mono text-[10px] uppercase tracking-wider text-stone-400 md:block">
              routes
            </span>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          {targets.map((node) => {
            const Icon = node.icon
            return (
              <div
                key={node.model}
                className="flex items-center gap-2.5 rounded-sm border border-stone-200 bg-stone-50 p-2.5"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-sm border border-stone-200 bg-white text-stone-600">
                  <Icon className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="font-mono text-[13px] font-semibold text-stone-800">{node.model}</div>
                  <div className="text-[10px] font-medium uppercase tracking-wider text-stone-400">{node.role}</div>
                </div>
                <div className="text-right">
                  <span className="inline-flex items-center gap-1.5 rounded-sm border border-orange-200 bg-orange-50 px-1.5 py-0.5 text-[10px] font-semibold text-orange-700">
                    <span className="h-1.5 w-1.5 rounded-full bg-orange-500" />
                    {node.status}
                  </span>
                  <div className="mt-1 font-mono text-[10px] text-stone-400">{node.load}</div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
