import { useEffect, useState } from "react"
import { Shield, X } from "lucide-react"
import { Sidebar } from "@/components/dashboard/sidebar"
import { Header } from "@/components/dashboard/header"
import { DashboardView } from "@/components/dashboard/dashboard-view"
import { ModulePlaceholder } from "@/components/dashboard/module-placeholder"
import { findNavItem } from "@/components/dashboard/nav-config"
import { useWorkstation } from "@/context/WorkstationContext"
import ChatModule from "@/modules/ChatModule"
import DocumentsModule from "@/modules/DocumentsModule"
import KnowledgeBaseModule from "@/modules/KnowledgeBaseModule"
import AnalyticsModule from "@/modules/AnalyticsModule"
import FinancialIntelligenceModule from "@/modules/FinancialIntelligenceModule"
import SecurityCenterModule from "@/modules/SecurityCenterModule"
import SettingsModule from "@/modules/SettingsModule"
import RouterModule from "@/modules/RouterModule"
import type { AppModule } from "@/types/workstation"

const BANNER_STORAGE_KEY = "ws-offline-banner-dismissed"

function renderModule(module: AppModule) {
  switch (module) {
    case "dashboard":
      return <DashboardView />
    case "chat":
      return <ChatModule />
    case "documents":
      return <DocumentsModule />
    case "knowledge":
    case "vector":
      return <KnowledgeBaseModule />
    case "router":
      return <RouterModule />
    case "inference":
      return <FinancialIntelligenceModule />
    case "telemetry":
      return <AnalyticsModule />
    case "security":
      return <SecurityCenterModule />
    case "settings":
      return <SettingsModule />
    case "compute":
    default:
      return <ModulePlaceholder item={findNavItem(module).item} />
  }
}

export function WorkstationShell() {
  const { module } = useWorkstation()
  const { group, item } = findNavItem(module)
  const breadcrumb = [group, item.label]

  const [bannerDismissed, setBannerDismissed] = useState(() => {
    try {
      return localStorage.getItem(BANNER_STORAGE_KEY) === "true"
    } catch {
      return false
    }
  })

  useEffect(() => {
    try {
      localStorage.setItem(BANNER_STORAGE_KEY, String(bannerDismissed))
    } catch {
      /* ignore */
    }
  }, [bannerDismissed])

  const isFullBleed = module === "chat" || module === "documents"

  return (
    <div className="ws-workstation flex h-screen min-h-0 w-full max-w-full text-slate-900">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <Header breadcrumb={breadcrumb} />
        <main
          className={
            "ws-main-canvas min-h-0 flex-1 overflow-hidden " +
            (isFullBleed
              ? "ws-main-canvas--full-bleed flex flex-col"
              : "overflow-y-auto fluent-scrollbar")
          }
        >
          <div
            key={module}
            className={
              isFullBleed ? "flex h-full min-h-0 w-full max-w-full flex-1 flex-col" : "h-full w-full max-w-full"
            }
          >
            {renderModule(module)}
          </div>
        </main>

        {!bannerDismissed && (
          <div className="shrink-0 border-t border-white/40 bg-white/20 px-4 py-2.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.8)] backdrop-blur-2xl backdrop-saturate-[1.1]">
            <div className="mx-auto flex max-w-5xl items-center gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-white/60 bg-white/30 shadow-[0_4px_12px_rgba(0,0,0,0.05),inset_0_1px_1px_rgba(255,255,255,0.9)] backdrop-blur-md">
                <Shield className="h-4 w-4 text-blue-600" />
              </div>
              <p className="flex-1 text-xs leading-relaxed text-slate-600/90">
                Your AI workstation is secure, offline, and ready. All data stays on your machine. No external
                connections.
              </p>
              <button
                type="button"
                onClick={() => setBannerDismissed(true)}
                className="rounded-full p-1.5 text-slate-500 transition-all duration-300 hover:bg-white/40 hover:text-slate-800"
                aria-label="Dismiss banner"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
