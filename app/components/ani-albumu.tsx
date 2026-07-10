'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { db } from '@/lib/firebase';
import { ref, onValue, push, remove } from 'firebase/database';
import { sfx } from '@/lib/sounds';

interface Props { playerName: string; }
interface AlbumItem { id: string; img?: string; desc?: string; date?: string; time?: number; addedBy?: string; }

export default function AniAlbumu({ playerName }: Props) {
  const [items, setItems] = useState<AlbumItem[]>([]);
  const [desc, setDesc] = useState('');
  const [loading, setLoading] = useState(false);
  const [lightbox, setLightbox] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const unsub = onValue(ref(db, 'album'), (snap: any) => {
      const data = snap?.val?.() ?? {};
      const arr = Object.keys(data)
        .map((k: string) => ({ id: k, ...(data[k] ?? {}) }))
        .sort((a: any, b: any) => (a?.time ?? 0) - (b?.time ?? 0));
      setItems(arr);
    });
    return () => unsub?.();
  }, []);

  // ESC ile lightbox kapat
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') setLightbox(null); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  const upload = useCallback(() => {
    const file = fileRef?.current?.files?.[0];
    if (!file) { alert('Lütfen fotoğraf seçin.'); return; }
    if (file.size > 15 * 1024 * 1024) { alert('Fotoğraf çok büyük! Lütfen 15MB altı bir fotoğraf seç.'); return; }

    setLoading(true);
    const reader = new FileReader();
    reader.onerror = () => { alert('Dosya okunamadı, tekrar dene.'); setLoading(false); };
    reader.onload = (e: any) => {
      const img = new Image();
      img.onerror = () => { alert('Geçersiz fotoğraf dosyası.'); setLoading(false); };
      img.src = e?.target?.result ?? '';
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          const MAX_W = 800;
          let w = img?.width ?? 800;
          let h = img?.height ?? 600;
          if (w > MAX_W) { h = Math.round(h * MAX_W / w); w = MAX_W; }
          canvas.width = w;
          canvas.height = h;
          const ctx = canvas?.getContext?.('2d');
          ctx?.drawImage?.(img, 0, 0, w, h);
          const dataUrl = canvas?.toDataURL?.('image/jpeg', 0.6) ?? '';
          push(ref(db, 'album'), {
            img: dataUrl,
            desc,
            date: new Date().toLocaleDateString('tr-TR', { timeZone: 'Europe/Istanbul' }),
            time: Date.now(),
            addedBy: playerName || 'Bilinmiyor',
          });
          if (fileRef?.current) fileRef.current.value = '';
          setDesc('');
          sfx.success();
        } catch {
          alert('Bir hata oluştu, tekrar dene.');
        } finally {
          setLoading(false);
        }
      };
    };
    reader.readAsDataURL(file);
  }, [desc, playerName]);

  const handleDelete = useCallback((id: string) => {
    if (!window.confirm('Bu anıyı silmek istediğine emin misin? 💔')) return;
    remove(ref(db, `album/${id}`));
  }, []);

  return (
    <>
      {/* Lightbox */}
      {lightbox && (
        <div
          onClick={() => setLightbox(null)}
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.92)',
            zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'zoom-out',
          }}
        >
          <img src={lightbox} alt="Tam ekran anı" style={{ maxWidth: '95vw', maxHeight: '92vh', borderRadius: 12, boxShadow: '0 8px 40px #0008' }} />
          <span style={{ position: 'absolute', top: 18, right: 24, color: '#fff', fontSize: 28, cursor: 'pointer', fontWeight: 700 }}>✕</span>
        </div>
      )}

      <div className="eyebrow">Zaman çizelgesi</div>
      <h1 className="section-title">
        Anı albümümüz
        {items.length > 0 && (
          <span style={{ marginLeft: 10, fontSize: '0.75rem', background: 'var(--bordo-lite)', color: '#fff', borderRadius: 99, padding: '2px 10px', verticalAlign: 'middle' }}>
            {items.length} anı
          </span>
        )}
      </h1>

      {/* Upload alanı */}
      <div className="card" style={{ border: '2px dashed var(--line)', borderRadius: 16, padding: 20, textAlign: 'center', marginBottom: 20 }}>
        <label style={{ display: 'inline-block', background: 'var(--bg2)', padding: '10px 20px', borderRadius: 8, border: '1px solid var(--tozpembe)', cursor: 'pointer', color: 'var(--beyaz)', fontWeight: 'bold', marginBottom: 10 }}>
          📷 Fotoğraf Seç
          <input type="file" accept="image/*" ref={fileRef} style={{ display: 'none' }} />
        </label>
        <input
          type="text"
          value={desc}
          onChange={(e) => setDesc(e?.target?.value ?? '')}
          placeholder="Bu anıyı anlat..."
          style={{ width: '100%', padding: 10, borderRadius: 8, border: '1px solid var(--line)', background: 'var(--bg)', color: 'var(--beyaz)', marginBottom: 10 }}
        />
        <button className="btn-action" style={{ width: '100%', opacity: loading ? 0.6 : 1 }} onClick={upload} disabled={loading}>
          {loading ? '⏳ Yükleniyor...' : 'Albüme Ekle'}
        </button>
      </div>

      {/* Anı listesi */}
      <div className="card">
        {items.length === 0 ? (
          <div style={{ textAlign: 'center', color: 'var(--text-dim)', padding: '40px 0', fontSize: '0.95rem' }}>
            💌 Henüz hiç anı yok. İlk anıyı siz ekleyin!
          </div>
        ) : (
          <div style={{ position: 'relative', marginTop: 16, paddingLeft: 26, borderLeft: '2px solid var(--line)' }}>
            {items.map((item) => (
              <div key={item.id} style={{ position: 'relative', marginBottom: 30 }}>
                <div style={{ position: 'absolute', left: -33, top: 4, width: 12, height: 12, borderRadius: '50%', background: 'var(--bordo-lite)' }} />
                <div style={{ fontSize: '0.7rem', color: 'var(--tozpembe)', letterSpacing: 1, textTransform: 'uppercase', fontWeight: 700 }}>
                  {item.date}
                  {item.addedBy && <span style={{ marginLeft: 8, opacity: 0.7, textTransform: 'none', letterSpacing: 0 }}>· {item.addedBy} ekledi</span>}
                </div>
                {item.img && (
                  <div
                    onClick={() => setLightbox(item.img!)}
                    style={{ marginTop: 10, width: '100%', borderRadius: 14, background: 'var(--bg2)', border: '1px solid var(--line)', overflow: 'hidden', cursor: 'zoom-in' }}
                  >
                    <img src={item.img} alt={item.desc ?? 'Anı'} style={{ width: '100%', display: 'block', objectFit: 'cover' }} />
                  </div>
                )}
                <div style={{ marginTop: 10, color: 'var(--text-dim)', fontSize: '0.88rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>{item.desc}</span>
                  <span style={{ color: '#e08a8a', cursor: 'pointer', fontSize: '1rem', padding: '2px 6px' }} onClick={() => handleDelete(item.id)}>✕</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
