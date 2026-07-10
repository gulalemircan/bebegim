'use client';

import React, { useState } from 'react';
import { sfx } from '@/lib/sounds';

const COLORS = ['#FF4B2B', '#3498db', '#2ecc71', '#f1c40f'];

export default function RenkHafiza() {
  const [sequence, setSequence] = useState<number[]>([]);
  const [userSequence, setUserSequence] = useState<number[]>([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [activeColor, setActiveColor] = useState<number | null>(null);
  const [message, setMessage] = useState('Başlamak için butona tıkla!');

  const startGame = () => {
    const firstColor = Math.floor(Math.random() * 4);
    setSequence([firstColor]);
    setUserSequence([]);
    setIsPlaying(true);
    playSequence([firstColor]);
  };

  const playSequence = async (seq: number[]) => {
    setMessage('İzle...');
    for (let i = 0; i < seq.length; i++) {
      await new Promise(r => setTimeout(r, 600));
      setActiveColor(seq[i]);
      sfx.click();
      await new Promise(r => setTimeout(r, 300));
      setActiveColor(null);
    }
    setMessage('Senin sıran!');
  };

  const handleColorClick = (idx: number) => {
    if (!isPlaying || message === 'İzle...') return;

    const newUserSeq = [...userSequence, idx];
    setUserSequence(newUserSeq);

    if (idx !== sequence[newUserSeq.length - 1]) {
      sfx.click(); // sfx.error() yok, click() kullanıyoruz
      setMessage('Eyvah! Yanlış renk. Skor: ' + (sequence.length - 1));
      setIsPlaying(false);
      return;
    }

    if (newUserSeq.length === sequence.length) {
      sfx.success();
      const nextSeq = [...sequence, Math.floor(Math.random() * 4)];
      setSequence(nextSeq);
      setUserSequence([]);
      setTimeout(() => playSequence(nextSeq), 1000);
    }
  };

  return (
    <div style={{ textAlign: 'center', padding: '0 10px' }}>
      <div className="eyebrow">Hafıza Testi</div>
      <h1 className="section-title">Renk Hafıza</h1>

      <p style={{ marginBottom: 30, color: 'var(--tozpembe)', fontWeight: 'bold' }}>{message}</p>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 15, maxWidth: 300, margin: '0 auto' }}>
        {COLORS.map((color, idx) => (
          <button
            key={idx}
            onClick={() => handleColorClick(idx)}
            style={{
              aspectRatio: '1/1',
              background: color,
              borderRadius: 20,
              border: 'none',
              opacity: activeColor === idx ? 1 : 0.6,
              transform: activeColor === idx ? 'scale(0.95)' : 'scale(1)',
              transition: 'all 0.1s',
              boxShadow: activeColor === idx ? `0 0 30px ${color}` : 'none',
              cursor: 'pointer'
            }}
          />
        ))}
      </div>

      {!isPlaying && (
        <button className="btn-action" onClick={startGame} style={{ marginTop: 40, width: '100%', maxWidth: 300 }}>
          Oyunu Başlat
        </button>
      )}
    </div>
  );
}
