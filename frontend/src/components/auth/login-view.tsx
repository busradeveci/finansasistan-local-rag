"use client"

import { useState, type FormEvent } from "react"
import { motion } from "framer-motion"
import {
  LogIn,
  Eye,
  EyeOff,
  Shield,
  ShieldCheck,
  Cpu,
  Wifi,
  Radio,
} from "lucide-react"

interface LoginViewProps {
  onLogin: () => void
}

export default function LoginView({ onLogin }: LoginViewProps) {
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!username.trim() || !password.trim()) {
      setError("Please enter both organisation username and password.")
      return
    }

    setIsLoading(true)

    // Simulate authentication delay
    setTimeout(() => {
      setIsLoading(false)
      onLogin()
    }, 1200)
  }

  return (
    <div className="flex min-h-screen" style={{ background: 'linear-gradient(135deg, #e0ecf8 0%, #f4f8fc 50%, #e8f1fb 100%)' }}>
      {/* ===== LEFT: VAULTMIND Enterprise Hero Branding ===== */}
      <div className="relative hidden w-1/2 flex-col justify-center overflow-hidden p-12 lg:flex">
        {/* Ambient cool blue light */}
        <div
          className="pointer-events-none absolute -left-32 -top-32 h-[500px] w-[500px] rounded-full opacity-[0.06]"
          style={{
            background: "radial-gradient(circle, #2563eb 0%, transparent 70%)",
          }}
        />
        <div
          className="pointer-events-none absolute -bottom-32 -right-32 h-[400px] w-[400px] rounded-full opacity-[0.04]"
          style={{
            background: "radial-gradient(circle, #1d4ed8 0%, transparent 70%)",
          }}
        />

        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4, ease: [0.2, 0, 0, 1] }}
          className="relative z-10 max-w-xl"
        >
          {/* Logo + Brand — VAULTMIND */}
          <div className="mb-10 flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#111827] text-white shadow-[0_10px_40px_rgba(15,23,42,0.12)]">
              <Shield className="h-6 w-6" />
            </div>
            <div>
              <div className="text-[20px] font-bold tracking-tight text-[#111827]">
                VAULTMIND
              </div>
              <div className="text-[13px] font-medium tracking-wide text-[#64748B]">
                Enterprise AI Knowledge Node
              </div>
            </div>
          </div>

          {/* Hero tagline */}
          <h1 className="mb-3 text-[32px] font-bold leading-tight tracking-tight text-[#111827]">
            Sovereign AI for
            <br />
            the Enterprise
          </h1>
          <p className="mb-12 max-w-md text-[14px] leading-relaxed text-[#64748B]">
            Deploy, query, and govern LLMs entirely within your perimeter.
            Zero data leakage. Full compliance.
          </p>

          {/* Security feature pills — matching screenshot */}
          <div className="space-y-4">
            {[
              {
                icon: Cpu,
                title: "On-Premise Air-Gapped RAG",
                desc: "Isolated hardware — no internet dependency.",
              },
              {
                icon: Radio,
                title: "Real-time Prompt Injection Guard",
                desc: "Active monitoring and sanitisation of every input.",
              },
              {
                icon: Wifi,
                title: "Zero Outbound Telemetry",
                desc: "Verified: no data, logs, or metrics leave your network.",
              },
            ].map((feat, i) => (
              <motion.div
                key={feat.title}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 * i, duration: 0.3 }}
                className="flex items-start gap-4 rounded-[20px] border border-[rgba(255,255,255,0.55)] bg-[rgba(255,255,255,0.6)] p-4 backdrop-blur-[18px] transition-all duration-200 hover:bg-[rgba(255,255,255,0.8)]"
                style={{
                  boxShadow: "0 4px 16px rgba(15,23,42,0.06), inset 0 1px 0 rgba(255,255,255,0.9)",
                }}
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[14px] bg-[#2563eb]/10 text-[#2563eb]">
                  <feat.icon className="h-4.5 w-4.5" />
                </div>
                <div>
                  <div className="text-[14px] font-semibold text-[#111827]">{feat.title}</div>
                  <div className="text-[12px] text-[#64748B]">{feat.desc}</div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Bottom-left status badge */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.4 }}
          className="absolute bottom-8 left-12 z-10"
        >
          <div
            className="inline-flex items-center gap-2 rounded-[14px] border border-[rgba(255,255,255,0.55)] bg-[rgba(255,255,255,0.6)] px-3.5 py-2 backdrop-blur-[18px]"
            style={{
              boxShadow: "0 4px 16px rgba(15,23,42,0.06), inset 0 1px 0 rgba(255,255,255,0.9)",
            }}
          >
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-green-500" />
            </span>
            <span className="text-[11px] font-medium text-[#64748B]">
              Local Air-Gapped Node · Status: Active
            </span>
          </div>
        </motion.div>
      </div>

      {/* ===== RIGHT: Login Card ===== */}
      <div className="flex w-full items-center justify-center p-6 lg:w-1/2">
        <motion.div
          initial={{ opacity: 0, y: 12, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.22, ease: [0.2, 0, 0, 1] }}
          className="w-full max-w-[420px]"
        >
          {/* Floating glass login card — bg-white/75 backdrop-blur-2xl border border-white/60 shadow-xl rounded-3xl */}
          <div
            className="relative overflow-hidden rounded-3xl border border-white/60 bg-white/75 shadow-xl backdrop-blur-2xl"
          >
            {/* Subtle cool blue radial lighting inside card */}
            <div
              className="pointer-events-none absolute -left-16 -top-16 h-40 w-40 rounded-full opacity-[0.04]"
              style={{
                background: "radial-gradient(circle, #2563eb 0%, transparent 70%)",
              }}
            />
            <div
              className="pointer-events-none absolute -bottom-16 -right-16 h-40 w-40 rounded-full opacity-[0.03]"
              style={{
                background: "radial-gradient(circle, #1d4ed8 0%, transparent 70%)",
              }}
            />

            <div className="relative px-8 pb-8 pt-10">
              {/* Branding — VAULTMIND */}
              <div className="mb-8 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-[14px] bg-[#111827] text-white shadow-[0_10px_40px_rgba(15,23,42,0.12)]">
                  <Shield className="h-5 w-5" />
                </div>
                <div className="leading-tight">
                  <div className="text-[17px] font-semibold tracking-tight text-[#111827]">VAULTMIND</div>
                  <div className="text-[12px] font-medium text-[#64748B]">Enterprise AI Knowledge Node</div>
                </div>
              </div>

              {/* Title */}
              <h1 className="mb-1 text-[22px] font-semibold tracking-tight text-[#111827]">Sign in</h1>
              <p className="mb-7 text-[13px] leading-normal text-[#64748B]">
                Authenticate with your corporate credentials.
              </p>

              {/* Error message */}
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-5 rounded-[14px] border border-red-200/70 bg-red-50/50 px-4 py-2.5 text-[12px] font-medium text-red-700"
                >
                  {error}
                </motion.div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Organisation Username — placeholder: corp\username */}
                <div>
                  <label
                    htmlFor="login-username"
                    className="mb-1.5 block text-[12px] font-semibold tracking-wide text-[#64748B]"
                  >
                    ORGANIZATION USERNAME
                  </label>
                  <input
                    id="login-username"
                    type="text"
                    autoComplete="username"
                    placeholder="corp\username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="h-10 w-full rounded-[14px] border border-[rgba(255,255,255,0.55)] bg-[rgba(255,255,255,0.5)] px-3.5 text-[13px] text-[#111827] placeholder:text-[#94A3B8] backdrop-blur-[18px] transition-all duration-200 hover:bg-[rgba(255,255,255,0.7)] focus:border-[#2563eb]/50 focus:outline-none focus:ring-2 focus:ring-[#2563eb]/30"
                    style={{
                      boxShadow: "0 4px 16px rgba(15,23,42,0.06), inset 0 1px 0 rgba(255,255,255,0.9)",
                    }}
                  />
                </div>

                {/* Password */}
                <div>
                  <label
                    htmlFor="login-password"
                    className="mb-1.5 block text-[12px] font-semibold tracking-wide text-[#64748B]"
                  >
                    Password
                  </label>
                  <div className="relative">
                    <input
                      id="login-password"
                      type={showPassword ? "text" : "password"}
                      autoComplete="current-password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="h-10 w-full rounded-[14px] border border-[rgba(255,255,255,0.55)] bg-[rgba(255,255,255,0.5)] pl-3.5 pr-10 text-[13px] text-[#111827] placeholder:text-[#94A3B8] backdrop-blur-[18px] transition-all duration-200 hover:bg-[rgba(255,255,255,0.7)] focus:border-[#2563eb]/50 focus:outline-none focus:ring-2 focus:ring-[#2563eb]/30"
                      style={{
                        boxShadow: "0 4px 16px rgba(15,23,42,0.06), inset 0 1px 0 rgba(255,255,255,0.9)",
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#94A3B8] transition-colors hover:text-[#64748B]"
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                {/* Submit button — Fluent 2 blue */}
                <button
                  type="submit"
                  disabled={isLoading}
                  className="flex h-10 w-full items-center justify-center gap-2 rounded-[14px] bg-[#2563eb] text-[13px] font-semibold text-white transition-all duration-200 hover:bg-[#3B82F6] focus:outline-none focus:ring-2 focus:ring-[#2563eb]/30 disabled:cursor-not-allowed disabled:opacity-60"
                  style={{
                    boxShadow: "0 4px 16px rgba(37,99,235,0.2)",
                  }}
                >
                  {isLoading ? (
                    <>
                      <svg
                        className="h-4 w-4 animate-spin"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                        />
                      </svg>
                      Signing in…
                    </>
                  ) : (
                    <>
                      <LogIn className="h-4 w-4" />
                      Sign in
                    </>
                  )}
                </button>
              </form>

              {/* Enterprise SSO / Active Directory */}
              <div className="mt-4">
                <button
                  type="button"
                  className="flex h-10 w-full items-center justify-center gap-2 rounded-[14px] border border-[rgba(255,255,255,0.55)] bg-[rgba(255,255,255,0.5)] text-[13px] font-medium text-[#64748B] backdrop-blur-[18px] transition-all duration-200 hover:bg-[rgba(255,255,255,0.8)] focus:outline-none focus:ring-2 focus:ring-[#2563eb]/30"
                  style={{
                    boxShadow: "0 4px 16px rgba(15,23,42,0.06), inset 0 1px 0 rgba(255,255,255,0.9)",
                  }}
                >
                  <svg className="h-4 w-4" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <rect x="1" y="1" width="14" height="14" rx="2" fill="#2563eb" />
                    <path d="M8 3.5v9M3.5 8h9" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
                  </svg>
                  Enterprise SSO / Active Directory
                </button>
              </div>

              {/* Divider */}
              <div className="my-6 flex items-center gap-3">
                <div className="h-px flex-1 bg-[rgba(255,255,255,0.55)]" />
                <span className="text-[11px] font-medium tracking-wide text-[#94A3B8]">SECURE</span>
                <div className="h-px flex-1 bg-[rgba(255,255,255,0.55)]" />
              </div>

              {/* Security note */}
              <div className="flex items-center gap-2 rounded-[14px] bg-[#F3F6FA] px-3.5 py-2.5">
                <ShieldCheck className="h-4 w-4 shrink-0 text-[#2563eb]" />
                <p className="text-[11px] leading-snug text-[#64748B]">
                  This is a fully offline, air-gapped system. No data ever leaves your machine.
                </p>
              </div>

              {/* Card footer — status badge (visible on all screen sizes) */}
              <div className="mt-4 flex items-center gap-2 rounded-[14px] border border-[rgba(255,255,255,0.55)] bg-[rgba(255,255,255,0.5)] px-3.5 py-2.5 backdrop-blur-[18px] lg:hidden"
                style={{
                  boxShadow: "0 4px 16px rgba(15,23,42,0.06), inset 0 1px 0 rgba(255,255,255,0.9)",
                }}
              >
                <span className="relative flex h-2 w-2 shrink-0">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-green-500" />
                </span>
                <span className="text-[11px] font-medium text-[#64748B]">
                  Local Air-Gapped Node · Status: Active
                </span>
              </div>
            </div>
          </div>

          {/* Footer */}
          <p className="mt-6 text-center text-[11px] text-[#94A3B8]">
            &copy; {new Date().getFullYear()} VAULTMIND. All data remains on-device.
          </p>
        </motion.div>
      </div>
    </div>
  )
}