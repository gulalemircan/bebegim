'use client';

import React from 'react';
import { sfx } from '@/lib/sounds';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const themes = [
  { id: 'default', label: 'Bordo & Yeşil (Varsayılan)' },
  { id: 'theme-sb', label: 'Siyah & Beyaz' },
  { id: 'theme-pb', label: 'Toz Pembe & Bordo' },
  { id: 'theme-my', label: 'Mavi & Yeşil' },
  { id: 'theme-kb', label: 'Kahverengi & Beyaz' },
];

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const setTheme = (themeId: string) => {
    document.body.className = '';
    if (themeId !== 'default') document.body.classList.add(themeId);
    localStorage?.setItem?.('ee_theme', themeId);
    onClose?.();
    sfx.success();
  };

  return (
    <>
      {isOpen && <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 99 }} />}
      <div style={{
        position: 'fixed', top: 0, left: isOpen ? 0 : -300, width: 280, height: '100%',
        background: 'var(--bg2)', borderRight: '1px solid var(--line)', zIndex: 100,
        transition: 'left 0.3s ease', padding: '30px 20px',
        boxShadow: '5px 0 15px rgba(0,0,0,0.5)'
      }}>
        <button onClick={onClose} style={{
          position: 'absolute', top: 20, right: 20, background: 'none',
          border: 'none', color: 'var(--text-dim)', fontSize: '1.5rem', cursor: 'pointer'
        }}>✕</button>
        <h3 style={{ color: 'var(--tozpembe)', marginBottom: 20, fontFamily: "'Fraunces', serif" }}>Temalar</h3>
        {themes.map((t: any) => (
          <button key={t?.id} onClick={() => setTheme(t?.id)} style={{
            display: 'block', width: '100%', padding: 15, marginBottom: 10,
            background: 'var(--bg)', border: '1px solid var(--line)', borderRadius: 10,
            color: 'var(--beyaz)', fontFamily: "'Manrope', sans-serif", fontWeight: 700,
            textAlign: 'left', cursor: 'pointer', transition: '0.2s'
          }}>
            {t?.label}
          </button>
        ))}
      </div>
    </>
  );
}
