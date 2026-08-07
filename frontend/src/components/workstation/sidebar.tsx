import { useState } from "react"
import { PanelLeftClose, PanelLeftOpen, ChevronDown, Plus, Trash2 } from "lucide-react"
import { navGroups } from "@/components/workstation/nav-config"
import { useWorkstation } from "@/context/WorkstationContext"
import { VectorVaultLogo } from "@/components/VectorVaultLogo"

const GLASS_SIDEBAR =
  "bg-white/45 backdrop-blur-2xl backdrop-saturate-[1.25] border-r border-white/70 shadow-[1px_0_2px_rgba(16,32,64,0.02)]"

const HYPER_GLASS =
  "bg-white/60 backdrop-blur-md border border-white/70 shadow-[0_1px_2px_rgba(16,32,64,0.04)] rounded-full hover:bg-white/90 transition-all duration-200"

const GLASS_CARD =
  "bg-white/70 backdrop-blur-xl border border-white/80 shadow-[0_1px_2px_rgba(16,32,64,0.04),inset_0_1px_0_rgba(255,255,255,0.9)] rounded-2xl"

function ChatSessionsPanel() {
  const [open, setOpen] = useState(true)
  const { sessions, activeSessionId, setActiveSessionId, createSession, deleteSession } = useWorkstation()
  const activeSession = sessions.find((s) => s.id === activeSessionId)

  return (
    <div className="mt-3 border-t border-white/80 px-2 pt-4">
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className={`flex min-w-0 flex-1 items-center justify-between gap-1 px-2 py-1.5 text-left ${HYPER_GLASS} !rounded-2xl`}
        >
          <span className="truncate text-[10px] font-semibold uppercase tracking-wider text-slate-500">
            Sessions
          </span>
          <ChevronDown
            className={`h-3 w-3 shrink-0 text-slate-400 transition-transform duration-200 ${
              open ? "rotate-0" : "-rotate-90"
            }`}
          />
        </button>
        <button
          type="button"
          onClick={createSession}
          className={`shrink-0 p-1.5 text-slate-400 hover:text-slate-600 ${HYPER_GLASS} !rounded-2xl`}
          aria-label="New session"
          title="New session"
        >
          <Plus className="h-3 w-3" />
        </button>
      </div>

      {!open && activeSession && (
        <p className="mt-1 truncate px-2 text-[10px] font-medium text-slate-500">{activeSession.label}</p>
      )}

      {open && (
        <ul className="mt-2 max-h-36 space-y-1 overflow-y-auto fluent-scrollbar">
          {sessions.length === 0 ? (
            <li className="px-2 py-1.5 text-[10px] leading-snug text-slate-400">No active sessions</li>
          ) : (
            sessions.map((s) => {
              const active = activeSessionId === s.id
              return (
                <li key={s.id} className="group relative">
                  <button
                    type="button"
                    onClick={() => setActiveSessionId(s.id)}
                    className={
                      "w-full px-2.5 py-2 text-left transition-all duration-200 " +
                      (active
                        ? "rounded-2xl border border-blue-900/20 bg-[#000080]/5 text-[#000080] shadow-sm"
                        : `${HYPER_GLASS} !rounded-2xl border-transparent text-slate-500 hover:text-slate-800`)
                    }
                  >
                    <p className="truncate text-[11px] font-medium leading-tight">{s.label}</p>
                    <p className="truncate text-[9px] leading-tight text-slate-400">{s.date}</p>
                  </button>
                  <button
                    type="button"
                    onClick={() => deleteSession(s.id)}
                    className="absolute right-1.5 top-1.5 rounded-lg p-0.5 text-slate-400 opacity-0 transition-opacity hover:text-slate-600 group-hover:opacity-100"
                    aria-label={`Delete ${s.label}`}
                  >
                    <Trash2 className="h-2.5 w-2.5" />
                  </button>
                </li>
              )
            })
          )}
        </ul>
      )}
    </div>
  )
}

export function Sidebar() {
  const { module, setModule, documentInventory } = useWorkstation()
  const docBadge = documentInventory.length > 0 ? documentInventory.length.toLocaleString() : undefined
  const [collapsed, setCollapsed] = useState(false)

  return (
    <aside className={`flex hidden shrink-0 flex-col lg:flex transition-all duration-300 ${collapsed ? "w-16" : "w-52"} ${GLASS_SIDEBAR}`}>
      {/* Sidebar header — brand left, toggle right; in collapsed state icon is clickable expand */}
      <div className={`flex h-14 items-center border-b border-white/70 px-3 ${collapsed ? "justify-center" : "justify-between gap-2"}`}>
        {collapsed ? (
          /* Collapsed: brand icon IS the toggle button, centered */
          <button
            onClick={() => setCollapsed(false)}
            className="flex h-9 w-9 shrink-0 items-center justify-center hover:opacity-80 transition-opacity duration-150"
            aria-label="Expand sidebar"
          >
            <VectorVaultLogo className="h-8 w-8 text-[#000080]" />
          </button>
        ) : (
          /* Expanded: brand icon + text on left, close toggle on far right */
          <>
            <div className="flex min-w-0 items-center gap-2">
              {/* VectorVault Logo */}
              <VectorVaultLogo className="h-8 w-8 shrink-0 text-[#000080]" />
              <div className="min-w-0 leading-tight">
                <div className="text-[13px] font-semibold tracking-tight text-slate-800">VectorVault</div>
                <div className="text-[10px] font-medium text-slate-500">Control Center</div>
              </div>
            </div>
            <button
              onClick={() => setCollapsed(true)}
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-all duration-150"
              aria-label="Collapse sidebar"
            >
              <PanelLeftClose className="h-4 w-4" />
            </button>
          </>
        )}
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4 scrollbar-none">
        {navGroups.map((group, index) => (
          <div key={index} className="mb-2">
            {index > 0 && (
              <div className="mx-2 mb-3 mt-1 h-px bg-white/80" />
            )}
            <ul className="flex flex-col gap-0.5">
              {group.items.map((item) => {
                const Icon = item.icon
                const active = item.id === module
                const badge = item.id === "documents" ? docBadge : item.badge
                return (
                  <li key={item.id}>
                    <button
                      type="button"
                      onClick={() => setModule(item.id)}
                      aria-current={active ? "page" : undefined}
                      title={collapsed ? item.label : undefined}
                      className={
                        "group flex w-full items-center py-2.5 text-left text-[14px] font-medium transition-all duration-300 " +
                        (collapsed ? "justify-center px-0 rounded-2xl " : "gap-3 px-3.5 rounded-2xl ") +
                        (active
                          ? "bg-white/95 shadow-[0_1px_2px_rgba(16,32,64,0.04),0_8px_20px_rgba(16,32,64,0.06),inset_0_1px_0_rgba(255,255,255,0.95)] border border-white text-slate-900"
                          : "bg-transparent border border-transparent text-slate-500 hover:text-slate-900 hover:bg-white/55")
                      }
                    >
                      <Icon
                        className={"h-4 w-4 shrink-0 transition-colors " + (active ? "text-[#000080]" : "text-slate-400 group-hover:text-slate-600")}
                      />
                      {!collapsed && (
                        <>
                          <span className="flex-1 truncate">{item.label}</span>
                          {badge && (
                            <span className={`px-2 py-0.5 font-medium text-[11px] text-slate-600 bg-black/5 rounded-full`}>
                              {badge}
                            </span>
                          )}
                        </>
                      )}
                    </button>
                  </li>
                )
              })}
            </ul>
          </div>
        ))}

        {!collapsed && module === "chat" && <ChatSessionsPanel />}
      </nav>
      {!collapsed && (
        <div className="border-t border-white/70 p-3">
          <div className={`p-3 ${GLASS_CARD}`}>
            <div className="flex items-center gap-2">
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-60" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
              </span>
              <span className="text-[11px] font-semibold text-slate-800">Runtime Environment</span>
            </div>
            <p className="mt-1 text-[10px] leading-snug text-slate-500">
              Offline inference engine available
            </p>
            <div className="mt-2.5 flex items-center justify-between border-t border-white/80 pt-2.5 font-mono text-[10px] text-slate-500">
              <span>Authorized operators only</span>
              <span className="font-semibold text-emerald-600">● online</span>
            </div>
          </div>
        </div>
      )}
    </aside>
  )
}