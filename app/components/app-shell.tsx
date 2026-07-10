'use client';

import React, { useState, useEffect } from 'react';
import Sidebar from './sidebar';
import HomePage from './home-page';
import AniAlbumu from './ani-albumu';
import OrtakMuzik from './ortak-muzik';
import PrensesinDolabi from './prensesin-dolabi';
import Yapilacaklar from './yapilacaklar';
import Watchlist from './watchlist';
import OzelWordle from './ozel-wordle';
import AskTabusu from './ask-tabusu';
import IsimSehir from './isim-sehir';
import RenkHafiza from './renk-hafiza';
import Harita from './harita';
import CrisisButton from './crisis-button';
import ChatWidget from './chat-widget';

export default function AppShell() {
  const [activeTab, setActiveTab] = useState('home');
  const [playerName, setPlayerName] = useState<string>('');

  useEffect(() => {
    const stored = localStorage.getItem('ee_player_name');
    if (stored) setPlayerName(stored);
    else {
      const name = prompt("Lütfen ismini gir (Efsun/Emircan):");
      if (name) {
        localStorage.setItem('ee_player_name', name);
        setPlayerName(name);
      }
    }
  }, []);

  const renderContent = () => {
    switch (activeTab) {
      case 'home': return <HomePage setActiveTab={setActiveTab} />;
      case 'album': return <AniAlbumu playerName={playerName} />;
      case 'muzik': return <OrtakMuzik />;
      case 'dolap': return <PrensesinDolabi />;
      case 'yapilacaklar': return <Yapilacaklar />;
      case 'watchlist': return <Watchlist />;
      case 'wordle': return <OzelWordle playerName={playerName} />;
      case 'tabu': return <AskTabusu />;
      case 'isim-sehir': return <IsimSehir playerName={playerName} />;
      case 'hafiza': return <RenkHafiza />;
      case 'harita': return <Harita playerName={playerName} />;
      default: return <HomePage setActiveTab={setActiveTab} />;
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
