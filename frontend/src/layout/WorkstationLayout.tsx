import { Loader2, X } from "lucide-react"

import SidebarNav from "@/layout/SidebarNav"

import { useWorkstation } from "@/context/WorkstationContext"



export default function WorkstationLayout({ children }: { children: React.ReactNode }) {
  const { hasBackgroundActivity, uploadQueue, isGenerating, alerts, dismissAlert } = useWorkstation()
  const indexingCount = uploadQueue.filter((q) => q.status === "indexing").length
  return (
    <div className="flex h-screen flex-col bg-[linear-gradient(135deg,#F7FAFD_0%,#EEF3F8_100%)]">
      <header className="sticky top-0 z-20 shrink-0 px-6 pt-4">
        <div className="ws-panel flex items-center justify-between px-5 py-3.5 backdrop-blur-xl">
          <div>
            <h1 className="text-[15px] font-semibold text-[#162235]">Foundry Local — Enterprise AI Workstation</h1>
            <p className="mt-0.5 text-[11px] text-[#2D3B50]">Fluent 2 premium shell</p>
          </div>
          <div className="flex items-center gap-2.5">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              Active runtime
            </span>
            {hasBackgroundActivity && (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-[rgba(15,108,189,0.25)] bg-[#0078D4]/10 px-2.5 py-1 text-[11px] font-medium text-[#0F6CBD]">
                <Loader2 className="h-3 w-3 animate-spin" />
                {isGenerating && indexingCount > 0
                  ? `Streaming · ${indexingCount} upload${indexingCount > 1 ? "s" : ""}`
                  : isGenerating
                    ? "Streaming response…"
                    : `${indexingCount} upload${indexingCount > 1 ? "s" : ""} in progress`}
              </span>
            )}
            <span className="inline-flex items-center rounded-full border border-[rgba(15,108,189,0.2)] bg-white px-2.5 py-1 text-[11px] font-medium text-[#0F6CBD]">
              Online · Offline Mode
            </span>
          </div>
        </div>
      </header>
      {alerts.length > 0 && (
        <div className="shrink-0 space-y-1.5 px-6 py-2">
          {alerts.map((alert) => (
            <div
              key={alert.id}
              className="flex items-center gap-2 rounded-xl border px-3 py-2 text-[11px]"
              style={{
                color: alert.level === "error" ? "var(--ws-danger)" : alert.level === "warning" ? "var(--ws-warning)" : "var(--ws-primary)",
                borderColor: alert.level === "error" ? "rgba(209,52,56,0.25)" : alert.level === "warning" ? "rgba(255,185,0,0.35)" : "rgba(0,120,212,0.25)",
                background: alert.level === "error" ? "rgba(209,52,56,0.06)" : alert.level === "warning" ? "rgba(255,185,0,0.08)" : "rgba(0,120,212,0.06)",
              }}
            >
              <span className="flex-1">{alert.message}</span>
              <button
                type="button"
                onClick={() => dismissAlert(alert.id)}
                className="p-0.5 rounded hover:opacity-70"
                aria-label="Dismiss"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      )}
      <div className="flex flex-1 min-h-0 gap-4 px-6 pb-6 pt-2">
        <aside
          className="fluent-scrollbar shrink-0 overflow-y-auto rounded-2xl border border-[rgba(255,255,255,0.14)] bg-[#162235]/95 shadow-sm backdrop-blur-md"
          style={{ width: "var(--ws-sidebar-width)" }}
        >
          <SidebarNav />
        </aside>
        <main className="flex min-w-0 flex-1 flex-col overflow-hidden rounded-2xl border border-[rgba(15,35,60,0.08)] bg-white/88 shadow-sm backdrop-blur-[2px]">
          {children}
        </main>
      </div>
    </div>
  )
}
