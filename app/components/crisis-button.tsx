'use client';

import React, { useState } from 'react';
import { sendNotification } from '@/lib/notifications';
import { sfx } from '@/lib/sounds';

interface Props {
  playerName: string;
}

export default function CrisisButton({ playerName }: Props) {
  const [active, setActive] = useState(false);

  const handleCrisis = async () => {
    setActive(true);
    // error() mevcut olmadığı için click() veya success() kullanıyoruz
    sfx.click();

    await sendNotification({
      type: 'emergency',
      title: '🧨 ACİL DURUM!',
      body: `${playerName} şu an senin yardımına/desteğine ihtiyaç duyuyor! Hemen iletişime geç.`,
      sender: playerName
    });

    setTimeout(() => setActive(false), 5000);
  };

  return (
    <div style={{ position: 'fixed', bottom: 20, left: 20, zIndex: 1000 }}>
      <button 
        onClick={handleCrisis}
        disabled={active}
        style={{ 
          width: 60, 
          height: 60, 
          borderRadius: '50%', 
          background: active ? '#ff0000' : 'rgba(255,0,0,0.3)', 
          border: '2px solid #ff0000',
          color: 'white',
          fontSize: '1.5rem',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: active ? '0 0 30px #ff0000' : 'none',
          transition: 'all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
          animation: active ? 'pulse 0.5s infinite' : 'none',
          backdropFilter: 'blur(5px)'
        }}
      >
        🆘
      </button>

      <style jsx>{`
        @keyframes pulse {
          0% { transform: scale(1); }
          50% { transform: scale(1.2); }
          100% { transform: scale(1); }
        }
      `}</style>
    </div>
  );
}
