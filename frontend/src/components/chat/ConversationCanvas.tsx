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
    textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 140)}px`
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
    <section className="flex h-full min-h-0 flex-1 w-full flex-col">
      <header className="shrink-0 pb-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 min-w-0">
            <button
              type="button"
              onClick={onToggleSessions}
              className="inline-flex items-center justify-center rounded-xl border border-glass bg-white/50 backdrop-blur-glass p-2 text-navy-700 shadow-glass hover:shadow-glass-hover hover:-translate-y-px transition-all duration-200 ease-[cubic-bezier(0.2,0,0,1)]"
              aria-label={sessionsOpen ? "Collapse sessions panel" : "Open sessions panel"}
              title={sessionsOpen ? "Hide sessions" : "Show sessions"}
            >
              <PanelLeft className="h-4 w-4" />
            </button>
            <div className="min-w-0">
              <h2 className="text-card-title text-navy-900 truncate">
                Analysis Workspace
              </h2>
              <span className="text-caption text-navy-700">
                {isGenerating ? streamStatusText ?? "Streaming..." : "Ready"}
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={onToggleEvidence}
            className="inline-flex items-center gap-1.5 rounded-xl border border-glass bg-white/50 backdrop-blur-glass px-3 py-2 text-badge text-navy-700 shadow-glass hover:shadow-glass-hover hover:-translate-y-px transition-all duration-200 ease-[cubic-bezier(0.2,0,0,1)] shrink-0"
            aria-label={evidenceOpen ? "Collapse evidence panel" : "Open evidence panel"}
          >
            <PanelRightClose className="h-3.5 w-3.5" />
            {evidenceOpen ? "Hide Evidence" : "Toggle Evidence / Audit"}
          </button>
        </div>
      </header>

      <div className="fluent-scrollbar flex-1 min-h-0 w-full overflow-y-auto rounded-2xl ws-glass border border-glass px-4 py-4 md:px-5 md:py-5">
        {messages.length === 0 ? (
          <div className="w-full space-y-4 py-8 md:py-10">
            <p className="text-card-title text-navy-900">
              Reporting console ready
            </p>
            <p className="text-body-sm text-navy-700">
              Submit a query against your indexed documents or choose a sample below.
            </p>
            <div className="space-y-2">
              {SAMPLE_QUESTIONS.map((question) => (
                <button
                  key={question}
                  type="button"
                  onClick={() => {
                    setChatInput(question)
                    textareaRef.current?.focus()
                  }}
                  className="w-full rounded-xl border border-glass bg-white/50 backdrop-blur-glass px-4 py-3 text-left text-body-sm text-navy-900 shadow-glass hover:shadow-glass-hover hover:-translate-y-px transition-all duration-200 ease-[cubic-bezier(0.2,0,0,1)]"
                >
                  {question}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="flex w-full flex-col gap-3">
            {messages.map((message, index) => {
              const isUser = message.role === "user"
              const isLatestAssistant =
                !isUser && isGenerating && index === messages.length - 1

              return (
                <article
                  key={message.id}
                  className={`rounded-2xl border p-4 shadow-glass spring hover:-translate-y-px transition-all duration-200 ease-[cubic-bezier(0.2,0,0,1)] ${
                    isUser
                      ? "ml-6 md:ml-10 border-glass bg-white/55 backdrop-blur-glass"
                      : "mr-6 md:mr-10 border-glass bg-white/45 backdrop-blur-glass"
                  }`}
                >
                  <p className="mb-2 text-badge font-semibold uppercase tracking-wide text-navy-500">
                    {isUser ? "Query" : "Executive Analysis"}
                  </p>
                  {message.content ? (
                    <p className="whitespace-pre-wrap break-words text-body-sm leading-relaxed text-navy-900">
                      {message.content}
                      {isLatestAssistant && (
                        <span className="ml-1 inline-block animate-pulse text-navy-500">
                          ▌
                        </span>
                      )}
                    </p>
                  ) : (
                    <p className="text-body-sm text-navy-700">
                      {isLatestAssistant ? streamStatusText ?? "Generating report..." : "Awaiting response..."}
                    </p>
                  )}
                  {!isUser && message.sources.length > 0 && (
                    <div className="mt-3 border-t border-glass pt-3">
                      <p className="mb-2 text-badge font-semibold uppercase tracking-wide text-navy-500">
                        Source documents
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {message.sources.map((source, sourceIndex) => (
                          <button
                            key={`${source.filename}-${source.chunk_index}-${sourceIndex}`}
                            type="button"
                            onClick={() => setSelectedEvidence(source)}
                            className="rounded-xl border border-glass bg-white/50 backdrop-blur-glass px-2.5 py-1 text-caption text-navy-700 hover:shadow-glass hover:-translate-y-px transition-all duration-200 ease-[cubic-bezier(0.2,0,0,1)]"
                          >
                            {source.filename}
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
        <p className="pt-2 text-caption text-[var(--ws-danger)]">{streamError}</p>
      )}

      <footer className="shrink-0 pt-4">
        <div className="ws-input-bar flex items-end gap-2 focus-within:border-navy-500 focus-within:ring-1 focus-within:ring-navy-500/30">
          <textarea
            ref={textareaRef}
            value={chatInput}
            onChange={(event) => setChatInput(event.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask analytical query..."
            className="max-h-[140px] min-h-[22px] flex-1 resize-none bg-transparent text-body-sm text-navy-900 placeholder:text-navy-500 focus:outline-none"
            disabled={isGenerating}
            rows={1}
          />
          {isGenerating ? (
            <button
              type="button"
              onClick={cancelChatStream}
              className="inline-flex items-center gap-1 rounded-xl border border-red-200/80 bg-white/50 px-3 py-2 text-badge text-[var(--ws-danger)] hover:bg-red-50/60 transition-all duration-200 ease-[cubic-bezier(0.2,0,0,1)] shrink-0"
            >
              <Square className="h-3 w-3" />
              Stop
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSend}
              disabled={!chatInput.trim()}
              className="inline-flex items-center gap-1.5 bg-navy-700 hover:bg-navy-900 text-white text-button px-5 py-2.5 rounded-xl shadow-glass hover:shadow-glass-hover hover:-translate-y-px transition-all duration-200 ease-[cubic-bezier(0.2,0,0,1)] disabled:cursor-not-allowed disabled:opacity-40 shrink-0"
            >
              <Send className="h-3.5 w-3.5" />
              Send
            </button>
          )}
          {isGenerating && <Loader2 className="h-4 w-4 animate-spin text-navy-700 shrink-0" />}
        </div>
        <p className="mt-2 text-caption text-navy-500">
          Enter to send · Shift+Enter for new line
        </p>
      </footer>
    </section>
  )
}
