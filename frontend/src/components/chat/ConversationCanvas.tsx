import { useEffect, useMemo, useRef, useState } from "react"

import {
  BarChart3,
  Bot,
  ChevronDown,
  FileDown,
  FileSearch,
  Loader2,
  PanelRightClose,
  Plus,
  Send,
  ShieldCheck,
  Square,
  Trash2,
  User,
} from "lucide-react"

import { exportExecutivePdf } from "@/api/client"
import { useWorkstation } from "@/context/WorkstationContext"

import CitationContent from "@/components/chat/CitationContent"
import TargetSourceSelect from "@/components/chat/MetadataFilterBar"

import type { ChatMessage, EvidenceChunk } from "@/types/workstation"



interface ConversationCanvasProps {

  evidenceOpen: boolean

  onToggleEvidence: () => void

  evidenceExpanded: boolean

  onToggleEvidenceExpand: () => void

  onCitationClick: (messageId: string, ref: number) => void

  onSourceClick: (messageId: string, chunk: EvidenceChunk) => void

}



const HYPER_GLASS =
  "bg-white/90 backdrop-blur-md border border-slate-200/60 shadow-sm rounded-full hover:bg-white transition-all duration-200"

const GLASS_CARD =
  "bg-white/90 backdrop-blur-md border border-slate-200/60 shadow-sm rounded-3xl"

const PROMPT_SUGGESTIONS: { icon: typeof FileSearch; label: string }[] = [
  { icon: FileSearch, label: "Summarize the key findings across my indexed documents" },
  { icon: BarChart3, label: "Compare the financial metrics between the latest reports" },
  { icon: ShieldCheck, label: "Highlight risks and compliance obligations with citations" },
]

function uniqueSourcesByFilename(sources: EvidenceChunk[]): EvidenceChunk[] {
  const seen = new Set<string>()
  return sources.filter((source) => {
    if (seen.has(source.filename)) return false
    seen.add(source.filename)
    return true
  })
}

function resolveExportTitle(messages: ChatMessage[], messageIndex: number, sessionLabel: string): string {
  for (let i = messageIndex - 1; i >= 0; i -= 1) {
    if (messages[i]?.role === "user" && messages[i].content.trim()) {
      return messages[i].content.trim().slice(0, 200)
    }
  }
  return sessionLabel || "Executive Credit Analysis"
}

function ExportPdfButton({
  title,
  analysis,
  sources,
  disabled,
}: {
  title: string
  analysis: string
  sources: EvidenceChunk[]
  disabled?: boolean
}) {
  const [exporting, setExporting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleExport = async (event: React.MouseEvent) => {
    event.stopPropagation()
    if (exporting || disabled || !analysis.trim()) return
    setExporting(true)
    setError(null)
    try {
      await exportExecutivePdf({ title, analysis, sources })
    } catch (err) {
      setError(err instanceof Error ? err.message : "PDF export failed")
    } finally {
      setExporting(false)
    }
  }

  return (
    <div className="ml-auto flex shrink-0 flex-col items-end gap-0.5">
      <button
        type="button"
        onClick={handleExport}
        disabled={disabled || exporting || !analysis.trim()}
        className="ws-export-pdf-btn"
        title="Export Executive PDF"
        aria-label="Export Executive PDF"
      >
        {exporting ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : (
          <FileDown className="h-3.5 w-3.5" />
        )}
        <span className="hidden sm:inline">Export PDF</span>
      </button>
      {error && (
        <span className="max-w-[180px] truncate text-[10px] text-[var(--ws-danger)]">{error}</span>
      )}
    </div>
  )
}



function SessionDropdown() {

  const [open, setOpen] = useState(false)

  const ref = useRef<HTMLDivElement>(null)

  const {

    sessions,

    activeSessionId,

    setActiveSessionId,

    createSession,

    deleteSession,

  } = useWorkstation()



  const activeSession = sessions.find((s) => s.id === activeSessionId)



  useEffect(() => {

    const handler = (e: MouseEvent) => {

      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)

    }

    document.addEventListener("mousedown", handler)

    return () => document.removeEventListener("mousedown", handler)

  }, [])



  return (

    <div ref={ref} className="relative min-w-0 max-w-[220px]">

      <button

        type="button"

        onClick={() => setOpen((v) => !v)}

        className={`flex w-full items-center gap-1.5 px-2.5 py-1.5 text-left ${HYPER_GLASS} !rounded-2xl`}

      >

        <span className="truncate text-badge font-semibold uppercase tracking-wider text-[var(--ws-text-muted)]">

          {activeSession?.label ?? "No Session"}

        </span>

        <ChevronDown

          className={`ml-auto h-3 w-3 shrink-0 text-[var(--ws-text-muted)] transition-transform ${open ? "rotate-180" : ""}`}

        />

      </button>



      {open && (

        <div className={`absolute left-0 top-full z-30 mt-1 w-56 overflow-hidden ${GLASS_CARD}`}>

          <div className="flex items-center justify-between border-b border-white/40 px-2.5 py-2">

            <span className="text-[10px] font-semibold uppercase tracking-wider text-[var(--ws-text-muted)]">

              Intelligence Sessions

            </span>

            <button

              type="button"

              onClick={() => {

                createSession()

                setOpen(false)

              }}

              className="rounded-sm p-1 text-[var(--ws-primary)] hover:bg-blue-50"

              aria-label="New session"

            >

              <Plus className="h-3.5 w-3.5" />

            </button>

          </div>

          <ul className="max-h-48 overflow-y-auto fluent-scrollbar py-1">

            {sessions.length === 0 ? (

              <li className="px-3 py-2 text-[11px] text-[var(--ws-text-muted)]">No sessions yet</li>

            ) : (

              sessions.map((s) => (

                <li key={s.id} className="group relative">

                  <button

                    type="button"

                    onClick={() => {

                      setActiveSessionId(s.id)

                      setOpen(false)

                    }}

                    className={`w-full px-3 py-2 text-left transition-colors ${
                      activeSessionId === s.id
                        ? "bg-white/50"
                        : "hover:bg-white/30"
                    }`}

                  >

                    <p className="truncate text-xs font-medium text-[var(--ws-text)]">{s.label}</p>

                    <p className="truncate text-[10px] text-[var(--ws-text-muted)]">{s.date}</p>

                  </button>

                  <button

                    type="button"

                    onClick={() => deleteSession(s.id)}

                    className="absolute right-2 top-2 rounded p-0.5 text-[var(--ws-text-muted)] opacity-0 hover:text-[var(--ws-danger)] group-hover:opacity-100"

                    aria-label={`Delete ${s.label}`}

                  >

                    <Trash2 className="h-3 w-3" />

                  </button>

                </li>

              ))

            )}

          </ul>

        </div>

      )}

    </div>

  )

}



export default function ConversationCanvas({

  evidenceOpen,

  onToggleEvidence,

  evidenceExpanded,

  onToggleEvidenceExpand,

  onCitationClick,

  onSourceClick,

}: ConversationCanvasProps) {

  const {

    sessions,

    activeSessionId,

    chatInput,

    setChatInput,

    sendChatMessage,

    cancelChatStream,

    isGenerating,

    streamStatusText,

    activeAgentBadge,

    streamError,

    setActiveEvidenceMessage,

    setSelectedEvidence,

  } = useWorkstation()



  const textareaRef = useRef<HTMLTextAreaElement | null>(null)

  const bottomRef = useRef<HTMLDivElement | null>(null)

  const session = useMemo(

    () => sessions.find((s) => s.id === activeSessionId) ?? null,

    [sessions, activeSessionId],

  )

  const messages = session?.messages ?? []



  useEffect(() => {

    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" })

  }, [messages, isGenerating])



  useEffect(() => {

    if (!textareaRef.current) return

    textareaRef.current.style.height = "auto"

    textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`

  }, [chatInput])



  const handleSend = () => {

    if (!chatInput.trim() || isGenerating) return

    sendChatMessage()

  }



  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {

    if (event.key === "Enter" && !event.shiftKey) {

      event.preventDefault()

      handleSend()

    }

  }



  return (

    <section className="flex h-full min-h-0 w-full flex-1 flex-col overflow-hidden">

      <header className="ws-chat-header shrink-0 border-b border-white/40">

        {/* Three-zone header: title | session | controls */}
        <div className="flex items-center gap-2 overflow-hidden">

          {/* LEFT: title + status — grows, truncates */}
          <div className="flex min-w-0 flex-1 flex-col justify-center overflow-hidden">
            <div className="flex min-w-0 items-center gap-x-2">
              <h2 className="truncate min-w-0 flex-1 text-card-title">Intelligence Chat</h2>
              {(activeAgentBadge || (isGenerating && !activeAgentBadge)) && (
                <span className="vv-chat-tag shrink-0" title={`Active model: ${activeAgentBadge ?? "Inference"}`}>
                  <span className="vv-chat-tag__dot" />
                  <span className="truncate">{activeAgentBadge ?? "Inference"}</span>
                </span>
              )}
            </div>
            <span className="flex min-w-0 items-center gap-1.5 truncate text-caption text-[var(--ws-text-muted)]">
              {isGenerating && (
                <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin text-[var(--ws-primary)]" />
              )}
              {isGenerating ? (streamStatusText ?? "Loading...") : "Ready"}
            </span>
          </div>

          {/* CENTER: session picker — fixed width, never shrinks */}
          <div className="shrink-0"><SessionDropdown /></div>

          {/* RIGHT: knowledge sources + panel controls — always shrink-0, overflow-visible for dropdown */}
          <div className="relative z-10 flex shrink-0 items-center gap-1.5 overflow-visible">

            <TargetSourceSelect />

            {/* Compact icon-only panel toggle — no text label to prevent tooltip overflow */}
            <button
              type="button"
              onClick={onToggleEvidence}
              className="ws-toolbar-btn !px-2"
              aria-label={evidenceOpen ? "Close knowledge sources panel" : "Open knowledge sources panel"}
            >
              <PanelRightClose className={`h-3.5 w-3.5 transition-transform ${evidenceOpen ? "" : "rotate-180"}`} />
            </button>

          </div>

        </div>

      </header>



      <div className="flex min-h-0 w-full flex-1 flex-col overflow-hidden">

        <div className="ws-chat-messages scrollbar-hover min-h-0 max-h-full flex-1 overflow-y-auto">

          {messages.length === 0 ? (

            <div className="ws-chat-empty flex h-full items-center justify-center">
              <div className="ws-chat-column vv-rise flex max-w-xl flex-col items-center px-4 text-center">
                <span className="vv-chat-empty-icon mb-5">
                  <span className="vv-ai-orb" aria-hidden="true">
                    <span className="vv-ai-orb__glow" />
                    <span className="vv-ai-orb__sphere">
                      <span className="vv-ai-orb__aurora" />
                    </span>
                    <span className="vv-ai-orb__sheen" />
                  </span>
                </span>
                <h3 className="vv-title-section mb-2">How can I help you today?</h3>
                <p className="vv-body mb-7 max-w-md">
                  Ask a question, analyze evidence, or search across your indexed knowledge —
                  answers are grounded in your documents with inline citations.
                </p>
                <div className="grid w-full gap-2.5 sm:grid-cols-1">
                  {PROMPT_SUGGESTIONS.map(({ icon: Icon, label }) => (
                    <button
                      key={label}
                      type="button"
                      onClick={() => {
                        setChatInput(label)
                        textareaRef.current?.focus()
                      }}
                      className="vv-suggestion vv-focus"
                    >
                      <span className="vv-suggestion__icon">
                        <Icon className="h-3.5 w-3.5" strokeWidth={1.8} />
                      </span>
                      <span className="min-w-0 flex-1">{label}</span>
                    </button>
                  ))}
                </div>
              </div>

            </div>

          ) : (

            <div className="ws-chat-column">
            <div className="ws-chat-message-list flex w-full flex-col">

              {messages.map((message, index) => {

                const isUser = message.role === "user"

                const isLatestAssistant =

                  !isUser && isGenerating && index === messages.length - 1



                return (

                  <article

                    key={message.id}

                    className={`ws-chat-bubble animate-vv-message-in ${
                      isUser ? "ws-chat-bubble--user" : "ws-chat-bubble--assistant"
                    } ${
                      !isUser && message.sources.length > 0 ? "ws-chat-bubble--clickable" : ""
                    }`}

                    onClick={() => {

                      if (!isUser && message.sources.length > 0 && activeSessionId) {

                        setActiveEvidenceMessage(activeSessionId, message.id)

                      }

                    }}

                  >

                    <div className="mb-2 flex min-w-0 items-center gap-2">

                      <span
                        className={`vv-chat-avatar ${
                          isUser ? "vv-chat-avatar--user" : "vv-chat-avatar--assistant"
                        }`}
                        aria-hidden="true"
                      >
                        {isUser ? (
                          <User className="h-3.5 w-3.5" strokeWidth={1.9} />
                        ) : (
                          <Bot className="h-3.5 w-3.5" strokeWidth={1.9} />
                        )}
                      </span>

                      <span className="vv-chat-role">{isUser ? "You" : "Assistant"}</span>

                      {!isUser && message.agentBadge && (

                        <span className="vv-chat-tag min-w-0" title={`Model: ${message.agentBadge}`}>

                          <span className="vv-chat-tag__dot" />

                          <span className="truncate">{message.agentBadge}</span>

                        </span>

                      )}

                      {!isUser && message.content && !isLatestAssistant && (

                        <ExportPdfButton

                          title={resolveExportTitle(messages, index, session?.label ?? "Executive Analysis")}

                          analysis={message.content}

                          sources={message.sources}

                        />

                      )}

                    </div>

                    {message.content ? (

                      <div className="vv-chat-body whitespace-pre-wrap break-words">

                        {!isUser && message.sources.length > 0 ? (

                          <CitationContent

                            content={message.content}

                            sources={message.sources}

                            onCitationClick={(ref) => onCitationClick(message.id, ref)}

                          />

                        ) : (

                          message.content

                        )}

                        {isLatestAssistant && (

                          <span className="vv-chat-caret" aria-hidden="true" />

                        )}

                      </div>

                    ) : isLatestAssistant ? (

                      <div className="vv-chat-placeholder flex items-center gap-2.5">

                        <span className="vv-typing" aria-hidden="true">
                          <span />
                          <span />
                          <span />
                        </span>

                        <span>{streamStatusText ?? "Thinking…"}</span>

                      </div>

                    ) : (

                      <p className="vv-chat-placeholder">No response generated.</p>

                    )}

                    {!isUser && message.sources.length > 0 && (

                      <div className="mt-3 border-t border-white/50 pt-3">

                        <p className="vv-eyebrow mb-2">Sources</p>

                        <div className="flex flex-wrap gap-1.5">

                          {uniqueSourcesByFilename(message.sources).map((source) => (

                            <button

                              key={source.filename}

                              type="button"

                              onClick={(e) => {

                                e.stopPropagation()

                                onSourceClick(message.id, source)

                                if (activeSessionId) {

                                  setActiveEvidenceMessage(activeSessionId, message.id)

                                  setSelectedEvidence(source)

                                }

                              }}

                              className="vv-chat-source vv-focus"

                            >

                              {source.ref != null && (

                                <span className="vv-chat-source__ref">[{source.ref}]</span>

                              )}

                              <span className="truncate">{source.filename}</span>

                            </button>

                          ))}

                        </div>

                      </div>

                    )}

                  </article>

                )

              })}

            </div>
            </div>

          )}

          <div ref={bottomRef} />

        </div>



        {streamError && (

          <p className="shrink-0 px-1 pt-2 text-body-sm text-[var(--ws-danger)]">{streamError}</p>

        )}



        <footer className="ws-chat-input-footer shrink-0 border-t border-white/40">

          <div className="ws-chat-column">

          <div className="ws-input-bar flex items-end gap-2">

            <textarea

              ref={textareaRef}

              value={chatInput}

              onChange={(event) => setChatInput(event.target.value)}

              onKeyDown={handleKeyDown}

              placeholder="Ask VectorVault…"

              className="ws-chat-textarea flex-1 resize-none overflow-y-hidden bg-transparent text-[var(--vv-ink)] placeholder:text-[var(--vv-ink-4)] scrollbar-none focus:outline-none"

              disabled={isGenerating}

              rows={1}

            />

            {isGenerating ? (

              <button

                type="button"

                onClick={cancelChatStream}

                className="ws-toolbar-btn shrink-0 text-[var(--ws-danger)]"

              >

                <Square className="h-3.5 w-3.5" />

                Stop Generation

              </button>

            ) : (

              <button

                type="button"

                onClick={handleSend}

                disabled={!chatInput.trim()}

                className="ws-chat-send-btn ws-send-btn-primary disabled:cursor-not-allowed disabled:opacity-40"

                aria-label="Send message"

              >

                <Send className="h-3.5 w-3.5" />

                Send

              </button>

            )}

          </div>

          <p className="ws-chat-hint text-[var(--ws-text-muted)]">

            Enter to send. Shift+Enter for new line.

          </p>

          </div>

        </footer>

      </div>

    </section>

  )

}


