import { useEffect, useMemo, useRef, useState } from "react"

import {

  ChevronDown,

  Loader2,

  Maximize2,

  Minimize2,

  PanelRightClose,

  Plus,

  Send,

  Square,

  Trash2,

} from "lucide-react"

import { useWorkstation } from "@/context/WorkstationContext"

import CitationContent from "@/components/chat/CitationContent"

import type { EvidenceChunk } from "@/types/workstation"



interface ConversationCanvasProps {

  evidenceOpen: boolean

  onToggleEvidence: () => void

  chatMaximized: boolean

  onToggleMaximize: () => void

  onCitationClick: (messageId: string, ref: number) => void

  onSourceClick: (messageId: string, chunk: EvidenceChunk) => void

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

    <div ref={ref} className="relative min-w-0 max-w-[calc(220px*var(--ws-density))]">

      <button

        type="button"

        onClick={() => setOpen((v) => !v)}

        className="flex w-full items-center gap-1.5 rounded-lg border border-[var(--ws-card-border)] bg-[var(--ws-card-bg-elevated)] px-[calc(0.625rem*var(--ws-density))] py-[calc(0.375rem*var(--ws-density))] text-left transition-colors hover:border-[var(--ws-primary)]/35"

      >

        <span className="truncate text-badge font-semibold uppercase tracking-wider text-[var(--ws-text-muted)]">

          {activeSession?.label ?? "No Session"}

        </span>

        <ChevronDown

          className={`ml-auto h-3 w-3 shrink-0 text-[var(--ws-text-muted)] transition-transform ${open ? "rotate-180" : ""}`}

        />

      </button>



      {open && (

        <div className="absolute left-0 top-full z-30 mt-1 w-56 overflow-hidden rounded-xl border border-[var(--ws-card-border)] bg-[var(--ws-card-bg)]">

          <div className="flex items-center justify-between border-b border-[var(--ws-card-border)] px-2.5 py-2">

            <span className="text-[10px] font-semibold uppercase tracking-wider text-[var(--ws-text-muted)]">

              Intelligence Sessions

            </span>

            <button

              type="button"

              onClick={() => {

                createSession()

                setOpen(false)

              }}

              className="rounded-lg p-1 text-[var(--ws-primary)] hover:bg-[rgba(16,185,129,0.08)]"

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

                        ? "bg-[rgba(16,185,129,0.1)]"

                        : "hover:bg-[var(--ws-card-bg-elevated)]"

                    }`}

                  >

                    <p className="truncate text-xs font-medium text-white">{s.label}</p>

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

  chatMaximized,

  onToggleMaximize,

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

    const density = parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--ws-density")) || 0.9

    textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 95 * density)}px`

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

      <header className="ws-chat-header shrink-0 border-b border-[var(--ws-card-border)]">

        <div className="flex flex-wrap items-center justify-between gap-2">

          <div className="flex min-w-0 flex-1 items-center gap-2">

            <div className="min-w-0">

              <h2 className="truncate text-card-title text-white">Analysis Workspace</h2>

              <span className="truncate text-caption text-[var(--ws-text-muted)]">

                {isGenerating ? (streamStatusText ?? "Streaming…") : "Ready"}

              </span>

            </div>

            <SessionDropdown />

          </div>



          <div className="flex shrink-0 flex-wrap items-center justify-end gap-1">

            <button type="button" onClick={onToggleEvidence} className="ws-toolbar-btn">

              <PanelRightClose className="h-3.5 w-3.5" />

              <span className="hidden sm:inline">

                {evidenceOpen ? "Hide Evidence" : "Show Evidence"}

              </span>

            </button>

            <button

              type="button"

              onClick={onToggleMaximize}

              className={`ws-toolbar-btn ${chatMaximized ? "bg-[rgba(16,185,129,0.1)] text-[var(--ws-primary)]" : ""}`}

              title={chatMaximized ? "Restore panels" : "Maximize chat"}

            >

              {chatMaximized ? (

                <Minimize2 className="h-3.5 w-3.5" />

              ) : (

                <Maximize2 className="h-3.5 w-3.5" />

              )}

              <span className="hidden sm:inline">{chatMaximized ? "Restore" : "Maximize"}</span>

            </button>

          </div>

        </div>

      </header>



      <div className="flex min-h-0 w-full flex-1 flex-col overflow-hidden">

        <div className="ws-chat-messages scrollbar-hover min-h-0 max-h-full flex-1 overflow-y-auto">

          {messages.length === 0 ? (

            <div className="ws-chat-empty flex h-full items-center justify-center">

              <p className="max-w-lg text-center text-[var(--ws-text-muted)]">

                Foundry Local RAG Engine Active. Submit an executive query to begin analysis.

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

                    className={`ws-chat-bubble border border-solid transition-all duration-200 ease-in-out ${

                      isUser

                        ? "border-[var(--ws-card-border)] bg-[var(--ws-card-bg-elevated)]"

                        : "border-[var(--ws-card-border)] bg-[var(--ws-card-bg)]"

                    }`}

                    onClick={() => {

                      if (!isUser && message.sources.length > 0 && activeSessionId) {

                        setActiveEvidenceMessage(activeSessionId, message.id)

                      }

                    }}

                  >

                    <p className="mb-1.5 text-badge font-semibold uppercase tracking-wider text-[var(--ws-text-muted)]">

                      {isUser ? "Query" : "Executive Analysis"}

                    </p>

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

                          ? (streamStatusText ?? "Generating report…")

                          : "Awaiting response…"}

                      </p>

                    )}

                    {!isUser && message.sources.length > 0 && (

                      <div className="mt-2 border-t border-[var(--ws-card-border)] pt-2">

                        <p className="mb-1 text-badge font-semibold uppercase tracking-wider text-[var(--ws-text-muted)]">

                          Source documents

                        </p>

                        <div className="flex flex-wrap gap-1">

                          {message.sources.map((source, sourceIndex) => (

                            <button

                              key={`${source.filename}-${source.chunk_index}-${sourceIndex}`}

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



        <footer className="ws-chat-input-footer shrink-0 border-t border-[var(--ws-card-border)]">

          <div className="ws-input-bar flex items-end gap-1.5">

            <textarea

              ref={textareaRef}

              value={chatInput}

              onChange={(event) => setChatInput(event.target.value)}

              onKeyDown={handleKeyDown}

              placeholder="Ask analytical query…"

              className="ws-chat-textarea flex-1 resize-none overflow-y-hidden bg-transparent text-white placeholder:text-[var(--ws-text-muted)] scrollbar-none focus:outline-none"

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

                Stop

              </button>

            ) : (

              <button

                type="button"

                onClick={handleSend}

                disabled={!chatInput.trim()}

                className="ws-chat-send-btn inline-flex shrink-0 items-center rounded-lg bg-[var(--ws-primary)] font-semibold text-[var(--ws-canvas)] transition-all duration-200 ease-in-out hover:bg-[var(--ws-primary-hover)] disabled:cursor-not-allowed disabled:opacity-40"

              >

                <Send className="h-3.5 w-3.5" />

                Send

              </button>

            )}

            {isGenerating && (

              <Loader2 className="h-4 w-4 shrink-0 animate-spin text-[var(--ws-primary)]" />

            )}

          </div>

          <p className="ws-chat-hint text-[var(--ws-text-muted)]">

            Enter to send · Shift+Enter for new line

          </p>

        </footer>

      </div>

    </section>

  )

}


