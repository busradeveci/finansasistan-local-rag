import { useMemo } from "react"
import {
  Activity,
  Boxes,
  Brain,
  Briefcase,
  Clock,
  Database,
  FolderSearch,
  Lock,
  MessagesSquare,
  Route,
  ShieldCheck,
  Server,
} from "lucide-react"
import type {
  AnalyticsPacket,
  AppModule,
  DocumentInventoryRow,
  TelemetryPacket,
} from "@/types/workstation"
import type { StatusPacket } from "@/components/workstation/use-workstation-data"
import {
  CardHeading,
  DistributionBar,
  LiveBadge,
  LiveDot,
  Panel,
  Shimmer,
  Sparkline,
  formatCount,
  formatLatency,
  tint,
  useAnimatedNumber,
  useMetricHistory,
  type DistributionSegment,
} from "./primitives"

/* ═══════════════════════════════════════════════════════════════════════
   Hero — the operations banner.
   ═══════════════════════════════════════════════════════════════════════ */

function HeroFact({ label, value, loading }: { label: string; value: string | null; loading: boolean }) {
  return (
    <div className="min-w-0 flex-1 px-4 py-2.5 first:pl-5 last:pr-5">
      <div className="vv-eyebrow mb-1">{label}</div>
      {loading || value == null ? (
        <Shimmer className="h-3.5 w-24 rounded" />
      ) : (
        <div className="truncate text-[12.5px] font-semibold text-slate-700" title={value}>
          {value}
        </div>
      )}
    </div>
  )
}

export function HeroBanner({
  status,
  loading,
  lastIngestion,
  delay = 0,
}: {
  status: StatusPacket | null
  loading: boolean
  lastIngestion: string
  delay?: number
}) {
  const isHealthy = status != null

  return (
    <Panel className="relative overflow-hidden p-6 sm:p-7" delay={delay}>
      {/* Ambient field — the light-theme counterpart to the sign-in artwork.
          Deliberately unclipped so the orb blur bleeds smoothly; the card
          itself provides the rounded boundary. */}
      <div className="pointer-events-none absolute inset-y-0 right-0 w-[62%]" aria-hidden="true">
        <div className="vv-dotfield" />
        <span
          className="vv-orb"
          style={{ top: "-22%", right: "6%", width: 220, height: 220, background: "rgba(37,99,235,0.20)" }}
        />
        <span
          className="vv-orb"
          style={{
            bottom: "-30%",
            right: "26%",
            width: 190,
            height: 190,
            background: "rgba(79,70,229,0.16)",
            animationDelay: "-9s",
          }}
        />
        <span
          className="vv-orb"
          style={{
            top: "24%",
            right: "-8%",
            width: 160,
            height: 160,
            background: "rgba(14,165,233,0.16)",
            animationDelay: "-15s",
          }}
        />
        <span
          className="vv-ripple"
          style={{ top: "50%", right: "12%", width: 150, height: 150, marginTop: -75 }}
        />
        <span
          className="vv-ripple"
          style={{ top: "50%", right: "12%", width: 150, height: 150, marginTop: -75, animationDelay: "-3.5s" }}
        />
      </div>

      <div className="relative z-10">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0 max-w-xl">
            <div className="vv-eyebrow mb-2">Secure AI Operations Center</div>
            <h1 className="vv-title-page mb-3">VectorVault Enterprise</h1>
            <p className="vv-body mb-4 max-w-lg">
              Local inference, semantic routing, and enterprise-grade knowledge retrieval — running
              entirely inside your perimeter.
            </p>

            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-white/90 bg-white/70 px-3 py-1.5 text-[11.5px] font-semibold text-slate-600 shadow-[0_1px_2px_rgba(16,32,64,0.04),inset_0_1px_0_rgba(255,255,255,0.9)]">
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" strokeWidth={2} />
                Air-Gapped
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-white/90 bg-white/70 px-3 py-1.5 text-[11.5px] font-semibold text-slate-600 shadow-[0_1px_2px_rgba(16,32,64,0.04),inset_0_1px_0_rgba(255,255,255,0.9)]">
                <Lock className="h-3.5 w-3.5 text-slate-500" strokeWidth={2} />
                Offline
              </span>
            </div>
          </div>

          <div className="shrink-0 lg:text-right">
            <div className="vv-eyebrow mb-2">System Status</div>
            <div
              className={
                "inline-flex items-center gap-2 rounded-full border px-3.5 py-2 text-[13px] font-semibold shadow-[0_1px_2px_rgba(16,32,64,0.04),inset_0_1px_0_rgba(255,255,255,0.9)] " +
                (isHealthy
                  ? "border-emerald-200/70 bg-emerald-50/80 text-emerald-700"
                  : "border-amber-200/70 bg-amber-50/80 text-amber-700")
              }
            >
              <LiveDot className={isHealthy ? "text-emerald-500" : "text-amber-500"} />
              {isHealthy ? "All Systems Operational" : "Initializing…"}
            </div>
          </div>
        </div>

        {/* Runtime strip — the reference's inset detail bar, carrying my runtime facts. */}
        <div className="mt-6 flex flex-col divide-y divide-white/70 overflow-hidden rounded-2xl border border-white/85 bg-white/55 shadow-[0_1px_2px_rgba(16,32,64,0.04),inset_0_1px_0_rgba(255,255,255,0.85)] backdrop-blur-xl sm:flex-row sm:divide-x sm:divide-y-0">
          <HeroFact label="Chat Model" value={status?.models?.chat_model ?? null} loading={loading} />
          <HeroFact label="Embedding Model" value={status?.models?.embed_model ?? null} loading={loading} />
          <HeroFact label="Last Ingestion" value={lastIngestion} loading={false} />
        </div>
      </div>
    </Panel>
  )
}

/* ═══════════════════════════════════════════════════════════════════════
   Quick actions — one-tap routes into the modules.
   ═══════════════════════════════════════════════════════════════════════ */

type QuickAction = {
  id: AppModule
  label: string
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>
}

const QUICK_ACTIONS: QuickAction[] = [
  { id: "chat", label: "Conversation", icon: MessagesSquare },
  { id: "knowledge", label: "Knowledge", icon: FolderSearch },
  { id: "documents", label: "Documents", icon: Briefcase },
  { id: "router", label: "Routing", icon: Route },
  { id: "inference", label: "Inference", icon: Brain },
  { id: "telemetry", label: "Telemetry", icon: Activity },
  { id: "security", label: "Security", icon: ShieldCheck },
]

export function QuickActions({
  onNavigate,
  documentCount,
  delay = 0,
}: {
  onNavigate: (module: AppModule) => void
  documentCount: number
  delay?: number
}) {
  return (
    <nav
      className="vv-rise grid grid-cols-4 gap-x-2 gap-y-5 px-1 sm:grid-cols-7"
      style={{ animationDelay: `${delay}ms` }}
      aria-label="Workspace shortcuts"
    >
      {QUICK_ACTIONS.map((action) => {
        const Icon = action.icon
        const badge = action.id === "documents" && documentCount > 0 ? documentCount : null

        return (
          <button
            key={action.id}
            type="button"
            onClick={() => onNavigate(action.id)}
            className="vv-qa vv-focus w-full rounded-2xl"
            title={action.label}
          >
            <span className="relative">
              <span className="vv-qa__circle">
                <Icon className="h-[19px] w-[19px]" strokeWidth={1.7} />
              </span>
              {badge != null && (
                <span className="vv-qa__badge">{badge > 99 ? "99+" : badge}</span>
              )}
            </span>
            <span className="vv-qa__label">{action.label}</span>
          </button>
        )
      })}
    </nav>
  )
}

/* ═══════════════════════════════════════════════════════════════════════
   Infrastructure — live host telemetry.
   ═══════════════════════════════════════════════════════════════════════ */

function ModelChip({ label, value, loading }: { label: string; value?: string; loading: boolean }) {
  return (
    <div className="vv-tile min-w-0 px-3 py-2.5">
      <div className="vv-eyebrow mb-1">{label}</div>
      {loading && !value ? (
        <Shimmer className="h-3.5 w-full rounded" />
      ) : (
        <div className="truncate text-[12px] font-semibold text-slate-700" title={value ?? "Unavailable"}>
          {value ?? "Unavailable"}
        </div>
      )}
    </div>
  )
}

function MetricRow({
  label,
  value,
  format,
  history,
  color,
  caption,
}: {
  label: string
  value: number | null
  format: (value: number) => string
  history: number[]
  color: string
  caption?: string | null
}) {
  const animated = useAnimatedNumber(value ?? 0)
  const hasValue = value != null

  return (
    <div className="vv-row flex items-center justify-between gap-4 px-2.5 py-2">
      <div className="min-w-0">
        <div className="mb-0.5 text-[11.5px] font-medium text-slate-500">{label}</div>
        {hasValue ? (
          <div className="flex items-baseline gap-1.5">
            <span className="vv-metric-sm">{format(animated)}</span>
            {caption && <span className="text-[10.5px] font-medium text-slate-400">{caption}</span>}
          </div>
        ) : (
          <Shimmer className="h-4 w-16 rounded" />
        )}
      </div>

      <div className="w-24 shrink-0 sm:w-28">
        <Sparkline values={history} color={color} height={32} />
      </div>
    </div>
  )
}

export function InfrastructurePanel({
  status,
  telemetry,
  analytics,
  loading,
  delay = 0,
}: {
  status: StatusPacket | null
  telemetry: TelemetryPacket | null
  analytics: AnalyticsPacket | null
  loading: boolean
  delay?: number
}) {
  const cpu = telemetry?.cpu?.percent ?? null
  const memoryPercent = telemetry?.memory?.percent ?? null
  const gpuAvailable = telemetry?.gpu?.available === true

  // Third row adapts to the host: GPU where present, generation latency otherwise.
  const thirdValue = gpuAvailable
    ? telemetry?.gpu?.percent ?? null
    : analytics?.avg_generation_ms ?? null

  const cpuHistory = useMetricHistory(cpu)
  const memoryHistory = useMetricHistory(memoryPercent)
  const thirdHistory = useMetricHistory(thirdValue)

  const usedGb = telemetry?.memory?.used_gb
  const totalGb = telemetry?.memory?.total_gb

  return (
    <Panel className="flex flex-col gap-4 p-5 sm:p-6" interactive delay={delay}>
      <CardHeading
        icon={Server}
        title="Infrastructure"
        tone="#4f46e5"
        action={<LiveBadge />}
      />

      <div className="grid grid-cols-2 gap-2.5">
        <ModelChip label="Chat Model" value={status?.models?.chat_model} loading={loading} />
        <ModelChip label="Embedding Model" value={status?.models?.embed_model} loading={loading} />
      </div>

      <div className="-mx-1 flex flex-1 flex-col justify-center gap-0.5">
        <MetricRow
          label="CPU Utilisation"
          value={cpu}
          format={(value) => `${value.toFixed(0)}%`}
          history={cpuHistory}
          color="#2563eb"
        />
        <MetricRow
          label="Memory"
          value={memoryPercent}
          format={(value) => `${value.toFixed(0)}%`}
          history={memoryHistory}
          color="#4f46e5"
          caption={usedGb != null && totalGb != null ? `${usedGb.toFixed(1)} / ${totalGb.toFixed(0)} GB` : null}
        />
        <MetricRow
          label={gpuAvailable ? "GPU Utilisation" : "Generation Latency"}
          value={thirdValue}
          format={(value) => (gpuAvailable ? `${value.toFixed(0)}%` : formatLatency(value) ?? "—")}
          history={thirdHistory}
          color="#0d9488"
        />
      </div>
    </Panel>
  )
}

/* ═══════════════════════════════════════════════════════════════════════
   Knowledge analytics — corpus shape and index health.
   ═══════════════════════════════════════════════════════════════════════ */

const TYPE_COLORS = ["#2563eb", "#0ea5e9", "#6366f1", "#0d9488", "#94a3b8"]

/** Derives the real file-type mix from the indexed inventory. */
function buildDistribution(rows: DocumentInventoryRow[]): DistributionSegment[] {
  if (rows.length === 0) return []

  const counts = new Map<string, number>()
  for (const row of rows) {
    const raw = (row.file_type ?? row.type ?? row.filename.split(".").pop() ?? "other")
      .toString()
      .trim()
      .replace(/^\./, "")
      .toUpperCase()
    const key = raw.length > 0 && raw.length <= 5 ? raw : "OTHER"
    counts.set(key, (counts.get(key) ?? 0) + 1)
  }

  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, TYPE_COLORS.length)
    .map(([label, count], index) => ({
      label,
      count,
      percent: (count / rows.length) * 100,
      color: TYPE_COLORS[index],
    }))
}

function BigMetric({ label, value, loading }: { label: string; value: number; loading: boolean }) {
  const animated = useAnimatedNumber(value)

  return (
    <div className="vv-tile vv-tile--hover px-4 py-3.5">
      {loading && value === 0 ? (
        <Shimmer className="mb-2 h-7 w-16 rounded" />
      ) : (
        <div className="vv-metric mb-1.5">{formatCount(animated)}</div>
      )}
      <div className="vv-eyebrow">{label}</div>
    </div>
  )
}

export function KnowledgePanel({
  documentCount,
  chunkCount,
  documentInventory,
  documentIndex,
  telemetry,
  lastIngestion,
  loading,
  delay = 0,
}: {
  documentCount: number
  chunkCount: number
  documentInventory: DocumentInventoryRow[]
  documentIndex: { vectors: number; dimensions: number } | null
  telemetry: TelemetryPacket | null
  lastIngestion: string
  loading: boolean
  delay?: number
}) {
  const distribution = useMemo(() => buildDistribution(documentInventory), [documentInventory])

  const vectors = documentIndex?.vectors ?? telemetry?.vector_db?.vectors ?? null
  const dimensions = documentIndex?.dimensions ?? telemetry?.vector_db?.dimensions ?? null
  const engine = telemetry?.vector_db?.engine ?? null

  return (
    <Panel className="flex flex-col gap-4 p-5 sm:p-6" interactive delay={delay}>
      <CardHeading
        icon={Database}
        title="Knowledge Analytics"
        tone="#0ea5e9"
        action={
          engine ? (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-white/85 bg-white/65 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.08em] text-slate-500">
              <Boxes className="h-3 w-3" strokeWidth={2} />
              {engine}
            </span>
          ) : null
        }
      />

      <div className="grid grid-cols-2 gap-2.5">
        <BigMetric label="Documents" value={documentCount} loading={loading} />
        <BigMetric label="Chunks" value={chunkCount} loading={loading} />
      </div>

      <div className="grid grid-cols-2 gap-2.5">
        <div className="vv-tile px-3 py-2.5">
          <div className="vv-eyebrow mb-1">Vectors</div>
          {vectors == null ? (
            <Shimmer className="h-3.5 w-14 rounded" />
          ) : (
            <div className="text-[12.5px] font-semibold tabular-nums text-slate-700">
              {vectors.toLocaleString()}
            </div>
          )}
        </div>
        <div className="vv-tile px-3 py-2.5">
          <div className="vv-eyebrow mb-1">Dimensions</div>
          {dimensions == null ? (
            <Shimmer className="h-3.5 w-14 rounded" />
          ) : (
            <div className="text-[12.5px] font-semibold tabular-nums text-slate-700">
              {dimensions.toLocaleString()}
            </div>
          )}
        </div>
      </div>

      <div className="flex-1">
        <div className="mb-2 text-[11.5px] font-medium text-slate-500">File Type Distribution</div>
        {distribution.length === 0 ? (
          <Shimmer className="h-2 w-full rounded-full" />
        ) : (
          <>
            <DistributionBar segments={distribution} />
            <div className="mt-2.5 flex flex-wrap items-center gap-x-3.5 gap-y-1.5">
              {distribution.map((segment) => (
                <span
                  key={segment.label}
                  className="inline-flex items-center gap-1.5 text-[10.5px] font-semibold text-slate-500"
                >
                  <span
                    className="h-1.5 w-1.5 rounded-full"
                    style={{ background: segment.color, boxShadow: `0 0 0 2px ${tint(segment.color, 0.15)}` }}
                  />
                  {segment.label}
                  <span className="font-medium text-slate-400">{Math.round(segment.percent)}%</span>
                </span>
              ))}
            </div>
          </>
        )}
      </div>

      <div className="flex items-center gap-1.5 border-t border-white/70 pt-3 text-[10.5px] font-medium text-slate-400">
        <Clock className="h-3 w-3" strokeWidth={2} />
        <span className="truncate">Last ingestion · {lastIngestion}</span>
      </div>
    </Panel>
  )
}
