'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { db } from '@/lib/firebase';
import { ref, onValue, update, set } from 'firebase/database';
import { sfx } from '@/lib/sounds';

interface Props { playerName: string; }

function hsbToRgb(h: number, s: number, v: number) {
  s /= 100; v /= 100;
  const c = v * s;
  const x = c * (1 - Math.abs((h / 60) % 2 - 1));
  const m = v - c;
  let r = 0, g = 0, b = 0;
  if (h < 60) { r = c; g = x; } else if (h < 120) { r = x; g = c; } else if (h < 180) { g = c; b = x; } else if (h < 240) { g = x; b = c; } else if (h < 300) { r = x; b = c; } else { r = c; b = x; }
  return { r: Math.round((r + m) * 255), g: Math.round((g + m) * 255), b: Math.round((b + m) * 255) };
}

export default function RenkHafiza({ playerName }: Props) {
  const [gameData, setGameData] = useState<any>(null);
  const [localStatus, setLocalStatus] = useState('');
  const [hue, setHue] = useState(0);
  const [sat, setSat] = useState(0);
  const [bri, setBri] = useState(50);
  const phaseTimer = useRef<any>(null);
  const sbRef = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);

  useEffect(() => {
    const unsub = onValue(ref(db, 'game'), (snap: any) => {
      setGameData(snap?.val?.() ?? null);
    });
    return () => { unsub?.(); clearInterval(phaseTimer.current); };
  }, []);

  const currentColor = hsbToRgb(hue, sat, bri);

  const startMatch = (mode: string) => {
    update(ref(db, 'game'), {
      status: 'memorize', mode,
      target: { r: Math.floor(Math.random() * 256), g: Math.floor(Math.random() * 256), b: Math.floor(Math.random() * 256) },
      guesses: { Emircan: false, Efsun: false }
    });
  };

  // Handle game state transitions
  useEffect(() => {
    if (!gameData) return;
    clearInterval(phaseTimer.current);

    if (gameData?.status === 'idle') {
      setLocalStatus('idle');
    } else if (gameData?.status === 'memorize' && localStatus !== 'memorize') {
      setLocalStatus('memorize');
      // Start memorize countdown
      let t = 5;
      phaseTimer.current = setInterval(() => {
        t--;
        if (t <= 0) {
          clearInterval(phaseTimer.current);
          if (playerName === 'Emircan') set(ref(db, 'game/status'), 'recall');
        }
      }, 1000);
    } else if (gameData?.status === 'recall' && localStatus !== 'recall') {
      setLocalStatus('recall');
      setHue(Math.floor(Math.random() * 360));
      setSat(0);
      setBri(50);
      if (gameData?.mode === 'timer') {
        let t = 10;
        phaseTimer.current = setInterval(() => {
          t--;
          if (t <= 0) {
            clearInterval(phaseTimer.current);
            // Auto submit
            const c = hsbToRgb(hue, sat, bri);
            set(ref(db, `game/guesses/${playerName}`), c);
          }
        }, 1000);
      }
    } else if (gameData?.status === 'result' && localStatus !== 'result') {
      setLocalStatus('result');
      sfx.success();
    }

    // Check if both guesses are in
    if (gameData?.status === 'recall' && gameData?.guesses?.Emircan && gameData?.guesses?.Efsun) {
      if (playerName === 'Emircan') {
        // Calculate result
        const t = gameData?.target ?? { r: 0, g: 0, b: 0 };
        const eg = gameData?.guesses?.Emircan ?? { r: 0, g: 0, b: 0 };
        const fg = gameData?.guesses?.Efsun ?? { r: 0, g: 0, b: 0 };
        const eDiff = Math.abs(eg.r - t.r) + Math.abs(eg.g - t.g) + Math.abs(eg.b - t.b);
        const fDiff = Math.abs(fg.r - t.r) + Math.abs(fg.g - t.g) + Math.abs(fg.b - t.b);
        const eScore = Math.max(0, Math.round(100 - (eDiff / 765 * 100)));
        const fScore = Math.max(0, Math.round(100 - (fDiff / 765 * 100)));
        let rWins = { ...(gameData?.roundWins ?? { Emircan: 0, Efsun: 0 }) };
        let mWins = { ...(gameData?.matchWins ?? { Emircan: 0, Efsun: 0 }) };
        let rWinner = 'Draw';
        if (eScore > fScore) { rWinner = 'Emircan'; rWins.Emircan = (rWins?.Emircan ?? 0) + 1; }
        else if (fScore > eScore) { rWinner = 'Efsun'; rWins.Efsun = (rWins?.Efsun ?? 0) + 1; }
        if ((rWins?.Emircan ?? 0) >= 2) { mWins.Emircan = (mWins?.Emircan ?? 0) + 1; rWins = { Emircan: 0, Efsun: 0 }; }
        else if ((rWins?.Efsun ?? 0) >= 2) { mWins.Efsun = (mWins?.Efsun ?? 0) + 1; rWins = { Emircan: 0, Efsun: 0 }; }
        update(ref(db, 'game'), { status: 'result', roundWins: rWins, matchWins: mWins, lastRoundWinner: rWinner, scores: { Emircan: eScore, Efsun: fScore } });
      }
    }
  }, [gameData?.status, gameData?.guesses?.Emircan, gameData?.guesses?.Efsun]);

  const submitGuess = () => {
    clearInterval(phaseTimer.current);
    set(ref(db, `game/guesses/${playerName}`), currentColor);
    sfx.click();
  };

  const handleSBInteraction = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    if (!sbRef?.current) return;
    const rect = sbRef.current.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches?.[0]?.clientX ?? 0 : (e as React.MouseEvent).clientX;
    const clientY = 'touches' in e ? e.touches?.[0]?.clientY ?? 0 : (e as React.MouseEvent).clientY;
    let x = (clientX - rect.left) / rect.width;
    let y = (clientY - rect.top) / rect.height;
    x = Math.min(1, Math.max(0, x));
    y = Math.min(1, Math.max(0, y));
    setSat(Math.round(x * 100));
    setBri(Math.round((1 - y) * 100));
  }, []);

  const isLocked = localStatus !== 'recall' || (gameData?.guesses?.[playerName] && gameData?.guesses?.[playerName] !== false);
  const target = gameData?.target ?? { r: 128, g: 128, b: 128 };
  const showColor = localStatus === 'memorize' ? `rgb(${target.r},${target.g},${target.b})` :
    localStatus === 'recall' ? `rgb(${currentColor.r},${currentColor.g},${currentColor.b})` : 'var(--bg2)';

  if (!gameData || gameData?.status === 'idle' || localStatus === 'idle' || localStatus === '') {
    return (
      <>
        <div className="eyebrow">Online Kapışma</div>
        <h1 className="section-title">Renk Hafıza Oyunu</h1>
        <div style={{ background: 'var(--bg2)', border: '1px solid var(--line)', borderRadius: 16, padding: 20, textAlign: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 14, background: 'var(--bg2)', border: '1px solid var(--tozpembe)', borderRadius: 999, padding: '10px 18px', fontFamily: "'Fraunces', serif", fontSize: '1.15rem', marginBottom: 20 }}>
            Emircan <b style={{ color: 'var(--tozpembe)' }}>{gameData?.matchWins?.Emircan ?? 0}</b>&nbsp;&ndash;&nbsp;<b style={{ color: 'var(--tozpembe)' }}>{gameData?.matchWins?.Efsun ?? 0}</b> Efsun
          </div>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-dim)', background: 'var(--bg)', padding: '5px 12px', borderRadius: 20, marginBottom: 20 }}>
            Şu anki Set: Emircan <b>{gameData?.roundWins?.Emircan ?? 0}</b> - <b>{gameData?.roundWins?.Efsun ?? 0}</b> Efsun
          </div>
          <button className="btn-action" onClick={() => startMatch('timer')} style={{ width: '100%', marginBottom: 10 }}>Sayaç Modunda Başlat (10sn)</button>
          <button className="btn-ghost" onClick={() => startMatch('relaxed')} style={{ width: '100%', borderColor: 'var(--mavi)', color: 'var(--beyaz)' }}>Rahat Modda Başlat</button>
        </div>
      </>
    );
  }

  return (
    <>
      <div className="eyebrow">Online Kapışma</div>
      <h1 className="section-title">Renk Hafıza Oyunu</h1>
      <div style={{ background: 'var(--bg2)', border: '1px solid var(--line)', borderRadius: 16, padding: 20, textAlign: 'center' }}>
        <div style={{ fontWeight: 700, fontSize: '0.74rem', color: 'var(--tozpembe)', marginBottom: 16 }}>
          {localStatus === 'memorize' ? 'Renge iyi bak!' : localStatus === 'recall' ? (gameData?.mode === 'timer' ? 'Aynı rengi bul (10 Saniye!)' : 'Aynı rengi bul (Süre yok)') : 'Sonuçlar'}
        </div>

        <div style={{ borderRadius: 22, padding: 5, background: 'linear-gradient(135deg, var(--bordo), var(--yesil), var(--mavi))' }}>
          <div style={{ width: '100%', height: 170, borderRadius: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Fraunces', serif", fontSize: '2.4rem', color: 'rgba(255,255,255,0.4)', background: showColor, transition: 'background-color .12s linear' }}>
            {localStatus === 'memorize' && ''}
          </div>
        </div>

        {localStatus === 'recall' && !isLocked && (
          <div style={{ marginTop: 16, opacity: isLocked ? 0.3 : 1, pointerEvents: isLocked ? 'none' : 'auto' }}>
            <div ref={sbRef} onMouseDown={(e: any) => { dragging.current = true; handleSBInteraction(e); }}
              onMouseMove={(e: any) => { if (dragging.current) handleSBInteraction(e); }}
              onMouseUp={() => { dragging.current = false; }}
              onTouchStart={(e: any) => { dragging.current = true; handleSBInteraction(e); }}
              onTouchMove={(e: any) => { if (dragging.current) handleSBInteraction(e); }}
              onTouchEnd={() => { dragging.current = false; }}
              style={{
                position: 'relative', width: '100%', maxWidth: 230, aspectRatio: '1/1',
                margin: '0 auto 20px', borderRadius: 16, border: '1px solid var(--line)', cursor: 'crosshair', touchAction: 'none',
                background: `linear-gradient(to top, #000, transparent), linear-gradient(to right, #fff, transparent), hsl(${hue},100%,50%)`
              }}>
              <div style={{ position: 'absolute', width: 18, height: 18, borderRadius: '50%', border: '2.5px solid var(--beyaz)', boxShadow: '0 0 0 1.5px rgba(0,0,0,0.55)', transform: 'translate(-50%, -50%)', pointerEvents: 'none', left: `${sat}%`, top: `${100 - bri}%` }} />
            </div>
            <input type="range" min={0} max={360} value={hue} onChange={(e) => setHue(parseInt(e?.target?.value ?? '0'))}
              style={{ width: '100%', height: 16, borderRadius: 999, WebkitAppearance: 'none', background: 'linear-gradient(to right, #ff0000, #ffff00, #00ff00, #00ffff, #0000ff, #ff00ff, #ff0000)' }} />
          </div>
        )}

        {localStatus === 'recall' && !isLocked && (
          <button className="btn-action" onClick={submitGuess} style={{ marginTop: 16 }}>Tahminimi Gönder</button>
        )}

        {localStatus === 'recall' && isLocked && (
          <div style={{ marginTop: 10, color: 'var(--tozpembe)', fontFamily: "'Fraunces', serif", fontSize: '1.1rem' }}>
            Rakibinin tahmini bekleniyor...
            <br />
            <button className="btn-ghost" onClick={() => update(ref(db, 'game'), { status: 'idle' })} style={{ marginTop: 10 }}>İptal Et</button>
          </div>
        )}

        {localStatus === 'result' && gameData && (
          <div style={{ marginTop: 16 }}>
            <div style={{ display: 'flex', gap: 14, margin: '16px 0' }}>
              <div style={{ flex: 1, textAlign: 'center' }}>
                <div style={{ height: 80, borderRadius: 12, border: '1px solid var(--line)', marginBottom: 6, background: `rgb(${target?.r},${target?.g},${target?.b})` }} />
                <div>Gerçek</div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 14, margin: '16px 0' }}>
              <div style={{ flex: 1, textAlign: 'center' }}>
                <div style={{ height: 80, borderRadius: 12, border: '1px solid var(--line)', marginBottom: 6, background: gameData?.guesses?.Emircan ? `rgb(${gameData.guesses.Emircan.r},${gameData.guesses.Emircan.g},${gameData.guesses.Emircan.b})` : 'var(--bg)' }} />
                <div>Emircan</div>
              </div>
              <div style={{ flex: 1, textAlign: 'center' }}>
                <div style={{ height: 80, borderRadius: 12, border: '1px solid var(--line)', marginBottom: 6, background: gameData?.guesses?.Efsun ? `rgb(${gameData.guesses.Efsun.r},${gameData.guesses.Efsun.g},${gameData.guesses.Efsun.b})` : 'var(--bg)' }} />
                <div>Efsun</div>
              </div>
            </div>
            <div style={{ color: 'var(--tozpembe)', fontFamily: "'Fraunces', serif", fontSize: '1.1rem' }}>
              {gameData?.lastRoundWinner === 'Draw' ? 'Berabere!' : `Bu turu ${gameData?.lastRoundWinner} kazandı!`}
              <br /><span style={{ fontSize: '0.85rem', color: 'var(--text-dim)' }}>Yakınlık -&gt; Emircan: %{gameData?.scores?.Emircan ?? 0} | Efsun: %{gameData?.scores?.Efsun ?? 0}</span>
            </div>
            <button className="btn-ghost" onClick={() => set(ref(db, 'game/status'), 'idle')} style={{ marginTop: 20 }}>Sonraki Tura Geç</button>
          </div>
        )}
      </div>
    </>
  );
}
