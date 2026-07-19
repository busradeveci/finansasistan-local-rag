import { useState } from "react"
import { ChevronsLeftRight, ChevronDown, Plus, Trash2 } from "lucide-react"
import { navGroups } from "@/components/dashboard/nav-config"
import { useWorkstation } from "@/context/WorkstationContext"

function ChatSessionsPanel() {
  const [open, setOpen] = useState(true)
  const { sessions, activeSessionId, setActiveSessionId, createSession, deleteSession } = useWorkstation()
  const activeSession = sessions.find((s) => s.id === activeSessionId)

  return (
    <div className="mt-2 border-t border-stone-200 px-2 pt-3">
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="flex min-w-0 flex-1 items-center justify-between gap-1 rounded-sm px-2 py-1.5 text-left transition-colors hover:bg-stone-50"
        >
          <span className="truncate text-[10px] font-semibold uppercase tracking-wider text-stone-400">
            Sessions
          </span>
          <ChevronDown
            className={`h-3 w-3 shrink-0 text-stone-400 transition-transform duration-200 ${
              open ? "rotate-0" : "-rotate-90"
            }`}
          />
        </button>
        <button
          type="button"
          onClick={createSession}
          className="shrink-0 rounded-sm p-1.5 text-stone-400 transition-colors hover:bg-stone-50 hover:text-stone-700"
          aria-label="New session"
          title="New session"
        >
          <Plus className="h-3 w-3" />
        </button>
      </div>

      {!open && activeSession && (
        <p className="mt-1 truncate px-2 text-[10px] font-medium text-stone-500">{activeSession.label}</p>
      )}

      {open && (
        <ul className="mt-1 max-h-36 space-y-px overflow-y-auto">
          {sessions.length === 0 ? (
            <li className="px-2 py-1.5 text-[10px] leading-snug text-stone-400">No active sessions</li>
          ) : (
            sessions.map((s) => {
              const active = activeSessionId === s.id
              return (
                <li key={s.id} className="group relative">
                  <button
                    type="button"
                    onClick={() => setActiveSessionId(s.id)}
                    className={
                      "w-full rounded-sm px-2 py-1.5 text-left transition-colors " +
                      (active
                        ? "bg-[#f5f5f4] text-[#1c1917]"
                        : "text-stone-600 hover:bg-stone-50 hover:text-stone-900")
                    }
                  >
                    <p className="truncate text-[11px] font-medium leading-tight">{s.label}</p>
                    <p className="truncate text-[9px] leading-tight text-stone-400">{s.date}</p>
                  </button>
                  <button
                    type="button"
                    onClick={() => deleteSession(s.id)}
                    className="absolute right-1 top-1 rounded-sm p-0.5 text-stone-400 opacity-0 transition-opacity hover:text-red-600 group-hover:opacity-100"
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
    <aside className="hidden lg:flex w-52 shrink-0 flex-col border-r border-stone-200 bg-white">
      <div className="flex h-12 items-center gap-2 border-b border-stone-200 px-3">
        <div className="flex h-7 w-7 items-center justify-center rounded-sm bg-[#1c1917] text-white">
          <ChevronsLeftRight className="h-4 w-4" />
        </div>
        <div className="leading-tight">
          <div className="text-[13px] font-semibold text-stone-900">Foundry Local</div>
          <div className="text-[10px] font-medium text-stone-500">RAG Workstation</div>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto px-2 py-3">
        {navGroups.map((group) => (
          <div key={group.title} className="mb-3.5">
            <div className="px-2 pb-1 text-[10px] font-semibold uppercase tracking-wider text-stone-400">
              {group.title}
            </div>
            <ul className="flex flex-col gap-px">
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
                        "group flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-left text-[13px] font-medium transition-colors " +
                        (active
                          ? "bg-[#f5f5f4] text-[#1c1917]"
                          : "text-stone-600 hover:bg-stone-50 hover:text-stone-900")
                      }
                    >
                      <Icon
                        className={
                          "h-4 w-4 " + (active ? "text-[#1c1917]" : "text-stone-400 group-hover:text-stone-600")
                        }
                      />
                      <span className="flex-1">{item.label}</span>
                      {badge && (
                        <span className="rounded bg-stone-100 px-1 py-0.5 font-mono text-[10px] text-stone-500">
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

      <div className="border-t border-stone-200 p-2">
        <div className="rounded-sm border border-stone-200 bg-stone-50 px-2.5 py-2">
          <div className="flex items-center gap-2">
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-60" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-orange-500" />
            </span>
            <span className="text-[11px] font-semibold text-stone-700">Air-Gapped Node</span>
          </div>
          <p className="mt-0.5 text-[10px] leading-snug text-stone-500">No outbound connections. On-device only.</p>
          <div className="mt-2 flex items-center justify-between border-t border-stone-200 pt-2 font-mono text-[10px] text-stone-400">
            <span>node-01</span>
            <span className="text-orange-600">● online</span>
          </div>
        </div>
      </div>
    </aside>
  )
}
