import axios from "axios"

const api = axios.create({
  baseURL: "http://localhost:8000",
  headers: { "Content-Type": "application/json" },
})

// ── Documents ──────────────────────────────────────────────────────────────

export const getDocuments = () =>
  api.get("/documents").then((r) => r.data.documents)

export const uploadDocument = (file) => {
  const form = new FormData()
  form.append("file", file)
  return api.post("/documents/upload", form, {
    headers: { "Content-Type": "multipart/form-data" },
  }).then((r) => r.data)
}

export const deleteDocument = (filename) =>
  api.delete(`/documents/${encodeURIComponent(filename)}`).then((r) => r.data)

// ── Query ──────────────────────────────────────────────────────────────────

export const queryDocuments = (payload) =>
  api.post("/query", payload).then((r) => r.data)

export const streamQuery = (question, topK = 4) =>
  new EventSource(
    `http://localhost:8000/query/stream?question=${encodeURIComponent(question)}&top_k=${topK}`
  )

export default api
