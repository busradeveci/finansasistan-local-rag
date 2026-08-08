import { Search, Route, Server, Shield, FileText, ArrowRight, Brain, CircleDot, Activity, Cpu } from "lucide-react"
import { useWorkstationData } from "@/components/workstation/use-workstation-data"

const GLASS_CARD =
  "bg-white/90 backdrop-blur-md border border-slate-200/60 shadow-sm rounded-3xl"

const HYPER_GLASS =
  "bg-white/60 backdrop-blur-md border border-slate-200/50 shadow-sm rounded-2xl hover:bg-white/90 transition-all duration-300"

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
    ? (loading ? LOADING : NOT_AVAILABLE)
    : routerLoaded
      ? "Active"
      : "Warming up"

  const totalRouted =
    analytics?.total_routed != null ? analytics.total_routed.toLocaleString() : (loading ? LOADING : "0")

  const decisions = analytics?.recent_routing_decisions ?? []

  const models = [
    { role: "Router Engine", name: routerModel, purpose: "Intent Classification", loaded: runtime?.models?.router?.loaded },
    { role: "Chat Engine", name: chatModel, purpose: "General Conversation & RAG", loaded: runtime?.models?.chat?.loaded },
    { role: "Embedding Engine", name: embedModel, purpose: "Vector Generation", loaded: runtime?.models?.embed?.loaded },
  ]

  return (
    <div className="flex flex-col gap-6 pb-12">
      {/* 6. Search */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          placeholder="Search routing events, models, or policies..."
          className="w-full rounded-2xl border border-slate-200/60 bg-white/90 py-3.5 pl-12 pr-4 text-[13px] font-medium text-slate-800 shadow-sm backdrop-blur-md transition-all placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#000080]/20"
        />
      </div>

      {/* 1. Routing Overview */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <div className={`p-5 ${GLASS_CARD}`}>
          <div className="mb-2 flex items-center gap-2 text-slate-500">
            <Activity className="h-4 w-4" />
            <h3 className="text-xs font-semibold uppercase tracking-wider">Router Status</h3>
          </div>
          <div className="flex items-center gap-2">
            {routerOnline && (
              <span className="relative flex h-3 w-3">
                <span className={`absolute inline-flex h-full w-full rounded-full opacity-75 ${routerLoaded ? "animate-ping bg-emerald-400" : "bg-amber-400"}`}></span>
                <span className={`relative inline-flex h-3 w-3 rounded-full ${routerLoaded ? "bg-emerald-500" : "bg-amber-500"}`}></span>
              </span>
            )}
            <span className="font-mono text-lg font-medium text-slate-800">{routerStatusLabel}</span>
          </div>
        </div>
        <div className={`p-5 ${GLASS_CARD}`}>
          <div className="mb-2 flex items-center gap-2 text-slate-500">
            <Cpu className="h-4 w-4" />
            <h3 className="text-xs font-semibold uppercase tracking-wider">Active Router</h3>
          </div>
          <div className="truncate font-mono text-lg font-medium text-slate-800">{routerModel}</div>
        </div>
        <div className={`p-5 ${GLASS_CARD}`}>
          <div className="mb-2 flex items-center gap-2 text-slate-500">
            <Shield className="h-4 w-4" />
            <h3 className="text-xs font-semibold uppercase tracking-wider">Routing Policy</h3>
          </div>
          <div className="text-sm font-medium text-slate-700">Semantic Intent Classification</div>
        </div>
        <div className={`p-5 ${GLASS_CARD}`}>
          <div className="mb-2 flex items-center gap-2 text-slate-500">
            <Route className="h-4 w-4" />
            <h3 className="text-xs font-semibold uppercase tracking-wider">Total Routed</h3>
          </div>
          <div className="font-mono text-lg font-medium text-slate-800">{totalRouted}</div>
        </div>
      </div>

      {/* 2. Routing Decision Flow */}
      <section className={`p-6 ${GLASS_CARD}`}>
        <h3 className="mb-6 text-sm font-semibold text-slate-800">Routing Decision Flow</h3>
        <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
          
          <div className="flex flex-col items-center gap-2">
            <div className={`flex h-12 w-12 items-center justify-center text-slate-700 ${HYPER_GLASS}`}>
              <FileText className="h-5 w-5" />
            </div>
            <span className="text-[11px] font-medium text-slate-600">User Query</span>
          </div>

          <ArrowRight className="text-slate-300 hidden md:block" />

          <div className="flex flex-col items-center gap-2">
            <div className={`flex h-12 w-12 items-center justify-center text-[#000080] ${HYPER_GLASS}`}>
              <CircleDot className="h-5 w-5" />
            </div>
            <span className="text-[11px] font-medium text-slate-600">Intent Classification</span>
          </div>

          <ArrowRight className="text-slate-300 hidden md:block" />

          <div className="flex flex-col items-center gap-2">
            <div className={`flex h-14 w-14 items-center justify-center text-cyan-600 bg-white shadow-sm rounded-2xl border border-slate-200/60`}>
              <Route className="h-6 w-6" />
            </div>
            <span className="text-[11px] font-bold text-slate-800">Semantic Router</span>
            <span className={`text-[9px] uppercase tracking-wider ${routerOnline ? "text-emerald-600" : "text-slate-400"}`}>
              {routerOnline ? routerStatusLabel : NOT_AVAILABLE}
            </span>
          </div>

          <ArrowRight className="text-slate-300 hidden md:block" />

          <div className="flex flex-col items-center gap-2">
            <div className={`flex h-12 w-12 items-center justify-center text-emerald-600 ${HYPER_GLASS}`}>
              <Brain className="h-5 w-5" />
            </div>
            <span className="text-[11px] font-medium text-slate-600">Model Selection</span>
          </div>

          <ArrowRight className="text-slate-300 hidden md:block" />

          <div className="flex flex-col items-center gap-2">
            <div className={`flex h-12 w-12 items-center justify-center text-slate-700 ${HYPER_GLASS}`}>
              <Server className="h-5 w-5" />
            </div>
            <span className="text-[11px] font-medium text-slate-600">Response Gen</span>
          </div>

        </div>
      </section>

      {/* 3. Registered Model Registry */}
      <section>
        <h3 className="mb-4 text-sm font-semibold text-slate-800">Registered Model Registry</h3>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {models.map((m) => (
            <div key={m.role} className={`flex flex-col p-5 ${GLASS_CARD}`}>
              <div className="mb-4 flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">{m.role}</span>
                {m.loaded === true ? (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 border border-emerald-200/60">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500"></span> Loaded
                  </span>
                ) : m.loaded === false ? (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-50 px-2 py-0.5 text-[10px] font-semibold text-slate-500 border border-slate-200/60">
                    <span className="h-1.5 w-1.5 rounded-full bg-slate-400"></span> Idle
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-50 px-2 py-0.5 text-[10px] font-semibold text-slate-400 border border-slate-200/60">
                    {NOT_AVAILABLE}
                  </span>
                )}
              </div>
              <div className="mb-4 truncate font-mono text-lg font-medium text-slate-800">{m.name}</div>
              
              <div className="flex flex-col gap-2 border-t border-slate-200/60 pt-4 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500">Purpose</span>
                  <span className="font-medium text-slate-700">{m.purpose}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Context Window</span>
                  <span className="text-slate-400">{NOT_REPORTED}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Quantization</span>
                  <span className="text-slate-400">{NOT_REPORTED}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Endpoint</span>
                  <span className="max-w-[150px] truncate font-mono text-slate-500" title={endpoint ?? NOT_AVAILABLE}>
                    {endpoint ?? NOT_AVAILABLE}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 4. Routing Policies */}
      <section>
        <h3 className="mb-4 text-sm font-semibold text-slate-800">Routing Policies</h3>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {[
            { rule: "Numerical Query", target: "Local Agent (phi-4-mini)", reason: "Numerical computation detected" },
            { rule: "Document Question", target: "Local RAG", reason: "Document retrieval required" },
            { rule: "General Conversation", target: "Chat Model", reason: "No retrieval required" },
          ].map((policy) => (
            <div key={policy.rule} className={`p-5 ${GLASS_CARD}`}>
              <div className="mb-2 text-sm font-semibold text-slate-800">{policy.rule}</div>
              <div className="mb-3 flex items-center gap-2">
                <ArrowRight className="h-4 w-4 text-slate-400" />
                <span className="font-mono text-xs font-medium text-[#000080]">{policy.target}</span>
              </div>
              <div className="text-[11px] text-slate-500">
                <span className="font-medium text-slate-600">Reason:</span> {policy.reason}
              </div>
              <div className="mt-3 border-t border-slate-200/60 pt-3 text-[10px] text-slate-400">
                Source: Semantic Router · {routerModel}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 5. Recent Routing Decisions */}
      <section>
        <h3 className="mb-4 text-sm font-semibold text-slate-800">Recent Routing Decisions</h3>
        <div className={`overflow-hidden ${GLASS_CARD} !p-0`}>
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-200/60 bg-slate-50 text-xs text-slate-500">
              <tr>
                <th className="px-4 py-3 font-medium">Timestamp</th>
                <th className="px-4 py-3 font-medium">Intent</th>
                <th className="px-4 py-3 font-medium">Selected Model</th>
                <th className="px-4 py-3 font-medium">Decision Reason</th>
                <th className="px-4 py-3 font-medium">Execution Status</th>
              </tr>
            </thead>
            <tbody>
              {decisions.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-12 text-center text-sm text-slate-500">
                    {loading ? LOADING : "No routing decisions yet"}
                  </td>
                </tr>
              ) : (
                decisions.map((d, i) => (
                  <tr key={`${d.timestamp}-${i}`} className="border-b border-slate-100 last:border-transparent">
                    <td className="px-4 py-3 font-mono text-xs text-slate-500">{formatDecisionTime(d.timestamp)}</td>
                    <td className="px-4 py-3">
                      <span className="rounded-md border border-slate-200/60 bg-slate-50 px-2 py-0.5 font-mono text-[11px] font-medium text-slate-600">
                        {d.intent}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-slate-700">{d.selected_model}</td>
                    <td className="px-4 py-3 text-xs text-slate-500">{d.reason}</td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-emerald-600">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
                        {d.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}
