import { useEffect, useRef, useState } from "react"
import { ChevronDown, Check } from "lucide-react"
import { useWorkstation } from "@/context/WorkstationContext"

const ALL_DOCUMENTS_VALUE = "__all__"

const GLASS_BTN =
  "flex items-center gap-1.5 bg-white/80 border border-white/80 rounded-xl px-3 py-1.5 text-xs text-[#0F172A] shadow-[0_4px_12px_rgba(40,60,90,0.06)] backdrop-blur-md hover:bg-white/90 transition-all duration-200 focus:outline-none"

const GLASS_MENU =
  "absolute left-0 top-full z-40 mt-1 w-56 overflow-hidden rounded-2xl bg-white/90 backdrop-blur-md border border-white/80 shadow-[0_8px_30px_rgba(40,60,90,0.10)]"

export default function TargetSourceSelect() {
  const { targetSource, setTargetSource, documentInventory } = useWorkstation()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  const filenames = documentInventory.map((doc) => doc.filename).sort()
  const activeLabel = targetSource ?? "All Documents"

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [])

  return (
    <div ref={ref} className="relative shrink-0">
      <button
        id="knowledge-sources-btn"
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label="Knowledge sources"
        onClick={() => setOpen((v) => !v)}
        className={GLASS_BTN}
      >
        <span className="max-w-[160px] truncate font-semibold uppercase tracking-wider text-[10px] text-slate-500 mr-0.5">
          Sources:
        </span>
        <span className="max-w-[120px] truncate font-medium text-[#0F172A]">
          {activeLabel}
        </span>
        <ChevronDown
          className={`ml-auto h-3 w-3 shrink-0 text-slate-400 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <div className={GLASS_MENU} role="listbox" aria-label="Knowledge sources">
          <div className="border-b border-white/60 px-3 py-2">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
              Knowledge Sources
            </span>
          </div>
          <ul className="max-h-52 overflow-y-auto fluent-scrollbar py-1">
            {/* All Documents option */}
            <li>
              <button
                type="button"
                role="option"
                aria-selected={targetSource === null}
                onClick={() => { setTargetSource(null); setOpen(false) }}
                className="flex w-full items-center gap-2 px-3 py-2 text-xs text-[#0F172A] transition-colors hover:bg-white/50"
              >
                <span className="flex-1 truncate font-medium">All Documents</span>
                {targetSource === null && <Check className="h-3 w-3 shrink-0 text-[#000080]" />}
              </button>
            </li>
            {filenames.map((filename) => (
              <li key={filename}>
                <button
                  type="button"
                  role="option"
                  aria-selected={targetSource === filename}
                  onClick={() => { setTargetSource(filename); setOpen(false) }}
                  className="flex w-full items-center gap-2 px-3 py-2 text-xs text-[#0F172A] transition-colors hover:bg-white/50"
                >
                  <span className="flex-1 truncate">{filename}</span>
                  {targetSource === filename && <Check className="h-3 w-3 shrink-0 text-[#000080]" />}
                </button>
              </li>
            ))}
            {filenames.length === 0 && (
              <li className="px-3 py-2 text-xs text-slate-500">No documents indexed yet</li>
            )}
          </ul>
        </div>
      )}
    </div>
  )
}
