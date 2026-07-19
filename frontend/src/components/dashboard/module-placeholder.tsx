import { Construction } from "lucide-react"
import type { NavItem } from "@/components/dashboard/nav-config"

export function ModulePlaceholder({ item }: { item: NavItem }) {
  const Icon = item.icon
  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col">
        <h1 className="text-base font-semibold tracking-tight text-stone-900">{item.label}</h1>
        <p className="text-xs text-stone-500">Module scaffold · configuration in progress</p>
      </div>

      <div className="flex flex-1 items-center justify-center rounded-sm border border-dashed border-stone-300 bg-white/60 py-24">
        <div className="flex max-w-sm flex-col items-center gap-3 text-center">
          <div className="flex h-11 w-11 items-center justify-center rounded-sm border border-stone-200 bg-stone-50 text-stone-400">
            <Icon className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center justify-center gap-1.5 text-sm font-semibold text-stone-700">
              <Construction className="h-4 w-4 text-stone-400" />
              {item.label}
            </div>
            <p className="mt-1 text-xs leading-relaxed text-stone-500">
              This module is part of the workstation shell. Its interface will render here while sharing the same
              blueprint canvas, sidebar, and header.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
