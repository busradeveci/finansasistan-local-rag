import { useState, useEffect, useRef } from "react"
import { 
  Search, ChevronRight, WifiOff, ShieldCheck, Bell, HelpCircle, 
  Loader2, X, Command, FileText, Database, Shield, Activity, 
  Settings, User, Monitor, LogOut
} from "lucide-react"
import { useWorkstation } from "@/context/WorkstationContext"

type HeaderProps = {
  breadcrumb: string[]
}

const HYPER_GLASS =
  "bg-white/30 backdrop-blur-md border border-white/60 shadow-[0_4px_12px_rgba(0,0,0,0.05),inset_0_1px_1px_rgba(255,255,255,0.9)] rounded-full hover:bg-white/40 transition-all duration-300"

const MOCK_NOTIFICATIONS = [
  { id: 1, type: "success", title: "Document Indexed", message: "Q3_Financial_Report.pdf processed into 2 chunks (2m ago).", iconNode: "🟢" },
  { id: 2, type: "warning", title: "Security Alert", message: "Global PII Redaction masked 1 sensitivity pattern (12m ago).", iconNode: "🛡️" },
  { id: 3, type: "info", title: "Air-Gap Verified", message: "Local node inference engine running 100% offline (1h ago).", iconNode: "⚡" },
]

export function Header({ breadcrumb }: HeaderProps) {
  const { hasBackgroundActivity, uploadQueue, isGenerating, alerts, dismissAlert } = useWorkstation()
  const indexingCount = uploadQueue.filter((q) => q.status === "indexing").length

  const [activeModal, setActiveModal] = useState<"command" | "notifications" | "help" | "profile" | "profile_details" | "security_audit" | "workspace_prefs" | null>(null)
  const [notifications, setNotifications] = useState(MOCK_NOTIFICATIONS)
  const [user, setUser] = useState<{email: string, displayName: string, initials: string, role: string} | null>(null)
  const [auditLogs, setAuditLogs] = useState<any[]>([])
  const headerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const storedUser = localStorage.getItem('vectorvault_user');
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (e) {}
    }
    
    const auditLogs = JSON.parse(localStorage.getItem('vectorvault_audit_logs') || '[]');
    if (auditLogs.length > 0) {
      const authLogs = auditLogs.filter((log: any) => log.event.includes('[AUTH]'));
      if (authLogs.length > 0) {
        const lastAuth = authLogs[authLogs.length - 1];
        setNotifications(prev => [
            { id: Date.now(), type: "info", title: "Authentication", message: lastAuth.event, iconNode: "🔑" },
            ...prev
        ]);
      }
    }
  }, [])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault()
        setActiveModal((prev) => (prev === "command" ? null : "command"))
      }
      if (e.key === "Escape") {
        setActiveModal(null)
      }
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [])

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (activeModal === "command") return
      if (headerRef.current && !headerRef.current.contains(e.target as Node)) {
        setActiveModal(null)
      }
    }
    if (activeModal) {
      window.addEventListener("mousedown", handleClickOutside)
    }
    if (activeModal === "security_audit") {
      fetch('http://127.0.0.1:8000/api/v1/security/logs')
        .then(res => res.json())
        .then(data => setAuditLogs(data))
        .catch(err => {
           console.warn("Failed to fetch security logs, falling back to local storage");
           setAuditLogs(JSON.parse(localStorage.getItem('vectorvault_audit_logs') || '[]').reverse());
        });
    }
    return () => window.removeEventListener("mousedown", handleClickOutside)
  }, [activeModal])

  return (
    <>
      <header ref={headerRef} className="ws-header sticky top-0 z-20 flex h-12 shrink-0 items-center gap-3 px-3 md:px-4">
        <nav aria-label="Breadcrumb" className="hidden md:block">
          <ol className="flex items-center gap-1.5 text-sm">
            <li className="text-slate-400">VectorVault</li>
            {breadcrumb.map((crumb, i) => {
              const last = i === breadcrumb.length - 1
              return (
                <li key={`${crumb}-${i}`} className="flex items-center gap-1.5">
                  <ChevronRight className="h-3.5 w-3.5 text-slate-300" aria-hidden="true" />
                  <span className={last ? "font-semibold text-slate-800" : "text-slate-400"}>{crumb}</span>
                </li>
              )
            })}
          </ol>
        </nav>

        <div className="relative ml-auto w-full max-w-sm">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
          <input
            type="search"
            placeholder="Search knowledge, documents or evidence..."
            aria-label="Search"
            readOnly
            onClick={() => setActiveModal("command")}
            className={`h-8 w-full pl-8 pr-12 cursor-text text-[13px] text-slate-800 placeholder:text-slate-500 focus:outline-none ${HYPER_GLASS}`}
          />
          <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1 bg-white/50 border border-white/60 px-1.5 py-0.5 rounded text-[10px] font-medium text-slate-500 shadow-sm pointer-events-none">
             <Command className="h-3 w-3" /> K
          </div>
        </div>

        <div className="hidden items-center gap-2 xl:flex">
          {hasBackgroundActivity && (
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold text-slate-800 ${HYPER_GLASS}`}>
              <Loader2 className="h-3.5 w-3.5 animate-spin text-orange-600" />
              {isGenerating && indexingCount > 0
                ? `Streaming · ${indexingCount} upload${indexingCount > 1 ? "s" : ""}`
                : isGenerating
                  ? "Streaming…"
                  : `${indexingCount} indexing`}
            </span>
          )}
          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold text-orange-700 ${HYPER_GLASS}`}>
            <WifiOff className="h-3.5 w-3.5" />
            100% Offline
          </span>
          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold text-slate-800 ${HYPER_GLASS}`}>
            <ShieldCheck className="h-3.5 w-3.5" />
            Verified
          </span>
        </div>

        <div className="flex items-center gap-1.5 relative">
          
          {/* Help & Documentation Dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setActiveModal(activeModal === "help" ? null : "help")}
              aria-label="Help"
              className={`flex h-8 w-8 items-center justify-center text-slate-500 hover:text-slate-700 ${HYPER_GLASS} !rounded-2xl ${activeModal === "help" ? "bg-white/60" : ""}`}
            >
              <HelpCircle className="h-4 w-4" />
            </button>
            {activeModal === "help" && (
              <div className="absolute right-0 top-full mt-2 w-80 rounded-2xl border border-white/80 bg-white/90 p-3 shadow-2xl backdrop-blur-xl z-50">
                 <div className="mb-2 px-2 pb-2 border-b border-white/50">
                   <h3 className="text-sm font-semibold text-slate-800">Help & Resources</h3>
                 </div>
                 <div className="space-y-4 px-1 py-1">
                   <div>
                     <h4 className="text-xs font-semibold text-slate-500 mb-2 uppercase tracking-wider">Keyboard Shortcuts</h4>
                     <ul className="space-y-1.5">
                       <li className="flex items-center justify-between text-[13px] text-slate-700">
                         <span>Command Palette</span>
                         <span className="flex items-center gap-1 rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-500 border border-slate-200">
                           <Command className="h-3 w-3" /> K
                         </span>
                       </li>
                       <li className="flex items-center justify-between text-[13px] text-slate-700">
                         <span>Multi-line chat</span>
                         <span className="flex items-center gap-1 rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-500 border border-slate-200">
                           Shift + Enter
                         </span>
                       </li>
                       <li className="flex items-center justify-between text-[13px] text-slate-700">
                         <span>Close modals</span>
                         <span className="flex items-center gap-1 rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-500 border border-slate-200">
                           Esc
                         </span>
                       </li>
                     </ul>
                   </div>
                   
                   <div>
                     <h4 className="text-xs font-semibold text-slate-500 mb-2 uppercase tracking-wider">Documentation</h4>
                     <ul className="space-y-1">
                       <li><a href="#" className="text-[13px] text-blue-600 hover:underline">Enterprise RAG Architecture</a></li>
                       <li><a href="#" className="text-[13px] text-blue-600 hover:underline">Air-Gap Protocol</a></li>
                       <li><a href="#" className="text-[13px] text-blue-600 hover:underline">Local Vector Store</a></li>
                     </ul>
                   </div>

                   <div>
                     <h4 className="text-xs font-semibold text-slate-500 mb-2 uppercase tracking-wider">AI Security & Privacy</h4>
                     <ul className="space-y-1">
                       <li className="flex items-center gap-2 text-[13px] text-slate-700"><Shield className="h-3.5 w-3.5 text-emerald-600" /> Zero Outbound Egress</li>
                       <li className="flex items-center gap-2 text-[13px] text-slate-700"><Shield className="h-3.5 w-3.5 text-emerald-600" /> PII Rules</li>
                       <li className="flex items-center gap-2 text-[13px] text-slate-700"><Shield className="h-3.5 w-3.5 text-emerald-600" /> Prompt Injection Guard</li>
                     </ul>
                   </div>

                   <div className="pt-2 border-t border-white/50">
                     <p className="text-xs text-slate-500 flex items-center justify-between">
                       <span>v1.0.0 (Local Enterprise Build)</span>
                       <span className="flex items-center gap-1 text-emerald-600 font-medium">Operational <span className="h-2 w-2 rounded-full bg-emerald-500 inline-block animate-pulse"></span></span>
                     </p>
                   </div>
                 </div>
              </div>
            )}
          </div>

          {/* Notifications Dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setActiveModal(activeModal === "notifications" ? null : "notifications")}
              aria-label="Notifications"
              className={`relative flex h-8 w-8 items-center justify-center text-slate-500 hover:text-slate-700 ${HYPER_GLASS} !rounded-2xl ${activeModal === "notifications" ? "bg-white/60" : ""}`}
            >
              <Bell className="h-4 w-4" />
              {notifications.length > 0 && (
                <span className="absolute -right-0.5 -top-0.5 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-red-500 text-[8px] font-bold text-white shadow-sm ring-2 ring-white">
                  {notifications.length}
                </span>
              )}
            </button>
            {activeModal === "notifications" && (
              <div className="absolute right-0 top-full mt-2 w-80 rounded-2xl border border-white/80 bg-white/90 p-3 shadow-2xl backdrop-blur-xl z-50">
                 <div className="flex items-center justify-between mb-3 px-1">
                   <h3 className="text-sm font-semibold text-slate-800">Notifications</h3>
                   {notifications.length > 0 && (
                     <button onClick={() => setNotifications([])} className="text-[11px] font-medium text-blue-600 hover:text-blue-700">Mark all as read</button>
                   )}
                 </div>
                 {notifications.length === 0 ? (
                   <div className="py-6 text-center text-slate-500">
                     <Bell className="mx-auto h-8 w-8 opacity-20 mb-2" />
                     <p className="text-[13px] font-medium">All caught up!</p>
                     <p className="text-[11px]">No new notifications.</p>
                   </div>
                 ) : (
                   <div className="space-y-1">
                     {notifications.map(n => (
                       <div key={n.id} className="flex gap-3 rounded-xl p-2 hover:bg-white/60 transition-colors cursor-pointer">
                         <div className="text-base mt-0.5 shrink-0">
                           {n.iconNode}
                         </div>
                         <div>
                           <p className="text-[13px] font-medium text-slate-800">
                             {n.title}
                           </p>
                           <p className="text-xs text-slate-500 line-clamp-2 mt-0.5 leading-snug">{n.message}</p>
                         </div>
                       </div>
                     ))}
                   </div>
                 )}
              </div>
            )}
          </div>

          {/* Profile Dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setActiveModal(activeModal === "profile" ? null : "profile")}
              className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-slate-800 to-slate-900 text-[11px] font-semibold text-white shadow-[0_4px_16px_0_rgba(15,23,42,0.15)] ring-1 ring-white/20 transition-transform hover:scale-105 active:scale-95"
            >
              {user?.initials || "BD"}
            </button>
            {activeModal === "profile" && (
              <div className="absolute right-0 top-full mt-2 w-72 rounded-2xl border border-white/80 bg-white/90 p-2 shadow-2xl backdrop-blur-xl z-50">
                <div className="p-2 border-b border-slate-200/50 mb-1">
                  <p className="text-sm font-semibold text-slate-800">{user?.displayName || "Büşra Deveci"}</p>
                  <p className="text-[11px] text-slate-500 font-medium mt-0.5">{user?.role || "Lead Systems Architect / Enterprise Security Operator"}</p>
                  <p className="text-[11px] text-slate-400 mt-1 truncate">{user?.email || "busra.deveci@vectorvault.local"}</p>
                </div>
                <div className="space-y-0.5">
                  <button onClick={() => setActiveModal("profile_details")} className="w-full flex items-center gap-2.5 rounded-xl px-2.5 py-2 text-[13px] font-medium text-slate-700 hover:bg-white/60 hover:text-slate-900 transition-colors">
                    <User className="h-4 w-4 text-slate-400" /> Profile & Credentials
                  </button>
                  <button onClick={() => setActiveModal("workspace_prefs")} className="w-full flex items-center gap-2.5 rounded-xl px-2.5 py-2 text-[13px] font-medium text-slate-700 hover:bg-white/60 hover:text-slate-900 transition-colors">
                    <Settings className="h-4 w-4 text-slate-400" /> Workspace Preferences
                  </button>
                  <button onClick={() => setActiveModal("security_audit")} className="w-full flex items-center gap-2.5 rounded-xl px-2.5 py-2 text-[13px] font-medium text-slate-700 hover:bg-white/60 hover:text-slate-900 transition-colors">
                    <Shield className="h-4 w-4 text-slate-400" /> Security Audit & Access Keys
                  </button>
                  <div className="h-px bg-slate-200/50 my-1 mx-2" />
                  <button className="w-full flex items-center gap-2.5 rounded-xl px-2.5 py-2 text-[13px] font-medium text-slate-700 hover:bg-white/60 hover:text-slate-900 transition-colors">
                    <Monitor className="h-4 w-4 text-slate-400" /> Appearance
                  </button>
                  <button className="w-full flex items-center gap-2.5 rounded-xl px-2.5 py-2 text-[13px] font-medium text-red-600 hover:bg-red-50 hover:text-red-700 transition-colors" onClick={() => { localStorage.removeItem('vectorvault_user'); window.location.href = "/"; }}>
                    <LogOut className="h-4 w-4 text-red-500" /> Sign Out
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Command Palette Modal */}
      {activeModal === "command" && (
        <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh] px-4">
          <div className="absolute inset-0 bg-slate-900/20 backdrop-blur-sm transition-opacity" onClick={() => setActiveModal(null)} />
          <div className="relative w-full max-w-2xl overflow-hidden rounded-2xl border border-white/80 bg-white/90 shadow-2xl backdrop-blur-xl animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center border-b border-slate-200/50 px-4 py-3">
              <Search className="h-5 w-5 text-slate-400" />
              <input
                type="text"
                autoFocus
                placeholder="Search commands, documents, or navigation..."
                className="flex-1 bg-transparent px-3 py-1 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none"
              />
              <span className="flex items-center gap-1 rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-500 border border-slate-200">
                Esc
              </span>
            </div>
            
            <div className="max-h-[60vh] overflow-y-auto p-2 scrollbar-none">
              <div className="mb-4">
                <h4 className="px-2 pb-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">Quick Navigation</h4>
                <div className="space-y-0.5">
                  {['Workstation', 'Knowledge Hub', 'Documents', 'Security Center', 'System Telemetry'].map((item, i) => (
                    <button key={item} className="w-full flex items-center justify-between rounded-xl px-3 py-2 text-sm text-slate-700 hover:bg-slate-100/80 transition-colors">
                      <span className="flex items-center gap-2.5">
                         {i === 0 && <Monitor className="h-4 w-4 text-slate-400" />}
                         {i === 1 && <Database className="h-4 w-4 text-slate-400" />}
                         {i === 2 && <FileText className="h-4 w-4 text-slate-400" />}
                         {i === 3 && <Shield className="h-4 w-4 text-slate-400" />}
                         {i === 4 && <Activity className="h-4 w-4 text-slate-400" />}
                         {item}
                      </span>
                      <ChevronRight className="h-4 w-4 text-slate-300" />
                    </button>
                  ))}
                </div>
              </div>
              
              <div className="mb-4">
                <h4 className="px-2 pb-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">Document Shortcuts</h4>
                <div className="space-y-0.5">
                  <button className="w-full flex items-center rounded-xl px-3 py-2 text-sm text-slate-700 hover:bg-slate-100/80 transition-colors">
                    <span className="flex items-center gap-2.5">
                      <FileText className="h-4 w-4 text-blue-500" /> Q3_Financial_Report.pdf
                    </span>
                  </button>
                  <button className="w-full flex items-center rounded-xl px-3 py-2 text-sm text-slate-700 hover:bg-slate-100/80 transition-colors">
                    <span className="flex items-center gap-2.5">
                      <FileText className="h-4 w-4 text-blue-500" /> Security_Audit_2026.docx
                    </span>
                  </button>
                </div>
              </div>
              
              <div>
                <h4 className="px-2 pb-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">Actions</h4>
                <div className="space-y-0.5">
                  <button className="w-full flex items-center rounded-xl px-3 py-2 text-sm text-slate-700 hover:bg-slate-100/80 transition-colors">
                    <span className="flex items-center gap-2.5">
                      <ShieldCheck className="h-4 w-4 text-emerald-500" /> Trigger Security Audit
                    </span>
                  </button>
                  <button className="w-full flex items-center rounded-xl px-3 py-2 text-sm text-slate-700 hover:bg-slate-100/80 transition-colors">
                    <span className="flex items-center gap-2.5">
                      <Activity className="h-4 w-4 text-orange-500" /> Export Logs
                    </span>
                  </button>
                  <button className="w-full flex items-center rounded-xl px-3 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors">
                    <span className="flex items-center gap-2.5">
                      <X className="h-4 w-4 text-red-500" /> Clear Cache
                    </span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {alerts.length > 0 && (
        <div className="shrink-0 space-y-1 border-b border-transparent px-3 py-1.5 relative z-10">
          {alerts.map((alert) => (
            <div
              key={alert.id}
              className={`flex items-center gap-2 px-3 py-2 text-xs ${HYPER_GLASS} !rounded-2xl`}
              style={{
                color:
                  alert.level === "error"
                    ? "var(--ws-danger)"
                    : alert.level === "warning"
                      ? "var(--ws-warning)"
                      : "var(--ws-primary)",
              }}
            >
              <span className="flex-1">{alert.message}</span>
              <button
                type="button"
                onClick={() => dismissAlert(alert.id)}
                className="rounded-lg p-0.5 text-slate-400 transition-colors hover:text-slate-700"
                aria-label="Dismiss"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Profile Details Modal */}
      {activeModal === "profile_details" && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/20 backdrop-blur-sm transition-opacity" onClick={() => setActiveModal(null)} />
          <div className="relative w-full max-w-lg overflow-hidden rounded-2xl border border-white/80 bg-white/80 p-6 shadow-2xl backdrop-blur-xl animate-in fade-in zoom-in-95 duration-200">
             <div className="flex justify-between items-center mb-4">
                <h3 className="text-sm font-semibold text-slate-800 flex items-center gap-2"><User className="h-4 w-4 text-blue-500" /> Profile & Credentials</h3>
                <button onClick={() => setActiveModal(null)} className="text-slate-400 hover:text-slate-700"><X className="h-4 w-4" /></button>
             </div>
             <div className="space-y-3 text-xs text-slate-700">
                <div className="flex justify-between border-b border-slate-200/50 pb-2">
                    <span className="font-semibold text-slate-500">Operator Name</span>
                    <span>{user?.displayName || "Büşra Deveci"}</span>
                </div>
                <div className="flex justify-between border-b border-slate-200/50 pb-2">
                    <span className="font-semibold text-slate-500">Corporate Email</span>
                    <span>{user?.email || "busra.deveci@vectorvault.local"}</span>
                </div>
                <div className="flex justify-between border-b border-slate-200/50 pb-2">
                    <span className="font-semibold text-slate-500">Active Role</span>
                    <span>{user?.role || "Lead Systems Architect"}</span>
                </div>
                <div className="flex justify-between border-b border-slate-200/50 pb-2">
                    <span className="font-semibold text-slate-500">Security Tier</span>
                    <span className="text-emerald-600 font-semibold">Air-Gap Level 4</span>
                </div>
                <div className="flex justify-between pt-1">
                    <span className="font-semibold text-slate-500">Cryptographic Keys</span>
                    <span className="font-mono bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">RSA-4096 (Active)</span>
                </div>
             </div>
          </div>
        </div>
      )}

      {/* Security Audit Modal */}
      {activeModal === "security_audit" && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/20 backdrop-blur-sm transition-opacity" onClick={() => setActiveModal(null)} />
          <div className="relative w-full max-w-lg overflow-hidden rounded-2xl border border-white/80 bg-white/80 p-6 shadow-2xl backdrop-blur-xl animate-in fade-in zoom-in-95 duration-200">
             <div className="flex justify-between items-center mb-4">
                <h3 className="text-sm font-semibold text-slate-800 flex items-center gap-2"><Shield className="h-4 w-4 text-emerald-500" /> Security Audit & Access Keys</h3>
                <button onClick={() => setActiveModal(null)} className="text-slate-400 hover:text-slate-700"><X className="h-4 w-4" /></button>
             </div>
             <div className="space-y-4">
                <div>
                   <h4 className="text-xs font-semibold text-slate-500 mb-2 uppercase tracking-wider">Active API Tokens</h4>
                   <div className="bg-slate-50 border border-slate-200/60 rounded-xl p-3 flex justify-between items-center text-xs">
                       <span className="font-mono text-slate-600">vv_local_9f8a...3b21</span>
                       <span className="text-emerald-600 font-semibold flex items-center gap-1"><div className="h-1.5 w-1.5 rounded-full bg-emerald-500"></div> Valid</span>
                   </div>
                </div>
                <div>
                   <h4 className="text-xs font-semibold text-slate-500 mb-2 uppercase tracking-wider">Recent Security Events</h4>
                   <div className="space-y-2 max-h-[200px] overflow-y-auto pr-2">
                       {auditLogs.slice(0, 5).map((log: any, idx: number) => (
                           <div key={idx} className="text-[11px] flex justify-between items-center border-b border-slate-200/50 pb-2 gap-4">
                               <span className="text-slate-500 shrink-0">{new Date(log.timestamp).toLocaleTimeString()}</span>
                               <span className="font-medium text-slate-700 truncate flex-1">{log.event || log.event_type + ' ' + log.message_details}</span>
                               <span className={log.status === 'SUCCESS' || log.outcome === 'SUCCESS' ? 'text-emerald-600 font-medium' : 'text-red-500 font-medium'}>{log.status || log.outcome}</span>
                           </div>
                       ))}
                   </div>
                </div>
                <div className="flex justify-between items-center text-[11px] text-slate-500 pt-2 border-t border-slate-200/50">
                   <span>Session Expiration: 12h 00m</span>
                   <button className="text-red-600 hover:underline">Revoke All Tokens</button>
                </div>
             </div>
          </div>
        </div>
      )}

      {/* Workspace Preferences Modal */}
      {activeModal === "workspace_prefs" && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/20 backdrop-blur-sm transition-opacity" onClick={() => setActiveModal(null)} />
          <div className="relative w-full max-w-lg overflow-hidden rounded-2xl border border-white/80 bg-white/80 p-6 shadow-2xl backdrop-blur-xl animate-in fade-in zoom-in-95 duration-200">
             <div className="flex justify-between items-center mb-4">
                <h3 className="text-sm font-semibold text-slate-800 flex items-center gap-2"><Settings className="h-4 w-4 text-slate-500" /> Workspace Preferences</h3>
                <button onClick={() => setActiveModal(null)} className="text-slate-400 hover:text-slate-700"><X className="h-4 w-4" /></button>
             </div>
             <div className="space-y-4 text-xs text-slate-700">
                <div className="flex justify-between items-center">
                    <span className="font-semibold text-slate-500">Enterprise Density</span>
                    <select className="bg-white border border-slate-200 rounded px-2 py-1 outline-none text-slate-700">
                        <option>High (Compact)</option>
                        <option>Standard</option>
                        <option>Spacious</option>
                    </select>
                </div>
                <div className="flex justify-between items-center">
                    <span className="font-semibold text-slate-500">Theme</span>
                    <select className="bg-white border border-slate-200 rounded px-2 py-1 outline-none text-slate-700">
                        <option>VectorVault Glass (Default)</option>
                        <option>Dark Mode</option>
                        <option>High Contrast</option>
                    </select>
                </div>
                <div className="flex justify-between items-center">
                    <span className="font-semibold text-slate-500">Telemetry Data</span>
                    <label className="flex items-center gap-2 cursor-pointer">
                       <input type="checkbox" defaultChecked className="accent-blue-600" />
                       <span>Enable Local Analytics</span>
                    </label>
                </div>
             </div>
          </div>
        </div>
      )}
    </>
  )
}