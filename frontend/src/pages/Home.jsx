import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, MapPin, X, Utensils, Clock } from "lucide-react";
import { useNavigate } from "react-router-dom";
import burgerImg from "../assets/burger.png";
import pizzaImg from "../assets/pizza.png";
import heroImg from "../assets/hero.png";
import restoImg from "../assets/resto.jpg";
import food1 from "../assets/1.jpeg";
import food2 from "../assets/2.jpeg";
import food3 from "../assets/3.jpeg";
import food4 from "../assets/4.jpeg";
import designImg from "../assets/design.png";
import PartnerSection from "../components/PartnerSection";
import FeaturesSection from "../components/FeaturesSection";
import CategoriesSection from "../components/CategoriesSection";
import FAQSection from "../components/FAQSection";
import SectionTitle from "../components/SectionTitle";
import RestaurantsSection from "../components/RestaurantsSection";
import ClientReviewsSection from "../components/ClientReviewsSection";
import { useLanguage } from "../context/LanguageContext";



const LocationModal = ({ isOpen, onClose }) => {
  const [address, setAddress] = React.useState('');
  const [locLoading, setLocLoading] = React.useState(false);
  const [locError, setLocError] = React.useState('');
  const { t } = useLanguage();

  const handleUsePosition = () => {
    if (!navigator.geolocation) {
      setLocError(t('locationErrorGeo'));
      return;
    }
    setLocLoading(true);
    setLocError('');
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`
          );
          const data = await res.json();
          const label = data.display_name || `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`;
          setAddress(label);
          localStorage.setItem('deliveryAddress', label);
          localStorage.setItem('deliveryCoords', JSON.stringify({ lat: latitude, lng: longitude }));
        } catch {
          setAddress(`${latitude.toFixed(5)}, ${longitude.toFixed(5)}`);
        } finally {
          setLocLoading(false);
        }
      },
      (err) => {
        setLocLoading(false);
        if (err.code === 1) setLocError(t('locationErrorDenied'));
        else setLocError(t('locationErrorFailed'));
      },
      { timeout: 10000 }
    );
  };

  const handleConfirm = () => {
    if (address) {
      localStorage.setItem('deliveryAddress', address);
      onClose();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          onClick={onClose}
          style={{
            position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
            background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)',
            zIndex: 3000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px'
          }}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            onClick={(e) => e.stopPropagation()}
            style={{
              width: '100%', maxWidth: '550px', background: '#fff',
              borderRadius: '35px', padding: '50px 40px', position: 'relative',
              textAlign: 'center', boxShadow: '0 30px 100px rgba(0,0,0,0.25)'
            }}
          >
            <button onClick={onClose} style={{ position: 'absolute', right: '25px', top: '25px', background: '#f5f5f5', border: 'none', borderRadius: '50%', padding: '10px', cursor: 'pointer' }}>
              <X size={20} />
            </button>
            <h2 style={{ fontSize: '36px', fontWeight: '950', marginBottom: '35px', color: '#111' }}>
              {t('whereDeliver')}
            </h2>
            <div style={{ marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', background: '#fff', border: '1px solid #ddd', borderRadius: '999px', padding: '18px 25px' }}>
                <Search size={22} style={{ color: '#888', marginRight: '15px', flexShrink: 0 }} />
                <input
                  type="text"
                  placeholder={t('searchAddress')}
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  style={{ width: '100%', border: 'none', outline: 'none', fontSize: '18px', fontWeight: '500' }}
                />
              </div>
            </div>

            {locError && (
              <p style={{ color: '#A51C1C', fontSize: '13px', fontWeight: '600', marginBottom: '12px', textAlign: 'left', paddingLeft: '10px' }}>
                {locError}
              </p>
            )}

            <button
              onClick={handleUsePosition}
              disabled={locLoading}
              style={{
                width: '100%', background: 'rgba(165,28,28,0.1)', color: '#A51C1C',
                padding: '22px', borderRadius: '999px', border: 'none', fontWeight: '800',
                fontSize: '18px', cursor: locLoading ? 'not-allowed' : 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px',
                marginBottom: address ? '14px' : '0',
                opacity: locLoading ? 0.7 : 1,
              }}
            >
              <MapPin size={22} /> {locLoading ? t('locationLoading') : t('usePosition')}
            </button>

            {address && (
              <button
                onClick={handleConfirm}
                style={{
                  width: '100%', background: '#A51C1C', color: '#fff',
                  padding: '22px', borderRadius: '999px', border: 'none', fontWeight: '800',
                  fontSize: '18px', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px',
                }}
              >
                {t('confirmAddress')}
              </button>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default function Home() {
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);
  const navigate = useNavigate();
  const { t } = useLanguage();

  return (
    <div style={{ background: '#fff', minHeight: '100vh' }}>
      <style>{`
        /* ── Hero ── */
        .hero-section {
          background: #A51C1C;
          position: relative;
          overflow: hidden;
          display: flex;
          align-items: center;
          padding: 90px 80px 40px;
          min-height: 750px;
        }
        .hero-image-wrapper {
          flex: 0 0 auto;
          display: flex;
          justify-content: center;
          align-items: flex-end;
          position: relative;
          z-index: 10;
          width: 500px;
          height: 520px;
          margin-top: 40px;
        }
        .burger-img {
          width: 100%;
          height: auto;
          display: block;
        }
        .design-img {
          position: absolute;
          right: 40px;
          top: 0;
          width: 120px;
          height: auto;
          z-index: 20;
        }
        .hero-content {
          flex: 1;
          max-width: 560px;
          text-align: left;
          padding-left: 40px;
        }
        .hero-title {
          font-size: clamp(40px, 5vw, 110px);
          font-weight: 900;
          color: #FFD700;
          line-height: 1;
          font-family: cursive, "Brush Script MT", "Comic Sans MS", sans-serif;
          text-shadow: 4px 4px 0px rgba(0,0,0,0.4);
          margin: 0 0 28px;
          letter-spacing: 2px;
          transform: rotate(-2deg);
        }
        .hero-clock-icon {
          display: inline-block;
          vertical-align: middle;
          width: clamp(36px, 5vw, 70px) !important;
          height: clamp(36px, 5vw, 70px) !important;
          margin: 0 8px;
        }
        .hero-buttons {
          display: flex;
          gap: 14px;
          flex-wrap: wrap;
          justify-content: flex-start;
        }

        /* ── Tablet large (max 1100px) ── */
        @media (max-width: 1100px) {
          .hero-section { padding: 100px 40px 60px; min-height: 600px; }
          .hero-image-wrapper { width: 340px; height: 360px; }
          .hero-content { padding-left: 20px; }
          .design-img { width: 80px; right: 10px; }
        }

        /* ── Tablet small — switch to column (max 900px) ── */
        @media (max-width: 900px) {
          .hero-section {
            flex-direction: column !important;
            padding: 76px 24px 50px !important;
            min-height: auto !important;
            align-items: center !important;
          }
          .hero-image-wrapper {
            width: min(340px, 70vw) !important;
            height: auto !important;
            margin-top: 0 !important;
            order: 1;
          }
          .burger-img { width: 100% !important; }
          .design-img { width: 72px !important; right: 0 !important; top: 0 !important; }
          .hero-content {
            order: 2;
            padding-left: 0 !important;
            max-width: 600px !important;
            width: 100%;
            text-align: center !important;
          }
          .hero-title {
            font-size: clamp(30px, 6vw, 52px) !important;
            letter-spacing: 0 !important;
            transform: rotate(-1deg) !important;
            word-break: break-word !important;
            overflow-wrap: break-word !important;
          }
          .hero-clock-icon {
            width: clamp(26px, 5vw, 44px) !important;
            height: clamp(26px, 5vw, 44px) !important;
            margin: 0 6px !important;
          }
          .hero-buttons { justify-content: center !important; }
        }

        /* ── Mobile (max 600px) ── */
        @media (max-width: 600px) {
          .hero-section { padding: 74px 14px 44px !important; }
          .hero-image-wrapper { width: min(260px, 75vw) !important; }
          .hero-title { font-size: clamp(24px, 7.5vw, 36px) !important; }
          .hero-clock-icon { width: clamp(22px, 6vw, 32px) !important; height: clamp(22px, 6vw, 32px) !important; }
        }

        /* ── Very small (max 380px) ── */
        @media (max-width: 380px) {
          .hero-section { padding: 70px 12px 36px !important; }
          .hero-image-wrapper { width: 70vw !important; }
          .hero-title { font-size: 22px !important; }
          .hero-clock-icon { width: 20px !important; height: 20px !important; }
        }
      `}</style>
      <LocationModal isOpen={isLocationModalOpen} onClose={() => setIsLocationModalOpen(false)} />

      {/* ── HERO ── */}
      <section className="hero-section">
        {/* Radial glow */}
        <div style={{
          position: 'absolute', inset: 0, pointerEvents: 'none',
          background: 'radial-gradient(ellipse 70% 60% at 60% 50%, rgba(255,255,255,0.07) 0%, transparent 70%)',
        }} />
        {/* Decorative dots */}
        {[
          { top: '20%', left: '22%', s: 7 }, { top: '50%', left: '18%', s: 5 },
          { top: '75%', left: '30%', s: 6 }, { top: '25%', right: '18%', s: 8 },
          { top: '60%', right: '22%', s: 5 }, { top: '80%', right: '30%', s: 6 },
        ].map((d, i) => (
          <div key={i} style={{
            position: 'absolute', top: d.top, left: d.left, right: d.right,
            width: d.s, height: d.s, borderRadius: '50%',
            background: 'rgba(255,255,255,0.15)', pointerEvents: 'none'
          }} />
        ))}

        {/* ── Burger Image ── */}
        <div className="hero-image-wrapper">
          <motion.img
            src={designImg}
            alt="Design"
            className="design-img"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.8 }}
          />
          <motion.img
            className="burger-img"
            src={burgerImg}
            alt="Burger"
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4, duration: 0.9, type: 'spring', stiffness: 70 }}
          />
        </div>

        {/* ── Hero Content ── */}
        <div className="hero-content">
          <motion.h1
            className="hero-title"
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3, duration: 0.8 }}
          >
            {(() => {
              const text = t('heroTitle');
              const firstSpace = text.indexOf(' ');
              if (firstSpace === -1) return text;
              const firstWord = text.substring(0, firstSpace);
              const rest = text.substring(firstSpace);
              return (
                <>
                  {firstWord}{' '}
                  <Clock className="hero-clock-icon" strokeWidth={3} color="#FFD700" style={{ display: 'inline-block', verticalAlign: 'middle', margin: '0 6px' }} />
                  {rest}
                </>
              );
            })()}
          </motion.h1>
          {/* CTA buttons */}
          <div className="hero-buttons">
            <motion.button
              whileHover={{ scale: 1.05, y: -2 }} whileTap={{ scale: 0.97 }}
              onClick={() => setIsLocationModalOpen(true)}
              style={{
                background: '#FFD700', color: '#000',
                padding: '16px 40px', borderRadius: '20px', border: 'none',
                fontWeight: '900', fontSize: '15px', cursor: 'pointer',
                boxShadow: '0 12px 30px rgba(0,0,0,0.2)',
                display: 'flex', alignItems: 'center', gap: '9px',
                whiteSpace: 'nowrap',
              }}
            >
              <MapPin size={17} /> {t('heroBtn')}
            </motion.button>
          </div>
        </div>
      </section>

      {/* Wave Divider */}
      <div style={{ position: 'relative', width: '100%', marginTop: '-2px', zIndex: 5, lineHeight: 0 }}>
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1440 80" preserveAspectRatio="none"
          style={{ width: '100%', height: 'clamp(40px, 6vw, 80px)', display: 'block' }}>
          <path d="M0,0 C360,60 720,60 1080,60 C1260,60 1350,20 1440,0 L1440,80 L0,80 Z" fill="#fff" />
        </svg>
      </div>

      {/* Rest of page */}
      <div style={{ paddingTop: 'clamp(20px, 4vw, 60px)', paddingBottom: '100px' }}>

        {/* ── PROMO SECTION — text left + image right ── */}
        <section style={{ padding: 'clamp(40px, 6vw, 80px) clamp(16px, 4vw, 40px)', background: '#fff' }}>
          <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', alignItems: 'center', gap: '60px', flexWrap: 'wrap' }}>
            {/* LEFT — text */}
            <motion.div
              initial={{ opacity: 0, x: -30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.7 }}
              style={{ flex: 1, minWidth: '280px' }}
            >
              <h2 style={{ fontSize: 'clamp(28px, 4vw, 50px)', fontWeight: '950', color: '#111', lineHeight: 1.1, marginBottom: '16px', letterSpacing: '-1px' }}>
                {t('promoTitle').split(',').map((part, index) => {
                  if (index === 0) return <span key={index}>{part},<br /></span>;
                  return <span key={index} style={{ color: '#A51C1C' }}>{part}</span>;
                })}
              </h2>
              <p style={{ fontWeight: '800', fontSize: '16px', color: '#111', marginBottom: '8px' }}>{t('promoSubtitle')}</p>
              <p style={{ color: '#666', fontSize: '15px', lineHeight: '1.7', marginBottom: '32px', maxWidth: '380px' }}>
                {t('promoDesc')}
              </p>
              <motion.button
                whileHover={{ scale: 1.05, y: -2 }} whileTap={{ scale: 0.97 }}
                onClick={() => navigate('/menu')}
                style={{ background: '#A51C1C', color: '#fff', padding: '16px 36px', borderRadius: '999px', border: 'none', fontWeight: '800', fontSize: '15px', cursor: 'pointer', boxShadow: '0 8px 25px rgba(165,28,28,0.3)' }}
              >
                {t('promoBtn')}
              </motion.button>
            </motion.div>

            {/* RIGHT — image */}
            <motion.div
              initial={{ opacity: 0, x: 30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.7, delay: 0.15 }}
              style={{ flex: 1, minWidth: '280px', maxWidth: '580px' }}
            >
              <img
                src={restoImg}
                alt="Restaurant"
                style={{ width: '100%', height: '420px', objectFit: 'cover', borderRadius: '24px', boxShadow: '0 20px 60px rgba(0,0,0,0.12)' }}
              />
            </motion.div>
          </div>
        </section>

        <CategoriesSection />
        <SectionTitle
          title={t('bestRestoTitle')}
          subtitle={t('bestRestoSub')}
        />
        <RestaurantsSection />
        <ClientReviewsSection />
        <PartnerSection />
        <FeaturesSection />
        <FAQSection />
      </div>
    </div>
  );
}
