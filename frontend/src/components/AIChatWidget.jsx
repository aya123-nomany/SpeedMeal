import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { X, Send, Bot, Sparkles, RotateCcw } from 'lucide-react';

const API = 'https://speedmeal.ayaennoamany.workers.dev/api/ai/chat';

/* ── SparkSVG matching SectionTitle style ── */
const SparkSVG = () => (
  <svg width="36" height="36" viewBox="0 0 40 40" fill="none"
    style={{ position: 'absolute', top: -16, left: -18, pointerEvents: 'none' }}>
    <path d="M10 25C10 25 8 22 5 22" stroke="#FFC244" strokeWidth="4" strokeLinecap="round" />
    <path d="M12 18C12 18 10 14 8 12" stroke="#FFC244" strokeWidth="4" strokeLinecap="round" />
    <path d="M18 14C18 14 20 10 22 8" stroke="#FFC244" strokeWidth="4" strokeLinecap="round" />
  </svg>
);

const SUGGESTIONS = [
  'Quel est le meilleur restaurant ?',
  'Quels restaurants sont ouverts maintenant ?',
  'Comment devenir livreur SpeedMeal ?',
  'Quels types de cuisine sont disponibles ?',
];

export default function AIChatWidget() {
  const [open, setOpen] = useState(false);
  const [chat, setChat] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [unread, setUnread] = useState(0);
  const [siteData, setSiteData] = useState(null);  // restaurants + public stats
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  const token = localStorage.getItem('token');

  /* scroll to bottom on new message */
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chat, loading]);

  /* focus input when opened */
  useEffect(() => {
    if (open) {
      setUnread(0);
      setTimeout(() => inputRef.current?.focus(), 200);
    }
  }, [open]);

  /* Fetch public site data once widget first opens */
  useEffect(() => {
    if (open && !siteData) {
      axios.get('https://speedmeal.ayaennoamany.workers.dev/api/restaurants')
        .then(r => {
          const restaurants = Array.isArray(r.data) ? r.data : (r.data.restaurants || []);
          setSiteData({ restaurants });
        })
        .catch(() => { });
    }
  }, [open]);

  /* greeting on first open */
  useEffect(() => {
    if (open && chat.length === 0) {
      setChat([{
        role: 'assistant',
        content: 'Bonjour ! Je suis l\'assistant SpeedMeal.\nJe connais tous nos restaurants, les types de cuisine disponibles, et je peux vous aider à choisir. Comment puis-je vous aider ?',
      }]);
    }
  }, [open]);

  const send = async (msg) => {
    const text = (msg || input).trim();
    if (!text || loading) return;
    const history = chat.map(m => ({ role: m.role, content: m.content }));
    const next = [...chat, { role: 'user', content: text }];
    setChat(next);
    setInput('');
    setLoading(true);
    try {
      const { data } = await axios.post(
        API,
        { message: text, history, context: siteData },
        token ? { headers: { Authorization: `Bearer ${token}` } } : {}
      );
      setChat([...next, { role: 'assistant', content: data.response }]);
      if (!open) setUnread(u => u + 1);
    } catch (err) {
      setChat([...next, {
        role: 'assistant',
        content: `[!] ${err.response?.data?.error || 'Service temporairement indisponible. Réessayez.'}`,
      }]);
    }
    setLoading(false);
  };

  const reset = () => {
    setChat([]);
    setTimeout(() => {
      setChat([{
        role: 'assistant',
        content: 'Bonjour ! Je suis l\'assistant SpeedMeal. Comment puis-je vous aider aujourd\'hui ?',
      }]);
    }, 100);
  };

  return (
    <>
      {/* ── Chat window ── */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.88, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.88, y: 20 }}
            transition={{ type: 'spring', stiffness: 340, damping: 28 }}
            style={{
              position: 'fixed',
              bottom: 96,
              right: 24,
              width: 370,
              maxHeight: 580,
              background: '#fff',
              borderRadius: 22,
              boxShadow: '0 24px 64px rgba(0,0,0,0.18)',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
              zIndex: 9999,
              fontFamily: 'Outfit, sans-serif',
            }}
          >
            {/* Header */}
            <div style={{
              background: 'linear-gradient(135deg, #A51C1C 0%, #C0392B 100%)',
              padding: '18px 20px 16px',
              position: 'relative',
              overflow: 'visible',
            }}>
              {/* Yellow sparks matching site SectionTitle */}
              <SparkSVG />

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  {/* Bot avatar */}
                  <div style={{
                    width: 42, height: 42, borderRadius: 13,
                    background: 'rgba(255,255,255,0.18)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0,
                  }}>
                    <Bot size={22} color="#fff" />
                  </div>
                  <div>
                    <p style={{ margin: 0, fontWeight: 900, fontSize: 15, color: '#fff', letterSpacing: '-0.2px' }}>
                      Assistant SpeedMeal
                    </p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 2 }}>
                      <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#4ade80', flexShrink: 0 }} />
                      <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.75)', fontWeight: 600 }}>
                        En ligne · NVIDIA Llama
                      </span>
                    </div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                  <button onClick={reset} title="Nouvelle conversation"
                    style={{ width: 32, height: 32, borderRadius: 9, background: 'rgba(255,255,255,0.15)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', transition: 'background .2s' }}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.25)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.15)'}
                  >
                    <RotateCcw size={14} />
                  </button>
                  <button onClick={() => setOpen(false)}
                    style={{ width: 32, height: 32, borderRadius: 9, background: 'rgba(255,255,255,0.15)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', transition: 'background .2s' }}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.25)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.15)'}
                  >
                    <X size={15} />
                  </button>
                </div>
              </div>

              {/* Title tag — same style as SectionTitle red pill */}
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                background: 'rgba(255,255,255,0.15)',
                borderRadius: 999, padding: '4px 12px', marginTop: 10,
              }}>
                <Sparkles size={12} color="#FFC244" />
                <span style={{ fontSize: 11, color: '#FFC244', fontWeight: 700, letterSpacing: '0.04em' }}>
                  Propulsé par IA
                </span>
              </div>
            </div>

            {/* Messages */}
            <div style={{
              flex: 1, overflowY: 'auto', padding: '16px 16px 8px',
              display: 'flex', flexDirection: 'column', gap: 10,
              background: '#F8F9FE',
            }}>
              {chat.map((m, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2 }}
                  style={{ display: 'flex', gap: 8, justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start' }}
                >
                  {m.role === 'assistant' && (
                    <div style={{ width: 28, height: 28, borderRadius: 9, background: '#A51C1C', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 2 }}>
                      <Bot size={14} color="#fff" />
                    </div>
                  )}
                  <div style={{
                    maxWidth: '78%',
                    padding: '10px 14px',
                    borderRadius: m.role === 'user' ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                    background: m.role === 'user' ? '#A51C1C' : '#fff',
                    color: m.role === 'user' ? '#fff' : '#1C1C2E',
                    fontSize: 13.5,
                    lineHeight: 1.65,
                    whiteSpace: 'pre-wrap',
                    boxShadow: m.role === 'user' ? '0 4px 12px rgba(165,28,28,0.28)' : '0 2px 8px rgba(0,0,0,0.06)',
                    fontWeight: 500,
                  }}>
                    {m.content}
                  </div>
                </motion.div>
              ))}

              {/* Typing indicator */}
              {loading && (
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <div style={{ width: 28, height: 28, borderRadius: 9, background: '#A51C1C', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Bot size={14} color="#fff" />
                  </div>
                  <div style={{ padding: '10px 14px', borderRadius: '16px 16px 16px 4px', background: '#fff', display: 'flex', gap: 4, alignItems: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
                    {[0, 1, 2].map(i => (
                      <span key={i} style={{
                        width: 6, height: 6, borderRadius: '50%', background: '#A51C1C', opacity: 0.7,
                        animation: `aiDot .9s ${i * 0.18}s infinite`,
                      }} />
                    ))}
                  </div>
                </div>
              )}

              {/* Quick suggestions — show only at start */}
              {chat.length <= 1 && !loading && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 4 }}>
                  {SUGGESTIONS.map(s => (
                    <button key={s} onClick={() => send(s)}
                      style={{
                        textAlign: 'left', padding: '9px 14px', borderRadius: 12,
                        border: '1.5px solid #EEF0F6', background: '#fff',
                        fontSize: 12.5, fontWeight: 600, cursor: 'pointer',
                        color: '#475569', fontFamily: 'Outfit, sans-serif',
                        transition: 'all .18s',
                      }}
                      onMouseEnter={e => { e.currentTarget.style.borderColor = '#A51C1C'; e.currentTarget.style.color = '#A51C1C'; }}
                      onMouseLeave={e => { e.currentTarget.style.borderColor = '#EEF0F6'; e.currentTarget.style.color = '#475569'; }}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              )}
              <div ref={bottomRef} />
            </div>

            {/* Input */}
            <div style={{
              padding: '12px 14px',
              borderTop: '1px solid #EEF0F6',
              background: '#fff',
              display: 'flex', gap: 8, alignItems: 'center',
            }}>
              <input
                ref={inputRef}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }}
                placeholder="Écrivez votre message…"
                style={{
                  flex: 1, padding: '10px 14px', borderRadius: 12,
                  border: '1.5px solid #EEF0F6', fontSize: 13,
                  fontFamily: 'Outfit, sans-serif', color: '#1C1C2E',
                  outline: 'none', background: '#F8F9FE',
                  transition: 'border .15s',
                }}
                onFocus={e => e.target.style.borderColor = '#A51C1C'}
                onBlur={e => e.target.style.borderColor = '#EEF0F6'}
              />
              <button
                onClick={() => send()}
                disabled={!input.trim() || loading}
                style={{
                  width: 40, height: 40, borderRadius: 11, border: 'none',
                  background: input.trim() && !loading ? '#A51C1C' : '#EEF0F6',
                  cursor: input.trim() && !loading ? 'pointer' : 'default',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0, transition: 'all .2s',
                  boxShadow: input.trim() && !loading ? '0 4px 14px rgba(165,28,28,0.35)' : 'none',
                }}
              >
                <Send size={15} color={input.trim() && !loading ? '#fff' : '#94A3B8'} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Floating trigger button ── */}
      <motion.button
        onClick={() => setOpen(o => !o)}
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.94 }}
        style={{
          position: 'fixed',
          bottom: 24,
          right: 24,
          width: 60,
          height: 60,
          borderRadius: '50%',
          background: open
            ? '#1C1C2E'
            : 'linear-gradient(135deg, #A51C1C 0%, #C0392B 100%)',
          border: 'none',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 8px 28px rgba(165,28,28,0.45)',
          zIndex: 10000,
          transition: 'background .3s',
        }}
        title="Assistant SpeedMeal IA"
      >
        <AnimatePresence mode="wait">
          {open ? (
            <motion.div key="close"
              initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }}
              transition={{ duration: 0.18 }}
            >
              <X size={22} color="#fff" />
            </motion.div>
          ) : (
            <motion.div key="bot"
              initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }}
              transition={{ duration: 0.18 }}
            >
              <Bot size={24} color="#fff" />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Unread badge */}
        <AnimatePresence>
          {unread > 0 && !open && (
            <motion.span
              initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}
              style={{
                position: 'absolute', top: -3, right: -3,
                background: '#FFC244', color: '#1C1C2E',
                width: 20, height: 20, borderRadius: '50%',
                fontSize: 11, fontWeight: 900,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontFamily: 'Outfit, sans-serif',
                border: '2px solid #fff',
              }}
            >
              {unread}
            </motion.span>
          )}
        </AnimatePresence>
      </motion.button>

      {/* Animation keyframes */}
      <style>{`
        @keyframes aiDot {
          0%, 80%, 100% { transform: translateY(0); opacity: 0.7; }
          40% { transform: translateY(-5px); opacity: 1; }
        }
      `}</style>
    </>
  );
}
