import { useEffect, useMemo, useRef, useState } from "react"

import {
  ChevronDown,
  FileDown,
  Loader2,
  PanelLeftClose,
  PanelLeftOpen,
  PanelRightClose,
  Plus,
  Send,
  Square,
  Trash2,
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
  "bg-white/55 backdrop-blur-md border border-white/70 shadow-[0_6px_18px_rgba(20,40,70,0.06),inset_0_1px_0_rgba(255,255,255,0.86)] rounded-full hover:bg-white/65 transition-all duration-200"

const GLASS_CARD =
  "bg-white/72 backdrop-blur-xl border border-white/70 shadow-[0_8px_26px_rgba(20,40,70,0.06),inset_0_1px_0_rgba(255,255,255,0.86)] rounded-3xl"

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

    textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 95)}px`

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
              <h2 className="truncate min-w-0 flex-1 text-card-title">Workspace Chat</h2>
              {(activeAgentBadge || (isGenerating && !activeAgentBadge)) && (
                <span
                  className={`shrink-0 rounded-full px-1.5 py-0.5 text-body-sm font-semibold uppercase tracking-wide text-slate-800 ${HYPER_GLASS}`}
                >
                  [Active Model: {activeAgentBadge ?? "Inference"}]
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

          {/* RIGHT: knowledge sources + panel controls — always shrink-0 */}
          <div className="flex shrink-0 items-center gap-1">

            <TargetSourceSelect />

            <button
              type="button"
              onClick={onToggleEvidence}
              className="ws-toolbar-btn"
              title={evidenceOpen ? "Close knowledge sources panel" : "Open knowledge sources panel"}
            >
              <PanelRightClose className="h-3.5 w-3.5" />
              <span className="hidden lg:inline">
                {evidenceOpen ? "Close" : "Knowledge Sources"}
              </span>
            </button>

            <button
              type="button"
              onClick={onToggleEvidenceExpand}
              disabled={!evidenceOpen}
              className={`ws-toolbar-btn ${evidenceExpanded ? "text-[var(--ws-primary)]" : ""} disabled:cursor-not-allowed disabled:opacity-40`}
              title={evidenceExpanded ? "Collapse evidence panel" : "Expand evidence panel"}
            >
              {evidenceExpanded ? (
                <PanelLeftClose className="h-3.5 w-3.5" />
              ) : (
                <PanelLeftOpen className="h-3.5 w-3.5" />
              )}
              <span className="hidden xl:inline">
                {evidenceExpanded ? "Collapse" : "Expand"}
              </span>
            </button>

          </div>

        </div>

      </header>



      <div className="flex min-h-0 w-full flex-1 flex-col overflow-hidden">

        <div className="ws-chat-messages scrollbar-hover min-h-0 max-h-full flex-1 overflow-y-auto">

          {messages.length === 0 ? (

            <div className="ws-chat-empty flex h-full items-center justify-center">
              <p className="max-w-lg text-center text-[var(--ws-text-muted)]">

                No active conversations.

              </p>

            </div>

          ) : (

            <div className="ws-chat-message-list flex w-full flex-col">

              {messages.map((message, index) => {

                const isUser = message.role === "user"

                const isLatestAssistant =

                  !isUser && isGenerating && index === messages.length - 1



                return (

                  <article

                    key={message.id}

                    className="ws-chat-bubble transition-all duration-200 ease-in-out"

                    onClick={() => {

                      if (!isUser && message.sources.length > 0 && activeSessionId) {

                        setActiveEvidenceMessage(activeSessionId, message.id)

                      }

                    }}

                  >

                    <div className="mb-1.5 flex min-w-0 flex-wrap items-center gap-x-2 gap-y-0.5">

                      <p className="text-badge font-semibold uppercase tracking-wider text-[var(--ws-text-muted)]">

                        {isUser ? "Prompt" : "Response"}

                      </p>

                      {!isUser && message.agentBadge && (

                        <span className={`truncate px-1.5 py-0.5 text-body-sm font-semibold tracking-wide text-slate-800 ${HYPER_GLASS}`}>

                          [{message.agentBadge}]

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

                      <p className="whitespace-pre-wrap break-words text-body-sm leading-relaxed text-[var(--ws-text-secondary)]">

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

                          <span className="ml-1 inline-block animate-pulse text-[var(--ws-primary)]">▌</span>

                        )}

                      </p>

                    ) : (

                      <p className="text-body-sm text-[var(--ws-text-muted)]">

                        {isLatestAssistant

                          ? (streamStatusText ?? "Loading...")

                          : "Response"}

                      </p>

                    )}

                    {!isUser && message.sources.length > 0 && (

                      <div className="mt-2 border-t border-white/40 pt-2">

                        <p className="mb-1 text-badge font-semibold uppercase tracking-wider text-[var(--ws-text-muted)]">

                          Supporting Documents

                        </p>

                        <div className="flex flex-wrap gap-1">

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

                              className="ws-toolbar-btn px-1.5 py-0.5 text-caption"

                            >

                              {source.ref != null && (

                                <span className="mr-0.5 font-semibold tabular-nums text-[var(--ws-primary)]">

                                  [{source.ref}]

                                </span>

                              )}

                              <span className="max-w-[160px] truncate">{source.filename}</span>

                            </button>

                          ))}

                        </div>

                      </div>

                    )}

                  </article>

                )

              })}

            </div>

          )}

          <div ref={bottomRef} />

        </div>



        {streamError && (

          <p className="shrink-0 px-1 pt-2 text-body-sm text-[var(--ws-danger)]">{streamError}</p>

        )}



        <footer className="ws-chat-input-footer shrink-0 border-t border-white/40">

          <div className="ws-input-bar flex items-end gap-1.5">

            <textarea

              ref={textareaRef}

              value={chatInput}

              onChange={(event) => setChatInput(event.target.value)}

              onKeyDown={handleKeyDown}

              placeholder="Prompt"

              className="ws-chat-textarea flex-1 resize-none overflow-y-hidden bg-transparent text-[var(--ws-text)] placeholder:text-[var(--ws-text-muted)] scrollbar-none focus:outline-none"

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

                className="ws-chat-send-btn disabled:cursor-not-allowed disabled:opacity-40"

              >

                <Send className="h-3.5 w-3.5" />

                Send

              </button>

            )}

          </div>

          <p className="ws-chat-hint text-[var(--ws-text-muted)]">

            Enter to send. Shift+Enter for new line.

          </p>

        </footer>

      </div>

    </section>

  )

}


