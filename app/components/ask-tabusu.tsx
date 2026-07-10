'use client';

import React, { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { ref, onValue, update } from 'firebase/database';
import { sfx } from '@/lib/sounds';

const CARDS = [
  { word: "EVLİLİK", forbidden: ["Yüzük", "Düğün", "Teklif", "Nikah", "Gelinlik"] },
  { word: "İSKELE", forbidden: ["Deniz", "Gemi", "Vapur", "Moda", "Balık"] },
  { word: "PİKNİK", forbidden: ["Ömerli", "Mangal", "Doğa", "Sepet", "Örtü"] }
];

export default function AskTabusu() {
  const [cardIdx, setCardIdx] = useState(0);
  const [scores, setScores] = useState({ efun: 0, emircan: 0 });

  useEffect(() => {
    const unsub = onValue(ref(db, 'games/tabu'), (snap) => {
      if (snap.exists()) setScores(snap.val().scores || { efun: 0, emircan: 0 });
    });
    return () => unsub();
  }, []);

  const handleScore = (player: 'efun' | 'emircan', points: number) => {
    const newScores = { ...scores, [player]: scores[player] + points };
    update(ref(db, 'games/tabu'), { scores: newScores });
    if (points > 0) sfx.success(); else sfx.click();
    nextCard();
  };

  const nextCard = () => {
    setCardIdx(prev => (prev + 1) % CARDS.length);
  };

  return (
    <div style={{ padding: '0 10px', maxWidth: 500, margin: '0 auto' }}>
      <div className="eyebrow">Eğlence Zamanı</div>
      <h1 className="section-title">Aşk Tabusu</h1>

      <div className="card" style={{ display: 'flex', justifyContent: 'space-around', marginBottom: 20, textAlign: 'center' }}>
        <div>
          <div style={{ fontSize: '0.8rem', color: 'var(--tozpembe)' }}>EFSUN</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{scores.efun}</div>
        </div>
        <div style={{ borderLeft: '1px solid var(--line)' }}></div>
        <div>
          <div style={{ fontSize: '0.8rem', color: 'var(--tozpembe)' }}>EMİRCAN</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{scores.emircan}</div>
        </div>
      </div>

      <div className="card" style={{ textAlign: 'center', minHeight: 300, display: 'flex', flexDirection: 'column', justifyContent: 'center', border: '2px solid var(--tozpembe)' }}>
        <h2 style={{ fontSize: '2.5rem', margin: '0 0 20px 0', color: 'var(--beyaz)' }}>{CARDS[cardIdx].word}</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {CARDS[cardIdx].forbidden.map(w => (
            <div key={w} style={{ fontSize: '1.2rem', color: 'var(--text-dim)', textDecoration: 'line-through', opacity: 0.7 }}>{w}</div>
          ))}
        </div>
      </div>

      <div style={{ marginTop: 25, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 15 }}>
        <button className="btn-action" onClick={() => handleScore('efun', 1)} style={{ background: '#4CAF50' }}>Efsun Bildi +1</button>
        <button className="btn-action" onClick={() => handleScore('emircan', 1)} style={{ background: '#4CAF50' }}>Emircan Bildi +1</button>
        <button className="btn-ghost" onClick={() => handleScore('efun', -1)} style={{ color: '#ff4d4d', border: '1px solid #ff4d4d' }}>⚠️ Efsun FAUL -1</button>
        <button className="btn-ghost" onClick={() => handleScore('emircan', -1)} style={{ color: '#ff4d4d', border: '1px solid #ff4d4d' }}>⚠️ Emircan FAUL -1</button>
      </div>
      
      <button className="btn-ghost" onClick={nextCard} style={{ width: '100%', marginTop: 15 }}>Pas Geç</button>
    </div>
  );
}
