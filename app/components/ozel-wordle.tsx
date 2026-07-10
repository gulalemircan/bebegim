'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { db } from '@/lib/firebase';
import { ref, onValue, set, update } from 'firebase/database';
import { sfx } from '@/lib/sounds';

interface Props { playerName: string; }

const wLib: Record<string, string[]> = {
  "4": ["ELMA", "KEDİ", "KAPI", "MASA", "AYNA"],
  "5": ["KİRAZ", "AŞKIM", "MUTLU", "ÇİÇEK", "SEVGİ", "MELEK"],
  "6": ["BARDAK", "KLAVYE", "YAPRAK", "GÖZLÜK"],
  "7": ["TELEFON", "MONİTÖR", "TENCERE", "PENCERE"],
};

const kbRows = ["ERTYUIOĞÜ", "ASDFGHJKLŞİ", "ZXCVBNMÖÇ"];

export default function OzelWordle({ playerName }: Props) {
  const [showLobby, setShowLobby] = useState(true);
  const [mode, setMode] = useState('solo');
  const [wLen, setWLen] = useState(5);
  const [target, setTarget] = useState('');
  const [grid, setGrid] = useState<string[][]>([]);
  const [row, setRow] = useState(0);
  const [col, setCol] = useState(0);
  const [cellStates, setCellStates] = useState<string[][]>([]);
  const [msg, setMsg] = useState('');
  const [multiStatus, setMultiStatus] = useState('');
  const [scores, setScores] = useState({ emircan: 0, efsun: 0 });
  const gameOver = useRef(false);

  useEffect(() => {
    const unsub = onValue(ref(db, 'wordle'), (snap: any) => {
      const d = snap?.val?.();
      if (!d || mode === 'solo') return;
      if (d?.status === 'playing') {
        if (d?.p1Done && d?.p2Done) {
          let res = 'Berabere!';
          if ((d?.p1G ?? 99) < (d?.p2G ?? 99)) res = 'Emircan Kazandı!';
          else if ((d?.p2G ?? 99) < (d?.p1G ?? 99)) res = 'Efsun Kazandı!';
          setMultiStatus(`Maç Bitti: ${res} | Emircan: ${(d?.p1G ?? 99) === 99 ? 'Bilemedi' : d?.p1G + ' Tahmin'} | Efsun: ${(d?.p2G ?? 99) === 99 ? 'Bilemedi' : d?.p2G + ' Tahmin'}`);
          setTimeout(() => leave(), 5000);
        } else {
          const myDone = playerName === 'Emircan' ? d?.p1Done : d?.p2Done;
          if (myDone) setMultiStatus('Rakibinin bitirmesi bekleniyor...');
        }
      }
    });
    const unsub2 = onValue(ref(db, 'wordleScore'), (snap: any) => {
      const s = snap?.val?.();
      if (s) setScores({ emircan: s?.emircan ?? 0, efsun: s?.efsun ?? 0 });
    });
    return () => { unsub?.(); unsub2?.(); };
  }, [mode, playerName]);

  const startGame = () => {
    const len = wLen;
    const words = wLib?.[String(len)] ?? wLib?.['5'] ?? [];
    const t = words[Math.floor(Math.random() * words.length)] ?? 'MELEK';
    setTarget(t);
    setGrid(Array(6).fill(null).map(() => Array(len).fill('')));
    setCellStates(Array(6).fill(null).map(() => Array(len).fill('')));
    setRow(0); setCol(0); setMsg(''); setMultiStatus('');
    gameOver.current = false;
    setShowLobby(false);

    if (mode === 'multi') {
      set(ref(db, 'wordle'), { status: 'playing', target: t, len, p1Done: false, p2Done: false, p1G: 0, p2G: 0 });
    }
    sfx.success();
  };

  const handleKey = useCallback((char: string) => {
    if (gameOver.current) return;
    if (col < wLen && row < 6) {
      setGrid((prev: string[][]) => {
        const ng = (prev ?? []).map((r: string[]) => [...(r ?? [])]);
        if (ng?.[row]) ng[row][col] = char;
        return ng;
      });
      setCol((c: number) => c + 1);
      sfx.piece();
    }
  }, [col, row, wLen]);

  const handleDelete = useCallback(() => {
    if (gameOver.current) return;
    if (col > 0) {
      setGrid((prev: string[][]) => {
        const ng = (prev ?? []).map((r: string[]) => [...(r ?? [])]);
        if (ng?.[row]) ng[row][col - 1] = '';
        return ng;
      });
      setCol((c: number) => c - 1);
      sfx.piece();
    }
  }, [col, row]);

  const handleSubmit = useCallback(() => {
    if (gameOver.current) return;
    if (col !== wLen) { setMsg(`${wLen} harf olmalı!`); return; }
    const guess = (grid?.[row] ?? []).join('');
    const targetArr = target.split('');
    const newStates = [...(cellStates ?? []).map((r: string[]) => [...(r ?? [])])];

    for (let c = 0; c < wLen; c++) {
      const char = grid?.[row]?.[c] ?? '';
      if (char === targetArr[c]) { newStates[row][c] = 'correct'; targetArr[c] = ''; }
      else if (targetArr.includes(char)) { newStates[row][c] = 'present'; targetArr[targetArr.indexOf(char)] = ''; }
      else { newStates[row][c] = 'absent'; }
    }
    setCellStates(newStates);

    if (guess === target) {
      setMsg('Tebrikler! 🎉');
      sfx.success();
      gameOver.current = true;
      endGame(row + 1);
    } else if (row === 5) {
      setMsg(`Bilemedin! Cevap: ${target}`);
      gameOver.current = true;
      endGame(99);
    } else {
      setRow((r: number) => r + 1);
      setCol(0);
      setMsg('');
    }
  }, [col, row, grid, target, wLen, cellStates]);

  const endGame = (guessCount: number) => {
    if (mode === 'solo') return;
    setMultiStatus('Sonuçlar gönderiliyor...');
    const pKey = playerName === 'Emircan' ? 'p1G' : 'p2G';
    const dKey = playerName === 'Emircan' ? 'p1Done' : 'p2Done';
    update(ref(db, 'wordle'), { [pKey]: guessCount, [dKey]: true });
  };

  const leave = () => {
    setShowLobby(true);
    if (mode === 'multi') set(ref(db, 'wordle/status'), 'idle');
  };

  if (showLobby) {
    return (
      <>
        <div className="eyebrow">Kelime Bulmaca</div>
        <h1 className="section-title">Özel Wordle</h1>
        <div style={{ background: 'var(--bg2)', border: '1px solid var(--line)', borderRadius: 16, padding: 20, textAlign: 'center' }}>
          <div style={{ background: 'var(--panel)', border: '1px dashed var(--tozpembe)', borderRadius: 12, padding: 15, marginBottom: 20 }}>
            {mode === 'multi' && (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 14, background: 'var(--bg2)', border: '1px solid var(--tozpembe)', borderRadius: 999, padding: '10px 18px', fontFamily: "'Fraunces', serif", fontSize: '1.15rem', marginBottom: 15 }}>
                Emircan <b style={{ color: 'var(--tozpembe)' }}>{scores.emircan}</b> - <b style={{ color: 'var(--tozpembe)' }}>{scores.efsun}</b> Efsun
              </div>
            )}
            <label style={{ display: 'block', marginBottom: 4, color: 'var(--text-dim)', fontSize: '0.85rem' }}>Mod:</label>
            <select value={mode} onChange={(e) => setMode(e?.target?.value ?? 'solo')} style={{ width: '100%', padding: 10, marginBottom: 10, borderRadius: 8, border: '1px solid var(--line)', background: 'var(--bg)', color: 'var(--beyaz)' }}>
              <option value="solo">Tek Oyunculu</option><option value="multi">Çok Oyunculu (BO3)</option>
            </select>
            <label style={{ display: 'block', marginBottom: 4, color: 'var(--text-dim)', fontSize: '0.85rem' }}>Harf Sayısı:</label>
            <select value={wLen} onChange={(e) => setWLen(parseInt(e?.target?.value ?? '5'))} style={{ width: '100%', padding: 10, marginBottom: 10, borderRadius: 8, border: '1px solid var(--line)', background: 'var(--bg)', color: 'var(--beyaz)' }}>
              <option value={4}>4 Harfli</option><option value={5}>5 Harfli</option><option value={6}>6 Harfli</option><option value={7}>7 Harfli</option>
            </select>
            <button className="btn-action" onClick={startGame} style={{ width: '100%', marginTop: 10 }}>Başlat</button>
          </div>
        </div>
      </>
    );
  }

  const getCellBg = (state: string) => {
    if (state === 'correct') return 'var(--yesil-lite)';
    if (state === 'present') return 'var(--kahve)';
    if (state === 'absent') return 'var(--bg2)';
    return 'var(--bg)';
  };

  return (
    <>
      <div className="eyebrow">Kelime Bulmaca</div>
      <h1 className="section-title">Özel Wordle</h1>
      <div style={{ background: 'var(--bg2)', border: '1px solid var(--line)', borderRadius: 16, padding: 20, textAlign: 'center' }}>
        {multiStatus && <div style={{ marginBottom: 15, color: 'var(--text-dim)', fontSize: '0.9rem' }}>{multiStatus}</div>}
        <div style={{ display: 'grid', gridTemplateColumns: `repeat(${wLen}, 1fr)`, gap: 6, margin: '0 auto 20px', justifyContent: 'center', maxWidth: wLen * 56 }}>
          {(grid ?? []).map((rowArr: string[], r: number) =>
            (rowArr ?? []).map((char: string, c: number) => (
              <div key={`${r}-${c}`} style={{
                width: 50, height: 50, border: `2px solid ${cellStates?.[r]?.[c] ? getCellBg(cellStates[r][c]) : 'var(--line)'}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '1.8rem', fontFamily: "'Fraunces', serif", fontWeight: 'bold', textTransform: 'uppercase',
                background: getCellBg(cellStates?.[r]?.[c] ?? ''), transition: '0.3s', color: cellStates?.[r]?.[c] === 'absent' ? '#888' : 'var(--beyaz)'
              }}>{char}</div>
            ))
          )}
        </div>
        <div style={{ fontFamily: "'Fraunces', serif", color: 'var(--tozpembe)', fontSize: '1.2rem', marginBottom: 15, minHeight: '1.5rem' }}>{msg}</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'center' }}>
          {kbRows.map((rowStr: string, ri: number) => (
            <div key={ri} style={{ display: 'flex', gap: 4 }}>
              {ri === 2 && <button onClick={handleSubmit} style={{ background: 'var(--bg2)', border: '1px solid var(--line)', color: 'var(--beyaz)', padding: '12px 8px', borderRadius: 6, fontWeight: 'bold', cursor: 'pointer', minWidth: 35, textAlign: 'center', fontSize: '0.7rem' }}>ENT</button>}
              {rowStr.split('').map((char: string) => (
                <button key={char} onClick={() => handleKey(char)} style={{ background: 'var(--bg2)', border: '1px solid var(--line)', color: 'var(--beyaz)', padding: '12px 8px', borderRadius: 6, fontWeight: 'bold', cursor: 'pointer', minWidth: 25, textAlign: 'center' }}>{char}</button>
              ))}
              {ri === 2 && <button onClick={handleDelete} style={{ background: 'var(--bg2)', border: '1px solid var(--line)', color: 'var(--beyaz)', padding: '12px 8px', borderRadius: 6, fontWeight: 'bold', cursor: 'pointer', minWidth: 35, textAlign: 'center', fontSize: '0.7rem' }}>DEL</button>}
            </div>
          ))}
        </div>
        <button className="btn-ghost" onClick={leave} style={{ marginTop: 20 }}>Çıkış / Lobi</button>
      </div>
    </>
  );
}
