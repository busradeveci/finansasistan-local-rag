import MotionCard from "@/components/ui/MotionCard"

import {

  Bar,

  BarChart,

  CartesianGrid,

  Cell,

  Legend,

  Line,

  LineChart,

  ResponsiveContainer,

  Tooltip,

  XAxis,

  YAxis,

} from "recharts"



const MINT = "#0078d4"

const CYAN = "#2b88d8"

const AMBER = "#ca5010"

const CHART_GRID = "#e5e7eb"

const CHART_AXIS = "#64748b"

const CANVAS = "#ffffff"



const RISK_RED = "#d13438"

const RISK_AMBER = AMBER

const RISK_GREEN = "#107c10"



const riskProfileData = [

  { category: "Liquidity Risk", score: 72, color: RISK_RED },

  { category: "Credit Risk", score: 48, color: RISK_AMBER },

  { category: "Market Volatility", score: 61, color: RISK_AMBER },

  { category: "Compliance", score: 28, color: RISK_GREEN },

]



const leverageTrendData = [

  { period: "Q1 Audit", leverage: 3.8, capitalAdequacy: 14.2 },

  { period: "Q2 Audit", leverage: 3.6, capitalAdequacy: 14.8 },

  { period: "Mid-Year", leverage: 3.4, capitalAdequacy: 15.1 },

  { period: "Q3 Audit", leverage: 3.2, capitalAdequacy: 15.6 },

  { period: "Q4 Audit", leverage: 3.1, capitalAdequacy: 16.0 },

  { period: "Latest", leverage: 2.9, capitalAdequacy: 16.4 },

]



const aiRecommendations = [

  {

    level: "CRITICAL" as const,

    text: "Liquidity buffer dropped below 15% on audited spreadsheet. Recommend reallocating short-term assets.",

  },

  {

    level: "NOTICE" as const,

    text: "Basel III leverage ratio within healthy corporate limits (Tier 1: 6.2%).",

  },

  {

    level: "OPTIMIZE" as const,

    text: "Cash flow pattern from uploaded Excel records suggests dependency on Q4 receivables.",

  },

]



const levelStyles = {

  CRITICAL: { color: RISK_RED, bg: "#fef2f2" },

  NOTICE: { color: CYAN, bg: "#eff6ff" },

  OPTIMIZE: { color: RISK_GREEN, bg: "#f0fdf4" },

}



export default function FinancialIntelligenceModule() {

  return (

    <div className="flex h-full min-h-0 flex-col overflow-hidden bg-white ws-module-shell metric-display">

      <header className="shrink-0 border-b border-gray-200 pb-4">

        <h1 className="text-page-title">Financial Intelligence Center</h1>

        <p className="mt-1 truncate text-sm font-medium text-[var(--ws-text-muted)]">

          Executive financial analysis, risk posture, and automated banking insights

        </p>

      </header>



      <div className="flex min-h-0 flex-1 flex-col ws-module-stack overflow-y-auto fluent-scrollbar">

        <section className="shrink-0">

          <SectionLabel>Financial Risk &amp; Posture</SectionLabel>

          <div className="grid grid-cols-12 ws-module-grid">

            <GlassPanel title="Risk Profile Distribution" className="col-span-12 min-h-[260px] lg:col-span-6">

              <ResponsiveContainer width="100%" height={198}>

                <BarChart data={riskProfileData} margin={{ top: 8, right: 12, left: -12, bottom: 4 }}>

                  <CartesianGrid stroke={CHART_GRID} vertical={false} />

                  <XAxis

                    dataKey="category"

                    tick={{ fill: CHART_AXIS, fontSize: 10 }}

                    axisLine={{ stroke: CHART_GRID }}

                    tickLine={false}

                    interval={0}

                    angle={-12}

                    textAnchor="end"

                    height={52}

                  />

                  <YAxis

                    domain={[0, 100]}

                    tick={{ fill: CHART_AXIS, fontSize: 10 }}

                    axisLine={false}

                    tickLine={false}

                    width={32}

                    ticks={[0, 25, 50, 75, 100]}

                  />

                  <Tooltip content={<GlassTooltip suffix=" pts" />} cursor={{ fill: "rgba(0, 120, 212, 0.06)" }} />

                  <Bar dataKey="score" radius={[2, 2, 0, 0]} maxBarSize={48}>

                    {riskProfileData.map((entry) => (

                      <Cell key={entry.category} fill={entry.color} />

                    ))}

                  </Bar>

                </BarChart>

              </ResponsiveContainer>

              <RiskLegend />

            </GlassPanel>



            <GlassPanel title="Asset Leverage & Capital Adequacy Trends" className="col-span-12 min-h-[260px] lg:col-span-6">

              <ResponsiveContainer width="100%" height={198}>

                <LineChart data={leverageTrendData} margin={{ top: 8, right: 12, left: -8, bottom: 4 }}>

                  <CartesianGrid stroke={CHART_GRID} vertical={false} />

                  <XAxis

                    dataKey="period"

                    tick={{ fill: CHART_AXIS, fontSize: 10 }}

                    axisLine={{ stroke: CHART_GRID }}

                    tickLine={false}

                  />

                  <YAxis

                    yAxisId="left"

                    tick={{ fill: CHART_AXIS, fontSize: 10 }}

                    axisLine={false}

                    tickLine={false}

                    width={36}

                    domain={[2, 4.5]}

                  />

                  <YAxis

                    yAxisId="right"

                    orientation="right"

                    tick={{ fill: CHART_AXIS, fontSize: 10 }}

                    axisLine={false}

                    tickLine={false}

                    width={36}

                    domain={[13, 17]}

                  />

                  <Tooltip content={<GlassTooltip />} />

                  <Legend

                    verticalAlign="top"

                    height={28}

                    iconType="line"

                    formatter={(value) => (

                      <span style={{ color: CHART_AXIS, fontSize: 10 }}>{value}</span>

                    )}

                  />

                  <Line

                    yAxisId="left"

                    type="monotone"

                    dataKey="leverage"

                    name="Leverage Ratio"

                    stroke={RISK_AMBER}

                    strokeWidth={1}

                    dot={{ r: 2, fill: RISK_AMBER, stroke: CANVAS, strokeWidth: 1 }}

                    activeDot={{ r: 4 }}

                  />

                  <Line

                    yAxisId="right"

                    type="monotone"

                    dataKey="capitalAdequacy"

                    name="Capital Adequacy %"

                    stroke={RISK_GREEN}

                    strokeWidth={1}

                    dot={{ r: 2, fill: RISK_GREEN, stroke: CANVAS, strokeWidth: 1 }}

                    activeDot={{ r: 4 }}

                  />

                </LineChart>

              </ResponsiveContainer>

            </GlassPanel>

          </div>

        </section>



        <section className="min-h-0 flex-1 pb-1">

          <SectionLabel>Executive AI Recommendations</SectionLabel>

          <div className="border-b border-gray-200 pb-4">

            <div className="mb-3 flex items-center justify-between">

              <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--ws-text-muted)]">

                Automated AI Recommendations &amp; Insights

              </p>

              <span className="text-[10px] font-medium text-[var(--ws-text-muted)]">

                Live · Mock Data

              </span>

            </div>

            <div className="space-y-3 text-xs leading-relaxed">

              {aiRecommendations.map((item) => {

                const style = levelStyles[item.level]

                return (

                  <div
                    key={item.level}
                    className="border-l-2 py-1 pl-3"
                    style={{ borderColor: style.color, background: style.bg }}
                  >

                    <span className="font-semibold" style={{ color: style.color }}>

                      • [{item.level}]

                    </span>{" "}

                    <span className="text-[var(--ws-text-secondary)]">{item.text}</span>

                  </div>

                )

              })}

              <p className="mt-3 border-t border-gray-200 pt-3 text-[10px] text-[var(--ws-text-muted)]">

                Analysis derived from indexed financial documents and corporate banking heuristics.

                Connect live audit feeds to enable real-time recommendation streaming.

              </p>

            </div>

          </div>

        </section>

      </div>

    </div>

  )

}



function SectionLabel({ children }: { children: React.ReactNode }) {

  return <h2 className="mb-2 text-section-title">{children}</h2>

}



function GlassPanel({

  title,

  children,

  className = "",

}: {

  title: string

  children: React.ReactNode

  className?: string

}) {

  return (

    <MotionCard className={`flex flex-col overflow-hidden p-4 ${className}`}>

      <p className="mb-1 shrink-0 truncate text-[11px] font-semibold uppercase tracking-wide text-[var(--ws-text-muted)]">

        {title}

      </p>

      <div className="min-h-0 flex-1">{children}</div>

    </MotionCard>

  )

}



function RiskLegend() {

  const items = [

    { label: "Elevated", color: RISK_RED },

    { label: "Moderate", color: RISK_AMBER },

    { label: "Low", color: RISK_GREEN },

  ]

  return (

    <div className="mt-1 flex justify-center gap-4">

      {items.map((item) => (

        <div key={item.label} className="flex items-center gap-1">

          <span className="h-2 w-2 rounded-sm" style={{ background: item.color }} />

          <span className="text-[10px] text-[var(--ws-text-muted)]">{item.label}</span>

        </div>

      ))}

    </div>

  )

}



function GlassTooltip({

  active,

  payload,

  label,

  suffix = "",

}: {

  active?: boolean

  payload?: { name?: string; value?: number; color?: string }[]

  label?: string

  suffix?: string

}) {

  if (!active || !payload?.length) return null

  return (

    <div className="ws-chart-tooltip">

      {label && <p className="ws-chart-tooltip-label">{label}</p>}

      {payload.map((p, i) => (

        <p key={i} className="ws-chart-tooltip-value">

          {p.name ? `${p.name}: ` : ""}

          {typeof p.value === "number" ? p.value.toLocaleString() : p.value}

          {suffix}

        </p>

      ))}

    </div>

  )

}


