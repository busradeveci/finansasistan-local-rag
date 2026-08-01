import {
  LayoutDashboard,
  FolderSearch,
  FileStack,
  Database,
  Brain,
  Route,
  ShieldCheck,
  Activity,
  Settings,
  Cpu,
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
  title: string
  items: NavItem[]
}

export const navGroups: NavGroup[] = [
  {
    title: "Workspace",
    items: [
      { id: "chat", label: "Conversation", icon: MessagesSquare },
      { id: "dashboard", label: "Control Room", icon: LayoutDashboard },
      { id: "knowledge", label: "Knowledge Hub", icon: FolderSearch },
      { id: "documents", label: "Document Inventory", icon: FileStack },
      { id: "vector", label: "Vector Index", icon: Database },
    ],
  },
  {
    title: "Model Routing",
    items: [
      { id: "router", label: "Inference Routing", icon: Route },
      { id: "inference", label: "Inference Runtime", icon: Brain },
      { id: "telemetry", label: "System Telemetry", icon: Activity },
    ],
  },
  {
    title: "System",
    items: [
      { id: "security", label: "Security", icon: ShieldCheck },
      { id: "compute", label: "Compute", icon: Cpu },
      { id: "settings", label: "Settings", icon: Settings },
    ],
  },
]

export function findNavItem(id: AppModule): { group: string; item: NavItem } {
  for (const group of navGroups) {
    const item = group.items.find((i) => i.id === id)
    if (item) return { group: group.title, item }
  }
  return { group: navGroups[0].title, item: navGroups[0].items[0] }
}