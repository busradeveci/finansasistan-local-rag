import { Construction } from "lucide-react"
import type { NavItem } from "@/components/dashboard/nav-config"

export function ModulePlaceholder({ item }: { item: NavItem }) {
  const Icon = item.icon
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col">
        <h1 className="text-base font-semibold tracking-tight text-slate-900">{item.label}</h1>
        <p className="text-xs text-slate-500">Module scaffold · configuration in progress</p>
      </div>

      <div className="flex flex-1 items-center justify-center rounded-3xl border border-dashed border-white/40 bg-white/20 py-24 shadow-[0_8px_30px_rgb(0,0,0,0.04),inset_0_1px_0_rgba(255,255,255,0.8),inset_0_-1px_0_rgba(255,255,255,0.2)] backdrop-blur-2xl backdrop-saturate-[1.1]">
        <div className="flex max-w-sm flex-col items-center gap-3 text-center">
          <div className="flex h-11 w-11 items-center justify-center rounded-3xl border border-white/40 bg-white/20 text-slate-500 shadow-[0_8px_30px_rgb(0,0,0,0.04),inset_0_1px_0_rgba(255,255,255,0.8),inset_0_-1px_0_rgba(255,255,255,0.2)] backdrop-blur-2xl">
            <Icon className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center justify-center gap-1.5 text-sm font-semibold text-slate-700">
              <Construction className="h-4 w-4 text-slate-400" />
              {item.label}
            </div>
            <p className="mt-1 text-xs leading-relaxed text-slate-500">
              This module is part of the workstation shell. Its interface will render here while sharing the same
              blueprint canvas, sidebar, and header.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
