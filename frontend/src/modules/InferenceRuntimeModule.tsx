import React from 'react';
import { useWorkstation } from "@/context/WorkstationContext";
import { useWorkstationData } from "@/components/workstation/use-workstation-data";
import { Activity, Cpu, Server, Database, Clock, Zap, MessageSquare, PlayCircle, Settings, LayoutList, TerminalSquare, List, User, FileText, Layers, Search, Inbox, BarChart3 } from "lucide-react";

const NOT_REPORTED = "Not reported";
const NOT_AVAILABLE = "Not available";
const DASH = "—";

export default function InferenceRuntimeModule() {
  const { isGenerating } = useWorkstation();
  const { status, loading } = useWorkstationData();

  const runtime = status?.runtime_state ?? null;
  const online = status != null;
  const provider = runtime?.provider ?? (online ? "Foundry Local" : (loading ? "Loading…" : NOT_AVAILABLE));

  const chatModel = status?.models?.chat_model ?? (loading ? "Loading…" : NOT_AVAILABLE);
  const embedModel = status?.models?.embed_model ?? (loading ? "Loading…" : NOT_AVAILABLE);
  const chatLoaded = runtime?.models?.chat?.loaded;
  const embedLoaded = runtime?.models?.embed?.loaded;

  const loadedLabel = (loaded?: boolean) =>
    loaded === true ? "Loaded" : loaded === false ? "Idle" : NOT_REPORTED;

  // The active stream count is known for this operator session only.
  const activeStreams = isGenerating ? 1 : 0;

  return (
    <div className="flex flex-col h-full w-full overflow-y-auto bg-transparent p-4 sm:p-6 lg:p-8">
      <div className="flex flex-col gap-6 max-w-7xl mx-auto w-full">
        
        {/* Header */}
        <div className="bg-white/90 backdrop-blur-md border border-slate-200/60 shadow-sm rounded-2xl p-6 flex justify-between items-center flex-wrap gap-4 group">
          <div className="flex items-center gap-5">
            <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-white border border-slate-200/60 shadow-sm group-hover:shadow-md transition-shadow duration-300">
              <Cpu className="text-[#000080] group-hover:scale-110 transition-transform duration-300" size={24} />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-800 tracking-tight mb-1">Inference Runtime</h1>
              <p className="text-[13px] font-medium text-slate-500">Dedicated operational center for the Enterprise Local RAG runtime.</p>
            </div>
          </div>
          {online ? (
            <div className="bg-emerald-50 text-emerald-700 border border-emerald-200/60 px-4 py-2 rounded-full text-xs font-bold flex items-center gap-2 uppercase tracking-wide shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-300">
               <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" /> Operational
            </div>
          ) : (
            <div className="bg-amber-50 text-amber-700 border border-amber-200/60 px-4 py-2 rounded-full text-xs font-bold flex items-center gap-2 uppercase tracking-wide shadow-sm">
               <span className="w-2 h-2 rounded-full bg-amber-500" /> {loading ? "Connecting…" : "Offline"}
            </div>
          )}
        </div>

        {/* Section 1: Runtime Status */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5">
          <GlassMetricCard title="Runtime Provider" value={provider} icon={<Settings size={18} />} status={online ? "Operational" : NOT_AVAILABLE} statusColor={online ? "text-emerald-600" : "text-slate-400"} />
          <GlassMetricCard title="Active Chat Model" value={chatModel} icon={<MessageSquare size={18} />} status={loadedLabel(chatLoaded)} statusColor={chatLoaded ? "text-emerald-600" : "text-slate-400"} />
          <GlassMetricCard title="Embedding Model" value={embedModel} icon={<Server size={18} />} status={loadedLabel(embedLoaded)} statusColor={embedLoaded ? "text-emerald-600" : "text-slate-400"} />
          <GlassMetricCard title="Active Streams" value={online ? String(activeStreams) : DASH} icon={<Zap size={18} />} status={isGenerating ? "Streaming" : "Idle"} statusColor={isGenerating ? "text-emerald-600" : "text-slate-400"} />
          <GlassMetricCard title="Queue Size" value={DASH} icon={<List size={18} />} status={NOT_REPORTED} statusColor="text-slate-400" />
        </div>

        {/* Section 2: Inference Performance */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5">
           <GlassMetricCard title="Tokens / Sec" value={DASH} icon={<Activity size={18} />} status={NOT_REPORTED} statusColor="text-slate-400" />
           <GlassMetricCard title="TTFT" value={DASH} icon={<Clock size={18} />} status={NOT_REPORTED} statusColor="text-slate-400" />
           <GlassMetricCard title="Prompt Tokens" value={DASH} icon={<Database size={18} />} status={NOT_REPORTED} statusColor="text-slate-400" />
           <GlassMetricCard title="Completion Tokens" value={DASH} icon={<BarChart3 size={18} />} status={NOT_REPORTED} statusColor="text-slate-400" />
           <GlassMetricCard title="Context Window" value={DASH} icon={<LayoutList size={18} />} status={NOT_REPORTED} statusColor="text-slate-400" />
        </div>

        {/* Section 3: Inference Pipeline */}
        <GlassPanel title="Inference Pipeline" icon={<PlayCircle size={18} className="text-[#000080]" />}>
           <div className="flex items-center w-full overflow-x-auto py-4 px-2 pb-6 scrollbar-hide">
              <PipelineStage name="User Query" icon={<User size={18} />} status="idle" />
              <PipelineStage name="Prompt Processing" icon={<FileText size={18} />} status="idle" />
              <PipelineStage name="Embedding Generation" icon={<Layers size={18} />} status="idle" />
              <PipelineStage name="Vector Search" icon={<Search size={18} />} status="idle" />
              <PipelineStage name="Context Assembly" icon={<Database size={18} />} status="idle" />
              <PipelineStage name="LLM Inference" icon={<Cpu size={18} />} status="idle" />
              <PipelineStage name="Streaming Response" icon={<Zap size={18} />} status="idle" isLast />
           </div>
        </GlassPanel>

        {/* Bottom Section: Active Sessions & Events */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
           {/* Section 4: Active Runtime Sessions */}
           <GlassPanel title="Active Runtime Sessions" icon={<Activity size={18} className="text-[#000080]" />}>
              <div className="overflow-x-auto w-full h-full flex flex-col">
                 <table className="w-full text-left text-sm text-slate-600 border-collapse min-w-[600px] mb-6">
                    <thead className="text-[11px] uppercase tracking-wider text-slate-500 bg-slate-50 border-b border-slate-200/60">
                       <tr>
                          <th className="px-4 py-3 font-semibold rounded-tl-xl">Session ID</th>
                          <th className="px-4 py-3 font-semibold">Current Model</th>
                          <th className="px-4 py-3 font-semibold">Started At</th>
                          <th className="px-4 py-3 font-semibold">Status</th>
                          <th className="px-4 py-3 font-semibold rounded-tr-xl">Tokens</th>
                       </tr>
                    </thead>
                 </table>
                 <div className="flex-1 flex flex-col items-center justify-center py-10 px-4 text-center bg-slate-50/50 rounded-xl border border-dashed border-slate-300 shadow-sm group">
                   <div className="w-12 h-12 bg-white rounded-xl shadow-sm border border-slate-200/60 flex items-center justify-center mb-4 group-hover:scale-110 group-hover:shadow-md transition-all duration-300">
                     <Inbox className="text-slate-400 group-hover:text-[#000080] transition-colors duration-300" size={24} />
                   </div>
                   <p className="text-[13px] font-bold text-slate-800 mb-1">No Active Sessions</p>
                   <p className="text-xs text-slate-500 max-w-xs font-medium leading-relaxed">
                     No data yet.<br/>Per-session runtime tracking is not reported.
                   </p>
                 </div>
              </div>
           </GlassPanel>

           {/* Section 5: Recent Runtime Events */}
           <GlassPanel title="Recent Runtime Events" icon={<TerminalSquare size={18} className="text-[#000080]" />}>
              <div className="overflow-x-auto w-full h-full flex flex-col">
                 <table className="w-full text-left text-sm text-slate-600 border-collapse min-w-[500px] mb-6">
                    <thead className="text-[11px] uppercase tracking-wider text-slate-500 bg-slate-50 border-b border-slate-200/60">
                       <tr>
                          <th className="px-4 py-3 font-semibold rounded-tl-xl w-32">Timestamp</th>
                          <th className="px-4 py-3 font-semibold w-48">Event Type</th>
                          <th className="px-4 py-3 font-semibold rounded-tr-xl">Details</th>
                       </tr>
                    </thead>
                 </table>
                 <div className="flex-1 flex flex-col items-center justify-center py-10 px-4 text-center bg-slate-50/50 rounded-xl border border-dashed border-slate-300 shadow-sm group">
                   <div className="w-12 h-12 bg-white rounded-xl shadow-sm border border-slate-200/60 flex items-center justify-center mb-4 group-hover:scale-110 group-hover:shadow-md transition-all duration-300">
                     <Activity className="text-slate-400 group-hover:text-[#000080] transition-colors duration-300" size={24} />
                   </div>
                   <p className="text-[13px] font-bold text-slate-800 mb-1">Event Log Empty</p>
                   <p className="text-xs text-slate-500 max-w-xs font-medium leading-relaxed">
                     No data yet.<br/>Runtime event history is not recorded.
                   </p>
                 </div>
              </div>
           </GlassPanel>
        </div>

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
  hasSparkline?: boolean;
}

function GlassMetricCard({ title, value, icon, status, statusColor = "text-emerald-600", statusDotColor = "", hasSparkline = false }: GlassMetricCardProps) {
  return (
    <div className="bg-white/90 backdrop-blur-md border border-slate-200/60 shadow-sm rounded-2xl p-6 flex flex-col gap-4 hover:-translate-y-1 hover:shadow-md transition-all duration-300 group">
      <div className="flex items-center gap-2.5 text-xs font-bold text-slate-500 uppercase tracking-wide">
        <span className="text-[#000080] shrink-0 group-hover:scale-110 transition-transform duration-300">{icon}</span>
        <span className="truncate">{title}</span>
      </div>
      <div className="text-3xl font-bold text-slate-800 tracking-tight leading-none">{value}</div>
      
      {hasSparkline && (
        <div className="h-10 w-full mt-1 mb-1 relative flex items-center justify-center rounded-lg border border-dashed border-slate-200 bg-slate-50 group-hover:bg-slate-100 transition-colors">
          <div className="absolute inset-0 flex items-center justify-center">
             <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">No data yet</span>
          </div>
          <svg className="w-full h-full opacity-30" preserveAspectRatio="none" viewBox="0 0 100 20">
             <path d="M0,10 Q25,12 50,10 T100,10" fill="none" stroke="currentColor" strokeWidth="1" strokeDasharray="2 2" className="text-slate-400" />
          </svg>
        </div>
      )}

      <div className={`text-[11px] font-bold uppercase flex items-center gap-2 pt-3 border-t border-slate-100/80 mt-auto ${statusColor}`}>
        {/not reported|not available|awaiting/i.test(status) ? (
           <span className="opacity-80 text-slate-400 truncate">{status}</span>
        ) : (
           <>
              {(status === "Processing" || status === "Active" || status === "Streaming" || status === "Operational" || status === "Loaded") && <span className={`w-2 h-2 rounded-full animate-pulse shrink-0 ${statusDotColor || "bg-emerald-500"}`} />}
              <span className="truncate">{status}</span>
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
      <div className="bg-white/90 backdrop-blur-md border border-slate-200/60 shadow-sm rounded-2xl p-6 flex flex-col gap-5 hover:shadow-md transition-shadow duration-300 group/panel">
         <div className="flex items-center gap-3 text-sm font-bold text-slate-800 border-b border-slate-100/80 pb-4 tracking-tight">
            <span className="group-hover/panel:scale-110 transition-transform duration-300 inline-block">{icon}</span> {title}
         </div>
         {children}
      </div>
   );
}

interface PipelineStageProps {
  name: string;
  icon: React.ReactNode;
  status: 'idle' | 'active' | 'success';
  isLast?: boolean;
}

function PipelineStage({ name, icon, status, isLast }: PipelineStageProps) {
   const baseClasses = "flex flex-col items-center justify-center p-4 rounded-xl border transition-all duration-500 min-w-[150px] shadow-sm relative group bg-white/90 backdrop-blur-md";
   let statusClasses = "";
   let iconColor = "";
   let textClasses = "";
   let lineClasses = "";
   
   if (status === 'active') {
      statusClasses = "border-[#000080]/30 shadow-[0_4px_20px_rgba(0,0,128,0.15)] ring-1 ring-[#000080]/20 bg-white";
      iconColor = "text-[#000080]";
      textClasses = "text-slate-800 font-bold";
      lineClasses = "bg-[#000080]/60";
   } else if (status === 'success') {
      statusClasses = "border-emerald-200/60 shadow-[0_4px_15px_rgba(16,185,129,0.05)] bg-white";
      iconColor = "text-emerald-600";
      textClasses = "text-slate-800 font-semibold";
      lineClasses = "bg-emerald-300";
   } else {
      statusClasses = "border-slate-200/60 shadow-sm opacity-90 hover:opacity-100 hover:shadow-md hover:bg-white";
      iconColor = "text-slate-400 group-hover:text-[#000080] transition-colors duration-300";
      textClasses = "text-slate-500 font-semibold group-hover:text-slate-800 transition-colors duration-300";
      lineClasses = "bg-slate-200";
   }

   return (
      <div className="flex items-center">
        <div className={`${baseClasses} ${statusClasses}`}>
           <div className={`mb-3 p-3 rounded-xl bg-slate-50 shadow-sm border border-slate-200/60 ${iconColor} group-hover:scale-110 group-hover:shadow-md transition-all duration-300`}>
              {icon}
           </div>
           <div className={`text-[11px] text-center tracking-tight leading-tight ${textClasses}`}>{name}</div>
        </div>
        {!isLast && (
           <div className="w-12 flex items-center justify-center shrink-0">
             <div className={`h-[2px] w-full ${lineClasses} rounded-full transition-colors duration-500 relative`}>
               {status === 'active' && <div className="absolute inset-0 bg-[#000080]/60 rounded-full animate-pulse blur-[2px]"></div>}
             </div>
           </div>
        )}
      </div>
   );
}
