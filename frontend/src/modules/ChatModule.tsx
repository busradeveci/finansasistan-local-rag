import { useEffect, useState } from "react"

import { useWorkstation } from "@/context/WorkstationContext"

import ConversationCanvas from "@/components/chat/ConversationCanvas"

import EvidencePanel from "@/components/evidence/EvidencePanel"

import EvidenceModal from "@/components/evidence/EvidenceModal"

import type { EvidenceChunk } from "@/types/workstation"

const CHAT_LAYOUT_KEY = "ws-chat-layout"

type ChatLayoutPrefs = {
  evidenceOpen: boolean
}

function readChatLayoutPrefs(): ChatLayoutPrefs {
  try {
    const raw = localStorage.getItem(CHAT_LAYOUT_KEY)
    if (!raw) return { evidenceOpen: true }
    const parsed = JSON.parse(raw) as Partial<ChatLayoutPrefs>
    return { evidenceOpen: parsed.evidenceOpen ?? true }
  } catch {
    return { evidenceOpen: true }
  }
}

export default function ChatModule() {
  const initial = readChatLayoutPrefs()
  const [evidenceOpen, setEvidenceOpen] = useState(initial.evidenceOpen)
  const [evidenceExpanded, setEvidenceExpanded] = useState(false)
  const [modalChunk, setModalChunk] = useState<EvidenceChunk | null>(null)

  const {
    sessions,
    activeSessionId,
    selectedEvidence,
    setSelectedEvidence,
    getSessionEvidenceSources,
    setActiveEvidenceMessage,
    focusEvidenceCitation,
  } = useWorkstation()

  const sources = getSessionEvidenceSources(activeSessionId)

  useEffect(() => {
    try {
      localStorage.setItem(CHAT_LAYOUT_KEY, JSON.stringify({ evidenceOpen }))
    } catch {
      /* ignore */
    }
  }, [evidenceOpen])

  const handleCitationClick = (messageId: string, ref: number) => {
    if (!activeSessionId) return
    if (!evidenceOpen) setEvidenceOpen(true)
    focusEvidenceCitation(activeSessionId, messageId, ref)
    const session = sessions.find((s) => s.id === activeSessionId)
    const message = session?.messages.find((m) => m.id === messageId)
    const chunk =
      message?.sources.find((s) => s.ref === ref) ?? message?.sources[ref - 1] ?? null
    if (chunk) setModalChunk(chunk)
  }

  const handleSourceClick = (messageId: string, chunk: EvidenceChunk) => {
    if (!activeSessionId) return
    if (!evidenceOpen) setEvidenceOpen(true)
    setActiveEvidenceMessage(activeSessionId, messageId)
    setSelectedEvidence(chunk)
  }

  const handleToggleEvidence = () => {
    setEvidenceExpanded(false)
    setEvidenceOpen((open) => !open)
  }

  const handleToggleEvidenceExpand = () => {
    if (!evidenceOpen) setEvidenceOpen(true)
    setEvidenceExpanded((expanded) => !expanded)
  }

  return (
    <div className="ws-chat-workspace flex h-full min-h-0 w-full max-w-full flex-col overflow-hidden">
      <div className="ws-chat-layout flex h-full min-h-0 w-full flex-1 gap-6 overflow-hidden p-1">
        <div className="ws-chat-card flex h-full min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
          <ConversationCanvas
            evidenceOpen={evidenceOpen}
            onToggleEvidence={handleToggleEvidence}
            evidenceExpanded={evidenceExpanded}
            onToggleEvidenceExpand={handleToggleEvidenceExpand}
            onCitationClick={handleCitationClick}
            onSourceClick={handleSourceClick}
          />
        </div>

        <aside
          className={`spring min-h-0 shrink-0 overflow-hidden ${
            evidenceOpen
              ? evidenceExpanded
                ? "w-[var(--ws-evidence-width-expanded)] max-w-[var(--ws-evidence-width-expanded)] opacity-100 transition-[width,max-width] duration-300 ease-in-out"
                : "w-[var(--ws-evidence-width)] max-w-[var(--ws-evidence-width)] opacity-100 transition-none"
              : "pointer-events-none w-0 max-w-0 opacity-0 transition-[width,max-width,opacity] duration-300 ease-in-out"
          }`}
          aria-hidden={!evidenceOpen}
        >
          {evidenceOpen && (
            <EvidencePanel
              sources={sources}
              selected={selectedEvidence}
              onSelect={setSelectedEvidence}
            />
          )}
        </aside>

        {modalChunk && <EvidenceModal chunk={modalChunk} onClose={() => setModalChunk(null)} />}
      </div>
    </div>
  )
}
