'use client';

import React, { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { ref, onValue, push, remove, update } from 'firebase/database';
import { sfx } from '@/lib/sounds';

export default function Yapilacaklar() {
  const [tasks, setTasks] = useState<any[]>([]);
  const [input, setInput] = useState('');

  useEffect(() => {
    const unsub = onValue(ref(db, 'todos'), (snap) => {
      const data = snap.val() || {};
      setTasks(Object.entries(data).map(([id, val]: [string, any]) => ({ id, ...val })));
    });
    return () => unsub();
  }, []);

  const addTask = () => {
    if (input.trim()) {
      push(ref(db, 'todos'), { text: input.trim(), done: false, time: Date.now() });
      setInput('');
      sfx.success();
    }
  };

  const toggleTask = (id: string, currentStatus: boolean) => {
    update(ref(db, `todos/${id}`), { done: !currentStatus });
    sfx.click();
  };

  return (
    <>
      <div className="eyebrow">Planlar & Hayaller</div>
      <h1 className="section-title">Yapılacaklar Listesi</h1>

      <div className="card" style={{ display: 'flex', gap: 10, marginBottom: 25 }}>
        <input type="text" value={input} onChange={e => setInput(e.target.value)} placeholder="Yeni bir görev ekle..." className="chat-input" onKeyDown={e => e.key === 'Enter' && addTask()} />
        <button onClick={addTask} className="btn-action" style={{ whiteSpace: 'nowrap' }}>Ekle</button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {tasks.sort((a,b) => b.time - a.time).map(task => (
          <div key={task.id} className="card" style={{ display: 'flex', alignItems: 'center', gap: 15, opacity: task.done ? 0.6 : 1 }}>
            <input type="checkbox" checked={task.done} onChange={() => toggleTask(task.id, task.done)} style={{ width: 22, height: 22, accentColor: 'var(--tozpembe)' }} />
            <span style={{ flex: 1, textDecoration: task.done ? 'line-through' : 'none', fontSize: '1.1rem' }}>{task.text}</span>
            <button onClick={() => remove(ref(db, `todos/${task.id}`))} style={{ background: 'none', border: 'none', color: '#ff4d4d' }}>✕</button>
          </div>
        ))}
      </div>
    </>
  );
}
