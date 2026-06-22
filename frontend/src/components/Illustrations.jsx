import React from 'react';

export const StoreIllustration = () => (
  <svg width="140" height="110" viewBox="0 0 140 110" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="25" y="45" width="90" height="55" rx="8" fill="#FFC244" />
    <path d="M20 45L70 25L120 45H20Z" fill="#A51C1C" />
    <rect x="55" y="65" width="30" height="35" rx="4" fill="#fff" />
    <rect x="35" y="55" width="20" height="15" rx="2" fill="rgba(255,255,255,0.5)" />
    <rect x="85" y="55" width="20" height="15" rx="2" fill="rgba(255,255,255,0.5)" />
    <rect x="40" y="15" width="60" height="15" rx="4" fill="#fff" stroke="#A51C1C" strokeWidth="2" />
    <text x="70" y="26" textAnchor="middle" fontSize="8" fontWeight="900" fill="#A51C1C" fontFamily="sans-serif">SPEEDMEAL</text>
  </svg>
);

export const RiderIllustration = () => (
  <svg width="140" height="110" viewBox="0 0 140 110" fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* Scooter */}
    <circle cx="45" cy="85" r="12" fill="#333" />
    <circle cx="105" cy="85" r="12" fill="#333" />
    <rect x="40" y="70" width="70" height="15" rx="7.5" fill="#A51C1C" />
    <path d="M45 70L55 40H75L85 70" stroke="#A51C1C" strokeWidth="8" strokeLinecap="round" />
    {/* Bag */}
    <rect x="85" y="35" width="35" height="35" rx="4" fill="#00a082" />
    <text x="102.5" y="55" textAnchor="middle" fontSize="6" fontWeight="900" fill="#FFC244" fontFamily="sans-serif">SPEEDMEAL</text>
    {/* Rider Helmet */}
    <circle cx="65" cy="30" r="10" fill="#FFC244" />
    <rect x="65" y="35" width="4" height="10" fill="#A51C1C" />
  </svg>
);

export const CommunityIllustration = () => (
  <svg width="140" height="110" viewBox="0 0 140 110" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="40" cy="55" r="25" fill="#FFC244" />
    <circle cx="70" cy="45" r="25" fill="#A51C1C" />
    <circle cx="100" cy="55" r="25" fill="#00a082" />
    {/* Eyes */}
    <circle cx="35" cy="50" r="2" fill="#333" />
    <circle cx="45" cy="50" r="2" fill="#333" />
    <circle cx="65" cy="40" r="2" fill="#fff" />
    <circle cx="75" cy="40" r="2" fill="#fff" />
    <circle cx="95" cy="50" r="2" fill="#fff" />
    <circle cx="105" cy="50" r="2" fill="#fff" />
    {/* Smiles */}
    <path d="M35 60C35 60 40 65 45 60" stroke="#333" strokeWidth="2" strokeLinecap="round" />
    <path d="M65 50C65 50 70 55 75 50" stroke="#fff" strokeWidth="2" strokeLinecap="round" />
    <path d="M95 60C95 60 100 65 105 60" stroke="#fff" strokeWidth="2" strokeLinecap="round" />
  </svg>
);
