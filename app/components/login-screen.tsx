'use client';

import React, { useState } from 'react';

interface LoginScreenProps {
  onLogin: (name: string) => void;
}

export default function LoginScreen({ onLogin }: LoginScreenProps) {
  const [step, setStep] = useState<'password' | 'identity'>('password');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);

  const handlePasswordSubmit = () => {
    const correctPassword = process.env.NEXT_PUBLIC_APP_PASSWORD ?? '1301';
    if (password === correctPassword) {
      setStep('identity');
      setError(false);
    } else {
      setError(true);
    }
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'var(--bg)', zIndex: 100,
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      padding: 20, textAlign: 'center'
    }}>
      {step === 'password' ? (
        <div style={{
          background: 'var(--bg2)', padding: 30, borderRadius: 20,
          border: '1px solid var(--line)', maxWidth: 350, width: '100%',
          boxShadow: '0 10px 30px rgba(0,0,0,0.5)'
        }}>
          <h1 style={{ fontFamily: "'Fraunces', serif", fontSize: '2rem', marginBottom: 5, color: 'var(--tozpembe)' }}>E & E</h1>
          <p style={{ color: 'var(--text-dim)', fontSize: '0.9rem', marginBottom: 20 }}>Sadece ikinize özel alana hoş geldiniz.</p>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e?.target?.value ?? '')}
            onKeyPress={(e) => { if (e?.key === 'Enter') handlePasswordSubmit(); }}
            placeholder="Şifrenizi girin"
            style={{
              width: '100%', padding: 12, marginBottom: 15, borderRadius: 8,
              textAlign: 'center', border: '1px solid var(--line)',
              background: 'var(--bg)', color: 'var(--beyaz)', fontSize: '1rem'
            }}
          />
          <button className="btn-action" style={{ width: '100%', marginBottom: 10 }} onClick={handlePasswordSubmit}>
            Giriş Yap
          </button>
          {error && <div style={{ color: '#e08a8a', fontSize: '0.8rem', marginTop: 10 }}>Şifre hatalı. Lütfen tekrar deneyin.</div>}
        </div>
      ) : (
        <div style={{
          background: 'var(--bg2)', padding: 30, borderRadius: 20,
          border: '1px solid var(--line)', maxWidth: 350, width: '100%',
          boxShadow: '0 10px 30px rgba(0,0,0,0.5)'
        }}>
          <h1 style={{ fontFamily: "'Fraunces', serif", fontSize: '1.6rem', marginBottom: 15, color: 'var(--tozpembe)' }}>Sen Kimsin?</h1>
          <button className="btn-action" style={{ width: '100%', marginBottom: 10 }} onClick={() => onLogin?.('Emircan')}>
            Ben Emircan&apos;ım
          </button>
          <button className="btn-action" style={{ width: '100%', background: 'linear-gradient(135deg, var(--tozpembe), #b67671)' }} onClick={() => onLogin?.('Efsun')}>
            Ben Efsun&apos;um
          </button>
        </div>
      )}
    </div>
  );
}
