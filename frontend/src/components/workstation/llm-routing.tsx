import { Route, Cpu, Sigma, ArrowRight, CircuitBoard } from "lucide-react"
import { useWorkstationData, type StatusPacket } from "@/components/workstation/use-workstation-data"
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

const GLASS_CARD =
  "bg-white/35 backdrop-blur-2xl backdrop-saturate-[1.12] border border-white/70 shadow-[0_14px_38px_rgba(20,40,70,0.06),inset_0_1px_0_rgba(255,255,255,0.86),inset_0_-1px_0_rgba(255,255,255,0.28)] rounded-3xl"

const HYPER_GLASS =
  "bg-white/42 backdrop-blur-md border border-white/75 shadow-[0_4px_14px_rgba(0,0,0,0.05),inset_0_1px_1px_rgba(255,255,255,0.92)] rounded-full hover:bg-white/55 transition-all duration-300"

export function LlmRouting(props: LlmRoutingProps = {}) {
  const polled = useWorkstationData(undefined, props.status === undefined)
  const status = props.status !== undefined ? props.status : polled.status
  const analytics = props.analytics !== undefined ? props.analytics : polled.analytics
  const loading = props.loading !== undefined ? props.loading : polled.loading

  const routerModel = status?.models?.router_model ?? "phi-4-mini"
  const chatModel = status?.models?.chat_model ?? "phi-3.5-mini"
  const embedModel = status?.models?.embed_model ?? "qwen3-embedding-0.6b"

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
    <section className={`overflow-hidden ${GLASS_CARD}`}>
      <div className="flex items-center justify-between border-b border-white/40 px-4 py-3">
        <div className="flex items-center gap-2">
          <Route className="h-4 w-4 text-slate-800" />
          <h2 className="text-xs font-semibold text-slate-900">Active LLM Routing</h2>
        </div>
        <span className="font-mono text-[10px] text-slate-500">
          {loading ? "SYNCING…" : "SEMANTIC ROUTER v2"}
        </span>
      </div>

      <div className="grid grid-cols-1 items-stretch gap-3 p-4 md:grid-cols-[minmax(220px,1fr)_auto_1.4fr]">
        <div className="flex flex-col justify-center rounded-3xl border border-white/40 bg-white/20 p-3 shadow-[0_8px_30px_rgb(0,0,0,0.04),inset_0_1px_0_rgba(255,255,255,0.8),inset_0_-1px_0_rgba(255,255,255,0.2)] backdrop-blur-2xl backdrop-saturate-[1.1]">
          <div className="mb-1.5 flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-slate-900 text-white shadow-[0_4px_16px_0_rgba(15,23,42,0.15)]">
              <Cpu className="h-4 w-4" />
            </div>
            <div>
              <div className="font-mono text-[13px] font-semibold text-slate-800">{routerModel}</div>
              <div className="text-[10px] font-medium uppercase tracking-wider text-slate-600">
                Semantic Router
              </div>
            </div>
          </div>
          <p className="text-[11px] leading-relaxed text-slate-600">
            Classifies intent and distributes each query to the optimal downstream handler.
          </p>
        </div>

        <div className="flex items-center justify-center" aria-hidden="true">
          <div className="flex flex-col items-center gap-1 text-slate-400">
            <ArrowRight className="hidden h-5 w-5 md:block" />
            <span className="hidden font-mono text-[10px] uppercase tracking-wider text-slate-400 md:block">
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
                className="flex items-center gap-2.5 rounded-3xl border border-white/40 bg-white/20 p-2.5 shadow-[0_8px_30px_rgb(0,0,0,0.04),inset_0_1px_0_rgba(255,255,255,0.8),inset_0_-1px_0_rgba(255,255,255,0.2)] backdrop-blur-2xl backdrop-saturate-[1.1]"
              >
                <div className={`flex h-8 w-8 items-center justify-center text-slate-700 ${HYPER_GLASS} !rounded-2xl`}>
                  <Icon className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="font-mono text-[13px] font-semibold text-slate-800">{node.model}</div>
                  <div className="text-[10px] font-medium uppercase tracking-wider text-slate-500">{node.role}</div>
                </div>
                <div className="text-right">
                  <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 text-[10px] font-semibold text-orange-700 ${HYPER_GLASS}`}>
                    <span className="h-1.5 w-1.5 rounded-full bg-orange-500" />
                    {node.status}
                  </span>
                  <div className="mt-1 font-mono text-[10px] text-slate-500">{node.load}</div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}