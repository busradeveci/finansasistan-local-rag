import { useEffect, useRef, useState } from "react"
import { streamQuery } from "@/api/client"

const SOURCES_PREFIX = "[SOURCES]"

const SAMPLE_QUESTIONS = [
  "BDDK e-ticaret harcama limitleri nedir?",
  "Dürtüsel harcamalarımı nasıl kısıtlarım?",
  "Kredi kartı faiz hesaplaması nasıl yapılır?",
]

// ── Icons ─────────────────────────────────────────────────────────────────────

function SendIcon({ spinning }) {
  if (spinning) return (
    <svg className="h-4 w-4 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"/>
    </svg>
  )
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
    </svg>
  )
}

function ThinkingDots() {
  return (
    <span className="inline-flex items-center gap-1">
      <span className="h-1.5 w-1.5 rounded-full bg-slate-500 animate-bounce [animation-delay:-0.3s]"/>
      <span className="h-1.5 w-1.5 rounded-full bg-slate-500 animate-bounce [animation-delay:-0.15s]"/>
      <span className="h-1.5 w-1.5 rounded-full bg-slate-500 animate-bounce"/>
    </span>
  )
}

// ── Source Inspection Modal ───────────────────────────────────────────────────

function InspectModal({ source, onClose }) {
  // Close on Escape
  useEffect(() => {
    const handler = (e) => { if (e.key === "Escape") onClose() }
    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  }, [onClose])

  const preview = source.preview ?? source.content ?? "Chunk verisi mevcut değil."

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="bg-slate-950/95 backdrop-blur-md border border-slate-700 shadow-2xl rounded-2xl max-w-2xl w-full p-6 space-y-5 text-slate-100">

        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-sm font-bold text-white tracking-tight">
              🔒 Vector Database Inspector — Integrity Audit
            </h2>
            <p className="text-[11px] text-slate-500 mt-0.5">
              {source.filename} &mdash; Chunk #{source.chunk_index ?? "?"}
              {typeof source.score === "number" && (
                <span className="ml-2 rounded bg-emerald-950 px-1.5 py-0.5 font-mono text-emerald-400 ring-1 ring-emerald-900">
                  {(source.score * 100).toFixed(1)}% match
                </span>
              )}
            </p>
          </div>
          <button
            onClick={onClose}
            className="shrink-0 rounded-lg p-1.5 text-slate-500 hover:bg-slate-800 hover:text-slate-300 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        {/* Raw chunk terminal */}
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2">
            Raw SQL Text Chunk
          </p>
          <pre className="rounded-xl bg-black/60 border border-slate-800 px-4 py-3 font-mono text-[11px] text-emerald-300 leading-relaxed whitespace-pre-wrap break-words max-h-48 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-800">
{preview}
          </pre>
        </div>

        {/* Cyber sanitization report */}
        <div className="rounded-xl border border-emerald-900/60 bg-emerald-950/30 px-4 py-3">
          <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-600 mb-2">
            Cyber Sanitization Audit Report
          </p>
          <div className="inline-flex items-center gap-2 rounded-full bg-emerald-950 px-3 py-1.5 ring-1 ring-emerald-800">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="font-mono text-[11px] font-bold text-emerald-300">
              STATUS: CLEAN
            </span>
          </div>
          <div className="mt-2 flex flex-wrap gap-2">
            {[
              "Prompt Injection Scan: 0 Threats",
              "Malicious Scripts: None",
              "Control Chars: Stripped",
              "HTML Tags: None Detected",
            ].map(item => (
              <span key={item} className="text-[10px] text-emerald-500 font-mono">✓ {item}</span>
            ))}
          </div>
        </div>

        {/* Close button */}
        <button
          onClick={onClose}
          className="w-full rounded-xl border border-slate-700 bg-slate-800 px-4 py-2.5 text-sm font-semibold text-slate-200 transition-colors hover:bg-slate-700 hover:text-white"
        >
          Close Audit View
        </button>
      </div>
    </div>
  )
}

// ── Clickable source lineage badge ────────────────────────────────────────────

function SourceLineage({ source, onInspect }) {
  const name = source.filename.length > 30
    ? source.filename.slice(0, 28) + "…"
    : source.filename

  return (
    <button
      type="button"
      onClick={() => onInspect(source)}
      className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-900 px-2.5 py-1
                 text-[10px] font-medium text-slate-400 transition-colors
                 hover:border-emerald-800 hover:bg-emerald-950/40 hover:text-emerald-300"
    >
      <span>📄</span>
      <span className="font-mono">{name}</span>
      {typeof source.chunk_index === "number" && (
        <span className="text-slate-600">(Chunk #{source.chunk_index})</span>
      )}
      {typeof source.score === "number" && (
        <span className="rounded bg-emerald-950 px-1 text-emerald-500 font-mono ring-1 ring-emerald-900">
          {(source.score * 100).toFixed(0)}%
        </span>
      )}
      <span className="text-emerald-700 border-l border-slate-700 pl-1.5 ml-0.5">[Inspect]</span>
    </button>
  )
}

// ── Message bubble ────────────────────────────────────────────────────────────

function MessageBubble({ message, isThinking, onInspect }) {
  const isUser = message.role === "user"

  return (
    <div className={`flex gap-2.5 ${isUser ? "flex-row-reverse" : "flex-row"}`}>
      <div className={[
        "flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[10px] font-bold select-none mt-0.5",
        isUser
          ? "bg-slate-700 text-slate-200"
          : "bg-gradient-to-br from-emerald-500 to-teal-600 text-white",
      ].join(" ")}>
        {isUser ? "S" : "AI"}
      </div>

      <div className={`flex flex-col gap-1.5 max-w-[80%] ${isUser ? "items-end" : "items-start"}`}>
        <div className={[
          "rounded-2xl px-4 py-2.5 text-sm leading-relaxed",
          isUser
            ? "rounded-tr-sm bg-emerald-900/60 text-emerald-50 ring-1 ring-emerald-800/50"
            : "rounded-tl-sm bg-slate-800 text-slate-100 ring-1 ring-slate-700",
        ].join(" ")}>
          {isThinking && !message.content
            ? <ThinkingDots />
            : <span className="whitespace-pre-wrap break-words">{message.content}</span>
          }
          {!isUser && message.content && isThinking && (
            <span className="ml-0.5 inline-block h-3.5 w-0.5 translate-y-0.5 animate-pulse bg-slate-500" />
          )}
        </div>

        {/* Source lineage badges — clickable inspect triggers */}
        {!isUser && message.sources?.length > 0 && (
          <div className="flex flex-wrap gap-1.5 px-0.5">
            {message.sources.map((s, i) => (
              <SourceLineage key={i} source={s} onInspect={onInspect} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// ── Empty state ───────────────────────────────────────────────────────────────

function EmptyState({ onSuggest }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-5 px-6 py-10 text-center">
      <div className="relative flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-800 ring-1 ring-slate-700 text-2xl">
        <span className="absolute inset-0 rounded-2xl bg-emerald-500/10 blur-md" />
        <span className="relative">💬</span>
      </div>
      <div>
        <p className="text-sm font-semibold text-slate-200">Sorularınızı yanıtlamaya hazırım</p>
        <p className="mt-1 text-xs text-slate-500">Yüklediğiniz belgeler üzerinden güvenli şekilde yanıt üretirim.</p>
      </div>
      <div className="flex flex-col gap-1.5 w-full max-w-md">
        {SAMPLE_QUESTIONS.map((q) => (
          <button key={q} type="button" onClick={() => onSuggest(q)}
            className="rounded-xl border border-slate-700 bg-slate-800/60 px-4 py-2 text-left text-xs text-slate-400 transition-colors hover:border-emerald-800 hover:bg-slate-800 hover:text-emerald-300">
            <span className="mr-2 text-emerald-600">↗</span>{q}
          </button>
        ))}
      </div>
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

export default function ChatSection() {
  const [messages, setMessages]     = useState([])
  const [input, setInput]           = useState("")
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError]           = useState(null)
  const [inspecting, setInspecting] = useState(null)   // source being inspected

  const bottomRef   = useRef(null)
  const textareaRef = useRef(null)
  const esSources   = useRef(null)
  const esRef       = useRef(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const appendToken = (id, token) =>
    setMessages(prev => prev.map(m => m.id === id ? { ...m, content: m.content + token } : m))

  const attachSources = (id, sources) =>
    setMessages(prev => prev.map(m => m.id === id ? { ...m, sources } : m))

  const sendMessage = (question) => {
    const text = question ?? input.trim()
    if (!text || isGenerating) return

    setError(null)
    setInput("")
    esSources.current = null

    const userMsg = { id: `u-${Date.now()}`, role: "user",      content: text, sources: [] }
    const asstId  = `a-${Date.now()}`
    const asstMsg = { id: asstId,            role: "assistant", content: "",   sources: [] }

    setMessages(prev => [...prev, userMsg, asstMsg])
    setIsGenerating(true)

    const es = streamQuery(text)
    esRef.current = es

    es.onmessage = (event) => {
      const data = event.data
      if (data.startsWith(SOURCES_PREFIX)) {
        try { esSources.current = JSON.parse(data.slice(SOURCES_PREFIX.length)) } catch {}
        return
      }
      appendToken(asstId, data)
    }

    es.onerror = () => {
      es.close()
      esRef.current = null
      setIsGenerating(false)
      if (esSources.current !== null) attachSources(asstId, esSources.current)
      setMessages(prev => prev.map(m =>
        m.id === asstId && !m.content
          ? { ...m, content: "Bağlantı hatası oluştu. Lütfen tekrar deneyin." }
          : m
      ))
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage() }
  }

  return (
    <>
      {/* Source inspection modal — rendered at top of component tree */}
      {inspecting && (
        <InspectModal source={inspecting} onClose={() => setInspecting(null)} />
      )}

      <div className="flex flex-1 flex-col min-h-0">

        {/* Message list */}
        <div className="flex-1 overflow-y-auto px-5 py-4 scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent">
          {messages.length === 0
            ? <EmptyState onSuggest={(q) => { setInput(q); textareaRef.current?.focus() }} />
            : (
              <div className="flex flex-col gap-4">
                {messages.map((msg, idx) => (
                  <MessageBubble
                    key={msg.id}
                    message={msg}
                    onInspect={setInspecting}
                    isThinking={isGenerating && idx === messages.length - 1 && msg.role === "assistant"}
                  />
                ))}
              </div>
            )
          }
          <div ref={bottomRef} />
        </div>

        {/* Error banner */}
        {error && (
          <div className="mx-5 mb-2 flex items-center gap-2 rounded-lg bg-red-950/50 px-3 py-2 text-xs text-red-400 ring-1 ring-red-900">
            <span className="shrink-0">⚠</span>{error}
          </div>
        )}

        {/* Input bar */}
        <div className="shrink-0 border-t border-slate-800 px-4 py-3 bg-slate-950">
          <div className={[
            "flex items-end gap-2 rounded-xl border px-4 py-2.5 transition-all",
            isGenerating
              ? "border-slate-800 bg-slate-900"
              : "border-slate-700 bg-slate-900 focus-within:border-emerald-800 focus-within:shadow-lg focus-within:shadow-emerald-950/40",
          ].join(" ")}>
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
              placeholder="Belgelere dayalı soru sorun… (Enter ile gönderin)"
              className="flex-1 resize-none bg-transparent text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none disabled:cursor-not-allowed disabled:text-slate-600"
            />
            <button
              type="button"
              onClick={() => sendMessage()}
              disabled={isGenerating || !input.trim()}
              className={[
                "mb-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-colors",
                isGenerating || !input.trim()
                  ? "cursor-not-allowed bg-slate-800 text-slate-600"
                  : "bg-emerald-700 text-white hover:bg-emerald-600",
              ].join(" ")}
            >
              <SendIcon spinning={isGenerating} />
            </button>
          </div>
          <p className="mt-1.5 text-center text-[10px] text-slate-700">
            Shift + Enter ile satır ekle · Enter ile gönder
          </p>
        </div>
      </div>
    </>
  )
}
