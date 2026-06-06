import React from 'react';
import { motion } from 'framer-motion';
import logoUrl from '../assets/logo.png';

// Road dashes
const DASHES = Array.from({ length: 8 });

const LoadingScreen = () => {
  return (
    <motion.div
      initial={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 1.05 }}
      transition={{ duration: 0.7, ease: 'easeInOut' }}
      style={{
        position: 'fixed', top: 0, left: 0,
        width: '100%', height: '100vh',
        background: '#ffffff',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        zIndex: 9999, overflow: 'hidden',
      }}
    >
      {/* Background radial glow */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        background: 'radial-gradient(ellipse 60% 50% at 50% 50%, rgba(165,28,28,0.06) 0%, transparent 70%)',
      }} />

      {/* Logo */}
      <motion.img
        src={logoUrl}
        alt="SpeedMeal"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.6 }}
        style={{ height: '140px', objectFit: 'contain', marginBottom: '60px', position: 'relative', zIndex: 2 }}
      />

      {/* Scene container */}
      <div style={{ position: 'relative', width: '340px', height: '160px', zIndex: 2 }}>

        {/* Road */}
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0,
          height: '40px', background: '#222', borderRadius: '6px',
          overflow: 'hidden',
        }}>
          {/* Road center dashes */}
          <div style={{ position: 'absolute', top: '50%', left: 0, right: 0, height: '4px', transform: 'translateY(-50%)', display: 'flex', gap: '18px', alignItems: 'center', paddingLeft: '10px' }}>
            {DASHES.map((_, i) => (
              <motion.div
                key={i}
                animate={{ x: [0, -260] }}
                transition={{ duration: 1.2, repeat: Infinity, ease: 'linear', delay: i * 0.15 }}
                style={{ width: '28px', height: '4px', background: '#fff', borderRadius: '2px', flexShrink: 0 }}
              />
            ))}
          </div>
        </div>

        {/* Rider + Moto SVG */}
        <motion.div
          animate={{ y: [0, -4, 0] }}
          transition={{ duration: 0.4, repeat: Infinity, ease: 'easeInOut' }}
          style={{ position: 'absolute', bottom: '36px', left: '30px' }}
        >
          <svg width="120" height="90" viewBox="0 0 120 90" fill="none" xmlns="http://www.w3.org/2000/svg">
            {/* Rear wheel */}
            <circle cx="22" cy="72" r="14" fill="#111" />
            <circle cx="22" cy="72" r="8" fill="#333" />
            <circle cx="22" cy="72" r="3" fill="#888" />

            {/* Front wheel */}
            <circle cx="96" cy="72" r="14" fill="#111" />
            <circle cx="96" cy="72" r="8" fill="#333" />
            <circle cx="96" cy="72" r="3" fill="#888" />

            {/* Moto body */}
            <path d="M28 68 L38 42 L70 40 L90 55 L96 58 L90 68 Z" fill="#1a1a1a" />
            <path d="M38 42 L50 30 L72 30 L70 40 Z" fill="#2a2a2a" />

            {/* Engine */}
            <rect x="42" y="52" width="22" height="16" rx="4" fill="#444" />

            {/* Exhaust */}
            <path d="M28 65 L18 68 L16 72" stroke="#666" strokeWidth="3" strokeLinecap="round" />

            {/* Handlebar */}
            <path d="M82 40 L90 32 L96 34" stroke="#555" strokeWidth="3" strokeLinecap="round" />

            {/* Delivery box on back */}
            <rect x="30" y="28" width="28" height="22" rx="4" fill="#A51C1C" />
            <rect x="32" y="30" width="24" height="18" rx="3" fill="#c0392b" />
            <text x="44" y="43" textAnchor="middle" fontSize="7" fontWeight="900" fill="#fff" fontFamily="sans-serif">SM</text>

            {/* Rider body */}
            <ellipse cx="68" cy="36" rx="10" ry="14" fill="#222" />
            {/* Rider head / helmet */}
            <circle cx="68" cy="20" r="11" fill="#FFC244" />
            <path d="M58 20 Q68 10 78 20" fill="#A51C1C" />
            {/* Visor */}
            <path d="M61 22 Q68 26 75 22" stroke="#333" strokeWidth="2.5" strokeLinecap="round" fill="none" />

            {/* Arms */}
            <path d="M72 32 L86 38" stroke="#222" strokeWidth="5" strokeLinecap="round" />
            <path d="M64 32 L52 36" stroke="#222" strokeWidth="5" strokeLinecap="round" />

            {/* Speed lines */}
            <motion.g>
              <line x1="0" y1="50" x2="14" y2="50" stroke="rgba(255,255,255,0.4)" strokeWidth="2" strokeLinecap="round" />
              <line x1="0" y1="58" x2="10" y2="58" stroke="rgba(255,255,255,0.25)" strokeWidth="1.5" strokeLinecap="round" />
              <line x1="0" y1="44" x2="8" y2="44" stroke="rgba(255,255,255,0.2)" strokeWidth="1.5" strokeLinecap="round" />
            </motion.g>
          </svg>
        </motion.div>

        {/* Dust particles behind wheel */}
        {[0, 1, 2].map(i => (
          <motion.div
            key={i}
            animate={{ x: [-10, -50], opacity: [0.6, 0], scale: [0.5, 1.2] }}
            transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.25, ease: 'easeOut' }}
            style={{
              position: 'absolute', bottom: '42px', left: '18px',
              width: '8px', height: '8px', borderRadius: '50%',
              background: 'rgba(255,255,255,0.3)',
            }}
          />
        ))}
      </div>

      {/* Progress bar */}
      <div style={{
        width: '220px', height: '4px', background: 'rgba(165,28,28,0.15)',
        borderRadius: '10px', marginTop: '40px', overflow: 'hidden',
        position: 'relative', zIndex: 2,
      }}>
        <motion.div
          initial={{ x: '-100%' }}
          animate={{ x: '100%' }}
          transition={{ duration: 1.4, repeat: Infinity, ease: 'easeInOut' }}
          style={{ width: '100%', height: '100%', background: '#A51C1C', borderRadius: '10px' }}
        />
      </div>

      {/* Text */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        style={{
          marginTop: '16px', color: 'rgba(165,28,28,0.6)',
          fontWeight: '800', fontSize: '12px',
          letterSpacing: '2px', textTransform: 'uppercase',
          position: 'relative', zIndex: 2,
        }}
      >
        En route vers chez vous...
      </motion.p>
    </motion.div>
  );
};

export default LoadingScreen;
