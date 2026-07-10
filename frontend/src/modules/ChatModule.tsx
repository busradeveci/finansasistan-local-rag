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

  const [chatMaximized, setChatMaximized] = useState(false)

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



  const showEvidence = evidenceOpen && !chatMaximized



  const handleCitationClick = (messageId: string, ref: number) => {

    if (!activeSessionId) return

    if (!evidenceOpen) setEvidenceOpen(true)

    if (chatMaximized) setChatMaximized(false)

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

    if (chatMaximized) setChatMaximized(false)

    setActiveEvidenceMessage(activeSessionId, messageId)

    setSelectedEvidence(chunk)

  }



  return (

    <div className="flex h-full min-h-0 flex-col overflow-hidden bg-[var(--ws-canvas)]">

      <div className="ws-chat-layout ws-module-shell flex h-full min-h-0 flex-1 overflow-hidden">

      <div

        className={`ws-card ws-chat-card flex h-full min-h-0 min-w-0 flex-1 flex-col overflow-hidden transition-all duration-300 ease-in-out ${

          chatMaximized ? "ws-chat-card-maximized" : ""

        }`}

      >

        <ConversationCanvas

          evidenceOpen={evidenceOpen}

          onToggleEvidence={() => {

            setChatMaximized(false)

            setEvidenceOpen((open) => !open)

          }}

          chatMaximized={chatMaximized}

          onToggleMaximize={() => setChatMaximized((m) => !m)}

          onCitationClick={handleCitationClick}

          onSourceClick={handleSourceClick}

        />

      </div>



      <aside

        className={`spring min-h-0 shrink-0 overflow-hidden transition-all duration-300 ease-in-out ${

          showEvidence ? "w-[var(--ws-evidence-width)] max-w-[var(--ws-evidence-width)] opacity-100" : "w-0 opacity-0 pointer-events-none"

        }`}

        aria-hidden={!showEvidence}

      >

        {showEvidence && (

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


