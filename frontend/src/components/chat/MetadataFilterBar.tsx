import { useWorkstation } from "@/context/WorkstationContext"

function FilterChip({
  label,
  active,
  onClick,
}: {
  label: string
  active: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`shrink-0 rounded-md border px-[calc(0.5rem*var(--ws-density))] py-[calc(0.2rem*var(--ws-density))] text-caption font-semibold uppercase tracking-wider transition-all duration-200 ease-in-out ${
        active
          ? "border-[var(--ws-primary)]/50 bg-[rgba(16,185,129,0.14)] text-[var(--ws-primary)] shadow-[0_0_12px_rgba(16,185,129,0.12)]"
          : "border-[var(--ws-card-border)] bg-[var(--ws-card-bg-elevated)] text-[var(--ws-text-muted)] hover:border-[var(--ws-primary)]/30 hover:text-[var(--ws-text-secondary)]"
      }`}
    >
      {label}
    </button>
  )
}

export default function MetadataFilterBar() {
  const {
    metadataFilters,
    setMetadataFilter,
    clearMetadataFilters,
    metadataFacets,
    hasActiveMetadataFilters,
  } = useWorkstation()

  const { years, quarters, file_types } = metadataFacets
  const hasFacets = years.length > 0 || quarters.length > 0 || file_types.length > 0

  if (!hasFacets) return null

  return (
    <div className="shrink-0 border-b border-[var(--ws-card-border)] bg-[var(--ws-card-bg)]/60 px-[calc(0.75rem*var(--ws-density))] py-[calc(0.375rem*var(--ws-density))]">
      <div className="flex min-w-0 items-center gap-[calc(0.375rem*var(--ws-density))] overflow-x-auto scrollbar-none">
        <span className="shrink-0 text-caption font-semibold uppercase tracking-wider text-[var(--ws-text-muted)]">
          Vault scope
        </span>
        <FilterChip label="All" active={!hasActiveMetadataFilters} onClick={clearMetadataFilters} />
        {years.map((year) => (
          <FilterChip
            key={`year-${year}`}
            label={year}
            active={metadataFilters.year === year}
            onClick={() => setMetadataFilter("year", metadataFilters.year === year ? null : year)}
          />
        ))}
        {quarters.map((quarter) => (
          <FilterChip
            key={`quarter-${quarter}`}
            label={quarter}
            active={metadataFilters.quarter === quarter}
            onClick={() =>
              setMetadataFilter("quarter", metadataFilters.quarter === quarter ? null : quarter)
            }
          />
        ))}
        {file_types.map((fileType) => (
          <FilterChip
            key={`type-${fileType}`}
            label={fileType}
            active={metadataFilters.file_type === fileType}
            onClick={() =>
              setMetadataFilter(
                "file_type",
                metadataFilters.file_type === fileType ? null : fileType
              )
            }
          />
        ))}
      </div>
    </div>
  )
}
