import { useState } from "react"
import { ChevronsLeftRight, ChevronDown, Plus, Trash2 } from "lucide-react"
import { navGroups } from "@/components/dashboard/nav-config"
import { useWorkstation } from "@/context/WorkstationContext"

const GLASS_SIDEBAR =
  "bg-slate-950/90 backdrop-blur-xl border-r border-slate-800 shadow-[0_20px_40px_rgba(2,6,23,0.28)]"

const HYPER_GLASS =
  "bg-slate-900/60 backdrop-blur-md border border-slate-700/80 shadow-[0_4px_16px_rgba(2,6,23,0.22)] rounded-full hover:bg-slate-800/80 transition-all duration-200"

const GLASS_CARD =
  "bg-slate-900/70 backdrop-blur-xl border border-slate-800 shadow-[0_12px_28px_rgba(2,6,23,0.24)] rounded-3xl"

function ChatSessionsPanel() {
  const [open, setOpen] = useState(true)
  const { sessions, activeSessionId, setActiveSessionId, createSession, deleteSession } = useWorkstation()
  const activeSession = sessions.find((s) => s.id === activeSessionId)

  return (
    <div className="mt-3 border-t border-slate-800 px-2 pt-4">
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className={`flex min-w-0 flex-1 items-center justify-between gap-1 px-2 py-1.5 text-left ${HYPER_GLASS} !rounded-2xl`}
        >
          <span className="truncate text-[10px] font-semibold uppercase tracking-wider text-slate-300/80">
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
          className={`shrink-0 p-1.5 text-slate-400 hover:text-slate-100 ${HYPER_GLASS} !rounded-2xl`}
          aria-label="New session"
          title="New session"
        >
          <Plus className="h-3 w-3" />
        </button>
      </div>

      {!open && activeSession && (
        <p className="mt-1 truncate px-2 text-[10px] font-medium text-slate-300/80">{activeSession.label}</p>
      )}

      {open && (
        <ul className="mt-2 max-h-36 space-y-1 overflow-y-auto fluent-scrollbar">
          {sessions.length === 0 ? (
            <li className="px-2 py-1.5 text-[10px] leading-snug text-slate-400/70">No active sessions</li>
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
                        ? `${HYPER_GLASS} !rounded-2xl border-sky-500/30 bg-slate-800/90 text-slate-50`
                        : `${HYPER_GLASS} !rounded-2xl border-transparent text-slate-400 hover:text-slate-100`)
                    }
                  >
                    <p className="truncate text-[11px] font-medium leading-tight">{s.label}</p>
                    <p className="truncate text-[9px] leading-tight text-slate-400/70">{s.date}</p>
                  </button>
                  <button
                    type="button"
                    onClick={() => deleteSession(s.id)}
                    className="absolute right-1.5 top-1.5 rounded-lg p-0.5 text-slate-500 opacity-0 transition-opacity hover:text-red-400 group-hover:opacity-100"
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

  return (
    <aside className={`flex hidden w-56 shrink-0 flex-col lg:flex ${GLASS_SIDEBAR}`}>
      <div className="flex h-14 items-center gap-2.5 border-b border-slate-800 px-4">
        <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-slate-800 text-slate-100 shadow-[0_4px_16px_0_rgba(2,6,23,0.24)]">
          <ChevronsLeftRight className="h-4 w-4" />
        </div>
        <div className="leading-tight">
          <div className="text-[13px] font-semibold tracking-tight text-slate-100">Sentinel</div>
          <div className="text-[10px] font-medium text-slate-400/80">Workstation</div>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4 fluent-scrollbar">
        {navGroups.map((group) => (
          <div key={group.title} className="mb-4">
            <div className="px-2 pb-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-400/70">
              {group.title}
            </div>
            <ul className="flex flex-col gap-1">
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
                      className={
                        "group flex w-full items-center gap-2.5 px-2.5 py-2 text-left text-[13px] font-medium transition-all duration-200 " +
                        (active
                          ? `${HYPER_GLASS} !rounded-2xl border-sky-500/30 bg-slate-800/90 text-slate-50`
                          : `${HYPER_GLASS} !rounded-2xl border-transparent text-slate-400 hover:text-slate-100`)
                      }
                    >
                      <Icon
                        className={
                          "h-4 w-4 " + (active ? "text-sky-300" : "text-slate-400 group-hover:text-slate-100")
                        }
                      />
                      <span className="flex-1">{item.label}</span>
                      {badge && (
                        <span className={`px-1.5 py-0.5 font-mono text-[10px] text-slate-300 ${HYPER_GLASS}`}>
                          {badge}
                        </span>
                      )}
                    </button>
                  </li>
                )
              })}
            </ul>
          </div>
        ))}

        {module === "chat" && <ChatSessionsPanel />}
      </nav>

      <div className="border-t border-slate-800 p-3">
        <div className={`p-3 ${GLASS_CARD}`}>
          <div className="flex items-center gap-2">
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-60" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
            </span>
            <span className="text-[11px] font-semibold text-slate-100">Secure Local Node</span>
          </div>
          <p className="mt-1 text-[10px] leading-snug text-slate-400/80">
            Protected environment connected.
          </p>
          <div className="mt-2.5 flex items-center justify-between border-t border-slate-800 pt-2.5 font-mono text-[10px] text-slate-400/70">
            <span>Authorized access only.</span>
            <span className="font-semibold text-emerald-400">● online</span>
          </div>
        </div>
      </div>
    </aside>
  )
}
