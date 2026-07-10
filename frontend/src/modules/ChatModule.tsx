import { useState } from "react"
import { Plus, Trash2 } from "lucide-react"
import { useWorkstation } from "@/context/WorkstationContext"
import ConversationCanvas from "@/components/chat/ConversationCanvas"
import EvidencePanel from "@/components/evidence/EvidencePanel"

export default function ChatModule() {
  const [sessionsOpen, setSessionsOpen] = useState(true)
  const [evidenceOpen, setEvidenceOpen] = useState(true)

  const {
    sessions,
    activeSessionId,
    setActiveSessionId,
    createSession,
    deleteSession,
    selectedEvidence,
    setSelectedEvidence,
  } = useWorkstation()

  const session = sessions.find((s) => s.id === activeSessionId)
  const lastAssistant = [...(session?.messages ?? [])]
    .reverse()
    .find((m) => m.role === "assistant")
  const sources = lastAssistant?.sources ?? []

  return (
    <div className="flex h-full min-h-0 w-full flex-1 gap-1.5 overflow-hidden bg-[#fcfcfc] p-1.5 md:gap-2 md:p-2">
      <aside
        className={`spring ws-card flex min-h-0 shrink-0 flex-col overflow-hidden rounded-sm transition-all duration-300 ease-in-out ${
          sessionsOpen ? "w-56 p-2 opacity-100" : "w-0 border-0 p-0 opacity-0 pointer-events-none"
        }`}
        aria-hidden={!sessionsOpen}
      >
        <div className="mb-2 flex items-center justify-between gap-2">
          <h2 className="truncate text-sm font-semibold uppercase tracking-wide text-[#4f4e4d]">
            Intelligence Sessions
          </h2>
          <button
            type="button"
            onClick={createSession}
            className="ws-toolbar-btn shrink-0"
          >
            <Plus className="h-3 w-3" />
            New
          </button>
        </div>
        <div className="fluent-scrollbar min-h-0 flex-1 space-y-1.5 overflow-y-auto pr-0.5">
          {sessions.length === 0 ? (
            <div className="rounded-sm border border-[#4f4e4d]/40 bg-white p-2 text-sm font-medium text-[#4f4e4d] shadow-sm">
              Start a new session to begin executive analysis.
            </div>
          ) : (
            sessions.map((s) => {
              const active = activeSessionId === s.id
              return (
                <div
                  key={s.id}
                  className={`group relative rounded-sm border border-solid p-2 transition-all duration-300 ease-in-out ${
                    active
                      ? "border-[#4f4e4d] bg-white shadow-sm ring-1 ring-[#4f4e4d]"
                      : "ws-card ws-interactive"
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => setActiveSessionId(s.id)}
                    className="w-full text-left"
                  >
                    <p className="truncate text-sm font-semibold text-[#1b1a1f]">{s.label}</p>
                    <p className="mt-0.5 truncate text-sm text-[#4f4e4d]">{s.date}</p>
                    <p className="mt-0.5 truncate text-sm text-[#6b6a68] tabular-nums">
                      {s.messages.length} message{s.messages.length === 1 ? "" : "s"}
                    </p>
                  </button>
                  <button
                    type="button"
                    onClick={() => deleteSession(s.id)}
                    className="ws-toolbar-btn absolute right-1.5 top-1.5 p-1 text-[#4f4e4d]"
                    aria-label={`Delete ${s.label}`}
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              )
            })
          )}
        </div>
      </aside>

      <div className="ws-card flex h-full min-h-0 min-w-0 flex-1 flex-col overflow-hidden rounded-sm p-2 md:p-3">
        <ConversationCanvas
          sessionsOpen={sessionsOpen}
          onToggleSessions={() => setSessionsOpen((open) => !open)}
          evidenceOpen={evidenceOpen}
          onToggleEvidence={() => setEvidenceOpen((open) => !open)}
        />
      </div>

      <aside
        className={`spring min-h-0 shrink-0 overflow-hidden transition-all duration-300 ease-in-out ${
          evidenceOpen ? "w-72 max-w-xs opacity-100" : "w-0 opacity-0 pointer-events-none"
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
    </div>
  )
}
