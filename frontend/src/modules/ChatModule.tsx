import { useState } from "react"
import { Plus, Trash2, X } from "lucide-react"
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
    <div className="flex flex-1 min-h-0 h-full w-full gap-3 md:gap-4 p-3 md:p-5 overflow-hidden">
      <aside
        className={`spring shrink-0 flex flex-col min-h-0 overflow-hidden ws-glass rounded-2xl shadow-glass transition-all duration-200 ease-[cubic-bezier(0.2,0,0,1)] ${
          sessionsOpen ? "w-64 p-4 opacity-100" : "w-0 p-0 border-0 opacity-0 pointer-events-none"
        }`}
        aria-hidden={!sessionsOpen}
      >
        <div className="mb-3 flex items-center justify-between gap-2">
          <h2 className="text-badge font-semibold uppercase tracking-wide text-navy-700">
            Intelligence Sessions
          </h2>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={createSession}
              className="inline-flex items-center gap-1 rounded-xl border border-glass bg-white/50 backdrop-blur-glass px-2.5 py-1.5 text-badge text-navy-700 shadow-glass hover:shadow-glass-hover hover:-translate-y-px transition-all duration-200 ease-[cubic-bezier(0.2,0,0,1)]"
            >
              <Plus className="h-3 w-3" />
              New
            </button>
            <button
              type="button"
              onClick={() => setSessionsOpen(false)}
              className="inline-flex items-center justify-center rounded-xl p-1.5 text-navy-500 hover:bg-white/40 hover:text-navy-900 transition-all duration-200 ease-[cubic-bezier(0.2,0,0,1)]"
              aria-label="Collapse sessions panel"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
        <div className="fluent-scrollbar flex-1 min-h-0 space-y-2 overflow-y-auto pr-1">
          {sessions.length === 0 ? (
            <div className="ws-glass-inner rounded-xl p-3 text-caption text-navy-700">
              Start a new session to begin executive analysis.
            </div>
          ) : (
            sessions.map((s) => {
              const active = activeSessionId === s.id
              return (
                <div
                  key={s.id}
                  className={`group relative rounded-xl border p-3 spring hover:-translate-y-px hover:shadow-glass transition-all duration-200 ease-[cubic-bezier(0.2,0,0,1)] ${
                    active
                      ? "border-navy-500/30 bg-white/55 backdrop-blur-glass shadow-glass"
                      : "border-glass bg-white/35 backdrop-blur-glass hover:bg-white/50"
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => setActiveSessionId(s.id)}
                    className="w-full text-left"
                  >
                    <p className="truncate text-body-sm font-semibold text-navy-900">{s.label}</p>
                    <p className="mt-1 text-caption text-navy-700">{s.date}</p>
                    <p className="mt-0.5 text-caption text-navy-500 tabular-nums">
                      {s.messages.length} message{s.messages.length === 1 ? "" : "s"}
                    </p>
                  </button>
                  <button
                    type="button"
                    onClick={() => deleteSession(s.id)}
                    className="absolute right-2 top-2 rounded-xl p-1 text-navy-500 hover:bg-red-50/80 hover:text-[var(--ws-danger)] transition-all duration-200 ease-[cubic-bezier(0.2,0,0,1)]"
                    aria-label={`Delete ${s.label}`}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              )
            })
          )}
        </div>
      </aside>

      <div className="flex-1 w-full min-w-0 flex flex-col h-full ws-glass-inner rounded-[30px] p-4 md:p-6 min-h-0 overflow-hidden">
        <ConversationCanvas
          sessionsOpen={sessionsOpen}
          onToggleSessions={() => setSessionsOpen((open) => !open)}
          evidenceOpen={evidenceOpen}
          onToggleEvidence={() => setEvidenceOpen((open) => !open)}
        />
      </div>

      <aside
        className={`spring shrink-0 min-h-0 overflow-hidden transition-all duration-200 ease-[cubic-bezier(0.2,0,0,1)] ${
          evidenceOpen ? "w-80 max-w-sm opacity-100" : "w-0 opacity-0 pointer-events-none"
        }`}
        aria-hidden={!evidenceOpen}
      >
        {evidenceOpen && (
          <EvidencePanel
            sources={sources}
            selected={selectedEvidence}
            onSelect={setSelectedEvidence}
            onToggle={() => setEvidenceOpen(false)}
          />
        )}
      </aside>
    </div>
  )
}
