import "./App.css"

import { WorkstationProvider } from "@/context/WorkstationContext"
import { WorkstationShell } from "@/components/dashboard/workstation-shell"

export default function App() {
  return (
    <WorkstationProvider>
      <div className="h-full w-full font-sans text-body">
        <WorkstationShell />
      </div>
    </WorkstationProvider>
  )
}
