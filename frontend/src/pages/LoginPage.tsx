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
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px',
      backgroundColor: '#F5F8FC',
      backgroundImage: 'radial-gradient(circle at 15% 20%, rgba(176,224,230,0.10), transparent 32%), radial-gradient(circle at 85% 25%, rgba(135,206,250,0.10), transparent 30%), radial-gradient(circle at 50% 85%, rgba(0,127,255,0.06), transparent 28%)',
      fontFamily: 'Plus Jakarta Sans, sans-serif'
    }}>
      <div style={{
        width: '100%',
        maxWidth: '1200px',
        display: 'grid',
        gridTemplateColumns: '1.1fr 0.9fr',
        gap: '32px',
        alignItems: 'center'
      }}>
        <div style={{
          minHeight: '560px',
          borderRadius: '24px',
          background: 'linear-gradient(180deg, rgba(255,255,255,0.34), rgba(255,255,255,0.18))',
          border: '1px solid rgba(255,255,255,0.36)',
          boxShadow: '0 8px 30px rgba(20,40,70,0.05)',
          backdropFilter: 'blur(10px)',
          WebkitBackdropFilter: 'blur(10px)',
          position: 'relative',
          overflow: 'hidden'
        }}>
          <div style={{
            position: 'absolute',
            inset: '0',
            backgroundImage: 'linear-gradient(rgba(255,255,255,0.14) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.14) 1px, transparent 1px)',
            backgroundSize: '48px 48px',
            opacity: 0.22,
            maskImage: 'linear-gradient(180deg, rgba(0,0,0,0.55), transparent 92%)'
          }} />
          <div style={{
            position: 'absolute',
            top: '16%',
            left: '12%',
            width: '220px',
            height: '220px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(135,206,250,0.18), transparent 70%)',
            filter: 'blur(10px)'
          }} />
          <div style={{
            position: 'absolute',
            right: '14%',
            bottom: '18%',
            width: '180px',
            height: '180px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(176,224,230,0.16), transparent 72%)',
            filter: 'blur(12px)'
          }} />
          <div style={{
            position: 'absolute',
            inset: '0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '48px'
          }}>
            <div style={{
              width: '100%',
              maxWidth: '420px',
              display: 'grid',
              gap: '16px'
            }}>
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '10px',
                width: 'fit-content',
                padding: '8px 14px',
                borderRadius: '999px',
                backgroundColor: 'rgba(255,255,255,0.52)',
                border: '1px solid rgba(255,255,255,0.42)',
                boxShadow: '0 8px 30px rgba(20,40,70,0.05)'
              }}>
                <Shield size={16} color="#00CED1" />
                <span style={{
                  fontSize: '12px',
                  fontWeight: 600,
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  color: '#1C0F45'
                }}>Secure Local Node</span>
              </div>
              <div style={{
                padding: '24px',
                borderRadius: '24px',
                backgroundColor: 'rgba(255,255,255,0.74)',
                border: '1px solid rgba(255,255,255,0.45)',
                boxShadow: '0 8px 32px rgba(40,60,90,0.05)'
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  marginBottom: '18px'
                }}>
                  <div style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '12px',
                    backgroundColor: 'rgba(0,127,255,0.10)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <Lock size={18} color="#007FFF" />
                  </div>
                  <div>
                    <div style={{ fontSize: '22px', fontWeight: 700, color: '#1C0F45', lineHeight: 1.2 }}>Sign in</div>
                    <div style={{ fontSize: '13px', color: '#5F6B7A', marginTop: '4px' }}>Access your enterprise workspace using your organizational credentials.</div>
                  </div>
                </div>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  color: '#00CED1',
                  fontSize: '13px',
                  fontWeight: 600
                }}>
                  <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#00CED1' }} />
                  Protected environment connected.
                </div>
              </div>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <div style={{
            width: '100%',
            maxWidth: '440px',
            backgroundColor: 'rgba(255,255,255,0.90)',
            backdropFilter: 'blur(10px)',
            WebkitBackdropFilter: 'blur(10px)',
            border: '1px solid rgba(255,255,255,0.40)',
            borderRadius: '24px',
            boxShadow: '0 8px 30px rgba(20,40,70,0.05)',
            padding: '40px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '24px' }}>
              <div style={{
                width: '36px',
                height: '36px',
                borderRadius: '12px',
                backgroundColor: 'rgba(0,127,255,0.10)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}>
                <Shield size={18} color="#007FFF" />
              </div>
              <div>
                <h2 style={{ fontSize: '22px', fontWeight: 700, color: '#1C0F45', margin: 0, lineHeight: 1.2 }}>Sign in</h2>
                <p style={{ fontSize: '13px', color: '#5F6B7A', margin: '4px 0 0 0' }}>Access your enterprise workspace using your organizational credentials.</p>
              </div>
            </div>

            <form onSubmit={handleSubmit} style={{ width: '100%' }}>
              <div style={{ marginBottom: '20px' }}>
                <label style={{
                  display: 'block',
                  fontSize: '12px',
                  fontWeight: 600,
                  letterSpacing: '0.06em',
                  color: '#5F6B7A',
                  textTransform: 'uppercase',
                  marginBottom: '8px'
                }}>Organization Username</label>
                <input
                  type="text"
                  placeholder="name@organization.com"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  style={{
                    width: '100%',
                    height: '48px',
                    padding: '0 16px',
                    fontSize: '14px',
                    color: '#1C0F45',
                    backgroundColor: 'rgba(255,255,255,0.88)',
                    border: '1px solid rgba(0,127,255,0.16)',
                    borderRadius: '14px',
                    outline: 'none',
                    transition: 'all 150ms ease-out',
                    boxSizing: 'border-box'
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = '#007FFF';
                    e.target.style.boxShadow = '0 0 0 3px rgba(0,127,255,0.12)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = 'rgba(0,127,255,0.16)';
                    e.target.style.boxShadow = 'none';
                  }}
                />
              </div>

              <div style={{ marginBottom: '24px' }}>
                <label style={{
                  display: 'block',
                  fontSize: '12px',
                  fontWeight: 600,
                  letterSpacing: '0.06em',
                  color: '#5F6B7A',
                  textTransform: 'uppercase',
                  marginBottom: '8px'
                }}>Password</label>
                <input
                  type="password"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  style={{
                    width: '100%',
                    height: '48px',
                    padding: '0 16px',
                    fontSize: '14px',
                    color: '#1C0F45',
                    backgroundColor: 'rgba(255,255,255,0.88)',
                    border: '1px solid rgba(0,127,255,0.16)',
                    borderRadius: '14px',
                    outline: 'none',
                    transition: 'all 150ms ease-out',
                    boxSizing: 'border-box'
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = '#007FFF';
                    e.target.style.boxShadow = '0 0 0 3px rgba(0,127,255,0.12)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = 'rgba(0,127,255,0.16)';
                    e.target.style.boxShadow = 'none';
                  }}
                />
              </div>

              <button
                type="submit"
                style={{
                  width: '100%',
                  height: '48px',
                  backgroundColor: '#000080',
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: '14px',
                  fontSize: '14px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  boxShadow: '0 8px 30px rgba(20,40,70,0.05)',
                  transition: 'all 150ms ease-out'
                }}
                onMouseEnter={(e) => {
                  const button = e.currentTarget;
                  button.style.backgroundColor = '#007FFF';
                  button.style.transform = 'translateY(-1px)';
                  button.style.boxShadow = '0 10px 32px rgba(20,40,70,0.08)';
                }}
                onMouseLeave={(e) => {
                  const button = e.currentTarget;
                  button.style.backgroundColor = '#000080';
                  button.style.transform = 'translateY(0)';
                  button.style.boxShadow = '0 8px 30px rgba(20,40,70,0.05)';
                }}
              >
                Sign In
              </button>

              <div style={{ marginTop: '16px' }}>
                <button
                  type="button"
                  style={{
                    width: '100%',
                    height: '48px',
                    backgroundColor: 'rgba(255,255,255,0.72)',
                    border: '1px solid rgba(0,127,255,0.16)',
                    borderRadius: '14px',
                    color: '#007FFF',
                    fontSize: '14px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'all 150ms ease-out'
                  }}
                  onMouseEnter={(e) => {
                    const button = e.currentTarget;
                    button.style.backgroundColor = 'rgba(0,127,255,0.04)';
                    button.style.borderColor = '#007FFF';
                    button.style.transform = 'translateY(-1px)';
                  }}
                  onMouseLeave={(e) => {
                    const button = e.currentTarget;
                    button.style.backgroundColor = 'rgba(255,255,255,0.72)';
                    button.style.borderColor = 'rgba(0,127,255,0.16)';
                    button.style.transform = 'translateY(0)';
                  }}
                >
                  Enterprise Single-Sign-On
                </button>
              </div>

              <div style={{
                width: '100%',
                marginTop: '16px',
                padding: '12px 16px',
                backgroundColor: 'rgba(255,255,255,0.72)',
                border: '1px solid rgba(255,255,255,0.45)',
                borderRadius: '14px',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                boxSizing: 'border-box'
              }}>
                <Shield size={16} color="#00CED1" />
                <div style={{ display: 'grid', gap: '2px' }}>
                  <span style={{ fontSize: '12px', color: '#1C0F45', fontWeight: 600 }}>Secure Local Node</span>
                  <span style={{ fontSize: '12px', color: '#5F6B7A' }}>Protected environment connected.</span>
                </div>
              </div>

              <p style={{
                fontSize: '12px',
                color: '#5F6B7A',
                textAlign: 'center',
                marginTop: '24px',
                lineHeight: 1.5
              }}>
                Authorized access only. Unauthorized use may be monitored.
              </p>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
