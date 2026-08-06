import {
  LayoutDashboard,
  FolderSearch,
  FileStack,
  Brain,
  Route,
  ShieldCheck,
  Activity,
  Settings,
  MessagesSquare,
} from "lucide-react"
import type { AppModule } from "@/types/workstation"

export type NavItem = {
  id: AppModule
  label: string
  icon: React.ComponentType<{ className?: string }>
  badge?: string
}

export type NavGroup = {
  items: NavItem[]
}

export const navGroups: NavGroup[] = [
  {
    items: [
      { id: "chat", label: "Conversation", icon: MessagesSquare },
      { id: "workstation", label: "Workstation", icon: LayoutDashboard },
      { id: "knowledge", label: "Knowledge Hub", icon: FolderSearch },
      { id: "documents", label: "Documents", icon: FileStack },
    ],
  },
  {
    items: [
      { id: "router", label: "Model Routing", icon: Route },
      { id: "inference", label: "Inference Runtime", icon: Brain },
      { id: "telemetry", label: "System Telemetry", icon: Activity },
    ],
  },
  {
    items: [
      { id: "security", label: "Security", icon: ShieldCheck },
      { id: "settings", label: "Settings", icon: Settings },
    ],
  },
]

export function findNavItem(id: AppModule): { item: NavItem } {
  for (const group of navGroups) {
    const item = group.items.find((i) => i.id === id)
    if (item) return { item }
  }
  return { item: navGroups[0].items[0] }
}