import {
  Activity,
  FileText,
  Layers,
  Lock,
  Network,
  ScanEye,
  ShieldCheck,
  TriangleAlert,
  WifiOff,
} from "lucide-react"
import type { SecurityPacket } from "@/types/workstation"
import { LiveDot, Shimmer, useAnimatedNumber } from "./primitives"

/* ═══════════════════════════════════════════════════════════════════════
   Security rail.

   Mirrors the reference layout's right-hand column: a section heading, a
   full-width status field, a tile grid, then a secondary section with a
   feed and a row of compact stats — populated entirely with our own
   air-gap security telemetry.
   ═══════════════════════════════════════════════════════════════════════ */

export type ActivityEvent = {
  type: string
  text: string
  time: string
}

type ControlTile = {
  label: string
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>
  value: string | null
  ok: boolean
}

function buildControls(security: SecurityPacket | null): ControlTile[] {
  return [
    {
      label: "Prompt Injection",
      icon: ShieldCheck,
      value: security ? (security.prompt_injection_protection ? "Protected" : "Disabled") : null,
      ok: security?.prompt_injection_protection === true,
    },
    {
      label: "Sanitization",
      icon: ScanEye,
      value: security ? `${security.sanitization_layers} layers` : null,
      ok: (security?.sanitization_layers ?? 0) > 0,
    },
    {
      label: "Path Traversal",
      icon: Lock,
      value: security ? (security.path_traversal_guard ? "Guarded" : "Exposed") : null,
      ok: security?.path_traversal_guard === true,
    },
    {
      label: "Context Overflow",
      icon: Layers,
      value: security ? (security.context_overflow_protection ? "Protected" : "Disabled") : null,
      ok: security?.context_overflow_protection === true,
    },
    {
      label: "Offline Mode",
      icon: WifiOff,
      value: security ? (security.offline_mode ? "Enforced" : "Online") : null,
      ok: security?.offline_mode === true,
    },
    {
      label: "Outbound Egress",
      icon: Network,
      value: security ? (security.offline_mode ? "Zero" : "Monitored") : null,
      ok: security?.offline_mode === true,
    },
  ]
}

function ControlCard({ tile }: { tile: ControlTile }) {
  const Icon = tile.icon

  return (
    <div className="vv-tile vv-tile--hover flex flex-col items-center gap-2 px-2 py-3.5 text-center">
      <span
        className={
          "inline-flex h-8 w-8 items-center justify-center rounded-[10px] " +
          (tile.ok
            ? "bg-emerald-500/10 text-emerald-600 shadow-[inset_0_0_0_1px_rgba(5,150,105,0.18)]"
            : "bg-slate-500/10 text-slate-400 shadow-[inset_0_0_0_1px_rgba(100,116,139,0.16)]")
        }
      >
        <Icon className="h-4 w-4" strokeWidth={1.9} />
      </span>

      <span className="text-[10.5px] font-semibold leading-tight text-slate-600">{tile.label}</span>

      {tile.value == null ? (
        <Shimmer className="h-2.5 w-12 rounded" />
      ) : (
        <span
          className={
            "text-[10px] font-semibold leading-none " + (tile.ok ? "text-emerald-600" : "text-slate-400")
          }
        >
          {tile.value}
        </span>
      )}
    </div>
  )
}

function StatPill({ label, value }: { label: string; value: number | null }) {
  const animated = useAnimatedNumber(value ?? 0)

  return (
    <div className="vv-tile min-w-0 px-3 py-2.5">
      <div className="vv-eyebrow mb-1 truncate">{label}</div>
      {value == null ? (
        <Shimmer className="h-4 w-8 rounded" />
      ) : (
        <div className="vv-metric-sm">{Math.round(animated).toLocaleString()}</div>
      )}
    </div>
  )
}

export function SecurityRail({
  security,
  events,
  delay = 0,
}: {
  security: SecurityPacket | null
  events: ActivityEvent[]
  delay?: number
}) {
  const controls = buildControls(security)
  const riskTier = security?.risk_tier ?? null
  const threatsBlocked = security?.threats_blocked ?? null

  return (
    <aside
      className="vv-card vv-rise flex h-full min-h-0 flex-col gap-5 p-5 sm:p-6"
      style={{ animationDelay: `${delay}ms` }}
      aria-label="Security posture and recent activity"
    >
      {/* ── Section 1: posture ── */}
      <div>
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="vv-title-section">Security Posture</h2>
          {riskTier ? (
            <span className="rounded-full border border-emerald-200/70 bg-emerald-50/80 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.08em] text-emerald-700">
              {riskTier} risk
            </span>
          ) : (
            <Shimmer className="h-6 w-16 rounded-full" />
          )}
        </div>

        {/* Full-width status field — the reference's search-bar slot. */}
        <div className="mb-3.5 flex items-center gap-3 rounded-2xl border border-white/90 bg-white/70 px-4 py-3 shadow-[0_1px_2px_rgba(16,32,64,0.04),inset_0_1px_0_rgba(255,255,255,0.9)]">
          <LiveDot className="text-emerald-500" />
          <div className="min-w-0 flex-1">
            <div className="text-[12.5px] font-semibold text-slate-700">Threat Detection Active</div>
            <div className="text-[10.5px] font-medium text-slate-400">
              Continuous monitoring · air-gap enforced
            </div>
          </div>
          {threatsBlocked != null && (
            <div className="shrink-0 text-right">
              <div className="text-[15px] font-semibold tabular-nums leading-none text-slate-700">
                {threatsBlocked.toLocaleString()}
              </div>
              <div className="mt-1 text-[9.5px] font-semibold uppercase tracking-[0.08em] text-slate-400">
                Blocked
              </div>
            </div>
          )}
        </div>

        {/* 3-up in the rail, 6-up while the rail is stacked full-width. */}
        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-6 xl:grid-cols-3">
          {controls.map((tile) => (
            <ControlCard key={tile.label} tile={tile} />
          ))}
        </div>
      </div>

      {/* ── Section 2: activity ── */}
      <div className="flex min-h-0 flex-1 flex-col">
        <div className="mb-3.5 flex items-center justify-between gap-3">
          <h2 className="vv-title-section">Recent Activity</h2>
          <Activity className="h-4 w-4 text-slate-300" strokeWidth={2} />
        </div>

        <div className="min-h-0 flex-1 space-y-1 overflow-y-auto fluent-scrollbar">
          {events.map((event, index) => {
            const isEmpty = event.time === "--"

            return (
              <div
                key={`${event.text}-${index}`}
                className="vv-row flex items-start gap-2.5 px-2.5 py-2"
              >
                {isEmpty ? (
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-slate-300" />
                ) : event.type === "alert" ? (
                  <TriangleAlert className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-500" strokeWidth={2} />
                ) : (
                  <FileText className="mt-0.5 h-3.5 w-3.5 shrink-0 text-sky-500" strokeWidth={2} />
                )}

                <div className="min-w-0 flex-1">
                  <p
                    className={
                      "truncate text-[11.5px] font-medium " +
                      (isEmpty ? "italic text-slate-400" : "text-slate-700")
                    }
                    title={event.text}
                  >
                    {event.text}
                  </p>
                  {!isEmpty && (
                    <p className="mt-0.5 text-[10px] font-medium text-slate-400">{event.time}</p>
                  )}
                </div>
              </div>
            )
          })}
        </div>

        <div className="mt-4 grid grid-cols-3 gap-2.5">
          <StatPill label="Sanitized" value={security?.sanitized_queries ?? null} />
          <StatPill label="Injections" value={security?.prompt_injections_blocked ?? null} />
          <StatPill label="Rejected" value={security?.uploads_rejected ?? null} />
        </div>
      </div>
    </aside>
  )
}
