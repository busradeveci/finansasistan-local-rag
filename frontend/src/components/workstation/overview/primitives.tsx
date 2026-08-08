import { useEffect, useId, useRef, useState, type CSSProperties, type ReactNode } from "react"

/* ═══════════════════════════════════════════════════════════════════════
   Shared primitives for the Workstation overview.
   Every surface, label and chart in the dashboard is composed from these,
   which is what keeps spacing, elevation and icon sizing consistent.
   ═══════════════════════════════════════════════════════════════════════ */

/* ── Hooks ────────────────────────────────────────────────────────────── */

/**
 * Keeps a rolling window of a polled metric so sparklines advance on their own
 * cadence instead of only when the upstream value happens to change.
 */
export function useMetricHistory(
  value: number | null | undefined,
  { size = 32, intervalMs = 2000 }: { size?: number; intervalMs?: number } = {}
): number[] {
  const latest = useRef(value)
  latest.current = value

  const [history, setHistory] = useState<number[]>([])

  useEffect(() => {
    const sample = () =>
      setHistory((prev) => {
        const next = latest.current
        if (next == null || Number.isNaN(next)) return prev
        // Seed a full window on first sample so the chart never renders as a stub.
        const seeded = prev.length > 0 ? [...prev, next] : new Array<number>(10).fill(next)
        return seeded.slice(-size)
      })

    sample()
    const timer = window.setInterval(sample, intervalMs)
    return () => window.clearInterval(timer)
  }, [size, intervalMs])

  return history
}

/** Eases a number towards its target so live metrics never jump. */
export function useAnimatedNumber(target: number, duration = 800): number {
  const [display, setDisplay] = useState(target)
  const displayRef = useRef(target)

  useEffect(() => {
    const from = displayRef.current
    if (from === target) return

    let frame = 0
    const start = performance.now()

    const tick = (now: number) => {
      const progress = Math.min(1, (now - start) / duration)
      const eased = 1 - Math.pow(1 - progress, 3)
      const value = from + (target - from) * eased
      displayRef.current = value
      setDisplay(value)
      if (progress < 1) frame = requestAnimationFrame(tick)
    }

    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [target, duration])

  return display
}

/* ── Formatting ───────────────────────────────────────────────────────── */

export function formatCount(value: number): string {
  return Math.round(value).toLocaleString()
}

export function formatLatency(ms: number | null | undefined): string | null {
  if (ms == null || Number.isNaN(ms)) return null
  if (ms >= 1000) return `${(ms / 1000).toFixed(ms >= 10000 ? 0 : 1)} s`
  return `${Math.round(ms)} ms`
}

/* ── Surfaces ─────────────────────────────────────────────────────────── */

type PanelProps = {
  children: ReactNode
  className?: string
  /** Adds the Fluent hover lift. Use for cards that are scannable, not static. */
  interactive?: boolean
  /** Entrance stagger in milliseconds. */
  delay?: number
  style?: CSSProperties
}

export function Panel({ children, className = "", interactive = false, delay = 0, style }: PanelProps) {
  return (
    <section
      className={`vv-card vv-rise ${interactive ? "vv-card--hover" : ""} ${className}`}
      style={{ animationDelay: `${delay}ms`, ...style }}
    >
      {children}
    </section>
  )
}

type CardHeadingProps = {
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>
  title: string
  /** Accent colour for the icon plate; defaults to the product blue. */
  tone?: string
  action?: ReactNode
}

export function CardHeading({ icon: Icon, title, action }: CardHeadingProps) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div className="flex min-w-0 items-center gap-2.5">
        <Icon className="h-[17px] w-[17px] shrink-0 text-slate-500" strokeWidth={1.9} />
        <h2 className="vv-title-card truncate">{title}</h2>
      </div>
      {action}
    </div>
  )
}

/* ── Status ───────────────────────────────────────────────────────────── */

export function LiveDot({ className = "" }: { className?: string }) {
  return (
    <span className={`vv-live ${className}`} aria-hidden="true">
      <span className="vv-live__ring" />
      <span className="vv-live__core" />
    </span>
  )
}

export function LiveBadge({ label = "Live" }: { label?: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-white/85 bg-white/65 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.09em] text-slate-500 shadow-[0_1px_2px_rgba(16,32,64,0.04)]">
      <LiveDot className="text-emerald-500" />
      {label}
    </span>
  )
}

/* ── Loading ──────────────────────────────────────────────────────────── */

export function Shimmer({ className = "", style }: { className?: string; style?: CSSProperties }) {
  return <span className={`vv-shimmer block ${className}`} style={style} aria-hidden="true" />
}

/** Hex → rgba, so accent tints stay correct without relying on color-mix(). */
export function tint(hex: string, alpha: number): string {
  const normalized = hex.replace("#", "")
  const full =
    normalized.length === 3
      ? normalized.split("").map((c) => c + c).join("")
      : normalized
  const int = Number.parseInt(full, 16)
  if (Number.isNaN(int)) return hex
  const r = (int >> 16) & 255
  const g = (int >> 8) & 255
  const b = int & 255
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

/* ── Sparkline ────────────────────────────────────────────────────────── */

type SparklineProps = {
  values: number[]
  /** Any CSS colour. Drives stroke, area fill and the pulsing head. */
  color: string
  className?: string
  height?: number
}

/**
 * Area sparkline drawn in a normalised 100×H viewBox so it stretches to any
 * column width while keeping a hairline stroke via non-scaling-stroke.
 */
export function Sparkline({ values, color, className = "", height = 34 }: SparklineProps) {
  const gradientId = `vv-spark-${useId().replace(/[^a-zA-Z0-9]/g, "")}`

  if (values.length < 2) {
    return <Shimmer className={`w-full rounded-lg ${className}`} style={{ height }} />
  }

  const width = 100
  const padY = 4
  const min = Math.min(...values)
  const max = Math.max(...values)
  const span = max - min || 1

  const points = values.map((value, index) => {
    const x = (index / (values.length - 1)) * width
    const y = height - padY - ((value - min) / span) * (height - padY * 2)
    return [x, y] as const
  })

  // Smooth through midpoints — reads as a trend line rather than a zig-zag.
  let line = `M ${points[0][0]} ${points[0][1]}`
  for (let i = 1; i < points.length; i += 1) {
    const [prevX, prevY] = points[i - 1]
    const [x, y] = points[i]
    const midX = (prevX + x) / 2
    line += ` Q ${prevX} ${prevY} ${midX} ${(prevY + y) / 2}`
    if (i === points.length - 1) line += ` T ${x} ${y}`
  }

  const area = `${line} L ${width} ${height} L 0 ${height} Z`
  const [headX, headY] = points[points.length - 1]

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="none"
      className={className}
      style={{ height, width: "100%", display: "block" }}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.24" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>

      <path d={area} fill={`url(#${gradientId})`} />
      <path
        className="vv-spark__line"
        d={line}
        fill="none"
        stroke={color}
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
        pathLength={1}
        strokeDasharray="1"
      />
      {/* preserveAspectRatio="none" would squash a circle, so the head is a
          non-scaling-stroke ring plus a tiny scaled ellipse. */}
      <ellipse className="vv-spark__head" cx={headX} cy={headY} rx="2.4" ry="2.4" fill={color} />
      <ellipse cx={headX} cy={headY} rx="1.6" ry="1.6" fill={color} />
    </svg>
  )
}

/* ── Distribution bar ─────────────────────────────────────────────────── */

export type DistributionSegment = {
  label: string
  count: number
  percent: number
  color: string
}

export function DistributionBar({ segments }: { segments: DistributionSegment[] }) {
  return (
    <div className="flex h-2 w-full overflow-hidden rounded-full bg-slate-200/50">
      {segments.map((segment, index) => (
        <div
          key={segment.label}
          className="vv-bar h-full"
          title={`${segment.label} — ${segment.count} (${Math.round(segment.percent)}%)`}
          style={{
            width: `${segment.percent}%`,
            background: segment.color,
            animationDelay: `${120 + index * 90}ms`,
          }}
        />
      ))}
    </div>
  )
}
