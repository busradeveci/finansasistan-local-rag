import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, Lock, WifiOff, Fingerprint, ScanEye, Activity, ChevronRight } from 'lucide-react';

/* ─── Pulsing green dot ────────────────────────────────────────────────── */
const PulsingDot = () => (
  <span className="vv-pulse-wrapper">
    <span className="vv-pulse-ring" />
    <span className="vv-pulse-core" />
  </span>
);

/* ─── Security feature item ────────────────────────────────────────────── */
const SecurityItem = ({ icon, text }: { icon: React.ReactNode; text: string }) => (
  <div className="vv-security-item">
    <div className="vv-security-icon">{icon}</div>
    <span className="vv-security-text">{text}</span>
  </div>
);

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    const emailRegex = /^[a-zA-Z0-9._%+-]+@(vectorvault\.local|bank\.com|organization\.com|enterprise\.com)$/i;
    if (!emailRegex.test(email) || password.length < 5) {
      setError("Unauthorized Operator Credentials. Access denied by Air-Gap Security Manager.");
      setIsSubmitting(false);
      return;
    }

    try {
      const res = await fetch("http://127.0.0.1:8000/api/v1/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.detail || "Authentication Failed.");
      }

      const data = await res.json();
      localStorage.setItem('vectorvault_token', data.token);
      localStorage.setItem('vectorvault_user', JSON.stringify(data.user));

      navigate('/workstation');
    } catch (err: any) {
      setError(err.message || "Backend connection failed. Cannot authenticate.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="vv-login-root">
      {/* Full-page looping video background */}
      <video
        className="vv-login-bg-video"
        autoPlay
        loop
        muted
        playsInline
      >
        <source src="/color-bends-1786174031594.webm" type="video/webm" />
      </video>

      {/* Centered content */}
      <div className="vv-login-container">

        {/* ── GLASS CARD ── */}
        <div className="vv-glass-card vv-fade-in">

          {/* Brand header */}
          <div className="vv-brand-header">
            <div className="vv-brand-text">
              <span className="vv-brand-name">VectorVault</span>
              <span className="vv-brand-subtitle">Enterprise AI Knowledge Platform</span>
            </div>
          </div>

          {/* Main title */}
          <div className="vv-card-title-block">
            <h1 className="vv-card-title">Secure Enterprise AI Workspace</h1>
            <p className="vv-card-desc">
              Access your secure offline AI workspace for enterprise document intelligence and knowledge retrieval.
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="vv-form" autoComplete="off">
            {error && (
              <div className="vv-error-banner">
                <ShieldCheck size={16} strokeWidth={2.2} />
                <span>{error}</span>
              </div>
            )}

            {/* Email field */}
            <div className="vv-field">
              <label className="vv-label" htmlFor="vv-email">Corporate Email</label>
              <input
                id="vv-email"
                type="email"
                placeholder="name@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="vv-input"
                autoComplete="off"
              />
            </div>

            {/* Password field */}
            <div className="vv-field">
              <label className="vv-label" htmlFor="vv-password">Password</label>
              <input
                id="vv-password"
                type="password"
                placeholder="••••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="vv-input"
                autoComplete="off"
              />
            </div>

            {/* Submit button */}
            <button
              type="submit"
              className="vv-submit-btn"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <span className="vv-spinner" />
              ) : (
                <>
                  Access Workspace
                  <ChevronRight size={18} strokeWidth={2.5} />
                </>
              )}
            </button>
          </form>

          {/* Status card */}
          <div className="vv-status-card">
            <div className="vv-status-header">
              <PulsingDot />
              <div className="vv-status-info">
                <span className="vv-status-title">Local AI Runtime</span>
                <span className="vv-status-badge">Operational</span>
              </div>
            </div>
            <p className="vv-status-desc">
              All inference runs locally. No cloud connectivity. No outbound data transfer.
            </p>
          </div>

          {/* Security features */}
          <div className="vv-security-grid">
            <SecurityItem
              icon={<ShieldCheck size={14} strokeWidth={2.2} />}
              text="Prompt Injection Protection"
            />
            <SecurityItem
              icon={<ScanEye size={14} strokeWidth={2.2} />}
              text="Enterprise PII Redaction"
            />
            <SecurityItem
              icon={<Fingerprint size={14} strokeWidth={2.2} />}
              text="Offline Document Intelligence"
            />
            <SecurityItem
              icon={<Activity size={14} strokeWidth={2.2} />}
              text="Air-Gapped AI Processing"
            />
            <SecurityItem
              icon={<WifiOff size={14} strokeWidth={2.2} />}
              text="Zero External Network Access"
            />
            <SecurityItem
              icon={<Lock size={14} strokeWidth={2.2} />}
              text="End-to-End Encryption"
            />
          </div>

          {/* Footer */}
          <div className="vv-card-footer">
            <p>
              Authorized enterprise users only.<br />
              System activity may be monitored for security auditing.
            </p>
          </div>
        </div>
      </div>

      {/* Scoped styles */}
      <style>{`
        /* ═══════════════════════════════════════════════════════════════════
           VectorVault Login — Premium Glassmorphism
           ═══════════════════════════════════════════════════════════════════ */

        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');

        .vv-login-root {
          position: fixed;
          inset: 0;
          width: 100vw;
          height: 100vh;
          overflow-y: auto;
          overflow-x: hidden;
          font-family: 'Inter', 'Segoe UI Variable', 'Segoe UI', system-ui, -apple-system, sans-serif;
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
        }

        /* ── Background video ── */
        .vv-login-bg-video {
          position: fixed;
          inset: 0;
          width: 100vw;
          height: 100vh;
          object-fit: cover;
          z-index: -1;
          opacity: 1;
          filter: none;
        }

        /* ── Container ── */
        .vv-login-container {
          position: relative;
          z-index: 1;
          width: 100%;
          min-height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 28px 24px;
        }

        /* ── Glass Card ── */
        .vv-glass-card {
          width: 100%;
          max-width: 480px;
          background: rgba(255, 255, 255, 0.55);
          backdrop-filter: blur(28px) saturate(1.2);
          -webkit-backdrop-filter: blur(28px) saturate(1.2);
          border: 1px solid rgba(255, 255, 255, 0.4);
          border-radius: 24px;
          box-shadow:
            0 32px 64px rgba(0, 0, 0, 0.18),
            0 8px 24px rgba(0, 0, 0, 0.12),
            inset 0 1px 0 rgba(255, 255, 255, 0.5),
            inset 0 0 0 0.5px rgba(255, 255, 255, 0.25);
          padding: 32px 36px 24px;
          overflow: hidden;
          position: relative;
        }

        /* Subtle top light reflection */
        .vv-glass-card::before {
          content: '';
          position: absolute;
          top: 0;
          left: 10%;
          right: 10%;
          height: 1px;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent);
        }

        /* ── Brand Header ── */
        .vv-brand-header {
          display: flex;
          align-items: center;
          gap: 14px;
          margin-bottom: 20px;
        }

        .vv-brand-text {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .vv-brand-name {
          font-size: 1.5rem; /* text-2xl */
          font-weight: 700;
          color: #0f172a;
          letter-spacing: -0.01em;
        }

        .vv-brand-subtitle {
          font-size: 11px;
          font-weight: 500;
          color: rgba(30, 41, 59, 0.6);
          letter-spacing: 0.06em;
          text-transform: uppercase;
        }

        /* ── Title Block ── */
        .vv-card-title-block {
          margin-bottom: 20px;
        }

        .vv-card-title {
          font-size: 24px;
          font-weight: 700;
          color: #0f172a;
          line-height: 1.2;
          margin: 0 0 8px 0;
          letter-spacing: -0.02em;
        }

        .vv-card-desc {
          font-size: 13.5px;
          font-weight: 400;
          color: #475569;
          line-height: 1.6;
          margin: 0;
        }

        /* ── Form ── */
        .vv-form {
          display: flex;
          flex-direction: column;
          gap: 0;
          margin-bottom: 20px;
        }

        .vv-field {
          margin-bottom: 14px;
        }

        .vv-label {
          display: block;
          font-size: 11.5px;
          font-weight: 600;
          color: #64748b;
          letter-spacing: 0.04em;
          text-transform: uppercase;
          margin-bottom: 8px;
        }

        .vv-input {
          width: 100%;
          height: 46px;
          padding: 0 16px;
          font-size: 14.5px;
          font-weight: 400;
          font-family: inherit;
          color: #1e293b;
          background: rgba(255, 255, 255, 0.6);
          border: 1px solid #e2e8f0;
          border-radius: 14px;
          outline: none;
          transition: all 200ms cubic-bezier(0.2, 0, 0, 1);
          box-sizing: border-box;
          box-shadow: inset 0 1px 2px rgba(15, 23, 42, 0.03);
        }

        .vv-input::placeholder {
          color: #94a3b8;
          font-weight: 400;
        }

        .vv-input:focus {
          background: rgba(255, 255, 255, 0.85);
          border-color: rgba(59, 130, 246, 0.55);
          box-shadow:
            0 0 0 3px rgba(59, 130, 246, 0.12),
            inset 0 1px 2px rgba(15, 23, 42, 0.02);
        }

        .vv-input:hover:not(:focus) {
          border-color: #cbd5e1;
          background: rgba(255, 255, 255, 0.75);
        }

        /* ── Error Banner ── */
        .vv-error-banner {
          display: flex;
          align-items: flex-start;
          gap: 10px;
          padding: 12px 14px;
          background: rgba(239, 68, 68, 0.08);
          border: 1px solid rgba(239, 68, 68, 0.2);
          border-radius: 12px;
          margin-bottom: 18px;
          color: #b91c1c;
          font-size: 12.5px;
          font-weight: 500;
          line-height: 1.45;
        }

        .vv-error-banner svg {
          flex-shrink: 0;
          margin-top: 1px;
          color: #dc2626;
        }

        /* ── Submit Button ── */
        .vv-submit-btn {
          width: 100%;
          height: 46px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
          color: #ffffff;
          border: 1px solid rgba(59, 130, 246, 0.3);
          border-radius: 14px;
          font-size: 15px;
          font-weight: 600;
          font-family: inherit;
          cursor: pointer;
          letter-spacing: 0.01em;
          box-shadow:
            0 4px 16px rgba(37, 99, 235, 0.35),
            0 1px 3px rgba(0, 0, 0, 0.12),
            inset 0 1px 0 rgba(255, 255, 255, 0.12);
          transition: all 220ms cubic-bezier(0.2, 0, 0, 1);
          position: relative;
          overflow: hidden;
        }

        .vv-submit-btn::before {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(135deg, rgba(255,255,255,0.1) 0%, transparent 50%);
          opacity: 0;
          transition: opacity 200ms ease;
        }

        .vv-submit-btn:hover:not(:disabled) {
          background: linear-gradient(135deg, #1d4ed8 0%, #1e40af 100%);
          transform: translateY(-1px);
          box-shadow:
            0 8px 28px rgba(37, 99, 235, 0.45),
            0 2px 6px rgba(0, 0, 0, 0.15),
            inset 0 1px 0 rgba(255, 255, 255, 0.15);
        }

        .vv-submit-btn:hover::before {
          opacity: 1;
        }

        .vv-submit-btn:active:not(:disabled) {
          transform: translateY(0);
          box-shadow:
            0 2px 8px rgba(37, 99, 235, 0.3),
            0 1px 2px rgba(0, 0, 0, 0.1);
        }

        .vv-submit-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        /* ── Spinner ── */
        .vv-spinner {
          width: 20px;
          height: 20px;
          border: 2px solid rgba(255, 255, 255, 0.25);
          border-top-color: #ffffff;
          border-radius: 50%;
          animation: vv-spin 0.7s linear infinite;
        }

        @keyframes vv-spin {
          to { transform: rotate(360deg); }
        }

        /* ── Status Card ── */
        .vv-status-card {
          background: rgba(255, 255, 255, 0.45);
          border: 1px solid #e2e8f0;
          border-radius: 12px;
          padding: 12px 14px;
          margin-bottom: 16px;
        }

        .vv-status-header {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 6px;
        }

        .vv-status-info {
          display: flex;
          align-items: center;
          gap: 10px;
          flex: 1;
        }

        .vv-status-title {
          font-size: 12.5px;
          font-weight: 600;
          color: #0f172a;
        }

        .vv-status-badge {
          font-size: 10px;
          font-weight: 600;
          color: #059669;
          background: rgba(5, 150, 105, 0.08);
          border: 1px solid rgba(5, 150, 105, 0.18);
          border-radius: 6px;
          padding: 2px 8px;
          letter-spacing: 0.03em;
          text-transform: uppercase;
        }

        .vv-status-desc {
          font-size: 11.5px;
          font-weight: 400;
          color: #475569;
          line-height: 1.55;
          margin: 0;
        }

        /* ── Security Grid ── */
        .vv-security-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 6px;
          margin-bottom: 16px;
        }

        .vv-security-item {
          display: flex;
          align-items: center;
          gap: 7px;
          padding: 6px 9px;
          background: rgba(255, 255, 255, 0.4);
          border: 1px solid #e2e8f0;
          border-radius: 9px;
          transition: all 200ms ease;
        }

        .vv-security-item:hover {
          background: rgba(255, 255, 255, 0.7);
          border-color: #cbd5e1;
        }

        .vv-security-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          color: #2563eb;
        }

        .vv-security-text {
          font-size: 11px;
          font-weight: 500;
          color: #334155;
          line-height: 1.3;
        }

        /* ── Footer ── */
        .vv-card-footer {
          padding-top: 18px;
          border-top: 1px solid #e2e8f0;
        }

        .vv-card-footer p {
          font-size: 10.5px;
          font-weight: 400;
          color: #475569;
          text-align: center;
          line-height: 1.65;
          margin: 0;
          letter-spacing: 0.005em;
        }

        /* ── Pulsing Dot ── */
        .vv-pulse-wrapper {
          position: relative;
          display: flex;
          flex-shrink: 0;
          width: 8px;
          height: 8px;
        }

        .vv-pulse-ring {
          position: absolute;
          inset: 0;
          border-radius: 50%;
          background-color: #34d399;
          opacity: 0.4;
          animation: vv-pulse-ring 2s ease-out infinite;
        }

        .vv-pulse-core {
          position: relative;
          display: block;
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background-color: #34d399;
        }

        @keyframes vv-pulse-ring {
          0%   { transform: scale(1);   opacity: 0.45; }
          70%  { transform: scale(2.2); opacity: 0; }
          100% { transform: scale(2.2); opacity: 0; }
        }

        /* ── Fade in animation ── */
        .vv-fade-in {
          animation: vv-fade-up 0.6s cubic-bezier(0.16, 1, 0.3, 1) both;
        }

        @keyframes vv-fade-up {
          from {
            opacity: 0;
            transform: translateY(16px) scale(0.98);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        /* ── Responsive ── */
        @media (max-width: 540px) {
          .vv-glass-card {
            padding: 32px 24px 28px;
            border-radius: 20px;
            max-width: 100%;
          }

          .vv-card-title {
            font-size: 20px;
          }

          .vv-security-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
};

export default LoginPage;