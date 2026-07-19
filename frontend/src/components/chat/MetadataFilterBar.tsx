import { useWorkstation } from "@/context/WorkstationContext"

const ALL_DOCUMENTS_VALUE = "__all__"

export default function TargetSourceSelect() {
  const { targetSource, setTargetSource, documentInventory } = useWorkstation()

  const filenames = documentInventory.map((doc) => doc.filename).sort()

  return (
    <label className="flex min-w-0 max-w-full items-center gap-1.5">
      <span className="shrink-0 text-caption font-semibold uppercase tracking-wider text-[var(--ws-text-muted)]">
        Target Source:
      </span>
      <select
        value={targetSource ?? ALL_DOCUMENTS_VALUE}
        onChange={(event) => {
          const value = event.target.value
          setTargetSource(value === ALL_DOCUMENTS_VALUE ? null : value)
        }}
        className="min-w-0 max-w-[min(100%,280px)] flex-1 truncate rounded-sm border-0 border-b border-gray-200 bg-transparent px-0 py-1 text-xs font-medium text-[var(--ws-text)] transition-colors focus:border-[var(--ws-primary)] focus:outline-none"
        aria-label="Target source document"
      >
        <option value={ALL_DOCUMENTS_VALUE}>All Indexed Documents</option>
        {filenames.map((filename) => (
          <option key={filename} value={filename}>
            {filename}
          </option>
        ))}
      </select>
    </label>
  )
}
