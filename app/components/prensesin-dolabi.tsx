'use client';

import React, { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { ref, onValue, push, remove } from 'firebase/database';
import { sfx } from '@/lib/sounds';

const stickerOptions = ['👗', '👕', '👖', '👠', '💍', '💄'];

export default function PrensesinDolabi() {
  const [wardrobes, setWardrobes] = useState<any>({});
  const [activeCloset, setActiveCloset] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [showHangerModal, setShowHangerModal] = useState(false);
  const [hangerName, setHangerName] = useState('');
  const [hangerLink, setHangerLink] = useState('');
  const [selectedSticker, setSelectedSticker] = useState('👗');

  useEffect(() => {
    const unsub = onValue(ref(db, 'wardrobes'), (snap: any) => {
      setWardrobes(snap?.val?.() ?? {});
    });
    return () => unsub?.();
  }, []);

  const createNew = () => {
    const name = prompt('Yeni dolabın adı ne olsun?');
    if (name?.trim?.()) {
      push(ref(db, 'wardrobes'), { name: name.trim() });
      sfx.success();
    }
  };

  const openCloset = (id: string) => {
    setActiveCloset(id);
    sfx.open();
    setTimeout(() => setIsOpen(true), 50);
  };

  const closeCloset = () => {
    setIsOpen(false);
    sfx.click();
    setTimeout(() => setActiveCloset(null), 400);
  };

  const addHanger = () => {
    if (hangerName?.trim?.() && hangerLink?.trim?.() && activeCloset) {
      push(ref(db, `wardrobes/${activeCloset}/items`), { name: hangerName.trim(), link: hangerLink.trim(), sticker: selectedSticker });
      setShowHangerModal(false);
      setHangerName('');
      setHangerLink('');
      sfx.success();
    }
  };

  const closetData = activeCloset ? wardrobes?.[activeCloset] : null;
  const closetItems = closetData?.items ?? {};

  return (
    <>
      <div className="eyebrow">İstek Listesi</div>
      <h1 className="section-title" style={{ color: 'var(--tozpembe)' }}>Prensesin Dolabı</h1>
      <button className="btn-action" onClick={createNew} style={{ marginBottom: 20, background: 'var(--tozpembe)', color: 'var(--bg)', width: '100%' }}>+ Yeni Dolap Ekle</button>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {Object.keys(wardrobes ?? {}).map((key: string) => (
          <div key={key} onClick={() => openCloset(key)} style={{
            display: 'flex', alignItems: 'center', background: 'var(--bg2)', border: '1px solid var(--line)',
            borderRadius: 12, padding: 15, cursor: 'pointer', transition: '0.2s'
          }}>
            <span style={{ fontSize: '1.8rem', marginRight: 12 }}>🚪</span>
            <span style={{ flex: 1, fontWeight: 700 }}>{wardrobes?.[key]?.name}</span>
            <button onClick={(ev) => { ev?.stopPropagation?.(); if (confirm('Silmek istediğine emin misin?')) remove(ref(db, `wardrobes/${key}`)); }}
              style={{ background: 'none', border: 'none', color: '#e08a8a', cursor: 'pointer', fontSize: '1rem' }}>✕</button>
          </div>
        ))}
      </div>

      {/* Closet Modal */}
      {activeCloset && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(10,6,5,0.75)', zIndex: 150, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div style={{ width: '100%', maxWidth: 320, height: 450, perspective: 1200, margin: '0 auto', position: 'relative' }}>
            {/* Doors */}
            <div style={{
              position: 'absolute', top: 0, bottom: 0, width: '50%', left: 0,
              background: 'linear-gradient(135deg, var(--bordo), #4a131f)', border: '2px solid var(--line)',
              transition: 'transform 0.8s cubic-bezier(0.4,0,0.2,1)', zIndex: 10,
              display: 'flex', alignItems: 'center', justifyContent: 'flex-end',
              transformOrigin: 'left', transform: isOpen ? 'rotateY(-105deg)' : 'rotateY(0)',
              boxShadow: 'inset 0 0 20px rgba(0,0,0,0.5)', borderRight: '1px solid #111'
            }}>
              <div style={{ width: 6, height: 45, background: 'var(--tozpembe)', borderRadius: 4, marginRight: 8 }} />
            </div>
            <div style={{
              position: 'absolute', top: 0, bottom: 0, width: '50%', right: 0,
              background: 'linear-gradient(135deg, var(--bordo), #4a131f)', border: '2px solid var(--line)',
              transition: 'transform 0.8s cubic-bezier(0.4,0,0.2,1)', zIndex: 10,
              display: 'flex', alignItems: 'center', justifyContent: 'flex-start',
              transformOrigin: 'right', transform: isOpen ? 'rotateY(105deg)' : 'rotateY(0)',
              boxShadow: 'inset 0 0 20px rgba(0,0,0,0.5)', borderLeft: '1px solid #111'
            }}>
              <div style={{ width: 6, height: 45, background: 'var(--tozpembe)', borderRadius: 4, marginLeft: 8 }} />
            </div>

            {/* Interior */}
            <div style={{
              position: 'absolute', inset: 0, background: '#2a1f1c', border: '2px solid var(--line)',
              borderRadius: 4, padding: 10, overflowY: 'auto', display: 'flex', flexDirection: 'column',
              boxShadow: 'inset 0 10px 20px rgba(0,0,0,0.8)'
            }}>
              <div style={{ textAlign: 'center', color: 'var(--tozpembe)', fontFamily: "'Fraunces', serif", fontSize: '1.2rem', marginBottom: 10, borderBottom: '1px dashed var(--line)', paddingBottom: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>{closetData?.name ?? 'Dolap'}</span>
                <button onClick={closeCloset} style={{ background: 'none', border: 'none', color: 'var(--text-dim)', cursor: 'pointer' }}>Kapat</button>
              </div>
              <div style={{ width: '100%', height: 8, background: 'linear-gradient(to bottom, #ccc, #777)', borderRadius: 4, marginBottom: 15, boxShadow: '0 4px 6px rgba(0,0,0,0.6)' }} />
              <div style={{ flex: 1, overflowY: 'auto', paddingRight: 5 }}>
                {Object.keys(closetItems).map((k: string) => {
                  const it = closetItems?.[k] ?? {};
                  return (
                    <div key={k} style={{ display: 'flex', alignItems: 'center', background: 'var(--bg)', border: '1px solid var(--line)', borderRadius: 8, marginBottom: 8, padding: '8px 12px' }}>
                      <span style={{ fontSize: '1.5rem', marginRight: 10 }}>{it?.sticker ?? '🪝'}</span>
                      <a href={it?.link} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--beyaz)', textDecoration: 'none', flex: 1, fontFamily: "'Fraunces', serif", fontSize: '0.95rem' }}>{it?.name}</a>
                      <button onClick={() => { if (confirm('Silmek istiyor musun?')) remove(ref(db, `wardrobes/${activeCloset}/items/${k}`)); }}
                        style={{ background: 'none', border: 'none', color: '#e08a8a', cursor: 'pointer' }}>✕</button>
                    </div>
                  );
                })}
              </div>
              <button className="btn-ghost" onClick={() => setShowHangerModal(true)} style={{ marginTop: 10, borderColor: 'var(--tozpembe)', color: 'var(--tozpembe)' }}>+ Askı Ekle</button>
            </div>
          </div>
        </div>
      )}

      {/* Hanger Modal */}
      {showHangerModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(10,6,5,0.75)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div style={{ background: 'var(--bg2)', border: '1px solid var(--line)', borderRadius: 16, padding: 22, width: '100%', maxWidth: 400 }}>
            <h3 style={{ color: 'var(--tozpembe)', marginTop: 0, fontFamily: "'Fraunces', serif" }}>Yeni Askı Ekle</h3>
            <input type="text" value={hangerName} onChange={(e) => setHangerName(e?.target?.value ?? '')} placeholder="Ürün Adı"
              style={{ width: '100%', marginBottom: 14, padding: 10, borderRadius: 8, border: '1px solid var(--line)', background: 'var(--bg)', color: 'var(--beyaz)' }} />
            <input type="text" value={hangerLink} onChange={(e) => setHangerLink(e?.target?.value ?? '')} placeholder="Ürün Linki"
              style={{ width: '100%', marginBottom: 14, padding: 10, borderRadius: 8, border: '1px solid var(--line)', background: 'var(--bg)', color: 'var(--beyaz)' }} />
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center', marginBottom: 15 }}>
              {stickerOptions.map((s: string) => (
                <span key={s} onClick={() => { setSelectedSticker(s); sfx.click(); }} style={{
                  fontSize: '1.6rem', padding: 6, border: `2px solid ${s === selectedSticker ? 'var(--tozpembe)' : 'transparent'}`,
                  borderRadius: 8, cursor: 'pointer', transition: '0.2s', background: s === selectedSticker ? 'rgba(217,166,162,0.2)' : 'var(--bg2)',
                  transform: s === selectedSticker ? 'scale(1.1)' : 'scale(1)'
                }}>{s}</span>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 10 }}>
              <button className="btn-ghost" onClick={() => setShowHangerModal(false)}>Vazgeç</button>
              <button className="btn-action" onClick={addHanger}>Askıya As</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
