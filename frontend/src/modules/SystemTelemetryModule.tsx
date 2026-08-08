import React, { useState, useEffect } from "react"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from "recharts"
import { 
  Activity, 
  Cpu, 
  HardDrive, 
  Network, 
  Database, 
  Server,
  Thermometer,
  Clock,
  Wifi,
  Lock,
  Monitor,
  List,
  Layers
} from "lucide-react"

const glassCardClasses = "bg-white/90 backdrop-blur-md border border-slate-200/60 shadow-sm rounded-2xl p-5 hover:-translate-y-1 hover:shadow-md transition-all duration-300 group";

const MetricCard = ({ title, value, icon: Icon, description }: any) => (
  <div className={`${glassCardClasses} flex flex-col h-full`}>
    <div className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-wide mb-4">
      <Icon className="w-4 h-4 text-[#000080] group-hover:scale-110 transition-transform duration-300" />
      <span>{title}</span>
    </div>
    <div className="mt-auto">
      <div className="text-3xl font-bold tracking-tight text-slate-800 leading-none">
        {value != null ? value : <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest leading-none">Not available</span>}
      </div>
      {description && (
        <div className="text-[11px] text-slate-500 font-medium mt-2">{description}</div>
      )}
    </div>
  </div>
)

const TimelineChart = ({ title }: { title: string }) => {
  const emptyData: any[] = [];
  return (
    <div className={`${glassCardClasses} flex flex-col min-h-[240px]`}>
      <div className="text-sm font-bold text-slate-800 mb-4">{title}</div>
      <div className="flex-1 relative border border-slate-200/60 rounded-xl bg-slate-50/50 pt-4 pr-4">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={emptyData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
            <XAxis dataKey="time" stroke="#cbd5e1" fontSize={10} tickLine={false} axisLine={false} />
            <YAxis stroke="#cbd5e1" fontSize={10} tickLine={false} axisLine={false} />
            <Line type="monotone" dataKey="value" stroke="#000080" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-[10px] text-slate-400 font-bold bg-white px-3 py-1.5 rounded-full shadow-sm border border-slate-200/60 uppercase tracking-wider">
            No historical data
          </span>
        </div>
      </div>
    </div>
  );
};

export default function SystemTelemetryModule() {
  const [activeTab, setActiveTab] = useState('All');
  const tabs = ['All', 'System', 'Runtime', 'Storage', 'Security'];

  const [telemetry, setTelemetry] = useState<any>(null);

  useEffect(() => {
    const fetchTelemetry = async () => {
      try {
        const res = await fetch('http://127.0.0.1:8000/api/v1/telemetry/system');
        if (res.ok) {
          const data = await res.json();
          setTelemetry(data);
        }
      } catch (err) {
        // Honest data integrity: do not simulate on error
      }
    };
    
    fetchTelemetry();
    const interval = setInterval(fetchTelemetry, 3000);
    return () => clearInterval(interval);
  }, []);

  const logs = telemetry?.logs || [];
  const filteredLogs = logs.filter((log: any) => {
    if (activeTab === 'All') return true;
    const tabLower = activeTab.toLowerCase();
    return log.level?.toLowerCase() === tabLower || log.component?.toLowerCase().includes(tabLower);
  });

  return (
    <div className="flex h-full min-h-0 flex-col overflow-y-auto w-full bg-transparent p-4 sm:p-6 lg:p-8 space-y-10 fluent-scrollbar">
      {/* Header */}
      <header className="flex flex-col gap-2 shrink-0">
        <h1 className="text-xl font-bold text-slate-800 tracking-tight">System Telemetry</h1>
        <p className="text-sm font-medium text-slate-500 max-w-2xl">
          Monitor the health and operational status of the local workstation hosting the Enterprise Local RAG platform.
        </p>
      </header>

      {/* SECTION 1 — Machine Health */}
      <section className="flex flex-col gap-5 shrink-0">
        <div className="flex items-center justify-between">
          <h2 className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Machine Health</h2>
          <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border backdrop-blur-md transition-colors ${
            telemetry 
              ? "bg-emerald-50 text-emerald-700 border-emerald-200/60" 
              : "bg-amber-50 text-amber-700 border-amber-200/60"
          }`}>
            <span className={`w-1.5 h-1.5 rounded-full ${telemetry ? "bg-emerald-500 animate-pulse" : "bg-amber-500"}`}></span>
            {telemetry ? "Live Telemetry" : "Backend Pending"}
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          <MetricCard 
            title="CPU Usage" 
            value={telemetry?.cpu?.percent != null ? `${telemetry.cpu.percent}%` : null}
            icon={Cpu}
          />
          <MetricCard 
            title="CPU Temperature" 
            value={telemetry?.cpu?.temperature != null ? `${telemetry.cpu.temperature}°C` : null}
            icon={Thermometer}
            description="Reserved for future backend support"
          />
          <MetricCard 
            title="RAM Usage" 
            value={telemetry?.memory?.percent != null ? `${telemetry.memory.percent}%` : null}
            icon={Activity}
          />
          <MetricCard 
            title="GPU Usage" 
            value={telemetry?.gpu?.percent != null ? `${telemetry.gpu.percent}%` : null}
            icon={Monitor}
          />
          <MetricCard 
            title="VRAM Usage" 
            value={telemetry?.gpu?.vram != null ? `${telemetry.gpu.vram} GB` : null}
            icon={Layers}
          />
          <MetricCard 
            title="Disk Usage" 
            value={telemetry?.storage?.percent != null ? `${telemetry.storage.percent}%` : null}
            icon={HardDrive}
          />
          <MetricCard 
            title="Disk Read / Write" 
            value={telemetry?.storage?.read_mbps != null ? `${telemetry.storage.read_mbps} MB/s / ${telemetry.storage.write_mbps} MB/s` : null}
            icon={Activity}
          />
          <MetricCard 
            title="Network Sent / Recv" 
            value={telemetry?.network?.bytes_sent_sec != null ? `${telemetry.network.bytes_sent_sec} B/s / ${telemetry.network.bytes_recv_sec} B/s` : null}
            icon={Wifi}
          />
          <MetricCard 
            title="System Uptime" 
            value={telemetry?.system?.uptime}
            icon={Clock}
          />
        </div>
      </section>

      {/* SECTION 2 — Hardware Monitoring */}
      <section className="flex flex-col gap-5 shrink-0">
        <h2 className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Hardware Monitoring</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <TimelineChart title="CPU Usage Timeline" />
          <TimelineChart title="RAM Usage Timeline" />
          <TimelineChart title="GPU Usage Timeline" />
          <TimelineChart title="Disk I/O Timeline" />
        </div>
      </section>

      {/* SECTION 3 — System Logs */}
      <section className="flex flex-col gap-5 shrink-0">
        <h2 className="text-[11px] font-bold uppercase tracking-wider text-slate-400">System Logs</h2>
        <div className="bg-white/90 backdrop-blur-md border border-slate-200/60 shadow-sm rounded-2xl flex flex-col min-h-[400px] overflow-hidden">
          <div className="flex flex-wrap items-center gap-6 border-b border-slate-200/60 px-6 pt-4 pb-0 shrink-0 bg-slate-50/50">
            {tabs.map(tab => (
              <button 
                key={tab} 
                onClick={() => setActiveTab(tab)}
                className={`text-xs font-bold uppercase tracking-wider transition-colors px-1 pb-4 border-b-2 ${activeTab === tab ? 'text-[#000080] border-[#000080]' : 'text-slate-400 border-transparent hover:text-slate-700'}`}
              >
                {tab}
              </button>
            ))}
          </div>
          
          <div className="overflow-x-auto flex-1">
            <div className="min-w-[800px] p-6">
              <div className="grid grid-cols-12 gap-4 text-[10px] font-bold uppercase tracking-wider text-slate-400 pb-3 border-b border-slate-100">
                <div className="col-span-2">TIMESTAMP</div>
                <div className="col-span-2">LEVEL</div>
                <div className="col-span-3">COMPONENT</div>
                <div className="col-span-5">MESSAGE</div>
              </div>
              
              <div className="flex flex-col mt-2">
                {filteredLogs.length > 0 ? (
                  filteredLogs.map((log: any, i: number) => (
                    <div key={i} className="grid grid-cols-12 gap-4 py-3 text-sm font-normal text-slate-700 items-center border-b border-slate-50 last:border-transparent hover:bg-slate-50 transition-colors px-2 -mx-2 rounded-lg">
                      <div className="col-span-2 text-slate-500 font-mono text-xs">{log.timestamp}</div>
                      <div className="col-span-2">
                        <span className="text-[10px] font-bold uppercase tracking-wide px-2 py-1 bg-slate-100 text-slate-600 rounded-md border border-slate-200/60">
                          {log.level}
                        </span>
                      </div>
                      <div className="col-span-3 font-semibold text-slate-800 truncate" title={log.component}>{log.component}</div>
                      <div className="col-span-5 text-slate-600 font-medium truncate" title={log.message}>{log.message}</div>
                    </div>
                  ))
                ) : (
                  <div className="py-16 text-center flex flex-col items-center justify-center gap-3">
                    <List className="w-8 h-8 text-slate-300" />
                    <span className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">No data yet</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 shrink-0 pb-10">
        {/* SECTION 4 — Storage */}
        <section className="flex flex-col gap-5">
          <h2 className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Storage Health</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 h-full">
            <MetricCard 
              title="Total Disk Capacity" 
              value={telemetry?.storage?.total_capacity}
              icon={HardDrive}
            />
            <MetricCard 
              title="Available Space" 
              value={telemetry?.storage?.available_space}
              icon={Database}
            />
            <MetricCard 
              title="SQLite Database Size" 
              value={telemetry?.storage?.sqlite_size}
              icon={Database}
            />
            <MetricCard 
              title="Vector Database Size" 
              value={telemetry?.storage?.vector_size}
              icon={Database}
            />
          </div>
        </section>

        {/* SECTION 5 — Network */}
        <section className="flex flex-col gap-5">
          <h2 className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Network</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 h-full">
            <MetricCard 
              title="Offline Mode" 
              value={telemetry?.network?.offline_mode != null ? (telemetry.network.offline_mode ? "Active" : "Inactive") : null}
              icon={Wifi}
            />
            <MetricCard 
              title="Localhost Endpoint" 
              value={telemetry?.network?.localhost_endpoint}
              icon={Server}
            />
            <MetricCard 
              title="Active Local Connections" 
              value={telemetry?.network?.active_connections}
              icon={Network}
            />
            <MetricCard 
              title="Zero Outbound Requests" 
              value={telemetry?.network?.zero_outbound != null ? (telemetry.network.zero_outbound ? "Verified" : "Unverified") : null}
              icon={Lock}
            />
          </div>
        </section>
      </div>
    </div>
  )
}
