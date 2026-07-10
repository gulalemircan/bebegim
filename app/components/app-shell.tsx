'use client';

import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';

const Sidebar = dynamic(() => import('./sidebar'), { ssr: false });
const HomePage = dynamic(() => import('./home-page'), { ssr: false });
const AniAlbumu = dynamic(() => import('./ani-albumu'), { ssr: false });
const OrtakMuzik = dynamic(() => import('./ortak-muzik'), { ssr: false });
const PrensesinDolabi = dynamic(() => import('./prensesin-dolabi'), { ssr: false });
const Yapilacaklar = dynamic(() => import('./yapilacaklar'), { ssr: false });
const Watchlist = dynamic(() => import('./watchlist'), { ssr: false });
const OzelWordle = dynamic(() => import('./ozel-wordle'), { ssr: false });
const AskTabusu = dynamic(() => import('./ask-tabusu'), { ssr: false });
const IsimSehir = dynamic(() => import('./isim-sehir'), { ssr: false });
const RenkHafiza = dynamic(() => import('./renk-hafiza'), { ssr: false });
const Harita = dynamic(() => import('./harita'), { ssr: false });
const CrisisButton = dynamic(() => import('./crisis-button'), { ssr: false });
const ChatWidget = dynamic(() => import('./chat-widget'), { ssr: false });

export default function AppShell() {
  const [activeTab, setActiveTab] = useState('home');
  const [playerName, setPlayerName] = useState<string>('');

  useEffect(() => {
    const stored = localStorage.getItem('ee_player_name');
    if (stored) {
      setPlayerName(stored);
    } else {
      const name = prompt("Lütfen ismini gir (Efsun/Emircan):");
      if (name) {
        localStorage.setItem('ee_player_name', name);
        setPlayerName(name);
      }
    }
  }, []);

  const renderContent = () => {
    switch (activeTab) {
      case 'home': 
        return <HomePage setActiveTab={setActiveTab} />;
      case 'album': 
        return <AniAlbumu playerName={playerName} />;
      case 'muzik': 
        return <OrtakMuzik playerName={playerName} />;
      case 'dolap': 
        return <PrensesinDolabi playerName={playerName} />;
      case 'yapilacaklar': 
        return <Yapilacaklar playerName={playerName} />;
      case 'watchlist': 
        return <Watchlist playerName={playerName} />;
      case 'wordle': 
        return <OzelWordle playerName={playerName} />;
      case 'tabu': 
        return <AskTabusu playerName={playerName} />;
      case 'isim-sehir': 
        return <IsimSehir playerName={playerName} />;
      case 'hafiza': 
        return <RenkHafiza playerName={playerName} />;
      case 'harita': 
        return <Harita playerName={playerName} />;
      default: 
        return <HomePage setActiveTab={setActiveTab} />;
    }
  };

  return (
    <div className="app-container">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
      <div className="main-content">
        {renderContent()}
      </div>
      <ChatWidget playerName={playerName} />
      <CrisisButton playerName={playerName} />
    </div>
  );
}
