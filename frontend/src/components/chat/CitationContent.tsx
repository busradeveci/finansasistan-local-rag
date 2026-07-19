import type { EvidenceChunk } from "@/types/workstation"

interface Props {
  content: string
  sources: EvidenceChunk[]
  onCitationClick: (ref: number) => void
}

const CITATION_PATTERN = /(\[\d+\])/g

export default function CitationContent({ content, sources, onCitationClick }: Props) {
  const validRefs = new Set(sources.map((s) => s.ref).filter((r): r is number => r != null))
  const parts = content.split(CITATION_PATTERN)

  return (
    <>
      {parts.map((part, index) => {
        const match = part.match(/^\[(\d+)\]$/)
        if (!match) {
          return <span key={index}>{part}</span>
        }
        const ref = Number(match[1])
        const isLinked = validRefs.has(ref)
        if (!isLinked) {
          return (
            <span key={index} className="tabular-nums text-[var(--ws-text-muted)]">
              {part}
            </span>
          )
        }
        return (
          <button
            key={index}
            type="button"
            onClick={() => onCitationClick(ref)}
            className="ws-citation-link"
            title={`Focus evidence slice [${ref}]`}
          >
            {part}
          </button>
        )
      })}
    </>
  )
}
