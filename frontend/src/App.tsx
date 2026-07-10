import WorkstationLayout from "@/layout/WorkstationLayout"
import { FluentProvider, webDarkTheme } from "@fluentui/react-components"
import "./App.css"

import { WorkstationProvider, useWorkstation } from "@/context/WorkstationContext"

import HomeModule from "@/modules/HomeModule"
import ChatModule from "@/modules/ChatModule"
import DocumentsModule from "@/modules/DocumentsModule"
import KnowledgeBaseModule from "@/modules/KnowledgeBaseModule"
import AnalyticsModule from "@/modules/AnalyticsModule"
import FinancialIntelligenceModule from "@/modules/FinancialIntelligenceModule"
import SecurityCenterModule from "@/modules/SecurityCenterModule"
import SettingsModule from "@/modules/SettingsModule"

import type { AppModule } from "@/types/workstation"

const MODULES: { id: AppModule; Component: React.ComponentType }[] = [
  { id: "home", Component: HomeModule },
  { id: "chat", Component: ChatModule },
  { id: "documents", Component: DocumentsModule },
  { id: "financial", Component: FinancialIntelligenceModule },
  { id: "knowledge", Component: KnowledgeBaseModule },
  { id: "analytics", Component: AnalyticsModule },
  { id: "security", Component: SecurityCenterModule },
  { id: "settings", Component: SettingsModule },
]

function ModuleRouter() {
  const { module } = useWorkstation()
  const activeModule = MODULES.find(({ id }) => id === module) ?? MODULES[0]
  const ActiveComponent = activeModule.Component

  return (
    <div key={activeModule.id} className="block h-full w-full flex-1 min-h-0 min-w-0 overflow-hidden">
      <ActiveComponent />
    </div>
  )
}

export default function App() {
  return (
    <WorkstationProvider>
      <FluentProvider theme={webDarkTheme}>
        <div className="ws-density h-full w-full font-sans text-body text-white">
          <WorkstationLayout>
            <ModuleRouter />
          </WorkstationLayout>
        </div>
      </FluentProvider>
    </WorkstationProvider>
  )
}
