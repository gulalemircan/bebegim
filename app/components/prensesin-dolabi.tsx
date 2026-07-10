'use client';

import React, { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { ref, onValue, push, remove } from 'firebase/database';
import { sfx } from '@/lib/sounds';

export default function PrensesinDolabi() {
  const [closets, setClosets] = useState<any[]>([]);
  const [activeCloset, setActiveCloset] = useState<string | null>(null);
  const [items, setItems] = useState<any[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newClosetName, setNewClosetName] = useState('');

  useEffect(() => {
    const unsub = onValue(ref(db, 'wardrobes'), (snap) => {
      const data = snap.val() || {};
      setClosets(Object.entries(data).map(([id, val]: [string, any]) => ({ id, ...val })));
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    if (activeCloset) {
      const unsub = onValue(ref(db, `wardrobe_items/${activeCloset}`), (snap) => {
        const data = snap.val() || {};
        setItems(Object.entries(data).map(([id, val]: [string, any]) => ({ id, ...val })));
      });
      return () => unsub();
    }
  }, [activeCloset]);

  const addCloset = () => {
    if (newClosetName.trim()) {
      push(ref(db, 'wardrobes'), { name: newClosetName.trim() });
      setNewClosetName('');
      setShowAddModal(false);
      sfx.success();
    }
  };

  const deleteCloset = (id: string) => {
    if (confirm('Bu dolabı ve içindeki her şeyi silmek istediğine emin misin?')) {
      remove(ref(db, `wardrobes/${id}`));
      remove(ref(db, `wardrobe_items/${id}`));
      setActiveCloset(null);
    }
  };

  const addItem = () => {
    const imgPrompt = prompt('Kıyafet görseli URL (veya base64):');
    if (imgPrompt) {
      push(ref(db, `wardrobe_items/${activeCloset}`), { img: imgPrompt, date: Date.now() });
      sfx.success();
    }
  };

  return (
    <>
      <div className="eyebrow">Prensesin Köşesi</div>
      <h1 className="section-title">Prensesin Dolabı</h1>

      {!activeCloset ? (
        <div className="menu-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          {closets.map(c => (
            <div key={c.id} style={{ position: 'relative' }}>
              <button onClick={() => setActiveCloset(c.id)} className="card" style={{ width: '100%', padding: '30px 10px', textAlign: 'center', cursor: 'pointer' }}>
                <div style={{ fontSize: '2rem' }}>👗</div>
                <div style={{ fontWeight: 'bold', marginTop: 10 }}>{c.name}</div>
              </button>
              <button onClick={() => deleteCloset(c.id)} style={{ position: 'absolute', top: 5, right: 5, background: 'none', border: 'none', color: '#ff4d4d', fontSize: '1.2rem' }}>×</button>
            </div>
          ))}
          <button onClick={() => setShowAddModal(true)} className="card" style={{ border: '2px dashed var(--line)', padding: '30px 10px', textAlign: 'center', background: 'none' }}>
            <div style={{ fontSize: '2rem' }}>➕</div>
            <div style={{ fontWeight: 'bold', marginTop: 10 }}>Yeni Ekle</div>
          </button>
        </div>
      ) : (
        <div>
          <button onClick={() => setActiveCloset(null)} className="btn-ghost" style={{ marginBottom: 20 }}>← Dolaplara Dön</button>
          <div className="menu-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {items.map(i => (
              <div key={i.id} className="card" style={{ padding: 5 }}>
                <img src={i.img} alt="kıyafet" style={{ width: '100%', borderRadius: 10, aspectRatio: '3/4', objectFit: 'cover' }} />
                <button onClick={() => remove(ref(db, `wardrobe_items/${activeCloset}/${i.id}`))} style={{ width: '100%', marginTop: 5 }} className="btn-ghost">Sil</button>
              </div>
            ))}
            <button onClick={addItem} className="card" style={{ border: '2px dashed var(--line)', background: 'none', height: '100%', minHeight: 150 }}>➕ Ekle</button>
          </div>
        </div>
      )}

      {showAddModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div className="card" style={{ width: '100%', maxWidth: 400 }}>
            <h3 style={{ marginTop: 0 }}>Yeni Dolap İsmi</h3>
            <input 
              type="text" 
              value={newClosetName} 
              onChange={e => setNewClosetName(e.target.value)} 
              className="chat-input" 
              placeholder="Örn: Yazlık Elbiseler" 
              autoFocus
            />
            <div style={{ display: 'flex', gap: 10, marginTop: 15 }}>
              <button onClick={() => setShowAddModal(false)} className="btn-ghost" style={{ flex: 1 }}>İptal</button>
              <button onClick={addCloset} className="btn-action" style={{ flex: 1 }}>Ekle</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
