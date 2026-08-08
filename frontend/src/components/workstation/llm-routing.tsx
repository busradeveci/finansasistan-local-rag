import { Fragment, type CSSProperties } from "react"
import {
  ArrowRight,
  Boxes,
  Brain,
  CircleDot,
  Cpu,
  FileText,
  Layers,
  ListChecks,
  MessagesSquare,
  Radar,
  Route,
  Server,
  Shield,
  Waypoints,
} from "lucide-react"
import { useWorkstationData } from "@/components/workstation/use-workstation-data"
import { CardHeading, LiveBadge, Panel, tint } from "@/components/workstation/overview/primitives"

const LOADING = "Loading…"
const NOT_AVAILABLE = "Not available"
const NOT_REPORTED = "Not reported"

function formatDecisionTime(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  return d.toLocaleString([], {
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  })
}

/* ── Overview strip ───────────────────────────────────────────────────── */

function OverviewStat({
  icon: Icon,
  label,
  value,
  muted,
  leading,
  title,
}: {
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>
  label: string
  value: string
  muted?: boolean
  leading?: React.ReactNode
  title?: string
}) {
  return (
    <div className="vv-tile vv-tile--hover flex min-w-0 flex-col justify-center px-3.5 py-3">
      <div className="mb-1.5 flex items-center gap-1.5">
        <Icon className="h-3.5 w-3.5 shrink-0 text-slate-400" strokeWidth={1.9} />
        <span className="vv-eyebrow truncate">{label}</span>
      </div>
      <div className="flex items-center gap-2">
        {leading}
        <span
          className={`truncate text-[13.5px] tabular-nums ${
            muted ? "font-normal not-italic text-slate-400" : "font-semibold text-slate-700"
          }`}
          title={title ?? value}
        >
          {value}
        </span>
      </div>
    </div>
  )
}

/* ── Loaded-state badge ───────────────────────────────────────────────── */

function LoadedBadge({ loaded }: { loaded?: boolean }) {
  if (loaded === true) {
    return (
      <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-emerald-200/70 bg-emerald-50/80 px-2.5 py-0.5 text-[10.5px] font-semibold text-emerald-700">
        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
        Loaded
      </span>
    )
  }
  if (loaded === false) {
    return (
      <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-white/80 bg-white/70 px-2.5 py-0.5 text-[10.5px] font-semibold text-slate-500">
        <span className="h-1.5 w-1.5 rounded-full bg-slate-400" />
        Idle
      </span>
    )
  }
  return (
    <span className="inline-flex shrink-0 items-center rounded-full border border-white/80 bg-white/70 px-2.5 py-0.5 text-[10.5px] font-semibold text-slate-400">
      {NOT_AVAILABLE}
    </span>
  )
}

/* ── Registry metadata cell ───────────────────────────────────────────── */

function Meta({
  label,
  value,
  muted,
  mono,
}: {
  label: string
  value: string
  muted?: boolean
  mono?: boolean
}) {
  return (
    <div className="flex min-w-0 flex-col gap-0.5">
      <span className="vv-eyebrow">{label}</span>
      <span
        className={`truncate text-[12px] ${mono ? "font-mono" : ""} ${
          muted ? "font-normal not-italic text-slate-400" : "font-medium text-slate-600"
        }`}
        title={value}
      >
        {value}
      </span>
    </div>
  )
}

/* ── Routing decision flow ────────────────────────────────────────────── */

const FLOW_CYCLE = 6.3
const FLOW_SLOT = FLOW_CYCLE / 6

type FlowVars = CSSProperties & {
  "--vv-delay"?: string
  "--vv-stage-glow"?: string
}

type FlowStage = {
  id: string
  name: string
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>
  color: string
  emphasis?: boolean
  status?: string | null
}

function FlowStageTile({ stage, index }: { stage: FlowStage; index: number }) {
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
          } as FlowVars
        }
      >
        <Icon className="h-4 w-4" strokeWidth={1.9} />
      </span>

      <span
        className={`relative z-10 px-0.5 text-center text-[9.5px] uppercase leading-[1.25] tracking-[0.055em] ${
          stage.emphasis ? "font-semibold text-slate-600" : "font-medium text-slate-500"
        }`}
      >
        {stage.name}
      </span>

      {stage.status && (
        <span
          className="relative z-10 rounded-full px-1.5 py-px text-[9px] font-semibold uppercase tracking-[0.05em]"
          style={{ color: stage.color, background: tint(stage.color, 0.1) }}
        >
          {stage.status}
        </span>
      )}
    </div>
  )
}

function FlowConnector({ index }: { index: number }) {
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

/* ═══════════════════════════════════════════════════════════════════════
   Model Routing — enterprise control-center surfaces built on the vv system.
   ═══════════════════════════════════════════════════════════════════════ */

export function LlmRouting() {
  const { status, analytics, loading } = useWorkstationData()

  const runtime = status?.runtime_state ?? null
  const routerModel = status?.models?.router_model ?? (loading ? LOADING : NOT_AVAILABLE)
  const chatModel = status?.models?.chat_model ?? (loading ? LOADING : NOT_AVAILABLE)
  const embedModel = status?.models?.embed_model ?? (loading ? LOADING : NOT_AVAILABLE)

  const endpoint = runtime?.endpoint ?? null
  const routerLoaded = runtime?.models?.router?.loaded ?? false

  // Router status reflects the real, in-process runtime — never a static badge.
  const routerOnline = status != null
  const routerStatusLabel = !status
    ? loading
      ? LOADING
      : NOT_AVAILABLE
    : routerLoaded
      ? "Active"
      : "Warming up"

  const totalRouted =
    analytics?.total_routed != null ? analytics.total_routed.toLocaleString() : loading ? LOADING : "0"

  const decisions = analytics?.recent_routing_decisions ?? []

  const models = [
    {
      role: "Router Engine",
      icon: Route,
      name: routerModel,
      purpose: "Intent Classification",
      loaded: runtime?.models?.router?.loaded,
    },
    {
      role: "Chat Engine",
      icon: MessagesSquare,
      name: chatModel,
      purpose: "General Conversation & RAG",
      loaded: runtime?.models?.chat?.loaded,
    },
    {
      role: "Embedding Engine",
      icon: Layers,
      name: embedModel,
      purpose: "Vector Generation",
      loaded: runtime?.models?.embed?.loaded,
    },
  ]

  const flowStages: FlowStage[] = [
    { id: "query", name: "User Query", icon: FileText, color: "#64748b" },
    { id: "intent", name: "Intent Classification", icon: CircleDot, color: "#4f46e5" },
    {
      id: "router",
      name: "Semantic Router",
      icon: Route,
      color: "#2563eb",
      emphasis: true,
      status: routerOnline ? routerStatusLabel : null,
    },
    { id: "model", name: "Model Selection", icon: Brain, color: "#0d9488" },
    { id: "response", name: "Response Generation", icon: Server, color: "#059669" },
  ]

  const policies = [
    { rule: "Numerical Query", target: "Local Agent (phi-4-mini)", reason: "Numerical computation detected" },
    { rule: "Document Question", target: "Local RAG", reason: "Document retrieval required" },
    { rule: "General Conversation", target: "Chat Model", reason: "No retrieval required" },
  ]

  return (
    <div className="flex flex-col gap-5">
      {/* 1. Routing Overview ─────────────────────────────────────────────── */}
      <Panel className="p-5" delay={0}>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <CardHeading icon={Radar} title="Routing Overview" />
          <LiveBadge label="Live" />
        </div>
        <div className="grid grid-cols-2 gap-2.5 lg:grid-cols-4">
          <OverviewStat
            icon={Waypoints}
            label="Router Status"
            value={routerStatusLabel}
            muted={!routerOnline}
            leading={
              routerOnline ? (
                <span className="relative flex h-2.5 w-2.5 shrink-0">
                  <span
                    className={`absolute inline-flex h-full w-full rounded-full opacity-70 ${
                      routerLoaded ? "animate-ping bg-emerald-400" : "bg-amber-400"
                    }`}
                  />
                  <span
                    className={`relative inline-flex h-2.5 w-2.5 rounded-full ${
                      routerLoaded ? "bg-emerald-500" : "bg-amber-500"
                    }`}
                  />
                </span>
              ) : undefined
            }
          />
          <OverviewStat icon={Cpu} label="Active Router" value={routerModel} muted={!status} />
          <OverviewStat icon={Shield} label="Routing Policy" value="Semantic Intent Classification" />
          <OverviewStat icon={Route} label="Total Routed" value={totalRouted} muted={!analytics} />
        </div>
      </Panel>

      {/* 2. Routing Decision Flow ────────────────────────────────────────── */}
      <Panel className="p-5 sm:p-6" delay={70}>
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <CardHeading icon={Waypoints} title="Routing Decision Flow" />
          <LiveBadge label="Live Trace" />
        </div>
        <div className="vv-pipeline gap-0" role="list" aria-label="Routing decision stages">
          {flowStages.map((stage, index) => (
            <Fragment key={stage.id}>
              <FlowStageTile stage={stage} index={index} />
              {index < flowStages.length - 1 && <FlowConnector index={index} />}
            </Fragment>
          ))}
        </div>
      </Panel>

      {/* 3. Registered Model Registry ────────────────────────────────────── */}
      <Panel className="p-5 sm:p-6" delay={140}>
        <div className="mb-4 flex items-center justify-between gap-3">
          <CardHeading icon={Boxes} title="Model Registry" />
          <span className="hidden text-[11px] font-medium text-slate-400 sm:inline">
            {models.length} engines
          </span>
        </div>
        <div className="flex flex-col divide-y divide-white/60">
          {models.map((m) => {
            const Icon = m.icon
            return (
              <div key={m.role} className="flex flex-col gap-3 py-4 first:pt-0 last:pb-0">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-2.5">
                    <span className="vv-plate h-8 w-8">
                      <Icon className="h-[15px] w-[15px]" strokeWidth={1.9} />
                    </span>
                    <div className="min-w-0">
                      <div className="vv-eyebrow">{m.role}</div>
                      <div
                        className="truncate text-[13px] font-semibold text-slate-700"
                        title={m.name}
                      >
                        {m.name}
                      </div>
                    </div>
                  </div>
                  <LoadedBadge loaded={m.loaded} />
                </div>

                <div className="grid grid-cols-2 gap-x-6 gap-y-2.5 border-t border-white/60 pt-3 sm:grid-cols-4">
                  <Meta label="Purpose" value={m.purpose} />
                  <Meta label="Context Window" value={NOT_REPORTED} muted />
                  <Meta label="Quantization" value={NOT_REPORTED} muted />
                  <Meta
                    label="Endpoint"
                    value={endpoint ?? NOT_AVAILABLE}
                    muted={endpoint == null}
                    mono={endpoint != null}
                  />
                </div>
              </div>
            )
          })}
        </div>
      </Panel>

      {/* 4. Routing Policies ─────────────────────────────────────────────── */}
      <Panel className="p-5 sm:p-6" delay={210}>
        <div className="mb-4 flex items-center justify-between gap-3">
          <CardHeading icon={Shield} title="Routing Policies" />
          <span className="hidden text-[11px] font-medium text-slate-400 sm:inline">
            Source · Semantic Router
          </span>
        </div>
        <div className="flex flex-col divide-y divide-white/60">
          {policies.map((policy) => (
            <div
              key={policy.rule}
              className="flex flex-wrap items-center gap-x-4 gap-y-2 py-3.5 first:pt-0 last:pb-0"
            >
              <div className="min-w-0 flex-1">
                <div className="text-[13px] font-semibold text-slate-700">{policy.rule}</div>
                <div className="vv-caption mt-0.5">{policy.reason}</div>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <ArrowRight className="h-3.5 w-3.5 text-slate-300" strokeWidth={2} />
                <span
                  className="inline-flex max-w-[220px] items-center truncate rounded-full border px-2.5 py-1 text-[11.5px] font-medium"
                  style={{
                    color: "var(--vv-accent-deep)",
                    background: "var(--vv-accent-tint)",
                    borderColor: "var(--vv-accent-ring)",
                  }}
                  title={policy.target}
                >
                  {policy.target}
                </span>
              </div>
            </div>
          ))}
        </div>
      </Panel>

      {/* 5. Recent Routing Decisions ─────────────────────────────────────── */}
      <Panel className="overflow-hidden p-0" delay={280}>
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/60 px-5 py-3.5">
          <CardHeading icon={ListChecks} title="Recent Routing Decisions" />
          <span className="inline-flex items-center gap-1.5 rounded-full border border-white/85 bg-white/65 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.09em] text-slate-500 shadow-[0_1px_2px_rgba(16,32,64,0.04)]">
            {decisions.length.toLocaleString()} logged
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse whitespace-nowrap text-left">
            <thead className="bg-white/55 backdrop-blur-md">
              <tr>
                {["Timestamp", "Intent", "Selected Model", "Decision Reason", "Execution Status"].map((h) => (
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
              {decisions.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-14 text-center">
                    <div className="flex flex-col items-center justify-center text-slate-400">
                      <span
                        className="vv-plate mb-3 h-11 w-11"
                        style={{
                          color: "#94a3b8",
                        }}
                      >
                        <Waypoints className="h-5 w-5" strokeWidth={1.7} />
                      </span>
                      <p className="text-[12.5px] font-medium text-slate-500">
                        {loading ? LOADING : "No routing decisions yet"}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                decisions.map((d, i) => (
                  <tr
                    key={`${d.timestamp}-${i}`}
                    className="group border-b border-white/45 transition-colors duration-200 last:border-transparent hover:bg-white/55"
                  >
                    <td className="px-5 py-2.5">
                      <span className="text-[11px] font-medium tabular-nums text-slate-400">
                        {formatDecisionTime(d.timestamp)}
                      </span>
                    </td>
                    <td className="px-5 py-2.5">
                      <span className="inline-flex items-center rounded-md border border-white/80 bg-white/70 px-2 py-0.5 text-[10.5px] font-medium text-slate-600">
                        {d.intent}
                      </span>
                    </td>
                    <td className="px-5 py-2.5">
                      <span
                        className="block max-w-[220px] truncate text-[12px] font-medium text-slate-700"
                        title={d.selected_model}
                      >
                        {d.selected_model}
                      </span>
                    </td>
                    <td className="px-5 py-2.5">
                      <span
                        className="block max-w-[320px] truncate text-[12px] text-slate-500"
                        title={d.reason}
                      >
                        {d.reason}
                      </span>
                    </td>
                    <td className="px-5 py-2.5">
                      <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200/70 bg-emerald-50/80 px-2.5 py-0.5 text-[10.5px] font-semibold text-emerald-700">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                        {d.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Panel>
    </div>
  )
}
