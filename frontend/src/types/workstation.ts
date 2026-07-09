/** Foundry Local workstation — shared type contracts. */

export type AppModule =
  | "home"
  | "chat"
  | "documents"
  | "knowledge"
  | "analytics"
  | "security"
  | "settings"

export interface TelemetryPacket {
  cpu: { percent: number }
  gpu: { percent: number | null; available: boolean }
  memory: { used_gb: number; total_gb: number; percent: number }
  vector_db: {
    engine: string
    vectors: number
    dimensions: number
    documents: number
  }
}

export interface AnalyticsPacket {
  queries_processed_today: number
  avg_response_ms: number
  avg_retrieval_ms: number
  avg_generation_ms: number
  avg_embedding_ms: number
  context_tokens_accumulated: number
  sample_count: number
}

export interface SecurityPacket {
  sanitized_queries: number
  prompt_injections_blocked: number
  uploads_rejected: number
  threats_blocked: number
  risk_tier: string
  offline_mode: boolean
  prompt_injection_protection: boolean
  sanitization_layers: number
  path_traversal_guard: boolean
  context_overflow_protection: boolean
}

export interface EvidenceChunk {
  ref: number | null
  filename: string
  chunk_index?: number
  score: number
  confidence?: number
  preview: string
  content?: string
  file_type?: string
}

export interface ChatMessage {
  id: string
  role: "user" | "assistant"
  content: string
  sources: EvidenceChunk[]
  reasoning: { time: string; text: string }[]
}

export interface DocumentInventoryRow {
  filename: string
  type: string
  chunks: number
  embedding_dimensions: number
  embedding_model: string
  indexation_state: string
  last_updated: string | null
  path: string
}

export interface ChunkIndexRow {
  chunk_index: number
  chars: number
  preview: string
}

export interface ConversationSession {
  id: string
  label: string
  date: string
  messages: ChatMessage[]
}

export type UploadQueueStatus = "indexing" | "success" | "failed"

export interface UploadQueueItem {
  name: string
  status: UploadQueueStatus
  detail?: string
}

export interface WorkstationAlert {
  id: string
  level: "info" | "warning" | "error"
  message: string
}
