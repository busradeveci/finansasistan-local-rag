import { Plus, Trash2 } from "lucide-react"
import { useWorkstation } from "@/context/WorkstationContext"
import ConversationCanvas from "@/components/chat/ConversationCanvas"
import EvidencePanel from "@/components/evidence/EvidencePanel"

export default function ChatModule() {
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
    <div className="grid flex-1 min-h-0 h-full grid-cols-[270px,minmax(0,1fr),380px] gap-4 p-4">
      <aside className="ws-card min-h-0 overflow-hidden p-4 flex flex-col">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-[12px] font-semibold uppercase tracking-wide text-[var(--ws-text-secondary)]">
            Intelligence Sessions
          </h2>
          <button
            type="button"
            onClick={createSession}
            className="inline-flex items-center gap-1 rounded-lg border border-[rgba(0,120,212,0.25)] bg-[#0078D4]/10 px-2 py-1 text-[11px] font-medium text-[#0F6CBD] hover:bg-[#0078D4]/20"
          >
            <Plus className="h-3 w-3" />
            New
          </button>
        </div>
        <div className="fluent-scrollbar flex-1 min-h-0 space-y-2 overflow-y-auto pr-1">
          {sessions.length === 0 ? (
            <div className="rounded-xl border border-[rgba(15,35,60,0.08)] bg-white p-3 text-[12px] text-[var(--ws-text-secondary)]">
              Start a new session to begin executive analysis.
            </div>
          ) : (
            sessions.map((s) => {
              const active = activeSessionId === s.id
              return (
                <div
                  key={s.id}
                  className={`group relative rounded-xl border p-3 transition-all duration-300 ease-out ${
                    active
                      ? "border-[rgba(0,120,212,0.3)] bg-[#EAF3FF] shadow-sm"
                      : "border-[rgba(15,35,60,0.08)] bg-white hover:-translate-y-0.5 hover:shadow-lg"
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => setActiveSessionId(s.id)}
                    className="w-full text-left"
                  >
                    <p className="truncate text-[13px] font-semibold text-[#162235]">{s.label}</p>
                    <p className="mt-1 text-[11px] text-[#2D3B50]">{s.date}</p>
                    <p className="mt-1 text-[11px] text-[#2D3B50]">
                      {s.messages.length} message{s.messages.length === 1 ? "" : "s"}
                    </p>
                  </button>
                  <button
                    type="button"
                    onClick={() => deleteSession(s.id)}
                    className="absolute right-2 top-2 rounded-md p-1 text-[#2D3B50] hover:bg-[rgba(209,52,56,0.12)] hover:text-[#D13438]"
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
      <div className="ws-card min-w-0 min-h-0 flex flex-col overflow-hidden">
        <ConversationCanvas />
      </div>
      <EvidencePanel
        sources={sources}
        selected={selectedEvidence}
        onSelect={setSelectedEvidence}
      />
    </div>
  )
}
