import { useState } from "react"

import type { LucideIcon } from "lucide-react"

import {

  Activity,

  ChevronDown,

  Cpu,

  Database,

  FileText,

  FolderSync,

  Home,

  MessageSquare,

  Plus,

  ScrollText,

  Settings,

  Shield,

  Trash2,

  TrendingUp,

} from "lucide-react"

import { useWorkstation } from "@/context/WorkstationContext"

import type { AppModule } from "@/types/workstation"



const WORKSTATION_NAV: { id: AppModule; label: string; icon: LucideIcon }[] = [

  { id: "home", label: "Home", icon: Home },

  { id: "chat", label: "Chat", icon: MessageSquare },

  { id: "documents", label: "Documents", icon: FileText },

  { id: "knowledge", label: "Knowledge Base", icon: Database },

  { id: "financial", label: "Financial Intelligence", icon: TrendingUp },

  { id: "analytics", label: "Analytics", icon: Activity },

  { id: "security", label: "Security Center", icon: Shield },

  { id: "settings", label: "Settings", icon: Settings },

]



const SYSTEM_NAV: { id: AppModule; label: string; icon: LucideIcon }[] = [

  { id: "settings", label: "Models", icon: Cpu },

  { id: "knowledge", label: "Indexing", icon: FolderSync },

  { id: "analytics", label: "Logs", icon: ScrollText },

  { id: "analytics", label: "Health", icon: Activity },

]



interface SidebarNavProps {

  collapsed?: boolean

}



function ChatSessionsPanel({ collapsed }: { collapsed: boolean }) {

  const [open, setOpen] = useState(false)

  const {

    sessions,

    activeSessionId,

    setActiveSessionId,

    createSession,

    deleteSession,

  } = useWorkstation()



  const activeSession = sessions.find((s) => s.id === activeSessionId)



  if (collapsed) {

    return (

      <button

        type="button"

        onClick={createSession}

        className="mx-auto mt-1.5 flex items-center justify-center rounded-lg text-[var(--ws-text-muted)] transition-colors hover:bg-[var(--ws-sidebar-hover)] hover:text-white"
        style={{ width: "calc(2rem * var(--ws-density))", height: "calc(2rem * var(--ws-density))" }}

        title="New intelligence session"

        aria-label="New intelligence session"

      >

        <Plus
          className="shrink-0"
          style={{ width: "calc(1.25rem * var(--ws-density))", height: "calc(1.25rem * var(--ws-density))" }}
        />

      </button>

    )

  }



  return (

    <div className="mt-3 border-t border-[var(--ws-card-border)] px-2 pt-3">

      <div className="flex items-center gap-1">

        <button

          type="button"

          onClick={() => setOpen((v) => !v)}

          className="flex min-w-0 flex-1 items-center justify-between gap-1 rounded-lg px-2 py-1.5 text-left transition-colors hover:bg-[var(--ws-sidebar-hover)]"

        >

          <span className="truncate text-[10px] font-semibold uppercase tracking-wider text-[var(--ws-text-muted)]">

            Sessions

          </span>

          <ChevronDown

            className={`h-3 w-3 shrink-0 text-[var(--ws-text-muted)] transition-transform duration-200 ${

              open ? "rotate-0" : "-rotate-90"

            }`}

          />

        </button>

        <button

          type="button"

          onClick={createSession}

          className="shrink-0 rounded-lg p-1.5 text-[var(--ws-text-muted)] transition-colors hover:bg-[var(--ws-sidebar-hover)] hover:text-white"

          aria-label="New session"

          title="New session"

        >

          <Plus className="h-3 w-3" />

        </button>

      </div>



      {!open && activeSession && (

        <p className="mt-1 truncate px-2 text-[10px] font-medium text-[var(--ws-text-secondary)]">

          {activeSession.label}

        </p>

      )}



      {open && (

        <ul className="mt-1 max-h-36 space-y-0.5 overflow-y-auto fluent-scrollbar">

          {sessions.length === 0 ? (

            <li className="px-2 py-1.5 text-[10px] leading-snug text-[var(--ws-text-muted)]">No active sessions</li>

          ) : (

            sessions.map((s) => {

              const active = activeSessionId === s.id

              return (

                <li key={s.id} className="group relative">

                  <button

                    type="button"

                    onClick={() => setActiveSessionId(s.id)}

                    className={`w-full rounded-lg px-2 py-1.5 text-left transition-colors ${

                      active

                        ? "bg-[rgba(16,185,129,0.12)] text-white"

                        : "text-[var(--ws-text-secondary)] hover:bg-[var(--ws-sidebar-hover)] hover:text-white"

                    }`}

                  >

                    <p className="truncate text-[11px] font-medium leading-tight">{s.label}</p>

                    <p className="truncate text-[9px] leading-tight opacity-60">{s.date}</p>

                  </button>

                  <button

                    type="button"

                    onClick={() => deleteSession(s.id)}

                    className="absolute right-1 top-1 rounded p-0.5 text-[var(--ws-text-muted)] opacity-0 transition-opacity hover:text-[var(--ws-danger)] group-hover:opacity-100"

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



function NavSection({

  title,

  items,

  collapsed,

  activeModule,

  onSelect,

}: {

  title: string

  items: { id: AppModule; label: string; icon: LucideIcon }[]

  collapsed: boolean

  activeModule: AppModule

  onSelect: (id: AppModule) => void

}) {

  return (

    <>

      {!collapsed && (

        <p className="ws-nav-section-label px-3 pb-2 pt-1 font-semibold uppercase text-[var(--ws-text-muted)]">

          {title}

        </p>

      )}

      {items.map(({ id, label, icon: Icon }) => (

        <button

          key={`${title}-${label}`}

          type="button"

          onClick={() => onSelect(id)}

          title={collapsed ? label : undefined}

          aria-label={collapsed ? label : undefined}

          className={`group ws-nav-item ${collapsed ? "ws-nav-item-collapsed justify-center px-2" : ""} ${

            activeModule === id ? "ws-nav-item-active" : ""

          }`}

        >

          <Icon className="shrink-0" strokeWidth={1.75} />

          {!collapsed && label}

        </button>

      ))}

    </>

  )

}



export default function SidebarNav({ collapsed = false }: SidebarNavProps) {

  const { module, setModule } = useWorkstation()



  return (

    <nav className={`flex flex-col ${collapsed ? "p-1.5" : "px-2.5 pb-2.5"}`}>

      <NavSection

        title="Workstation"

        items={WORKSTATION_NAV}

        collapsed={collapsed}

        activeModule={module}

        onSelect={setModule}

      />



      <div className="mt-2.5">

        <NavSection

          title="System"

          items={SYSTEM_NAV}

          collapsed={collapsed}

          activeModule={module}

          onSelect={setModule}

        />

      </div>



      {module === "chat" && <ChatSessionsPanel collapsed={collapsed} />}

    </nav>

  )

}


