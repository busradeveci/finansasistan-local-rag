import { Search, ChevronRight, WifiOff, ShieldCheck, Bell, HelpCircle, Loader2, X } from "lucide-react"
import { useWorkstation } from "@/context/WorkstationContext"

type HeaderProps = {
  breadcrumb: string[]
}

export function Header({ breadcrumb }: HeaderProps) {
  const { hasBackgroundActivity, uploadQueue, isGenerating, alerts, dismissAlert } = useWorkstation()
  const indexingCount = uploadQueue.filter((q) => q.status === "indexing").length

  return (
    <>
      <header className="sticky top-0 z-20 flex h-12 shrink-0 items-center gap-3 border-b border-stone-200 bg-white/95 px-3 backdrop-blur md:px-4">
        <nav aria-label="Breadcrumb" className="hidden md:block">
          <ol className="flex items-center gap-1.5 text-sm">
            <li className="text-stone-400">Foundry Local</li>
            {breadcrumb.map((crumb, i) => {
              const last = i === breadcrumb.length - 1
              return (
                <li key={`${crumb}-${i}`} className="flex items-center gap-1.5">
                  <ChevronRight className="h-3.5 w-3.5 text-stone-300" aria-hidden="true" />
                  <span className={last ? "font-semibold text-stone-800" : "text-stone-400"}>{crumb}</span>
                </li>
              )
            })}
          </ol>
        </nav>

        <div className="relative ml-auto w-full max-w-sm">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-stone-400" />
          <input
            type="search"
            placeholder="Search documents, chunks, or queries…"
            aria-label="Search"
            readOnly
            className="h-8 w-full rounded-sm border border-stone-200 bg-stone-50 pl-8 pr-3 text-[13px] text-stone-700 placeholder:text-stone-400 focus:border-[#1c1917] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#1c1917]/20"
          />
        </div>

        <div className="hidden items-center gap-2 xl:flex">
          {hasBackgroundActivity && (
            <span className="inline-flex items-center gap-1.5 rounded-sm border border-stone-200 bg-stone-50 px-2.5 py-1 text-xs font-semibold text-stone-700">
              <Loader2 className="h-3.5 w-3.5 animate-spin text-orange-600" />
              {isGenerating && indexingCount > 0
                ? `Streaming · ${indexingCount} upload${indexingCount > 1 ? "s" : ""}`
                : isGenerating
                  ? "Streaming…"
                  : `${indexingCount} indexing`}
            </span>
          )}
          <span className="inline-flex items-center gap-1.5 rounded-sm border border-orange-200 bg-orange-50 px-2.5 py-1 text-xs font-semibold text-orange-700">
            <WifiOff className="h-3.5 w-3.5" />
            100% Offline
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-sm border border-[#1c1917]/20 bg-[#f5f5f4] px-2.5 py-1 text-xs font-semibold text-[#1c1917]">
            <ShieldCheck className="h-3.5 w-3.5" />
            Secured
          </span>
        </div>

        <div className="flex items-center gap-0.5">
          <button
            type="button"
            aria-label="Help"
            className="flex h-8 w-8 items-center justify-center rounded-sm text-stone-500 hover:bg-stone-100 hover:text-stone-700"
          >
            <HelpCircle className="h-4 w-4" />
          </button>
          <button
            type="button"
            aria-label="Notifications"
            className="relative flex h-8 w-8 items-center justify-center rounded-sm text-stone-500 hover:bg-stone-100 hover:text-stone-700"
          >
            <Bell className="h-4 w-4" />
            {alerts.length > 0 && (
              <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-[#1c1917]" />
            )}
          </button>
          <div className="ml-1 flex h-7 w-7 items-center justify-center rounded-sm bg-stone-800 text-[11px] font-semibold text-white">
            OP
          </div>
        </div>
      </header>

      {alerts.length > 0 && (
        <div className="shrink-0 space-y-1 border-b border-stone-100 px-3 py-1.5">
          {alerts.map((alert) => (
            <div
              key={alert.id}
              className="flex items-center gap-2 rounded-sm border border-stone-200 bg-stone-50 px-3 py-2 text-xs"
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
                className="rounded-sm p-0.5 text-stone-400 hover:text-stone-700"
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
