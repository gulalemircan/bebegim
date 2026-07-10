'use client';

import React, { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { ref, onValue, set } from 'firebase/database';
import { sfx } from '@/lib/sounds';

interface Props { playerName: string; }

const initDama = () => {
  const cells = Array(64).fill('');
  for (let i = 8; i < 24; i++) cells[i] = '⚫';
  for (let i = 40; i < 56; i++) cells[i] = '⚪';
  return cells;
};

export default function Dama({ playerName }: Props) {
  const [showLobby, setShowLobby] = useState(true);
  const [starter, setStarter] = useState('Emircan');
  const [boardData, setBoardData] = useState<any>(null);
  const [selected, setSelected] = useState(-1);
  const [showRules, setShowRules] = useState(false);

  useEffect(() => {
    const unsub = onValue(ref(db, 'board'), (snap: any) => {
      const d = snap?.val?.();
      if (d?.type === 'dama') { setBoardData(d); setShowLobby(false); }
    });
    return () => unsub?.();
  }, []);

  const startGame = () => {
    set(ref(db, 'board'), { type: 'dama', cells: initDama(), turn: starter });
    sfx.success();
  };

  const handleClick = (i: number) => {
    if (!boardData) return;
    const cells = boardData?.cells ?? [];
    const turn = boardData?.turn ?? '';
    const val = cells?.[i] ?? '';

    if (selected === -1) {
      if (turn !== playerName) return;
      if (val) { setSelected(i); sfx.piece(); }
    } else {
      if (selected === i) { setSelected(-1); sfx.piece(); return; }
      const newCells = [...(cells ?? [])];
      newCells[i] = newCells[selected];
      newCells[selected] = '';
      setSelected(-1);
      sfx.piece();
      set(ref(db, 'board/cells'), newCells);
      set(ref(db, 'board/turn'), turn === 'Emircan' ? 'Efsun' : 'Emircan');
    }
  };

  if (showLobby) {
    return (
      <>
        <div className="eyebrow">Sandbox - Sıra Takibi</div>
        <h1 className="section-title">Dama</h1>
        <div style={{ background: 'var(--bg2)', border: '1px solid var(--line)', borderRadius: 16, padding: 20, textAlign: 'center' }}>
          <div style={{ background: 'var(--panel)', border: '1px dashed var(--tozpembe)', borderRadius: 12, padding: 15 }}>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-dim)', marginBottom: 15 }}>İlk kim başlayacak?</p>
            <select value={starter} onChange={(e) => setStarter(e?.target?.value ?? 'Emircan')} style={{ width: '100%', padding: 10, marginBottom: 10, borderRadius: 8, border: '1px solid var(--line)', background: 'var(--bg)', color: 'var(--beyaz)' }}>
              <option value="Emircan">Emircan (Beyaz)</option><option value="Efsun">Efsun (Siyah)</option>
            </select>
            <button className="btn-action" onClick={startGame} style={{ width: '100%' }}>Masayı Kur & Başla</button>
            <button className="btn-ghost" onClick={() => setShowRules(true)} style={{ width: '100%', marginTop: 10 }}>Kuralları Oku</button>
          </div>
          {showRules && (
            <div style={{ position: 'fixed', inset: 0, background: 'rgba(10,6,5,0.75)', zIndex: 150, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
              <div style={{ background: 'var(--bg2)', border: '1px solid var(--line)', borderRadius: 16, padding: 22, maxWidth: 400, width: '100%' }}>
                <h2 style={{ color: 'var(--tozpembe)', marginTop: 0 }}>Dama Kuralları</h2>
                <div style={{ fontSize: '0.9rem', lineHeight: 1.5, color: 'var(--beyaz)', marginBottom: 20 }}>Taşlar sadece ileri ve yanlara 1 kare hareket edebilir. Rakip taşın üzerinden atlanarak taş yenir. Son satıra ulaşan taş DAMA olur.</div>
                <button className="btn-action" onClick={() => setShowRules(false)} style={{ width: '100%' }}>Anladım, Kapat</button>
              </div>
            </div>
          )}
        </div>
      </>
    );
  }

  const cells = boardData?.cells ?? [];
  const turn = boardData?.turn ?? '';

  return (
    <>
      <div className="eyebrow">Sandbox - Sıra Takibi</div>
      <h1 className="section-title">Dama</h1>
      <div style={{ background: 'var(--bg2)', border: '1px solid var(--line)', borderRadius: 16, padding: 20, textAlign: 'center' }}>
        <div style={{ fontFamily: "'Fraunces', serif", fontSize: '1.4rem', padding: 10, border: '1px dashed var(--tozpembe)', borderRadius: 12, marginBottom: 15, color: 'var(--beyaz)', background: 'var(--bg)' }}>
          {turn === playerName ? <span style={{ color: 'var(--yesil-lite)' }}>Sıra Sende! Oyna!</span> : <span style={{ color: 'var(--tozpembe)' }}>Sıra: {turn} (Bekleniyor...)</span>}
        </div>
        <div style={{ width: '100%', maxWidth: 500, margin: '0 auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(8, 1fr)', width: '100%', aspectRatio: '1', border: '6px solid var(--line)', borderRadius: 8, background: 'var(--bg)', boxShadow: '0 10px 25px rgba(0,0,0,0.5)' }}>
            {(cells ?? []).map((val: string, i: number) => {
              const row = Math.floor(i / 8);
              const col = i % 8;
              const isDark = (row + col) % 2 !== 0;
              return (
                <div key={i} onClick={() => handleClick(i)} style={{
                  width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 'clamp(1.2rem, 4vw, 2.5rem)', cursor: 'pointer', userSelect: 'none',
                  background: isDark ? '#5a3a31' : '#c6b6a8',
                  boxShadow: i === selected ? 'inset 0 0 0 6px var(--tozpembe)' : 'none'
                }}>
                  {val && <span style={{ filter: 'drop-shadow(0 3px 5px rgba(0,0,0,0.7))', color: val === '⚫' ? '#111' : '#fff', textShadow: '0 2px 4px #000' }}>{val}</span>}
                </div>
              );
            })}
          </div>
        </div>
        <button className="btn-ghost" onClick={() => setShowLobby(true)} style={{ marginTop: 20 }}>Lobiye Dön</button>
      </div>
    </>
  );
}
