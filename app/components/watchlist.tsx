'use client';

import React, { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { ref, onValue, push, update } from 'firebase/database';
import { sfx } from '@/lib/sounds';

interface Props { playerName: string; }

export default function Watchlist({ playerName }: Props) {
  const [items, setItems] = useState<any[]>([]);
  const [input, setInput] = useState('');

  useEffect(() => {
    const unsub = onValue(ref(db, 'watchlist'), (snap: any) => {
      const data = snap?.val?.() ?? {};
      const arr = Object.keys(data).map((k: string) => ({ id: k, ...(data[k] ?? {}) })).sort((a: any, b: any) => (b?.time ?? 0) - (a?.time ?? 0));
      setItems(arr);
    });
    return () => unsub?.();
  }, []);

  const add = () => {
    const val = input?.trim?.();
    if (val) {
      push(ref(db, 'watchlist'), { text: val, done: false, by: playerName, time: Date.now() });
      setInput('');
      sfx.success();
    }
  };

  const toggle = (id: string, current: boolean) => {
    update(ref(db, `watchlist/${id}`), { done: !current });
    sfx.click();
  };

  return (
    <>
      <div className="eyebrow">Beraber İzlenecekler</div>
      <h1 className="section-title">Watchlist</h1>
      <div className="card" style={{ padding: 15 }}>
        <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
          <input type="text" value={input} onChange={(e) => setInput(e?.target?.value ?? '')} placeholder="Dizi/Film adı..." onKeyPress={(e) => { if (e?.key === 'Enter') add(); }}
            style={{ flex: 1, padding: 12, borderRadius: 8, border: '1px solid var(--line)', background: 'var(--bg)', color: 'var(--beyaz)' }} />
          <button className="btn-action" onClick={add}>Ekle</button>
        </div>
        {(items ?? []).map((item: any) => (
          <div key={item?.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--bg2)', border: '1px solid var(--line)', borderRadius: 12, padding: 15, marginBottom: 10, opacity: item?.done ? 0.6 : 1 }}>
            <div>
              <div style={{ fontWeight: 700, fontSize: '1.05rem', textDecoration: item?.done ? 'line-through' : 'none' }}>{item?.text}</div>
              <div style={{ color: 'var(--text-dim)', fontSize: '0.8rem', marginTop: 4 }}>Ekleyen: {item?.by}</div>
            </div>
            <input type="checkbox" checked={item?.done ?? false} onChange={() => toggle(item?.id, item?.done ?? false)} style={{ width: 20, height: 20, cursor: 'pointer' }} />
          </div>
        ))}
      </div>
    </>
  );
}
