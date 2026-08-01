import { useWorkstation } from "@/context/WorkstationContext"

const ALL_DOCUMENTS_VALUE = "__all__"

export default function TargetSourceSelect() {
  const { targetSource, setTargetSource, documentInventory } = useWorkstation()

  const filenames = documentInventory.map((doc) => doc.filename).sort()

  return (
    <label className="flex min-w-0 max-w-full items-center gap-1.5">
      <span className="shrink-0 text-caption font-semibold uppercase tracking-wider text-[var(--ws-text-muted)]">
        Knowledge Sources:
      </span>
      <select
        value={targetSource ?? ALL_DOCUMENTS_VALUE}
        onChange={(event) => {
          const value = event.target.value
          setTargetSource(value === ALL_DOCUMENTS_VALUE ? null : value)
        }}
        className={`min-w-0 max-w-[min(100%,280px)] flex-1 truncate px-3 py-1.5 text-xs font-medium text-slate-800 focus:outline-none bg-white/30 backdrop-blur-md border border-white/60 shadow-[0_4px_12px_rgba(0,0,0,0.05),inset_0_1px_1px_rgba(255,255,255,0.9)] rounded-full hover:bg-white/40 transition-all duration-300`}
        aria-label="Knowledge sources"
      >
        <option value={ALL_DOCUMENTS_VALUE}>Documents</option>
        {filenames.map((filename) => (
          <option key={filename} value={filename}>
            {filename}
          </option>
        ))}
      </select>
    </label>
  )
}
