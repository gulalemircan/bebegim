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

  // FIREBASE'DEN PİNLERİ ÇEK
  useEffect(() => {
    const pinsRef = ref(db, 'map_pins');
    const unsub = onValue(pinsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const pinsArray = Object.values(data);
        setPins(pinsArray);
      }
    });
    return () => unsub();
  }, []);

  // Harita kurulumu (Leaflet) aynı kalıyor...
  // ...

  const addPin = () => {
    const name = pinName?.trim?.();
    if (name && pendingPin) {
      const newPin = { 
        name, 
        note: pinNote?.trim?.() ?? '', 
        lat: pendingPin?.lat, 
        lng: pendingPin?.lng,
        timestamp: Date.now()
      };
      
      // FIREBASE'E KAYDET
      const pinsRef = ref(db, 'map_pins');
      const newPinRef = push(pinsRef);
      set(newPinRef, newPin);

      if (window.navigator.vibrate) window.navigator.vibrate(50);
      sfx.success();
      setShowPinModal(false);
      setPinName('');
      setPinNote('');
    }
  };

  // ... (JSX kısmı aynı)
}
