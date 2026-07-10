'use client';

import React, { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { ref, onValue, push, remove } from 'firebase/database';
import { sfx } from '@/lib/sounds';
import { sendNotification } from '@/lib/notifications';

interface Props {
  playerName: string;
}

export default function Harita({ playerName }: Props) {
  const [pins, setPins] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const unsub = onValue(ref(db, 'pins'), (snap) => {
      const data = snap.val() || {};
      setPins(Object.entries(data).map(([id, val]: [string, any]) => ({ id, ...val })));
    });
    return () => unsub();
  }, []);

  const addPin = (e: React.MouseEvent<HTMLDivElement>) => {
    if (loading) return;
    
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    const title = prompt("Bu noktada ne oldu? ✨");
    if (title) {
      setLoading(true);
      push(ref(db, 'pins'), {
        title,
        x,
        y,
        addedBy: playerName || 'Anonim',
        time: Date.now()
      }).then(() => {
        sendNotification({
          type: 'location',
          title: '📍 Yeni Konum!',
          body: `${playerName} haritaya yeni bir anı ekledi: "${title}"`,
          sender: playerName
        });
        sfx.success();
      }).finally(() => setLoading(false));
    }
  };

  return (
    <div style={{ padding: '0 10px' }}>
      <div className="eyebrow">Anılarımızın Haritası</div>
      <h1 className="section-title">Aşk Haritası</h1>
      <p style={{ marginBottom: 20, color: 'var(--text-dim)', fontSize: '0.9rem' }}>Haritada bir yere tıkla ve oradaki anımızı ekle.</p>

      <div 
        onClick={addPin}
        style={{ 
          width: '100%', 
          aspectRatio: '16/9', 
          background: 'var(--bg2)', 
          borderRadius: 20, 
          position: 'relative', 
          overflow: 'hidden', 
          border: '2px solid var(--line)',
          cursor: 'crosshair'
        }}
      >
        {/* Örnek Harita Arkaplanı - Gerçek harita yerine stilize bir görsel/izgara */}
        <div style={{ 
          position: 'absolute', inset: 0, opacity: 0.1, 
          backgroundImage: 'radial-gradient(circle, var(--tozpembe) 1px, transparent 1px)', 
          backgroundSize: '20px 20px' 
        }} />

        {pins.map(pin => (
          <div 
            key={pin.id}
            title={pin.title}
            style={{ 
              position: 'absolute', 
              left: `${pin.x}%`, 
              top: `${pin.y}%`, 
              transform: 'translate(-50%, -100%)',
              fontSize: '1.5rem',
              cursor: 'pointer',
              filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.5))'
            }}
          >
            📍
            <div style={{ 
              position: 'absolute', bottom: '100%', left: '50%', transform: 'translateX(-50%)',
              background: 'var(--bg2)', color: 'var(--beyaz)', padding: '4px 8px', borderRadius: 4,
              fontSize: '0.7rem', whiteSpace: 'nowrap', border: '1px solid var(--line)'
            }}>
              {pin.title}
            </div>
          </div>
        ))}
      </div>

      <div style={{ marginTop: 30 }}>
        {pins.slice(-3).reverse().map(pin => (
          <div key={pin.id} className="card" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
            <div>
              <div style={{ fontWeight: 'bold' }}>{pin.title}</div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>Ekleyen: {pin.addedBy}</div>
            </div>
            <button onClick={(e) => { e.stopPropagation(); remove(ref(db, `pins/${pin.id}`)); }} style={{ background: 'none', border: 'none', color: '#ff4d4d' }}>Sil</button>
          </div>
        ))}
      </div>
    </div>
  );
}
