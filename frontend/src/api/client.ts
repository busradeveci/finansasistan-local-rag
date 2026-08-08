import axios from "axios"
import type {
  AnalyticsPacket,
  DocumentInventoryRow,
  EvidenceChunk,
  SecurityPacket,
  TelemetryPacket,
  VectorIndexInfo,
} from "@/types/workstation"

/**
 * Dev: empty string → same-origin requests proxied by Vite to 127.0.0.1:8000.
 * Prod: set VITE_API_BASE=http://127.0.0.1:8000 in .env.production.
 */
export const API_BASE =
  import.meta.env.VITE_API_BASE ??
  (import.meta.env.DEV ? "" : "http://127.0.0.1:8000")

export const API_ORIGIN =
  API_BASE || (typeof window !== "undefined" ? window.location.origin : "http://127.0.0.1:8000")

const api = axios.create({
  baseURL: API_BASE,
  timeout: 30_000,
})

// FormData uploads must omit Content-Type so the browser sets multipart boundary.
api.interceptors.request.use((config) => {
  if (config.data instanceof FormData) {
    const headers = config.headers as
      | { delete?: (name: string) => void; [key: string]: unknown }
      | undefined
    if (headers?.delete) {
      headers.delete("Content-Type")
      headers.delete("content-type")
    } else if (headers) {
      delete headers["Content-Type"]
      delete headers["content-type"]
    }
  }
  return config
})

export const getDocumentInventory = () =>
  api.get("/api/v1/documents", { timeout: 15_000 }).then((r) => ({
    documents: r.data.documents as DocumentInventoryRow[],
    index: r.data.index as VectorIndexInfo,
  }))

export const getDocumentChunks = (filename: string) =>
  api
    .get("/api/v1/documents/chunks", { params: { filename } })
    .then((r) => r.data.chunks as { chunk_index: number; chars: number; preview: string }[])

export const uploadDocument = (file: File, signal?: AbortSignal) => {
  const form = new FormData()
  form.append("file", file)
  return api
    .post("/api/v1/documents/upload", form, { timeout: 600_000, signal })
    .then((r) => r.data)
}

/** Normalize FastAPI / axios error payloads for upload UI. */
export function uploadErrorMessage(error: unknown): string {
  const data = (error as { response?: { data?: { detail?: unknown } } })?.response?.data
  const detail = data?.detail
  if (typeof detail === "string") return detail
  if (Array.isArray(detail)) {
    return detail.map((d) => (typeof d === "object" && d && "msg" in d ? String(d.msg) : String(d))).join("; ")
  }
  if ((error as { code?: string; message?: string }).code === "ECONNABORTED") {
    return "Request timed out — the backend may be busy indexing or loading models"
  }
  if ((error as { message?: string }).message === "Network Error") {
    return `Cannot reach the API at ${API_ORIGIN} — is the backend running on port 8000?`
  }
  return "Upload failed"
}

export const deleteDocument = (filename: string) =>
  api.delete(`/api/v1/documents/${encodeURIComponent(filename)}`).then((r) => r.data)

export const getTelemetry = () =>
  api.get<TelemetryPacket>("/api/telemetry", { timeout: 5_000 }).then((r) => r.data)

export const getAnalytics = () =>
  api.get<AnalyticsPacket>("/api/analytics").then((r) => r.data)

export const getSecurity = () =>
  api.get<SecurityPacket>("/api/security").then((r) => r.data)

export const getStatus = () => api.get("/api/status", { timeout: 10_000 }).then((r) => r.data)

export const getConfig = () => api.get("/api/v1/config", { timeout: 5_000 }).then((r) => r.data)

export const streamQuery = (
  question: string,
  topK = 4,
  filename: string | null = null
) => {
  const params = new URLSearchParams({
    question,
    top_k: String(topK),
  })
  if (filename) params.set("filename", filename)
  const path = `/query/stream?${params.toString()}`
  const url = API_BASE ? `${API_BASE}${path}` : path
  return new EventSource(url)
}

export interface ExportPdfPayload {
  title: string
  analysis: string
  sources: EvidenceChunk[]
}

export const exportExecutivePdf = async (payload: ExportPdfPayload): Promise<void> => {
  const response = await api.post("/api/v1/documents/export-pdf", payload, {
    responseType: "blob",
    timeout: 120_000,
  })
  const timestamp = new Date()
    .toISOString()
    .replace(/[-:]/g, "")
    .replace(/\..+/, "")
    .slice(0, 15)
  const filename = `VectorVault_Intelligence_Report_${timestamp}.pdf`
  const blob = new Blob([response.data], { type: "application/pdf" })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement("a")
  anchor.href = url
  anchor.download = filename
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
  URL.revokeObjectURL(url)
}

export type { EvidenceChunk }
