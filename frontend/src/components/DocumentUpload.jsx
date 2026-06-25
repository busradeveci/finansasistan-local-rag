import { useEffect, useRef, useState } from "react"
import { deleteDocument, getDocuments, uploadDocument } from "@/api/client"
import { FileText, Trash2, Upload } from "lucide-react"

const ALLOWED = [".txt", ".md", ".pdf", ".docx"]

export default function DocumentUpload() {
  const [documents, setDocuments] = useState([])
  const [uploading, setUploading] = useState(false)
  const [deletingFile, setDeletingFile] = useState(null)
  const [error, setError] = useState(null)
  const [dragOver, setDragOver] = useState(false)
  const inputRef = useRef(null)

  const fetchDocs = async () => {
    try {
      const docs = await getDocuments()
      setDocuments(docs)
    } catch {
      setDocuments([])
      setError("Backend'e bağlanılamadı. Uvicorn çalışıyor mu?")
    }
  }

  useEffect(() => { fetchDocs() }, [])

  const handleFile = async (file) => {
    if (!file) return
    const ext = "." + file.name.split(".").pop().toLowerCase()
    if (!ALLOWED.includes(ext)) {
      setError(`Desteklenmeyen tür: ${ext}. İzin verilenler: ${ALLOWED.join(", ")}`)
      return
    }
    setError(null)
    setUploading(true)
    try {
      await uploadDocument(file)
      await fetchDocs()
    } catch (e) {
      const detail = e?.response?.data?.detail
      setError(typeof detail === "string" ? detail : "Yükleme başarısız.")
    } finally {
      setUploading(false)
      if (inputRef.current) inputRef.current.value = ""
    }
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setDragOver(false)
    handleFile(e.dataTransfer.files?.[0])
  }

  const handleDelete = async (filename) => {
    setDocuments(prev => prev.filter(d => d.filename !== filename))
    setDeletingFile(filename)
    setError(null)
    try {
      await deleteDocument(filename)
    } catch {
      await fetchDocs()
      setError("Silme işlemi başarısız.")
    } finally {
      setDeletingFile(null)
    }
  }

  return (
    <div className="flex flex-col gap-2">

      <button
        type="button"
        onClick={() => !uploading && inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        disabled={uploading}
        className={[
          "w-full fluent-border fluent-transition px-3 py-3 text-left text-[12px] rounded-sm",
          uploading
            ? "cursor-not-allowed opacity-60 fluent-acrylic-subtle"
            : dragOver
            ? "fluent-acrylic border-[rgba(0,120,212,0.3)]"
            : "fluent-acrylic-subtle hover:border-[rgba(0,0,0,0.1)] cursor-pointer",
        ].join(" ")}
      >
        <input ref={inputRef} type="file" accept={ALLOWED.join(",")}
          className="hidden" onChange={e => handleFile(e.target.files?.[0])} />
        <div className="flex items-center gap-2 text-[var(--fluent-text-muted)]">
          <Upload className="h-4 w-4 shrink-0 text-[#0078d4]" strokeWidth={1.5} />
          {uploading ? (
            <span>Belge vektörleştiriliyor…</span>
          ) : (
            <span>Belge içe aktar · {ALLOWED.join(" · ")}</span>
          )}
        </div>
      </button>

      {error && (
        <p className="text-[11px] text-[#c42b1c] pl-1">{error}</p>
      )}

      <div className="fluent-border-t pt-2 mt-1">
        <p className="text-[11px] font-semibold text-[#2c3e50] mb-2">Dosyalar</p>
        {documents.length === 0 && !uploading ? (
          <p className="text-[11px] text-[var(--fluent-text-muted)] pl-1">Henüz belge yok</p>
        ) : (
          <ul className="flex flex-col">
            {documents.map((doc) => (
              <li
                key={doc.filename}
                className="group flex items-center gap-2 py-1.5 px-1 fluent-transition hover:bg-[rgba(0,0,0,0.03)] rounded-sm"
              >
                <FileText className="h-4 w-4 shrink-0 text-[#0078d4]" strokeWidth={1.5} />
                <span className="flex-1 truncate text-[12px] text-[var(--fluent-text)]">{doc.filename}</span>
                <button
                  type="button"
                  onClick={() => handleDelete(doc.filename)}
                  disabled={deletingFile === doc.filename}
                  title={`${doc.filename} sil`}
                  className="shrink-0 p-1 rounded-sm opacity-0 group-hover:opacity-100 fluent-transition text-[var(--fluent-text-muted)] hover:bg-[rgba(0,0,0,0.05)] hover:text-[#c42b1c]"
                >
                  <Trash2 className="h-3.5 w-3.5" strokeWidth={1.5} />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
