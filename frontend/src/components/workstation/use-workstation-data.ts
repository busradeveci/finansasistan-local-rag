import { useEffect, useState } from "react"
import { getAnalytics, getDocumentInventory, getSecurity, getStatus, getTelemetry } from "@/api/client"
import type { AnalyticsPacket, SecurityPacket, TelemetryPacket } from "@/types/workstation"

export type StatusPacket = {
  vector_store: { document_count: number; total_chunks: number }
  models: { chat_model: string; embed_model: string; router_model?: string }
}

export type WorkstationData = {
  status: StatusPacket | null
  analytics: AnalyticsPacket | null
  telemetry: TelemetryPacket | null
  security: SecurityPacket | null
  loading: boolean
}

export function useWorkstationData(pollMs = 5000, enabled = true): WorkstationData {
  const [status, setStatus] = useState<StatusPacket | null>(null)
  const [analytics, setAnalytics] = useState<AnalyticsPacket | null>(null)
  const [telemetry, setTelemetry] = useState<TelemetryPacket | null>(null)
  const [security, setSecurity] = useState<SecurityPacket | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!enabled) return

    let cancelled = false

    const load = async () => {
      try {
        const [s, a, t, sec] = await Promise.all([
          getStatus(),
          getAnalytics(),
          getTelemetry(),
          getSecurity(),
        ])
        if (cancelled) return
        setStatus(s as StatusPacket)
        setAnalytics(a)
        setTelemetry(t)
        setSecurity(sec)
      } catch {
        if (!cancelled) setStatus(null)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    const interval = setInterval(load, pollMs)
    return () => {
      cancelled = true
      clearInterval(interval)
    }
  }, [pollMs, enabled])

  return { status, analytics, telemetry, security, loading }
}

export async function fetchDocumentInventorySnapshot() {
  try {
    return await getDocumentInventory()
  } catch {
    return null
  }
}
