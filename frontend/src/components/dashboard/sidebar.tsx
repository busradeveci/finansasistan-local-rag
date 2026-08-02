import { useState } from "react"
import { PanelLeftClose, PanelLeftOpen, ChevronDown, Plus, Trash2 } from "lucide-react"
import { navGroups } from "@/components/dashboard/nav-config"
import { useWorkstation } from "@/context/WorkstationContext"
import { VectorVaultLogo } from "@/components/VectorVaultLogo"
const GLASS_SIDEBAR =
  "bg-transparent backdrop-blur-none border-none shadow-none"

const HYPER_GLASS =
  "bg-white/55 backdrop-blur-md border border-white/70 shadow-[0_4px_16px_rgba(70,92,122,0.08)] rounded-full hover:bg-white/75 transition-all duration-200"

const GLASS_CARD =
  "bg-white/82 backdrop-blur-md border border-[#9FB6CD]/60 shadow-[0_12px_28px_rgba(70,92,122,0.08)] rounded-3xl"

function ChatSessionsPanel() {
  const [open, setOpen] = useState(true)
  const { sessions, activeSessionId, setActiveSessionId, createSession, deleteSession } = useWorkstation()
  const activeSession = sessions.find((s) => s.id === activeSessionId)

  return (
    <div className="mt-3 border-t border-transparent px-2 pt-4">
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className={`flex min-w-0 flex-1 items-center justify-between gap-1 px-2 py-1.5 text-left ${HYPER_GLASS} !rounded-2xl`}
        >
          <span className="truncate text-[10px] font-semibold uppercase tracking-wider text-slate-700/80">
            Sessions
          </span>
          <ChevronDown
            className={`h-3 w-3 shrink-0 text-slate-500 transition-transform duration-200 ${
              open ? "rotate-0" : "-rotate-90"
            }`}
          />
        </button>
        <button
          type="button"
          onClick={createSession}
          className={`shrink-0 p-1.5 text-slate-500 hover:text-slate-900 ${HYPER_GLASS} !rounded-2xl`}
          aria-label="New session"
          title="New session"
        >
          <Plus className="h-3 w-3" />
        </button>
      </div>

      {!open && activeSession && (
        <p className="mt-1 truncate px-2 text-[10px] font-medium text-slate-700/80">{activeSession.label}</p>
      )}

      {open && (
        <ul className="mt-2 max-h-36 space-y-1 overflow-y-auto fluent-scrollbar">
          {sessions.length === 0 ? (
            <li className="px-2 py-1.5 text-[10px] leading-snug text-slate-500">No active sessions</li>
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
                        ? "rounded-2xl border border-white/80 bg-white/80 text-slate-900 shadow-[0_8px_24px_rgba(70,92,122,0.12)]"
                        : `${HYPER_GLASS} !rounded-2xl border-transparent text-slate-600 hover:text-slate-900`)
                    }
                  >
                    <p className="truncate text-[11px] font-medium leading-tight">{s.label}</p>
                    <p className="truncate text-[9px] leading-tight text-slate-500">{s.date}</p>
                  </button>
                  <button
                    type="button"
                    onClick={() => deleteSession(s.id)}
                    className="absolute right-1.5 top-1.5 rounded-lg p-0.5 text-slate-500 opacity-0 transition-opacity hover:text-slate-800 group-hover:opacity-100"
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
      <div className={`flex h-14 items-center border-b border-transparent px-3 ${collapsed ? "justify-center" : "justify-between gap-2"}`}>
        {collapsed ? (
          /* Collapsed: brand icon IS the toggle button, centered */
          <button
            onClick={() => setCollapsed(false)}
            className="flex h-9 w-9 shrink-0 items-center justify-center hover:opacity-80 transition-opacity duration-150"
            aria-label="Expand sidebar"
          >
            <VectorVaultLogo className="h-8 w-8 text-[#1C0F45]" />
          </button>
        ) : (
          /* Expanded: brand icon + text on left, close toggle on far right */
          <>
            <div className="flex min-w-0 items-center gap-2">
              {/* VectorVault Logo */}
              <VectorVaultLogo className="h-8 w-8 shrink-0 text-[#1C0F45]" />
              <div className="min-w-0 leading-tight">
                <div className="text-[13px] font-semibold tracking-tight text-[#1C0F45]">VectorVault</div>
                <div className="text-[10px] font-medium text-slate-500">Control Center</div>
              </div>
            </div>
            <button
              onClick={() => setCollapsed(true)}
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-slate-400 hover:bg-white/70 hover:text-slate-700 transition-all duration-150"
              aria-label="Collapse sidebar"
            >
              <PanelLeftClose className="h-4 w-4" />
            </button>
          </>
        )}
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4 scrollbar-none">
        {navGroups.map((group) => (
          <div key={group.title} className="mb-4">
            {!collapsed && (
              <div className="px-2 pb-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                {group.title}
              </div>
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
                        "group flex w-full items-center py-2 text-left text-[13px] font-medium transition-all duration-200 " +
                        (collapsed ? "justify-center px-0 rounded-xl " : "gap-2.5 px-2.5 rounded-xl ") +
                        (active
                          ? "bg-white/82 border border-[#9FB6CD]/50 text-[#000080] shadow-[0_4px_16px_rgba(70,92,122,0.09)]"
                          : "bg-transparent border border-transparent text-[#4B5563] hover:bg-white/55 hover:border-white/60 hover:text-[#1C0F45]")
                      }
                    >
                      <Icon
                        className={"h-4 w-4 shrink-0 " + (active ? "text-[#000080]" : "text-slate-400 group-hover:text-[#1C0F45]")}
                      />
                      {!collapsed && (
                        <>
                          <span className="flex-1 truncate">{item.label}</span>
                          {badge && (
                            <span className={`px-1.5 py-0.5 font-mono text-[10px] text-slate-500 bg-white/60 rounded-lg border border-white/70`}>
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
        <div className="border-t border-transparent p-3">
          <div className={`p-3 ${GLASS_CARD}`}>
            <div className="flex items-center gap-2">
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-300 opacity-60" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
              </span>
              <span className="text-[11px] font-semibold text-slate-900">Runtime Environment</span>
            </div>
            <p className="mt-1 text-[10px] leading-snug text-slate-600">
              Offline inference engine available
            </p>
            <div className="mt-2.5 flex items-center justify-between border-t border-slate-200/80 pt-2.5 font-mono text-[10px] text-slate-500">
              <span>Authorized operators only</span>
              <span className="font-semibold text-emerald-500">● online</span>
            </div>
          </div>
        </div>
      )}
    </aside>
  )
}