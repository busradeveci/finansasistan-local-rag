import { useEffect, useState, useMemo } from "react"
import { getDocumentChunks } from "@/api/client"
import { useWorkstation } from "@/context/WorkstationContext"
import type { ChunkIndexRow } from "@/types/workstation"
import { 
  Database, FileText, FileCode, FileSpreadsheet, Search, 
  SearchX, Activity, Server, Clock, ChevronDown, ChevronUp,
  Info
} from "lucide-react"

function documentTypeIcon(filename: string) {
  const ext = (filename.split(".").pop() || "").toLowerCase()
  if (ext === "xlsx" || ext === "csv") {
    return <FileSpreadsheet className="h-4 w-4 shrink-0 text-emerald-600" strokeWidth={2} />
  }
  if (ext === "md" || ext === "txt") {
    return <FileCode className="h-4 w-4 shrink-0 text-amber-600" strokeWidth={2} />
  }
  return <FileText className="h-4 w-4 shrink-0 text-blue-600" strokeWidth={2} />
}

export default function KnowledgeHubModule() {
  const { documentInventory, documentIndex } = useWorkstation()
  const [active, setActive] = useState<string | null>(null)
  const [chunks, setChunks] = useState<ChunkIndexRow[]>([])
  const [searchQuery, setSearchQuery] = useState("")

  useEffect(() => {
    if (!active) {
      setChunks([])
      return
    }
    getDocumentChunks(active).then(setChunks).catch(() => setChunks([]))
  }, [active, documentInventory])

  const totalChunks = useMemo(() => documentInventory.reduce((n, d) => n + d.chunks, 0), [documentInventory])
  
  const embeddingModel = documentInventory[0]?.embedding_model || "Awaiting Backend Integration"
  const vectorDimensions = documentIndex?.dimensions || "Awaiting Backend Integration"
  
  const lastIndexDate = useMemo(() => {
    const dates = documentInventory
      .map(d => d.last_updated ? new Date(d.last_updated).getTime() : 0)
      .filter(t => t > 0);
    if (dates.length === 0) return "Awaiting Backend Integration";
    return new Date(Math.max(...dates)).toLocaleString([], {
      day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit"
    });
  }, [documentInventory])

  const filteredInventory = useMemo(() => {
    return documentInventory.filter(d => 
      d.filename.toLowerCase().includes(searchQuery.toLowerCase())
    )
  }, [documentInventory, searchQuery])

  const [expandedChunks, setExpandedChunks] = useState<Record<number, boolean>>({})
  
  const toggleChunk = (index: number) => {
    setExpandedChunks(prev => ({ ...prev, [index]: !prev[index] }))
  }

  // Effect to reset expanded chunks when changing active doc
  useEffect(() => {
    setExpandedChunks({})
  }, [active])

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col overflow-hidden p-4 sm:p-6 lg:p-8 bg-slate-50/30 gap-6">
      
      {/* Knowledge Overview (Top Section) */}
      <div className="bg-white/60 backdrop-blur-md border border-white/80 shadow-sm rounded-2xl p-5 flex flex-wrap gap-4 items-center justify-between shrink-0">
        <div>
          <h1 className="text-lg font-bold text-slate-800 tracking-tight flex items-center gap-2">
            <Server className="h-5 w-5 text-blue-600" />
            Knowledge Overview
          </h1>
          <p className="text-xs font-medium text-slate-500 mt-1">Enterprise Platform Metadata & Telemetry</p>
        </div>
        
        <div className="flex flex-wrap gap-x-6 gap-y-3">
          <div className="flex flex-col">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Indexed Documents</span>
            <span className="text-sm font-semibold text-slate-700">{documentInventory.length}</span>
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Chunks</span>
            <span className="text-sm font-semibold text-slate-700">{totalChunks}</span>
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Embedding Model</span>
            <span className="text-sm font-semibold text-slate-700">{embeddingModel}</span>
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Vector Store Type</span>
            <span className="text-xs font-medium text-slate-500 italic mt-0.5">Awaiting Backend Integration</span>
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Vector Dimensions</span>
            <span className="text-sm font-semibold text-slate-700">{vectorDimensions}</span>
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Database Size</span>
            <span className="text-xs font-medium text-slate-500 italic mt-0.5">Awaiting Backend Integration</span>
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Last Index Operation</span>
            <span className="text-sm font-semibold text-slate-700">{lastIndexDate}</span>
          </div>
        </div>
      </div>

      <div className="flex h-full min-h-0 flex-1 gap-6">
        {/* Left Panel - Document List */}
        <div className="w-80 shrink-0 flex flex-col gap-3 min-h-0">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search indexed documents..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white/60 backdrop-blur-md border border-white/80 focus:border-blue-400 focus:ring-4 focus:ring-blue-100 shadow-sm rounded-xl pl-9 pr-4 py-2.5 text-sm font-medium text-slate-700 placeholder-slate-400 transition-all outline-none"
            />
          </div>
          
          <div className="flex-1 overflow-y-auto fluent-scrollbar bg-white/60 backdrop-blur-md border border-white/80 shadow-sm rounded-2xl p-2.5">
            {filteredInventory.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center p-4">
                <SearchX className="h-8 w-8 text-slate-300 mb-2" />
                <p className="text-sm font-medium text-slate-500">No documents found</p>
              </div>
            ) : (
              <ul className="flex flex-col gap-1.5">
                {filteredInventory.map((d) => {
                  const isActive = active === d.filename;
                  const docDate = d.last_updated 
                    ? new Date(d.last_updated).toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" })
                    : "Awaiting Backend Integration";
                    
                  return (
                    <li key={d.filename}>
                      <button
                        type="button"
                        onClick={() => setActive(d.filename)}
                        className={`w-full flex flex-col p-3 rounded-xl transition-all text-left ${
                          isActive
                            ? "bg-[#007FFF]/5 border border-[#007FFF]/30 shadow-sm"
                            : "bg-transparent border border-transparent hover:bg-white/60 hover:border-slate-200/50 hover:shadow-sm"
                        }`}
                      >
                        <div className="flex items-start gap-3 w-full">
                          <div className="mt-0.5 bg-white p-1.5 rounded-lg border border-slate-100 shadow-sm shrink-0">
                            {documentTypeIcon(d.filename)}
                          </div>
                          <div className="flex flex-col min-w-0 flex-1">
                            <span className={`text-xs truncate ${isActive ? "text-blue-900 font-bold" : "text-slate-700 font-semibold"}`}>
                              {d.filename}
                            </span>
                            <div className="flex items-center justify-between mt-1">
                              <span className="text-[10px] font-medium text-slate-500 truncate mr-2">
                                {d.type || d.file_type || "Awaiting Backend Integration"}
                              </span>
                              <span className="text-[10px] font-medium text-slate-400 flex items-center gap-1 shrink-0">
                                <Clock className="h-3 w-3" />
                                {docDate}
                              </span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex flex-wrap items-center gap-1.5 mt-3 pt-2 border-t border-slate-100/70">
                           <span className="inline-flex items-center gap-1 bg-slate-100 text-slate-600 text-[9px] font-bold uppercase tracking-wide px-2 py-0.5 rounded">
                              <Activity className="h-3 w-3 text-slate-400" />
                              Status: {d.indexation_state}
                           </span>
                           <span className="inline-flex items-center bg-blue-50/50 text-blue-700 border border-blue-200/50 text-[9px] font-bold uppercase tracking-wide px-2 py-0.5 rounded">
                              {d.chunks} Chunks
                           </span>
                           <span className="inline-flex items-center bg-slate-50 text-slate-500 border border-slate-200/50 text-[9px] font-medium uppercase tracking-wide px-2 py-0.5 rounded italic">
                              Format: Awaiting Backend Integration
                           </span>
                        </div>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>

        {/* Right Panel - Document Inspector */}
        <div className="flex-1 flex flex-col min-h-0 bg-white/60 backdrop-blur-md border border-white/80 shadow-sm rounded-2xl p-5">
          {!active ? (
            <div className="flex-1 flex flex-col items-center justify-center">
              <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-500 flex items-center justify-center mb-4 shadow-sm border border-blue-100/50">
                <Database className="h-6 w-6" strokeWidth={1.5} />
              </div>
              <h3 className="text-sm font-semibold text-slate-700 mb-1">Knowledge Statistics</h3>
              <p className="text-xs font-medium text-slate-500 mb-6 max-w-sm text-center">
                Select a document from the inventory to inspect its vectorized chunk rows and telemetry.
              </p>
              
              <div className="grid grid-cols-2 gap-4 w-full max-w-md">
                <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
                   <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Average Chunk Size</p>
                   <p className="text-xs font-medium text-slate-500 italic">Awaiting Backend Integration</p>
                </div>
                <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
                   <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Average Tokens/Chunk</p>
                   <p className="text-xs font-medium text-slate-500 italic">Awaiting Backend Integration</p>
                </div>
                <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
                   <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Largest Chunk</p>
                   <p className="text-xs font-medium text-slate-500 italic">Awaiting Backend Integration</p>
                </div>
                <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
                   <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Smallest Chunk</p>
                   <p className="text-xs font-medium text-slate-500 italic">Awaiting Backend Integration</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col h-full">
              <div className="mb-4 pb-4 border-b border-slate-200/60">
                <h2 className="text-lg font-bold text-slate-800 tracking-tight truncate flex items-center gap-2">
                  <Info className="h-5 w-5 text-blue-500" />
                  Document Inspector: {active}
                </h2>
                <p className="text-xs font-medium text-slate-500 mt-1">
                  RAG Chunk Inspector · Embedding Analysis
                </p>
              </div>
              <div className="flex-1 overflow-y-auto fluent-scrollbar flex flex-col gap-4 pr-2">
                {chunks.map((c) => {
                  const isExpanded = expandedChunks[c.chunk_index] || false;
                  
                  return (
                    <div key={c.chunk_index} className="bg-white/80 border border-slate-200/60 rounded-xl p-4 shadow-sm flex flex-col gap-3 transition-shadow hover:shadow-md">
                      {/* Header Row */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 items-center">
                        <div className="flex flex-col">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Chunk ID / Order</span>
                          <span className="text-xs font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200/60 w-fit mt-1">
                            CHUNK-{(c.chunk_index).toString().padStart(3, '0')}
                          </span>
                        </div>
                        <div className="flex flex-col">
                           <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Token Count</span>
                           <span className="text-xs font-semibold text-slate-700 mt-1">
                             {c.chars}
                           </span>
                        </div>
                        <div className="flex flex-col">
                           <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Chunk Size</span>
                           <span className="text-[10px] font-medium text-slate-500 italic mt-1">Awaiting Backend Integration</span>
                        </div>
                        <div className="flex flex-col">
                           <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Vector Format</span>
                           <span className="text-[10px] font-medium text-slate-500 italic mt-1">Awaiting Backend Integration</span>
                        </div>
                      </div>
                      
                      <div className="mt-1 pt-3 border-t border-slate-100/70">
                         <div className="flex items-center justify-between mb-2">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Embedding Status</span>
                            <span className="text-[10px] font-medium text-slate-500 italic">Awaiting Backend Integration</span>
                         </div>
                         
                         {/* Text Preview */}
                         <div className="relative group">
                            <div className={`text-xs text-slate-700 bg-slate-50/80 p-3.5 rounded-lg border border-slate-200/50 font-mono leading-relaxed whitespace-pre-wrap break-words transition-all ${isExpanded ? "" : "line-clamp-4 max-h-[6.5rem] overflow-hidden"}`}>
                              {c.preview}
                            </div>
                            <button
                               onClick={() => toggleChunk(c.chunk_index)}
                               className="w-full flex items-center justify-center gap-1 py-1.5 mt-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-md transition-colors text-[11px] font-semibold"
                            >
                               {isExpanded ? (
                                  <><ChevronUp className="h-3 w-3" /> Collapse Preview</>
                               ) : (
                                  <><ChevronDown className="h-3 w-3" /> Expand Full Chunk</>
                               )}
                            </button>
                         </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
