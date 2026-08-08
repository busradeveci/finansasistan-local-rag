import React, { useState, useEffect } from "react"
import { getConfig } from "@/api/client"
import {
  AlertCircle,
  RefreshCw,
  SlidersHorizontal,
  Boxes,
  Search,
  Sparkles,
  Layers,
  FileStack,
  FileCog,
  MessageSquareText,
  Binary,
  Waypoints,
} from "lucide-react"

import { CardHeading, LiveDot, Panel } from "@/components/workstation/overview/primitives"

interface PlatformConfig {
  models: {
    chat_model: string
    embed_model: string
    router_model: string
  }
  retrieval: {
    score_threshold: number
    relative_cutoff: number
    max_context_chunks: number
    top_k: number
    strategy?: string
  }
  generation?: {
    max_response_tokens: number
    temperature: number
    top_p: number
    streaming: boolean
  }
  embedding?: {
    model: string
    dimensions: number | null
    distance_metric: string
    vector_store: string
    precision: string
  }
  indexing: {
    chunk_size: number
    chunk_overlap: number
    supported_file_types?: string[]
    index_storage?: string
    embedding_pipeline?: string
  }
  source?: {
    config_file: string
    environment_variables: string
    provider: string
  }
}

const NOT_CONFIGURED = "Not configured"
const NOT_AVAILABLE = "Not available"

/* ── Status badge ─────────────────────────────────────────────────────── */

function StateBadge({
  tone,
  label,
  live,
}: {
  tone: "emerald" | "amber"
  label: string
  live?: boolean
}) {
  if (tone === "emerald") {
    return (
      <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-emerald-200/70 bg-emerald-50/80 px-2.5 py-1 text-[10.5px] font-semibold text-emerald-700">
        {live ? <LiveDot className="text-emerald-500" /> : <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />}
        {label}
      </span>
    )
  }
  return (
    <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-amber-200/70 bg-amber-50/80 px-2.5 py-1 text-[10.5px] font-semibold text-amber-700">
      <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
      {label}
    </span>
  )
}

/* ── Role pill (AI Models) ────────────────────────────────────────────── */

type RoleTone = "accent" | "emerald" | "violet"

function RolePill({ tone, label }: { tone: RoleTone; label: string }) {
  const cls =
    tone === "emerald"
      ? "border-emerald-200/70 bg-emerald-50/80 text-emerald-700"
      : tone === "violet"
        ? "border-violet-200/70 bg-violet-50/80 text-violet-700"
        : "border-[var(--vv-accent-ring)] bg-[var(--vv-accent-tint)] text-[var(--vv-accent-deep)]"
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${cls}`}>
      {label}
    </span>
  )
}

/* ── Key / value configuration row ────────────────────────────────────── */

function KV({
  label,
  value,
  mono,
  muted,
}: {
  label: string
  value: React.ReactNode
  mono?: boolean
  muted?: boolean
}) {
  const hasValue = value != null && value !== ""
  return (
    <div className="flex items-start justify-between gap-6 py-2.5 first:pt-0 last:pb-0">
      <span className="vv-eyebrow shrink-0 pt-px">{label}</span>
      {hasValue && !muted ? (
        <span
          className={`min-w-0 text-right font-semibold text-slate-700 ${
            mono ? "break-all font-mono text-[11.5px]" : "text-[12.5px] tabular-nums"
          }`}
        >
          {value}
        </span>
      ) : (
        <span className="min-w-0 text-right text-[12px] font-normal text-slate-400">
          {hasValue ? value : NOT_AVAILABLE}
        </span>
      )}
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════════════
   Settings — enterprise configuration console for the local RAG platform.
   Read-only surface reflecting the active backend configuration.
   ═══════════════════════════════════════════════════════════════════════ */

export default function SettingsModule() {
  const [config, setConfig] = useState<PlatformConfig | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchConfig = () => {
    setLoading(true)
    setError(null)
    getConfig()
      .then((data) => setConfig(data))
      .catch((err) => setError(err.message || "Failed to load configuration"))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    fetchConfig()
  }, [])

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center ws-module-shell">
        <div className="flex flex-col items-center text-slate-500">
          <RefreshCw className="mb-4 h-8 w-8 animate-spin text-[#000080]" />
          <p className="text-sm font-medium">Loading platform configuration...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex h-full items-center justify-center ws-module-shell">
        <div className="flex flex-col items-center text-red-500">
          <AlertCircle className="mb-4 h-8 w-8" />
          <p className="text-sm font-medium">{error}</p>
          <button
            onClick={fetchConfig}
            className="mt-4 rounded-full bg-red-100 px-4 py-2 text-sm font-semibold text-red-600 hover:bg-red-200 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  const models: { name: string; role: string; tone: RoleTone; icon: React.ComponentType<{ className?: string; strokeWidth?: number }> }[] = [
    { name: config?.models.chat_model || NOT_CONFIGURED, role: "Chat", tone: "accent", icon: MessageSquareText },
    { name: config?.models.embed_model || NOT_CONFIGURED, role: "Embed", tone: "emerald", icon: Binary },
    { name: config?.models.router_model || NOT_CONFIGURED, role: "Router", tone: "violet", icon: Waypoints },
  ]

  const chunkSize = config?.indexing.chunk_size ? `${config.indexing.chunk_size} chars` : null
  const chunkOverlap = config?.indexing.chunk_overlap ? `${config.indexing.chunk_overlap} chars` : null

  return (
    <div className="flex h-full min-h-0 w-full flex-col overflow-hidden p-4 sm:p-5 lg:p-6">
      <div className="mx-auto flex h-full min-h-0 w-full max-w-[1680px] flex-col gap-5">
        {/* Header ─────────────────────────────────────────────────────── */}
        <header className="flex flex-none flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <span className="vv-plate h-8 w-8">
              <SlidersHorizontal className="h-[16px] w-[16px]" strokeWidth={1.9} />
            </span>
            <div className="min-w-0">
              <h1 className="vv-title-section">Settings</h1>
              <p className="vv-caption mt-0.5">
                Platform configuration center for retrieval, model orchestration, and RAG behavior.
              </p>
            </div>
          </div>
          {config ? (
            <StateBadge tone="emerald" label="Backend Config Loaded" live />
          ) : (
            <StateBadge tone="amber" label="Backend Pending" />
          )}
        </header>

        <div className="fluent-scrollbar min-h-0 flex-1 overflow-y-auto pb-6">
          <div className="flex flex-col gap-5">
            {/* 1. AI Models ───────────────────────────────────────────── */}
            <Panel className="p-5 sm:p-6" delay={0}>
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <CardHeading icon={Boxes} title="AI Models" />
                <span className="text-[11px] font-medium text-slate-400">Configured local orchestration models</span>
              </div>

              {/* Column header (sm+) */}
              <div className="hidden gap-4 border-b border-white/60 pb-2 sm:grid sm:grid-cols-[minmax(0,1.7fr)_minmax(0,0.8fr)_minmax(0,1fr)_auto]">
                <span className="vv-eyebrow">Model</span>
                <span className="vv-eyebrow">Role</span>
                <span className="vv-eyebrow">Source</span>
                <span className="vv-eyebrow text-right">Status</span>
              </div>

              <div className="divide-y divide-white/50">
                {models.map((m) => {
                  const Icon = m.icon
                  return (
                    <div
                      key={m.role}
                      className="grid grid-cols-1 gap-2 py-3 first:pt-3 last:pb-0 sm:grid-cols-[minmax(0,1.7fr)_minmax(0,0.8fr)_minmax(0,1fr)_auto] sm:items-center sm:gap-4"
                    >
                      <div className="flex min-w-0 items-center gap-2.5">
                        <span className="vv-plate h-7 w-7">
                          <Icon className="h-[15px] w-[15px]" strokeWidth={1.9} />
                        </span>
                        <span className="truncate font-mono text-[12.5px] font-semibold text-slate-700" title={m.name}>
                          {m.name}
                        </span>
                      </div>
                      <div className="pl-9 sm:pl-0">
                        <RolePill tone={m.tone} label={m.role} />
                      </div>
                      <div className="pl-9 text-[12px] font-medium text-slate-500 sm:pl-0">Backend Config</div>
                      <div className="pl-9 sm:justify-self-end sm:pl-0">
                        <StateBadge tone="emerald" label="Active" />
                      </div>
                    </div>
                  )
                })}
              </div>
            </Panel>

            {/* 2. Retrieval + Generation ──────────────────────────────── */}
            <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
              <Panel className="p-5 sm:p-6" delay={70}>
                <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                  <CardHeading icon={Search} title="Retrieval Configuration" />
                  <span className="text-[11px] font-medium text-slate-400">Vector search parameters</span>
                </div>
                <div className="divide-y divide-white/50">
                  <KV label="Score Threshold" value={config?.retrieval.score_threshold} />
                  <KV label="Relative Cutoff" value={config?.retrieval.relative_cutoff} />
                  <KV label="Maximum Context Chunks" value={config?.retrieval.max_context_chunks} />
                  <KV label="Chunk Size" value={chunkSize} />
                  <KV label="Chunk Overlap" value={chunkOverlap} />
                  <KV label="Top-K Retrieval" value={config?.retrieval.top_k} />
                  <KV label="Retrieval Strategy" value={config?.retrieval.strategy} />
                </div>
              </Panel>

              <Panel className="p-5 sm:p-6" delay={140}>
                <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                  <CardHeading icon={Sparkles} title="Generation Configuration" />
                  <span className="text-[11px] font-medium text-slate-400">Inference parameters</span>
                </div>
                <div className="divide-y divide-white/50">
                  <KV label="Maximum Response Tokens" value={config?.generation?.max_response_tokens} />
                  <KV label="Temperature" value={config?.generation?.temperature} />
                  <KV label="Top P" value={config?.generation?.top_p} />
                  <KV label="Frequency Penalty" value={NOT_CONFIGURED} muted />
                  <KV label="Presence Penalty" value={NOT_CONFIGURED} muted />
                  <KV
                    label="Streaming"
                    value={config?.generation ? (config.generation.streaming ? "Enabled" : "Disabled") : null}
                  />
                </div>
              </Panel>
            </div>

            {/* 3. Embedding + Indexing ────────────────────────────────── */}
            <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
              <Panel className="p-5 sm:p-6" delay={210}>
                <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                  <CardHeading icon={Layers} title="Embedding Configuration" />
                  <span className="text-[11px] font-medium text-slate-400">Vector generation settings</span>
                </div>
                <div className="divide-y divide-white/50">
                  <KV
                    label="Embedding Model"
                    value={config?.embedding?.model || config?.models.embed_model || NOT_CONFIGURED}
                    mono
                  />
                  <KV label="Vector Dimensions" value={config?.embedding?.dimensions} />
                  <KV label="Distance Metric" value={config?.embedding?.distance_metric} />
                  <KV label="Vector Store Type" value={config?.embedding?.vector_store} />
                  <KV label="Embedding Precision" value={config?.embedding?.precision} />
                </div>
              </Panel>

              <Panel className="p-5 sm:p-6" delay={280}>
                <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                  <CardHeading icon={FileStack} title="Indexing Configuration" />
                  <span className="text-[11px] font-medium text-slate-400">Document processing pipeline</span>
                </div>
                <div className="divide-y divide-white/50">
                  <KV label="Chunk Size" value={chunkSize} />
                  <KV label="Chunk Overlap" value={chunkOverlap} />
                  <KV label="Supported File Types" value={config?.indexing.supported_file_types?.join(", ")} />
                  <KV label="Index Storage" value={config?.indexing.index_storage} />
                  <KV label="Embedding Pipeline" value={config?.indexing.embedding_pipeline} mono />
                </div>
              </Panel>
            </div>

            {/* 4. Configuration Source ────────────────────────────────── */}
            <Panel className="p-5 sm:p-6" delay={350}>
              <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                <CardHeading icon={FileCog} title="Configuration Source" />
                <span className="text-[11px] font-medium text-slate-400">Origin of active platform settings</span>
              </div>
              <div className="grid grid-cols-1 gap-x-10 md:grid-cols-2">
                <div className="divide-y divide-white/50">
                  <KV label="Configuration File" value={config?.source?.config_file} mono />
                  <KV
                    label="Environment Variables"
                    value={config?.source?.environment_variables ?? "Not configured (static config)"}
                    muted
                  />
                </div>
                <div className="flex items-center justify-between gap-6 py-2.5 md:py-0">
                  <span className="vv-eyebrow shrink-0">Backend Config</span>
                  <StateBadge tone="emerald" label="Loaded Successfully" />
                </div>
              </div>
            </Panel>
          </div>
        </div>
      </div>
    </div>
  )
}
