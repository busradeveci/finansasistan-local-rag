import { Loader2, X } from "lucide-react"

import SidebarNav from "@/layout/SidebarNav"

import { useWorkstation } from "@/context/WorkstationContext"



export default function WorkstationLayout({ children }: { children: React.ReactNode }) {
  const { hasBackgroundActivity, uploadQueue, isGenerating, alerts, dismissAlert } = useWorkstation()
  const indexingCount = uploadQueue.filter((q) => q.status === "indexing").length
  return (
    <div className="flex h-screen flex-col bg-[var(--ws-canvas)]">
      <header className="sticky top-0 z-20 shrink-0 px-6 pt-4">
        <div className="ws-panel flex items-center justify-between px-5 py-3.5 rounded-[30px]">
          <div>
            <h1 className="font-heading text-[15px] font-semibold text-navy-900">Foundry Local — Enterprise AI Workstation</h1>
            <p className="mt-0.5 text-[11px] text-navy-300">Enterprise reporting shell</p>
          </div>
          <div className="flex items-center gap-2.5">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-teal-500/25 bg-teal-50 px-2.5 py-1 text-[11px] font-semibold text-teal-700">
              <span className="h-1.5 w-1.5 rounded-full bg-teal-500" />
              Active runtime
            </span>
            {hasBackgroundActivity && (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-teal-500/25 bg-teal-50 px-2.5 py-1 text-[11px] font-medium text-teal-700">
                <Loader2 className="h-3 w-3 animate-spin" />
                {isGenerating && indexingCount > 0
                  ? `Streaming · ${indexingCount} upload${indexingCount > 1 ? "s" : ""}`
                  : isGenerating
                    ? "Streaming response…"
                    : `${indexingCount} upload${indexingCount > 1 ? "s" : ""} in progress`}
              </span>
            )}
            <span className="inline-flex items-center rounded-full border border-navy-100 bg-white px-2.5 py-1 text-[11px] font-medium text-navy-500">
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
          className="fluent-scrollbar shrink-0 overflow-y-auto rounded-2xl border border-darkTeal-800 bg-darkTeal-900 shadow-sm"
          style={{ width: "var(--ws-sidebar-width)" }}
        >
          <SidebarNav />
        </aside>
        <main className="flex min-w-0 flex-1 flex-col overflow-hidden rounded-[30px] border border-slate-200/80 bg-white shadow-sm">
          {children}
        </main>
      </div>
    </div>
  )
}
