'use client';

import React, { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { ref, onValue, update } from 'firebase/database';
import { sendNotification } from '@/lib/notifications';

const MOODS = [
  { id: 'happy', label: 'Mutlu', emoji: '😊' },
  { id: 'miss', label: 'Özledi', emoji: '🥺' },
  { id: 'love', label: 'Aşık', emoji: '🥰' },
  { id: 'busy', label: 'Meşgul', emoji: '👨‍💻' },
  { id: 'sleepy', label: 'Uykulu', emoji: '😴' }
];

export default function HomePage({ setActiveTab }: any) {
  const [partnerMood, setPartnerMood] = useState('love');
  const [playerName, setPlayerName] = useState('');

  useEffect(() => {
    const name = localStorage.getItem('ee_player_name') || '';
    setPlayerName(name);
    const partnerName = name === 'Efsun' ? 'Emircan' : 'Efsun';

    const unsub = onValue(ref(db, `users/${partnerName}/status`), (snap) => {
      if (snap.exists()) setPartnerMood(snap.val().mood);
    });
    return () => unsub();
  }, []);

  const changeMood = (moodId: string) => {
    if (!playerName) return;
    update(ref(db, `users/${playerName}/status`), {
      mood: moodId,
      lastSeen: Date.now()
    });
    
    sendNotification({
      type: 'mood',
      title: 'Mood Değişti!',
      body: `${playerName} şu an ${MOODS.find(m => m.id === moodId)?.label} hissediyor.`,
      sender: playerName
    });
  };

  return (
    <div className="home-container">
      <div className="hero-section card">
        <h1>Hoş Geldin Sevgilim 💖</h1>
        <p>Burası sadece bize özel, bizim dünyamız.</p>
        
        <div className="partner-status">
          <span className="status-label">Partnerinin Modu:</span>
          <span className="status-emoji">{MOODS.find(m => m.id === partnerMood)?.emoji}</span>
          <span className="status-text">{MOODS.find(m => m.id === partnerMood)?.label}</span>
        </div>
      </div>

      <div className="section-header">Nasıl Hissediyorsun?</div>
      <div className="mood-selector">
        {MOODS.map(m => (
          <button key={m.id} onClick={() => changeMood(m.id)} className="mood-btn">
            <span className="emoji">{m.emoji}</span>
            <span className="label">{m.label}</span>
          </button>
        ))}
      </div>

      <div className="section-header">Hızlı Erişim</div>
      <div className="quick-grid">
        <button onClick={() => setActiveTab('album')} className="quick-card">
          <span>📸</span> Anı Albümü
        </button>
        <button onClick={() => setActiveTab('muzik')} className="quick-card">
          <span>🎵</span> Ortak Müzik
        </button>
        <button onClick={() => setActiveTab('harita')} className="quick-card">
          <span>📍</span> Aşk Haritası
        </button>
        <button onClick={() => setActiveTab('yapilacaklar')} className="quick-card">
          <span>✅</span> Yapılacaklar
        </button>
      </div>
    </div>
  );
}
