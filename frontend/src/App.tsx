import "./App.css"

import { WorkstationProvider } from "@/context/WorkstationContext"
import { WorkstationShell } from "@/components/dashboard/workstation-shell"
import { BrowserRouter, Routes, Route } from "react-router-dom"
import LoginPage from "./pages/LoginPage"

export default function App() {
  return (
    <WorkstationProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<LoginPage />} />
          <Route path="/workstation" element={<div className="h-full w-full bg-transparent font-sans text-slate-800 antialiased"><WorkstationShell /></div>} />
        </Routes>
      </BrowserRouter>
    </WorkstationProvider>
  )
}