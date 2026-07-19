import "./App.css"

import { WorkstationProvider } from "@/context/WorkstationContext"
import { WorkstationShell } from "@/components/dashboard/workstation-shell"

export default function App() {
  return (
    <WorkstationProvider>
      <div className="h-full w-full bg-transparent font-sans text-slate-800 antialiased">
        <WorkstationShell />
      </div>
    </WorkstationProvider>
  )
}
