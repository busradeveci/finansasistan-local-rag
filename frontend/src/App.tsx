import { useState } from "react"
import "./App.css"

import { WorkstationProvider } from "@/context/WorkstationContext"
import { WorkstationShell } from "@/components/dashboard/workstation-shell"
import LoginView from "@/components/auth/login-view"

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  if (!isAuthenticated) {
    return <LoginView onLogin={() => setIsAuthenticated(true)} />
  }

  return (
    <WorkstationProvider>
      <div className="h-full w-full bg-transparent font-sans text-[#111827] antialiased">
        <WorkstationShell />
      </div>
    </WorkstationProvider>
  )
}
