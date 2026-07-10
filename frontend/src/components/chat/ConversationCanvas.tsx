import { useEffect, useMemo, useRef } from "react"
import { Loader2, PanelLeft, PanelRightClose, Send, Square } from "lucide-react"
import { useWorkstation } from "@/context/WorkstationContext"

const SAMPLE_QUESTIONS = [
  "What are the key liquidity risks in the Q3 report?",
  "Calculate the expected credit card interest margins.",
  "Summarize Basel III capital adequacy requirements for retail portfolios.",
]

interface ConversationCanvasProps {
  sessionsOpen: boolean
  onToggleSessions: () => void
  evidenceOpen: boolean
  onToggleEvidence: () => void
}

export default function ConversationCanvas({
  sessionsOpen,
  onToggleSessions,
  evidenceOpen,
  onToggleEvidence,
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
    setSelectedEvidence,
  } = useWorkstation()

  const textareaRef = useRef<HTMLTextAreaElement | null>(null)
  const bottomRef = useRef<HTMLDivElement | null>(null)
  const session = useMemo(
    () => sessions.find((s) => s.id === activeSessionId) ?? null,
    [sessions, activeSessionId]
  )
  const messages = session?.messages ?? []

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" })
  }, [messages, isGenerating])

  useEffect(() => {
    if (!textareaRef.current) return
    textareaRef.current.style.height = "auto"
    textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 105)}px`
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
      <header className="shrink-0 border-b border-glass pb-2">
        <div className="flex items-center justify-between gap-2">
          <div className="min-w-0 flex-1">
            <h2 className="truncate text-card-title text-midnight">
              Analysis Workspace
            </h2>
            <span className="truncate text-sm text-stone">
              {isGenerating ? streamStatusText ?? "Streaming..." : "Ready"}
            </span>
          </div>

          <div className="flex shrink-0 items-center gap-1.5">
            <button
              type="button"
              onClick={onToggleSessions}
              className="ws-toolbar-btn"
            >
              <PanelLeft className="h-3 w-3" />
              <span className="hidden sm:inline">
                {sessionsOpen ? "Hide Sessions" : "Show Sessions"}
              </span>
            </button>
            <button
              type="button"
              onClick={onToggleEvidence}
              className="ws-toolbar-btn"
            >
              <PanelRightClose className="h-3 w-3" />
              <span className="hidden sm:inline">
                {evidenceOpen ? "Hide Evidence" : "Show Evidence"}
              </span>
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto flex min-h-0 w-full max-w-[900px] flex-1 flex-col overflow-hidden">
        <div className="scrollbar-hover min-h-0 max-h-full flex-1 overflow-y-auto rounded-sm border border-solid border-glass px-2.5 py-2 md:px-3 md:py-2.5 ws-glass">
          {messages.length === 0 ? (
            <div className="w-full space-y-2 py-4 md:py-5">
              <p className="text-card-title text-midnight">
                Reporting console ready
              </p>
              <p className="text-sm text-stone">
                Submit a query against your indexed documents or choose a sample below.
              </p>
              <div className="space-y-1">
                {SAMPLE_QUESTIONS.map((question) => (
                  <button
                    key={question}
                    type="button"
                    onClick={() => {
                      setChatInput(question)
                      textareaRef.current?.focus()
                    }}
                    className="ws-interactive w-full rounded-sm border border-solid border-transparent px-2.5 py-1.5 text-left text-sm text-midnight ws-glass-elevated"
                  >
                    <span className="line-clamp-2">{question}</span>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex w-full flex-col gap-2">
              {messages.map((message, index) => {
                const isUser = message.role === "user"
                const isLatestAssistant =
                  !isUser && isGenerating && index === messages.length - 1

                return (
                  <article
                    key={message.id}
                    className={`rounded-sm border border-solid p-2.5 transition-all duration-200 ease-in-out ${
                      isUser
                        ? "ml-3 border-glass ws-glass-elevated backdrop-blur-glass md:ml-5"
                        : "mr-3 border-glass bg-glass backdrop-blur-glass ws-interactive md:mr-5"
                    }`}
                  >
                    <p className="mb-1.5 text-sm font-semibold uppercase tracking-wide text-stone">
                      {isUser ? "Query" : "Executive Analysis"}
                    </p>
                    {message.content ? (
                      <p className="whitespace-pre-wrap break-words text-sm leading-relaxed text-midnight">
                        {message.content}
                        {isLatestAssistant && (
                          <span className="ml-1 inline-block animate-pulse text-stone">
                            ▌
                          </span>
                        )}
                      </p>
                    ) : (
                      <p className="text-sm text-stone">
                        {isLatestAssistant ? streamStatusText ?? "Generating report..." : "Awaiting response..."}
                      </p>
                    )}
                    {!isUser && message.sources.length > 0 && (
                      <div className="mt-2 border-t border-glass pt-2">
                        <p className="mb-1.5 text-sm font-semibold uppercase tracking-wide text-stone">
                          Source documents
                        </p>
                        <div className="flex flex-wrap gap-1">
                          {message.sources.map((source, sourceIndex) => (
                            <button
                              key={`${source.filename}-${source.chunk_index}-${sourceIndex}`}
                              type="button"
                              onClick={() => setSelectedEvidence(source)}
                              className="ws-toolbar-btn px-2 py-0.5 text-sm"
                            >
                              <span className="truncate max-w-[180px]">{source.filename}</span>
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
          <p className="shrink-0 pt-1.5 text-sm text-[var(--ws-danger)]">{streamError}</p>
        )}

        <footer className="shrink-0 pt-2">
          <div className="ws-input-bar flex items-end gap-1">
            <textarea
              ref={textareaRef}
              value={chatInput}
              onChange={(event) => setChatInput(event.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask analytical query..."
              className="max-h-[105px] min-h-[17px] flex-1 resize-none overflow-y-hidden bg-transparent text-sm text-midnight placeholder:text-stone scrollbar-none focus:outline-none"
              disabled={isGenerating}
              rows={1}
            />
            {isGenerating ? (
              <button
                type="button"
                onClick={cancelChatStream}
                className="ws-toolbar-btn shrink-0 text-[var(--ws-danger)]"
              >
                <Square className="h-3 w-3" />
                Stop
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSend}
                disabled={!chatInput.trim()}
                className="inline-flex shrink-0 items-center gap-1 rounded-sm bg-midnight px-3 py-1.5 text-sm font-semibold text-warm transition-all duration-200 ease-in-out disabled:cursor-not-allowed disabled:opacity-40"
              >
                <Send className="h-3 w-3" />
                Send
              </button>
            )}
            {isGenerating && <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin text-stone" />}
          </div>
          <p className="mt-1 text-sm text-stone">
            Enter to send · Shift+Enter for new line
          </p>
        </footer>
      </div>
    </section>
  )
}
