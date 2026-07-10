'use client';

import React, { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { ref, onValue, set, update } from 'firebase/database';
import { sfx } from '@/lib/sounds';

interface Props { playerName: string; }

// Tahta: 0-23 = nokta, 24 = Beyaz Bar, 25 = Siyah Bar
// Beyaz 0→23 yönünde gider. Siyah 23→0 yönünde gider.
interface BoardState {
  type: string;
  colors: string[];   // length 26, 'W' | 'B' | ''
  counts: number[];   // length 26
  borneOff: { W: number; B: number };
  turn: string;
  whitePlayer: string;
  dice: number[] | null;
  usedDice: boolean[];
  mustRoll: boolean;
}

const initBoard = (whitePlayer: string): BoardState => {
  const colors = Array(26).fill('');
  const counts = Array(26).fill(0);
  // Standart tavla dizilişi
  colors[0] = 'W'; counts[0] = 2;
  colors[5] = 'B'; counts[5] = 5;
  colors[7] = 'B'; counts[7] = 3;
  colors[11] = 'W'; counts[11] = 5;
  colors[12] = 'B'; counts[12] = 5;
  colors[16] = 'W'; counts[16] = 3;
  colors[18] = 'W'; counts[18] = 5;
  colors[23] = 'B'; counts[23] = 2;
  return { type: 'tavla', colors, counts, borneOff: { W: 0, B: 0 }, turn: whitePlayer, whitePlayer, dice: null, usedDice: [false, false], mustRoll: true };
};

function allInHome(colors: string[], counts: number[], color: string): boolean {
  // Beyaz evi: 18-23. Siyah evi: 0-5.
  const homeStart = color === 'W' ? 18 : 0;
  const homeEnd = color === 'W' ? 23 : 5;
  for (let i = 0; i < 24; i++) {
    if (i >= homeStart && i <= homeEnd) continue;
    if (colors[i] === color && counts[i] > 0) return false;
  }
  const barIdx = color === 'W' ? 24 : 25;
  if (counts[barIdx] > 0) return false;
  return true;
}

function getValidTargets(colors: string[], counts: number[], from: number, dice: number[], usedDice: boolean[], color: string): {to: number; dieIdx: number}[] {
  const result: {to: number; dieIdx: number}[] = [];
  const dir = color === 'W' ? 1 : -1;
  const barIdx = color === 'W' ? 24 : 25;
  const hasBar = counts[barIdx] > 0;
  if (hasBar && from !== barIdx) return [];

  const seen = new Set<string>();
  for (let d = 0; d < dice.length; d++) {
    if (usedDice[d]) continue;
    const dv = dice[d];
    let to: number;

    if (from === barIdx) {
      to = color === 'W' ? dv - 1 : 24 - dv;
    } else {
      to = from + dir * dv;
    }

    const key = `${to}-${d}`;
    if (seen.has(key)) continue;

    // Bearing off
    if (color === 'W' && to > 23) {
      if (allInHome(colors, counts, 'W')) {
        const entry = `bear-${d}`;
        if (!seen.has(entry)) { seen.add(entry); result.push({ to: 26, dieIdx: d }); }
      }
      continue;
    }
    if (color === 'B' && to < 0) {
      if (allInHome(colors, counts, 'B')) {
        const entry = `bear-${d}`;
        if (!seen.has(entry)) { seen.add(entry); result.push({ to: 27, dieIdx: d }); }
      }
      continue;
    }

    if (to < 0 || to > 23) continue;
    const oppColor = color === 'W' ? 'B' : 'W';
    if (colors[to] === oppColor && counts[to] >= 2) continue; // kapalı nokta
    seen.add(key);
    result.push({ to, dieIdx: d });
  }
  return result;
}

function applyMove(state: BoardState, from: number, to: number, dieIdx: number): BoardState {
  const colors = [...state.colors];
  const counts = [...state.counts];
  const borneOff = { ...state.borneOff };

  // Taşı kaynaktan kaldır
  counts[from]--;
  if (counts[from] === 0) colors[from] = '';

  const myColor = state.colors[from] || (from === 24 ? 'W' : 'B');

  // Bearing off
  if (to === 26) { borneOff.W++; }
  else if (to === 27) { borneOff.B++; }
  else {
    const oppColor = myColor === 'W' ? 'B' : 'W';
    if (colors[to] === oppColor && counts[to] === 1) {
      // Blot vuruldu → bara gönder
      const oppBar = oppColor === 'W' ? 24 : 25;
      counts[oppBar]++;
      colors[oppBar] = oppColor;
      counts[to] = 0; colors[to] = '';
    }
    counts[to]++;
    colors[to] = myColor;
  }

  const usedDice = [...state.usedDice];
  usedDice[dieIdx] = true;

  // Tüm zarlar kullanıldı mı?
  const allUsed = usedDice.every(u => u);
  const next = state.turn === 'Emircan' ? 'Efsun' : 'Emircan';

  return { ...state, colors, counts, borneOff, usedDice, mustRoll: allUsed, turn: allUsed ? next : state.turn, dice: allUsed ? null : state.dice };
}

function checkWin(borneOff: { W: number; B: number }): string | null {
  if (borneOff.W >= 15) return 'Beyaz';
  if (borneOff.B >= 15) return 'Siyah';
  return null;
}

const DICE_FACE = ['', '⚀','⚁','⚂','⚃','⚄','⚅'];

export default function Tavla({ playerName }: Props) {
  const [showLobby, setShowLobby] = useState(true);
  const [starter, setStarter] = useState('Emircan');
  const [gameState, setGameState] = useState<BoardState | null>(null);
  const [selected, setSelected] = useState(-1);
  const [validTargets, setValidTargets] = useState<{to: number; dieIdx: number}[]>([]);
  const [showRules, setShowRules] = useState(false);

  useEffect(() => {
    const unsub = onValue(ref(db, 'board-tavla'), (snap: any) => {
      const d = snap?.val?.();
      if (d?.type === 'tavla') {
        setGameState(d as BoardState);
        setShowLobby(false);
        setSelected(-1); setValidTargets([]);
      }
    });
    return () => unsub?.();
  }, []);

  const startGame = () => {
    set(ref(db, 'board-tavla'), initBoard(starter));
    sfx.success();
  };

  const myColor = gameState ? (playerName === gameState.whitePlayer ? 'W' : 'B') : 'W';
  const barIdx = myColor === 'W' ? 24 : 25;
  const myTurn = gameState?.turn === playerName;

  const rollDice = () => {
    if (!myTurn || !gameState?.mustRoll) return;
    const d1 = Math.ceil(Math.random() * 6);
    const d2 = Math.ceil(Math.random() * 6);
    const dice = d1 === d2 ? [d1, d2, d1, d2] : [d1, d2];
    const usedDice = dice.map(() => false);
    const newState = { ...gameState, dice, usedDice, mustRoll: false };
    set(ref(db, 'board-tavla'), newState);
    sfx.success();
  };

  const handlePointClick = (idx: number) => {
    if (!gameState || !myTurn || gameState.mustRoll) return;
    const colors = gameState.colors;
    const counts = gameState.counts;
    const dice = gameState.dice ?? [];
    const hasBar = counts[barIdx] > 0;

    if (selected === -1) {
      // Bar varsa sadece bar seçilebilir
      if (hasBar && idx !== barIdx) return;
      if (!hasBar && idx === barIdx) return;
      if (colors[idx] !== myColor) return;
      if (counts[idx] === 0) return;

      const targets = getValidTargets(colors, counts, idx, dice, gameState.usedDice, myColor);
      if (targets.length > 0) { setSelected(idx); setValidTargets(targets); sfx.piece(); }
    } else {
      const target = validTargets.find(t => t.to === idx);
      if (target) {
        const newState = applyMove(gameState, selected, target.to, target.dieIdx);
        setSelected(-1); setValidTargets([]);
        sfx.piece();
        const winner = checkWin(newState.borneOff);
        if (winner) sfx.success();
        set(ref(db, 'board-tavla'), newState);
      } else if (colors[idx] === myColor && counts[idx] > 0 && idx !== selected) {
        const targets = getValidTargets(colors, counts, idx, dice, gameState.usedDice, myColor);
        setSelected(idx); setValidTargets(targets); sfx.piece();
      } else {
        setSelected(-1); setValidTargets([]);
      }
    }
  };

  const skipTurn = () => {
    if (!gameState || !myTurn || gameState.mustRoll) return;
    const next = gameState.turn === 'Emircan' ? 'Efsun' : 'Emircan';
    set(ref(db, 'board-tavla'), { ...gameState, turn: next, dice: null, usedDice: [false, false], mustRoll: true });
  };

  if (showLobby) {
    return (
      <>
        <div className="eyebrow">Zar + Kural Kontrolü</div>
        <h1 className="section-title">Tavla</h1>
        <div style={{ background: 'var(--bg2)', border: '1px solid var(--line)', borderRadius: 16, padding: 20, textAlign: 'center' }}>
          <div style={{ background: 'var(--panel)', border: '1px dashed var(--tozpembe)', borderRadius: 12, padding: 15 }}>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-dim)', marginBottom: 15 }}>Kim beyaz taşlarla (⚪) başlasın?</p>
            <select value={starter} onChange={(e) => setStarter(e?.target?.value ?? 'Emircan')} style={{ width: '100%', padding: 10, marginBottom: 10, borderRadius: 8, border: '1px solid var(--line)', background: 'var(--bg)', color: 'var(--beyaz)' }}>
              <option value="Emircan">Emircan (⚪ Beyaz)</option>
              <option value="Efsun">Efsun (⚪ Beyaz)</option>
            </select>
            <button className="btn-action" onClick={startGame} style={{ width: '100%' }}>Masayı Kur & Başla</button>
            <button className="btn-ghost" onClick={() => setShowRules(true)} style={{ width: '100%', marginTop: 10 }}>Kuralları Oku</button>
          </div>
          {showRules && (
            <div style={{ position: 'fixed', inset: 0, background: 'rgba(10,6,5,0.75)', zIndex: 150, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
              <div style={{ background: 'var(--bg2)', border: '1px solid var(--line)', borderRadius: 16, padding: 22, maxWidth: 420, width: '100%' }}>
                <h2 style={{ color: 'var(--tozpembe)', marginTop: 0 }}>Tavla Kuralları</h2>
                <div style={{ fontSize: '0.88rem', lineHeight: 1.8, color: 'var(--beyaz)', marginBottom: 20 }}>
                  • ⚪ Beyaz: 0→23 yönünde gider. ⚫ Siyah: 23→0 yönünde gider.<br/>
                  • Sıran gelince önce "Zar At" butonuna bas.<br/>
                  • Taşa tıkla, geçerli hedefler yeşil gösterilir.<br/>
                  • 2+ rakip taşlı noktaya girilmez.<br/>
                  • Tek rakip taşı (blot) vurursan, rakip bara gider.<br/>
                  • Barda taşın varsa önce onu çıkarmalısın.<br/>
                  • Tüm taşlarını evine topladığında toplayabilirsin.<br/>
                  • 15 taşını toplayan kazanır!
                </div>
                <button className="btn-action" onClick={() => setShowRules(false)} style={{ width: '100%' }}>Anladım, Kapat</button>
              </div>
            </div>
          )}
        </div>
      </>
    );
  }

  if (!gameState) return null;

  const { colors, counts, dice, usedDice, borneOff, mustRoll } = gameState;
  const winner = checkWin(borneOff);

  // Tahta layout: üst satır sol→sağ: 12..17 | 18..23, alt satır sol→sağ: 11..6 | 5..0
  const topRow = [12,13,14,15,16,17,18,19,20,21,22,23];
  const bottomRow = [11,10,9,8,7,6,5,4,3,2,1,0];

  const renderPoint = (idx: number, flipped = false) => {
    const color = colors[idx];
    const count = counts[idx];
    const isBarPoint = idx === 24 || idx === 25;
    const isSelected = selected === idx;
    const isTarget = validTargets.some(t => t.to === idx);
    const emj = color === 'W' ? '⚪' : '⚫';

    return (
      <div key={idx} onClick={() => handlePointClick(idx)} style={{
        display: 'flex', flexDirection: flipped ? 'column-reverse' : 'column',
        alignItems: 'center', justifyContent: 'flex-start',
        cursor: 'pointer', minHeight: isBarPoint ? 60 : 80, paddingTop: 2,
        background: isSelected ? 'rgba(212,175,55,0.3)' : isTarget ? 'rgba(100,200,100,0.25)' : 'transparent',
        borderRadius: 4, border: isTarget ? '1px dashed #7fb37f' : '1px solid transparent',
        position: 'relative'
      }}>
        {count > 0 && Array.from({ length: Math.min(count, 5) }).map((_, j) => (
          <span key={j} style={{ fontSize: 'clamp(0.9rem, 2.5vw, 1.4rem)', lineHeight: 1.1 }}>{emj}</span>
        ))}
        {count > 5 && <span style={{ fontSize: '0.65rem', color: 'var(--tozpembe)', fontWeight: 700 }}>+{count - 5}</span>}
        {count === 0 && isTarget && <span style={{ width: 14, height: 14, borderRadius: '50%', background: 'rgba(127,200,127,0.8)', display: 'block', margin: '4px auto' }} />}
        <span style={{ fontSize: '0.55rem', color: 'var(--text-dim)', marginTop: 2 }}>{idx < 24 ? idx + 1 : (idx === 24 ? 'Bar⚪' : 'Bar⚫')}</span>
      </div>
    );
  };

  const isBearOff = validTargets.some(t => t.to === 26 || t.to === 27);

  return (
    <>
      <div className="eyebrow">Zar + Kural Kontrolü</div>
      <h1 className="section-title">Tavla</h1>
      <div style={{ background: 'var(--bg2)', border: '1px solid var(--line)', borderRadius: 16, padding: 16, textAlign: 'center' }}>
        {winner && (
          <div style={{ background: 'var(--tozpembe)', color: '#fff', borderRadius: 12, padding: '10px 20px', marginBottom: 12, fontFamily: "'Fraunces', serif", fontSize: '1.3rem' }}>
            🎉 {winner === 'Beyaz' ? gameState.whitePlayer : (gameState.whitePlayer === 'Emircan' ? 'Efsun' : 'Emircan')} kazandı!
          </div>
        )}

        {/* Sıra & Zar */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, gap: 8 }}>
          <div style={{ fontFamily: "'Fraunces', serif", fontSize: '1rem', padding: '8px 12px', border: '1px dashed var(--tozpembe)', borderRadius: 12, color: 'var(--beyaz)', background: 'var(--bg)', flex: 1 }}>
            {myTurn ? <span style={{ color: 'var(--yesil-lite)' }}>Sıra Sende! ({myColor === 'W' ? '⚪' : '⚫'})</span>
              : <span style={{ color: 'var(--tozpembe)' }}>Sıra: {gameState.turn}</span>}
          </div>
          {myTurn && mustRoll && (
            <button className="btn-action" onClick={rollDice} style={{ whiteSpace: 'nowrap' }}>🎲 Zar At</button>
          )}
          {myTurn && !mustRoll && (
            <button className="btn-ghost" onClick={skipTurn} style={{ fontSize: '0.8rem' }}>Pas Geç</button>
          )}
        </div>

        {/* Zarlar */}
        {dice && (
          <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginBottom: 12 }}>
            {dice.map((d, i) => (
              <span key={i} style={{ fontSize: '2.2rem', opacity: usedDice[i] ? 0.3 : 1, filter: usedDice[i] ? 'grayscale(1)' : 'none' }}>
                {DICE_FACE[d]}
              </span>
            ))}
          </div>
        )}

        {/* Toplanan taşlar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--text-dim)', marginBottom: 8 }}>
          <span>⚪ Toplanan: {borneOff.W}/15</span>
          <span>{isBearOff && selected !== -1 ? <button className="btn-action" style={{ fontSize: '0.75rem', padding: '4px 10px' }} onClick={() => {
            const t = validTargets.find(v => v.to === 26 || v.to === 27);
            if (t) handlePointClick(t.to);
          }}>Taşı Topla ✓</button> : null}</span>
          <span>⚫ Toplanan: {borneOff.B}/15</span>
        </div>

        {/* Tahta */}
        <div style={{ background: '#2a5c45', border: '4px solid #1a3c2e', borderRadius: 10, padding: 6, overflow: 'auto' }}>
          {/* Üst bar (Siyah bar) */}
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 4 }}>
            {counts[25] > 0 && renderPoint(25, false)}
          </div>

          {/* Üst satır: 12-23 */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr) 8px repeat(6, 1fr)', gap: 2, marginBottom: 4 }}>
            {topRow.slice(0,6).map(i => renderPoint(i, false))}
            <div style={{ background: '#1a3c2e', borderRadius: 4 }} />
            {topRow.slice(6).map(i => renderPoint(i, false))}
          </div>

          {/* Alt satır: 11-0 (ters) */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr) 8px repeat(6, 1fr)', gap: 2, marginTop: 4 }}>
            {bottomRow.slice(0,6).map(i => renderPoint(i, true))}
            <div style={{ background: '#1a3c2e', borderRadius: 4 }} />
            {bottomRow.slice(6).map(i => renderPoint(i, true))}
          </div>

          {/* Alt bar (Beyaz bar) */}
          <div style={{ display: 'flex', justifyContent: 'center', marginTop: 4 }}>
            {counts[24] > 0 && renderPoint(24, true)}
          </div>
        </div>

        <button className="btn-ghost" onClick={() => setShowLobby(true)} style={{ marginTop: 16 }}>Lobiye Dön</button>
      </div>
    </>
  );
}
