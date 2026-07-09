import { useEffect, useMemo, useRef } from "react"
import { Loader2, Send, Square } from "lucide-react"
import { useWorkstation } from "@/context/WorkstationContext"

const SAMPLE_QUESTIONS = [
  "BDDK e-ticaret harcama limitleri nedir?",
  "Dürtüsel harcamalarımı nasıl kısıtlarım?",
  "Kredi kartı faiz hesaplaması nasıl yapılır?",
]

export default function ConversationCanvas() {
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
    <section className="flex h-full min-h-0 flex-1 flex-col">
      <header className="shrink-0 border-b border-[var(--ws-border)] px-5 py-3">
        <div className="flex items-center justify-between">
          <h2 className="text-[13px] font-semibold text-[var(--ws-text)]">Analysis Workspace</h2>
          <span className="text-[11px] text-[var(--ws-text-secondary)]">
            {isGenerating ? streamStatusText ?? "Streaming..." : "Ready"}
          </span>
        </div>
      </header>

      <div className="fluent-scrollbar flex-1 min-h-0 overflow-y-auto px-5 py-4">
        {messages.length === 0 ? (
          <div className="mx-auto max-w-2xl space-y-4 py-10">
            <p className="text-[16px] font-semibold text-[var(--ws-text)]">
              Reporting console ready
            </p>
            <p className="text-[13px] text-[var(--ws-text-secondary)]">
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
                  className="ws-panel w-full px-3 py-2 text-left text-[12px] text-[var(--ws-text)] fluent-transition hover:border-[rgba(0,120,212,0.25)] hover:text-[var(--ws-primary)]"
                >
                  {question}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="mx-auto flex w-full max-w-3xl flex-col gap-3">
            {messages.map((message, index) => {
              const isUser = message.role === "user"
              const isLatestAssistant =
                !isUser && isGenerating && index === messages.length - 1

              return (
                <article
                  key={message.id}
                  className={`ws-panel p-3 ${isUser ? "ml-8" : "mr-8 border-[rgba(0,120,212,0.18)] bg-[#F7FBFF]"}`}
                >
                  <p className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-[var(--ws-text-secondary)]">
                    {isUser ? "Query" : "Executive Analysis"}
                  </p>
                  {message.content ? (
                    <p className="whitespace-pre-wrap break-words text-[13px] leading-relaxed text-[var(--ws-text)]">
                      {message.content}
                      {isLatestAssistant && (
                        <span className="ml-1 inline-block animate-pulse text-[var(--ws-primary)]">
                          ▌
                        </span>
                      )}
                    </p>
                  ) : (
                    <p className="text-[13px] text-[var(--ws-text-secondary)]">
                      {isLatestAssistant ? streamStatusText ?? "Generating report..." : "Awaiting response..."}
                    </p>
                  )}
                  {!isUser && message.sources.length > 0 && (
                    <div className="mt-3 border-t border-[var(--ws-border)] pt-2">
                      <p className="mb-1 text-[10px] uppercase tracking-wide text-[var(--ws-text-secondary)]">
                        Source documents
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {message.sources.map((source, sourceIndex) => (
                          <button
                            key={`${source.filename}-${source.chunk_index}-${sourceIndex}`}
                            type="button"
                            onClick={() => setSelectedEvidence(source)}
                            className="rounded-md border border-[rgba(0,120,212,0.2)] bg-[#EAF3FF] px-2 py-1 text-[11px] text-[var(--ws-primary)] hover:bg-[#DCEBFF]"
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
        <p className="px-5 pb-2 text-[11px] text-[var(--ws-danger)]">{streamError}</p>
      )}

      <footer className="shrink-0 border-t border-[var(--ws-border)] px-5 py-3">
        <div className="ws-input-bar flex items-end gap-2 px-3 py-2.5">
          <textarea
            ref={textareaRef}
            value={chatInput}
            onChange={(event) => setChatInput(event.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask a question grounded in indexed documents"
            className="max-h-[140px] min-h-[22px] flex-1 resize-none bg-transparent text-[13px] text-[var(--ws-text)] placeholder:text-[var(--ws-text-secondary)] focus:outline-none"
            disabled={isGenerating}
            rows={1}
          />
          {isGenerating ? (
            <button
              type="button"
              onClick={cancelChatStream}
              className="inline-flex items-center gap-1 rounded-md border border-[rgba(209,52,56,0.25)] px-2 py-1 text-[11px] font-medium text-[var(--ws-danger)] hover:bg-[rgba(209,52,56,0.08)]"
            >
              <Square className="h-3 w-3" />
              Stop
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSend}
              disabled={!chatInput.trim()}
              className="inline-flex items-center gap-1 rounded-md bg-[var(--ws-primary)] px-2.5 py-1.5 text-[12px] font-medium text-white hover:bg-[var(--ws-primary-hover)] disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Send className="h-3.5 w-3.5" />
              Send
            </button>
          )}
          {isGenerating && <Loader2 className="h-4 w-4 animate-spin text-[var(--ws-primary)]" />}
        </div>
        <p className="mt-1.5 text-[10px] text-[var(--ws-text-secondary)]">
          Enter to send · Shift+Enter for new line
        </p>
      </footer>
    </section>
  )
}
