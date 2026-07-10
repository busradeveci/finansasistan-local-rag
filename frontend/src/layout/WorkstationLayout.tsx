import { Loader2, X } from "lucide-react"

import SidebarNav from "@/layout/SidebarNav"

import { useWorkstation } from "@/context/WorkstationContext"



export default function WorkstationLayout({ children }: { children: React.ReactNode }) {
  const { hasBackgroundActivity, uploadQueue, isGenerating, alerts, dismissAlert } = useWorkstation()
  const indexingCount = uploadQueue.filter((q) => q.status === "indexing").length
  return (
    <div className="flex h-screen flex-col bg-[#fcfcfc]">
      <header className="sticky top-0 z-20 shrink-0 px-3 pt-2">
        <div className="ws-header flex items-center justify-between px-3 py-2">
          <div>
            <h1 className="text-section-title text-warm">
              Global Banking Intelligence Workstation
            </h1>
            <p className="mt-0.5 text-caption text-stone-light">
              Secure Inference &amp; Orchestration Hub
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-sm border border-stone-light/40 bg-warm/10 px-2.5 py-1 text-badge text-warm">
              <span className="h-1.5 w-1.5 rounded-sm bg-stone-light" />
              Active runtime
            </span>
            {hasBackgroundActivity && (
              <span className="inline-flex items-center gap-1.5 rounded-sm border border-stone-light/40 bg-warm/10 px-2.5 py-1 text-badge text-stone-light">
                <Loader2 className="h-3 w-3 animate-spin" />
                {isGenerating && indexingCount > 0
                  ? `Streaming · ${indexingCount} upload${indexingCount > 1 ? "s" : ""}`
                  : isGenerating
                    ? "Streaming response…"
                    : `${indexingCount} upload${indexingCount > 1 ? "s" : ""} in progress`}
              </span>
            )}
            <span className="inline-flex items-center rounded-sm border border-stone-light/40 bg-warm/10 px-2.5 py-1 text-badge text-stone-light">
              Online · Offline Mode
            </span>
          </div>
        </div>
      </header>
      {alerts.length > 0 && (
        <div className="shrink-0 space-y-1 px-3 py-1">
          {alerts.map((alert) => (
            <div
              key={alert.id}
              className="flex items-center gap-2 rounded-sm border border-glass ws-glass-elevated px-2.5 py-1.5 text-caption"
              style={{
                color: alert.level === "error" ? "var(--ws-danger)" : alert.level === "warning" ? "var(--ws-warning)" : "var(--ws-primary)",
              }}
            >
              <span className="flex-1">{alert.message}</span>
              <button
                type="button"
                onClick={() => dismissAlert(alert.id)}
                className="ws-toolbar-btn p-0.5"
                aria-label="Dismiss"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      )}
      <div className="flex flex-1 min-h-0 gap-2 px-3 pb-3 pt-1 overflow-hidden">
        <aside
          className="fluent-scrollbar shrink-0 overflow-y-auto rounded-sm border border-[#4f4e4d]/30 bg-[#1b1a1f]"
          style={{ width: "var(--ws-sidebar-width)" }}
        >
          <SidebarNav />
        </aside>
        <main className="flex min-w-0 flex-1 flex-col overflow-hidden rounded-sm bg-[#fcfcfc]">
          {children}
        </main>
      </div>
    </div>
  )
}
