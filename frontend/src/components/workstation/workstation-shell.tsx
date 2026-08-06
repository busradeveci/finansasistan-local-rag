import { useEffect, useState } from "react"
import { Shield, X } from "lucide-react"
import { Sidebar } from "@/components/workstation/sidebar"
import { Header } from "@/components/workstation/header"
import { WorkstationView } from "#components/workstation/WorkstationOverview.tsx"
import { ModulePlaceholder } from "@/components/workstation/module-placeholder"
import { findNavItem } from "@/components/workstation/nav-config"
import { useWorkstation } from "@/context/WorkstationContext"
import ChatModule from "@/modules/ChatModule"
import DocumentsModule from "#modules/DocumentsModule.tsx"
import KnowledgeHubModule from "#modules/KnowledgeHubModule.tsx"
import SystemTelemetryModule from "#modules/SystemTelemetryModule.tsx"
import InferenceRuntimeModule from "#modules/InferenceRuntimeModule.tsx"
import SecurityCenterModule from "#modules/SecurityCenterModule.tsx"
import SettingsModule from "#modules/SettingsModule.tsx"
import InferenceRoutingModule from "#modules/InferenceRoutingModule.tsx"
import type { AppModule } from "@/types/workstation"

const BANNER_STORAGE_KEY = "ws-offline-banner-dismissed"

function renderModule(module: AppModule) {
  switch (module) {
    case "workstation":
      return <WorkstationView />
    case "chat":
      return <ChatModule />
    case "documents":
      return <DocumentsModule />
    case "knowledge":
    case "vector":
      return <KnowledgeHubModule />
    case "router":
      return <InferenceRoutingModule />
    case "inference":
      return <InferenceRuntimeModule />
    case "telemetry":
      return <SystemTelemetryModule />
    case "security":
      return <SecurityCenterModule />
    case "settings":
      return <SettingsModule />
    default:
      return <ModulePlaceholder item={findNavItem(module).item} />
  }
}

export function WorkstationShell() {
  const { module } = useWorkstation()
  const { item } = findNavItem(module)
  const breadcrumb = [item.label]

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
