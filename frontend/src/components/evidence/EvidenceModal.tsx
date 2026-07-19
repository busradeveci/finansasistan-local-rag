import { X } from "lucide-react"
import type { EvidenceChunk } from "@/types/workstation"

interface Props {
  chunk: EvidenceChunk
  onClose: () => void
}

export default function EvidenceModal({ chunk, onClose }: Props) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="evidence-modal-title"
      onClick={onClose}
    >
      <div
        className="flex max-h-[min(80vh,520px)] w-full max-w-lg flex-col overflow-hidden rounded-xl border border-gray-200 bg-white shadow-md"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="flex shrink-0 items-start justify-between gap-3 border-b border-gray-200 px-5 py-3.5">
          <div className="min-w-0">
            <h3 id="evidence-modal-title" className="truncate text-sm font-semibold text-[var(--ws-text)]">
              {chunk.ref != null && (
                <span className="mr-1 tabular-nums text-[var(--ws-primary)]">[{chunk.ref}]</span>
              )}
              {chunk.filename}
            </h3>
            <p className="mt-0.5 text-xs tracking-wide text-[var(--ws-text-muted)]">
              Verified chunk from Document Vault
              {chunk.chunk_index != null && (
                <span className="tabular-nums"> · #{chunk.chunk_index}</span>
              )}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="ws-toolbar-btn shrink-0 p-1"
            aria-label="Close"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </header>
        <div className="fluent-scrollbar min-h-0 flex-1 overflow-y-auto px-5 py-4">
          <pre className="whitespace-pre-wrap break-words text-sm leading-relaxed tracking-wide text-[var(--ws-text-secondary)]">
            {chunk.content ?? chunk.preview}
          </pre>
        </div>
        <footer className="flex shrink-0 flex-wrap gap-2 border-t border-gray-200 px-5 py-3">
          <MetaBadge label="Similarity" value={`${((chunk.score ?? 0) * 100).toFixed(1)}%`} />
          <MetaBadge
            label="Confidence"
            value={`${chunk.confidence ?? Math.round((chunk.score ?? 0) * 100)}%`}
          />
          {chunk.chunk_index != null && (
            <MetaBadge label="Chunk" value={`#${chunk.chunk_index}`} />
          )}
        </footer>
      </div>
    </div>
  )
}

function MetaBadge({ label, value }: { label: string; value: string }) {
  return (
    <span className="ws-badge">
      <span>{label}</span>
      <span className="ws-badge-value">{value}</span>
    </span>
  )
}
