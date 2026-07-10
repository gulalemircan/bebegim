'use client';

import React, { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { ref, onValue, set } from 'firebase/database';
import { sfx } from '@/lib/sounds';

interface Props { playerName: string; }

const initTavla = () => {
  const cells = Array(24).fill('');
  cells[0] = '⚪⚪'; cells[11] = '⚫⚫⚫⚫⚫'; cells[16] = '⚫⚫⚫'; cells[19] = '⚪⚪⚪⚪⚪';
  cells[23] = '⚫⚫'; cells[4] = '⚪⚪⚪'; cells[7] = '⚪⚪⚪⚪⚪'; cells[12] = '⚫⚫⚫⚫⚫';
  return cells;
};

export default function Tavla({ playerName }: Props) {
  const [showLobby, setShowLobby] = useState(true);
  const [starter, setStarter] = useState('Emircan');
  const [boardData, setBoardData] = useState<any>(null);
  const [selected, setSelected] = useState(-1);
  const [showRules, setShowRules] = useState(false);

  useEffect(() => {
    const unsub = onValue(ref(db, 'board'), (snap: any) => {
      const d = snap?.val?.();
      if (d?.type === 'tavla') { setBoardData(d); setShowLobby(false); }
    });
    return () => unsub?.();
  }, []);

  const startGame = () => {
    set(ref(db, 'board'), { type: 'tavla', cells: initTavla(), turn: starter });
    sfx.success();
  };

  const handleClick = (i: number) => {
    if (!boardData) return;
    const cells = boardData?.cells ?? [];
    const turn = boardData?.turn ?? '';
    const val = cells?.[i] ?? '';

    if (selected === -1) {
      if (turn !== 'Herkes Oynayabilir' && turn !== playerName) return;
      if (val?.length > 0) { setSelected(i); sfx.piece(); }
    } else {
      if (selected === i) { setSelected(-1); sfx.piece(); return; }
      const newCells = [...(cells ?? [])];
      const movingPiece = (newCells?.[selected] ?? '').charAt(0);
      newCells[selected] = (newCells?.[selected] ?? '').substring(1);
      newCells[i] = (newCells?.[i] ?? '') + movingPiece;
      setSelected(-1);
      sfx.piece();
      set(ref(db, 'board/cells'), newCells);
      if (turn !== 'Herkes Oynayabilir') {
        set(ref(db, 'board/turn'), turn === 'Emircan' ? 'Efsun' : 'Emircan');
      }
    }
  };

  if (showLobby) {
    return (
      <>
        <div className="eyebrow">Sandbox - Sıra Takibi</div>
        <h1 className="section-title">Tavla</h1>
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
                <h2 style={{ color: 'var(--tozpembe)', marginTop: 0 }}>Tavla Kuralları</h2>
                <div style={{ fontSize: '0.9rem', lineHeight: 1.5, color: 'var(--beyaz)', marginBottom: 20 }}>Kendi zarlarınızı atın. Pullar zarın değeri kadar ileri alınır. Tek pulun olduğu hane vurulabilir. Tüm pullar evinize geldiğinde toplamaya başlarsınız.</div>
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
      <h1 className="section-title">Tavla</h1>
      <div style={{ background: 'var(--bg2)', border: '1px solid var(--line)', borderRadius: 16, padding: 20, textAlign: 'center' }}>
        <div style={{ fontFamily: "'Fraunces', serif", fontSize: '1.4rem', padding: 10, border: '1px dashed var(--tozpembe)', borderRadius: 12, marginBottom: 15, color: 'var(--beyaz)', background: 'var(--bg)' }}>
          {turn === playerName ? <span style={{ color: 'var(--yesil-lite)' }}>Sıra Sende! Oyna!</span> : <span style={{ color: 'var(--tozpembe)' }}>Sıra: {turn} (Bekleniyor...)</span>}
        </div>
        <div style={{ width: '100%', maxWidth: 500, margin: '0 auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gridTemplateRows: 'repeat(2, 1fr)', width: '100%', height: 300, border: '6px solid var(--line)', borderRadius: 8, background: 'var(--bg)', boxShadow: '0 10px 25px rgba(0,0,0,0.5)' }}>
            {(cells ?? []).map((val: string, i: number) => (
              <div key={i} onClick={() => handleClick(i)} style={{
                width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center',
                justifyContent: 'center', cursor: 'pointer', userSelect: 'none',
                background: '#d2b48c', border: '1px solid #8b4513',
                boxShadow: i === selected ? 'inset 0 0 0 6px var(--tozpembe)' : 'none',
                paddingTop: 5, overflowY: 'auto'
              }}>
                {val && val.split('').map((p: string, j: number) => (
                  <span key={j} style={{ fontSize: 'clamp(0.8rem, 2.5vw, 2rem)', marginTop: -5, filter: 'drop-shadow(0 3px 5px rgba(0,0,0,0.7))' }}>{p}</span>
                ))}
              </div>
            ))}
          </div>
        </div>
        <div style={{ fontSize: '0.8rem', color: 'var(--text-dim)', marginTop: 10 }}>*Bir haneye birden fazla taş koymak için taşı tıklayıp üstüne bırakın.</div>
        <button className="btn-ghost" onClick={() => setShowLobby(true)} style={{ marginTop: 20 }}>Lobiye Dön</button>
      </div>
    </>
  );
}
