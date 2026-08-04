import { useCallback, useEffect, useRef, useState } from "react"
import { createPortal } from "react-dom"
import { ChevronDown, Check, FileText, RefreshCw } from "lucide-react"
import { useWorkstation } from "@/context/WorkstationContext"

const GLASS_BTN =
  "flex items-center gap-1.5 bg-white/80 border border-white/80 rounded-xl px-3 py-1.5 text-xs text-[#0F172A] shadow-[0_4px_12px_rgba(40,60,90,0.06)] backdrop-blur-md hover:bg-white/90 transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#000080]/30"

interface DropdownRect {
  top: number
  right: number
  minWidth: number
}

export default function TargetSourceSelect() {
  const {
    targetSource,
    setTargetSource,
    documentInventory,
    documentInventoryLoading,
    refreshDocumentInventory,
  } = useWorkstation()

  const [open, setOpen] = useState(false)
  const [rect, setRect] = useState<DropdownRect | null>(null)

  const btnRef = useRef<HTMLButtonElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  const filenames = documentInventory.map((doc) => doc.filename).sort()
  const activeLabel = targetSource ?? "All Documents"
  const docCount = filenames.length

  // Calculate fixed position from button rect whenever we open
  const recalcRect = useCallback(() => {
    if (!btnRef.current) return
    const b = btnRef.current.getBoundingClientRect()
    setRect({
      top: b.bottom + 6,   // 6px gap below button
      right: window.innerWidth - b.right,
      minWidth: Math.max(b.width, 256),
    })
  }, [])

  const handleOpen = () => {
    if (!open) recalcRect()
    setOpen((v) => !v)
  }

  // Close on outside click
  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      const target = e.target as Node
      if (
        btnRef.current?.contains(target) ||
        menuRef.current?.contains(target)
      ) {
        return
      }
      setOpen(false)
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [open])

  // Close on scroll / resize to prevent stale position
  useEffect(() => {
    if (!open) return
    const close = () => setOpen(false)
    window.addEventListener("scroll", close, true)
    window.addEventListener("resize", close)
    return () => {
      window.removeEventListener("scroll", close, true)
      window.removeEventListener("resize", close)
    }
  }, [open])

  const dropdown = open && rect ? (
    <div
      ref={menuRef}
      role="listbox"
      aria-label="Knowledge sources"
      style={{
        position: "fixed",
        top: rect.top,
        right: rect.right,
        minWidth: rect.minWidth,
        zIndex: 9999,
      }}
      className="w-64 overflow-hidden rounded-2xl bg-white/95 backdrop-blur-xl border border-white/80 shadow-[0_16px_40px_rgba(40,60,90,0.18),0_4px_12px_rgba(0,0,0,0.08)]"
    >
      {/* Dropdown header */}
      <div className="flex items-center justify-between border-b border-slate-100/80 px-3.5 py-2.5">
        <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
          Knowledge Store
        </span>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1 rounded-full bg-[#000080]/8 px-2 py-0.5 text-[10px] font-semibold text-[#000080]">
            {docCount} {docCount === 1 ? "doc" : "docs"}
          </span>
          <button
            type="button"
            aria-label="Refresh document list"
            onClick={(e) => {
              e.stopPropagation()
              void refreshDocumentInventory()
            }}
            className="rounded-md p-0.5 text-slate-400 hover:text-[#000080] hover:bg-blue-50 transition-colors"
          >
            <RefreshCw className={`h-3 w-3 ${documentInventoryLoading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      <ul className="max-h-56 overflow-y-auto py-1" role="group">
        {/* All Documents option */}
        <li>
          <button
            type="button"
            role="option"
            aria-selected={targetSource === null}
            onClick={() => { setTargetSource(null); setOpen(false) }}
            className={`flex w-full items-center gap-2.5 px-3.5 py-2 text-xs transition-colors ${
              targetSource === null
                ? "bg-[#000080]/6 text-[#000080]"
                : "text-[#0F172A] hover:bg-slate-50/80"
            }`}
          >
            <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-[#000080]/10">
              <FileText className="h-3 w-3 text-[#000080]" />
            </div>
            <span className="flex-1 truncate font-semibold text-[11px]">All Documents</span>
            {targetSource === null && (
              <Check className="h-3.5 w-3.5 shrink-0 text-[#000080]" />
            )}
          </button>
        </li>

        {/* Divider if there are individual files */}
        {filenames.length > 0 && (
          <li role="separator" className="mx-3 my-1 h-px bg-slate-100/80" />
        )}

        {/* Loading state */}
        {documentInventoryLoading && filenames.length === 0 && (
          <li className="px-3.5 py-3 text-[11px] text-slate-400 italic flex items-center gap-1.5">
            <RefreshCw className="h-3 w-3 animate-spin" />
            Loading documents…
          </li>
        )}

        {/* Individual document options */}
        {filenames.map((filename) => (
          <li key={filename}>
            <button
              type="button"
              role="option"
              aria-selected={targetSource === filename}
              onClick={() => { setTargetSource(filename); setOpen(false) }}
              className={`flex w-full items-center gap-2.5 px-3.5 py-2 text-xs transition-colors ${
                targetSource === filename
                  ? "bg-[#000080]/6 text-[#000080]"
                  : "text-[#0F172A] hover:bg-slate-50/80"
              }`}
            >
              <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-slate-100">
                <FileText className="h-3 w-3 text-slate-400" />
              </div>
              <span className="flex-1 truncate text-[11px]" title={filename}>{filename}</span>
              {targetSource === filename && (
                <Check className="h-3.5 w-3.5 shrink-0 text-[#000080]" />
              )}
            </button>
          </li>
        ))}

        {!documentInventoryLoading && filenames.length === 0 && (
          <li className="px-3.5 py-3 text-[11px] text-slate-400 italic">
            No documents indexed yet
          </li>
        )}
      </ul>

      {/* Footer hint */}
      <div className="border-t border-slate-100/80 px-3.5 py-2">
        <p className="text-[10px] text-slate-400">
          Select a document to scope retrieval, or use All Documents for full-corpus search.
        </p>
      </div>
    </div>
  ) : null

  return (
    <>
      <button
        ref={btnRef}
        id="knowledge-sources-btn"
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label="Select knowledge source"
        onClick={handleOpen}
        className={GLASS_BTN}
      >
        <span className="shrink-0 font-semibold uppercase tracking-wider text-[10px] text-slate-500">
          Sources:
        </span>
        <span className="max-w-[110px] truncate font-medium text-[#0F172A] text-[11px]">
          {activeLabel}
        </span>
        <ChevronDown
          className={`ml-auto h-3 w-3 shrink-0 text-slate-400 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
        />
      </button>

      {/* Render dropdown into document.body via portal to escape overflow-hidden ancestors */}
      {typeof document !== "undefined" && createPortal(dropdown, document.body)}
    </>
  )
}
