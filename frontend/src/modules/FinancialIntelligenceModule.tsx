import React from 'react';
import { useWorkstation } from "@/context/WorkstationContext";
import { Activity, Cpu, Server, Database, Clock, Zap, ShieldCheck, HardDrive, List, FileText } from "lucide-react";

export default function FinancialIntelligenceModule() {
  const { documentInventory, documentIndex, isGenerating, uploadQueue } = useWorkstation();

  const indexedDocsCount = documentInventory?.length || 0;
  const indexedChunksCount = documentIndex?.vectors || 0;
  const activeStreamsCount = isGenerating ? 1 : 0;
  const queueCount = uploadQueue?.length || 0;

  return (
    <div className="flex flex-col h-full w-full overflow-y-auto bg-slate-50/30 p-4 sm:p-6 lg:p-8">
      <div className="flex flex-col gap-6 max-w-7xl mx-auto w-full">
        
        {/* Header */}
        <div className="bg-white/60 backdrop-blur-md border border-white/80 shadow-sm rounded-2xl p-6 flex justify-between items-center flex-wrap gap-4">
          <div className="flex items-center gap-5">
            <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-blue-50 border border-blue-100/50 shadow-inner">
              <Activity className="text-[#007FFF]" size={24} />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-800 tracking-tight mb-1">System Telemetry & Observability</h1>
              <p className="text-[13px] font-medium text-slate-500">Real-time local RAG runtime performance and active infrastructure state.</p>
            </div>
          </div>
          <div className="bg-emerald-50 text-emerald-700 border border-emerald-200/60 px-4 py-2 rounded-full text-xs font-bold flex items-center gap-2 uppercase tracking-wide shadow-sm">
             <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" /> Operational
          </div>
        </div>

        {/* Real-time Metrics Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <GlassMetricCard 
            title="Indexed Documents" 
            value={indexedDocsCount.toString()} 
            icon={<FileText size={18} />}
            status="Active Store"
          />
          <GlassMetricCard 
            title="Indexed Chunks" 
            value={indexedChunksCount.toLocaleString()} 
            icon={<Database size={18} />}
            status="Vector Embeddings"
          />
          <GlassMetricCard 
            title="Active Streams" 
            value={activeStreamsCount.toString()} 
            icon={<Zap size={18} />}
            status={isGenerating ? "Processing" : "Idle"}
            statusColor={isGenerating ? "text-amber-600" : "text-emerald-600"}
            statusDotColor={isGenerating ? "bg-amber-500" : "bg-emerald-500"}
          />
          <GlassMetricCard 
            title="Queue Size" 
            value={queueCount.toString()} 
            icon={<List size={18} />}
            status={queueCount > 0 ? "Pending Tasks" : "Idle"}
            statusColor={queueCount > 0 ? "text-amber-600" : "text-emerald-600"}
            statusDotColor={queueCount > 0 ? "bg-amber-500" : "bg-emerald-500"}
          />
          
          {/* Awaiting Backend Integration placeholders */}
          <GlassMetricCard 
            title="Active LLM" 
            value="N/A" 
            icon={<Cpu size={18} />}
            status="Awaiting Backend Integration"
            statusColor="text-slate-400"
          />
          <GlassMetricCard 
            title="Embedding Model" 
            value="N/A" 
            icon={<Server size={18} />}
            status="Awaiting Backend Integration"
            statusColor="text-slate-400"
          />
        </div>

        {/* Detailed Panels */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
           <GlassPanel title="Hardware Utilization (Awaiting Backend Integration)" icon={<HardDrive size={18} className="text-[#007FFF]" />}>
              <div className="flex flex-col gap-4 mt-2">
                 <HwGauge label="CPU Utilization" value="--" />
                 <HwGauge label="Memory Usage" value="--" />
                 <HwGauge label="GPU Utilization" value="--" />
              </div>
           </GlassPanel>

           <GlassPanel title="Runtime Performance (Awaiting Backend Integration)" icon={<Clock size={18} className="text-[#007FFF]" />}>
              <div className="flex flex-col gap-3">
                 <PerfItem label="Tokens per Second" value="--" />
                 <PerfItem label="Time To First Token (TTFT)" value="--" />
                 <PerfItem label="Vector Search Latency" value="--" />
                 <PerfItem label="Embedding Cache Hit Rate" value="--" />
                 <PerfItem label="Context Window Size" value="--" />
                 <PerfItem label="Prompt Tokens" value="--" />
                 <PerfItem label="Completion Tokens" value="--" />
              </div>
           </GlassPanel>
        </div>

        <GlassPanel title="Security & Audit Events (Awaiting Backend Integration)" icon={<ShieldCheck size={18} className="text-[#007FFF]" />}>
           <div className="bg-slate-50/50 rounded-xl p-8 min-h-[160px] flex items-center justify-center border border-slate-100/80 shadow-inner">
              <div className="flex flex-col items-center text-xs text-slate-400 text-center max-w-sm leading-relaxed">
                 <ShieldCheck size={32} className="opacity-40 mb-3" />
                 <p>Runtime logs, audit events, and prompt sanitization results will appear here once backend integration is complete.</p>
              </div>
           </div>
        </GlassPanel>
      </div>
    </div>
  );
}

interface GlassMetricCardProps {
  title: string;
  value: string;
  icon: React.ReactNode;
  status: string;
  statusColor?: string;
  statusDotColor?: string;
}

function GlassMetricCard({ title, value, icon, status, statusColor = "text-emerald-600", statusDotColor = "" }: GlassMetricCardProps) {
  return (
    <div className="bg-white/60 backdrop-blur-md border border-white/80 shadow-sm rounded-2xl p-6 flex flex-col gap-4 hover:-translate-y-1 hover:shadow-md transition-all duration-300">
      <div className="flex items-center gap-2.5 text-xs font-bold text-slate-500 uppercase tracking-wide">
        <span className="text-[#007FFF]">{icon}</span>
        <span>{title}</span>
      </div>
      <div className="text-3xl font-bold text-slate-800 tracking-tight leading-none">{value}</div>
      <div className={`text-[11px] font-bold uppercase flex items-center gap-2 pt-3 border-t border-slate-100/80 mt-auto ${statusColor}`}>
        {status === "Awaiting Backend Integration" ? (
           <span className="opacity-80 text-slate-400">{status}</span>
        ) : (
           <>
              {status === "Processing" ? <span className={`w-2 h-2 rounded-full animate-pulse ${statusDotColor || "bg-emerald-500"}`} /> : null}
              {status}
           </>
        )}
      </div>
    </div>
  );
}

interface GlassPanelProps {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}

function GlassPanel({ title, icon, children }: GlassPanelProps) {
   return (
      <div className="bg-white/60 backdrop-blur-md border border-white/80 shadow-sm rounded-2xl p-6 flex flex-col gap-5">
         <div className="flex items-center gap-3 text-sm font-bold text-slate-800 border-b border-slate-100/80 pb-4 tracking-tight">
            {icon} {title}
         </div>
         {children}
      </div>
   );
}

interface HwGaugeProps {
  label: string;
  value: string;
}

function HwGauge({ label, value }: HwGaugeProps) {
   return (
      <div className="flex flex-col gap-2">
         <div className="flex justify-between text-xs font-semibold text-slate-600">
            <span>{label}</span>
            <span>{value}</span>
         </div>
         <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden shadow-inner">
            <div className="h-full bg-gradient-to-r from-[#007FFF] to-[#000080] w-0 transition-all duration-1000"></div>
         </div>
      </div>
   );
}

interface PerfItemProps {
  label: string;
  value: string;
}

function PerfItem({ label, value }: PerfItemProps) {
   return (
      <div className="flex justify-between items-center p-3 bg-white/40 border border-slate-100/80 rounded-xl text-[13px] hover:bg-white/60 transition-colors">
         <span className="font-medium text-slate-600">{label}</span>
         <span className="font-semibold text-slate-800 font-mono bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200/50">{value}</span>
      </div>
   );
}
