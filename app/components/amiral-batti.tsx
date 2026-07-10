'use client';

import React, { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { ref, onValue, set, update } from 'firebase/database';
import { sfx } from '@/lib/sounds';

interface Props { playerName: string; }

// Gemi boyutları: toplam 14 hücre
const SHIP_SIZES = [5, 4, 3, 2];
const TOTAL_SHIP_CELLS = SHIP_SIZES.reduce((a, b) => a + b, 0); // 14

const opponent = (name: string) => name === 'Emircan' ? 'Efsun' : 'Emircan';

export default function AmiralBatti({ playerName }: Props) {
  const [gameData, setGameData] = useState<any>(null);
  const [showLobby, setShowLobby] = useState(true);
  const [showRules, setShowRules] = useState(false);
  const opp = opponent(playerName);

  useEffect(() => {
    const unsub = onValue(ref(db, 'board-amiral'), (snap: any) => {
      const d = snap?.val?.();
      if (d?.status) { setGameData(d); setShowLobby(false); }
    });
    return () => unsub?.();
  }, []);

  const startGame = () => {
    const emptyBoard = Array(100).fill(false);
    set(ref(db, 'board-amiral'), {
      status: 'placing',
      turn: 'Emircan',
      winner: '',
      Emircan: { ships: emptyBoard, shots: emptyBoard, ready: false },
      Efsun: { ships: emptyBoard, shots: emptyBoard, ready: false },
    });
    sfx.success();
  };

  // --- GEMİ YERLEŞTİRME ---
  const myShips: boolean[] = gameData?.[playerName]?.ships ?? Array(100).fill(false);
  const myShipCount = myShips.filter(Boolean).length;
  const myReady: boolean = gameData?.[playerName]?.ready ?? false;

  const toggleShip = (i: number) => {
    if (myReady || gameData?.status !== 'placing') return;
    const newShips = [...myShips];
    if (newShips[i]) {
      newShips[i] = false;
    } else {
      if (myShipCount >= TOTAL_SHIP_CELLS) return; // limit doldu
      newShips[i] = true;
    }
    set(ref(db, `board-amiral/${playerName}/ships`), newShips);
  };

  const markReady = () => {
    if (myShipCount !== TOTAL_SHIP_CELLS) {
      alert(`${TOTAL_SHIP_CELLS} hücre seçmen gerekiyor! (Şu an: ${myShipCount})`);
      return;
    }
    set(ref(db, `board-amiral/${playerName}/ready`), true);
    sfx.success();
    // İkisi de hazırsa oyunu başlat
    const otherReady = gameData?.[opp]?.ready ?? false;
    if (otherReady) {
      set(ref(db, 'board-amiral/status'), 'playing');
    }
  };

  // --- ATEŞ ETME ---
  const myShots: boolean[] = gameData?.[playerName]?.shots ?? Array(100).fill(false);
  const oppShips: boolean[] = gameData?.[opp]?.ships ?? Array(100).fill(false);
  const oppShots: boolean[] = gameData?.[opp]?.shots ?? Array(100).fill(false); // rakibin benim tahtama attıkları

  const fireAt = (i: number) => {
    if (gameData?.status !== 'playing') return;
    if (gameData?.turn !== playerName) return;
    if (myShots[i]) return; // zaten atıldı

    const newShots = [...myShots];
    newShots[i] = true;
    sfx.piece();

    // İsabet sayısını hesapla
    const hits = newShots.filter((shot, idx) => shot && oppShips[idx]).length;
    const oppSunk = hits >= TOTAL_SHIP_CELLS;

    const updateData: any = {};
    updateData[`${playerName}/shots`] = newShots;

    if (oppSunk) {
      updateData['winner'] = playerName;
      updateData['status'] = 'done';
      sfx.success();
    } else {
      updateData['turn'] = opp;
    }

    update(ref(db, 'board-amiral'), updateData);
  };

  const resetGame = () => {
    set(ref(db, 'board-amiral'), null);
    setGameData(null);
    setShowLobby(true);
  };

  // --- RENDER ---
  const renderGrid = (
    ships: boolean[],
    shots: boolean[],
    showShips: boolean,
    clickHandler?: (i: number) => void,
    label?: string
  ) => (
    <div>
      {label && <div style={{ fontSize: '0.8rem', color: 'var(--text-dim)', marginBottom: 6, fontWeight: 700 }}>{label}</div>}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(10, 1fr)', width: '100%', maxWidth: 320, aspectRatio: '1', border: '2px solid var(--line)', borderRadius: 8, overflow: 'hidden', margin: '0 auto' }}>
        {Array.from({ length: 100 }).map((_, i) => {
          const hasShip = ships[i];
          const wasShot = shots[i];
          const isHit = wasShot && hasShip;
          const isMiss = wasShot && !hasShip;
          let bg = showShips && hasShip ? '#1a4a8a' : '#0a1a2a';
          if (isHit) bg = '#c0392b';
          if (isMiss) bg = '#2a3a4a';

          return (
            <div key={i} onClick={() => clickHandler?.(i)} style={{
              width: '100%', aspectRatio: '1', display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: bg, border: '1px solid #1a2a3a', cursor: clickHandler ? 'crosshair' : 'default',
              fontSize: 'clamp(0.7rem, 2vw, 1.1rem)', transition: 'background 0.15s'
            }}>
              {isHit && '💥'}
              {isMiss && '🌊'}
              {showShips && hasShip && !wasShot && '🚢'}
            </div>
          );
        })}
      </div>
    </div>
  );

  if (showLobby) {
    return (
      <>
        <div className="eyebrow">Sıra Takibi Var</div>
        <h1 className="section-title">Amiral Battı</h1>
        <div style={{ background: 'var(--bg2)', border: '1px solid var(--line)', borderRadius: 16, padding: 20, textAlign: 'center' }}>
          <div style={{ background: 'var(--panel)', border: '1px dashed var(--tozpembe)', borderRadius: 12, padding: 15 }}>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-dim)', marginBottom: 15 }}>Her oyuncu kendi gemilerini yerleştirir, sonra sırayla ateş eder.</p>
            <button className="btn-action" onClick={startGame} style={{ width: '100%' }}>Oyunu Başlat</button>
            <button className="btn-ghost" onClick={() => setShowRules(true)} style={{ width: '100%', marginTop: 10 }}>Kuralları Oku</button>
          </div>
          {showRules && (
            <div style={{ position: 'fixed', inset: 0, background: 'rgba(10,6,5,0.75)', zIndex: 150, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
              <div style={{ background: 'var(--bg2)', border: '1px solid var(--line)', borderRadius: 16, padding: 22, maxWidth: 400, width: '100%' }}>
                <h2 style={{ color: 'var(--tozpembe)', marginTop: 0 }}>Amiral Battı Kuralları</h2>
                <div style={{ fontSize: '0.88rem', lineHeight: 1.8, color: 'var(--beyaz)', marginBottom: 20 }}>
                  1. Her oyuncu <b>{TOTAL_SHIP_CELLS} hücre</b> seçerek gemisini yerleştirir.<br/>
                  2. Hazır olunca "Hazırım!" butonuna bas.<br/>
                  3. İkisi de hazır olunca oyun başlar.<br/>
                  4. Sırayla rakibin tahtasına tıklayarak ateş et.<br/>
                  5. 💥 = İsabet, 🌊 = Iska<br/>
                  6. Rakibin tüm {TOTAL_SHIP_CELLS} gemisini batıran kazanır!
                </div>
                <button className="btn-action" onClick={() => setShowRules(false)} style={{ width: '100%' }}>Anladım, Kapat</button>
              </div>
            </div>
          )}
        </div>
      </>
    );
  }

  if (!gameData) return null;
  const status = gameData?.status;
  const bothReady = gameData?.[playerName]?.ready && gameData?.[opp]?.ready;

  return (
    <>
      <div className="eyebrow">Sıra Takibi Var</div>
      <h1 className="section-title">Amiral Battı</h1>
      <div style={{ background: 'var(--bg2)', border: '1px solid var(--line)', borderRadius: 16, padding: 16, textAlign: 'center' }}>

        {/* Kazanan */}
        {status === 'done' && (
          <div style={{ background: 'var(--tozpembe)', color: '#fff', borderRadius: 12, padding: '10px 20px', marginBottom: 12, fontFamily: "'Fraunces', serif", fontSize: '1.3rem' }}>
            🎉 {gameData.winner === playerName ? 'Kazandın!' : `${gameData.winner} kazandı!`}
          </div>
        )}

        {/* GEMİ YERLEŞTİRME AŞAMASI */}
        {status === 'placing' && (
          <>
            <div style={{ fontFamily: "'Fraunces', serif", fontSize: '1rem', padding: '8px 12px', border: '1px dashed var(--tozpembe)', borderRadius: 12, marginBottom: 14, color: 'var(--beyaz)', background: 'var(--bg)' }}>
              {myReady
                ? <span style={{ color: 'var(--yesil-lite)' }}>✓ Hazırsın! {opp} bekleniyor...</span>
                : <span>Gemilerini yerleştir: {myShipCount}/{TOTAL_SHIP_CELLS} hücre</span>}
            </div>
            {!myReady && renderGrid(myShips, Array(100).fill(false), true, toggleShip, 'Senin Tahtanı Tıklayarak Gemi Yerleştir:')}
            {myReady && renderGrid(myShips, Array(100).fill(false), true, undefined, 'Senin Tahtanı:')}
            {!myReady && (
              <button className="btn-action" onClick={markReady} style={{ width: '100%', maxWidth: 320, margin: '12px auto 0', display: 'block' }}>
                Hazırım! ({myShipCount}/{TOTAL_SHIP_CELLS})
              </button>
            )}
            {!bothReady && myReady && (
              <div style={{ fontSize: '0.85rem', color: 'var(--text-dim)', marginTop: 12 }}>
                {opp} henüz hazır değil, bekleniyor...
              </div>
            )}
          </>
        )}

        {/* ATEŞ AŞAMASI */}
        {(status === 'playing' || status === 'done') && (
          <>
            <div style={{ fontFamily: "'Fraunces', serif", fontSize: '1rem', padding: '8px 12px', border: '1px dashed var(--tozpembe)', borderRadius: 12, marginBottom: 14, color: 'var(--beyaz)', background: 'var(--bg)' }}>
              {status === 'done'
                ? 'Oyun bitti!'
                : gameData?.turn === playerName
                  ? <span style={{ color: 'var(--yesil-lite)' }}>Sıra Sende! Rakibe ateş et!</span>
                  : <span style={{ color: 'var(--tozpembe)' }}>{gameData?.turn} ateş ediyor...</span>}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              {/* Rakibin tahtası */}
              {renderGrid(
                oppShips,
                myShots,
                status === 'done', // oyun bittiyse rakip gemilerini göster
                status === 'playing' && gameData?.turn === playerName ? fireAt : undefined,
                `${opp}'in Tahtası (Ateş Et!)`
              )}
              {/* Senin tahtanı */}
              {renderGrid(myShips, oppShots, true, undefined, 'Senin Tahtanı')}
            </div>

            {/* İsabet sayaçları */}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 12, fontSize: '0.85rem', color: 'var(--text-dim)' }}>
              <span>🎯 Senin isabetlerin: {myShots.filter((s, i) => s && oppShips[i]).length}/{TOTAL_SHIP_CELLS}</span>
              <span>💣 Alınan isabet: {oppShots.filter((s, i) => s && myShips[i]).length}/{TOTAL_SHIP_CELLS}</span>
            </div>
          </>
        )}

        <button className="btn-ghost" onClick={resetGame} style={{ marginTop: 20 }}>Oyunu Sıfırla & Lobiye Dön</button>
      </div>
    </>
  );
}
