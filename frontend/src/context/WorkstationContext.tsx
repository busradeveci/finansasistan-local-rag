import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react"
import {
  getDocumentInventory,
  getMetadataFilters,
  streamQuery,
  uploadDocument,
  uploadErrorMessage,
  API_ORIGIN,
  type EvidenceChunk,
} from "@/api/client"
import { scrubAnswerForDisplay } from "@/lib/answerScrub"
import type {
  AppModule,
  ChatMessage,
  ConversationSession,
  DocumentInventoryRow,
  MetadataFacetOptions,
  MetadataFilters,
  SessionEvidenceState,
  UploadQueueItem,
  WorkstationAlert,
} from "@/types/workstation"

const DEFAULT_EVIDENCE_STATE: SessionEvidenceState = {
  activeMessageId: null,
  selectedEvidence: null,
}

const ALLOWED_EXTENSIONS = [".txt", ".md", ".pdf", ".docx", ".xlsx", ".csv"]
const ALLOWED_MIME_TYPES = new Set([
  "text/plain",
  "text/markdown",
  "text/x-markdown",
  "text/csv",
  "application/csv",
  "application/vnd.ms-excel",
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
])

function isAllowedUploadFile(file: File): boolean {
  const normalizedName = file.name.trim().toLowerCase()
  if (normalizedName.length === 0) return false

  if (ALLOWED_EXTENSIONS.some((ext) => normalizedName.endsWith(ext))) return true

  const mime = file.type.trim().toLowerCase().split(";")[0]
  return mime.length > 0 && ALLOWED_MIME_TYPES.has(mime)
}

const SOURCES_PREFIX = "[SOURCES]"
const STATUS_PREFIX = "[STATUS]"
const AGENT_PREFIX = "[AGENT]"

const DEFAULT_METADATA_FILTERS: MetadataFilters = {
  year: null,
  quarter: null,
  file_type: null,
}

const DEFAULT_METADATA_FACETS: MetadataFacetOptions = {
  years: [],
  quarters: [],
  file_types: [],
}

interface WorkstationContextValue {
  module: AppModule
  setModule: (m: AppModule) => void
  sessions: ConversationSession[]
  activeSessionId: string | null
  setActiveSessionId: (id: string | null) => void
  createSession: () => string
  deleteSession: (id: string) => void
  appendMessage: (sessionId: string, msg: ChatMessage) => void
  updateMessage: (sessionId: string, msgId: string, patch: Partial<ChatMessage>) => void
  appendToMessageContent: (sessionId: string, msgId: string, token: string) => void
  appendReasoningStep: (sessionId: string, msgId: string, text: string) => void
  selectedEvidence: EvidenceChunk | null
  setSelectedEvidence: (chunk: EvidenceChunk | null) => void
  setActiveEvidenceMessage: (sessionId: string, messageId: string | null) => void
  focusEvidenceCitation: (sessionId: string, messageId: string, ref: number) => void
  getSessionEvidenceSources: (sessionId: string | null) => EvidenceChunk[]
  recentDocuments: string[]
  addRecentDocument: (name: string) => void
  documentInventory: DocumentInventoryRow[]
  documentIndex: { vectors: number; dimensions: number } | null
  documentInventoryLoading: boolean
  documentInventoryError: string | null
  refreshDocumentInventory: () => Promise<void>
  metadataFilters: MetadataFilters
  metadataFacets: MetadataFacetOptions
  hasActiveMetadataFilters: boolean
  setMetadataFilter: (key: keyof MetadataFilters, value: string | null) => void
  clearMetadataFilters: () => void
  uploadQueue: UploadQueueItem[]
  uploadFiles: (files: FileList | File[]) => void
  isGenerating: boolean
  streamStatusText: string | null
  activeAgentBadge: string | null
  streamError: string | null
  chatInput: string
  setChatInput: (value: string) => void
  sendChatMessage: (question?: string) => void
  cancelChatStream: () => void
  hasBackgroundActivity: boolean
  alerts: WorkstationAlert[]
  pushAlert: (level: WorkstationAlert["level"], message: string) => void
  dismissAlert: (id: string) => void
}

const WorkstationContext = createContext<WorkstationContextValue | null>(null)

function nowLabel() {
  return new Date().toLocaleString([], {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

export function WorkstationProvider({ children }: { children: ReactNode }) {
  const [module, setModule] = useState<AppModule>("home")
  const [sessions, setSessions] = useState<ConversationSession[]>([])
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null)
  const [sessionEvidenceStates, setSessionEvidenceStates] = useState<
    Record<string, SessionEvidenceState>
  >({})
  const [recentDocuments, setRecentDocuments] = useState<string[]>([])

  const [documentInventory, setDocumentInventory] = useState<DocumentInventoryRow[]>([])
  const [documentIndex, setDocumentIndex] = useState<{ vectors: number; dimensions: number } | null>(null)
  const [documentInventoryLoading, setDocumentInventoryLoading] = useState(false)
  const [documentInventoryError, setDocumentInventoryError] = useState<string | null>(null)
  const [metadataFilters, setMetadataFilters] = useState<MetadataFilters>(DEFAULT_METADATA_FILTERS)
  const [metadataFacets, setMetadataFacets] = useState<MetadataFacetOptions>(DEFAULT_METADATA_FACETS)
  const [uploadQueue, setUploadQueue] = useState<UploadQueueItem[]>([])

  const [isGenerating, setIsGenerating] = useState(false)
  const [streamStatusText, setStreamStatusText] = useState<string | null>(null)
  const [activeAgentBadge, setActiveAgentBadge] = useState<string | null>(null)
  const [streamError, setStreamError] = useState<string | null>(null)
  const [chatInput, setChatInput] = useState("")
  const [alerts, setAlerts] = useState<WorkstationAlert[]>([])

  const esRef = useRef<EventSource | null>(null)
  const uploadBusyRef = useRef(false)
  const pendingFilesRef = useRef<File[]>([])

  const pushAlert = useCallback((level: WorkstationAlert["level"], message: string) => {
    const id = `alert-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
    setAlerts((prev) => [...prev, { id, level, message }])
    window.setTimeout(() => {
      setAlerts((prev) => prev.filter((a) => a.id !== id))
    }, 8000)
  }, [])

  const dismissAlert = useCallback((id: string) => {
    setAlerts((prev) => prev.filter((a) => a.id !== id))
  }, [])

  const refreshDocumentInventory = useCallback(async () => {
    setDocumentInventoryLoading(true)
    setDocumentInventoryError(null)
    try {
      const [{ documents, index }, facets] = await Promise.all([
        getDocumentInventory(),
        getMetadataFilters().catch(() => DEFAULT_METADATA_FACETS),
      ])
      setDocumentInventory(documents)
      setDocumentIndex(index)
      setMetadataFacets(facets)
    } catch (e: unknown) {
      const message =
        (e as { message?: string }).message === "Network Error"
          ? `Cannot reach the API at ${API_ORIGIN} — is the backend running on port 8000?`
          : "Failed to load document inventory"
      setDocumentInventoryError(message)
      pushAlert("error", message)
    } finally {
      setDocumentInventoryLoading(false)
    }
  }, [pushAlert])

  const hasActiveMetadataFilters = Boolean(
    metadataFilters.year || metadataFilters.quarter || metadataFilters.file_type
  )

  const setMetadataFilter = useCallback((key: keyof MetadataFilters, value: string | null) => {
    setMetadataFilters((prev) => ({ ...prev, [key]: value }))
  }, [])

  const clearMetadataFilters = useCallback(() => {
    setMetadataFilters(DEFAULT_METADATA_FILTERS)
  }, [])

  useEffect(() => {
    refreshDocumentInventory()
  }, [refreshDocumentInventory])

  const createSession = useCallback(() => {
    const id = `s-${Date.now()}`
    const session: ConversationSession = {
      id,
      label: `Analysis ${sessions.length + 1}`,
      date: nowLabel(),
      messages: [],
    }
    setSessions((prev) => [session, ...prev])
    setActiveSessionId(id)
    return id
  }, [sessions.length])

  const deleteSession = useCallback((id: string) => {
    setSessions((prev) => prev.filter((s) => s.id !== id))
    setActiveSessionId((cur) => (cur === id ? null : cur))
    setSessionEvidenceStates((prev) => {
      const next = { ...prev }
      delete next[id]
      return next
    })
  }, [])

  const getSessionEvidenceState = useCallback(
    (sessionId: string | null): SessionEvidenceState => {
      if (!sessionId) return DEFAULT_EVIDENCE_STATE
      return sessionEvidenceStates[sessionId] ?? DEFAULT_EVIDENCE_STATE
    },
    [sessionEvidenceStates]
  )

  const patchSessionEvidenceState = useCallback(
    (sessionId: string, patch: Partial<SessionEvidenceState>) => {
      setSessionEvidenceStates((prev) => ({
        ...prev,
        [sessionId]: { ...(prev[sessionId] ?? DEFAULT_EVIDENCE_STATE), ...patch },
      }))
    },
    []
  )

  const setSelectedEvidence = useCallback(
    (chunk: EvidenceChunk | null) => {
      if (!activeSessionId) return
      patchSessionEvidenceState(activeSessionId, { selectedEvidence: chunk })
    },
    [activeSessionId, patchSessionEvidenceState]
  )

  const setActiveEvidenceMessage = useCallback(
    (sessionId: string, messageId: string | null) => {
      patchSessionEvidenceState(sessionId, { activeMessageId: messageId })
    },
    [patchSessionEvidenceState]
  )

  const focusEvidenceCitation = useCallback(
    (sessionId: string, messageId: string, ref: number) => {
      const session = sessions.find((s) => s.id === sessionId)
      const message = session?.messages.find((m) => m.id === messageId)
      const chunk =
        message?.sources.find((s) => s.ref === ref) ??
        message?.sources[ref - 1] ??
        null
      patchSessionEvidenceState(sessionId, {
        activeMessageId: messageId,
        selectedEvidence: chunk,
      })
    },
    [sessions, patchSessionEvidenceState]
  )

  const getSessionEvidenceSources = useCallback(
    (sessionId: string | null): EvidenceChunk[] => {
      if (!sessionId) return []
      const session = sessions.find((s) => s.id === sessionId)
      if (!session) return []
      const { activeMessageId } = getSessionEvidenceState(sessionId)
      const activeMessage = activeMessageId
        ? session.messages.find((m) => m.id === activeMessageId)
        : null
      if (activeMessage?.sources.length) return activeMessage.sources
      const lastAssistant = [...session.messages]
        .reverse()
        .find((m) => m.role === "assistant" && m.sources.length > 0)
      return lastAssistant?.sources ?? []
    },
    [sessions, getSessionEvidenceState]
  )

  const selectedEvidence = getSessionEvidenceState(activeSessionId).selectedEvidence

  const appendMessage = useCallback((sessionId: string, msg: ChatMessage) => {
    setSessions((prev) =>
      prev.map((s) =>
        s.id === sessionId ? { ...s, messages: [...s.messages, msg] } : s
      )
    )
  }, [])

  const updateMessage = useCallback(
    (sessionId: string, msgId: string, patch: Partial<ChatMessage>) => {
      setSessions((prev) =>
        prev.map((s) =>
          s.id === sessionId
            ? {
                ...s,
                messages: s.messages.map((m) =>
                  m.id === msgId ? { ...m, ...patch } : m
                ),
              }
            : s
        )
      )
    },
    []
  )

  const addRecentDocument = useCallback((name: string) => {
    setRecentDocuments((prev) => [name, ...prev.filter((n) => n !== name)].slice(0, 8))
  }, [])

  const appendToMessageContent = useCallback(
    (sessionId: string, msgId: string, token: string) => {
      setSessions((prev) =>
        prev.map((s) =>
          s.id === sessionId
            ? {
                ...s,
                messages: s.messages.map((m) =>
                  m.id === msgId ? { ...m, content: m.content + token } : m
                ),
              }
            : s
        )
      )
    },
    []
  )

  const appendReasoningStep = useCallback(
    (sessionId: string, msgId: string, text: string) => {
      const time = new Date().toLocaleTimeString([], { hour12: false })
      setSessions((prev) =>
        prev.map((s) =>
          s.id === sessionId
            ? {
                ...s,
                messages: s.messages.map((m) =>
                  m.id === msgId
                    ? { ...m, reasoning: [...m.reasoning, { time, text }] }
                    : m
                ),
              }
            : s
        )
      )
    },
    []
  )

  const processUploadQueue = useCallback(async () => {
    if (uploadBusyRef.current) return
    uploadBusyRef.current = true

    while (pendingFilesRef.current.length > 0) {
      const file = pendingFilesRef.current.shift()!
      try {
        await uploadDocument(file)
        addRecentDocument(file.name)
        await refreshDocumentInventory()
        setUploadQueue((q) =>
          q.map((i) => (i.name === file.name ? { ...i, status: "success" } : i))
        )
        pushAlert("info", `${file.name} indexed successfully`)
      } catch (e: unknown) {
        const detail = uploadErrorMessage(e)
        setUploadQueue((q) =>
          q.map((i) =>
            i.name === file.name ? { ...i, status: "failed", detail } : i
          )
        )
        pushAlert("error", `Upload failed: ${file.name} — ${detail}`)
      }
      window.setTimeout(() => {
        setUploadQueue((q) =>
          q.filter((i) => i.name !== file.name || i.status === "failed")
        )
      }, 4000)
    }

    uploadBusyRef.current = false
  }, [addRecentDocument, refreshDocumentInventory, pushAlert])

  const uploadFiles = useCallback(
    (files: FileList | File[]) => {
      const incomingFiles = Array.from(files)
      const accepted: File[] = []
      let rejectedCount = 0

      for (const file of incomingFiles) {
        console.log("Ingesting file:", file.name, "MIME:", file.type)
        if (isAllowedUploadFile(file)) {
          accepted.push(file)
        } else {
          rejectedCount += 1
        }
      }

      if (accepted.length === 0) {
        pushAlert("warning", "No supported files selected (.txt, .md, .pdf, .docx, .xlsx, .csv)")
        return
      }

      if (rejectedCount > 0) {
        pushAlert(
          "warning",
          `${rejectedCount} unsupported file${rejectedCount === 1 ? "" : "s"} ignored`
        )
      }

      setUploadQueue((q) => [
        ...q,
        ...accepted.map((file) => ({ name: file.name, status: "indexing" as const })),
      ])
      pendingFilesRef.current.push(...accepted)
      void processUploadQueue()
    },
    [processUploadQueue, pushAlert]
  )

  const cancelChatStream = useCallback(() => {
    esRef.current?.close()
    esRef.current = null
    setIsGenerating(false)
    setStreamStatusText(null)
    setActiveAgentBadge(null)
  }, [])

  const sendChatMessage = useCallback(
    (question?: string) => {
      const text = (question ?? chatInput).trim()
      if (!text || isGenerating) return

      let sid = activeSessionId
      if (!sid) sid = createSession()

      setChatInput("")
      setStreamStatusText(null)
      setActiveAgentBadge(null)
      setStreamError(null)

      const userMsg: ChatMessage = {
        id: `u-${Date.now()}`,
        role: "user",
        content: text,
        sources: [],
        reasoning: [],
      }
      const asstId = `a-${Date.now()}`
      const asstMsg: ChatMessage = {
        id: asstId,
        role: "assistant",
        content: "",
        sources: [],
        reasoning: [],
      }
      appendMessage(sid, userMsg)
      appendMessage(sid, asstMsg)
      setIsGenerating(true)

      const es = streamQuery(text, 4, metadataFilters)
      esRef.current = es
      let sources: EvidenceChunk[] = []
      let accumulated = ""
      let agentBadge: string | null = null

      es.onmessage = (event) => {
        const data = event.data
        if (data.startsWith(SOURCES_PREFIX)) {
          try {
            sources = JSON.parse(data.slice(SOURCES_PREFIX.length))
          } catch {
            sources = []
          }
          const cleaned = scrubAnswerForDisplay(accumulated, sources.length > 0)
          updateMessage(sid!, asstId, {
            content: cleaned,
            sources,
            agentBadge: agentBadge ?? undefined,
          })
          patchSessionEvidenceState(sid!, {
            activeMessageId: asstId,
            selectedEvidence: sources[0] ?? null,
          })
          setIsGenerating(false)
          setStreamStatusText(null)
          setActiveAgentBadge(null)
          esRef.current = null
          es.close()
          return
        }
        if (data.startsWith(AGENT_PREFIX)) {
          agentBadge = data.slice(AGENT_PREFIX.length)
          setActiveAgentBadge(agentBadge)
          return
        }
        if (data.startsWith(STATUS_PREFIX)) {
          const st = data.slice(STATUS_PREFIX.length)
          setStreamStatusText(st)
          appendReasoningStep(sid!, asstId, st)
          return
        }
        setStreamStatusText(null)
        accumulated += data
        appendToMessageContent(sid!, asstId, data)
      }

      es.onerror = () => {
        es.close()
        esRef.current = null
        setIsGenerating(false)
        setStreamStatusText(null)
        setActiveAgentBadge(null)
        const message = `Chat stream interrupted — check that the backend is running on port 8000 (${API_ORIGIN})`
        setStreamError(message)
        pushAlert("error", message)
        updateMessage(sid!, asstId, {
          content: accumulated || message,
        })
      }
    },
    [
      chatInput,
      isGenerating,
      activeSessionId,
      createSession,
      appendMessage,
      updateMessage,
      appendToMessageContent,
      appendReasoningStep,
      pushAlert,
      patchSessionEvidenceState,
      metadataFilters,
    ]
  )

  const hasBackgroundActivity =
    isGenerating || uploadQueue.some((item) => item.status === "indexing")

  const value = useMemo(
    () => ({
      module,
      setModule,
      sessions,
      activeSessionId,
      setActiveSessionId,
      createSession,
      deleteSession,
      appendMessage,
      updateMessage,
      appendToMessageContent,
      appendReasoningStep,
      selectedEvidence,
      setSelectedEvidence,
      setActiveEvidenceMessage,
      focusEvidenceCitation,
      getSessionEvidenceSources,
      recentDocuments,
      addRecentDocument,
      documentInventory,
      documentIndex,
      documentInventoryLoading,
      documentInventoryError,
      refreshDocumentInventory,
      metadataFilters,
      metadataFacets,
      hasActiveMetadataFilters,
      setMetadataFilter,
      clearMetadataFilters,
      uploadQueue,
      uploadFiles,
      isGenerating,
      streamStatusText,
      activeAgentBadge,
      streamError,
      chatInput,
      setChatInput,
      sendChatMessage,
      cancelChatStream,
      hasBackgroundActivity,
      alerts,
      pushAlert,
      dismissAlert,
    }),
    [
      module,
      sessions,
      activeSessionId,
      selectedEvidence,
      recentDocuments,
      documentInventory,
      documentIndex,
      documentInventoryLoading,
      documentInventoryError,
      refreshDocumentInventory,
      metadataFilters,
      metadataFacets,
      hasActiveMetadataFilters,
      setMetadataFilter,
      clearMetadataFilters,
      uploadQueue,
      uploadFiles,
      isGenerating,
      streamStatusText,
      activeAgentBadge,
      streamError,
      chatInput,
      sendChatMessage,
      cancelChatStream,
      hasBackgroundActivity,
      alerts,
      pushAlert,
      dismissAlert,
      createSession,
      deleteSession,
      appendMessage,
      updateMessage,
      appendToMessageContent,
      appendReasoningStep,
      addRecentDocument,
      setSelectedEvidence,
      setActiveEvidenceMessage,
      focusEvidenceCitation,
      getSessionEvidenceSources,
      sessionEvidenceStates,
    ]
  )

  return (
    <WorkstationContext.Provider value={value}>{children}</WorkstationContext.Provider>
  )
}

export function useWorkstation() {
  const ctx = useContext(WorkstationContext)
  if (!ctx) throw new Error("useWorkstation must be used within WorkstationProvider")
  return ctx
}
