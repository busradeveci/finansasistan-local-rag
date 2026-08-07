import { useMemo } from "react"
import { useWorkstationData } from "@/components/workstation/use-workstation-data"
import { useWorkstation } from "@/context/WorkstationContext"
import {
  HeroBanner,
  InfrastructurePanel,
  KnowledgePanel,
  QuickActions,
} from "@/components/workstation/overview/panels"
import { RagPipeline } from "@/components/workstation/overview/RagPipeline"
import { SecurityRail, type ActivityEvent } from "@/components/workstation/overview/SecurityRail"

/* ═══════════════════════════════════════════════════════════════════════
   Workstation overview.

   Two-zone layout: a primary column that reads top-down (identity →
   shortcuts → pipeline → analytics) beside a persistent security rail.
   The rail collapses beneath the primary column under 1280px.
   ═══════════════════════════════════════════════════════════════════════ */

export function WorkstationView() {
  const { status, analytics, telemetry, security, loading } = useWorkstationData()
  const { documentInventory, documentIndex, recentDocuments, alerts, setModule } = useWorkstation()

  const documentCount = status?.vector_store?.document_count ?? documentInventory.length ?? 0
  const chunkCount = status?.vector_store?.total_chunks ?? 0

  const lastIngestionDisplay = useMemo(() => {
    if (documentInventory.length === 0) return "No ingestion history"

    const mostRecent = [...documentInventory].sort((a, b) => {
      if (!a.last_updated) return 1
      if (!b.last_updated) return -1
      return new Date(b.last_updated).getTime() - new Date(a.last_updated).getTime()
    })[0].last_updated

    return mostRecent ? new Date(mostRecent).toLocaleString() : "No ingestion history"
  }, [documentInventory])

  const events = useMemo<ActivityEvent[]>(() => {
    const collected: ActivityEvent[] = [
      ...recentDocuments.map((doc) => ({ type: "document", text: `Indexed: ${doc}`, time: "Recent" })),
      ...alerts.slice(0, 5).map((alert) => ({ type: "alert", text: alert.message, time: "Recent" })),
    ].slice(0, 5)

    if (collected.length === 0) {
      collected.push({ type: "info", text: "No recent activity available.", time: "--" })
    }

    return collected
  }, [recentDocuments, alerts])

  return (
    <div className="vv-overview fluent-scrollbar">
      <div className="mx-auto w-full max-w-[1680px] px-1.5 pb-8 pt-1 lg:px-3">
        <div className="grid grid-cols-1 items-stretch gap-5 xl:grid-cols-[minmax(0,1fr)_324px] 2xl:grid-cols-[minmax(0,1fr)_368px] 2xl:gap-6">
          <div className="flex min-w-0 flex-col gap-5 2xl:gap-6">
            <HeroBanner
              status={status}
              loading={loading}
              lastIngestion={lastIngestionDisplay}
              delay={0}
            />

            <QuickActions onNavigate={setModule} documentCount={documentInventory.length} delay={70} />

            <RagPipeline analytics={analytics} loading={loading} delay={140} />

            <div className="grid gap-5 md:grid-cols-2 2xl:gap-6">
              <InfrastructurePanel
                status={status}
                telemetry={telemetry}
                analytics={analytics}
                loading={loading}
                delay={210}
              />
              <KnowledgePanel
                documentCount={documentCount}
                chunkCount={chunkCount}
                documentInventory={documentInventory}
                documentIndex={documentIndex}
                telemetry={telemetry}
                lastIngestion={lastIngestionDisplay}
                loading={loading}
                delay={280}
              />
            </div>
          </div>

          <SecurityRail security={security} events={events} delay={350} />
        </div>
      </div>
    </div>
  )
}
