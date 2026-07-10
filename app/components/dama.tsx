'use client';

import React, { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { ref, onValue, set } from 'firebase/database';
import { sfx } from '@/lib/sounds';

interface Props { playerName: string; }

// 'W' = beyaz normal, 'B' = siyah normal, 'WK' = beyaz dama, 'BK' = siyah dama
type Cell = '' | 'W' | 'B' | 'WK' | 'BK';

const isWhite = (p: Cell) => p === 'W' || p === 'WK';
const isBlack = (p: Cell) => p === 'B' || p === 'BK';
const isKing = (p: Cell) => p === 'WK' || p === 'BK';
const isEmpty = (p: Cell) => p === '';
const displayPiece = (p: Cell) => {
  if (p === 'W') return '⚪';
  if (p === 'B') return '⚫';
  if (p === 'WK') return '🔶';
  if (p === 'BK') return '🔷';
  return '';
};

// Türk Dama: Ortogonal hareket (yukarı/aşağı/sağ/sol)
// Beyaz yukarı gider (row azalır), Siyah aşağı gider (row artar)
// Dama (King): tüm yönlerde istenilen kadar

interface Capture { to: number; captured: number; }

function getCaptures(cells: Cell[], from: number): Capture[] {
  const piece = cells[from];
  if (!piece) return [];
  const amW = isWhite(piece);
  const king = isKing(piece);
  const row = Math.floor(from / 8), col = from % 8;
  const result: Capture[] = [];
  const dirs = [[0,1],[0,-1],[1,0],[-1,0]];

  for (const [dr, dc] of dirs) {
    if (king) {
      let r = row + dr, c = col + dc;
      let enemyIdx = -1;
      while (r >= 0 && r <= 7 && c >= 0 && c <= 7) {
        const idx = r * 8 + c;
        const p = cells[idx];
        if (!isEmpty(p)) {
          if (enemyIdx === -1) {
            if (amW ? isBlack(p) : isWhite(p)) { enemyIdx = idx; }
            else break; // kendi taşı, dur
          } else break; // ikinci taş, dur
        } else if (enemyIdx !== -1) {
          result.push({ to: idx, captured: enemyIdx });
        }
        r += dr; c += dc;
      }
    } else {
      const r1 = row + dr, c1 = col + dc;
      if (r1 < 0 || r1 > 7 || c1 < 0 || c1 > 7) continue;
      const idx1 = r1 * 8 + c1;
      const p1 = cells[idx1];
      if (isEmpty(p1)) continue;
      if (amW ? !isBlack(p1) : !isWhite(p1)) continue;
      const r2 = r1 + dr, c2 = c1 + dc;
      if (r2 < 0 || r2 > 7 || c2 < 0 || c2 > 7) continue;
      const idx2 = r2 * 8 + c2;
      if (isEmpty(cells[idx2])) result.push({ to: idx2, captured: idx1 });
    }
  }
  return result;
}

function getNormalMoves(cells: Cell[], from: number): number[] {
  const piece = cells[from];
  if (!piece) return [];
  const amW = isWhite(piece);
  const king = isKing(piece);
  const row = Math.floor(from / 8), col = from % 8;
  const moves: number[] = [];
  // Beyaz: yukarı + yanlara. Siyah: aşağı + yanlara. King: her yön
  const dirs = king ? [[0,1],[0,-1],[1,0],[-1,0]] :
    amW ? [[-1,0],[0,1],[0,-1]] : [[1,0],[0,1],[0,-1]];

  for (const [dr, dc] of dirs) {
    if (king) {
      let r = row + dr, c = col + dc;
      while (r >= 0 && r <= 7 && c >= 0 && c <= 7) {
        const idx = r * 8 + c;
        if (!isEmpty(cells[idx])) break;
        moves.push(idx);
        r += dr; c += dc;
      }
    } else {
      const r = row + dr, c = col + dc;
      if (r >= 0 && r <= 7 && c >= 0 && c <= 7) {
        const idx = r * 8 + c;
        if (isEmpty(cells[idx])) moves.push(idx);
      }
    }
  }
  return moves;
}

function hasAnyCapture(cells: Cell[], color: 'W' | 'B'): boolean {
  for (let i = 0; i < 64; i++) {
    const p = cells[i];
    if (!p) continue;
    if (color === 'W' && !isWhite(p)) continue;
    if (color === 'B' && !isBlack(p)) continue;
    if (getCaptures(cells, i).length > 0) return true;
  }
  return false;
}

const initDama = (): Cell[] => {
  const cells: Cell[] = Array(64).fill('');
  for (let i = 8; i < 24; i++) cells[i] = 'B';
  for (let i = 40; i < 56; i++) cells[i] = 'W';
  return cells;
};

export default function Dama({ playerName }: Props) {
  const [showLobby, setShowLobby] = useState(true);
  const [starter, setStarter] = useState('Emircan');
  const [boardData, setBoardData] = useState<any>(null);
  const [selected, setSelected] = useState(-1);
  const [highlights, setHighlights] = useState<number[]>([]);
  const [captureMap, setCaptureMap] = useState<Record<number, number>>({}); // to → captured
  const [chainCapture, setChainCapture] = useState(-1); // zorla devam edecek taş
  const [showRules, setShowRules] = useState(false);

  useEffect(() => {
    const unsub = onValue(ref(db, 'board-dama'), (snap: any) => {
      const d = snap?.val?.();
      if (d?.type === 'dama') {
        setBoardData(d);
        setShowLobby(false);
        setSelected(-1); setHighlights([]); setCaptureMap({}); setChainCapture(-1);
      }
    });
    return () => unsub?.();
  }, []);

  const startGame = () => {
    set(ref(db, 'board-dama'), { type: 'dama', cells: initDama(), turn: starter, whitePlayer: starter });
    sfx.success();
  };

  const cells: Cell[] = boardData?.cells ?? [];
  const turn: string = boardData?.turn ?? '';
  const whitePlayer: string = boardData?.whitePlayer ?? 'Emircan';
  const myColor = playerName === whitePlayer ? 'W' : 'B';
  const isMyPiece = (p: Cell) => myColor === 'W' ? isWhite(p) : isBlack(p);
  const currentColor: 'W' | 'B' = (turn === whitePlayer) ? 'W' : 'B';
  const mustCapture = hasAnyCapture(cells, currentColor);

  const handleClick = (i: number) => {
    if (!boardData || turn !== playerName) return;
    const piece = cells[i];

    // Zincir yemede sadece o taş seçilebilir
    if (chainCapture !== -1 && i !== chainCapture && !highlights.includes(i)) return;

    if (selected === -1) {
      if (!isMyPiece(piece)) return;
      const caps = getCaptures(cells, i);
      if (mustCapture && caps.length === 0) return; // zorunlu yeme varken normal hamle yapılamaz
      if (caps.length > 0) {
        const cMap: Record<number, number> = {};
        caps.forEach(c => { cMap[c.to] = c.captured; });
        setSelected(i); setHighlights(Object.keys(cMap).map(Number)); setCaptureMap(cMap);
      } else if (!mustCapture) {
        const moves = getNormalMoves(cells, i);
        if (moves.length > 0) { setSelected(i); setHighlights(moves); setCaptureMap({}); }
      }
      sfx.piece();
    } else {
      if (i === selected) { setSelected(-1); setHighlights([]); setCaptureMap({}); setChainCapture(-1); sfx.piece(); return; }

      if (highlights.includes(i)) {
        const newCells: Cell[] = [...cells];
        newCells[i] = newCells[selected];
        newCells[selected] = '';

        // Yeme hamlesi
        if (captureMap[i] !== undefined) {
          newCells[captureMap[i]] = '';
        }

        // Dama olma
        const row = Math.floor(i / 8);
        if (newCells[i] === 'W' && row === 0) newCells[i] = 'WK';
        if (newCells[i] === 'B' && row === 7) newCells[i] = 'BK';

        sfx.piece();

        // Zincir yeme kontrolü - aynı taş devam edebilir mi?
        const nextCaptures = captureMap[i] !== undefined ? getCaptures(newCells, i) : [];

        if (nextCaptures.length > 0) {
          // Zincir yeme devam ediyor
          const cMap: Record<number, number> = {};
          nextCaptures.forEach(c => { cMap[c.to] = c.captured; });
          setSelected(i); setHighlights(Object.keys(cMap).map(Number)); setCaptureMap(cMap); setChainCapture(i);
          set(ref(db, 'board-dama/cells'), newCells);
        } else {
          // Tur bitti
          setSelected(-1); setHighlights([]); setCaptureMap({}); setChainCapture(-1);
          const next = turn === 'Emircan' ? 'Efsun' : 'Emircan';
          set(ref(db, 'board-dama'), { ...boardData, cells: newCells, turn: next });
        }
      } else if (isMyPiece(piece) && chainCapture === -1) {
        const caps = getCaptures(cells, i);
        if (mustCapture && caps.length === 0) return;
        if (caps.length > 0) {
          const cMap: Record<number, number> = {};
          caps.forEach(c => { cMap[c.to] = c.captured; });
          setSelected(i); setHighlights(Object.keys(cMap).map(Number)); setCaptureMap(cMap);
        } else if (!mustCapture) {
          const moves = getNormalMoves(cells, i);
          setSelected(i); setHighlights(moves); setCaptureMap({});
        }
        sfx.piece();
      } else {
        setSelected(-1); setHighlights([]); setCaptureMap({}); setChainCapture(-1);
      }
    }
  };

  if (showLobby) {
    return (
      <>
        <div className="eyebrow">Kural Kontrolü Var</div>
        <h1 className="section-title">Dama</h1>
        <div style={{ background: 'var(--bg2)', border: '1px solid var(--line)', borderRadius: 16, padding: 20, textAlign: 'center' }}>
          <div style={{ background: 'var(--panel)', border: '1px dashed var(--tozpembe)', borderRadius: 12, padding: 15 }}>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-dim)', marginBottom: 15 }}>Kim beyaz taşlarla (⚪) oynasın?</p>
            <select value={starter} onChange={(e) => setStarter(e?.target?.value ?? 'Emircan')} style={{ width: '100%', padding: 10, marginBottom: 10, borderRadius: 8, border: '1px solid var(--line)', background: 'var(--bg)', color: 'var(--beyaz)' }}>
              <option value="Emircan">Emircan (⚪ Beyaz)</option>
              <option value="Efsun">Efsun (⚪ Beyaz)</option>
            </select>
            <button className="btn-action" onClick={startGame} style={{ width: '100%' }}>Masayı Kur & Başla</button>
            <button className="btn-ghost" onClick={() => setShowRules(true)} style={{ width: '100%', marginTop: 10 }}>Kuralları Oku</button>
          </div>
          {showRules && (
            <div style={{ position: 'fixed', inset: 0, background: 'rgba(10,6,5,0.75)', zIndex: 150, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
              <div style={{ background: 'var(--bg2)', border: '1px solid var(--line)', borderRadius: 16, padding: 22, maxWidth: 400, width: '100%' }}>
                <h2 style={{ color: 'var(--tozpembe)', marginTop: 0 }}>Dama Kuralları (Türk)</h2>
                <div style={{ fontSize: '0.9rem', lineHeight: 1.8, color: 'var(--beyaz)', marginBottom: 20 }}>
                  • Taşlar yukarı, aşağı, sağa, sola hareket eder (çapraz değil).<br />
                  • Yeme zorunludur! Yiyebilirken normal hamle yapılamaz.<br />
                  • Zincir yeme: Yedikten sonra tekrar yiyebiliyorsan devam etmelisin.<br />
                  • Son sıraya ulaşan taş Dama olur (🔶/🔷) — her yönde sürünebilir.<br />
                  • 🔶 = Beyaz Dama, 🔷 = Siyah Dama
                </div>
                <button className="btn-action" onClick={() => setShowRules(false)} style={{ width: '100%' }}>Anladım, Kapat</button>
              </div>
            </div>
          )}
        </div>
      </>
    );
  }

  return (
    <>
      <div className="eyebrow">Kural Kontrolü Var</div>
      <h1 className="section-title">Dama</h1>
      <div style={{ background: 'var(--bg2)', border: '1px solid var(--line)', borderRadius: 16, padding: 20, textAlign: 'center' }}>
        <div style={{ fontFamily: "'Fraunces', serif", fontSize: '1.2rem', padding: 10, border: '1px dashed var(--tozpembe)', borderRadius: 12, marginBottom: 10, color: 'var(--beyaz)', background: 'var(--bg)' }}>
          {turn === playerName
            ? <span style={{ color: 'var(--yesil-lite)' }}>Sıra Sende! {mustCapture ? '⚠️ Yeme zorunlu!' : ''}</span>
            : <span style={{ color: 'var(--tozpembe)' }}>Sıra: {turn} (Bekleniyor...)</span>}
        </div>
        <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginBottom: 10 }}>
          Sen: {myColor === 'W' ? '⚪ Beyaz' : '⚫ Siyah'} • Taşa tıkla, geçerli hamleler gösterilir
        </div>
        <div style={{ width: '100%', maxWidth: 500, margin: '0 auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(8, 1fr)', width: '100%', aspectRatio: '1', border: '6px solid var(--line)', borderRadius: 8, background: 'var(--bg)', boxShadow: '0 10px 25px rgba(0,0,0,0.5)' }}>
            {cells.map((val: Cell, i: number) => {
              const row = Math.floor(i / 8), col = i % 8;
              const isDark = (row + col) % 2 !== 0;
              const isSelected = i === selected;
              const isHighlight = highlights.includes(i);
              let bg = isDark ? '#5a3a31' : '#c6b6a8';
              if (isSelected) bg = '#d4af37';
              else if (isHighlight) bg = val ? '#c0392b' : '#4a7a4a';
              return (
                <div key={i} onClick={() => handleClick(i)} style={{
                  width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 'clamp(1.1rem, 3.5vw, 2rem)', cursor: 'pointer', userSelect: 'none', background: bg,
                  transition: 'background 0.1s'
                }}>
                  {val ? <span style={{ pointerEvents: 'none' }}>{displayPiece(val)}</span> :
                    isHighlight ? <span style={{ width: 12, height: 12, borderRadius: '50%', background: 'rgba(127,200,127,0.9)', display: 'block' }} /> : null}
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
