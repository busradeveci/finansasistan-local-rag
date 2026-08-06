import { useWorkstationData } from "@/components/workstation/use-workstation-data"
import { useWorkstation } from "@/context/WorkstationContext"
import { ShieldCheck, Database, Cpu, Activity, Clock } from "lucide-react"

export function WorkstationView() {
  const { status } = useWorkstationData()
  const { documentInventory, recentDocuments, alerts } = useWorkstation()

  const isHealthy = status != null
  const documentCount = status?.vector_store?.document_count ?? documentInventory.length ?? 0
  const chunkCount = status?.vector_store?.total_chunks ?? 0
  
  // Find last ingestion time from inventory
  const lastIngestion = documentInventory.length > 0 
    ? [...documentInventory].sort((a, b) => {
        if (!a.last_updated) return 1
        if (!b.last_updated) return -1
        return new Date(b.last_updated).getTime() - new Date(a.last_updated).getTime()
      })[0].last_updated
    : null
    
  const lastIngestionDisplay = lastIngestion 
    ? new Date(lastIngestion).toLocaleString() 
    : "No ingestion history available."

  // Synthesize recent events
  const events = [
    ...recentDocuments.map(doc => ({ type: 'document', text: `Document indexed: ${doc}`, time: 'Recent' })),
    ...alerts.slice(0, 5).map(a => ({ type: 'alert', text: a.message, time: 'Recent' }))
  ].slice(0, 5)

  if (events.length === 0) {
    events.push({ type: 'info', text: 'No recent activity available.', time: '--' })
  }

  return (
    <div className="relative w-full h-full p-6 sm:p-8 lg:p-10 overflow-y-auto overflow-x-hidden fluent-scrollbar">
      <div className="mx-auto max-w-6xl space-y-10 pb-16">
        
        {/* Header */}
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-[#1C0F45]">Enterprise Local RAG</h1>
          <p className="mt-1 text-base text-slate-500">Executive Platform Overview</p>
        </div>

        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {/* 1. Overall Platform Health */}
          <section className="col-span-1 md:col-span-2 lg:col-span-3 ws-glass-card p-6 border border-white/60 relative overflow-hidden bg-[linear-gradient(120deg,rgba(255,255,255,0.7),rgba(255,255,255,0.4))]">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(135,206,250,0.1)_0%,transparent_50%)]" />
            <div className="relative flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-[#1C0F45] flex items-center gap-2">
                  <Activity className="h-5 w-5 text-sky-500" />
                  Overall Platform Health
                </h2>
                <div className="mt-4 flex items-center gap-4">
                  {isHealthy ? (
                    <>
                      <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-100/50 border border-emerald-200/50 text-emerald-700 font-semibold text-sm">
                        <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                        Operational
                      </div>
                      <span className="text-sm font-medium text-slate-500 flex items-center gap-1.5">
                        <ShieldCheck className="h-4 w-4 text-slate-400" /> Air-Gapped
                      </span>
                    </>
                  ) : (
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-100/50 border border-slate-200/50 text-slate-600 font-semibold text-sm">
                      <div className="h-2 w-2 rounded-full bg-slate-400" />
                      Checking Status...
                    </div>
                  )}
                </div>
              </div>
            </div>
          </section>

          {/* 2. Knowledge Base Summary */}
          <section className="ws-glass-card p-6 flex flex-col gap-4 relative bg-white/50 hover:bg-white/60 transition-colors">
            <h2 className="text-base font-semibold text-[#1C0F45] flex items-center gap-2">
              <Database className="h-4 w-4 text-indigo-500" />
              Knowledge Base
            </h2>
            <div className="space-y-4 flex-1">
              <div>
                <div className="text-2xl font-bold text-[#1C0F45] tabular-nums">{documentCount.toLocaleString()}</div>
                <div className="text-sm font-medium text-slate-500">Indexed Documents</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-[#1C0F45] tabular-nums">{chunkCount.toLocaleString()}</div>
                <div className="text-sm font-medium text-slate-500">Indexed Chunks</div>
              </div>
            </div>
            <div className="pt-4 border-t border-white/40">
              <div className="text-xs font-medium text-slate-500 flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5 text-slate-400" />
                {lastIngestion ? `Last Ingestion: ${lastIngestionDisplay}` : "No ingestion history available."}
              </div>
            </div>
          </section>

          {/* 3. Active AI Configuration */}
          <section className="ws-glass-card p-6 flex flex-col gap-4 relative bg-white/50 hover:bg-white/60 transition-colors">
            <h2 className="text-base font-semibold text-[#1C0F45] flex items-center gap-2">
              <Cpu className="h-4 w-4 text-purple-500" />
              Active AI Configuration
            </h2>
            <div className="space-y-4 flex-1">
              <div className="min-w-0">
                <div className="text-sm font-semibold text-[#1C0F45] truncate" title={status?.models?.chat_model ?? "Loading..."}>
                  {status?.models?.chat_model ?? "Loading..."}
                </div>
                <div className="text-sm font-medium text-slate-500">Active Chat Model</div>
              </div>
              <div className="min-w-0">
                <div className="text-sm font-semibold text-[#1C0F45] truncate" title={status?.models?.embed_model ?? "Loading..."}>
                  {status?.models?.embed_model ?? "Loading..."}
                </div>
                <div className="text-sm font-medium text-slate-500">Active Embedding Model</div>
              </div>
            </div>
            <div className="pt-4 border-t border-white/40">
              <div className="text-xs font-medium text-slate-500">
                Runtime Provider: <span className="font-semibold text-[#1C0F45]">Local</span>
              </div>
            </div>
          </section>

          {/* 4. Recent Activity */}
          <section className="ws-glass-card p-6 flex flex-col gap-4 relative bg-white/50 hover:bg-white/60 transition-colors">
            <h2 className="text-base font-semibold text-[#1C0F45] flex items-center gap-2">
              <Activity className="h-4 w-4 text-sky-500" />
              Recent Activity
            </h2>
            <div className="flex-1 flex flex-col gap-3">
              {events.map((evt, idx) => (
                <div key={idx} className="flex items-start gap-3">
                  {evt.time !== '--' && <div className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-sky-400" />}
                  <div className="min-w-0 flex-1">
                    <p className={`text-sm font-medium ${evt.time === '--' ? 'text-slate-500 italic' : 'text-[#1C0F45]'} truncate`} title={evt.text}>{evt.text}</p>
                    {evt.time !== '--' && <p className="text-xs font-medium text-slate-400">{evt.time}</p>}
                  </div>
                </div>
              ))}
            </div>
          </section>


        </div>
      </div>
    </div>
  )
}