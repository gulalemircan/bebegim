'use client';

import React, { useState, useRef, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { ref, push } from 'firebase/database';
import { sendNotification } from '@/lib/notifications';

export default function CrisisButton() {
  const [showModal, setShowModal] = useState(false);
  const alarmRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const audio = new Audio('/alarm.mp3');
    audio.loop = true;
    alarmRef.current = audio;
  }, []);

  const open = () => {
    setShowModal(true);
    alarmRef?.current?.play?.()?.catch?.(() => {});
    // Bildirim gönder: sevgilinin yardıma ihtiyacı var
    sendNotification({
      type: 'emergency',
      title: '🚨 Alarm!',
      body: 'Sevgilin yardıma ihtiyacı var!',
      sender: 'system',
    });
    // Ayrıca firebase'e alarm kaydı
    push(ref(db, 'alarms'), {
      active: true,
      timestamp: Date.now(),
    });
  };

  const close = () => {
    setShowModal(false);
    if (alarmRef?.current) {
      alarmRef.current.pause();
      alarmRef.current.currentTime = 0;
    }
  };

  return (
    <>
      <div onClick={open} style={{
        position: 'fixed', bottom: 25, left: 25, width: 60, height: 60,
        background: 'var(--bordo)', borderRadius: '50%', display: 'flex',
        alignItems: 'center', justifyContent: 'center', fontSize: '1.8rem',
        cursor: 'pointer', zIndex: 1000, boxShadow: '0 4px 15px rgba(0,0,0,0.6)',
        border: '2px solid var(--tozpembe)'
      }}>
        🚨
      </div>

      {showModal && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(10,6,5,0.75)', zIndex: 150,
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20
        }}>
          <div style={{
            background: 'var(--panel)', border: '2px solid var(--bordo)',
            borderRadius: 16, padding: 22, textAlign: 'center', maxWidth: 400, width: '100%'
          }}>
            <h2 style={{ color: 'var(--tozpembe)', fontFamily: "'Fraunces', serif" }}>Derin bir nefes al...</h2>
            <p style={{ fontSize: '1.1rem', lineHeight: 1.6, color: 'var(--beyaz)', margin: '20px 0' }}>
              Hemen kafanı boşaltıyorsun ve kocanı arıyorsun eğer arayamazsan da önemli değil ben zaten yanındayım sevgilim.
            </p>
            <button className="btn-action" style={{ background: 'var(--tozpembe)', color: 'var(--bg)' }} onClick={close}>Kapat</button>
          </div>
        </div>
      )}
    </>
  );
}
