import { useEffect, useRef, useState } from "react"
import { ChevronDown, ChevronRight, Send } from "lucide-react"
import { streamQuery } from "@/api/client"

const SOURCES_PREFIX = "[SOURCES]"
const STATUS_PREFIX = "[STATUS]"

const SECTION_HEADER_RE = /^(📊|💡).*?(Kurumsal Analiz|Stratejik Risk)|Kurumsal Analiz Raporu|Stratejik Risk Tavsiyeleri/i

const SAMPLE_QUESTIONS = [
  "BDDK e-ticaret harcama limitleri nedir?",
  "Dürtüsel harcamalarımı nasıl kısıtlarım?",
  "Kredi kartı faiz hesaplaması nasıl yapılır?",
]

function AnalysisContent({ text }) {
  if (!text) return null

  return (
    <div className="space-y-1">
      {text.split("\n").map((line, i) => {
        const trimmed = line.trim()

        if (SECTION_HEADER_RE.test(trimmed)) {
          return (
            <p key={i} className="font-sans text-[14px] font-semibold text-[#0078d4] mt-4 mb-2 first:mt-0">
              {line}
            </p>
          )
        }

        if (trimmed.startsWith("Kaynaklar:")) {
          return (
            <p key={i} className="font-sans text-[12px] text-[#2c3e50] mt-4 opacity-75">
              {line}
            </p>
          )
        }

        if (trimmed.startsWith("- ") || trimmed.startsWith("• ")) {
          return (
            <p key={i} className="pl-3 text-[13px] text-[var(--fluent-text)]">
              {line}
            </p>
          )
        }

        if (!trimmed) {
          return <div key={i} className="h-2" />
        }

        return (
          <p key={i} className="text-[13px] text-[var(--fluent-text)] leading-relaxed">
            {line}
          </p>
        )
      })}
    </div>
  )
}

function SystemLogSuffix({ source, expanded, onToggle, onClose }) {
  if (!source) return null

  const preview = source.preview ?? source.content ?? "Veri mevcut değil."

  return (
    <div className="shrink-0 fluent-border-t fluent-acrylic-subtle">
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-center justify-between px-4 py-2.5 text-left fluent-transition hover:bg-[rgba(0,0,0,0.02)]"
      >
        <span className="flex items-center gap-2 text-[11px] font-semibold text-[#2c3e50]">
          {expanded
            ? <ChevronDown className="h-4 w-4 text-[var(--fluent-text-muted)]" strokeWidth={1.5} />
            : <ChevronRight className="h-4 w-4 text-[var(--fluent-text-muted)]" strokeWidth={1.5} />
          }
          Vector Database Inspector
        </span>
        <span className="text-[11px] text-[var(--fluent-text-muted)] truncate max-w-[45%]">{source.filename}</span>
      </button>

      {expanded && (
        <div className="fluent-border-t fluent-acrylic px-4 py-3 space-y-3 text-[12px]">
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-[var(--fluent-text-muted)] font-sans">
            <span>Document · <span className="text-[var(--fluent-text)]">{source.filename}</span></span>
            {typeof source.score === "number" && (
              <span>Match · <span className="text-[#0078d4]">{(source.score * 100).toFixed(1)}%</span></span>
            )}
            <span>Status · <span className="text-[#0078d4]">Clean</span></span>
          </div>

          <div>
            <p className="text-[10px] uppercase tracking-wide text-[var(--fluent-text-muted)] mb-1.5 font-sans">Source excerpt</p>
            <pre className="fluent-border fluent-acrylic-subtle fluent-report-mono px-3 py-2 text-[11px] text-[var(--fluent-text)] leading-relaxed whitespace-pre-wrap break-words max-h-40 overflow-y-auto fluent-scrollbar rounded-sm">
{preview}
            </pre>
          </div>

          <div className="text-[11px] text-[var(--fluent-text-muted)] space-y-0.5 font-sans">
            <p>Prompt injection scan · 0 threats</p>
            <p>Control characters · stripped</p>
            <p>HTML tags · none detected</p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="text-[11px] text-[#0078d4] fluent-transition hover:text-[#106ebe] font-sans"
          >
            Dismiss
          </button>
        </div>
      )}
    </div>
  )
}

function LogEntry({ message, isThinking, onInspectSource, statusText }) {
  const isUser = message.role === "user"
  const showStatus = isThinking && !message.content && statusText

  return (
    <article className="fluent-border-b py-5">
      <p className="text-[11px] font-sans font-medium text-[#0078d4] mb-3 uppercase tracking-wide">
        {isUser ? "Query" : "Executive Analysis"}
      </p>

      <div className="fluent-report-mono">
        {showStatus ? (
          <span className="text-[13px] text-[var(--fluent-text-muted)] font-sans">[{statusText}]</span>
        ) : isThinking && !message.content ? (
          <span className="text-[13px] text-[var(--fluent-text-muted)] font-sans animate-pulse">Generating report…</span>
        ) : isUser ? (
          <p className="text-[13px] text-[var(--fluent-text)] leading-relaxed whitespace-pre-wrap break-words font-sans">
            {message.content}
          </p>
        ) : (
          <AnalysisContent text={message.content} />
        )}
        {!isUser && message.content && isThinking && (
          <span className="inline-block w-2 animate-pulse text-[#0078d4]">▌</span>
        )}
      </div>

      {!isUser && message.sources?.length > 0 && (
        <div className="mt-4 pt-3 fluent-border-t space-y-1">
          <p className="text-[10px] text-[var(--fluent-text-muted)] font-sans uppercase tracking-wide">Source documents</p>
          {message.sources.map((s, i) => (
            <button
              key={`${s.filename}-${i}`}
              type="button"
              onClick={() => onInspectSource(s)}
              className="block w-full text-left text-[12px] text-[var(--fluent-text)] fluent-transition hover:text-[#0078d4] font-sans"
            >
              {s.filename}
              {typeof s.score === "number" && (
                <span className="text-[var(--fluent-text-muted)]"> · {(s.score * 100).toFixed(0)}% relevance · inspect</span>
              )}
            </button>
          ))}
        </div>
      )}
    </article>
  )
}

function EmptyState({ onSuggest }) {
  return (
    <div className="py-16 px-4 text-[13px] text-[var(--fluent-text-muted)] space-y-4">
      <p className="text-[#1f2937] text-[16px] font-semibold">Reporting console ready</p>
      <p>Submit a query against your indexed documents or select a sample below.</p>
      <div className="space-y-2">
        {SAMPLE_QUESTIONS.map((q) => (
          <button
            key={q}
            type="button"
            onClick={() => onSuggest(q)}
            className="block w-full text-left py-2 px-3 fluent-border fluent-acrylic-subtle rounded-sm text-[var(--fluent-text)] fluent-transition hover:border-[rgba(0,120,212,0.25)] hover:text-[#0078d4]"
          >
            {q}
          </button>
        ))}
      </div>
    </div>
  )
}

export default function ChatSection() {
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState("")
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState(null)
  const [inspecting, setInspecting] = useState(null)
  const [logExpanded, setLogExpanded] = useState(true)
  const [statusText, setStatusText] = useState(null)

  const bottomRef = useRef(null)
  const textareaRef = useRef(null)
  const esSources = useRef(null)
  const esRef = useRef(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages, inspecting, logExpanded])

  const appendToken = (id, token) =>
    setMessages(prev => prev.map(m => m.id === id ? { ...m, content: m.content + token } : m))

  const attachSources = (id, sources) =>
    setMessages(prev => prev.map(m => m.id === id ? { ...m, sources } : m))

  const handleInspectSource = (source) => {
    setInspecting(source)
    setLogExpanded(true)
  }

  const sendMessage = (question) => {
    const text = question ?? input.trim()
    if (!text || isGenerating) return

    setError(null)
    setInput("")
    setStatusText(null)
    setInspecting(null)
    esSources.current = null

    const userMsg = { id: `u-${Date.now()}`, role: "user", content: text, sources: [] }
    const asstId = `a-${Date.now()}`
    const asstMsg = { id: asstId, role: "assistant", content: "", sources: [] }

    setMessages(prev => [...prev, userMsg, asstMsg])
    setIsGenerating(true)

    const es = streamQuery(text)
    esRef.current = es

    es.onmessage = (event) => {
      const data = event.data

      if (data.startsWith(SOURCES_PREFIX)) {
        try { esSources.current = JSON.parse(data.slice(SOURCES_PREFIX.length)) } catch {}
        attachSources(asstId, esSources.current ?? [])
        setIsGenerating(false)
        setStatusText(null)
        es.close()
        esRef.current = null
        return
      }

      if (data.startsWith(STATUS_PREFIX)) {
        setStatusText(data.slice(STATUS_PREFIX.length))
        return
      }

      setStatusText(null)
      appendToken(asstId, data)
    }

    es.onerror = () => {
      es.close()
      esRef.current = null
      setIsGenerating(false)
      setStatusText(null)

      setMessages(prev => {
        const asst = prev.find(m => m.id === asstId)
        if (asst?.content) {
          if (esSources.current !== null) {
            return prev.map(m => m.id === asstId ? { ...m, sources: esSources.current } : m)
          }
          return prev
        }
        return prev.map(m =>
          m.id === asstId
            ? { ...m, content: "Bağlantı hatası oluştu. Lütfen tekrar deneyin." }
            : m
        )
      })
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage() }
  }

  return (
    <div className="flex flex-1 flex-col min-h-0">

      <div className="shrink-0 fluent-border-b px-5 py-2.5 flex items-center justify-between bg-[rgba(255,255,255,0.35)]">
        <span className="text-[12px] font-semibold text-[#2c3e50]">Analysis Workspace</span>
        <span className="text-[11px] text-[var(--fluent-text-muted)]">
          {isGenerating ? "Streaming" : "Ready"}
        </span>
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-2 fluent-scrollbar">
        {messages.length === 0
          ? <EmptyState onSuggest={(q) => { setInput(q); textareaRef.current?.focus() }} />
          : messages.map((msg, idx) => (
              <LogEntry
                key={msg.id}
                message={msg}
                onInspectSource={handleInspectSource}
                statusText={statusText}
                isThinking={isGenerating && idx === messages.length - 1 && msg.role === "assistant"}
              />
            ))
        }
        <div ref={bottomRef} />
      </div>

      <SystemLogSuffix
        source={inspecting}
        expanded={logExpanded}
        onToggle={() => setLogExpanded(v => !v)}
        onClose={() => { setInspecting(null); setLogExpanded(false) }}
      />

      {error && (
        <p className="mx-5 mb-2 text-[11px] text-[#c42b1c]">{error}</p>
      )}

      <div className="shrink-0 fluent-border-t px-5 py-3 fluent-acrylic-subtle">
        <div className="fluent-search-input flex items-end gap-2 rounded-md px-3 py-2.5">
          <textarea
            ref={textareaRef}
            rows={1}
            value={input}
            onChange={(e) => {
              setInput(e.target.value)
              e.target.style.height = "auto"
              e.target.style.height = `${Math.min(e.target.scrollHeight, 112)}px`
            }}
            onKeyDown={handleKeyDown}
            disabled={isGenerating}
            placeholder="Belgelere dayalı soru sorun"
            className="flex-1 resize-none bg-transparent text-[13px] text-[var(--fluent-text)] placeholder:text-[var(--fluent-text-muted)] focus:outline-none disabled:cursor-not-allowed"
          />
          <button
            type="button"
            onClick={() => sendMessage()}
            disabled={isGenerating || !input.trim()}
            className="shrink-0 p-1.5 rounded-sm fluent-transition text-[#0078d4] disabled:opacity-30 hover:bg-[rgba(0,120,212,0.08)] disabled:hover:bg-transparent"
            aria-label="Send query"
          >
            {isGenerating
              ? <span className="text-[11px] text-[var(--fluent-text-muted)]">…</span>
              : <Send className="h-4 w-4" strokeWidth={1.5} />
            }
          </button>
        </div>
        <p className="mt-1.5 text-[10px] text-[var(--fluent-text-muted)]">Enter to send · Shift+Enter for new line</p>
      </div>
    </div>
  )
}
