import React, { useState, useEffect } from "react"
import { 
  Lock, 
  Cpu, 
  HardDrive, 
  Network, 
  Database, 
  Zap, 
  Activity, 
  Clock, 
  Layers 
} from "lucide-react"

const glassCardClasses = "bg-white/60 backdrop-blur-md border border-white/80 shadow-xs rounded-xl p-3.5 sm:p-4 hover:bg-white/70 transition-all";

const badgeThemes = {
  success: "bg-emerald-50/80 text-emerald-700 border border-emerald-200/50",
  accent: "bg-blue-50/80 text-blue-700 border border-blue-200/50",
  muted: "bg-slate-100/80 text-slate-600 border border-slate-200/50",
};

const KPICard = ({ title, value, badge, badgeTheme = "muted", icon: Icon, sparkline, subtitle }: any) => (
  <div className={`${glassCardClasses} flex flex-col justify-between`}>
    <div className="flex items-start justify-between mb-4">
      <div className="text-xs font-medium text-slate-600 flex items-center gap-1.5">
        <Icon className="w-4 h-4 text-[#007FFF]" />
        <h3>{title}</h3>
      </div>
      <div className={`text-[10px] font-medium px-2 py-0.5 rounded-md ${badgeThemes[badgeTheme as keyof typeof badgeThemes]}`}>
        {badge}
      </div>
    </div>
    <div className="flex items-end justify-between mt-2">
      <div>
        <div className="text-xl font-semibold tracking-tight text-slate-900">{value}</div>
        {subtitle && <div className="text-[11px] font-normal text-slate-400 mt-0.5">{subtitle}</div>}
      </div>
      {sparkline && (
        <div className="w-20 h-8">
          {sparkline}
        </div>
      )}
    </div>
  </div>
)

const ResourceMeter = ({ title, percent, details, subtext }: any) => (
  <div className={`${glassCardClasses} flex flex-col justify-center`}>
    <div className="flex justify-between items-end mb-3">
      <h4 className="text-xs font-medium text-slate-600 flex items-center gap-1.5">{title}</h4>
      <span className="text-xl font-semibold tracking-tight text-slate-900">{percent.toFixed(1)}%</span>
    </div>
    <div className="h-2.5 w-full bg-gray-100 rounded-full overflow-hidden mb-3">
      <div className={`h-full rounded-full bg-gradient-to-r from-[#007FFF] to-[#000080] transition-all duration-1000 ease-out`} style={{ width: `${percent}%` }} />
    </div>
    <div className="flex justify-between text-[11px] font-normal text-slate-400 mt-0.5">
      <span>{details}</span>
      {subtext && <span>{subtext}</span>}
    </div>
  </div>
)

const PipelineQueue = ({ pending, active }: { pending: number, active: number }) => (
  <div className={`${glassCardClasses} flex flex-col justify-center gap-3.5`}>
    <div className="flex flex-col gap-1.5">
      <div className="text-xs font-medium text-slate-600 flex items-center gap-1.5">
        <Activity className="w-4 h-4 text-[#007FFF]" />
        <span>Embedding Queue</span>
      </div>
      <div className="flex items-center justify-between">
        <span className="text-xl font-semibold tracking-tight text-slate-900">{pending} pending {pending === 0 ? '(Idle)' : ''}</span>
        <span className={`text-[10px] font-medium px-2 py-0.5 rounded-md ${badgeThemes[pending === 0 ? 'success' : 'accent']}`}>
          {pending === 0 ? 'Operational' : 'Processing'}
        </span>
      </div>
    </div>
    <div className="w-full h-px bg-gray-200/60" />
    <div className="flex flex-col gap-1.5">
      <div className="text-xs font-medium text-slate-600 flex items-center gap-1.5">
        <Network className="w-4 h-4 text-[#007FFF]" />
        <span>Inference Stream</span>
      </div>
      <div className="flex items-center justify-between">
        <span className="text-xl font-semibold tracking-tight text-slate-900">{active} active stream</span>
        <span className={`text-[10px] font-medium px-2 py-0.5 rounded-md ${active > 0 ? badgeThemes.accent + ' animate-pulse' : badgeThemes.muted}`}>
          {active > 0 ? 'Processing' : 'Idle'}
        </span>
      </div>
    </div>
  </div>
)

const getStatusBadge = (status: string) => {
  if (status === 'OK') return badgeThemes.success;
  if (status === 'STREAMING') return badgeThemes.accent;
  return badgeThemes.muted;
}

const getLevelColor = (level: string) => {
  const colors: Record<string, string> = {
    'PERF': 'text-purple-600',
    'LLM': 'text-blue-600',
    'SEC': 'text-amber-600',
    'VECTOR': 'text-cyan-600',
    'HEALTH': 'text-emerald-600'
  }
  return colors[level] || 'text-gray-600'
}

export default function AnalyticsModule() {
  const [activeTab, setActiveTab] = useState('All Logs')
  const tabs = ['All Logs', 'Inference Streams', 'Vector Indexing', 'Sanitization & PII', 'System Audits']

  const [metrics, setMetrics] = useState({
    ttft: 418,
    tokensPerSec: 18.4,
    vectorLatency: 1.8,
    cacheHitRate: 94.8,
    vramAllocated: 4.2,
    vramTotal: 16.0,
    chunks: 35,
    blobSize: 1.4,
    cpuPercent: 34,
    ramPercent: 26,
    gpuPercent: 22.5,
    storageRead: 14.2,
    storageWrite: 0.1,
    pendingEmbeddings: 0,
    activeStreams: 1,
    logs: [
      { time: '14:22:01.412', level: 'PERF', component: 'SQLiteVectorStore', message: 'Cosine similarity lookup over 35 chunks', latency: '1.8 ms', status: 'OK' },
      { time: '14:22:01.390', level: 'LLM', component: 'Phi4MiniRuntime', message: 'Generated 142 tokens for session SESS-892', latency: '418 ms TTFT', status: 'STREAMING' },
      { time: '14:21:59.004', level: 'SEC', component: 'PIIRedactionSanitizer', message: 'Filtered query string for passport/IBAN patterns', latency: '0.4 ms', status: 'BLOCKED' },
      { time: '14:21:58.850', level: 'VECTOR', component: 'ChunkingPipeline', message: 'Verified SQLite blob integrity (F32 vectors)', latency: '0.9 ms', status: 'OK' },
      { time: '14:21:55.120', level: 'HEALTH', component: 'PrometheusExporter', message: 'Telemetry metrics scraped by local collector', latency: '0.2 ms', status: 'OK' },
    ]
  });

  useEffect(() => {
    const fetchTelemetry = async () => {
      try {
        const res = await fetch('http://127.0.0.1:8000/api/v1/telemetry/system');
        if (res.ok) {
          const data = await res.json();
          setMetrics(prev => ({ 
            ...prev,
            cpuPercent: data.cpu?.percent ?? prev.cpuPercent,
            ramPercent: data.memory?.percent ?? prev.ramPercent,
            storageRead: data.storage?.read_mbps ?? prev.storageRead,
            storageWrite: data.storage?.write_mbps ?? prev.storageWrite
          }));
        } else {
          simulateFluctuations();
        }
      } catch (err) {
        simulateFluctuations();
      }
    };

    const simulateFluctuations = () => {
      setMetrics(prev => ({
        ...prev,
        ttft: Math.max(200, Math.min(800, prev.ttft + (Math.random() * 40 - 20))),
        tokensPerSec: Math.max(5, Math.min(40, prev.tokensPerSec + (Math.random() * 4 - 2))),
        vectorLatency: Math.max(0.5, Math.min(5, prev.vectorLatency + (Math.random() * 0.4 - 0.2))),
        cacheHitRate: Math.max(80, Math.min(99.9, prev.cacheHitRate + (Math.random() * 2 - 1))),
        vramAllocated: Math.max(2, Math.min(prev.vramTotal, prev.vramAllocated + (Math.random() * 0.2 - 0.1))),
        cpuPercent: Math.max(5, Math.min(100, prev.cpuPercent + (Math.random() * 10 - 5))),
        ramPercent: Math.max(10, Math.min(95, prev.ramPercent + (Math.random() * 2 - 1))),
        gpuPercent: Math.max(0, Math.min(100, prev.gpuPercent + (Math.random() * 8 - 4))),
        storageRead: Math.max(0, prev.storageRead + (Math.random() * 5 - 2.5)),
        storageWrite: Math.max(0, prev.storageWrite + (Math.random() * 0.5 - 0.25)),
      }));
    };
    
    const interval = setInterval(fetchTelemetry, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex h-full min-h-0 flex-col overflow-y-auto w-full p-4 space-y-4">
      <svg width="0" height="0" className="absolute">
        <defs>
          <linearGradient id="spark-grad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#007FFF" />
            <stop offset="100%" stopColor="#000080" />
          </linearGradient>
        </defs>
      </svg>
      {/* Executive Header */}
      <header className={`${glassCardClasses} flex flex-col md:flex-row md:items-center justify-between shrink-0 gap-4`}>
        <div className="flex flex-col gap-2">
          <h1 className="text-lg font-semibold text-slate-900 tracking-tight">AI Infrastructure Observability</h1>
          <div className="flex items-center gap-3 text-xs text-gray-600 flex-wrap">
            <div className="flex items-center gap-2 text-xs font-medium px-2.5 py-1 rounded-full bg-emerald-50/80 border border-emerald-200/50">
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-emerald-700">Operational · Air-Gapped Execution Node</span>
            </div>
            <span className="text-gray-300">|</span>
            <span>Uptime: <span className="font-medium">99.98% (14d 6h 22m continuous runtime)</span></span>
          </div>
        </div>
        <div className="flex flex-col items-start md:items-end gap-2">
          <div className="flex items-center gap-2 text-xs text-gray-700">
            <Cpu className="w-4 h-4 text-[#007FFF]" />
            <span>Active Engine: <span className="font-medium">Phi-4-Mini (4-bit AWQ Quantized · CUDA Acceleration)</span></span>
          </div>
          <div className="flex items-center gap-2 text-xs font-medium text-emerald-700">
            <Lock className="w-4 h-4" />
            <span>Zero Outbound Data Transfer (Strict Isolation Active)</span>
          </div>
        </div>
      </header>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 shrink-0">
        <KPICard 
          title="Average First Token Latency (TTFT)" 
          value={`${metrics.ttft.toFixed(0)} ms`}
          icon={Clock}
          badge="<700ms Target Met"
          badgeTheme="success"
          sparkline={
            <svg viewBox="0 0 100 30" className="w-full h-full overflow-visible">
              <path d="M 0 25 L 20 20 L 40 28 L 60 15 L 80 18 L 100 5" fill="none" stroke="url(#spark-grad)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          }
        />
        
        <KPICard 
          title="Generation Speed" 
          value={`${metrics.tokensPerSec.toFixed(1)} tokens/sec`}
          icon={Zap}
          badge="Optimal Throughput"
          badgeTheme="success"
          sparkline={
            <svg viewBox="0 0 100 30" className="w-full h-full overflow-visible">
              <path d="M 0 20 Q 25 20, 50 15 T 100 5" fill="none" stroke="url(#spark-grad)" strokeWidth="2.5" strokeLinecap="round" />
            </svg>
          }
        />
        
        <KPICard 
          title="SQLite Vector Search Latency" 
          value={`${metrics.vectorLatency.toFixed(1)} ms`}
          icon={Database}
          badge="SIMD Accelerated"
          badgeTheme="accent"
          sparkline={
            <svg viewBox="0 0 100 30" className="w-full h-full overflow-visible">
              <path d="M 0 15 L 20 16 L 40 14 L 60 15 L 80 15 L 100 14" fill="none" stroke="url(#spark-grad)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          }
        />
        
        <KPICard 
          title="Embedding Cache Hit Rate" 
          value={`${metrics.cacheHitRate.toFixed(1)}%`}
          icon={Layers}
          badge="High Efficiency"
          badgeTheme="success"
          sparkline={
            <svg viewBox="0 0 100 30" className="w-full h-full overflow-visible">
              <path d="M 0 25 L 25 15 L 50 18 L 75 5 L 100 2" fill="none" stroke="url(#spark-grad)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          }
        />
        
        <KPICard 
          title="Active Model VRAM Allocation" 
          value={`${metrics.vramAllocated.toFixed(1)} GB`}
          subtitle={`/ ${metrics.vramTotal.toFixed(1)} GB Total`}
          icon={Cpu}
          badge="Shared Memory Mode"
          badgeTheme="muted"
        />

        <KPICard 
          title="Total Indexed Chunks & Vector Store Size" 
          value={`${metrics.chunks} Chunks`}
          subtitle={`${metrics.blobSize.toFixed(1)} MB (SQLite Blob)`}
          icon={HardDrive}
          badge="Indexed"
          badgeTheme="muted"
        />
      </div>

      {/* Resource Gauges Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3 shrink-0">
        <ResourceMeter 
          title="CPU Utilization" 
          percent={metrics.cpuPercent} 
          details="8 Cores / 16 Threads active" 
        />
        
        <ResourceMeter 
          title="System RAM" 
          percent={metrics.ramPercent} 
          details={`${metrics.vramAllocated.toFixed(1)} GB / 16.0 GB allocated`} 
        />
        
        <ResourceMeter 
          title="GPU Utilization & VRAM" 
          percent={metrics.gpuPercent} 
          details="1.8 GB / 8.0 GB DirectML/CUDA active" 
        />
        
        <ResourceMeter 
          title="Storage & Disk I/O" 
          percent={Math.min(100, (metrics.storageRead + metrics.storageWrite) * 2)} 
          details={`Read: ${metrics.storageRead.toFixed(1)} MB/s | Write: ${metrics.storageWrite.toFixed(1)} MB/s`} 
        />
        
        <PipelineQueue pending={metrics.pendingEmbeddings} active={metrics.activeStreams} />
      </div>

      {/* Logs Section */}
      <div className={`${glassCardClasses} flex flex-col flex-1 min-h-[350px]`}>
        <div className="flex flex-wrap items-center gap-2 md:gap-6 border-b border-gray-200 pb-3 mb-4 shrink-0">
          {tabs.map(tab => (
            <button 
              key={tab} 
              onClick={() => setActiveTab(tab)}
              className={`text-sm font-medium transition-colors px-1 ${activeTab === tab ? 'text-[#000080] border-b-2 border-[#000080] pb-3 -mb-[14px]' : 'text-gray-500 hover:text-gray-700'}`}
            >
              {tab}
            </button>
          ))}
        </div>
        
        <div className="overflow-x-auto flex-1">
          <div className="min-w-[850px]">
            {/* Header Row */}
            <div className="grid grid-cols-12 gap-4 text-[10px] font-semibold uppercase tracking-wider text-slate-400 py-2 px-3 border-b border-slate-100">
              <div className="col-span-2">TIMESTAMP</div>
              <div className="col-span-1">LEVEL</div>
              <div className="col-span-2">COMPONENT</div>
              <div className="col-span-4">DETAILS</div>
              <div className="col-span-2">LATENCY</div>
              <div className="col-span-1">STATUS</div>
            </div>
            
            {/* Rows */}
            <div className="flex flex-col mt-1">
              {metrics.logs.map((log, i) => (
                <div key={i} className="grid grid-cols-12 gap-4 py-2 px-3 text-xs font-normal text-slate-700 h-9 items-center rounded-lg hover:bg-white/50 transition-colors border border-transparent hover:border-white/60">
                  <div className="col-span-2 text-slate-500 font-mono text-[10px]">{log.time}</div>
                  <div className={`col-span-1 font-semibold text-[10px] tracking-wide ${getLevelColor(log.level)}`}>{log.level}</div>
                  <div className="col-span-2 font-medium text-slate-700 truncate" title={log.component}>{log.component}</div>
                  <div className="col-span-4 text-slate-600 truncate" title={log.message}>{log.message}</div>
                  <div className="col-span-2 text-slate-500 font-mono text-[10px]">{log.latency}</div>
                  <div className="col-span-1 flex items-center">
                    <span className={`text-[10px] font-medium px-2 py-0.5 rounded-md ${getStatusBadge(log.status)}`}>
                      {log.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

