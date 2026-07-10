'use client';

import React, { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { ref, onValue, set, update } from 'firebase/database';
import { sfx } from '@/lib/sounds';

const FIELDS = ['İsim', 'Şehir', 'Bitki', 'Hayvan', 'Eşya', 'Ünlü'];

export default function IsimSehir({ playerName }: { playerName: string }) {
  const [letter, setLetter] = useState('');
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [gameState, setGameState] = useState<'waiting' | 'playing' | 'review'>('waiting');

  useEffect(() => {
    const unsub = onValue(ref(db, 'games/isim_sehir'), (snap) => {
      const data = snap.val();
      if (data) {
        setLetter(data.letter || '');
        setGameState(data.state || 'waiting');
      }
    });
    return () => unsub();
  }, []);

  const startNewRound = () => {
    const letters = "ABCÇDEFGĞHIİJKLMNOÖPRSŞTUÜVYZ";
    const randomLetter = letters[Math.floor(Math.random() * letters.length)];
    set(ref(db, 'games/isim_sehir'), {
      letter: randomLetter,
      state: 'playing',
      startTime: Date.now()
    });
    setAnswers({});
    sfx.success();
  };

  const submitAnswers = () => {
    setGameState('review');
    update(ref(db, 'games/isim_sehir'), { state: 'review' });
    sfx.click();
  };

  return (
    <div style={{ padding: '0 10px' }}>
      <div className="eyebrow">Klasik Oyunlar</div>
      <h1 className="section-title">İsim Şehir Hayvan</h1>

      {gameState === 'waiting' ? (
        <div className="card" style={{ textAlign: 'center', padding: '40px 20px' }}>
          <div style={{ fontSize: '4rem', marginBottom: 20 }}>✍️</div>
          <button className="btn-action" onClick={startNewRound} style={{ width: '100%' }}>Yeni Harf Seç ve Başla</button>
        </div>
      ) : (
        <>
          <div className="card" style={{ textAlign: 'center', marginBottom: 20, border: '2px solid var(--tozpembe)' }}>
            <div style={{ fontSize: '0.9rem', color: 'var(--text-dim)' }}>GÜNÜN HARFİ</div>
            <div style={{ fontSize: '3rem', fontWeight: 'black', color: 'var(--tozpembe)' }}>{letter}</div>
          </div>

          <div style={{ display: 'grid', gap: 12 }}>
            {FIELDS.map(f => (
              <div key={f} className="card" style={{ padding: '10px 15px' }}>
                <label style={{ fontSize: '0.8rem', color: 'var(--tozpembe)', fontWeight: 'bold' }}>{f.toUpperCase()}</label>
                <input 
                  type="text" 
                  className="chat-input" 
                  disabled={gameState === 'review'}
                  placeholder={`${letter} ile başlayan...`}
                  value={answers[f] || ''}
                  onChange={e => setAnswers({...answers, [f]: e.target.value})}
                  style={{ background: 'none', border: 'none', borderBottom: '1px solid var(--line)', borderRadius: 0, padding: '5px 0' }}
                />
              </div>
            ))}
          </div>

          <div style={{ marginTop: 25 }}>
            {gameState === 'playing' ? (
              <button className="btn-action" style={{ width: '100%' }} onClick={submitAnswers}>BİTTİ! (Durdur)</button>
            ) : (
              <button className="btn-ghost" style={{ width: '100%' }} onClick={() => setGameState('waiting')}>Yeni Oyun</button>
            )}
          </div>
        </>
      )}
    </div>
  );
}
