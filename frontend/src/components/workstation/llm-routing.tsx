import { Search, Route, Server, Shield, FileText, ArrowRight, Brain, CircleDot, Activity, Cpu } from "lucide-react"
import { useWorkstationData } from "@/components/workstation/use-workstation-data"

const GLASS_CARD =
  "bg-white/40 backdrop-blur-2xl backdrop-saturate-[1.12] border border-white/70 shadow-[0_14px_38px_rgba(20,40,70,0.06),inset_0_1px_0_rgba(255,255,255,0.86),inset_0_-1px_0_rgba(255,255,255,0.28)] rounded-3xl"

const HYPER_GLASS =
  "bg-white/50 backdrop-blur-md border border-white/75 shadow-[0_4px_14px_rgba(0,0,0,0.05),inset_0_1px_1px_rgba(255,255,255,0.92)] rounded-2xl"

export function LlmRouting() {
  const { status, analytics } = useWorkstationData()

  const routerModel = status?.models?.router_model ?? "Awaiting Backend Integration"
  const chatModel = status?.models?.chat_model ?? "Awaiting Backend Integration"
  const embedModel = status?.models?.embed_model ?? "Awaiting Backend Integration"
  
  const totalRequests = analytics?.queries_processed_today 
    ? analytics.queries_processed_today.toLocaleString()
    : "Awaiting Backend Integration"

  return (
    <div className="flex flex-col gap-6 pb-12">
      {/* 6. Search */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          placeholder="Search routing events, models, or policies..."
          className="w-full rounded-2xl border border-white/40 bg-white/40 py-3.5 pl-12 pr-4 text-[13px] font-medium text-slate-800 shadow-[0_8px_30px_rgb(0,0,0,0.04),inset_0_1px_0_rgba(255,255,255,0.8)] backdrop-blur-xl transition-all placeholder:text-slate-400 focus:bg-white/60 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
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
            <span className="relative flex h-3 w-3">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex h-3 w-3 rounded-full bg-emerald-500"></span>
            </span>
            <span className="font-mono text-lg font-medium text-slate-800">Active</span>
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
          <div className="text-sm font-medium text-slate-500">Awaiting Backend Integration</div>
        </div>
        <div className={`p-5 ${GLASS_CARD}`}>
          <div className="mb-2 flex items-center gap-2 text-slate-500">
            <Route className="h-4 w-4" />
            <h3 className="text-xs font-semibold uppercase tracking-wider">Total Routed</h3>
          </div>
          <div className="font-mono text-lg font-medium text-slate-800">{totalRequests}</div>
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
            <div className={`flex h-12 w-12 items-center justify-center text-blue-600 ${HYPER_GLASS}`}>
              <CircleDot className="h-5 w-5" />
            </div>
            <span className="text-[11px] font-medium text-slate-600">Intent Classification</span>
          </div>

          <ArrowRight className="text-slate-300 hidden md:block" />

          <div className="flex flex-col items-center gap-2">
            <div className={`flex h-14 w-14 items-center justify-center text-indigo-600 bg-white shadow-[0_8px_30px_rgb(0,0,0,0.1),inset_0_1px_0_rgba(255,255,255,1)] rounded-2xl border border-white`}>
              <Route className="h-6 w-6" />
            </div>
            <span className="text-[11px] font-bold text-slate-800">Semantic Router</span>
            <span className="text-[9px] uppercase tracking-wider text-emerald-600">Active</span>
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
          {[
            { role: "Router Engine", name: routerModel, purpose: "Intent Classification" },
            { role: "Chat Engine", name: chatModel, purpose: "General Conversation & RAG" },
            { role: "Embedding Engine", name: embedModel, purpose: "Vector Generation" },
          ].map((m) => (
            <div key={m.role} className={`flex flex-col p-5 ${GLASS_CARD}`}>
              <div className="mb-4 flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">{m.role}</span>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500"></span> Active
                </span>
              </div>
              <div className="mb-4 truncate font-mono text-lg font-medium text-slate-800">{m.name}</div>
              
              <div className="flex flex-col gap-2 border-t border-white/40 pt-4 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500">Purpose</span>
                  <span className="font-medium text-slate-700">{m.purpose}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Context Window</span>
                  <span className="text-slate-400">Awaiting Backend Integration</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Quantization</span>
                  <span className="text-slate-400">Awaiting Backend Integration</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Endpoint</span>
                  <span className="text-slate-400">Awaiting Backend Integration</span>
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
            { rule: "Semantic Search", target: "Local RAG", reason: "Document retrieval required" },
            { rule: "General Conversation", target: "Chat Model", reason: "No retrieval required" },
            { rule: "Embedding Request", target: "Embedding Model", reason: "Vector generation" }
          ].map((policy) => (
            <div key={policy.rule} className={`p-5 ${GLASS_CARD}`}>
              <div className="mb-2 text-sm font-semibold text-slate-800">{policy.rule}</div>
              <div className="mb-3 flex items-center gap-2">
                <ArrowRight className="h-4 w-4 text-slate-400" />
                <span className="font-mono text-xs font-medium text-blue-600">{policy.target}</span>
              </div>
              <div className="text-[11px] text-slate-500">
                <span className="font-medium text-slate-600">Reason:</span> {policy.reason}
              </div>
              <div className="mt-3 border-t border-white/40 pt-3 text-[10px] text-slate-400">
                Source: Awaiting Backend Integration
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 5. Recent Routing Decisions */}
      <section>
        <h3 className="mb-4 text-sm font-semibold text-slate-800">Recent Routing Decisions</h3>
        <div className={`overflow-hidden ${GLASS_CARD}`}>
          <table className="w-full text-left text-sm">
            <thead className="border-b border-white/40 bg-white/20 text-xs text-slate-500">
              <tr>
                <th className="px-4 py-3 font-medium">Timestamp</th>
                <th className="px-4 py-3 font-medium">Intent</th>
                <th className="px-4 py-3 font-medium">Selected Model</th>
                <th className="px-4 py-3 font-medium">Decision Reason</th>
                <th className="px-4 py-3 font-medium">Execution Status</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td colSpan={5} className="px-4 py-12 text-center text-sm text-slate-500">
                  Awaiting Backend Integration
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}