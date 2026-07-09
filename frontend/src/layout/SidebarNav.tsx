import type { LucideIcon } from "lucide-react"
import {
  BarChart3,
  Database,
  FileText,
  Home,
  MessageSquare,
  Settings,
  Shield,
} from "lucide-react"
import { useWorkstation } from "@/context/WorkstationContext"
import type { AppModule } from "@/types/workstation"

const NAV: { id: AppModule; label: string; icon: LucideIcon }[] = [
  { id: "home", label: "Home", icon: Home },
  { id: "chat", label: "Chat", icon: MessageSquare },
  { id: "documents", label: "Documents", icon: FileText },
  { id: "knowledge", label: "Knowledge Base", icon: Database },
  { id: "analytics", label: "Analytics", icon: BarChart3 },
  { id: "security", label: "Security Center", icon: Shield },
  { id: "settings", label: "Settings", icon: Settings },
]

export default function SidebarNav() {
  const { module, setModule } = useWorkstation()

  return (
    <nav className="flex flex-col gap-1 p-4">
      <p className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-[#9FB0C8]">
        Workstation
      </p>
      {NAV.map(({ id, label, icon: Icon }) => (
        <button
          key={id}
          type="button"
          onClick={() => setModule(id)}
          className={`group ws-nav-item ${module === id ? "ws-nav-item-active" : ""}`}
        >
          <span className="ws-nav-indicator" aria-hidden />
          <Icon className="h-4 w-4 shrink-0" strokeWidth={1.75} />
          {label}
        </button>
      ))}
    </nav>
  )
}
