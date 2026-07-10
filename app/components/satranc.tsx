'use client';

import React, { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { ref, onValue, set } from 'firebase/database';
import { sfx } from '@/lib/sounds';

interface Props { playerName: string; }

// --- Satranç Mantığı ---
const WHITE_SET = '♙♖♘♗♕♔';
const BLACK_SET = '♟♜♞♝♛♚';
const isW = (p: string) => WHITE_SET.includes(p);
const isB = (p: string) => BLACK_SET.includes(p);

function getValidMoves(cells: string[], from: number): number[] {
  const piece = cells[from];
  if (!piece) return [];
  const row = Math.floor(from / 8), col = from % 8;
  const mine = isW(piece) ? isW : isB;
  const enemy = isW(piece) ? isB : isW;
  const moves: number[] = [];

  const slide = (dr: number, dc: number) => {
    let r = row + dr, c = col + dc;
    while (r >= 0 && r <= 7 && c >= 0 && c <= 7) {
      const idx = r * 8 + c;
      if (mine(cells[idx])) break;
      moves.push(idx);
      if (enemy(cells[idx])) break;
      r += dr; c += dc;
    }
  };
  const jump = (dr: number, dc: number) => {
    const r = row + dr, c = col + dc;
    if (r >= 0 && r <= 7 && c >= 0 && c <= 7) {
      const idx = r * 8 + c;
      if (!mine(cells[idx])) moves.push(idx);
    }
  };

  if (piece === '♙') {
    if (row > 0 && !cells[(row-1)*8+col]) {
      moves.push((row-1)*8+col);
      if (row === 6 && !cells[(row-2)*8+col]) moves.push((row-2)*8+col);
    }
    if (row > 0 && col > 0 && isB(cells[(row-1)*8+col-1])) moves.push((row-1)*8+col-1);
    if (row > 0 && col < 7 && isB(cells[(row-1)*8+col+1])) moves.push((row-1)*8+col+1);
  } else if (piece === '♟') {
    if (row < 7 && !cells[(row+1)*8+col]) {
      moves.push((row+1)*8+col);
      if (row === 1 && !cells[(row+2)*8+col]) moves.push((row+2)*8+col);
    }
    if (row < 7 && col > 0 && isW(cells[(row+1)*8+col-1])) moves.push((row+1)*8+col-1);
    if (row < 7 && col < 7 && isW(cells[(row+1)*8+col+1])) moves.push((row+1)*8+col+1);
  } else if (piece === '♖' || piece === '♜') {
    slide(0,1); slide(0,-1); slide(1,0); slide(-1,0);
  } else if (piece === '♗' || piece === '♝') {
    slide(1,1); slide(1,-1); slide(-1,1); slide(-1,-1);
  } else if (piece === '♕' || piece === '♛') {
    slide(0,1); slide(0,-1); slide(1,0); slide(-1,0);
    slide(1,1); slide(1,-1); slide(-1,1); slide(-1,-1);
  } else if (piece === '♔' || piece === '♚') {
    [[-1,-1],[-1,0],[-1,1],[0,-1],[0,1],[1,-1],[1,0],[1,1]].forEach(([dr,dc]) => jump(dr,dc));
  } else if (piece === '♘' || piece === '♞') {
    [[-2,-1],[-2,1],[-1,-2],[-1,2],[1,-2],[1,2],[2,-1],[2,1]].forEach(([dr,dc]) => jump(dr,dc));
  }
  return moves;
}

const initChess = () => {
  const cells = Array(64).fill('');
  ['♜','♞','♝','♛','♚','♝','♞','♜','♟','♟','♟','♟','♟','♟','♟','♟',...Array(32).fill(''),'♙','♙','♙','♙','♙','♙','♙','♙','♖','♘','♗','♕','♔','♗','♘','♖']
    .forEach((p,i) => { cells[i] = p; });
  return cells;
};

const rulesText = 'Şah (♚/♔): Her yöne 1 kare.\nVezir (♛/♕): Her yöne istenilen kadar.\nKale (♜/♖): Yatay/dikey istenilen kadar.\nFil (♝/♗): Çapraz istenilen kadar.\nAt (♞/♘): L şeklinde, engel aşar.\nPiyon (♟/♙): İleri 1 kare (ilk hamlede 2), çapraz yiyebilir.\nPiyon son sıraya gelince Vezir olur!';

export default function Satranc({ playerName }: Props) {
  const [showLobby, setShowLobby] = useState(true);
  const [starter, setStarter] = useState('Emircan');
  const [boardData, setBoardData] = useState<any>(null);
  const [selected, setSelected] = useState(-1);
  const [validMoves, setValidMoves] = useState<number[]>([]);
  const [showRules, setShowRules] = useState(false);

  useEffect(() => {
    const unsub = onValue(ref(db, 'board-satranc'), (snap: any) => {
      const d = snap?.val?.();
      if (d?.type === 'chess') { setBoardData(d); setShowLobby(false); }
    });
    return () => unsub?.();
  }, []);

  const startGame = () => {
    set(ref(db, 'board-satranc'), { type: 'chess', cells: initChess(), turn: starter, whitePlayer: starter });
    sfx.success();
  };

  const cells: string[] = boardData?.cells ?? [];
  const turn: string = boardData?.turn ?? '';
  const whitePlayer: string = boardData?.whitePlayer ?? 'Emircan';
  const myColor = playerName === whitePlayer ? 'W' : 'B';
  const isMyPiece = (p: string) => myColor === 'W' ? isW(p) : isB(p);

  const handleClick = (i: number) => {
    if (!boardData) return;
    const piece = cells[i] ?? '';

    if (turn !== playerName) return; // sıra sende değil

    if (selected === -1) {
      if (!isMyPiece(piece)) return;
      const moves = getValidMoves(cells, i);
      if (moves.length > 0) { setSelected(i); setValidMoves(moves); sfx.piece(); }
    } else {
      if (i === selected) { setSelected(-1); setValidMoves([]); sfx.piece(); return; }

      if (validMoves.includes(i)) {
        const newCells = [...cells];
        newCells[i] = newCells[selected];
        newCells[selected] = '';
        // Piyon terfisi
        if (newCells[i] === '♙' && Math.floor(i/8) === 0) newCells[i] = '♕';
        if (newCells[i] === '♟' && Math.floor(i/8) === 7) newCells[i] = '♛';

        setSelected(-1); setValidMoves([]);
        sfx.piece();
        const next = turn === 'Emircan' ? 'Efsun' : 'Emircan';
        set(ref(db, 'board-satranc'), { ...boardData, cells: newCells, turn: next });
      } else if (isMyPiece(piece)) {
        const moves = getValidMoves(cells, i);
        setSelected(i); setValidMoves(moves); sfx.piece();
      } else {
        setSelected(-1); setValidMoves([]);
      }
    }
  };

  if (showLobby) {
    return (
      <>
        <div className="eyebrow">Kural Kontrolü Var</div>
        <h1 className="section-title">Satranç</h1>
        <div style={{ background: 'var(--bg2)', border: '1px solid var(--line)', borderRadius: 16, padding: 20, textAlign: 'center' }}>
          <div style={{ background: 'var(--panel)', border: '1px dashed var(--tozpembe)', borderRadius: 12, padding: 15 }}>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-dim)', marginBottom: 15 }}>Kim beyaz taşlarla oynasın?</p>
            <select value={starter} onChange={(e) => setStarter(e?.target?.value ?? 'Emircan')} style={{ width: '100%', padding: 10, marginBottom: 10, borderRadius: 8, border: '1px solid var(--line)', background: 'var(--bg)', color: 'var(--beyaz)' }}>
              <option value="Emircan">Emircan (Beyaz ♙)</option>
              <option value="Efsun">Efsun (Beyaz ♙)</option>
            </select>
            <button className="btn-action" onClick={startGame} style={{ width: '100%' }}>Masayı Kur & Başla</button>
            <button className="btn-ghost" onClick={() => setShowRules(true)} style={{ width: '100%', marginTop: 10 }}>Kuralları Oku</button>
          </div>
        </div>
        {showRules && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(10,6,5,0.75)', zIndex: 150, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
            <div style={{ background: 'var(--bg2)', border: '1px solid var(--line)', borderRadius: 16, padding: 22, maxWidth: 400, width: '100%' }}>
              <h2 style={{ color: 'var(--tozpembe)', marginTop: 0 }}>Satranç Kuralları</h2>
              <div style={{ fontSize: '0.9rem', lineHeight: 1.8, color: 'var(--beyaz)', marginBottom: 20, whiteSpace: 'pre-line' }}>{rulesText}</div>
              <button className="btn-action" onClick={() => setShowRules(false)} style={{ width: '100%' }}>Anladım, Kapat</button>
            </div>
          </div>
        )}
      </>
    );
  }

  return (
    <>
      <div className="eyebrow">Kural Kontrolü Var</div>
      <h1 className="section-title">Satranç</h1>
      <div style={{ background: 'var(--bg2)', border: '1px solid var(--line)', borderRadius: 16, padding: 20, textAlign: 'center' }}>
        <div style={{ fontFamily: "'Fraunces', serif", fontSize: '1.2rem', padding: 10, border: '1px dashed var(--tozpembe)', borderRadius: 12, marginBottom: 10, color: 'var(--beyaz)', background: 'var(--bg)' }}>
          {turn === playerName
            ? <span style={{ color: 'var(--yesil-lite)' }}>Sıra Sende! ({myColor === 'W' ? 'Beyaz ♙' : 'Siyah ♟'})</span>
            : <span style={{ color: 'var(--tozpembe)' }}>Sıra: {turn} (Bekleniyor...)</span>}
        </div>
        <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginBottom: 10 }}>
          Sen: {myColor === 'W' ? '♙♖♘♗♕♔ Beyaz' : '♟♜♞♝♛♚ Siyah'} • Geçerli hamleleri görmek için taşa tıkla
        </div>
        <div style={{ width: '100%', maxWidth: 500, margin: '0 auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(8, 1fr)', width: '100%', aspectRatio: '1', border: '6px solid var(--line)', borderRadius: 8, boxShadow: '0 10px 25px rgba(0,0,0,0.5)' }}>
            {cells.map((val: string, i: number) => {
              const row = Math.floor(i / 8), col = i % 8;
              const isDark = (row + col) % 2 !== 0;
              const isSelected = i === selected;
              const isValidTarget = validMoves.includes(i);
              let bg = isDark ? '#5a3a31' : '#c6b6a8';
              if (isSelected) bg = '#d4af37';
              else if (isValidTarget) bg = val ? '#c0392b' : '#7fb37f';
              return (
                <div key={i} onClick={() => handleClick(i)} style={{
                  width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 'clamp(1.2rem, 4vw, 2.5rem)', cursor: 'pointer', userSelect: 'none', background: bg,
                  transition: 'background 0.1s',
                  boxShadow: isValidTarget && !val ? 'inset 0 0 0 4px rgba(127,179,127,0.7)' : 'none'
                }}>
                  {val && <span style={{ filter: 'drop-shadow(0 3px 5px rgba(0,0,0,0.7))', pointerEvents: 'none' }}>{val}</span>}
                  {isValidTarget && !val && <span style={{ width: 14, height: 14, borderRadius: '50%', background: 'rgba(127,179,127,0.8)', display: 'block' }} />}
                </div>
              );
            })}
          </div>
        </div>
        <button className="btn-ghost" onClick={() => { setShowLobby(true); setSelected(-1); setValidMoves([]); }} style={{ marginTop: 20 }}>Lobiye Dön</button>
      </div>
    </>
  );
}
