'use client';

import React, { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { ref, onValue, set } from 'firebase/database';
import { sfx } from '@/lib/sounds';

interface Props { playerName: string; }

export default function AmiralBatti({ playerName }: Props) {
  const [showLobby, setShowLobby] = useState(true);
  const [boardData, setBoardData] = useState<any>(null);
  const [showRules, setShowRules] = useState(false);

  useEffect(() => {
    const unsub = onValue(ref(db, 'board'), (snap: any) => {
      const d = snap?.val?.();
      if (d?.type === 'amiral') { setBoardData(d); setShowLobby(false); }
    });
    return () => unsub?.();
  }, []);

  const startGame = () => {
    set(ref(db, 'board'), { type: 'amiral', cells: Array(100).fill(''), turn: 'Herkes Oynayabilir' });
    sfx.success();
  };

  const handleClick = (i: number) => {
    if (!boardData) return;
    const cells = boardData?.cells ?? [];
    const val = cells?.[i] ?? '';
    sfx.piece();
    const newVal = val === '💥' ? '🌊' : (val === '🌊' ? '' : '💥');
    set(ref(db, `board/cells/${i}`), newVal);
  };

  if (showLobby) {
    return (
      <>
        <div className="eyebrow">Sıra Takibi Yok</div>
        <h1 className="section-title">Amiral Battı</h1>
        <div style={{ background: 'var(--bg2)', border: '1px solid var(--line)', borderRadius: 16, padding: 20, textAlign: 'center' }}>
          <div style={{ background: 'var(--panel)', border: '1px dashed var(--tozpembe)', borderRadius: 12, padding: 15 }}>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-dim)', marginBottom: 15 }}>Ortak düşman vurma (Mayın Tarlası tarzı)</p>
            <button className="btn-action" onClick={startGame} style={{ width: '100%' }}>Masayı Kur & Başla</button>
            <button className="btn-ghost" onClick={() => setShowRules(true)} style={{ width: '100%', marginTop: 10 }}>Kuralları Oku</button>
          </div>
          {showRules && (
            <div style={{ position: 'fixed', inset: 0, background: 'rgba(10,6,5,0.75)', zIndex: 150, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
              <div style={{ background: 'var(--bg2)', border: '1px solid var(--line)', borderRadius: 16, padding: 22, maxWidth: 400, width: '100%' }}>
                <h2 style={{ color: 'var(--tozpembe)', marginTop: 0 }}>Amiral Battı Kuralları</h2>
                <div style={{ fontSize: '0.9rem', lineHeight: 1.5, color: 'var(--beyaz)', marginBottom: 20 }}>Herkes önceden kararlaştırılan sayı kadar gemisini bir kağıda çizer. Sırası gelen haritadaki bir kareye tıklar ve Bomba (💥) bırakır. Eğer gemiye isabet ettiyse &apos;Vuruldu&apos; der, etmediyse tekrar tıklayıp Su (🌊) yapılır.</div>
                <button className="btn-action" onClick={() => setShowRules(false)} style={{ width: '100%' }}>Anladım, Kapat</button>
              </div>
            </div>
          )}
        </div>
      </>
    );
  }

  const cells = boardData?.cells ?? [];

  return (
    <>
      <div className="eyebrow">Sıra Takibi Yok</div>
      <h1 className="section-title">Amiral Battı</h1>
      <div style={{ background: 'var(--bg2)', border: '1px solid var(--line)', borderRadius: 16, padding: 20, textAlign: 'center' }}>
        <div style={{ width: '100%', maxWidth: 500, margin: '0 auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(10, 1fr)', width: '100%', aspectRatio: '1', border: '6px solid var(--line)', borderRadius: 8, background: 'var(--bg)', boxShadow: '0 10px 25px rgba(0,0,0,0.5)' }}>
            {(cells ?? []).map((val: string, i: number) => (
              <div key={i} onClick={() => handleClick(i)} style={{
                width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 'clamp(0.8rem, 3vw, 2.5rem)', cursor: 'pointer', userSelect: 'none',
                background: 'var(--mavi)', border: '1px solid rgba(255,255,255,0.1)'
              }}>
                {val && <span style={{ pointerEvents: 'none' }}>{val}</span>}
              </div>
            ))}
          </div>
        </div>
        <button className="btn-ghost" onClick={() => setShowLobby(true)} style={{ marginTop: 20 }}>Lobiye Dön</button>
      </div>
    </>
  );
}
