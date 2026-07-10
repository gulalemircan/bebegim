'use client';

import React, { useState, useEffect, useRef } from 'react';
import { db } from '@/lib/firebase';
import { ref, onValue, set } from 'firebase/database';
import { sfx } from '@/lib/sounds';

interface Props { playerName: string; }

const categories = ['İsim', 'Şehir', 'Hayvan', 'Bitki', 'Eşya', 'Meslek', 'Dizi/Film', 'Ünlü', 'Yemek', 'Kurgusal K.'];

export default function IsimSehir({ playerName }: Props) {
  const [gameState, setGameState] = useState<any>(null);
  const [timeLeft, setTimeLeft] = useState(0);
  const [answers, setAnswers] = useState<string[]>(Array(10).fill(''));
  const [timeSel, setTimeSel] = useState('60');
  const [forbidden, setForbidden] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const timerRef = useRef<any>(null);

  useEffect(() => {
    const unsub = onValue(ref(db, 'isimsehir'), (snap: any) => {
      setGameState(snap?.val?.() ?? null);
    });
    return () => { unsub?.(); clearInterval(timerRef.current); };
  }, []);

  useEffect(() => {
    clearInterval(timerRef.current);
    if (gameState?.status === 'playing') {
      setSubmitted(false);
      setAnswers(Array(10).fill(''));
      timerRef.current = setInterval(() => {
        const left = Math.max(0, Math.floor(((gameState?.endTime ?? 0) - Date.now()) / 1000));
        setTimeLeft(left);
        if (left <= 0) {
          clearInterval(timerRef.current);
          submitAnswers();
        }
      }, 1000);
    }
  }, [gameState?.status, gameState?.endTime]);

  const start = () => {
    const f = (forbidden ?? '').toUpperCase().split('');
    let letters = 'ABÇÇDEFGHKLMNPRSŞTUYZ'.split('').filter((l: string) => !f.includes(l));
    if (letters.length === 0) letters = ['A'];
    const l = letters[Math.floor(Math.random() * letters.length)] ?? 'A';
    const t = parseInt(timeSel);
    set(ref(db, 'isimsehir'), { status: 'playing', letter: l, endTime: Date.now() + (t * 1000), ans: {} });
    sfx.success();
  };

  const submitAnswers = () => {
    if (submitted) return;
    setSubmitted(true);
    clearInterval(timerRef.current);
    const arr = answers.map((a: string) => a || '-');
    set(ref(db, `isimsehir/ans/${playerName}`), arr);
    // Check if both answered
    setTimeout(() => {
      onValue(ref(db, 'isimsehir/ans'), (s: any) => {
        const val = s?.val?.();
        if (val?.Emircan && val?.Efsun) set(ref(db, 'isimsehir/status'), 'result');
      }, { onlyOnce: true });
    }, 500);
  };

  if (!gameState || gameState?.status === 'idle') {
    return (
      <>
        <div className="eyebrow">Kelime Dağarcığı</div>
        <h1 className="section-title">İsim Şehir (Online)</h1>
        <div style={{ background: 'var(--bg2)', border: '1px solid var(--line)', borderRadius: 16, padding: 20, textAlign: 'center' }}>
          <div style={{ background: 'var(--panel)', border: '1px dashed var(--tozpembe)', borderRadius: 12, padding: 15 }}>
            <label style={{ display: 'block', marginBottom: 4, color: 'var(--text-dim)', fontSize: '0.85rem' }}>Süre:</label>
            <select value={timeSel} onChange={(e) => setTimeSel(e?.target?.value ?? '60')} style={{ width: '100%', padding: 10, marginBottom: 10, borderRadius: 8, border: '1px solid var(--line)', background: 'var(--bg)', color: 'var(--beyaz)' }}>
              <option value="60">60 Saniye</option><option value="90">90 Saniye</option><option value="120">120 Saniye</option>
            </select>
            <label style={{ display: 'block', marginBottom: 4, color: 'var(--text-dim)', fontSize: '0.85rem' }}>Yasaklı Harfler:</label>
            <input type="text" value={forbidden} onChange={(e) => setForbidden(e?.target?.value ?? '')} placeholder="ĞÜJ"
              style={{ width: '100%', padding: 10, marginBottom: 10, borderRadius: 8, border: '1px solid var(--line)', background: 'var(--bg)', color: 'var(--beyaz)' }} />
            <button className="btn-action" onClick={start} style={{ width: '100%' }}>Rastgele Harf Çek ve Başlat</button>
          </div>
        </div>
      </>
    );
  }

  if (gameState?.status === 'result') {
    const em = gameState?.ans?.Emircan ?? Array(10).fill('-');
    const ef = gameState?.ans?.Efsun ?? Array(10).fill('-');
    return (
      <>
        <div className="eyebrow">Kelime Dağarcığı</div>
        <h1 className="section-title">İsim Şehir (Online)</h1>
        <div style={{ background: 'var(--bg2)', border: '1px solid var(--line)', borderRadius: 16, padding: 20, textAlign: 'center' }}>
          <h3 style={{ color: 'var(--tozpembe)' }}>Sonuçlar (Harf: {gameState?.letter})</h3>
          <div style={{ display: 'flex', gap: 10, marginTop: 15 }}>
            <div style={{ flex: 1, background: 'var(--bg)', padding: 10, borderRadius: 8 }}>
              <b style={{ color: 'var(--yesil-lite)' }}>Emircan</b>
              <div style={{ fontSize: '0.8rem', marginTop: 5, color: 'var(--text-dim)', lineHeight: 1.5 }}>
                {categories.map((c: string, i: number) => <div key={i}>{c}: {em?.[i] ?? '-'}</div>)}
              </div>
            </div>
            <div style={{ flex: 1, background: 'var(--bg)', padding: 10, borderRadius: 8 }}>
              <b style={{ color: 'var(--bordo-lite)' }}>Efsun</b>
              <div style={{ fontSize: '0.8rem', marginTop: 5, color: 'var(--text-dim)', lineHeight: 1.5 }}>
                {categories.map((c: string, i: number) => <div key={i}>{c}: {ef?.[i] ?? '-'}</div>)}
              </div>
            </div>
          </div>
          <button className="btn-ghost" onClick={() => set(ref(db, 'isimsehir'), { status: 'idle' })} style={{ width: '100%', marginTop: 15 }}>Lobiye Dön</button>
        </div>
      </>
    );
  }

  return (
    <>
      <div className="eyebrow">Kelime Dağarcığı</div>
      <h1 className="section-title">İsim Şehir (Online)</h1>
      <div style={{ background: 'var(--bg2)', border: '1px solid var(--line)', borderRadius: 16, padding: 20, textAlign: 'center' }}>
        <div style={{ fontSize: '4rem', color: 'var(--tozpembe)', fontFamily: "'Fraunces', serif", margin: '15px 0', border: '2px dashed var(--tozpembe)', padding: 10, borderRadius: 16, background: 'rgba(217,166,162,0.1)' }}>
          {gameState?.letter}
        </div>
        <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: 'var(--yesil-lite)', marginBottom: 15 }}>{timeLeft}</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 15 }}>
          {categories.map((cat: string, i: number) => (
            <input key={i} type="text" value={answers?.[i] ?? ''}
              onChange={(e) => {
                const newAns = [...(answers ?? [])];
                newAns[i] = e?.target?.value ?? '';
                setAnswers(newAns);
              }}
              placeholder={cat}
              style={{ padding: 12, borderRadius: 8, border: '1px solid var(--line)', background: 'var(--bg)', color: 'var(--beyaz)', width: '100%' }} />
          ))}
        </div>
        <button className="btn-action" onClick={submitAnswers} style={{ width: '100%', marginTop: 10 }}>Bitirdim Gönder</button>
      </div>
    </>
  );
}
