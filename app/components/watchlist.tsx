'use client';

import React, { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { ref, onValue, push, remove } from 'firebase/database';
import { sfx } from '@/lib/sounds';

export default function Watchlist() {
  const [movies, setMovies] = useState<any[]>([]);
  const [title, setTitle] = useState('');

  useEffect(() => {
    const unsub = onValue(ref(db, 'watchlist'), (snap) => {
      const data = snap.val() || {};
      setMovies(Object.entries(data).map(([id, val]: [string, any]) => ({ id, ...val })));
    });
    return () => unsub();
  }, []);

  const addMovie = () => {
    if (title.trim()) {
      push(ref(db, 'watchlist'), { title: title.trim(), time: Date.now() });
      setTitle('');
      sfx.success();
    }
  };

  return (
    <>
      <div className="eyebrow">Mısırını Al Gel</div>
      <h1 className="section-title">İzlenecekler</h1>

      <div className="card" style={{ display: 'flex', gap: 10, marginBottom: 25 }}>
        <input type="text" value={title} onChange={e => setTitle(e.target.value)} placeholder="Film veya Dizi adı..." className="chat-input" onKeyDown={e => e.key === 'Enter' && addMovie()} />
        <button onClick={addMovie} className="btn-action">Ekle</button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        {movies.map(m => (
          <div key={m.id} className="card" style={{ textAlign: 'center', position: 'relative' }}>
            <div style={{ fontSize: '2rem', marginBottom: 10 }}>🎬</div>
            <div style={{ fontWeight: 'bold' }}>{m.title}</div>
            <button onClick={() => remove(ref(db, `watchlist/${m.id}`))} style={{ position: 'absolute', top: 5, right: 5, background: 'none', border: 'none', color: '#ff4d4d' }}>×</button>
          </div>
        ))}
      </div>
    </>
  );
}
