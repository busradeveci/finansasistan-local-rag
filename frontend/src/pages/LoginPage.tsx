import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, Lock, Zap } from 'lucide-react';

const LoginPage = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();
    navigate('/workstation');
  };

  return (
    <div style={{
      backgroundColor: '#F6F9FE',
      minHeight: '100vh',
      fontFamily: 'Inter, sans-serif',
      display: 'flex',
      alignItems: 'center',
      padding: '20px'
    }}>
      {/* Left Column */}
      <div style={{ width: '55%', paddingRight: '40px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '24px' }}>
          <div style={{
            width: '24px',
            height: '24px',
            backgroundColor: '#F0F9FF',
            borderRadius: '6px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Shield size={20} color="#2563EB" />
          </div>
          <span style={{
            color: '#64748B',
            fontSize: '11px',
            fontWeight: 600,
            letterSpacing: '0.15em',
            textTransform: 'uppercase'
          }}>ENTERPRISE AI PLATFORM</span>
        </div>

        <h1 style={{
          fontSize: '32px',
          fontWeight: 700,
          color: '#0F172A',
          marginBottom: '12px'
        }}>FOUNDRY SENTINEL</h1>

        <p style={{
          fontSize: '18px',
          color: '#64748B',
          marginBottom: '24px'
        }}>Sovereign AI Knowledge Node</p>

        <p style={{
          fontSize: '14px',
          color: '#64748B',
          lineHeight: '1.6',
          maxWidth: '420px',
          marginBottom: '40px'
        }}>
          Deploy, query, and govern LLMs entirely within your perimeter. Zero data leakage. Full compliance.
        </p>

        {/* Feature Items */}
        <div style={{ marginBottom: '48px' }}>
          {[
            { icon: <Shield size={16} color="#2563EB" />, text: 'On-Premise Air-Gapped RAG' },
            { icon: <Lock size={16} color="#2563EB" />, text: 'Real-time Prompt Injection Guard' },
            { icon: <Zap size={16} color="#2563EB" />, text: 'Zero Outbound Telemetry' },
          ].map((item, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
              <div style={{
                width: '36px',
                height: '36px',
                backgroundColor: 'rgba(37,99,235,0.08)',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}>
                {item.icon}
              </div>
              <span style={{ fontSize: '14px', color: '#0F172A', fontWeight: 500 }}>{item.text}</span>
            </div>
          ))}
        </div>

        {/* Status Badge */}
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px',
          backgroundColor: 'rgba(34,197,94,0.08)',
          border: '1px solid rgba(34,197,94,0.2)',
          borderRadius: '999px',
          padding: '6px 14px'
        }}>
          <div style={{ width: '8px', height: '8px', backgroundColor: '#16A34A', borderRadius: '50%' }} />
          <span style={{ fontSize: '12px', color: '#16A34A' }}>Local Air-Gapped Node · Status: Active</span>
        </div>
      </div>

      {/* Right Column - Glass Card */}
      <div style={{ width: '45%', display: 'flex', justifyContent: 'center' }}>
        <div style={{
          backgroundColor: 'rgba(255,255,255,0.85)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          border: '1px solid rgba(255,255,255,0.3)',
          borderRadius: '16px',
          boxShadow: '0 8px 32px rgba(15,23,42,0.08)',
          padding: '40px',
          width: '100%',
          maxWidth: '420px'
        }}>
          <h2 style={{ fontSize: '24px', fontWeight: 700, color: '#0F172A', marginBottom: '4px' }}>Sign in</h2>
          <p style={{ fontSize: '14px', color: '#64748B', marginBottom: '32px' }}>
            Authenticate with your corporate credentials.
          </p>

          <form onSubmit={handleSubmit} style={{ width: '100%' }}>
            {/* Username */}
            <div style={{ marginBottom: '20px' }}>
              <label style={{
                display: 'block', fontSize: '11px', fontWeight: 600,
                letterSpacing: '0.08em', color: '#64748B',
                textTransform: 'uppercase', marginBottom: '6px'
              }}>ORGANIZATION USERNAME</label>
              <input
                type="text"
                placeholder="corp\\username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                style={{
                  width: '100%', height: '44px', padding: '0 14px',
                  fontSize: '14px', color: '#0F172A',
                  backgroundColor: 'rgba(255,255,255,0.8)',
                  border: '1px solid #E7EDF5', borderRadius: '10px',
                  outline: 'none', transition: 'all 150ms ease', boxSizing: 'border-box'
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = '#2563EB';
                  e.target.style.boxShadow = '0 0 0 3px rgba(37,99,235,0.12)';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = '#E7EDF5';
                  e.target.style.boxShadow = 'none';
                }}
              />
            </div>

            {/* Password */}
            <div style={{ marginBottom: '24px' }}>
              <label style={{
                display: 'block', fontSize: '11px', fontWeight: 600,
                letterSpacing: '0.08em', color: '#64748B',
                textTransform: 'uppercase', marginBottom: '6px'
              }}>PASSWORD</label>
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{
                  width: '100%', height: '44px', padding: '0 14px',
                  fontSize: '14px', color: '#0F172A',
                  backgroundColor: 'rgba(255,255,255,0.8)',
                  border: '1px solid #E7EDF5', borderRadius: '10px',
                  outline: 'none', transition: 'all 150ms ease', boxSizing: 'border-box'
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = '#2563EB';
                  e.target.style.boxShadow = '0 0 0 3px rgba(37,99,235,0.12)';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = '#E7EDF5';
                  e.target.style.boxShadow = 'none';
                }}
              />
            </div>

            {/* Sign In Button */}
            <button
              type="submit"
              style={{
                width: '100%', height: '44px', backgroundColor: '#2563EB',
                color: 'white', border: 'none', borderRadius: '10px',
                fontSize: '14px', fontWeight: 600, cursor: 'pointer',
                transition: 'all 150ms ease'
              }}
              onMouseEnter={(e) => {
                (e.target as HTMLButtonElement).style.backgroundColor = '#1D4ED8';
                (e.target as HTMLButtonElement).style.boxShadow = '0 4px 16px rgba(37,99,235,0.3)';
                (e.target as HTMLButtonElement).style.transform = 'scale(1.01)';
              }}
              onMouseLeave={(e) => {
                (e.target as HTMLButtonElement).style.backgroundColor = '#2563EB';
                (e.target as HTMLButtonElement).style.boxShadow = 'none';
                (e.target as HTMLButtonElement).style.transform = 'scale(1)';
              }}
            >
              Sign In
            </button>

            {/* OR Divider */}
            <div style={{ display: 'flex', alignItems: 'center', margin: '20px 0', color: '#94A3B8', fontSize: '12px' }}>
              <div style={{ flex: 1, height: '1px', backgroundColor: '#E7EDF5' }} />
              <span style={{ padding: '0 12px' }}>OR</span>
              <div style={{ flex: 1, height: '1px', backgroundColor: '#E7EDF5' }} />
            </div>

            {/* Enterprise SSO Button */}
            <button
              type="button"
              style={{
                width: '100%', height: '44px', backgroundColor: 'transparent',
                border: '1px solid #E7EDF5', borderRadius: '10px',
                color: '#2563EB', fontSize: '14px', fontWeight: 500,
                cursor: 'pointer', transition: 'all 150ms ease'
              }}
              onMouseEnter={(e) => {
                (e.target as HTMLButtonElement).style.backgroundColor = 'rgba(37,99,235,0.04)';
                (e.target as HTMLButtonElement).style.borderColor = '#60A5FA';
              }}
              onMouseLeave={(e) => {
                (e.target as HTMLButtonElement).style.backgroundColor = 'transparent';
                (e.target as HTMLButtonElement).style.borderColor = '#E7EDF5';
              }}
            >
              Enterprise SSO / Active Directory
            </button>

            {/* Node Status Pill */}
            <div style={{
              width: '100%', padding: '10px 16px', marginTop: '16px',
              backgroundColor: '#F1F5F9', border: '1px solid #E7EDF5',
              borderRadius: '10px', display: 'flex', alignItems: 'center', gap: '8px',
              boxSizing: 'border-box'
            }}>
              <Shield size={16} color="#2563EB" />
              <span style={{ fontSize: '12px', color: '#64748B' }}>Local Air-Gapped Node · Status: Active</span>
            </div>

            {/* Footer */}
            <p style={{ fontSize: '11px', color: '#94A3B8', textAlign: 'center', marginTop: '24px' }}>
              Internal banking system · Authorized access only.
            </p>
          </form>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
