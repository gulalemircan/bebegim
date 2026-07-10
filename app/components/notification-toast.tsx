'use client';

import React, { useState, useEffect } from 'react';
import { listenNotifications, markRead } from '@/lib/notifications';
import { sfx } from '@/lib/sounds';

interface Props { playerName: string; }

export default function NotificationToast({ playerName }: Props) {
  const [toasts, setToasts] = useState<{ id: string; title: string; body: string }[]>([]);

  useEffect(() => {
    const unsub = listenNotifications(playerName, (notif) => {
      setToasts((prev) => [...prev, { id: notif.id, title: notif.title, body: notif.body }]);
      sfx.success();
      markRead(notif.id);
      
      // 5 saniye sonra kaldır
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== notif.id));
      }, 5000);
    });
    return () => unsub?.();
  }, [playerName]);

  if (toasts.length === 0) return null;

  return (
    <div style={{ position: 'fixed', top: 20, right: 20, zIndex: 9999, display: 'flex', flexDirection: 'column', gap: 10 }}>
      {toasts.map((toast) => (
        <div key={toast.id} style={{
          background: 'var(--panel)', border: '1px solid var(--tozpembe)', borderRadius: 12,
          padding: '12px 16px', maxWidth: 300, boxShadow: '0 4px 20px rgba(0,0,0,0.6)',
          animation: 'slideIn 0.3s ease',
        }}>
          <div style={{ fontWeight: 700, color: 'var(--tozpembe)', fontSize: '0.9rem', marginBottom: 4 }}>{toast.title}</div>
          <div style={{ fontSize: '0.85rem', color: 'var(--beyaz)' }}>{toast.body}</div>
        </div>
      ))}
    </div>
  );
}
