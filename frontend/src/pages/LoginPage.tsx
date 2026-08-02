import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, Lock, WifiOff } from 'lucide-react';

/* ─── Blueprint grid SVG background ─────────────────────────────────────── */
const BlueprintGrid = () => (
  <svg
    style={{
      position: 'absolute',
      inset: 0,
      width: '100%',
      height: '100%',
      pointerEvents: 'none',
      opacity: 0.032,
    }}
    xmlns="http://www.w3.org/2000/svg"
  >
    <defs>
      <pattern id="grid-sm" width="32" height="32" patternUnits="userSpaceOnUse">
        <path d="M 32 0 L 0 0 0 32" fill="none" stroke="#1C0F45" strokeWidth="0.6" />
      </pattern>
      <pattern id="grid-lg" width="160" height="160" patternUnits="userSpaceOnUse">
        <rect width="160" height="160" fill="url(#grid-sm)" />
        <path d="M 160 0 L 0 0 0 160" fill="none" stroke="#1C0F45" strokeWidth="1.2" />
      </pattern>
    </defs>
    <rect width="100%" height="100%" fill="url(#grid-lg)" />
  </svg>
);

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    navigate('/workstation');
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
        backgroundColor: '#F5F8FC',
        backgroundImage:
          'radial-gradient(ellipse 60% 50% at 15% 20%, rgba(176,224,230,0.38) 0px, transparent 70%), ' +
          'radial-gradient(ellipse 55% 45% at 85% 80%, rgba(195,222,250,0.42) 0px, transparent 70%), ' +
          'radial-gradient(ellipse 40% 35% at 80% 15%, rgba(200,210,255,0.22) 0px, transparent 60%)',
        fontFamily: '"Inter", "Segoe UI Variable", "Segoe UI", system-ui, sans-serif',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <BlueprintGrid />

      <div
        style={{
          position: 'relative',
          zIndex: 1,
          width: '100%',
          maxWidth: '1140px',
          display: 'grid',
          gridTemplateColumns: '1.25fr 0.75fr',
          gap: '72px',
          alignItems: 'center',
        }}
      >
        {/* ── LEFT COLUMN ── */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            padding: '24px 0',
          }}
        >
          {/* Logo + Brand */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '13px', marginBottom: '40px' }}>
            <div className="h-14 w-14 flex items-center justify-center rounded-xl bg-[#1C0F45] p-2 shadow-md border border-white/20">
              <img src="/briefcase-512x512.svg" alt="VectorVault" className="h-12 w-12 object-contain" />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
              <span
                style={{
                  fontSize: '13px',
                  fontWeight: 700,
                  color: '#1C0F45',
                  letterSpacing: '0.015em',
                }}
              >
                VectorVault
              </span>
              <span
                style={{
                  fontSize: '9.5px',
                  fontWeight: 600,
                  color: '#6B7280',
                  letterSpacing: '0.14em',
                  textTransform: 'uppercase',
                }}
              >
                Enterprise Retrieval Platform
              </span>
            </div>
          </div>

          {/* Hero heading — single-line, refined */}
          <div style={{ marginBottom: '18px' }}>
            <h1
              style={{
                fontSize: '42px',
                fontWeight: 800,
                color: '#1C0F45',
                lineHeight: 1.08,
                margin: '0 0 10px 0',
                letterSpacing: '-0.025em',
              }}
            >
              VectorVault
            </h1>
            <span
              style={{
                display: 'inline-block',
                fontSize: '10.5px',
                fontWeight: 700,
                color: '#007FFF',
                letterSpacing: '0.2em',
                textTransform: 'uppercase',
                lineHeight: 1,
              }}
            >
              Control Center
            </span>
          </div>

          <p
            style={{
              fontSize: '16px',
              color: '#4B5563',
              lineHeight: 1.7,
              maxWidth: '460px',
              fontWeight: 400,
              marginBottom: '52px',
              margin: '0 0 52px 0',
            }}
          >
            Secure enterprise knowledge retrieval, evidence analysis, and AI-assisted decision
            support — fully air-gapped.
          </p>

          {/* Feature badges — flat, borderless, floating */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            {[
              {
                icon: <ShieldCheck size={17} strokeWidth={2} />,
                text: 'Prompt Injection Guard',
                color: '#1C0F45',
              },
              {
                icon: <Lock size={17} strokeWidth={2} />,
                text: 'Global PII Redaction Active',
                color: '#007FFF',
              },
              {
                icon: <WifiOff size={17} strokeWidth={2} />,
                text: 'Zero Outbound Data Transfer',
                color: '#1C0F45',
              },
            ].map((feature, idx) => (
              <div
                key={idx}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '13px',
                }}
              >
                <div
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '9px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    color: feature.color,
                    backgroundColor:
                      idx === 1
                        ? 'rgba(0,127,255,0.08)'
                        : 'rgba(28,15,69,0.07)',
                  }}
                >
                  {feature.icon}
                </div>
                <span
                  style={{
                    fontSize: '14px',
                    fontWeight: 600,
                    color: '#1C0F45',
                    letterSpacing: '-0.005em',
                  }}
                >
                  {feature.text}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* ── RIGHT COLUMN: Glass login card ── */}
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <div
            style={{
              width: '100%',
              maxWidth: '410px',
              backgroundColor: 'rgba(255,255,255,0.62)',
              backdropFilter: 'blur(24px)',
              WebkitBackdropFilter: 'blur(24px)',
              border: '1px solid rgba(255,255,255,0.72)',
              borderRadius: '24px',
              boxShadow:
                '0 24px 48px rgba(28,15,69,0.07), 0 8px 16px rgba(0,0,0,0.04), inset 0 1px 0 rgba(255,255,255,0.9)',
              padding: '44px 38px',
            }}
          >
            {/* Form header */}
            <div style={{ marginBottom: '28px' }}>
              <h2
                style={{
                  fontSize: '21px',
                  fontWeight: 700,
                  color: '#111827',
                  margin: '0 0 5px 0',
                  lineHeight: 1.2,
                  letterSpacing: '-0.01em',
                }}
              >
                Sign In
              </h2>
              <p style={{ fontSize: '13px', color: '#6B7280', margin: 0 }}>
                Access your secured VectorVault workspace.
              </p>
            </div>

            <form onSubmit={handleSubmit} style={{ width: '100%' }}>
              {/* Work Email */}
              <div style={{ marginBottom: '18px' }}>
                <label
                  style={{
                    display: 'block',
                    fontSize: '10.5px',
                    fontWeight: 700,
                    letterSpacing: '0.09em',
                    color: '#374151',
                    textTransform: 'uppercase',
                    marginBottom: '7px',
                  }}
                >
                  Work Email
                </label>
                <input
                  type="email"
                  placeholder="name@organization.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  style={{
                    width: '100%',
                    height: '46px',
                    padding: '0 16px',
                    fontSize: '14px',
                    color: '#111827',
                    backgroundColor: 'rgba(255,255,255,0.78)',
                    border: '1.5px solid rgba(215,225,240,0.9)',
                    borderRadius: '12px',
                    outline: 'none',
                    transition: 'all 150ms ease-out',
                    boxSizing: 'border-box',
                    boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.02)',
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = '#007FFF';
                    e.target.style.backgroundColor = '#FFFFFF';
                    e.target.style.boxShadow = '0 0 0 3px rgba(0,127,255,0.10)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = 'rgba(215,225,240,0.9)';
                    e.target.style.backgroundColor = 'rgba(255,255,255,0.78)';
                    e.target.style.boxShadow = 'inset 0 2px 4px rgba(0,0,0,0.02)';
                  }}
                />
              </div>

              {/* Password */}
              <div style={{ marginBottom: '26px' }}>
                <label
                  style={{
                    display: 'block',
                    fontSize: '10.5px',
                    fontWeight: 700,
                    letterSpacing: '0.09em',
                    color: '#374151',
                    textTransform: 'uppercase',
                    marginBottom: '7px',
                  }}
                >
                  Password
                </label>
                <input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  style={{
                    width: '100%',
                    height: '46px',
                    padding: '0 16px',
                    fontSize: '14px',
                    color: '#111827',
                    backgroundColor: 'rgba(255,255,255,0.78)',
                    border: '1.5px solid rgba(215,225,240,0.9)',
                    borderRadius: '12px',
                    outline: 'none',
                    transition: 'all 150ms ease-out',
                    boxSizing: 'border-box',
                    boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.02)',
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = '#007FFF';
                    e.target.style.backgroundColor = '#FFFFFF';
                    e.target.style.boxShadow = '0 0 0 3px rgba(0,127,255,0.10)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = 'rgba(215,225,240,0.9)';
                    e.target.style.backgroundColor = 'rgba(255,255,255,0.78)';
                    e.target.style.boxShadow = 'inset 0 2px 4px rgba(0,0,0,0.02)';
                  }}
                />
              </div>

              {/* Primary CTA — Navy #245eb5 → #000080 on hover */}
              <button
                type="submit"
                style={{
                  width: '100%',
                  height: '46px',
                  backgroundColor: '#245eb5',
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: '12px',
                  fontSize: '14px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  letterSpacing: '0.03em',
                  boxShadow: '0 4px 16px rgba(36,94,181,0.28), 0 1px 3px rgba(0,0,0,0.08)',
                  transition: 'all 180ms ease-out',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#000080';
                  e.currentTarget.style.transform = 'translateY(-1px)';
                  e.currentTarget.style.boxShadow =
                    '0 8px 24px rgba(0,0,128,0.30), 0 2px 6px rgba(0,0,0,0.1)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#245eb5';
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow =
                    '0 4px 16px rgba(36,94,181,0.28), 0 1px 3px rgba(0,0,0,0.08)';
                }}
              >
                Sign In to VectorVault
              </button>

              {/* Soft status pill — replaces harsh green box */}
              <div
                style={{
                  width: '100%',
                  marginTop: '20px',
                  padding: '11px 14px',
                  backgroundColor: 'rgba(248,250,252,0.82)',
                  border: '1px solid rgba(203,213,225,0.55)',
                  borderRadius: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  boxSizing: 'border-box',
                  backdropFilter: 'blur(6px)',
                  WebkitBackdropFilter: 'blur(6px)',
                }}
              >
                {/* Pulsing green dot */}
                <span style={{ position: 'relative', display: 'flex', flexShrink: 0, width: '8px', height: '8px' }}>
                  <span
                    style={{
                      position: 'absolute',
                      inset: 0,
                      borderRadius: '50%',
                      backgroundColor: '#10b981',
                      opacity: 0.4,
                      animation: 'pulse-ring 2s ease-out infinite',
                    }}
                  />
                  <span
                    style={{
                      position: 'relative',
                      display: 'block',
                      width: '8px',
                      height: '8px',
                      borderRadius: '50%',
                      backgroundColor: '#10b981',
                    }}
                  />
                </span>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                  <span style={{ fontSize: '11.5px', color: '#1e293b', fontWeight: 700, lineHeight: 1 }}>
                    VectorVault Local Node · Status: Active
                  </span>
                  <span style={{ fontSize: '10.5px', color: '#64748b', lineHeight: 1.4 }}>
                    Offline inference environment. All processing remains on-device.
                  </span>
                </div>
              </div>

              {/* Footer legal copy */}
              <div
                style={{
                  marginTop: '22px',
                  paddingTop: '18px',
                  borderTop: '1px solid rgba(0,0,0,0.05)',
                }}
              >
                <p
                  style={{
                    fontSize: '11px',
                    color: '#94a3b8',
                    textAlign: 'center',
                    lineHeight: 1.65,
                    margin: 0,
                    fontWeight: 500,
                    letterSpacing: '0.005em',
                  }}
                >
                  VectorVault Control Center · Authorized access only.
                  <br />
                  System activity may be logged for security and auditing purposes.
                </p>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* Pulse animation keyframes injected inline */}
      <style>{`
        @keyframes pulse-ring {
          0%   { transform: scale(1);   opacity: 0.45; }
          70%  { transform: scale(2.2); opacity: 0; }
          100% { transform: scale(2.2); opacity: 0; }
        }
      `}</style>
    </div>
  );
};

export default LoginPage;