'use client';

import React, { useState, useEffect, useRef } from 'react';
import { db } from '@/lib/firebase';
import { ref, push, query, limitToLast, onChildAdded } from 'firebase/database';
import { sfx, playHeartbeat } from '@/lib/sounds';

interface Props { playerName: string; }

export default function ChatWidget({ playerName }: Props) {
  const [chatOpen, setChatOpen] = useState(false);
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState('');
  const [unread, setUnread] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const isFirstLoad = useRef(true);
  const chatOpenRef = useRef(false);
  const kissAudio = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    kissAudio.current = new Audio('/opucuk.mp3');
  }, []);

  useEffect(() => {
    chatOpenRef.current = chatOpen;
  }, [chatOpen]);

  useEffect(() => {
    const chatRef = query(ref(db, 'chat'), limitToLast(50));
    const unsub = onChildAdded(chatRef, (snapshot: any) => {
      const msg = snapshot?.val?.();
      if (!msg) return;
      setMessages((prev: any[]) => [...(prev ?? []), { id: snapshot?.key, ...(msg ?? {}) }]);

      if (!isFirstLoad.current && msg?.sender !== playerName) {
        if (!chatOpenRef.current) setUnread(true);
        sfx.click();
        if (msg?.type === 'action' && msg?.text === 'hug') playHeartbeat();
        if (msg?.type === 'action' && msg?.text === 'kiss') kissAudio?.current?.play?.()?.catch?.(() => {});
      }
    });

    setTimeout(() => { isFirstLoad.current = false; }, 1500);
    return () => unsub?.();
  }, [playerName]);

  useEffect(() => {
    messagesEndRef?.current?.scrollIntoView?.({ behavior: 'smooth' });
  }, [messages]);

  const send = () => {
    const text = input?.trim?.();
    if (text) {
      push(ref(db, 'chat'), { sender: playerName, text, type: 'text', time: Date.now() });
      setInput('');
    }
  };

  const sendEmoji = (emoji: string) => {
    push(ref(db, 'chat'), { sender: playerName, text: emoji, type: 'emoji', time: Date.now() });
  };

  const sendAction = (action: string) => {
    push(ref(db, 'chat'), { sender: playerName, text: action, type: 'action', time: Date.now() });
  };

  const toggleChat = () => {
    setChatOpen((prev: boolean) => !prev);
    if (!chatOpen) setUnread(false);
  };

  const emojiButtons = ['😂', '👏', '😭', '😂🙈', '🤬'];

  return (
    <>
      {/* FAB */}
      <div onClick={toggleChat} style={{
        position: 'fixed', bottom: 25, right: 25, width: 60, height: 60,
        background: 'linear-gradient(135deg, var(--bordo), var(--yesil))',
        borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: '1.8rem', cursor: 'pointer', zIndex: 1000,
        boxShadow: '0 4px 15px rgba(0,0,0,0.6)', border: '2px solid var(--tozpembe)'
      }}>
        💬
        {unread && (
          <div style={{
            position: 'absolute', top: -5, right: -5, background: '#e08a8a',
            color: 'var(--bg)', fontSize: '0.8rem', width: 22, height: 22,
            borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold'
          }}>!</div>
        )}
      </div>

      {/* Chat Panel */}
      {chatOpen && (
        <div style={{
          position: 'fixed', bottom: 95, right: 25, width: 320, height: 450,
          background: 'var(--bg2)', border: '1px solid var(--line)', borderRadius: 16,
          display: 'flex', flexDirection: 'column', zIndex: 1000,
          boxShadow: '0 10px 30px rgba(0,0,0,0.8)', animation: 'popUp 0.3s ease forwards'
        }}>
          {/* Header */}
          <div onClick={toggleChat} style={{
            padding: '12px 16px', background: 'var(--panel)', borderBottom: '1px solid var(--line)',
            fontFamily: "'Fraunces', serif", fontWeight: 700, color: 'var(--tozpembe)',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer'
          }}>
            💬 İkimize Özel Sohbet <span style={{ fontSize: '1.2rem' }}>✕</span>
          </div>

          {/* Messages */}
          <div style={{ flex: 1, padding: 12, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 8 }}>
            {(messages ?? []).map((msg: any) => {
              const isMine = msg?.sender === playerName;
              if (msg?.type === 'action') {
                return (
                  <div key={msg?.id} style={{
                    maxWidth: '80%', padding: '8px 12px', borderRadius: 12, fontSize: '0.85rem',
                    background: 'var(--bordo)', color: 'var(--beyaz)', textAlign: 'center', alignSelf: 'center'
                  }}>
                    {msg?.text === 'hug' && <><b>{msg?.sender}</b> sana sımsıkı sarıldı! 🫂</>}
                    {msg?.text === 'kiss' && <><b>{msg?.sender}</b>&apos;den kocaman bir öpücük! 💋</>}
                  </div>
                );
              }
              return (
                <div key={msg?.id} style={{
                  maxWidth: '80%', padding: '8px 12px', borderRadius: 12, fontSize: msg?.type === 'emoji' ? '2.2rem' : '0.85rem',
                  lineHeight: 1.3, alignSelf: isMine ? 'flex-end' : 'flex-start',
                  background: msg?.type === 'emoji' ? 'transparent' : (isMine ? 'var(--yesil-lite)' : 'var(--bg)'),
                  color: 'var(--beyaz)', border: isMine ? 'none' : (msg?.type === 'emoji' ? 'none' : '1px solid var(--line)'),
                  borderBottomRightRadius: isMine ? 2 : 12, borderBottomLeftRadius: isMine ? 12 : 2
                }}>
                  {msg?.type === 'text' && <span style={{ fontSize: '0.65rem', opacity: 0.7, display: 'block', marginBottom: 2 }}>{msg?.sender}</span>}
                  {msg?.text}
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>

          {/* Controls */}
          <div style={{ padding: 10, borderTop: '1px solid var(--line)', background: 'var(--bg)' }}>
            <div style={{ display: 'flex', gap: 4, marginBottom: 6, justifyContent: 'center' }}>
              {emojiButtons.map((em: string) => (
                <button key={em} onClick={() => sendEmoji(em)} style={{ background: 'none', border: 'none', fontSize: '1.2rem', cursor: 'pointer', padding: '2px 4px' }}>{em}</button>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              <input type="text" value={input} onChange={(e) => setInput(e?.target?.value ?? '')}
                onKeyPress={(e) => { if (e?.key === 'Enter') send(); }}
                placeholder="Mesaj yaz..." style={{
                  flex: 1, padding: '8px 12px', borderRadius: 999, border: '1px solid var(--line)',
                  background: 'var(--bg2)', color: 'var(--beyaz)'
                }} />
              <button onClick={send} style={{ background: 'var(--tozpembe)', color: 'var(--bg)', border: 'none', borderRadius: 999, padding: '0 14px', fontWeight: 700, cursor: 'pointer' }}>→</button>
            </div>
            <div style={{ display: 'flex', justifyContent: 'center', gap: 15, paddingTop: 8, borderTop: '1px dashed var(--line)', marginTop: 8 }}>
              <button onClick={() => sendAction('hug')} style={{ background: 'var(--bg2)', border: '1px solid var(--tozpembe)', color: 'var(--beyaz)', borderRadius: 12, padding: '6px 15px', fontSize: '1.1rem', cursor: 'pointer', display: 'flex', gap: 5, alignItems: 'center' }}>🫂 Sarıl</button>
              <button onClick={() => sendAction('kiss')} style={{ background: 'var(--bg2)', border: '1px solid var(--tozpembe)', color: 'var(--beyaz)', borderRadius: 12, padding: '6px 15px', fontSize: '1.1rem', cursor: 'pointer', display: 'flex', gap: 5, alignItems: 'center' }}>💋 Öp</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
