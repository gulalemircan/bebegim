'use client';

import React from 'react';

const MENU_ITEMS = [
  { id: 'home', label: 'Ana Sayfa', icon: '🏠' },
  { id: 'album', label: 'Anı Albümü', icon: '📸' },
  { id: 'muzik', label: 'Ortak Müzik', icon: '🎵' },
  { id: 'harita', label: 'Aşk Haritası', icon: '📍' },
  { id: 'yapilacaklar', label: 'Yapılacaklar', icon: '✅' },
  { id: 'watchlist', label: 'İzlenecekler', icon: '🎬' },
  { id: 'dolap', label: 'Prensesin Dolabı', icon: '👗' },
  { id: 'wordle', label: 'Wordle', icon: '🧩' },
  { id: 'tabu', label: 'Aşk Tabusu', icon: '🃏' },
  { id: 'isim-sehir', label: 'İsim Şehir', icon: '✍️' },
  { id: 'hafiza', label: 'Renk Hafıza', icon: '🧠' },
];

export default function Sidebar({ activeTab, setActiveTab }: any) {
  return (
    <nav className="sidebar">
      <div className="sidebar-logo">E💖E</div>
      <div className="sidebar-menu">
        {MENU_ITEMS.map(item => (
          <button 
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={`menu-item ${activeTab === item.id ? 'active' : ''}`}
          >
            <span className="icon">{item.icon}</span>
            <span className="label">{item.label}</span>
          </button>
        ))}
      </div>
    </nav>
  );
}
