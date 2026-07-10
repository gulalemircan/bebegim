'use client';

import React, { useState, useEffect, useCallback } from 'react';
import LoginScreen from './login-screen';
import Sidebar from './sidebar';
import HomePage from './home-page';
import AniAlbumu from './ani-albumu';
import OrtakMuzik from './ortak-muzik';
import Watchlist from './watchlist';
import Yapilacaklar from './yapilacaklar';
import Harita from './harita';
import PrensesinDolabi from './prensesin-dolabi';
import RenkHafiza from './renk-hafiza';
import AskTabusu from './ask-tabusu';
import OzelWordle from './ozel-wordle';
import IsimSehir from './isim-sehir';
import Satranc from './satranc';
import Dama from './dama';
import Tavla from './tavla';
import AmiralBatti from './amiral-batti';
import ChatWidget from './chat-widget';
import CrisisButton from './crisis-button';
import { sfx } from '@/lib/sounds';

export type PageId = 'anasayfa' | 'anilar' | 'muzik' | 'watchlist' | 'bucketlist' | 'harita' | 'dolap' |
  'oyun' | 'tabu' | 'wordle' | 'isimsehir' | 'satranc' | 'dama' | 'tavla' | 'amiral';

export default function AppShell() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [playerName, setPlayerName] = useState('');
  const [currentPage, setCurrentPage] = useState<PageId>('anasayfa');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [animating, setAnimating] = useState(false);

  useEffect(() => {
    // localStorage kullan - sekme kapanınca çıkış yapılmasın
    const logged = localStorage?.getItem?.('isLoggedIn');
    const name = localStorage?.getItem?.('playerName');
    if (logged === 'true' && name) {
      setIsLoggedIn(true);
      setPlayerName(name);
    }
    const savedTheme = localStorage?.getItem?.('ee_theme');
    if (savedTheme && savedTheme !== 'default') {
      document.body.className = savedTheme;
    }
  }, []);

  const handleLogin = useCallback((name: string) => {
    localStorage?.setItem?.('isLoggedIn', 'true');
    localStorage?.setItem?.('playerName', name);
    setPlayerName(name);
    setIsLoggedIn(true);
  }, []);

  const navigateTo = useCallback((page: PageId) => {
    sfx.navigate();
    setAnimating(true);
    setTimeout(() => {
      setCurrentPage(page);
      setAnimating(false);
      window?.scrollTo?.({ top: 0, behavior: 'smooth' });
    }, 150);
  }, []);

  if (!isLoggedIn) {
    return <LoginScreen onLogin={handleLogin} />;
  }

  const renderPage = () => {
    switch (currentPage) {
      case 'anasayfa': return <HomePage playerName={playerName} onNavigate={navigateTo} />;
      case 'anilar': return <AniAlbumu playerName={playerName} />;
      case 'muzik': return <OrtakMuzik playerName={playerName} />;
      case 'watchlist': return <Watchlist playerName={playerName} />;
      case 'bucketlist': return <Yapilacaklar playerName={playerName} />;
      case 'harita': return <Harita />;
      case 'dolap': return <PrensesinDolabi />;
      case 'oyun': return <RenkHafiza playerName={playerName} />;
      case 'tabu': return <AskTabusu playerName={playerName} />;
      case 'wordle': return <OzelWordle playerName={playerName} />;
      case 'isimsehir': return <IsimSehir playerName={playerName} />;
      case 'satranc': return <Satranc playerName={playerName} />;
      case 'dama': return <Dama playerName={playerName} />;
      case 'tavla': return <Tavla playerName={playerName} />;
      case 'amiral': return <AmiralBatti playerName={playerName} />;
      default: return <HomePage playerName={playerName} onNavigate={navigateTo} />;
    }
  };

  return (
    <>
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <header style={{
        position: 'sticky', top: 0, zIndex: 50,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '16px 22px',
        background: 'linear-gradient(to bottom, rgba(24,15,13,0.97), rgba(24,15,13,0.85))',
        borderBottom: '1px solid var(--line)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 15 }}>
          <button onClick={() => { setSidebarOpen(true); sfx.click(); }}
            style={{ background: 'none', border: 'none', color: 'var(--beyaz)', fontSize: '1.6rem', cursor: 'pointer', padding: 0 }}>
            ☰
          </button>
          <button onClick={() => navigateTo('anasayfa')}
            style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontFamily: "'Fraunces', serif", fontSize: '1.15rem', fontWeight: 700, color: 'var(--beyaz)', background: 'none', border: 'none' }}>
            <span style={{ color: 'var(--yesil-lite)' }}>E</span>&<span style={{ color: 'var(--bordo-lite)' }}>E</span>
          </button>
        </div>
        {currentPage !== 'anasayfa' && (
          <button onClick={() => navigateTo('anasayfa')}
            className="btn-ghost" style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.82rem', padding: '8px 16px' }}>
            ← Ana sayfa
          </button>
        )}
      </header>

      <main style={{ maxWidth: 900, margin: '0 auto', padding: '34px 20px 90px' }}>
        <div style={{
          animation: animating ? 'none' : 'fadein 0.45s ease',
          opacity: animating ? 0 : 1,
          transition: 'opacity 0.15s'
        }}>
          {renderPage()}
        </div>
      </main>

      <ChatWidget playerName={playerName} />
      <CrisisButton />
    </>
  );
}
