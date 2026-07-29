import { Search, ChevronRight, WifiOff, ShieldCheck, Bell, HelpCircle, Loader2, X } from "lucide-react"
import { useWorkstation } from "@/context/WorkstationContext"

type HeaderProps = {
  breadcrumb: string[]
}

const HYPER_GLASS = "ws-hyper-glass"

export function Header({ breadcrumb }: HeaderProps) {
  const { hasBackgroundActivity, uploadQueue, isGenerating, alerts, dismissAlert } = useWorkstation()
  const indexingCount = uploadQueue.filter((q) => q.status === "indexing").length

  return (
    <>
      <header className="ws-header sticky top-0 z-20 flex h-12 shrink-0 items-center gap-3 px-3 md:px-4">
        <nav aria-label="Breadcrumb" className="hidden md:block">
          <ol className="flex items-center gap-1.5 text-sm">
            <li className="text-slate-400">VAULTMIND</li>
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
            placeholder="Search documents, chunks, or queries…"
            aria-label="Search"
            readOnly
            className={`h-8 w-full pl-8 pr-3 text-[13px] text-slate-800 placeholder:text-slate-500 focus:outline-none ${HYPER_GLASS}`}
          />
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
            Secured
          </span>
        </div>

        <div className="flex items-center gap-0.5">
          <button
            type="button"
            aria-label="Help"
            className={`flex h-8 w-8 items-center justify-center text-slate-500 hover:text-slate-700 ${HYPER_GLASS} !rounded-2xl`}
          >
            <HelpCircle className="h-4 w-4" />
          </button>
          <button
            type="button"
            aria-label="Notifications"
            className={`relative flex h-8 w-8 items-center justify-center text-slate-500 hover:text-slate-700 ${HYPER_GLASS} !rounded-2xl`}
          >
            <Bell className="h-4 w-4" />
            {alerts.length > 0 && (
              <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-slate-800" />
            )}
          </button>
          <div className="ml-1 flex h-7 w-7 items-center justify-center rounded-xl bg-slate-900 text-[11px] font-semibold text-white shadow-[0_4px_16px_0_rgba(15,23,42,0.15)]">
            OP
          </div>
        </div>
      </header>

      {alerts.length > 0 && (
        <div className="shrink-0 space-y-1 border-b border-white/40 px-3 py-1.5">
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
    </>
  )
}
