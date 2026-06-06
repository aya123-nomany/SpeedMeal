import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bike, DollarSign, Clock, Shield, ChevronDown,
  CheckCircle, Star, Zap, Wifi, Smartphone, X,
  Mail, Phone as PhoneIcon, MapPin
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import heroDelivery from '../assets/hero_delivery.png';

/* ─────────────── FAQ ─────────────── */
const FAQItem = ({ question, answer }) => {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ borderBottom: '1px solid #eee', cursor: 'pointer' }} onClick={() => setOpen(!open)}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '16px', padding: '20px 0' }}>
        <span style={{ fontWeight: '700', fontSize: '15px', color: '#111' }}>{question}</span>
        <motion.div animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.25 }} style={{ flexShrink: 0 }}>
          <ChevronDown size={18} color="#A51C1C" />
        </motion.div>
      </div>
      <AnimatePresence>
        {open && (
          <motion.p
            initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
            style={{ color: '#666', fontSize: '14px', lineHeight: '1.7', paddingBottom: '16px', overflow: 'hidden', margin: 0 }}
          >{answer}</motion.p>
        )}
      </AnimatePresence>
    </div>
  );
};

/* ─────────────── MODAL FORM ─────────────── */
const SignupModal = ({ isOpen, onClose }) => {
  const [form, setForm] = useState({
    name: '', email: '', phone: '', city: '', vehicle: '',
    license: '', insurance: '', accept: false,
  });
  const [errors, setErrors] = useState({});
  const [submitted, setSubmitted] = useState(false);

  const set = (key, val) => { setForm(f => ({ ...f, [key]: val })); setErrors(e => ({ ...e, [key]: '' })); };

  const validate = () => {
    const e = {};
    if (!form.name.trim())   e.name      = 'Requis';
    if (!form.email.trim())  e.email     = 'Requis';
    if (!form.phone.trim())  e.phone     = 'Requis';
    if (!form.city)          e.city      = 'Requis';
    if (!form.vehicle)       e.vehicle   = 'Requis';
    if (!form.license)       e.license   = 'Répondez';
    if (!form.insurance)     e.insurance = 'Répondez';
    if (!form.accept)        e.accept    = 'Veuillez accepter';
    return e;
  };

  const handleSubmit = (ev) => {
    ev.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setSubmitted(true);
  };

  const inputBase = (hasErr) => ({
    width: '100%', padding: '14px 16px', borderRadius: '10px',
    border: `1.5px solid ${hasErr ? '#ef4444' : 'rgba(255,255,255,0.12)'}`,
    background: 'rgba(255,255,255,0.06)', color: '#fff',
    fontSize: '14px', fontWeight: '500', outline: 'none',
    boxSizing: 'border-box', transition: 'border-color 0.2s',
  });

  const Field = ({ fkey, type = 'text', placeholder }) => (
    <div style={{ flex: 1 }}>
      <label style={{ fontSize: '12px', fontWeight: '700', color: 'rgba(255,255,255,0.5)', display: 'block', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
        {placeholder} <span style={{ color: '#ef4444' }}>*</span>
      </label>
      <input type={type} placeholder={placeholder} value={form[fkey]}
        onChange={e => set(fkey, e.target.value)}
        style={inputBase(errors[fkey])}
        onFocus={e => { e.target.style.borderColor = '#A51C1C'; e.target.style.background = 'rgba(165,28,28,0.1)'; }}
        onBlur={e => { e.target.style.borderColor = errors[fkey] ? '#ef4444' : 'rgba(255,255,255,0.12)'; e.target.style.background = 'rgba(255,255,255,0.06)'; }}
      />
      {errors[fkey] && <p style={{ color: '#ef4444', fontSize: '11px', marginTop: '4px' }}>{errors[fkey]}</p>}
    </div>
  );

  const SelectField = ({ fkey, placeholder, options }) => (
    <div style={{ flex: 1 }}>
      <label style={{ fontSize: '12px', fontWeight: '700', color: 'rgba(255,255,255,0.5)', display: 'block', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
        {placeholder} <span style={{ color: '#ef4444' }}>*</span>
      </label>
      <div style={{ position: 'relative' }}>
        <select value={form[fkey]} onChange={e => set(fkey, e.target.value)}
          style={{ ...inputBase(errors[fkey]), appearance: 'none', cursor: 'pointer', paddingRight: '36px', color: form[fkey] ? '#fff' : 'rgba(255,255,255,0.35)' }}
          onFocus={e => { e.target.style.borderColor = '#A51C1C'; }}
          onBlur={e => { e.target.style.borderColor = errors[fkey] ? '#ef4444' : 'rgba(255,255,255,0.12)'; }}
        >
          <option value="" style={{ background: '#1a1a1a' }}>Veuillez sélectionner</option>
          {options.map(o => <option key={o.value} value={o.value} style={{ background: '#1a1a1a' }}>{o.label}</option>)}
        </select>
        <ChevronDown size={16} color="rgba(255,255,255,0.4)" style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
      </div>
      {errors[fkey] && <p style={{ color: '#ef4444', fontSize: '11px', marginTop: '4px' }}>{errors[fkey]}</p>}
    </div>
  );

  const RadioField = ({ fkey, label }) => (
    <div>
      <label style={{ fontSize: '12px', fontWeight: '700', color: 'rgba(255,255,255,0.5)', display: 'block', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
        {label} <span style={{ color: '#ef4444' }}>*</span>
      </label>
      <div style={{ display: 'flex', gap: '10px' }}>
        {['Oui', 'Non'].map(val => (
          <label key={val} style={{
            flex: 1, display: 'flex', alignItems: 'center', gap: '10px',
            padding: '12px 16px', borderRadius: '10px', cursor: 'pointer',
            border: `1.5px solid ${form[fkey] === val ? '#A51C1C' : 'rgba(255,255,255,0.12)'}`,
            background: form[fkey] === val ? 'rgba(165,28,28,0.15)' : 'rgba(255,255,255,0.04)',
            transition: 'all 0.2s', fontSize: '14px', fontWeight: '600', color: form[fkey] === val ? '#fff' : 'rgba(255,255,255,0.5)',
          }}>
            <div style={{
              width: '18px', height: '18px', borderRadius: '50%', flexShrink: 0,
              border: `2px solid ${form[fkey] === val ? '#A51C1C' : 'rgba(255,255,255,0.3)'}`,
              background: form[fkey] === val ? '#A51C1C' : 'transparent',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              {form[fkey] === val && <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#fff' }} />}
            </div>
            <input type="radio" name={fkey} value={val} checked={form[fkey] === val}
              onChange={() => set(fkey, val)} style={{ display: 'none' }} />
            {val}
          </label>
        ))}
      </div>
      {errors[fkey] && <p style={{ color: '#ef4444', fontSize: '11px', marginTop: '4px' }}>{errors[fkey]}</p>}
    </div>
  );

  const cities = ['Casablanca','Rabat','Marrakech','Fès','Tanger','Agadir','Meknès','Oujda','Kenitra','Tétouan'].map(c => ({ value: c, label: c }));
  const vehicles = [
    { value: 'velo', label: '🚲 Vélo' },
    { value: 'scooter', label: '🛵 Scooter / Moto' },
    { value: 'voiture', label: '🚗 Voiture' },
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          onClick={onClose}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)', zIndex: 9000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', overflowY: 'auto' }}
        >
          <motion.div
            initial={{ scale: 0.92, opacity: 0, y: 30 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.92, opacity: 0, y: 30 }}
            transition={{ type: 'spring', damping: 28, stiffness: 300 }}
            onClick={e => e.stopPropagation()}
            style={{ width: '100%', maxWidth: '560px', background: '#1a1a1a', borderRadius: '24px', padding: '40px', position: 'relative', boxShadow: '0 40px 100px rgba(0,0,0,0.6)', border: '1px solid rgba(255,255,255,0.06)' }}
          >
            {/* Close */}
            <button onClick={onClose} style={{ position: 'absolute', top: '20px', right: '20px', background: 'rgba(255,255,255,0.08)', border: 'none', borderRadius: '50%', width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: '0.2s' }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.15)'}
              onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.08)'}>
              <X size={18} color="#fff" />
            </button>

            {submitted ? (
              <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} style={{ textAlign: 'center', padding: '20px 0' }}>
                <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'rgba(165,28,28,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
                  <CheckCircle size={44} color="#A51C1C" />
                </div>
                <h3 style={{ fontSize: '24px', fontWeight: '900', color: '#fff', marginBottom: '12px' }}>Inscription envoyée !</h3>
                <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '15px', lineHeight: '1.7', marginBottom: '28px' }}>
                  Merci <strong style={{ color: '#fff' }}>{form.name}</strong> ! Notre équipe vous contactera au <strong style={{ color: '#fff' }}>{form.phone}</strong> dans les 48h.
                </p>
                <button onClick={() => { setSubmitted(false); setForm({ name: '', email: '', phone: '', city: '', vehicle: '', license: '', insurance: '', accept: false }); setErrors({}); }}
                  style={{ background: '#A51C1C', color: '#fff', border: 'none', padding: '14px 32px', borderRadius: '999px', fontWeight: '800', cursor: 'pointer', fontSize: '15px' }}>
                  Nouvelle inscription
                </button>
              </motion.div>
            ) : (
              <>
                <h2 style={{ fontSize: '22px', fontWeight: '900', color: '#fff', marginBottom: '6px' }}>Formulaire d'inscription initiale</h2>
                <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: '13px', lineHeight: '1.6', marginBottom: '28px' }}>
                  Souhaitez-vous rejoindre SpeedMeal en tant que livreur ? Remplissez le formulaire ci-dessous et notre équipe vous contactera dans les plus brefs délais.
                </p>

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <Field fkey="name"  placeholder="Nom complet" />
                  <Field fkey="email" type="email" placeholder="Adresse e-mail" />
                  <Field fkey="phone" type="tel" placeholder="Numéro de téléphone" />

                  <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                    <SelectField fkey="city"    placeholder="Ville"             options={cities} />
                    <SelectField fkey="vehicle" placeholder="Type de véhicule"  options={vehicles} />
                  </div>

                  <RadioField fkey="license"   label="Avez-vous un permis de conduire ?" />
                  <RadioField fkey="insurance" label="Avez-vous une assurance pour le véhicule ?" />

                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', paddingTop: '4px' }}>
                    <div onClick={() => set('accept', !form.accept)}
                      style={{ width: '18px', height: '18px', borderRadius: '5px', flexShrink: 0, marginTop: '1px', cursor: 'pointer', border: `2px solid ${errors.accept ? '#ef4444' : form.accept ? '#A51C1C' : 'rgba(255,255,255,0.25)'}`, background: form.accept ? '#A51C1C' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s' }}>
                      {form.accept && <CheckCircle size={12} color="#fff" />}
                    </div>
                    <label onClick={() => set('accept', !form.accept)} style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)', cursor: 'pointer', lineHeight: '1.6' }}>
                      J'accepte les <span style={{ color: '#A51C1C', fontWeight: '700' }}>conditions d'utilisation</span> et la <span style={{ color: '#A51C1C', fontWeight: '700' }}>politique de confidentialité</span> de SpeedMeal.
                    </label>
                  </div>
                  {errors.accept && <p style={{ color: '#ef4444', fontSize: '11px', marginTop: '-10px' }}>{errors.accept}</p>}

                  <motion.button whileHover={{ y: -2 }} whileTap={{ scale: 0.97 }} type="submit"
                    style={{ width: '100%', background: '#A51C1C', color: '#fff', padding: '16px', borderRadius: '12px', border: 'none', fontWeight: '800', fontSize: '16px', cursor: 'pointer', marginTop: '4px', boxShadow: '0 8px 25px rgba(165,28,28,0.4)' }}>
                    Envoyer le formulaire
                  </motion.button>
                </form>
              </>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

/* ─────────────── MAIN PAGE ─────────────── */
const Delivery = () => {
  const navigate = useNavigate();
  const [modalOpen, setModalOpen] = useState(false);

  const perks = [
    { icon: MapPin,     title: "Depuis n'importe quelle ville",       desc: 'Livrez depuis votre ville, à votre rythme.' },
    { icon: DollarSign, title: 'Revenu garanti + primes mensuelles',  desc: 'Gagnez plus avec des primes de performance.' },
    { icon: PhoneIcon,  title: 'Assistance technique continue',       desc: 'Support 7j/7 pour vous accompagner.' },
    { icon: Clock,      title: 'Choisissez vos horaires librement',   desc: "Matin, soir, weekend — c'est vous qui décidez." },
  ];

  const requirements = [
    { icon: Wifi,       label: 'Connexion internet' },
    { icon: Bike,       label: 'Moto' },
    { icon: Smartphone, label: 'Smartphone' },
  ];

  const faqs = [
    { q: 'Comment devenir livreur SpeedMeal ?',              a: 'Cliquez sur "Rejoignez-nous", remplissez le formulaire. Notre équipe vous contactera sous 48h.' },
    { q: 'Quel véhicule puis-je utiliser ?',                 a: 'Vélo, scooter, moto ou voiture — tous acceptés selon votre ville.' },
    { q: 'Comment suis-je payé(e) ?',                       a: "Virement bancaire chaque semaine. Suivez vos gains en temps réel dans l'application." },
    { q: 'Faut-il une expérience préalable ?',               a: "Aucune expérience requise. Nous vous formons gratuitement dès votre validation." },
    { q: "Y a-t-il une assurance pendant les livraisons ?", a: "Oui, une couverture accidents est incluse pendant toutes vos livraisons actives." },
  ];

  return (
    <div style={{ background: '#fff', minHeight: '100vh', paddingTop: '110px' }}>
      <SignupModal isOpen={modalOpen} onClose={() => setModalOpen(false)} />

      {/* ── HERO ── */}
      <section style={{
        position: 'relative',
        height: '400px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
      }}>
        {/* Background image */}
        <img
          src={heroDelivery}
          alt=""
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center 30%' }}
          onError={e => { e.target.parentElement.style.background = 'linear-gradient(145deg,#A51C1C,#7a1010)'; e.target.style.display = 'none'; }}
        />
        {/* Dark overlay */}
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.52)' }} />

        {/* Content — centered */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          style={{ position: 'relative', zIndex: 2, textAlign: 'center', padding: '0 20px' }}
        >
          <h1 style={{ fontSize: 'clamp(28px, 5vw, 52px)', fontWeight: '950', color: '#fff', lineHeight: 1.15, marginBottom: '28px', letterSpacing: '-1px' }}>
            Rejoignez SpeedMeal<br />en tant que <span style={{ color: '#FFC244' }}>livreur</span>
          </h1>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => setModalOpen(true)}
            style={{ background: '#fff', color: '#111', padding: '16px 44px', borderRadius: '999px', border: 'none', fontWeight: '900', fontSize: '16px', cursor: 'pointer', boxShadow: '0 8px 30px rgba(0,0,0,0.3)' }}
          >
            Rejoignez-nous
          </motion.button>
        </motion.div>
      </section>

      {/* ── PERKS ── */}
      <section style={{ padding: '90px 40px', background: '#fff' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} style={{ textAlign: 'center', marginBottom: '60px' }}>
            <h2 style={{ fontSize: 'clamp(26px, 4vw, 44px)', fontWeight: '950', color: '#111', marginBottom: '12px' }}>
              Pourquoi livrer avec <span style={{ color: '#A51C1C' }}>SpeedMeal ?</span>
            </h2>
            <p style={{ color: '#999', fontSize: '16px', maxWidth: '460px', margin: '0 auto' }}>Des avantages concrets pour chaque livreur de notre communauté.</p>
          </motion.div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: '24px' }}>
            {perks.map(({ icon: Icon, title, desc }, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}
                whileHover={{ y: -6 }}
                style={{ background: '#fff', border: '1.5px solid #f0f0f0', borderRadius: '22px', padding: '35px 28px', textAlign: 'center', boxShadow: '0 6px 20px rgba(0,0,0,0.04)', transition: 'all 0.3s' }}>
                <div style={{ width: '64px', height: '64px', borderRadius: '18px', background: '#FFF4E5', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 18px', color: '#FFC244' }}>
                  <Icon size={30} />
                </div>
                <h4 style={{ fontSize: '16px', fontWeight: '800', color: '#111', marginBottom: '8px' }}>{title}</h4>
                <p style={{ color: '#999', fontSize: '13px', lineHeight: '1.6' }}>{desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── REQUIREMENTS ── */}
      <section style={{ padding: '70px 40px', background: '#f8f5f0' }}>
        <div style={{ maxWidth: '700px', margin: '0 auto', textAlign: 'center' }}>
          <motion.h2 initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            style={{ fontSize: 'clamp(24px, 3vw, 38px)', fontWeight: '950', color: '#111', marginBottom: '48px' }}>
            Tout ce qu'il vous faut
          </motion.h2>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '20px', flexWrap: 'wrap' }}>
            {requirements.map(({ icon: Icon, label }, i) => (
              <motion.div key={i} initial={{ opacity: 0, scale: 0.9 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}
                style={{ background: '#fff', borderRadius: '20px', padding: '28px 32px', minWidth: '140px', textAlign: 'center', boxShadow: '0 4px 20px rgba(0,0,0,0.06)' }}>
                <div style={{ width: '60px', height: '60px', borderRadius: '50%', background: '#FFF4E5', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px', color: '#FFC244' }}>
                  <Icon size={26} />
                </div>
                <p style={{ fontWeight: '700', fontSize: '14px', color: '#333' }}>{label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section style={{ padding: '90px 40px', background: '#fff9e6' }}>
        <div style={{ maxWidth: '960px', margin: '0 auto', textAlign: 'center' }}>
          <motion.h2 initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            style={{ fontSize: 'clamp(26px, 4vw, 44px)', fontWeight: '950', color: '#111', marginBottom: '60px' }}>
            Comment ça <span style={{ color: '#A51C1C' }}>fonctionne ?</span>
          </motion.h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '40px' }}>
            {[
              { step: '01', title: 'Inscrivez-vous',       desc: 'Cliquez sur "Rejoignez-nous" et remplissez le formulaire.' },
              { step: '02', title: 'Validation',           desc: 'Notre équipe vérifie votre profil sous 48h.' },
              { step: '03', title: 'Recevez des commandes',desc: 'Acceptez les livraisons près de chez vous.' },
              { step: '04', title: 'Soyez payé(e)',        desc: 'Virement automatique chaque semaine.' },
            ].map(({ step, title, desc }, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.12 }}>
                <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: '#A51C1C', color: '#fff', fontSize: '15px', fontWeight: '900', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px', boxShadow: '0 8px 20px rgba(165,28,28,0.3)' }}>{step}</div>
                <h4 style={{ fontSize: '15px', fontWeight: '800', color: '#111', marginBottom: '8px' }}>{title}</h4>
                <p style={{ fontSize: '13px', color: '#999', lineHeight: '1.6' }}>{desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section style={{ padding: '90px 40px', background: '#fff' }}>
        <div style={{ maxWidth: '720px', margin: '0 auto' }}>
          <motion.h2 initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            style={{ fontSize: 'clamp(26px, 4vw, 40px)', fontWeight: '950', color: '#111', textAlign: 'center', marginBottom: '50px' }}>
            Questions <span style={{ color: '#A51C1C' }}>fréquentes</span>
          </motion.h2>
          {faqs.map(({ q, a }, i) => <FAQItem key={i} question={q} answer={a} />)}
        </div>
      </section>

      {/* ── SUPPORT ── */}
      <section style={{ padding: '70px 40px', background: '#fafafa', borderTop: '1px solid #f0f0f0' }}>
        <div style={{ maxWidth: '780px', margin: '0 auto', textAlign: 'center' }}>
          <motion.h2 initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            style={{ fontSize: 'clamp(20px, 3vw, 34px)', fontWeight: '950', color: '#111', marginBottom: '10px' }}>
            Vous avez des questions ou besoin d'aide ?
          </motion.h2>
          <p style={{ color: '#999', fontSize: '14px', marginBottom: '36px' }}>Notre équipe est disponible 7j/7.</p>
          <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap' }}>
            {[
              { icon: Mail,      label: 'Contactez-nous par e-mail', sub: 'contact@speedmeal.ma' },
              { icon: PhoneIcon, label: "Depuis l'application",      sub: 'Contactez notre support' },
            ].map(({ icon: Icon, label, sub }, i) => (
              <motion.div key={i} whileHover={{ y: -4, boxShadow: '0 12px 35px rgba(0,0,0,0.08)' }}
                style={{ display: 'flex', alignItems: 'center', gap: '14px', background: '#fff', border: '1.5px solid #eee', borderRadius: '16px', padding: '18px 24px', cursor: 'pointer', transition: 'all 0.3s', minWidth: '250px' }}>
                <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: 'rgba(165,28,28,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#A51C1C', flexShrink: 0 }}>
                  <Icon size={20} />
                </div>
                <div style={{ textAlign: 'left' }}>
                  <p style={{ fontWeight: '700', fontSize: '13px', color: '#111', marginBottom: '2px' }}>{label}</p>
                  <p style={{ fontSize: '12px', color: '#A51C1C', fontWeight: '600' }}>{sub}</p>
                </div>
                <ChevronDown size={14} color="#ccc" style={{ transform: 'rotate(-90deg)', marginLeft: 'auto' }} />
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default Delivery;
