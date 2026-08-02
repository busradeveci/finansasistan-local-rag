import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, FileSearch, Lock, WifiOff, Activity } from 'lucide-react';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    navigate('/workstation');
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px',
      backgroundColor: '#f4f7fb',
      backgroundImage:
        'radial-gradient(at 0% 0%, #e0f2fe 0px, transparent 50%), ' +
        'radial-gradient(at 100% 0%, #e0e7ff 0px, transparent 50%), ' +
        'radial-gradient(at 100% 100%, #f0fdf4 0px, transparent 50%)',
      fontFamily: '"Segoe UI Variable", "Segoe UI", system-ui, sans-serif',
    }}>
      <div style={{
        width: '100%',
        maxWidth: '1200px',
        display: 'grid',
        gridTemplateColumns: '1.2fr 0.8fr',
        gap: '64px',
        alignItems: 'center',
      }}>

        {/* ── LEFT COLUMN: Frameless floating design ── */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          padding: '24px 0',
        }}>

          {/* Logo + Brand badge */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '36px' }}>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #000080 0%, #1a1aff 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 12px rgba(0,0,128,0.3)',
            }}>
              <Shield size={18} color="#FFFFFF" />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1px' }}>
              <span style={{
                fontSize: '11px',
                fontWeight: 700,
                color: '#000080',
                letterSpacing: '0.18em',
                textTransform: 'uppercase',
              }}>
                VectorVault
              </span>
              <span style={{
                fontSize: '10px',
                fontWeight: 500,
                color: '#6B7280',
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
              }}>
                Enterprise Retrieval Platform
              </span>
            </div>
          </div>

          {/* Hero heading */}
          <h1 style={{
            fontSize: '52px',
            fontWeight: 800,
            color: '#0F172A',
            lineHeight: 1.05,
            marginBottom: '20px',
            letterSpacing: '-0.03em',
          }}>
            VECTOR<br />
            <span style={{ color: '#000080' }}>VAULT</span>
          </h1>

          <p style={{
            fontSize: '13px',
            fontWeight: 600,
            color: '#000080',
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            marginBottom: '16px',
          }}>
            Control Center
          </p>

          <p style={{
            fontSize: '17px',
            color: '#4B5563',
            lineHeight: 1.65,
            maxWidth: '480px',
            fontWeight: 400,
            marginBottom: '56px',
          }}>
            Secure enterprise knowledge retrieval, evidence analysis, and AI-assisted decision support — fully air-gapped.
          </p>

          {/* Feature badges */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {[
              { icon: <Lock size={16} color="#000080" />, text: 'Prompt Injection Guard' },
              { icon: <FileSearch size={16} color="#000080" />, text: 'Global PII Redaction Active' },
              { icon: <WifiOff size={16} color="#000080" />, text: 'Zero Outbound Data Transfer' },
            ].map((feature, idx) => (
              <div key={idx} style={{
                display: 'flex',
                alignItems: 'center',
                gap: '14px',
                padding: '14px 20px',
                backgroundColor: 'rgba(255,255,255,0.55)',
                backdropFilter: 'blur(8px)',
                WebkitBackdropFilter: 'blur(8px)',
                border: '1px solid rgba(255,255,255,0.75)',
                borderRadius: '14px',
                width: 'fit-content',
                boxShadow: '0 4px 12px rgba(0,0,128,0.04)',
              }}>
                <div style={{
                  width: '30px',
                  height: '30px',
                  borderRadius: '8px',
                  backgroundColor: 'rgba(0,0,128,0.07)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}>
                  {feature.icon}
                </div>
                <span style={{ fontSize: '14px', fontWeight: 600, color: '#111827', whiteSpace: 'nowrap' }}>
                  {feature.text}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* ── RIGHT COLUMN: Glass login form ── */}
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <div style={{
            width: '100%',
            maxWidth: '420px',
            backgroundColor: 'rgba(255,255,255,0.50)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            border: '1px solid rgba(255,255,255,0.65)',
            borderRadius: '24px',
            boxShadow: '0 24px 48px rgba(0,0,128,0.06), 0 8px 16px rgba(0,0,0,0.03)',
            padding: '48px 40px',
          }}>

            {/* Form header */}
            <div style={{ marginBottom: '32px' }}>
              <h2 style={{
                fontSize: '22px',
                fontWeight: 700,
                color: '#111827',
                margin: '0 0 6px 0',
                lineHeight: 1.2,
              }}>
                Sign In
              </h2>
              <p style={{ fontSize: '13px', color: '#6B7280', margin: 0 }}>
                Access your secured VectorVault workspace.
              </p>
            </div>

            <form onSubmit={handleSubmit} style={{ width: '100%' }}>

              {/* Work Email field */}
              <div style={{ marginBottom: '20px' }}>
                <label style={{
                  display: 'block',
                  fontSize: '11px',
                  fontWeight: 700,
                  letterSpacing: '0.08em',
                  color: '#374151',
                  textTransform: 'uppercase',
                  marginBottom: '8px',
                }}>
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
                    backgroundColor: 'rgba(255,255,255,0.75)',
                    border: '1.5px solid rgba(220,228,240,0.9)',
                    borderRadius: '12px',
                    outline: 'none',
                    transition: 'all 150ms ease-out',
                    boxSizing: 'border-box',
                    boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.02)',
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = '#000080';
                    e.target.style.backgroundColor = '#FFFFFF';
                    e.target.style.boxShadow = '0 0 0 3px rgba(0,0,128,0.10)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = 'rgba(220,228,240,0.9)';
                    e.target.style.backgroundColor = 'rgba(255,255,255,0.75)';
                    e.target.style.boxShadow = 'inset 0 2px 4px rgba(0,0,0,0.02)';
                  }}
                />
              </div>

              {/* Password field */}
              <div style={{ marginBottom: '28px' }}>
                <label style={{
                  display: 'block',
                  fontSize: '11px',
                  fontWeight: 700,
                  letterSpacing: '0.08em',
                  color: '#374151',
                  textTransform: 'uppercase',
                  marginBottom: '8px',
                }}>
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
                    backgroundColor: 'rgba(255,255,255,0.75)',
                    border: '1.5px solid rgba(220,228,240,0.9)',
                    borderRadius: '12px',
                    outline: 'none',
                    transition: 'all 150ms ease-out',
                    boxSizing: 'border-box',
                    boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.02)',
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = '#000080';
                    e.target.style.backgroundColor = '#FFFFFF';
                    e.target.style.boxShadow = '0 0 0 3px rgba(0,0,128,0.10)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = 'rgba(220,228,240,0.9)';
                    e.target.style.backgroundColor = 'rgba(255,255,255,0.75)';
                    e.target.style.boxShadow = 'inset 0 2px 4px rgba(0,0,0,0.02)';
                  }}
                />
              </div>

              {/* Primary CTA */}
              <button
                type="submit"
                style={{
                  width: '100%',
                  height: '46px',
                  backgroundColor: '#000080',
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: '12px',
                  fontSize: '14px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  letterSpacing: '0.04em',
                  boxShadow: '0 4px 16px rgba(0,0,128,0.25)',
                  transition: 'all 150ms ease-out',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#000066';
                  e.currentTarget.style.transform = 'translateY(-1px)';
                  e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,128,0.32)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#000080';
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,128,0.25)';
                }}
              >
                Sign In to VectorVault
              </button>

              {/* Runtime status badge */}
              <div style={{
                width: '100%',
                marginTop: '24px',
                padding: '14px 16px',
                backgroundColor: 'rgba(240,253,244,0.7)',
                border: '1px solid rgba(134,239,172,0.5)',
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '12px',
                boxSizing: 'border-box',
              }}>
                <div style={{ marginTop: '1px', flexShrink: 0 }}>
                  <Activity size={16} color="#059669" />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                  <span style={{ fontSize: '12px', color: '#065f46', fontWeight: 700 }}>
                    VectorVault Local Node · Status: Active
                  </span>
                  <span style={{ fontSize: '11px', color: '#374151', lineHeight: 1.45 }}>
                    Offline inference environment. All processing remains on the local workstation.
                  </span>
                </div>
              </div>

              {/* Footer disclaimer */}
              <div style={{
                marginTop: '24px',
                paddingTop: '20px',
                borderTop: '1px solid rgba(0,0,0,0.06)',
              }}>
                <p style={{
                  fontSize: '11px',
                  color: '#9CA3AF',
                  textAlign: 'center',
                  lineHeight: 1.6,
                  margin: 0,
                }}>
                  VectorVault Control Center · Authorized access only.<br />
                  System activity may be logged for security and auditing purposes.
                </p>
              </div>

            </form>
          </div>
        </div>

      </div>
    </div>
  );
};

export default LoginPage;