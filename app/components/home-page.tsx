'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { db } from '@/lib/firebase';
import { ref, onValue, set } from 'firebase/database';
import { sendNotification } from '@/lib/notifications';
import type { PageId } from './app-shell';

interface HomePageProps {
  playerName: string;
  onNavigate: (page: PageId) => void;
}

const moodOptions = [
  'Prenses gibiyim 👑',
  'Kocama sinirliyim 😤',
  'Sana ihtiyacım var 🥺',
  'Enerji doluyum ✨',
  'Çok yorgunum 😴',
];

const romanticCorners: { id: PageId; icon: string; label: string; color: string }[] = [
  { id: 'anilar', icon: '📷', label: 'Anı Albümü', color: 'var(--kahve)' },
  { id: 'muzik', icon: '🎵', label: 'Ortak Müzik (Spotify)', color: 'var(--yesil)' },
  { id: 'harita', icon: '🗺️', label: 'Planlarımız (Harita)', color: 'var(--mavi)' },
  { id: 'dolap', icon: '👗', label: 'Prensesin Dolabı', color: 'var(--tozpembe)' },
  { id: 'watchlist', icon: '🍿', label: 'İzleme Listesi', color: 'var(--bordo)' },
  { id: 'bucketlist', icon: '🎯', label: 'Yapılacaklar Listesi', color: 'var(--yesil-lite)' },
];

const games: { id: PageId; icon: string; label: string; color: string }[] = [
  { id: 'oyun', icon: '🎨', label: 'Renk Hafıza', color: 'var(--yesil)' },
  { id: 'tabu', icon: '🙊', label: 'Aşk Tabusu (Online)', color: 'var(--tozpembe)' },
  { id: 'wordle', icon: '🟩', label: 'Özel Wordle (Online)', color: 'var(--mavi)' },
  { id: 'isimsehir', icon: '📝', label: 'İsim Şehir (Online)', color: 'var(--kahve)' },
];

function pad(n: number): string { return n?.toString?.()?.padStart?.(2, '0') ?? '00'; }

function getNextMonthly(baseDate: Date, now: Date) {
  const nextMonth = new Date(now.getFullYear(), now.getMonth(), baseDate.getDate());
  if (now > nextMonth) nextMonth.setMonth(nextMonth.getMonth() + 1);
  const diffDays = Math.ceil((nextMonth.getTime() - now.getTime()) / 86400000);
  const monthCount = (nextMonth.getFullYear() - baseDate.getFullYear()) * 12 + (nextMonth.getMonth() - baseDate.getMonth());
  return { daysLeft: diffDays, monthCount };
}

export default function HomePage({ playerName, onNavigate }: HomePageProps) {
  const [mood, setMood] = useState('Belirlenmedi');
  const [showMoodModal, setShowMoodModal] = useState(false);
  const [counter, setCounter] = useState({ days: 0, hours: '00', mins: '00', secs: '00' });
  const [meetInfo, setMeetInfo] = useState({ monthNum: 0, daysLeft: '' });
  const [relInfo, setRelInfo] = useState({ monthNum: 0, daysLeft: '' });

  const startDate = new Date(2025, 11, 13, 0, 0, 0); 
  const meetDate = new Date(2025, 10, 7, 0, 0, 0);

  const vibrate = (ms = 30) => {
    if (typeof window !== 'undefined' && window.navigator.vibrate) {
      window.navigator.vibrate(ms);
    }
  };

  useEffect(() => {
    const moodRef = ref(db, 'mood/current');
    const unsub = onValue(moodRef, (snap: any) => {
      setMood(snap?.val?.() ?? 'Belirlenmedi');
    });
    return () => unsub?.();
  }, []);

  useEffect(() => {
    const updateCounter = () => {
      const now = new Date();
      let diff = Math.max(0, now.getTime() - startDate.getTime());
      
      setCounter({
        days: Math.floor(diff / 86400000),
        hours: pad(Math.floor((diff % 86400000) / 3600000)),
        mins: pad(Math.floor((diff % 3600000) / 60000)),
        secs: pad(Math.floor((diff % 60000) / 1000)),
      });

      const meetData = getNextMonthly(meetDate, now);
      setMeetInfo({
        monthNum: meetData.monthCount,
        daysLeft: meetData.daysLeft === 0 ? 'Bugün! 🎉' : `${meetData.daysLeft} gün kaldı`,
      });

      const relData = getNextMonthly(startDate, now);
      setRelInfo({
        monthNum: relData.monthCount,
        daysLeft: relData.daysLeft === 0 ? 'Bugün! ♡' : `${relData.daysLeft} gün kaldı`,
      });
    };
    updateCounter();
    const interval = setInterval(updateCounter, 1000);
    return () => clearInterval(interval);
  }, [startDate, meetDate]);

  const handleSetMood = useCallback((moodText: string) => {
    vibrate(40);
    set(ref(db, 'mood/current'), moodText);
    // Bildirim gönder: ruh hali değişti
    sendNotification({
      type: 'mood',
      title: 'Ruh Hali Değişti',
      body: `${playerName}: ${moodText}`,
      sender: playerName,
    });
    setShowMoodModal(false);
  }, [playerName]);

  const handleNavigate = (id: PageId) => {
    vibrate(30);
    onNavigate(id);
  };

  return (
    <>
      <div className="eyebrow">Emircan & Efsun</div>

      <div className="card" style={{ marginTop: 10, borderColor: 'var(--tozpembe)', textAlign: 'center', padding: 15 }}>
        <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', textTransform: 'uppercase' }}>Şu Anki Ruh Hali</div>
        <div style={{ fontSize: '1.4rem', margin: '10px 0', fontFamily: "'Fraunces', serif", color: 'var(--beyaz)' }}>{mood}</div>
        <button className="btn-ghost" style={{ margin: '0 auto', fontSize: '0.75rem', padding: '6px 16px' }}
          onClick={() => { vibrate(30); setShowMoodModal(true); }}>Ruh Halini Değiştir</button>
      </div>

      <h1 className="section-title">Birlikte geçen zaman</h1>
      <div className="card">
        <div className="counter-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, margin: '10px 0 20px' }}>
          {[
            { num: counter.days, label: 'Gün' },
            { num: counter.hours, label: 'Saat' },
            { num: counter.mins, label: 'Dakika' },
            { num: counter.secs, label: 'Saniye' },
          ].map((c: any) => (
            <div key={c?.label} style={{ textAlign: 'center', background: 'var(--bg2)', borderRadius: 14, padding: '16px 6px', border: '1px solid var(--line)' }}>
              <div style={{ fontFamily: "'Fraunces', serif", fontSize: '1.9rem', color: 'var(--tozpembe)' }}>{c?.num}</div>
              <div style={{ fontSize: '0.65rem', color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '1.4px', marginTop: 4 }}>{c?.label}</div>
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '9px 0', borderBottom: '1px dashed var(--line)', fontSize: '0.9rem', color: 'var(--text-dim)' }}>
          <span>Tanıştığımız gün</span><b style={{ color: 'var(--beyaz)' }}>07 Kasım 2025</b>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '9px 0', borderBottom: '1px dashed var(--line)', fontSize: '0.9rem', color: 'var(--text-dim)' }}>
          <span>Tanışmamızın {meetInfo.monthNum}. ayına</span><b style={{ color: 'var(--beyaz)' }}>{meetInfo.daysLeft}</b>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '9px 0', fontSize: '0.9rem', color: 'var(--text-dim)' }}>
          <span>Sevgili olmamızın {relInfo.monthNum}. ayına</span><b style={{ color: 'var(--beyaz)' }}>{relInfo.daysLeft}</b>
        </div>
      </div>

      <h2 style={{ margin: '34px 0 16px', fontSize: '1.2rem', color: 'var(--beyaz)' }}>Romantik Köşeler & Planlar</h2>
      <div className="menu-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 14 }}>
        {romanticCorners.map((item: any) => (
          <button key={item?.id} onClick={() => handleNavigate(item.id)} style={{
            background: 'var(--bg2)', border: '1px solid var(--line)', borderLeft: `4px solid ${item?.color}`,
            borderRadius: 14, padding: '16px 12px', cursor: 'pointer', textAlign: 'left',
            transition: 'transform .15s ease, border-color .15s ease', color: 'var(--beyaz)'
          }}>
            <span style={{ fontSize: '1.5rem', marginBottom: 8, display: 'block' }}>{item?.icon}</span>
            <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>{item?.label}</span>
          </button>
        ))}
      </div>

      <h2 style={{ margin: '34px 0 16px', fontSize: '1.2rem', color: 'var(--beyaz)' }}>Oyun Odası & Kapışma</h2>
      <div className="menu-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 14 }}>
        {games.map((item: any) => (
          <button key={item?.id} onClick={() => handleNavigate(item.id)} style={{
            background: 'var(--bg2)', border: '1px solid var(--line)', borderLeft: `4px solid ${item?.color}`,
            borderRadius: 14, padding: '16px 12px', cursor: 'pointer', textAlign: 'left',
            transition: 'transform .15s ease, border-color .15s ease', color: 'var(--beyaz)'
          }}>
            <span style={{ fontSize: '1.5rem', marginBottom: 8, display: 'block' }}>{item?.icon}</span>
            <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>{item?.label}</span>
          </button>
        ))}
      </div>

      {showMoodModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(10,6,5,0.75)', zIndex: 150, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div style={{ background: 'var(--bg2)', border: '1px solid var(--line)', borderRadius: 16, padding: 22, width: '100%', maxWidth: 400, textAlign: 'center' }}>
            <h3 style={{ color: 'var(--tozpembe)', marginTop: 0, fontFamily: "'Fraunces', serif" }}>Şu an nasılsın?</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 15 }}>
              {moodOptions.map((m: string) => (
                <button key={m} className="btn-ghost" onClick={() => handleSetMood(m)}>{m}</button>
              ))}
            </div>
            <button className="btn-action" style={{ marginTop: 15, width: '100%' }} onClick={() => { vibrate(20); setShowMoodModal(false); }}>Kapat</button>
          </div>
        </div>
      )}
    </>
  );
}
