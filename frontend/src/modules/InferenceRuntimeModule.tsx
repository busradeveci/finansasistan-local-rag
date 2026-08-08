import { Fragment, type CSSProperties } from "react"
import {
  Activity,
  BarChart3,
  Boxes,
  Clock,
  Cpu,
  Database,
  FileText,
  Gauge,
  Inbox,
  Layers,
  List,
  ListChecks,
  MessagesSquare,
  Search,
  Server,
  Settings,
  TerminalSquare,
  User,
  Waypoints,
  Zap,
} from "lucide-react"

import { useWorkstation } from "@/context/WorkstationContext"
import { useWorkstationData } from "@/components/workstation/use-workstation-data"
import { CardHeading, LiveDot, Panel, tint } from "@/components/workstation/overview/primitives"

const NOT_REPORTED = "Not reported"
const NOT_AVAILABLE = "Not available"
const LOADING = "Loading…"
const DASH = "—"

/* ── Status badge ─────────────────────────────────────────────────────── */

function StateBadge({
  tone,
  label,
  live,
}: {
  tone: "emerald" | "amber" | "neutral"
  label: string
  live?: boolean
}) {
  if (tone === "emerald") {
    return (
      <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-emerald-200/70 bg-emerald-50/80 px-2.5 py-1 text-[10.5px] font-semibold text-emerald-700">
        {live ? (
          <LiveDot className="text-emerald-500" />
        ) : (
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
        )}
        {label}
      </span>
    )
  }
  if (tone === "amber") {
    return (
      <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-amber-200/70 bg-amber-50/80 px-2.5 py-1 text-[10.5px] font-semibold text-amber-700">
        <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
        {label}
      </span>
    )
  }
  return (
    <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-white/80 bg-white/70 px-2.5 py-1 text-[10.5px] font-semibold text-slate-400">
      {label}
    </span>
  )
}

/* ── Runtime identity tile ────────────────────────────────────────────── */

function IdentityTile({
  icon: Icon,
  label,
  value,
  badge,
}: {
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>
  label: string
  value: string
  badge: React.ReactNode
}) {
  return (
    <div className="vv-tile vv-tile--hover flex min-w-0 flex-col gap-2.5 px-3.5 py-3">
      <div className="flex items-center gap-1.5">
        <Icon className="h-3.5 w-3.5 shrink-0 text-slate-400" strokeWidth={1.9} />
        <span className="vv-eyebrow truncate">{label}</span>
      </div>
      <div className="flex items-center justify-between gap-2">
        <span className="truncate text-[13.5px] font-semibold text-slate-700" title={value}>
          {value}
        </span>
        {badge}
      </div>
    </div>
  )
}

/* ── Metric tile ──────────────────────────────────────────────────────── */

function MetricTile({
  icon: Icon,
  label,
  value,
  status,
  muted,
  live,
}: {
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>
  label: string
  value: string
  status: string
  muted?: boolean
  live?: boolean
}) {
  return (
    <div className="vv-tile vv-tile--hover flex min-w-0 flex-col gap-1.5 px-3.5 py-3">
      <div className="flex items-center gap-1.5">
        <Icon className="h-3.5 w-3.5 shrink-0 text-slate-400" strokeWidth={1.9} />
        <span className="vv-eyebrow truncate">{label}</span>
      </div>
      <span
        className={`text-[17px] leading-none tabular-nums ${
          muted ? "font-normal text-slate-400" : "font-semibold text-slate-700"
        }`}
      >
        {value}
      </span>
      <span className="flex items-center gap-1.5 text-[10.5px] font-medium text-slate-400">
        {live && <LiveDot className="text-emerald-500" />}
        <span className="truncate">{status}</span>
      </span>
    </div>
  )
}

/* ── Inference pipeline ───────────────────────────────────────────────── */

const FLOW_CYCLE = 6.3
const FLOW_SLOT = FLOW_CYCLE / 7

type FlowVars = CSSProperties & {
  "--vv-delay"?: string
  "--vv-stage-glow"?: string
}

type Stage = {
  id: string
  name: string
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>
  color: string
}

const PIPELINE: Stage[] = [
  { id: "query", name: "User Query", icon: User, color: "#64748b" },
  { id: "prompt", name: "Prompt Processing", icon: FileText, color: "#6366f1" },
  { id: "embed", name: "Embedding Generation", icon: Layers, color: "#4f46e5" },
  { id: "search", name: "Vector Search", icon: Search, color: "#2563eb" },
  { id: "context", name: "Context Assembly", icon: Database, color: "#0d9488" },
  { id: "llm", name: "LLM Inference", icon: Cpu, color: "#0891b2" },
  { id: "stream", name: "Streaming Response", icon: Zap, color: "#059669" },
]

function PipelineStage({ stage, index }: { stage: Stage; index: number }) {
  const Icon = stage.icon
  const delay = `${(index * FLOW_SLOT).toFixed(3)}s`

  return (
    <div
      className="vv-stage group"
      style={{ "--vv-delay": delay, "--vv-stage-glow": tint(stage.color, 0.22) } as FlowVars}
    >
      <span className="vv-stage__glow" style={{ "--vv-delay": delay } as FlowVars} />
      <span
        className="vv-stage__icon"
        style={
          {
            "--vv-delay": delay,
            color: stage.color,
            background: tint(stage.color, 0.11),
            boxShadow: `inset 0 0 0 1px ${tint(stage.color, 0.2)}`,
          } as FlowVars
        }
      >
        <Icon className="h-4 w-4" strokeWidth={1.9} />
      </span>
      <span className="relative z-10 px-0.5 text-center text-[9.5px] font-medium uppercase leading-[1.25] tracking-[0.055em] text-slate-500">
        {stage.name}
      </span>
    </div>
  )
}

function PipelineConnector({ index }: { index: number }) {
  const delay = `${(index * FLOW_SLOT).toFixed(3)}s`
  return (
    <div className="vv-flow" aria-hidden="true">
      <span className="vv-flow__line" />
      <span className="vv-flow__runner" style={{ "--vv-delay": delay } as FlowVars}>
        <span className="vv-flow__comet" />
      </span>
    </div>
  )
}

/* ── Empty state ──────────────────────────────────────────────────────── */

function EmptyState({
  icon: Icon,
  title,
  detail,
  colSpan,
}: {
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>
  title: string
  detail: string
  colSpan: number
}) {
  return (
    <tr>
      <td colSpan={colSpan} className="py-14 text-center">
        <div className="mx-auto flex max-w-xs flex-col items-center justify-center text-slate-400">
          <span
            className="vv-plate mb-3 h-11 w-11"
            style={{
              color: "#94a3b8",
              background: "rgba(148,163,184,0.12)",
              boxShadow: "inset 0 0 0 1px rgba(148,163,184,0.2)",
            }}
          >
            <Icon className="h-5 w-5" strokeWidth={1.7} />
          </span>
          <p className="text-[12.5px] font-medium text-slate-500">{title}</p>
          <p className="mt-1 text-[11px] font-normal leading-relaxed text-slate-400">
            No data yet. {detail}
          </p>
        </div>
      </td>
    </tr>
  )
}

/* ═══════════════════════════════════════════════════════════════════════
   Inference Runtime — enterprise runtime control surface on the vv system.
   ═══════════════════════════════════════════════════════════════════════ */

export default function InferenceRuntimeModule() {
  const { isGenerating } = useWorkstation()
  const { status, loading } = useWorkstationData()

  const runtime = status?.runtime_state ?? null
  const online = status != null
  const provider = runtime?.provider ?? (online ? "Foundry Local" : loading ? LOADING : NOT_AVAILABLE)

  const chatModel = status?.models?.chat_model ?? (loading ? LOADING : NOT_AVAILABLE)
  const embedModel = status?.models?.embed_model ?? (loading ? LOADING : NOT_AVAILABLE)
  const chatLoaded = runtime?.models?.chat?.loaded
  const embedLoaded = runtime?.models?.embed?.loaded

  // The active stream count is known for this operator session only.
  const activeStreams = isGenerating ? 1 : 0

  const loadedBadge = (loaded?: boolean) =>
    loaded === true ? (
      <StateBadge tone="emerald" label="Loaded" />
    ) : loaded === false ? (
      <StateBadge tone="neutral" label="Idle" />
    ) : (
      <StateBadge tone="neutral" label={NOT_REPORTED} />
    )

  return (
    <div className="flex h-full min-h-0 w-full flex-col overflow-hidden p-4 sm:p-5 lg:p-6">
      <div className="mx-auto flex h-full min-h-0 w-full max-w-[1680px] flex-col gap-5">
        {/* Header ─────────────────────────────────────────────────────── */}
        <header className="flex flex-none flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <span className="vv-plate h-8 w-8">
              <Cpu className="h-[16px] w-[16px]" strokeWidth={1.9} />
            </span>
            <div className="min-w-0">
              <h1 className="vv-title-section">Inference Runtime</h1>
              <p className="vv-caption mt-0.5">
                Dedicated operational center for the Enterprise Local RAG runtime.
              </p>
            </div>
          </div>
          {online ? (
            <StateBadge tone="emerald" label="Operational" live />
          ) : (
            <StateBadge tone="amber" label={loading ? "Connecting…" : "Offline"} />
          )}
        </header>

        <div className="fluent-scrollbar min-h-0 flex-1 overflow-y-auto pb-6">
          <div className="flex flex-col gap-5">
            {/* 1. Runtime Overview ────────────────────────────────────── */}
            <Panel className="p-5 sm:p-6" delay={0}>
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <CardHeading icon={Gauge} title="Runtime Overview" />
                <span className="text-[11px] font-medium text-slate-400">
                  {online ? "Foundry Local runtime" : loading ? LOADING : NOT_AVAILABLE}
                </span>
              </div>

              {/* Runtime identity */}
              <div className="mb-2 flex items-center gap-2">
                <span className="vv-eyebrow">Runtime Identity</span>
                <span className="h-px flex-1 bg-white/60" />
              </div>
              <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3">
                <IdentityTile
                  icon={Settings}
                  label="Runtime Provider"
                  value={provider}
                  badge={
                    online ? (
                      <StateBadge tone="emerald" label="Operational" />
                    ) : (
                      <StateBadge tone="neutral" label={loading ? LOADING : NOT_AVAILABLE} />
                    )
                  }
                />
                <IdentityTile
                  icon={MessagesSquare}
                  label="Active Chat Model"
                  value={chatModel}
                  badge={loadedBadge(chatLoaded)}
                />
                <IdentityTile
                  icon={Server}
                  label="Embedding Model"
                  value={embedModel}
                  badge={loadedBadge(embedLoaded)}
                />
              </div>

              {/* Runtime activity & inference metrics */}
              <div className="mb-2 mt-5 flex items-center gap-2">
                <span className="vv-eyebrow">Activity &amp; Inference Metrics</span>
                <span className="h-px flex-1 bg-white/60" />
              </div>
              <div className="grid grid-cols-2 gap-2.5 md:grid-cols-4 xl:grid-cols-7">
                <MetricTile
                  icon={Zap}
                  label="Active Streams"
                  value={online ? String(activeStreams) : DASH}
                  status={isGenerating ? "Streaming" : "Idle"}
                  live={isGenerating}
                />
                <MetricTile icon={List} label="Queue Size" value={DASH} status={NOT_REPORTED} muted />
                <MetricTile icon={Activity} label="Tokens / Sec" value={DASH} status={NOT_REPORTED} muted />
                <MetricTile icon={Clock} label="TTFT" value={DASH} status={NOT_REPORTED} muted />
                <MetricTile icon={Database} label="Prompt Tokens" value={DASH} status={NOT_REPORTED} muted />
                <MetricTile icon={BarChart3} label="Completion Tokens" value={DASH} status={NOT_REPORTED} muted />
                <MetricTile icon={Boxes} label="Context Window" value={DASH} status={NOT_REPORTED} muted />
              </div>
            </Panel>

            {/* 2. Inference Pipeline ──────────────────────────────────── */}
            <Panel className="p-5 sm:p-6" delay={70}>
              <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                <CardHeading icon={Waypoints} title="Inference Pipeline" />
                <span className="text-[11px] font-medium text-slate-400">Retrieval-augmented flow</span>
              </div>
              <div className="vv-pipeline gap-0" role="list" aria-label="Inference pipeline stages">
                {PIPELINE.map((stage, index) => (
                  <Fragment key={stage.id}>
                    <PipelineStage stage={stage} index={index} />
                    {index < PIPELINE.length - 1 && <PipelineConnector index={index} />}
                  </Fragment>
                ))}
              </div>
            </Panel>

            {/* 3. Operational history ─────────────────────────────────── */}
            <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
              {/* Active Runtime Sessions */}
              <Panel className="overflow-hidden p-0" delay={140}>
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/60 px-5 py-3.5">
                  <CardHeading icon={Activity} title="Active Runtime Sessions" />
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-white/85 bg-white/65 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.09em] text-slate-500 shadow-[0_1px_2px_rgba(16,32,64,0.04)]">
                    0 active
                  </span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse whitespace-nowrap text-left">
                    <thead className="bg-white/55 backdrop-blur-md">
                      <tr>
                        {["Session ID", "Current Model", "Started At", "Status", "Tokens"].map((h) => (
                          <th
                            key={h}
                            className="border-b border-white/60 px-5 py-2.5 text-[10.5px] font-semibold uppercase tracking-[0.09em] text-slate-400"
                          >
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      <EmptyState
                        icon={Inbox}
                        title="No Active Sessions"
                        detail="Per-session runtime tracking is not reported."
                        colSpan={5}
                      />
                    </tbody>
                  </table>
                </div>
              </Panel>

              {/* Recent Runtime Events */}
              <Panel className="overflow-hidden p-0" delay={210}>
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/60 px-5 py-3.5">
                  <CardHeading icon={TerminalSquare} title="Recent Runtime Events" />
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-white/85 bg-white/65 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.09em] text-slate-500 shadow-[0_1px_2px_rgba(16,32,64,0.04)]">
                    0 logged
                  </span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse whitespace-nowrap text-left">
                    <thead className="bg-white/55 backdrop-blur-md">
                      <tr>
                        {["Timestamp", "Event Type", "Details"].map((h) => (
                          <th
                            key={h}
                            className="border-b border-white/60 px-5 py-2.5 text-[10.5px] font-semibold uppercase tracking-[0.09em] text-slate-400"
                          >
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      <EmptyState
                        icon={ListChecks}
                        title="Event Log Empty"
                        detail="Runtime event history is not recorded."
                        colSpan={3}
                      />
                    </tbody>
                  </table>
                </div>
              </Panel>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
