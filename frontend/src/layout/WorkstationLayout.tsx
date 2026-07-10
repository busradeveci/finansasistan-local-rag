import { useEffect, useState } from "react"

import {

  Bell,

  ChevronLeft,

  ChevronRight,

  Loader2,

  Search,

  Shield,

  WifiOff,

  X,

} from "lucide-react"



import SidebarNav from "@/layout/SidebarNav"

import { useWorkstation } from "@/context/WorkstationContext"



const SIDEBAR_STORAGE_KEY = "ws-sidebar-collapsed"

const BANNER_STORAGE_KEY = "ws-offline-banner-dismissed"



export default function WorkstationLayout({ children }: { children: React.ReactNode }) {

  const { hasBackgroundActivity, uploadQueue, isGenerating, alerts, dismissAlert } = useWorkstation()

  const indexingCount = uploadQueue.filter((q) => q.status === "indexing").length



  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {

    try {

      return localStorage.getItem(SIDEBAR_STORAGE_KEY) === "true"

    } catch {

      return false

    }

  })



  const [bannerDismissed, setBannerDismissed] = useState(() => {

    try {

      return localStorage.getItem(BANNER_STORAGE_KEY) === "true"

    } catch {

      return false

    }

  })



  useEffect(() => {

    try {

      localStorage.setItem(SIDEBAR_STORAGE_KEY, String(sidebarCollapsed))

    } catch {

      /* ignore */

    }

  }, [sidebarCollapsed])



  const dismissBanner = () => {

    setBannerDismissed(true)

    try {

      localStorage.setItem(BANNER_STORAGE_KEY, "true")

    } catch {

      /* ignore */

    }

  }



  return (

    <div className="flex h-screen flex-col bg-[var(--ws-canvas)]">

      <header className="sticky top-0 z-20 shrink-0 border-b border-[var(--ws-card-border)] bg-[var(--ws-canvas-alt)] px-3 py-2">

        <div className="flex items-center gap-3">

          <div className="hidden min-w-0 shrink-0 items-center gap-3 sm:flex">

            <div className="flex h-7 w-7 items-center justify-center rounded-lg border border-[var(--ws-card-border)] bg-[var(--ws-card-bg)]">

              <span className="text-[10px] font-bold text-[var(--ws-primary)]">FL</span>

            </div>

            <div>

              <p className="text-xs font-bold tracking-tight text-white">

                Foundry Local — Enterprise AI Workstation

              </p>

              <p className="text-[10px] font-medium text-[var(--ws-text-muted)]">

                Secure. Offline. Enterprise Ready.

              </p>

            </div>

          </div>



          <div className="relative mx-auto hidden max-w-md flex-1 md:block">

            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[var(--ws-text-muted)]" />

            <input

              type="search"

              placeholder="Search anything..."

              className="w-full rounded-xl border border-[var(--ws-card-border)] bg-[var(--ws-card-bg)] py-1.5 pl-8 pr-14 text-xs text-white placeholder:text-[var(--ws-text-muted)] focus:border-[var(--ws-primary)]/50 focus:outline-none focus:ring-1 focus:ring-[var(--ws-primary)]/20"

              readOnly

              aria-label="Global search"

            />

            <kbd className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 rounded-md border border-[var(--ws-card-border)] bg-[var(--ws-card-bg-elevated)] px-1.5 py-0.5 text-[10px] font-semibold text-[var(--ws-text-muted)]">

              Ctrl K

            </kbd>

          </div>



          <div className="ml-auto flex shrink-0 items-center gap-2">

            <span className="hidden items-center gap-1.5 rounded-full border border-[var(--ws-card-border)] bg-[var(--ws-card-bg)] px-2.5 py-1 text-[11px] font-semibold text-[var(--ws-text-secondary)] sm:inline-flex">

              <span className="h-1.5 w-1.5 rounded-full bg-[var(--ws-primary)]" />

              <WifiOff className="h-3 w-3" />

              Offline Mode

            </span>

            <span className="hidden items-center gap-1.5 rounded-full border border-[var(--ws-card-border)] bg-[var(--ws-card-bg)] px-2.5 py-1 text-[11px] font-semibold text-[var(--ws-text-secondary)] sm:inline-flex">

              <span className="h-1.5 w-1.5 rounded-full bg-[var(--ws-primary)]" />

              <Shield className="h-3 w-3" />

              Secure

            </span>

            {hasBackgroundActivity && (

              <span className="inline-flex items-center gap-1.5 rounded-full border border-[var(--ws-card-border)] bg-[var(--ws-card-bg)] px-2.5 py-1 text-[11px] font-semibold text-[var(--ws-text-secondary)]">

                <Loader2 className="h-3 w-3 animate-spin text-[var(--ws-primary)]" />

                {isGenerating && indexingCount > 0

                  ? `Streaming · ${indexingCount} upload${indexingCount > 1 ? "s" : ""}`

                  : isGenerating

                    ? "Streaming…"

                    : `${indexingCount} indexing`}

              </span>

            )}

            <button

              type="button"

              className="relative rounded-lg p-2 text-[var(--ws-text-muted)] transition-colors hover:bg-[var(--ws-card-bg)] hover:text-white"

              aria-label="Notifications"

            >

              <Bell className="h-4 w-4" />

              <span className="absolute right-1 top-1 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-[var(--ws-primary)] text-[8px] font-bold text-[var(--ws-canvas)]">

                3

              </span>

            </button>

            <div className="hidden items-center gap-2 rounded-xl border border-[var(--ws-card-border)] bg-[var(--ws-card-bg)] px-2 py-1 sm:flex">

              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[var(--ws-primary)] text-[11px] font-bold text-[var(--ws-canvas)]">

                BY

              </div>

              <div className="min-w-0">

                <p className="truncate text-xs font-semibold text-white">Büşra Yılmaz</p>

                <p className="truncate text-[10px] text-[var(--ws-text-muted)]">Administrator</p>

              </div>

            </div>

          </div>

        </div>

      </header>



      {alerts.length > 0 && (

        <div className="shrink-0 space-y-1 px-4 py-1.5">

          {alerts.map((alert) => (

            <div

              key={alert.id}

              className="flex items-center gap-2 rounded-xl border border-[var(--ws-card-border)] bg-[var(--ws-card-bg)] px-3 py-2 text-xs"

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

                className="ws-toolbar-btn p-0.5"

                aria-label="Dismiss"

              >

                <X className="h-3 w-3" />

              </button>

            </div>

          ))}

        </div>

      )}



      <div className="flex min-h-0 flex-1 overflow-hidden">

        <aside

          className={`spring relative flex shrink-0 flex-col overflow-hidden border-r border-[var(--ws-card-border)] bg-[var(--ws-sidebar)] transition-all duration-300 ease-in-out ${

            sidebarCollapsed ? "w-[var(--ws-sidebar-collapsed)]" : "w-[var(--ws-sidebar-width)]"

          }`}

        >

          <button

            type="button"

            onClick={() => setSidebarCollapsed((c) => !c)}

            className="ws-sidebar-toggle"

            aria-label={sidebarCollapsed ? "Expand workstation menu" : "Collapse workstation menu"}

            title={sidebarCollapsed ? "Expand menu" : "Collapse menu"}

          >

            {sidebarCollapsed ? (

              <ChevronRight className="h-3.5 w-3.5" />

            ) : (

              <ChevronLeft className="h-3.5 w-3.5" />

            )}

          </button>

          <div className="fluent-scrollbar min-h-0 flex-1 overflow-y-auto pt-9">

            <SidebarNav collapsed={sidebarCollapsed} />

          </div>

          {!sidebarCollapsed && (

            <div className="shrink-0 border-t border-[var(--ws-card-border)] px-2.5 py-2.5">

              <div className="rounded-lg border border-[var(--ws-card-border)] bg-[var(--ws-card-bg)] px-2.5 py-2">

                <div className="flex items-center gap-2">

                  <span className="h-2 w-2 rounded-full bg-[var(--ws-primary)]" />

                  <span className="text-[10px] font-medium text-[var(--ws-text-secondary)]">

                    All systems operational

                  </span>

                </div>

                <p className="mt-1 text-[9px] text-[var(--ws-text-muted)]">Foundry Local · v1.0 · Build 2026.07</p>

              </div>

            </div>

          )}

        </aside>



        <main className="flex min-w-0 flex-1 flex-col overflow-hidden bg-[var(--ws-canvas)]">

          {children}

        </main>

      </div>



      {!bannerDismissed && (

        <div className="shrink-0 border-t border-[var(--ws-card-border)] bg-[var(--ws-card-bg)] px-3 py-2">

          <div className="mx-auto flex max-w-5xl items-center gap-3">

            <Shield className="h-4 w-4 shrink-0 text-[var(--ws-primary)]" />

            <p className="flex-1 text-xs text-[var(--ws-text-secondary)]">

              Your AI workstation is secure, offline, and ready. All data stays on your machine. No

              external connections.{" "}

              <button type="button" className="font-semibold text-[var(--ws-primary)] underline underline-offset-2">

                Learn more

              </button>

            </p>

            <button

              type="button"

              onClick={dismissBanner}

              className="rounded-lg p-1 text-[var(--ws-text-muted)] hover:bg-[var(--ws-card-bg-elevated)] hover:text-white"

              aria-label="Dismiss banner"

            >

              <X className="h-3.5 w-3.5" />

            </button>

          </div>

        </div>

      )}

    </div>

  )

}


