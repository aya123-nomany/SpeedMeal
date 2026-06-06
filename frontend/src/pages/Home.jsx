import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, MapPin, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import pizzaImg from "../assets/pizza.png";
import heroImg from "../assets/hero.png";
import restoImg from "../assets/resto.jpg";
import food1 from "../assets/1.jpeg";
import food2 from "../assets/2.jpeg";
import food3 from "../assets/3.jpeg";
import food4 from "../assets/4.jpeg";
import PartnerSection from "../components/PartnerSection";
import FeaturesSection from "../components/FeaturesSection";
import CategoriesSection from "../components/CategoriesSection";
import FAQSection from "../components/FAQSection";
import SectionTitle from "../components/SectionTitle";
import RestaurantsSection from "../components/RestaurantsSection";



const LocationModal = ({ isOpen, onClose }) => {
  const [address, setAddress] = React.useState('');
  const [locLoading, setLocLoading] = React.useState(false);
  const [locError, setLocError] = React.useState('');

  const handleUsePosition = () => {
    if (!navigator.geolocation) {
      setLocError('La géolocalisation n\'est pas supportée par votre navigateur.');
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
        if (err.code === 1) setLocError('Accès refusé. Veuillez autoriser la géolocalisation dans votre navigateur.');
        else setLocError('Impossible d\'obtenir votre position. Réessayez.');
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
              Où devons-nous livrer ?
            </h2>
            <div style={{ marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', background: '#fff', border: '1px solid #ddd', borderRadius: '999px', padding: '18px 25px' }}>
                <Search size={22} style={{ color: '#888', marginRight: '15px', flexShrink: 0 }} />
                <input
                  type="text"
                  placeholder="Chercher l'adresse"
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
              <MapPin size={22} /> {locLoading ? 'Localisation...' : 'Utiliser ma position'}
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
                Confirmer l'adresse
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

  return (
    <div style={{ background: '#fff', minHeight: '100vh' }}>
      <LocationModal isOpen={isLocationModalOpen} onClose={() => setIsLocationModalOpen(false)} />

      {/* ── HERO ── */}
      <section style={{
        background: '#A51C1C',
        minHeight: '100vh',
        position: 'relative',
        overflow: 'hidden',
        display: 'flex',
        alignItems: 'center',
        paddingTop: '100px',
        paddingBottom: '120px',
      }}>

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

        {/* ── Main content: text LEFT + image RIGHT ── */}
        <div style={{
          maxWidth: '1200px',
          margin: '0 auto',
          padding: '0 40px',
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '40px',
          position: 'relative',
          zIndex: 5,
        }}>

          {/* LEFT — Text */}
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2, duration: 0.8 }}
            style={{ flex: 1, maxWidth: '560px', marginTop: '-80px' }}
          >
            <h1 style={{
              fontSize: 'clamp(48px, 6vw, 90px)',
              fontWeight: '900',
              color: '#fff',
              lineHeight: 0.92,
              letterSpacing: '-2px',
              textTransform: 'uppercase',
              margin: '0 0 28px',
              textShadow: '0 4px 20px rgba(0,0,0,0.15)',
            }}>
              TASTE THE<br />DIFFERENCE
            </h1>

            <p style={{
              color: 'rgba(255,255,255,0.75)',
              fontSize: '17px',
              fontWeight: '500',
              lineHeight: '1.65',
              marginBottom: '40px',
              maxWidth: '420px',
            }}>
              De la table du chef à votre porte — livraison rapide, 24/7, partout au Maroc.
            </p>

            {/* CTA buttons */}
            <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap' }}>
              <motion.button
                whileHover={{ scale: 1.05, y: -2 }} whileTap={{ scale: 0.97 }}
                onClick={() => setIsLocationModalOpen(true)}
                style={{
                  background: '#fff', color: '#A51C1C',
                  padding: '16px 34px', borderRadius: '999px', border: 'none',
                  fontWeight: '900', fontSize: '15px', cursor: 'pointer',
                  boxShadow: '0 12px 30px rgba(0,0,0,0.2)',
                  display: 'flex', alignItems: 'center', gap: '9px',
                }}
              >
                <MapPin size={17} /> Order Now
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.05, y: -2 }} whileTap={{ scale: 0.97 }}
                onClick={() => navigate('/menu')}
                style={{
                  background: 'rgba(255,255,255,0.12)', color: '#fff',
                  padding: '16px 34px', borderRadius: '999px',
                  border: '2px solid rgba(255,255,255,0.35)',
                  fontWeight: '800', fontSize: '15px', cursor: 'pointer',
                  backdropFilter: 'blur(8px)',
                  display: 'flex', alignItems: 'center', gap: '9px',
                }}
              >
                <Search size={17} /> Explore Menu
              </motion.button>
            </div>
          </motion.div>

          {/* RIGHT — Pizza image */}
          <motion.div
            initial={{ opacity: 0, x: 60, scale: 0.85 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            transition={{ delay: 0.4, duration: 0.9, type: 'spring', stiffness: 70 }}
            style={{
              flex: 1,
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              maxWidth: '520px',
              filter: 'drop-shadow(0 40px 70px rgba(0,0,0,0.5))',
            }}
          >
            <motion.img
              src={pizzaImg}
              alt="Pizza"
              animate={{ y: [0, -16, 0], rotate: [0, 1.5, 0] }}
              transition={{ duration: 4.5, repeat: Infinity, ease: 'easeInOut' }}
              style={{ width: '100%', maxWidth: '480px', objectFit: 'contain' }}
            />
          </motion.div>
        </div>

        {/* White wave cutout at bottom */}
        <div style={{ position: 'absolute', bottom: 0, left: 0, width: '100%', lineHeight: 0, zIndex: 6 }}>
          <svg viewBox="0 0 1440 100" fill="#fff" xmlns="http://www.w3.org/2000/svg"
            preserveAspectRatio="none" style={{ display: 'block', width: '100%', height: '100px' }}>
            <path d="M0,40 C240,100 480,0 720,50 C960,100 1200,10 1440,50 L1440,100 L0,100 Z" />
          </svg>
        </div>
      </section>

      {/* Rest of page */}
      <div style={{ paddingBottom: '100px' }}>

        {/* ── PROMO SECTION — text left + image right ── */}
        <section style={{ padding: '80px 40px', background: '#fff' }}>
          <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', alignItems: 'center', gap: '60px', flexWrap: 'wrap' }}>
            {/* LEFT — text */}
            <motion.div
              initial={{ opacity: 0, x: -30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.7 }}
              style={{ flex: 1, minWidth: '280px' }}
            >
              <h2 style={{ fontSize: 'clamp(28px, 4vw, 50px)', fontWeight: '950', color: '#111', lineHeight: 1.1, marginBottom: '16px', letterSpacing: '-1px' }}>
                Tout ce que<br />vous adorez,<br /><span style={{ color: '#A51C1C' }}>livré chez vous.</span>
              </h2>
              <p style={{ fontWeight: '800', fontSize: '16px', color: '#111', marginBottom: '8px' }}>Vos restaurants locaux préférés</p>
              <p style={{ color: '#666', fontSize: '15px', lineHeight: '1.7', marginBottom: '32px', maxWidth: '380px' }}>
                Commandez une pizza, un burger ou votre plat préféré depuis les meilleurs restaurants de votre ville — livré en moins de 45 minutes.
              </p>
              <motion.button
                whileHover={{ scale: 1.05, y: -2 }} whileTap={{ scale: 0.97 }}
                onClick={() => navigate('/menu')}
                style={{ background: '#A51C1C', color: '#fff', padding: '16px 36px', borderRadius: '999px', border: 'none', fontWeight: '800', fontSize: '15px', cursor: 'pointer', boxShadow: '0 8px 25px rgba(165,28,28,0.3)' }}
              >
                Trouver des restaurants
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
          title="Les meilleurs restaurants au Maroc"
          subtitle="Découvrez une sélection variée des meilleurs établissements près de chez vous."
        />
        <RestaurantsSection />
        <PartnerSection />
        <FeaturesSection />
        <FAQSection />
      </div>
    </div>
  );
}
