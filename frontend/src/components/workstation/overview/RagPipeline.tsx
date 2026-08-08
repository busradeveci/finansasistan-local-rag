import { Fragment, type CSSProperties } from "react"
import {
  BrainCircuit,
  CircleCheckBig,
  Cpu,
  Database,
  FileText,
  Layers,
  RefreshCw,
  Radar,
} from "lucide-react"
import type { AnalyticsPacket } from "@/types/workstation"
import { CardHeading, LiveBadge, Panel, Shimmer, formatLatency, tint } from "./primitives"

/* ═══════════════════════════════════════════════════════════════════════
   Retrieval-Augmented Generation pipeline.

   A single data packet traverses the seven stages on a continuous loop.
   The animation cycle is split into 7 slots — 6 hops plus one rest beat —
   so stage N finishes before stage 1 re-fires. Every stage therefore
   glows exactly as the packet reaches it.
   ═══════════════════════════════════════════════════════════════════════ */

const CYCLE_SECONDS = 6.3
const SLOT_SECONDS = CYCLE_SECONDS / 7

type Stage = {
  id: string
  name: string
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>
  /** Cool-hue ramp: the eye reads the progression as flow direction. */
  color: string
  /** Which measured latency, if any, this stage is responsible for. */
  metric?: keyof AnalyticsPacket
}

const STAGES: Stage[] = [
  { id: "query", name: "User Query", icon: FileText, color: "#64748b" },
  { id: "router", name: "Semantic Router", icon: BrainCircuit, color: "#4f46e5" },
  { id: "embedding", name: "Embedding", icon: Layers, color: "#2563eb", metric: "avg_embedding_ms" },
  { id: "search", name: "Vector Search", icon: Database, color: "#0ea5e9", metric: "avg_retrieval_ms" },
  { id: "context", name: "Context Assembly", icon: RefreshCw, color: "#0891b2" },
  { id: "inference", name: "LLM Inference", icon: Cpu, color: "#0d9488", metric: "avg_generation_ms" },
  { id: "response", name: "Response", icon: CircleCheckBig, color: "#059669", metric: "avg_response_ms" },
]

type StageVars = CSSProperties & {
  "--vv-delay"?: string
  "--vv-stage-glow"?: string
}

function StageTile({ stage, index, latency }: { stage: Stage; index: number; latency: string | null }) {
  const Icon = stage.icon
  const delay = `${(index * SLOT_SECONDS).toFixed(3)}s`

  return (
    <div
      className="vv-stage group"
      style={{ "--vv-delay": delay, "--vv-stage-glow": tint(stage.color, 0.22) } as StageVars}
    >
      <span className="vv-stage__glow" style={{ "--vv-delay": delay } as StageVars} />

      <span
        className="vv-stage__icon"
        style={
          {
            "--vv-delay": delay,
            color: stage.color,
          } as StageVars
        }
      >
        <Icon className="h-4 w-4" strokeWidth={1.9} />
      </span>

      <span className="relative z-10 px-0.5 text-center text-[9.5px] font-semibold uppercase leading-[1.25] tracking-[0.055em] text-slate-500">
        {stage.name}
      </span>

      {latency && (
        <span
          className="relative z-10 rounded-full px-1.5 py-px text-[9.5px] font-semibold tabular-nums"
          style={{ color: stage.color, background: tint(stage.color, 0.1) }}
        >
          {latency}
        </span>
      )}
    </div>
  )
}

function Connector({ index }: { index: number }) {
  const delay = `${(index * SLOT_SECONDS).toFixed(3)}s`
  return (
    <div className="vv-flow" aria-hidden="true">
      <span className="vv-flow__line" />
      <span className="vv-flow__runner" style={{ "--vv-delay": delay } as StageVars}>
        <span className="vv-flow__comet" />
      </span>
    </div>
  )
}

export function RagPipeline({
  analytics,
  loading,
  delay = 0,
}: {
  analytics: AnalyticsPacket | null
  loading: boolean
  delay?: number
}) {
  const totalLatency = formatLatency(analytics?.avg_response_ms)
  const queriesToday = analytics?.queries_processed_today

  return (
    <Panel className="p-5 sm:p-6" delay={delay}>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <CardHeading icon={Radar} title="Retrieval-Augmented Generation Pipeline" />

        <div className="flex items-center gap-2">
          {loading && !analytics ? (
            <Shimmer className="h-6 w-32 rounded-full" />
          ) : (
            <>
              {queriesToday != null && (
                <span className="hidden rounded-full border border-white/85 bg-white/65 px-2.5 py-1 text-[10.5px] font-medium text-slate-500 shadow-[0_1px_2px_rgba(16,32,64,0.04)] sm:inline-flex">
                  <span className="tabular-nums font-semibold text-slate-700">
                    {queriesToday.toLocaleString()}
                  </span>
                  <span className="ml-1">queries today</span>
                </span>
              )}
              {totalLatency && (
                <span className="hidden rounded-full border border-white/85 bg-white/65 px-2.5 py-1 text-[10.5px] font-medium text-slate-500 shadow-[0_1px_2px_rgba(16,32,64,0.04)] md:inline-flex">
                  <span className="tabular-nums font-semibold text-slate-700">{totalLatency}</span>
                  <span className="ml-1">avg end-to-end</span>
                </span>
              )}
            </>
          )}
          <LiveBadge label="Live Trace" />
        </div>
      </div>

      <div className="vv-pipeline gap-0" role="list" aria-label="Retrieval-augmented generation stages">
        {STAGES.map((stage, index) => (
          <Fragment key={stage.id}>
            <StageTile
              stage={stage}
              index={index}
              latency={stage.metric ? formatLatency(analytics?.[stage.metric] as number | undefined) : null}
            />
            {index < STAGES.length - 1 && <Connector index={index} />}
          </Fragment>
        ))}
      </div>
    </Panel>
  )
}
