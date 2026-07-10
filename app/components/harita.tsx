'use client';

import React, { useState, useEffect, useRef } from 'react';
import { sfx } from '@/lib/sounds';
import { db } from '@/lib/firebase';
import { ref, onValue, push, set } from 'firebase/database';

export default function Harita() {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<any>(null);
  const [showPinModal, setShowPinModal] = useState(false);
  const [pendingPin, setPendingPin] = useState<{ lat: number; lng: number } | null>(null);
  const [pinName, setPinName] = useState('');
  const [pinNote, setPinNote] = useState('');
  const [pins, setPins] = useState<any[]>([]);
  const markersRef = useRef<any[]>([]);

  useEffect(() => {
    const pinsRef = ref(db, 'map_pins');
    const unsub = onValue(pinsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        setPins(Object.values(data));
      } else {
        setPins([]);
      }
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    let L: any;
    const loadMap = async () => {
      L = await import('leaflet');
      if (!mapRef?.current || mapInstance?.current) return;

      const map = L.map(mapRef.current, { worldCopyJump: true }).setView([30, 20], 2);
      L.tileLayer('https://lh3.googleusercontent.com/f7oQQ7ImS1jAT0UJSbl8WK2TRigRhmXOgtyLNY6F9bjbOEW3Vs0Ee9NZoompPx6n63kJmEq6NeNM9uxVoaOwdGn9zi5HaJbcPdc=e365-pa-nu-s0', {
        maxZoom: 20,
        subdomains: ['mt0', 'mt1', 'mt2', 'mt3'],
      }).addTo(map);

      map.on('click', (e: any) => {
        setPendingPin({ lat: e?.latlng?.lat, lng: e?.latlng?.lng });
        setShowPinModal(true);
      });

      mapInstance.current = map;
    };
    loadMap();

    return () => {
      if (mapInstance?.current) {
        mapInstance.current.remove();
        mapInstance.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (!mapInstance?.current) return;
    const L = require('leaflet');

    markersRef?.current?.forEach?.((m: any) => mapInstance?.current?.removeLayer?.(m));
    markersRef.current = [];

    (pins ?? []).forEach((p: any) => {
      const icon = L.divIcon({ className: 'custom-pin-icon', html: '📍', iconSize: [26, 26], iconAnchor: [13, 26] });
      const marker = L.marker([p?.lat, p?.lng], { icon }).addTo(mapInstance.current);
      marker.bindPopup(`<b>${p?.name ?? ''}</b><br>${p?.note ?? ''}`);
      marker.on('click', () => sfx.click());
      markersRef.current.push(marker);
    });
  }, [pins]);

  const addPin = () => {
    const name = pinName?.trim?.();
    if (name && pendingPin) {
      if (typeof window !== 'undefined' && window.navigator.vibrate) {
        window.navigator.vibrate(50);
      }
      const newPinRef = push(ref(db, 'map_pins'));
      set(newPinRef, {
        name,
        note: pinNote?.trim?.() ?? '',
        lat: pendingPin.lat,
        lng: pendingPin.lng,
        timestamp: Date.now()
      });
      
      sfx.success();
      setShowPinModal(false);
      setPinName('');
      setPinNote('');
    }
  };

  return (
    <>
      <div className="eyebrow">Hayaller listesi</div>
      <h1 className="section-title">Gelecek planları haritası</h1>
      <div className="card">
        <div ref={mapRef} style={{ position: 'relative', marginTop: 16, borderRadius: 16, overflow: 'hidden', border: '1px solid var(--line)', height: 400, zIndex: 1, background: 'var(--bg2)' }} />
      </div>

      {showPinModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(10,6,5,0.75)', zIndex: 150, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div style={{ background: 'var(--bg2)', border: '1px solid var(--line)', borderRadius: 16, padding: 22, width: '100%', maxWidth: 400, textAlign: 'left' }}>
            <input type="text" value={pinName} onChange={(e) => setPinName(e?.target?.value ?? '')} placeholder="Yer adı"
              style={{ width: '100%', marginBottom: 14, padding: 10, borderRadius: 8, border: '1px solid var(--line)', background: 'var(--bg)', color: 'var(--beyaz)' }} />
            <textarea value={pinNote} onChange={(e) => setPinNote(e?.target?.value ?? '')} rows={2} placeholder="Not (opsiyonel)"
              style={{ width: '100%', marginBottom: 14, padding: 10, borderRadius: 8, border: '1px solid var(--line)', background: 'var(--bg)', color: 'var(--beyaz)' }} />
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button className="btn-ghost" onClick={() => setShowPinModal(false)}>Vazgeç</button>
              <button className="btn-action" onClick={addPin}>Ekle</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
