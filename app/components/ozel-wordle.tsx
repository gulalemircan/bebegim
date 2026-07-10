'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { db } from '@/lib/firebase';
import { ref, onValue, set, update } from 'firebase/database';
import { sfx } from '@/lib/sounds';

const WORD_LENGTH = 5;
const MAX_TRIES = 6;

const keyboardRows = [
  "ERTÜYIOPĞÜ",
  "ASDFGHJKLŞİ",
  "ZXCVBNMÖÇ"
];

const targetWord = "SEVİM"; // Her gün değişebilir veya sabit kalabilir

export default function OzelWordle({ playerName }: { playerName: string }) {
  const [grid, setGrid] = useState<string[][]>(Array(MAX_TRIES).fill(null).map(() => Array(WORD_LENGTH).fill('')));
  const [cellStates, setCellStates] = useState<string[][]>(Array(MAX_TRIES).fill(null).map(() => Array(WORD_LENGTH).fill('')));
  const [currentRow, setCurrentRow] = useState(0);
  const [currentCol, setCurrentCol] = useState(0);
  const [status, setStatus] = useState<'playing' | 'won' | 'lost'>('playing');

  const vibrate = (ms = 10) => {
    if (typeof window !== 'undefined' && window.navigator.vibrate) {
      window.navigator.vibrate(ms);
    }
  };

  const checkRow = useCallback(() => {
    const row = grid[currentRow];
    const newStates = [...cellStates];
    const currentRowStates = Array(WORD_LENGTH).fill('absent');
    const targetArr = targetWord.split('');
    const rowArr = [...row];

    // Önce doğru yerleri bul
    rowArr.forEach((char, i) => {
      if (char === targetArr[i]) {
        currentRowStates[i] = 'correct';
        targetArr[i] = '#'; 
      }
    });

    // Sonra var olan ama yanlış yerdeki harfleri bul
    rowArr.forEach((char, i) => {
      if (currentRowStates[i] !== 'correct' && targetArr.includes(char)) {
        currentRowStates[i] = 'present';
        targetArr[targetArr.indexOf(char)] = '#';
      }
    });

    newStates[currentRow] = currentRowStates;
    setCellStates(newStates);

    const isWin = currentRowStates.every(s => s === 'correct');
    if (isWin) {
      setStatus('won');
      sfx.success();
    } else if (currentRow >= MAX_TRIES - 1) {
      setStatus('lost');
    } else {
      setCurrentRow(prev => prev + 1);
      setCurrentCol(0);
      sfx.click();
    }
  }, [currentRow, grid, cellStates]);

  const handleKey = (key: string) => {
    if (status !== 'playing') return;
    vibrate();

    if (key === 'ENTER') {
      if (currentCol === WORD_LENGTH) checkRow();
      return;
    }

    if (key === 'DEL') {
      if (currentCol > 0) {
        const newGrid = [...grid];
        newGrid[currentRow][currentCol - 1] = '';
        setGrid(newGrid);
        setCurrentCol(prev => prev - 1);
      }
      return;
    }

    if (currentCol < WORD_LENGTH) {
      const newGrid = [...grid];
      newGrid[currentRow][currentCol] = key;
      setGrid(newGrid);
      setCurrentCol(prev => prev + 1);
    }
  };

  const getLetterState = (char: string) => {
    let state = '';
    for (let r = 0; r < MAX_TRIES; r++) {
      for (let c = 0; c < WORD_LENGTH; c++) {
        if (grid[r][c] === char) {
          const s = cellStates[r][c];
          if (s === 'correct') return 'correct';
          if (s === 'present' && state !== 'correct') state = 'present';
          if (s === 'absent' && !state) state = 'absent';
        }
      }
    }
    return state;
  };

  return (
    <div style={{ padding: '0 10px', maxWidth: 450, margin: '0 auto' }}>
      <div className="eyebrow">Zeka & Mantık</div>
      <h1 className="section-title">Özel Wordle</h1>

      <div style={{ display: 'grid', gridTemplateRows: `repeat(${MAX_TRIES}, 1fr)`, gap: 6, marginBottom: 30 }}>
        {grid.map((row, rIdx) => (
          <div key={rIdx} style={{ display: 'grid', gridTemplateColumns: `repeat(${WORD_LENGTH}, 1fr)`, gap: 6 }}>
            {row.map((char, cIdx) => {
              const state = cellStates[rIdx][cIdx];
              let bg = 'var(--bg2)';
              if (state === 'correct') bg = 'var(--yesil)';
              else if (state === 'present') bg = '#b59f3b';
              else if (state === 'absent') bg = '#3a3a3c';

              return (
                <div key={cIdx} style={{
                  aspectRatio: '1/1', background: bg, border: '2px solid var(--line)',
                  borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '1.8rem', fontWeight: 'bold', color: 'var(--beyaz)',
                  textTransform: 'uppercase', transition: 'all 0.3s'
                }}>
                  {char}
                </div>
              );
            })}
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {keyboardRows.map((row, rIdx) => (
          <div key={rIdx} style={{ display: 'flex', justifyContent: 'center', gap: 4 }}>
            {rIdx === 2 && <button onClick={() => handleKey('ENTER')} style={{ padding: '12px 6px', borderRadius: 6, background: 'var(--bg2)', color: 'var(--beyaz)', border: '1px solid var(--line)', fontWeight: 'bold', cursor: 'pointer', fontSize: '0.7rem' }}>GİR</button>}
            {row.split('').map(char => {
              const state = getLetterState(char);
              const isAbsent = state === 'absent';
              return (
                <button
                  key={char}
                  onClick={() => !isAbsent && handleKey(char)}
                  disabled={isAbsent}
                  style={{
                    background: isAbsent ? '#1a1a1a' : (state === 'correct' ? 'var(--yesil)' : (state === 'present' ? '#b59f3b' : 'var(--bg2)')),
                    color: isAbsent ? '#444' : 'var(--beyaz)',
                    border: '1px solid var(--line)',
                    padding: '12px 4px', borderRadius: 6, fontWeight: 'bold', cursor: isAbsent ? 'not-allowed' : 'pointer',
                    minWidth: 28, textAlign: 'center', flex: 1, opacity: isAbsent ? 0.3 : 1
                  }}
                >{char}</button>
              );
            })}
            {rIdx === 2 && <button onClick={() => handleKey('DEL')} style={{ padding: '12px 6px', borderRadius: 6, background: 'var(--bg2)', color: 'var(--beyaz)', border: '1px solid var(--line)', fontWeight: 'bold', cursor: 'pointer', fontSize: '0.7rem' }}>SİL</button>}
          </div>
        ))}
      </div>

      {status !== 'playing' && (
        <div className="card" style={{ marginTop: 30, textAlign: 'center', border: '2px solid var(--tozpembe)' }}>
          <h2 style={{ fontFamily: "'Fraunces', serif" }}>{status === 'won' ? 'Harikasın Sevgilim! 🎉' : 'Olsun, Bir Daha Dene! 🥺'}</h2>
          <p>Kelime: {targetWord}</p>
          <button className="btn-action" onClick={() => window.location.reload()}>Tekrar Oyna</button>
        </div>
      )}
    </div>
  );
}
