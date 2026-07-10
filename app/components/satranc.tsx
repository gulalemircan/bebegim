'use client';

import React, { useState, useEffect, useRef } from 'react';
import { db } from '@/lib/firebase';
import { ref, onValue, set, update } from 'firebase/database';
import { sfx } from '@/lib/sounds';

interface Props { playerName: string; }

const initChess = () => {
  const cells = Array(64).fill('');
  const setup = ['♜','♞','♝','♛','♚','♝','♞','♜','♟','♟','♟','♟','♟','♟','♟','♟',...Array(32).fill(''),'♙','♙','♙','♙','♙','♙','♙','♙','♖','♘','♗','♕','♔','♗','♘','♖'];
  setup.forEach((p: string, i: number) => { cells[i] = p; });
  return cells;
};

const rules = { title: 'Satranç Kuralları', text: 'Şah (♚): Her yöne 1 kare.\nVezir (♛): Her yöne istenilen kadar.\nKale (♜): İleri, geri, sağa, sola istenilen kadar.\nFil (♝): Çapraz istenilen kadar.\nAt (♞): L şeklinde hareket eder.\nPiyon (♟): İleri 1 kare (ilk hamlede 2), çapraz yiyebilir.' };

export default function Satranc({ playerName }: Props) {
  const [showLobby, setShowLobby] = useState(true);
  const [starter, setStarter] = useState('Emircan');
  const [boardData, setBoardData] = useState<any>(null);
  const [selected, setSelected] = useState(-1);
  const [showRules, setShowRules] = useState(false);

  useEffect(() => {
    const unsub = onValue(ref(db, 'board'), (snap: any) => {
      const d = snap?.val?.();
      if (d?.type === 'chess') {
        setBoardData(d);
        setShowLobby(false);
      }
    });
    return () => unsub?.();
  }, []);

  const startGame = () => {
    set(ref(db, 'board'), { type: 'chess', cells: initChess(), turn: starter });
    sfx.success();
  };

  const handleClick = (i: number) => {
    if (!boardData) return;
    const cells = boardData?.cells ?? [];
    const turn = boardData?.turn ?? '';
    const val = cells?.[i] ?? '';

    if (selected === -1) {
      if (turn !== 'Herkes Oynayabilir' && turn !== playerName) { return; }
      if (val) { setSelected(i); sfx.piece(); }
    } else {
      if (selected === i) { setSelected(-1); sfx.piece(); return; }
      const newCells = [...(cells ?? [])];
      newCells[i] = newCells[selected];
      newCells[selected] = '';
      setSelected(-1);
      sfx.piece();
      set(ref(db, 'board/cells'), newCells);
      const next = turn === 'Emircan' ? 'Efsun' : 'Emircan';
      set(ref(db, 'board/turn'), next);
    }
  };

  if (showLobby) {
    return (
      <>
        <div className="eyebrow">Sandbox - Sıra Takibi</div>
        <h1 className="section-title">Satranç</h1>
        <div style={{ background: 'var(--bg2)', border: '1px solid var(--line)', borderRadius: 16, padding: 20, textAlign: 'center' }}>
          <div style={{ background: 'var(--panel)', border: '1px dashed var(--tozpembe)', borderRadius: 12, padding: 15 }}>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-dim)', marginBottom: 15 }}>İlk kim başlayacak?</p>
            <select value={starter} onChange={(e) => setStarter(e?.target?.value ?? 'Emircan')} style={{ width: '100%', padding: 10, marginBottom: 10, borderRadius: 8, border: '1px solid var(--line)', background: 'var(--bg)', color: 'var(--beyaz)' }}>
              <option value="Emircan">Emircan (Beyaz)</option><option value="Efsun">Efsun (Siyah)</option>
            </select>
            <button className="btn-action" onClick={startGame} style={{ width: '100%' }}>Masayı Kur & Başla</button>
            <button className="btn-ghost" onClick={() => setShowRules(true)} style={{ width: '100%', marginTop: 10 }}>Kuralları Oku</button>
          </div>
        </div>
        {showRules && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(10,6,5,0.75)', zIndex: 150, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
            <div style={{ background: 'var(--bg2)', border: '1px solid var(--line)', borderRadius: 16, padding: 22, maxWidth: 400, width: '100%' }}>
              <h2 style={{ color: 'var(--tozpembe)', marginTop: 0 }}>{rules.title}</h2>
              <div style={{ fontSize: '0.9rem', lineHeight: 1.5, color: 'var(--beyaz)', marginBottom: 20, whiteSpace: 'pre-line' }}>{rules.text}</div>
              <button className="btn-action" onClick={() => setShowRules(false)} style={{ width: '100%' }}>Anladım, Kapat</button>
            </div>
          </div>
        )}
      </>
    );
  }

  const cells = boardData?.cells ?? [];
  const turn = boardData?.turn ?? '';

  return (
    <>
      <div className="eyebrow">Sandbox - Sıra Takibi</div>
      <h1 className="section-title">Satranç</h1>
      <div style={{ background: 'var(--bg2)', border: '1px solid var(--line)', borderRadius: 16, padding: 20, textAlign: 'center' }}>
        <div style={{ fontFamily: "'Fraunces', serif", fontSize: '1.4rem', padding: 10, border: '1px dashed var(--tozpembe)', borderRadius: 12, marginBottom: 15, color: 'var(--beyaz)', background: 'var(--bg)' }}>
          {turn === playerName ? <span style={{ color: 'var(--yesil-lite)' }}>Sıra Sende! Oyna!</span> : <span style={{ color: 'var(--tozpembe)' }}>Sıra: {turn} (Bekleniyor...)</span>}
        </div>
        <div style={{ width: '100%', maxWidth: 500, margin: '0 auto', display: 'flex', justifyContent: 'center' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(8, 1fr)', width: '100%', maxWidth: 500, aspectRatio: '1', border: '6px solid var(--line)', borderRadius: 8, background: 'var(--bg)', touchAction: 'none', boxShadow: '0 10px 25px rgba(0,0,0,0.5)' }}>
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
                  {val && <span style={{ filter: 'drop-shadow(0 3px 5px rgba(0,0,0,0.7))', pointerEvents: 'none' }}>{val}</span>}
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
