import { useState } from "react"
import { 
  Lock, Activity, Cpu, Clock, Server, LineChart
} from "lucide-react"
import type { SecurityPacket, TelemetryPacket } from "@/types/workstation"

type SystemTelemetryProps = {
  telemetry: TelemetryPacket | null
  security: SecurityPacket | null
}

export function SystemTelemetryModule({ telemetry, security }: SystemTelemetryProps) {
  const [activeTab, setActiveTab] = useState("All Logs")

  // Mock data as requested by strict design directives
  const logs = [
    { time: "14:32:41.102", level: "PERF", component: "SQLiteVectorStore", message: "Cosine similarity lookup over 35 chunks", latency: "1.8 ms", status: "OK" },
    { time: "14:32:41.058", level: "LLM", component: "Phi4MiniRuntime", message: "Generated 142 tokens for session SESS-892", latency: "418 ms TTFT", status: "STREAMING" },
    { time: "14:32:40.912", level: "SEC", component: "PIIRedactionSanitizer", message: "Filtered query string for passport/IBAN patterns", latency: "0.4 ms", status: "BLOCKED" },
    { time: "14:32:40.501", level: "VECTOR", component: "ChunkingPipeline", message: "Verified SQLite blob integrity (F32 vectors)", latency: "0.9 ms", status: "OK" },
    { time: "14:32:40.110", level: "HEALTH", component: "PrometheusExporter", message: "Telemetry metrics scraped by local collector", latency: "0.2 ms", status: "OK" },
  ]

  const tabs = ["All Logs", "Inference Streams", "Vector Indexing", "Sanitization & PII", "System Audits"]

  return (
    <section 
      aria-label="AI Infrastructure Observability Console"
      className="flex flex-col gap-6 w-full h-full font-sans text-slate-800 overflow-y-auto pr-2 ws-module-shell"
    >
      {/* 1. Executive Infrastructure Status & Health Bar */}
      <div className="bg-white/80 backdrop-blur-md border border-white/80 shadow-sm rounded-2xl p-5 flex flex-col gap-4 shrink-0">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200/50 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-[#000080]/5 border border-[#000080]/10">
              <Activity className="w-5 h-5 text-[#000080]" />
            </div>
            <div>
              <h2 className="text-lg font-semibold tracking-tight text-slate-900">AI Infrastructure Observability Console</h2>
              <div className="flex items-center gap-2 mt-0.5">
                <div className="flex items-center justify-center w-2.5 h-2.5 rounded-full bg-emerald-100">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                </div>
                <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Operational · Air-Gapped Execution Node</span>
              </div>
            </div>
          </div>
          <div className="flex flex-col items-start md:items-end gap-1.5 text-sm">
            <div className="flex items-center gap-2 text-slate-600 font-medium">
              <Clock className="w-4 h-4 text-slate-400" />
              <span className="text-xs">99.98% (14d 6h 22m continuous runtime)</span>
            </div>
            <div className="flex items-center gap-2 text-slate-600 font-medium">
              <Cpu className="w-4 h-4 text-slate-400" />
              <span className="text-xs">Phi-4-Mini (4-bit AWQ Quantized · CUDA Acceleration)</span>
            </div>
            <div className="flex items-center gap-2 text-emerald-700 font-medium mt-1 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200/60 shadow-sm">
              <Lock className="w-3 h-3" />
              <span className="text-[11px] font-bold">Zero Outbound Data Transfer (Strict Isolation Active)</span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. High-Density KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 shrink-0">
        <KpiCard 
          title="Average First Token Latency (TTFT)" 
          value="418 ms" 
          badge="<700ms Target Met" 
          badgeType="success"
          sparkline={<path d="M0 20 L20 20 L40 10 L60 18 L80 12 L100 15" fill="none" stroke="#059669" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />}
        />
        <KpiCard 
          title="Generation Speed" 
          value="18.4 tokens/sec" 
          badge="Optimal Throughput" 
          badgeType="success"
          sparkline={<path d="M0 20 Q 25 15 50 10 T 100 5" fill="none" stroke="#059669" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />}
        />
        <KpiCard 
          title="SQLite Vector Search Latency" 
          value="1.8 ms" 
          badge="SIMD Accelerated" 
          badgeType="info"
          sparkline={<path d="M0 15 L20 15 L40 14 L60 15 L80 16 L100 15" fill="none" stroke="#0284c7" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />}
        />
        <KpiCard 
          title="Embedding Cache Hit Rate" 
          value="94.8%" 
          badge="High Efficiency" 
          badgeType="success"
          sparkline={<path d="M0 25 L30 20 L60 10 L100 5" fill="none" stroke="#059669" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />}
        />
        <KpiCard 
          title="Active Model VRAM Allocation" 
          value="4.2 GB / 16.0 GB" 
          badge="Shared Memory Mode" 
          badgeType="neutral"
          sparkline={<path d="M0 15 L100 15" fill="none" stroke="#64748b" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="4 4" />}
        />
        <KpiCard 
          title="Indexed Chunks & Store Size" 
          value="35 Chunks | 1.4 MB" 
          badge="SQLite Blob" 
          badgeType="neutral"
          sparkline={<path d="M0 25 L20 22 L40 18 L60 15 L80 10 L100 8" fill="none" stroke="#64748b" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />}
        />
      </div>

      {/* 3. Infrastructure & Model Resource Gauges */}
      <div className="bg-white/80 backdrop-blur-md border border-white/80 shadow-sm rounded-2xl p-5 shrink-0">
        <h3 className="text-sm font-semibold tracking-tight text-slate-900 mb-5 flex items-center gap-2">
          <Server className="w-4 h-4 text-slate-500" /> Resource Utilization
        </h3>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-10 gap-y-6">
          <ResourceGauge label="CPU Utilization" value={telemetry?.cpu.percent ?? 34} subtext="8 Cores / 16 Threads active" gradient="from-[#007FFF] to-[#000080]" />
          <ResourceGauge label="System RAM" value={telemetry ? Math.round((telemetry.memory.used_gb / telemetry.memory.total_gb) * 100) : 26} subtext={`${telemetry?.memory.used_gb ?? '4.2'} GB / ${telemetry?.memory.total_gb ?? '16.0'} GB allocated`} gradient="from-[#007FFF] to-[#000080]" />
          <ResourceGauge label="GPU Utilization & VRAM" value={22.5} subtext="1.8 GB / 8.0 GB DirectML/CUDA active" gradient="from-[#007FFF] to-[#000080]" />
          <ResourceGauge label="Storage & Disk I/O" value={2.4} subtext="Read: 14.2 MB/s | Write: 0.1 MB/s" gradient="from-[#007FFF] to-[#000080]" />
          
          <div className="col-span-1 lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
            <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50/70 border border-slate-200/70 shadow-sm">
              <div className="flex flex-col">
                <span className="text-[13px] font-semibold text-slate-700">Embedding Processing Queue</span>
                <span className="text-[11px] font-medium text-slate-500 mt-0.5">0 pending (Idle)</span>
              </div>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200 uppercase tracking-wider">
                <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
                Operational
              </span>
            </div>
            <div className="flex items-center justify-between p-3.5 rounded-xl bg-blue-50/40 border border-blue-100/70 shadow-sm">
              <div className="flex flex-col">
                <span className="text-[13px] font-semibold text-slate-700">Inference Stream Queue</span>
                <span className="text-[11px] font-medium text-slate-500 mt-0.5">1 active stream</span>
              </div>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200 uppercase tracking-wider">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></span>
                Processing
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 4. Live Telemetry Event Grid & Logs */}
      <div className="bg-white/80 backdrop-blur-md border border-white/80 shadow-sm rounded-2xl p-5 flex flex-col flex-1 min-h-[450px]">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4 shrink-0">
          <h3 className="text-sm font-semibold tracking-tight text-slate-900 flex items-center gap-2">
            <LineChart className="w-4 h-4 text-slate-500" /> Live Telemetry & Audit Logs
          </h3>
          <div className="flex flex-wrap items-center gap-1 bg-slate-100/70 p-1 rounded-lg border border-slate-200/70">
            {tabs.map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-3 py-1.5 text-[11px] font-semibold rounded-md transition-all uppercase tracking-wide ${
                  activeTab === tab 
                    ? "bg-white text-slate-800 shadow-sm border border-slate-200" 
                    : "text-slate-500 hover:text-slate-700 hover:bg-slate-200/50"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-hidden flex flex-col border border-slate-200/60 rounded-xl bg-white/50 shadow-inner min-h-0">
          <div className="grid grid-cols-[100px_70px_160px_1fr_90px_100px] xl:grid-cols-[120px_80px_180px_1fr_100px_110px] gap-4 px-4 py-3 bg-slate-50/90 border-b border-slate-200/70 text-[10px] font-bold text-slate-500 uppercase tracking-wider shrink-0">
            <div>Timestamp</div>
            <div>Level</div>
            <div>Component</div>
            <div>Message Details</div>
            <div>Latency</div>
            <div>Status</div>
          </div>
          <div className="flex-1 overflow-y-auto">
            {logs.map((log, i) => (
              <div key={i} className="grid grid-cols-[100px_70px_160px_1fr_90px_100px] xl:grid-cols-[120px_80px_180px_1fr_100px_110px] gap-4 px-4 py-3 border-b border-slate-100/80 hover:bg-white/80 transition-colors text-xs items-center group">
                <div className="font-mono text-[11px] text-slate-500 group-hover:text-slate-700 transition-colors">{log.time}</div>
                <div>
                  <span className={`inline-flex px-1.5 py-0.5 rounded font-mono text-[9px] font-bold tracking-wider ${
                    log.level === 'PERF' ? 'bg-purple-100/80 text-purple-700 border border-purple-200' :
                    log.level === 'LLM' ? 'bg-blue-100/80 text-blue-700 border border-blue-200' :
                    log.level === 'SEC' ? 'bg-amber-100/80 text-amber-700 border border-amber-200' :
                    log.level === 'VECTOR' ? 'bg-emerald-100/80 text-emerald-700 border border-emerald-200' :
                    'bg-slate-100/80 text-slate-700 border border-slate-200'
                  }`}>
                    {log.level}
                  </span>
                </div>
                <div className="font-semibold text-slate-700 truncate text-[11px]">{log.component}</div>
                <div className="text-slate-600 truncate text-[12px]">{log.message}</div>
                <div className="font-mono text-[11px] text-slate-500 group-hover:text-slate-700 transition-colors">{log.latency}</div>
                <div>
                  <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider border ${
                    log.status === 'OK' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                    log.status === 'STREAMING' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                    log.status === 'BLOCKED' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                    'bg-slate-50 text-slate-700 border-slate-200'
                  }`}>
                    {log.status === 'STREAMING' && <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />}
                    {log.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

    </section>
  )
}

function KpiCard({ title, value, badge, badgeType, sparkline }: { title: string, value: string, badge: string, badgeType: 'success' | 'info' | 'neutral', sparkline: React.ReactNode }) {
  const badgeClasses = {
    success: "bg-emerald-50 text-emerald-700 border-emerald-200",
    info: "bg-sky-50 text-sky-700 border-sky-200",
    neutral: "bg-slate-50 text-slate-700 border-slate-200"
  }

  return (
    <div className="bg-white/80 backdrop-blur-md border border-white/80 shadow-sm rounded-2xl p-4.5 flex flex-col justify-between h-[130px] transition-all duration-300 hover:shadow-md hover:bg-white/95 group">
      <div className="flex justify-between items-start mb-2">
        <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider max-w-[65%] leading-tight">{title}</span>
        <span className={`inline-flex px-1.5 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-wider border ${badgeClasses[badgeType]}`}>
          {badge}
        </span>
      </div>
      <div className="flex items-end justify-between mt-auto">
        <span className="text-[22px] font-bold text-slate-800 tracking-tight leading-none group-hover:text-blue-900 transition-colors">{value}</span>
        <div className="w-[72px] h-[32px] flex items-center justify-end opacity-80 group-hover:opacity-100 transition-opacity">
          <svg viewBox="0 0 100 30" className="w-full h-full overflow-visible" preserveAspectRatio="none">
            {sparkline}
          </svg>
        </div>
      </div>
    </div>
  )
}

function ResourceGauge({ label, value, subtext, gradient }: { label: string, value: number, subtext: string, gradient: string }) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold text-slate-700">{label}</span>
        <span className="text-[13px] font-mono font-bold text-slate-900">{value}%</span>
      </div>
      <div className="h-2.5 w-full bg-slate-100/80 rounded-full overflow-hidden border border-slate-200/60 shadow-inner">
        <div 
          className={`h-full rounded-full bg-gradient-to-r ${gradient} transition-all duration-1000 ease-out relative`}
          style={{ width: `${value}%` }}
        >
          <div className="absolute inset-0 bg-white/20 animate-[pulse_2s_ease-in-out_infinite]" />
        </div>
      </div>
      <span className="text-[11px] font-medium text-slate-500">{subtext}</span>
    </div>
  )
}
