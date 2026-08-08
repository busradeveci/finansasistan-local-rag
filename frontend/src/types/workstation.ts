/** Foundry Local workstation — shared type contracts. */

export type AppModule =
  | "chat"
  | "workstation"
  | "knowledge"
  | "documents"
  | "vector"
  | "router"
  | "inference"
  | "telemetry"
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

export interface RoutingDecision {
  timestamp: string
  intent: string
  selected_model: string
  reason: string
  status: string
}

export interface AnalyticsPacket {
  queries_processed_today: number
  avg_response_ms: number
  avg_retrieval_ms: number
  avg_generation_ms: number
  avg_embedding_ms: number
  context_tokens_accumulated: number
  sample_count: number
  total_routed?: number
  recent_routing_decisions?: RoutingDecision[]
}

export interface RuntimeModelState {
  alias: string
  loaded: boolean
}

export interface RuntimeState {
  provider: string
  sdk_initialized: boolean
  endpoint: string | null
  models: {
    chat: RuntimeModelState
    embed: RuntimeModelState
    router: RuntimeModelState
  }
}

export interface VectorIndexInfo {
  vectors: number
  dimensions: number
  engine?: string
  vector_store?: string
  db_size_mb?: number | null
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
  agentBadge?: string
}

export interface DocumentInventoryRow {
  filename: string
  type: string
  chunks: number
  embedding_dimensions: number
  embedding_model: string
  file_size?: number | null
  indexation_state: string
  last_updated: string | null
  path: string
  year?: string | null
  quarter?: string | null
  file_type?: string
}

/** null = search across all indexed documents */
export type TargetSource = string | null

export interface ChunkIndexRow {
  chunk_index: number
  chars: number
  preview: string
}

export interface SessionEvidenceState {
  activeMessageId: string | null
  selectedEvidence: EvidenceChunk | null
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
