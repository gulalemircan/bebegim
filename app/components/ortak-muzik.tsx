'use client';

import React, { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { ref, onValue, push, remove } from 'firebase/database';
import { sfx } from '@/lib/sounds';

interface Props { playerName: string; }

export default function OrtakMuzik({ playerName }: Props) {
  const [items, setItems] = useState<any[]>([]);
  const [link, setLink] = useState('');

  useEffect(() => {
    const unsub = onValue(ref(db, 'music'), (snap: any) => {
      const data = snap?.val?.() ?? {};
      const arr = Object.keys(data).map((k: string) => ({ id: k, ...(data[k] ?? {}) })).sort((a: any, b: any) => (b?.time ?? 0) - (a?.time ?? 0));
      setItems(arr);
    });
    return () => unsub?.();
  }, []);

  const add = () => {
    if (link?.includes?.('spotify.com')) {
      try {
        const url = new URL(link);
        const embedUrl = `https://open.spotify.com/embed${url?.pathname}`;
        push(ref(db, 'music'), { url: embedUrl, time: Date.now(), by: playerName });
        setLink('');
        sfx.success();
      } catch { alert('Geçersiz link.'); }
    } else {
      alert('Geçerli bir Spotify linki girin.');
    }
  };

  return (
    <>
      <div className="eyebrow">Senkronize Dinle</div>
      <h1 className="section-title">Ortak Müzik</h1>
      <div className="card" style={{ padding: 15 }}>
        <div style={{ display: 'flex', gap: 10, marginBottom: 10 }}>
          <input type="text" value={link} onChange={(e) => setLink(e?.target?.value ?? '')} placeholder="Spotify şarkı/liste linki yapıştır..."
            style={{ flex: 1, padding: 12, borderRadius: 8, border: '1px solid var(--line)', background: 'var(--bg)', color: 'var(--beyaz)' }} />
          <button className="btn-action" onClick={add}>Ekle</button>
        </div>
        <p style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>Örn: https://open.spotify.com/track/...</p>
      </div>
      {(items ?? []).map((item: any) => (
        <div key={item?.id} style={{ position: 'relative', marginBottom: 10 }}>
          <iframe src={item?.url} height={152} style={{ width: '100%', borderRadius: 12, border: 'none' }} allow="encrypted-media" />
          <button onClick={() => remove(ref(db, `music/${item?.id}`))} style={{ position: 'absolute', top: 15, right: 15, background: 'var(--bg)', border: 'none', color: '#e08a8a', borderRadius: '50%', padding: '5px 8px', cursor: 'pointer' }}>✕</button>
        </div>
      ))}
    </>
  );
}
