import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Briefcase, FileText, CheckCircle, WifiOff, Activity } from 'lucide-react';

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
      /* İkinci görseldeki ferah, pastel arka plan efekti */
      backgroundColor: '#f4f7fb',
      backgroundImage: 'radial-gradient(at 0% 0%, #e0f2fe 0px, transparent 50%), radial-gradient(at 100% 0%, #fef3c7 0px, transparent 50%), radial-gradient(at 100% 100%, #e0e7ff 0px, transparent 50%)',
      fontFamily: 'Plus Jakarta Sans, sans-serif'
    }}>
      <div style={{
        width: '100%',
        maxWidth: '1200px',
        display: 'grid',
        gridTemplateColumns: '1.2fr 0.8fr',
        gap: '64px',
        alignItems: 'center'
      }}>
        
        {/* ==========================================
            SOL SÜTUN: ÇERÇEVESİZ, HAVADA ASILI TASARIM 
            ========================================== */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          padding: '24px 0'
        }}>
          
          {/* Üst Kısım: Logo ve Başlık */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '32px' }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '10px',
              backgroundColor: '#1C0F45',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <Briefcase size={20} color="#FFFFFF" /> 
            </div>
            <span style={{ fontSize: '13px', fontWeight: 700, color: '#5F6B7A', letterSpacing: '0.15em', textTransform: 'uppercase' }}>
              MICROSOFT FOUNDRY LOCAL
            </span>
          </div>
          
          <h1 style={{ fontSize: '48px', fontWeight: 800, color: '#111827', lineHeight: 1.1, marginBottom: '24px', letterSpacing: '-0.02em' }}>
            FOUNDRY<br />SENTINEL
          </h1>
          
          <p style={{ fontSize: '18px', color: '#4B5563', lineHeight: 1.6, maxWidth: '500px', fontWeight: 500, marginBottom: '64px' }}>
            Secure local intelligence workspace for trusted document retrieval, evidence analysis, and AI-assisted decision support.
          </p>

          {/* Alt Kısım: Özellik Rozetleri */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {[
              { icon: <FileText size={18} color="#007FFF" />, text: "Offline Document Intelligence" },
              { icon: <CheckCircle size={18} color="#007FFF" />, text: "Verified Retrieval Pipeline" },
              { icon: <WifiOff size={18} color="#007FFF" />, text: "Zero External Data Transfer" }
            ].map((feature, idx) => (
              <div key={idx} style={{
                display: 'flex',
                alignItems: 'center',
                gap: '16px',
                padding: '16px 24px',
                backgroundColor: 'rgba(255,255,255,0.4)', // Çok hafif beyazlık
                borderRadius: '16px',
                width: 'fit-content'
              }}>
                <div style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '8px',
                  backgroundColor: 'rgba(0,127,255,0.1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  {feature.icon}
                </div>
                <span style={{ fontSize: '15px', fontWeight: 600, color: '#111827' }}>
                  {feature.text}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* ==========================================
            SAĞ SÜTUN: GLASSMORPHISM GİRİŞ FORMU
            ========================================== */}
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <div style={{
            width: '100%',
            maxWidth: '420px',
            backgroundColor: 'rgba(255, 255, 255, 0.45)', /* Şeffaf Glass Etkisi */
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            border: '1px solid rgba(255, 255, 255, 0.6)', /* Çok ince, zarif sınır */
            borderRadius: '24px',
            boxShadow: '0 20px 40px rgba(0,0,0,0.04)',
            padding: '48px 40px'
          }}>
            <div style={{ marginBottom: '32px' }}>
              <h2 style={{ fontSize: '24px', fontWeight: 700, color: '#111827', margin: '0 0 8px 0', lineHeight: 1.2 }}>Sign In</h2>
              <p style={{ fontSize: '14px', color: '#4B5563', margin: 0 }}>Access your secured workspace.</p>
            </div>

            <form onSubmit={handleSubmit} style={{ width: '100%' }}>
              <div style={{ marginBottom: '24px' }}>
                <label style={{
                  display: 'block',
                  fontSize: '12px',
                  fontWeight: 600,
                  letterSpacing: '0.06em',
                  color: '#4B5563',
                  textTransform: 'uppercase',
                  marginBottom: '8px'
                }}>Work Email</label>
                <input
                  type="email"
                  placeholder="name@organization.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  style={{
                    width: '100%',
                    height: '48px',
                    padding: '0 16px',
                    fontSize: '14px',
                    color: '#111827',
                    backgroundColor: 'rgba(255,255,255,0.7)',
                    border: '1px solid rgba(255,255,255,0.9)',
                    borderRadius: '14px',
                    outline: 'none',
                    transition: 'all 150ms ease-out',
                    boxSizing: 'border-box',
                    boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.02)'
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = '#007FFF';
                    e.target.style.backgroundColor = '#FFFFFF';
                    e.target.style.boxShadow = '0 0 0 3px rgba(0,127,255,0.12)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = 'rgba(255,255,255,0.9)';
                    e.target.style.backgroundColor = 'rgba(255,255,255,0.7)';
                    e.target.style.boxShadow = 'inset 0 2px 4px rgba(0,0,0,0.02)';
                  }}
                />
              </div>

              <div style={{ marginBottom: '32px' }}>
                <label style={{
                  display: 'block',
                  fontSize: '12px',
                  fontWeight: 600,
                  letterSpacing: '0.06em',
                  color: '#4B5563',
                  textTransform: 'uppercase',
                  marginBottom: '8px'
                }}>Password</label>
                <input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  style={{
                    width: '100%',
                    height: '48px',
                    padding: '0 16px',
                    fontSize: '14px',
                    color: '#111827',
                    backgroundColor: 'rgba(255,255,255,0.7)',
                    border: '1px solid rgba(255,255,255,0.9)',
                    borderRadius: '14px',
                    outline: 'none',
                    transition: 'all 150ms ease-out',
                    boxSizing: 'border-box',
                    boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.02)'
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = '#007FFF';
                    e.target.style.backgroundColor = '#FFFFFF';
                    e.target.style.boxShadow = '0 0 0 3px rgba(0,127,255,0.12)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = 'rgba(255,255,255,0.9)';
                    e.target.style.backgroundColor = 'rgba(255,255,255,0.7)';
                    e.target.style.boxShadow = 'inset 0 2px 4px rgba(0,0,0,0.02)';
                  }}
                />
              </div>

              <button
                type="submit"
                style={{
                  width: '100%',
                  height: '48px',
                  backgroundColor: '#0066FF',
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: '14px',
                  fontSize: '14px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  boxShadow: '0 4px 12px rgba(0, 102, 255, 0.2)',
                  transition: 'all 150ms ease-out'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#0052CC';
                  e.currentTarget.style.transform = 'translateY(-1px)';
                  e.currentTarget.style.boxShadow = '0 6px 16px rgba(0, 102, 255, 0.3)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#0066FF';
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 102, 255, 0.2)';
                }}
              >
                Sign In
              </button>

              <div style={{
                width: '100%',
                marginTop: '32px',
                padding: '16px',
                backgroundColor: 'rgba(255,255,255,0.5)',
                border: '1px solid rgba(255,255,255,0.8)',
                borderRadius: '14px',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '12px',
                boxSizing: 'border-box'
              }}>
                <div style={{ marginTop: '2px' }}>
                  <Activity size={18} color="#059669" />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <span style={{ fontSize: '13px', color: '#111827', fontWeight: 700 }}>Runtime Status</span>
                  <span style={{ fontSize: '12px', color: '#4B5563', lineHeight: 1.4 }}>
                    Offline inference environment.<br/>
                    All processing remains on the local workstation.
                  </span>
                </div>
              </div>

              <div style={{
                marginTop: '32px',
                paddingTop: '24px',
                borderTop: '1px solid rgba(0,0,0,0.06)'
              }}>
                <p style={{
                  fontSize: '11px',
                  color: '#6B7280',
                  textAlign: 'center',
                  lineHeight: 1.6,
                  margin: 0
                }}>
                  Access is restricted to authorized personnel.<br/>
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