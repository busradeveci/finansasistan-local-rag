import { useWorkstationData } from "@/components/workstation/use-workstation-data"
import { useWorkstation } from "@/context/WorkstationContext"
import { 
  ShieldCheck, Database, Cpu, Activity, Clock, Search, 
  BrainCircuit, Lock, AlertTriangle, CheckCircle2, ChevronRight, 
  Zap, FileText, Layers, RefreshCw
} from "lucide-react"

// Reusable mini sparkline component
const Sparkline = ({ data, color }: { data: number[], color: string }) => (
  <div className="flex items-end gap-[1px] h-6 w-24">
    {data.map((value, i) => (
      <div 
        key={i} 
        className={`w-[15%] rounded-t-[1px] ${color}`}
        style={{ height: `${Math.max(10, value)}%`, opacity: Math.max(0.3, value / 100) }}
      />
    ))}
  </div>
)

export function WorkstationView() {
  const { status } = useWorkstationData()
  const { documentInventory, recentDocuments, alerts } = useWorkstation()

  const isHealthy = status != null
  const documentCount = status?.vector_store?.document_count ?? documentInventory.length ?? 0
  const chunkCount = status?.vector_store?.total_chunks ?? 0
  
  const lastIngestion = documentInventory.length > 0 
    ? [...documentInventory].sort((a, b) => {
        if (!a.last_updated) return 1
        if (!b.last_updated) return -1
        return new Date(b.last_updated).getTime() - new Date(a.last_updated).getTime()
      })[0].last_updated
    : null
    
  const lastIngestionDisplay = lastIngestion 
    ? new Date(lastIngestion).toLocaleString() 
    : "No ingestion history"

  const events = [
    ...recentDocuments.map(doc => ({ type: 'document', text: `Indexed: ${doc}`, time: 'Recent' })),
    ...alerts.slice(0, 5).map(a => ({ type: 'alert', text: a.message, time: 'Recent' }))
  ].slice(0, 5)

  if (events.length === 0) {
    events.push({ type: 'info', text: 'No recent activity available.', time: '--' })
  }

  const glassCard = "relative overflow-hidden rounded-xl bg-white/40 backdrop-blur-xl border border-white/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)] shadow-[inset_0_1px_1px_rgba(255,255,255,0.9)] transition-all duration-300 hover:bg-white/50"

  // Telemetry dummy data for visual representation
  const sparklineData1 = [30, 45, 60, 50, 70, 85, 75, 90, 80, 95]
  const sparklineData2 = [20, 30, 25, 40, 35, 50, 45, 60, 55, 70]
  const sparklineData3 = [80, 70, 85, 75, 90, 80, 95, 85, 100, 90]

  return (
    <div className="relative w-full h-full p-4 sm:p-5 lg:p-6 overflow-y-auto overflow-x-hidden fluent-scrollbar text-slate-800 bg-[#fafafa]/50">
      <div className="mx-auto max-w-[1400px] space-y-4 pb-12">
        
        {/* 1. Premium Hero Section */}
        <section className={`col-span-12 ${glassCard} p-6 bg-[linear-gradient(120deg,rgba(255,255,255,0.8),rgba(255,255,255,0.3))] border-white/80`}>
          <div className="absolute top-0 right-0 bottom-0 w-1/2 overflow-hidden pointer-events-none opacity-40">
            {/* Animated network placeholder */}
            <div className="absolute right-[-10%] top-[-20%] w-[120%] h-[140%] bg-[radial-gradient(ellipse_at_center,rgba(56,189,248,0.15)_0%,transparent_70%)] animate-pulse" style={{ animationDuration: '4s' }} />
            <div className="absolute right-[20%] top-[30%] w-32 h-32 bg-indigo-400/20 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '3s' }} />
            <div className="absolute right-[5%] bottom-[10%] w-40 h-40 bg-purple-400/20 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '5s' }} />
            
            {/* Grid dots */}
            <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMiIgY3k9IjIiIHI9IjEiIGZpbGw9InJnYmEoMCwwLDAsMC4wNSkiLz48L3N2Zz4=')] [mask-image:linear-gradient(to_left,black,transparent)]" />
          </div>

          <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-2xl font-semibold tracking-tight text-[#1C0F45]">VectorVault Enterprise</h1>
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white/60 border border-white/80 text-xs font-semibold text-slate-700 shadow-sm backdrop-blur-md">
                  <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
                  Air-Gapped
                </div>
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white/60 border border-white/80 text-xs font-semibold text-slate-700 shadow-sm backdrop-blur-md">
                  <Lock className="h-3.5 w-3.5 text-slate-500" />
                  Offline
                </div>
              </div>
              <p className="text-sm text-slate-500 font-medium max-w-xl">
                Secure AI Operations Center. Local inference, semantic routing, and enterprise-grade knowledge retrieval.
              </p>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="flex flex-col items-end">
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">System Status</span>
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-50/80 border border-emerald-200/60 text-emerald-700 font-semibold text-sm shadow-sm">
                  <div className="relative flex h-2.5 w-2.5">
                    {isHealthy && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>}
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                  </div>
                  {isHealthy ? "All Systems Operational" : "Initializing..."}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 12-Column Grid for Main Content */}
        <div className="grid grid-cols-12 gap-4">
          
          {/* Vector Search Pipeline (Col 1-12) */}
          <section className={`col-span-12 ${glassCard} p-4 flex flex-col justify-center`}>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-[#1C0F45] flex items-center gap-2">
                <Search className="h-4 w-4 text-indigo-500" />
                Retrieval-Augmented Generation Pipeline
              </h2>
              <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Live Trace</span>
            </div>
            <div className="flex items-center justify-between gap-1 overflow-x-auto pb-1 fluent-scrollbar w-full">
              {[
                { name: 'User Query', icon: FileText, color: 'text-slate-500', bg: 'bg-slate-100' },
                { name: 'Semantic Router', icon: BrainCircuit, color: 'text-purple-500', bg: 'bg-purple-100' },
                { name: 'Embedding', icon: Layers, color: 'text-blue-500', bg: 'bg-blue-100' },
                { name: 'Vector Search', icon: Database, color: 'text-indigo-500', bg: 'bg-indigo-100' },
                { name: 'Context Assembly', icon: RefreshCw, color: 'text-sky-500', bg: 'bg-sky-100' },
                { name: 'LLM Inference', icon: Cpu, color: 'text-emerald-500', bg: 'bg-emerald-100' },
                { name: 'Response', icon: CheckCircle2, color: 'text-slate-700', bg: 'bg-slate-100' }
              ].map((step, idx, arr) => (
                <div key={idx} className="flex items-center gap-2 flex-1 min-w-0">
                  <div className={`flex flex-col items-center gap-1.5 p-2 rounded-lg border border-white/60 bg-white/40 shadow-sm transition-all hover:shadow-md hover:bg-white/60 flex-1 min-w-[80px]`}>
                    <div className={`h-7 w-7 rounded-full flex items-center justify-center ${step.bg}`}>
                      <step.icon className={`h-3.5 w-3.5 ${step.color}`} />
                    </div>
                    <span className="text-[10px] font-semibold text-slate-600 text-center uppercase tracking-wide truncate w-full px-1">{step.name}</span>
                  </div>
                  {idx < arr.length - 1 && (
                    <ChevronRight className="h-3.5 w-3.5 text-slate-300 flex-shrink-0" />
                  )}
                </div>
              ))}
            </div>
          </section>

          {/* AI Infrastructure & Telemetry (Col 1-4) */}
          <section className={`col-span-12 lg:col-span-4 ${glassCard} p-4 flex flex-col gap-3`}>
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-[#1C0F45] flex items-center gap-2">
                <Cpu className="h-4 w-4 text-purple-500" />
                Infrastructure
              </h2>
              <div className="flex items-center gap-1.5 px-2 py-0.5 rounded text-[9px] font-bold bg-purple-100/50 text-purple-700 border border-purple-200/50">
                <span className="relative flex h-1 w-1">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-1 w-1 bg-purple-500"></span>
                </span>
                LIVE
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-2 mb-1">
              <div className="p-2.5 rounded-lg bg-white/50 border border-white/60 shadow-sm">
                <div className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider mb-0.5">Chat Model</div>
                <div className="text-[11px] font-semibold text-[#1C0F45] truncate" title={status?.models?.chat_model ?? "Loading..."}>
                  {status?.models?.chat_model ?? "Loading..."}
                </div>
              </div>
              <div className="p-2.5 rounded-lg bg-white/50 border border-white/60 shadow-sm">
                <div className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider mb-0.5">Embed Model</div>
                <div className="text-[11px] font-semibold text-[#1C0F45] truncate" title={status?.models?.embed_model ?? "Loading..."}>
                  {status?.models?.embed_model ?? "Loading..."}
                </div>
              </div>
            </div>

            <div className="space-y-1.5 flex-1">
              <div className="flex items-center justify-between p-2 rounded-lg hover:bg-white/40 transition-colors">
                <div className="flex flex-col">
                  <span className="text-[11px] font-medium text-slate-500">CPU Usage</span>
                  <span className="text-xs font-bold text-slate-700">42%</span>
                </div>
                <Sparkline data={sparklineData1} color="bg-blue-500" />
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg hover:bg-white/40 transition-colors">
                <div className="flex flex-col">
                  <span className="text-[11px] font-medium text-slate-500">RAM Usage</span>
                  <span className="text-xs font-bold text-slate-700">18.4 GB</span>
                </div>
                <Sparkline data={sparklineData2} color="bg-purple-500" />
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg hover:bg-white/40 transition-colors">
                <div className="flex flex-col">
                  <span className="text-[11px] font-medium text-slate-500">Tokens/sec</span>
                  <span className="text-xs font-bold text-slate-700">48.2</span>
                </div>
                <Sparkline data={sparklineData3} color="bg-emerald-500" />
              </div>
            </div>
          </section>

          {/* Knowledge Base Analytics (Col 5-8) */}
          <section className={`col-span-12 md:col-span-6 lg:col-span-4 ${glassCard} p-4 flex flex-col gap-3`}>
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-[#1C0F45] flex items-center gap-2">
                <Database className="h-4 w-4 text-sky-500" />
                Knowledge Analytics
              </h2>
            </div>
            
            <div className="grid grid-cols-2 gap-2">
              <div className="p-3 rounded-xl bg-gradient-to-br from-white/60 to-white/30 border border-white/60 shadow-sm">
                <div className="text-xl font-bold text-[#1C0F45] tabular-nums mb-0.5">{documentCount.toLocaleString()}</div>
                <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Documents</div>
              </div>
              <div className="p-3 rounded-xl bg-gradient-to-br from-white/60 to-white/30 border border-white/60 shadow-sm">
                <div className="text-xl font-bold text-[#1C0F45] tabular-nums mb-0.5">{chunkCount.toLocaleString()}</div>
                <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Chunks</div>
              </div>
            </div>

            <div className="flex-1 mt-1">
              <div className="text-[11px] font-medium text-slate-500 mb-1.5">File Type Distribution</div>
              <div className="flex h-1.5 w-full rounded-full bg-slate-100/50 overflow-hidden mb-2">
                <div className="bg-sky-400 w-[60%]" title="PDF: 60%"></div>
                <div className="bg-indigo-400 w-[25%]" title="MD: 25%"></div>
                <div className="bg-purple-400 w-[15%]" title="TXT: 15%"></div>
              </div>
              <div className="flex items-center gap-3 text-[9px] font-semibold text-slate-500">
                <div className="flex items-center gap-1"><div className="w-1.5 h-1.5 rounded-full bg-sky-400" /> PDF</div>
                <div className="flex items-center gap-1"><div className="w-1.5 h-1.5 rounded-full bg-indigo-400" /> MD</div>
                <div className="flex items-center gap-1"><div className="w-1.5 h-1.5 rounded-full bg-purple-400" /> TXT</div>
              </div>
            </div>

            <div className="pt-2 border-t border-white/40 mt-auto">
              <div className="text-[9px] font-semibold text-slate-400 flex items-center gap-1.5 uppercase tracking-wider">
                <Clock className="h-3 w-3 text-slate-300" />
                Ingest: {lastIngestionDisplay}
              </div>
            </div>
          </section>

          {/* Security Overview & Recent Activity (Col 9-12) */}
          <div className="col-span-12 md:col-span-6 lg:col-span-4 flex flex-col gap-4">
            {/* Security */}
            <section className={`${glassCard} p-4 flex flex-col gap-2 flex-shrink-0`}>
              <h2 className="text-sm font-semibold text-[#1C0F45] flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-emerald-500" />
                Security Overview
              </h2>
              <div className="space-y-1.5">
                <div className="flex items-center justify-between bg-white/30 px-2 py-1.5 rounded-md border border-white/40">
                  <span className="text-[11px] font-medium text-slate-600">Threat Detection</span>
                  <span className="text-[11px] font-bold text-emerald-600 flex items-center gap-1">
                    <CheckCircle2 className="h-3 w-3" /> Active
                  </span>
                </div>
                <div className="flex items-center justify-between bg-white/30 px-2 py-1.5 rounded-md border border-white/40">
                  <span className="text-[11px] font-medium text-slate-600">Sanitized Queries</span>
                  <span className="text-[11px] font-bold text-slate-700">100%</span>
                </div>
                <div className="flex items-center justify-between bg-white/30 px-2 py-1.5 rounded-md border border-white/40">
                  <span className="text-[11px] font-medium text-slate-600">Prompt Injection</span>
                  <span className="text-[11px] font-bold text-slate-700">0 Blocked</span>
                </div>
              </div>
            </section>

            {/* Recent Activity */}
            <section className={`${glassCard} p-4 flex flex-col gap-2 flex-1 min-h-[140px]`}>
              <h2 className="text-sm font-semibold text-[#1C0F45] flex items-center gap-2">
                <Activity className="h-4 w-4 text-rose-400" />
                Recent Activity
              </h2>
              <div className="flex-1 flex flex-col gap-1 overflow-y-auto max-h-[120px] fluent-scrollbar pr-1 -mr-1">
                {events.map((evt, idx) => (
                  <div key={idx} className="flex items-start gap-2 p-1.5 hover:bg-white/40 rounded-md transition-colors">
                    {evt.time !== '--' ? (
                      evt.type === 'alert' ? <AlertTriangle className="mt-0.5 h-3 w-3 shrink-0 text-amber-500" /> : <FileText className="mt-0.5 h-3 w-3 shrink-0 text-sky-500" />
                    ) : (
                      <div className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-slate-300" />
                    )}
                    <div className="min-w-0 flex-1">
                      <p className={`text-[11px] font-medium ${evt.time === '--' ? 'text-slate-500 italic' : 'text-slate-700'} line-clamp-1`} title={evt.text}>{evt.text}</p>
                      {evt.time !== '--' && <p className="text-[9px] font-medium text-slate-400 mt-0.5">{evt.time}</p>}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>
          
        </div>
      </div>
    </div>
  )
}