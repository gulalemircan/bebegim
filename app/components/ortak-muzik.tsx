'use client';

import React, { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { ref, onValue, push, remove } from 'firebase/database';
import { sfx } from '@/lib/sounds';

interface Props {
  playerName: string;
}

export default function OrtakMuzik({ playerName }: Props) {
  const [songs, setSongs] = useState<any[]>([]);
  const [url, setUrl] = useState('');
  const [title, setTitle] = useState('');

  useEffect(() => {
    const unsub = onValue(ref(db, 'playlist'), (snap) => {
      const data = snap.val() || {};
      setSongs(Object.entries(data).map(([id, val]: [string, any]) => ({ id, ...val })));
    });
    return () => unsub();
  }, []);

  const addSong = (e: React.FormEvent) => {
    e.preventDefault();
    if (url.trim() && title.trim()) {
      push(ref(db, 'playlist'), {
        title: title.trim(),
        url: url.trim(),
        addedBy: playerName || 'Anonim',
        date: Date.now()
      });
      setUrl('');
      setTitle('');
      sfx.success();
    }
  };

  return (
    <>
      <div className="eyebrow">Bizim Ritmi̇miz</div>
      <h1 className="section-title">Ortak Müzik Listesi</h1>

      <form className="card" onSubmit={addSong} style={{ marginBottom: 30 }}>
        <input type="text" placeholder="Şarkı Adı" value={title} onChange={e => setTitle(e.target.value)} className="chat-input" style={{ marginBottom: 10 }} required />
        <input type="text" placeholder="YouTube / Spotify Linki" value={url} onChange={e => setUrl(e.target.value)} className="chat-input" style={{ marginBottom: 10 }} required />
        <button type="submit" className="btn-action" style={{ width: '100%' }}>➕ Listeye Ekle</button>
      </form>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {[...songs].reverse().map(song => (
          <div key={song.id} className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 'bold', fontSize: '1.1rem' }}>{song.title}</div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>Ekleyen: {song.addedBy}</div>
              <a href={song.url} target="_blank" rel="noopener noreferrer" style={{ fontSize: '0.8rem', color: 'var(--tozpembe)', textDecoration: 'none' }}>Dinlemek için tıkla →</a>
            </div>
            <button onClick={() => remove(ref(db, `playlist/${song.id}`))} style={{ background: 'none', border: 'none', color: '#ff4d4d', padding: 10, cursor: 'pointer' }}>✕</button>
          </div>
        ))}
      </div>
    </>
  );
}
