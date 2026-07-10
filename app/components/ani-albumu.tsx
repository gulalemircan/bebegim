'use client';

import React, { useState, useEffect, useRef } from 'react';
import { db, storage } from '@/lib/firebase';
import { ref, onValue, push, remove } from 'firebase/database';
import { ref as storageRef, uploadString, getDownloadURL } from 'firebase/storage';
import { sfx } from '@/lib/sounds';

interface Props { playerName: string; }

export default function AniAlbumu({ playerName }: Props) {
  const [items, setItems] = useState<any[]>([]);
  const [desc, setDesc] = useState('');
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const unsub = onValue(ref(db, 'album'), (snap: any) => {
      const data = snap?.val?.() ?? {};
      const arr = Object.keys(data).map((k: string) => ({ id: k, ...(data[k] ?? {}) })).sort((a: any, b: any) => (a?.time ?? 0) - (b?.time ?? 0));
      setItems(arr);
    });
    return () => unsub?.();
  }, []);

  const upload = async () => {
    const file = fileRef?.current?.files?.[0];
    if (!file) { alert('Lütfen fotoğraf seçin.'); return; }
    setUploading(true);

    try {
      const reader = new FileReader();
      reader.onload = async (e: any) => {
        const img = new Image();
        img.src = e?.target?.result ?? '';
        img.onload = async () => {
          // Görseli küçült
          const canvas = document.createElement('canvas');
          const MAX_W = 1200;
          let w = img?.width ?? 1200;
          let h = img?.height ?? 800;
          if (w > MAX_W) { h = Math.round(h * MAX_W / w); w = MAX_W; }
          canvas.width = w;
          canvas.height = h;
          const ctx = canvas?.getContext?.('2d');
          ctx?.drawImage?.(img, 0, 0, w, h);
          const dataUrl = canvas?.toDataURL?.('image/jpeg', 0.75) ?? '';

          // Firebase Storage'a yükle
          const imgRef = storageRef(storage, `album/${Date.now()}_${Math.random().toString(36).slice(2)}.jpg`);
          await uploadString(imgRef, dataUrl, 'data_url');
          const downloadUrl = await getDownloadURL(imgRef);

          // Veritabanına sadece URL kaydet (base64 değil!)
          push(ref(db, 'album'), {
            img: downloadUrl,
            desc,
            date: new Date().toLocaleDateString('tr-TR', { timeZone: 'Europe/Istanbul' }),
            time: Date.now(),
            uploadedBy: playerName,
          });

          if (fileRef?.current) fileRef.current.value = '';
          setDesc('');
          setUploading(false);
          sfx.success();
        };
      };
      reader.readAsDataURL(file);
    } catch (err) {
      console.error('Upload hatası:', err);
      alert('Yükleme başarısız. Firebase Storage aktif mi kontrol et.');
      setUploading(false);
    }
  };

  return (
    <>
      <div className="eyebrow">Zaman çizelgesi</div>
      <h1 className="section-title">Anı albümümüz</h1>
      <div className="card" style={{ border: '2px dashed var(--line)', borderRadius: 16, padding: 20, textAlign: 'center', marginBottom: 20 }}>
        <label style={{ display: 'inline-block', background: 'var(--bg2)', padding: '10px 20px', borderRadius: 8, border: '1px solid var(--tozpembe)', cursor: uploading ? 'not-allowed' : 'pointer', color: 'var(--beyaz)', fontWeight: 'bold', marginBottom: 10, opacity: uploading ? 0.6 : 1 }}>
          {uploading ? 'Yükleniyor...' : 'Fotoğraf Seç'}
          <input type="file" accept="image/*" ref={fileRef} style={{ display: 'none' }} disabled={uploading} />
        </label>
        <input type="text" value={desc} onChange={(e) => setDesc(e?.target?.value ?? '')} placeholder="Bu anıyı anlat..."
          style={{ width: '100%', padding: 10, borderRadius: 8, border: '1px solid var(--line)', background: 'var(--bg)', color: 'var(--beyaz)', marginBottom: 10 }} />
        <button className="btn-action" style={{ width: '100%', opacity: uploading ? 0.6 : 1 }} onClick={upload} disabled={uploading}>
          {uploading ? '⏳ Yükleniyor...' : 'Albüme Ekle'}
        </button>
      </div>
      <div className="card">
        <div style={{ position: 'relative', marginTop: 16, paddingLeft: 26, borderLeft: '2px solid var(--line)' }}>
          {(items ?? []).map((item: any) => (
            <div key={item?.id} style={{ position: 'relative', marginBottom: 30 }}>
              <div style={{ position: 'absolute', left: -33, top: 4, width: 12, height: 12, borderRadius: '50%', background: 'var(--bordo-lite)' }} />
              <div style={{ fontSize: '0.7rem', color: 'var(--tozpembe)', letterSpacing: 1, textTransform: 'uppercase', fontWeight: 700 }}>{item?.date}</div>
              <div style={{ marginTop: 10, width: '100%', borderRadius: 14, background: 'var(--bg2)', border: '1px solid var(--line)', overflow: 'hidden' }}>
                {item?.img && <img src={item?.img} alt={item?.desc ?? 'Anı'} style={{ width: '100%', display: 'block', objectFit: 'cover' }} />}
              </div>
              <div style={{ marginTop: 10, color: 'var(--text-dim)', fontSize: '0.88rem', display: 'flex', justifyContent: 'space-between' }}>
                <span>{item?.desc}</span>
                <span style={{ color: '#e08a8a', cursor: 'pointer' }} onClick={() => remove(ref(db, `album/${item?.id}`))}>✕</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
