'use client';

import React, { useState, useEffect, useRef } from 'react';
import { db } from '@/lib/firebase';
import { ref, onValue, set } from 'firebase/database';
import { sfx } from '@/lib/sounds';

interface Props { playerName: string; }

const tabuWords: Record<string, { w: string; f: string[] }[]> = {
  "Ünlüler": [
    { w: "TARKAN", f: ["Şarkıcı", "Megastar", "Yolla", "Kış Güneşi", "Konser"] },
    { w: "KIVANÇ TATLITUĞ", f: ["Oyuncu", "Aşk-ı Memnu", "Kuzey", "Sarışın", "Mavi Göz"] },
    { w: "CEM YILMAZ", f: ["Komedyen", "Stand-up", "GORA", "Gülmek", "Sahne"] },
    { w: "SEZEN AKSU", f: ["Minik Serçe", "Şarkıcı", "İzmir", "Beste", "Pop"] },
  ],
  "Eşyalar": [
    { w: "TELEFON", f: ["Arama", "Mesaj", "Ekran", "Şarj", "Mobil"] },
    { w: "ÜTÜ", f: ["Kıyafet", "Kırışık", "Sıcak", "Buhar", "Gömlek"] },
    { w: "BİLGİSAYAR", f: ["Klavye", "Mouse", "Ekran", "İnternet", "Laptop"] },
  ],
  "Sinema": [
    { w: "TITANIC", f: ["Gemi", "Leonardo", "Buzdağı", "Batmak", "Aşk"] },
    { w: "AVATAR", f: ["Mavi", "Gezegen", "James Cameron", "Gişe", "3D"] },
    { w: "HARRY POTTER", f: ["Büyü", "Asa", "Hogwarts", "Gözlük", "Yara İzi"] },
  ],
  "Genel": [
    { w: "AŞK", f: ["Sevgi", "Kalp", "Sevgili", "Duygu", "Öpücük"] },
    { w: "EVLİLİK", f: ["Düğün", "Gelinlik", "Yüzük", "Koca", "İmza"] },
    { w: "DOĞUM GÜNÜ", f: ["Pasta", "Mum", "Hediye", "Kutlama", "Yaş"] },
  ],
};

export default function AskTabusu({ playerName }: Props) {
  const [gameState, setGameState] = useState<any>(null);
  const [timeLeft, setTimeLeft] = useState(0);
  const [explainer, setExplainer] = useState('Emircan');
  const [time, setTime] = useState('60');
  const [category, setCategory] = useState('Tümü');
  const timerRef = useRef<any>(null);

  useEffect(() => {
    const unsub = onValue(ref(db, 'tabu'), (snap: any) => {
      setGameState(snap?.val?.() ?? null);
    });
    return () => { unsub?.(); clearInterval(timerRef.current); };
  }, []);

  useEffect(() => {
    clearInterval(timerRef.current);
    if (gameState?.status === 'playing') {
      timerRef.current = setInterval(() => {
        const left = Math.max(0, Math.floor(((gameState?.endTime ?? 0) - Date.now()) / 1000));
        setTimeLeft(left);
        if (left <= 0) {
          clearInterval(timerRef.current);
          if (playerName === gameState?.explainer) set(ref(db, 'tabu/status'), 'idle');
        }
      }, 1000);
    }
  }, [gameState?.status, gameState?.endTime]);

  const start = () => {
    let words: any[] = [];
    if (category === 'Tümü') {
      Object.values(tabuWords).forEach((arr: any) => { words = [...words, ...(arr ?? [])]; });
    } else {
      words = tabuWords?.[category] ?? tabuWords?.['Genel'] ?? [];
    }
    words = [...words].sort(() => Math.random() - 0.5);
    set(ref(db, 'tabu'), { status: 'playing', explainer, endTime: Date.now() + (parseInt(time) * 1000), wordIndex: 0, words });
    sfx.success();
  };

  const nextWord = () => {
    const idx = (gameState?.wordIndex ?? 0) + 1;
    if (idx >= (gameState?.words?.length ?? 0)) {
      set(ref(db, 'tabu/status'), 'idle');
      alert('Kategorideki kelimeler bitti!');
    } else {
      set(ref(db, 'tabu/wordIndex'), idx);
      sfx.click();
    }
  };

  if (!gameState || gameState?.status === 'idle' || gameState?.status !== 'playing') {
    return (
      <>
        <div className="eyebrow">Online Eğlence</div>
        <h1 className="section-title">Aşk Tabusu</h1>
        <div style={{ background: 'var(--bg2)', border: '1px solid var(--line)', borderRadius: 16, padding: 20, textAlign: 'center' }}>
          <div style={{ background: 'var(--panel)', border: '1px dashed var(--tozpembe)', borderRadius: 12, padding: 15, marginBottom: 20 }}>
            <label style={{ display: 'block', marginBottom: 4, color: 'var(--text-dim)', fontSize: '0.85rem' }}>Kimin Sırası (Anlatan):</label>
            <select value={explainer} onChange={(e) => setExplainer(e?.target?.value ?? 'Emircan')} style={{ width: '100%', padding: 10, marginBottom: 10, borderRadius: 8, border: '1px solid var(--line)', background: 'var(--bg)', color: 'var(--beyaz)' }}>
              <option value="Emircan">Emircan</option><option value="Efsun">Efsun</option>
            </select>
            <label style={{ display: 'block', marginBottom: 4, color: 'var(--text-dim)', fontSize: '0.85rem' }}>Süre:</label>
            <select value={time} onChange={(e) => setTime(e?.target?.value ?? '60')} style={{ width: '100%', padding: 10, marginBottom: 10, borderRadius: 8, border: '1px solid var(--line)', background: 'var(--bg)', color: 'var(--beyaz)' }}>
              <option value="60">60 Saniye</option><option value="90">90 Saniye</option><option value="120">120 Saniye</option>
            </select>
            <label style={{ display: 'block', marginBottom: 4, color: 'var(--text-dim)', fontSize: '0.85rem' }}>Kategori:</label>
            <select value={category} onChange={(e) => setCategory(e?.target?.value ?? 'Tümü')} style={{ width: '100%', padding: 10, marginBottom: 10, borderRadius: 8, border: '1px solid var(--line)', background: 'var(--bg)', color: 'var(--beyaz)' }}>
              <option value="Tümü">Tüm Kategoriler</option><option value="Ünlüler">Ünlüler</option><option value="Eşyalar">Eşyalar</option><option value="Sinema">Dizi/Sinema</option><option value="Genel">Genel</option>
            </select>
            <button className="btn-action" onClick={start} style={{ width: '100%', marginTop: 10 }}>Oyunu Başlat</button>
          </div>
        </div>
      </>
    );
  }

  const currentWord = gameState?.words?.[gameState?.wordIndex ?? 0];
  const isExplainer = playerName === gameState?.explainer;

  return (
    <>
      <div className="eyebrow">Online Eğlence</div>
      <h1 className="section-title">Aşk Tabusu</h1>
      <div style={{ background: 'var(--bg2)', border: '1px solid var(--line)', borderRadius: 16, padding: 20, textAlign: 'center' }}>
        <div style={{ fontSize: '3rem', fontFamily: "'Fraunces', serif", color: 'var(--tozpembe)', margin: '15px 0' }}>{timeLeft}</div>
        {isExplainer ? (
          <>
            <div style={{ borderRadius: 16, padding: 20, border: '2px solid var(--tozpembe)', background: 'var(--tozpembe)', color: 'var(--bg)', marginBottom: 20 }}>
              <h2 style={{ fontSize: '2rem', margin: 0, fontFamily: "'Fraunces', serif", borderBottom: '2px dashed var(--bg)', paddingBottom: 10, width: '100%' }}>{currentWord?.w ?? 'KELİME'}</h2>
              <ul style={{ listStyle: 'none', padding: 0, marginTop: 15, fontSize: '1.2rem', fontWeight: 'bold', color: '#7d2438' }}>
                {(currentWord?.f ?? []).map((f: string, i: number) => <li key={i} style={{ marginBottom: 8 }}>{f}</li>)}
              </ul>
            </div>
            <button className="btn-action" onClick={nextWord} style={{ width: '100%', marginBottom: 10, background: 'var(--yesil)' }}>Doğru (Sıradaki)</button>
            <button className="btn-ghost" onClick={nextWord} style={{ width: '100%' }}>Pas Geç</button>
          </>
        ) : (
          <div style={{ background: 'var(--bg)', border: '1px solid var(--line)', padding: '40px 20px', borderRadius: 16, fontSize: '1.2rem', color: 'var(--yesil-lite)', fontWeight: 'bold' }}>
            {gameState?.explainer} anlatıyor...<br /><br />Tahmin etmeye çalış!
          </div>
        )}
        <button className="btn-ghost" onClick={() => set(ref(db, 'tabu/status'), 'idle')} style={{ marginTop: 20, width: '100%', borderColor: '#e08a8a', color: '#e08a8a' }}>Oyunu Bitir</button>
      </div>
    </>
  );
}
