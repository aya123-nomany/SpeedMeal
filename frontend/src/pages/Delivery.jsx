import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bike, DollarSign, Clock, Shield, ChevronDown,
  CheckCircle, Star, Zap, Wifi, Smartphone, X,
  Mail, Phone as PhoneIcon, MapPin, Car, Wrench,
  Camera, Check
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import heroDelivery from '../assets/food.jpg';
import SectionTitle from '../components/SectionTitle';

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
const inputBase = (hasErr) => ({
  width: '100%', padding: '14px 16px', borderRadius: '10px',
  border: `1.5px solid ${hasErr ? '#ef4444' : 'rgba(255,255,255,0.12)'}`,
  background: 'rgba(255,255,255,0.06)', color: '#fff',
  fontSize: '14px', fontWeight: '500', outline: 'none',
  boxSizing: 'border-box', transition: 'border-color 0.2s',
});

const Field = React.memo(({ value, onChange, error, type = 'text', placeholder }) => (
  <div style={{ flex: 1 }}>
    <label style={{ fontSize: '12px', fontWeight: '700', color: 'rgba(255,255,255,0.5)', display: 'block', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
      {placeholder} <span style={{ color: '#ef4444' }}>*</span>
    </label>
    <input type={type} placeholder={placeholder} value={value} onChange={onChange}
      style={inputBase(error)}
      onFocus={e => { e.target.style.borderColor = '#A51C1C'; e.target.style.background = 'rgba(165,28,28,0.1)'; }}
      onBlur={e => { e.target.style.borderColor = error ? '#ef4444' : 'rgba(255,255,255,0.12)'; e.target.style.background = 'rgba(255,255,255,0.06)'; }}
    />
    {error && <p style={{ color: '#ef4444', fontSize: '11px', marginTop: '4px' }}>{error}</p>}
  </div>
), (prevProps, nextProps) => {
  return prevProps.error === nextProps.error && prevProps.placeholder === nextProps.placeholder && prevProps.value === nextProps.value;
});

const SelectField = React.memo(({ value, onChange, error, placeholder, options }) => {
  const [isOpen, setIsOpen] = useState(false);
  const selected = options.find(o => o.value === value);
  const hasIcons = options[0]?.icon;

  if (hasIcons) {
    return (
      <div style={{ flex: 1 }}>
        <label style={{ fontSize: '12px', fontWeight: '700', color: 'rgba(255,255,255,0.5)', display: 'block', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
          {placeholder} <span style={{ color: '#ef4444' }}>*</span>
        </label>
        <div style={{ position: 'relative' }}>
          <div onClick={() => setIsOpen(!isOpen)}
            style={{ ...inputBase(error), cursor: 'pointer', paddingRight: '36px', display: 'flex', alignItems: 'center', gap: '10px' }}
          >
            {hasIcons && selected ? <selected.icon size={18} color="#fff" /> : null}
            {selected ? <span>{selected.label}</span> : <span style={{ color: 'rgba(255,255,255,0.35)' }}>Veuillez sélectionner</span>}
            <ChevronDown size={16} color="rgba(255,255,255,0.4)" style={{ marginLeft: 'auto' }} />
          </div>
          {isOpen && (
            <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: '#1a1a1a', borderRadius: '10px', marginTop: '4px', border: '1px solid rgba(255,255,255,0.1)', zIndex: 10, maxHeight: '200px', overflowY: 'auto' }}>
              {options.map(o => (
                <div key={o.value} onClick={(e) => { e.stopPropagation(); onChange(o.value); setIsOpen(false); }}
                  style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', color: '#fff', '&:hover': { background: 'rgba(255,255,255,0.05)' } }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  <o.icon size={18} color="#fff" />
                  {o.label}
                </div>
              ))}
            </div>
          )}
        </div>
        {error && <p style={{ color: '#ef4444', fontSize: '11px', marginTop: '4px' }}>{error}</p>}
      </div>
    );
  }

  return (
    <div style={{ flex: 1 }}>
      <label style={{ fontSize: '12px', fontWeight: '700', color: 'rgba(255,255,255,0.5)', display: 'block', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
        {placeholder} <span style={{ color: '#ef4444' }}>*</span>
      </label>
      <div style={{ position: 'relative' }}>
        <select value={value} onChange={(e) => onChange(e.target.value)}
          style={{ ...inputBase(error), appearance: 'none', cursor: 'pointer', paddingRight: '36px', color: value ? '#fff' : 'rgba(255,255,255,0.35)' }}
          onFocus={e => { e.target.style.borderColor = '#A51C1C'; }}
          onBlur={e => { e.target.style.borderColor = error ? '#ef4444' : 'rgba(255,255,255,0.12)'; }}
        >
          <option value="" style={{ background: '#1a1a1a' }}>Veuillez sélectionner</option>
          {options.map(o => <option key={o.value} value={o.value} style={{ background: '#1a1a1a' }}>{o.label}</option>)}
        </select>
        <ChevronDown size={16} color="rgba(255,255,255,0.4)" style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
      </div>
      {error && <p style={{ color: '#ef4444', fontSize: '11px', marginTop: '4px' }}>{error}</p>}
    </div>
  );
}, (prevProps, nextProps) => {
  return prevProps.error === nextProps.error && prevProps.placeholder === nextProps.placeholder && prevProps.value === nextProps.value;
});

const RadioField = React.memo(({ value, onChange, error, label }) => {
  return (
    <div>
      <label style={{ fontSize: '12px', fontWeight: '700', color: 'rgba(255,255,255,0.5)', display: 'block', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
        {label} <span style={{ color: '#ef4444' }}>*</span>
      </label>
      <div style={{ display: 'flex', gap: '10px' }}>
        {['Oui', 'Non'].map(val => (
          <label key={val} style={{
            flex: 1, display: 'flex', alignItems: 'center', gap: '10px',
            padding: '10px 14px', borderRadius: '8px', cursor: 'pointer',
            border: `1.5px solid ${value === val ? '#A51C1C' : 'rgba(255,255,255,0.12)'}`,
            background: value === val ? 'rgba(165,28,28,0.15)' : 'rgba(255,255,255,0.06)',
            color: '#fff', fontSize: '14px', fontWeight: '600',
            transition: 'all 0.2s'
          }}
          onMouseEnter={e => e.currentTarget.style.background = value === val ? 'rgba(165,28,28,0.2)' : 'rgba(255,255,255,0.1)'}
          onMouseLeave={e => e.currentTarget.style.background = value === val ? 'rgba(165,28,28,0.15)' : 'rgba(255,255,255,0.06)'}
          >
            <input type="radio" name={label} value={val} checked={value === val} onChange={() => onChange(val)} style={{ display: 'none' }} />
            <div style={{ width: '16px', height: '16px', borderRadius: '50%', border: `2px solid ${value === val ? '#A51C1C' : 'rgba(255,255,255,0.25)'}`, background: value === val ? '#A51C1C' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              {value === val && <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#fff' }} />}
            </div>
            {val}
          </label>
        ))}
      </div>
      {error && <p style={{ color: '#ef4444', fontSize: '11px', marginTop: '4px' }}>{error}</p>}
    </div>
  );
}, (prevProps, nextProps) => {
  return prevProps.error === nextProps.error && prevProps.label === nextProps.label && prevProps.value === nextProps.value;
});

/* ─── IMAGE UPLOAD FIELD ─── */
const ImageUploadField = React.memo(({ value, onChange, error, label }) => {
  const inputRef = React.useRef();

  const handleFile = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { alert('Image trop grande (max 5 Mo)'); return; }
    const reader = new FileReader();
    reader.onload = (ev) => onChange(ev.target.result);
    reader.readAsDataURL(file);
  };

  return (
    <div>
      <label style={{ fontSize: '12px', fontWeight: '700', color: 'rgba(255,255,255,0.5)', display: 'block', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
        {label} <span style={{ color: '#ef4444' }}>*</span>
      </label>
      <div
        onClick={() => inputRef.current.click()}
        style={{
          border: `2px dashed ${error ? '#ef4444' : value ? '#A51C1C' : 'rgba(255,255,255,0.15)'}`,
          borderRadius: '12px', cursor: 'pointer', overflow: 'hidden',
          transition: 'border-color 0.2s, background 0.2s',
          background: value ? 'transparent' : 'rgba(255,255,255,0.03)',
          minHeight: '120px', display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}
        onMouseEnter={e => { if (!value) e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; }}
        onMouseLeave={e => { if (!value) e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; }}
      >
        {value ? (
          <div style={{ position: 'relative', width: '100%' }}>
            <img src={value} alt="Preview" style={{ width: '100%', height: '160px', objectFit: 'cover', display: 'block', borderRadius: '10px' }} />
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onChange(''); }}
              style={{ position: 'absolute', top: '8px', right: '8px', width: '28px', height: '28px', borderRadius: '50%', background: 'rgba(0,0,0,0.6)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}
            >
              <X size={14} color="#fff"/>
            </button>
            <div style={{ position: 'absolute', bottom: '8px', left: '8px', background: 'rgba(165,28,28,0.85)', borderRadius: '6px', padding: '3px 10px', fontSize: '11px', color: '#fff', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Check size={11} color="#fff"/> Image sélectionnée
            </div>
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '24px 16px' }}>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '8px' }}>
              <Camera size={32} color="rgba(255,255,255,0.4)"/>
            </div>
            <p style={{ margin: 0, color: 'rgba(255,255,255,0.5)', fontSize: '13px', fontWeight: '600' }}>Cliquez pour ajouter votre photo de visage</p>
            <p style={{ margin: '4px 0 0', color: 'rgba(255,255,255,0.25)', fontSize: '11px' }}>JPG, PNG — max 5 Mo</p>
          </div>
        )}
      </div>
      <input ref={inputRef} type="file" accept="image/*" onChange={handleFile} style={{ display: 'none' }} />
      {error && <p style={{ color: '#ef4444', fontSize: '11px', marginTop: '4px' }}>{error}</p>}
    </div>
  );
});

const SignupModal = ({ isOpen, onClose }) => {
  const [form, setForm] = useState({
    name: '', email: '', password: '', phone: '', city: '', vehicle: '',
    license: '', insurance: '', face_photo: '', accept: false,
  });
  const [errors, setErrors] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const set = useCallback((key, val) => {
    setForm(f => ({ ...f, [key]: val }));
    setErrors(e => ({ ...e, [key]: '' }));
  }, []);

  const validate = () => {
    const e = {};
    if (!form.name.trim())      e.name      = 'Requis';
    if (!form.email.trim())     e.email     = 'Requis';
    if (!form.password.trim())  e.password  = 'Requis';
    if (!form.phone.trim())     e.phone     = 'Requis';
    if (!form.city)             e.city      = 'Requis';
    if (!form.vehicle)          e.vehicle   = 'Requis';
    if (!form.license)          e.license   = 'Répondez';
    if (!form.insurance)        e.insurance = 'Répondez';
    if (!form.face_photo)       e.face_photo = 'Photo de visage requise';
    if (!form.accept)           e.accept    = 'Veuillez accepter';
    return e;
  };

  const handleSubmit = async (ev) => {
    ev.preventDefault();
    
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setLoading(true);
    try {
      await axios.post('https://speedmeal.ayaennoamany.workers.dev/api/auth/register', {
        name: form.name,
        email: form.email,
        password: form.password,
        role: 'delivery',
        phone: form.phone,
        address: form.city,
        vehicle: form.vehicle,
        license: form.license,
        insurance: form.insurance,
        face_photo: form.face_photo
      });
      setSubmitted(true);
    } catch (err) {
      setErrors({ submit: err.response?.data?.message || 'Erreur lors de l\'inscription' });
    }
    setLoading(false);
  };

  const cities = [
    'Casablanca', 'Rabat', 'Marrakech', 'Fès', 'Tanger', 'Agadir', 'Meknès', 'Oujda', 'Kenitra', 'Tétouan',
    'Salé', 'Nador', 'Safi', 'Mohammedia', 'Khouribga', 'El Jadida', 'Beni Mellal', 'Taza', 'Khemisset', 'Larache',
    'Guelmim', 'Berrechid', 'Taourirt', 'Taroudant', 'Ouarzazate', 'Dakhla', 'Laâyoune', 'Al Hoceima', 'Tiznit', 'Ifrane',
    'Azrou', 'Chefchaouen', 'Essaouira', 'Asilah', 'El Kelaa des Sraghna', 'Sidi Slimane', 'Sidi Kacem', 'Berkane', 'Errachidia', 'Midelt',
    'Tinghir', 'Zagora', 'Tan-Tan', 'Sidi Ifni', 'Tarfaya', 'Boujdour', 'Smara', 'Khenifra', 'Fnideq', 'M\'diq', 'Martil'
  ].map(c => ({ value: c, label: c }));
  const vehicles = [
    { value: 'velo', label: 'Vélo', icon: Bike },
    { value: 'scooter', label: 'Scooter / Moto', icon: Wrench },
    { value: 'voiture', label: 'Voiture', icon: Car },
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          onClick={onClose}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)', zIndex: 9000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}
        >
          <motion.div
            initial={{ scale: 0.92, opacity: 0, y: 30 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.92, opacity: 0, y: 30 }}
            transition={{ type: 'spring', damping: 28, stiffness: 300 }}
            onClick={e => e.stopPropagation()}
            style={{ width: '100%', maxWidth: '600px', background: '#1a1a1a', borderRadius: '20px', padding: '40px', position: 'relative', boxShadow: '0 40px 100px rgba(0,0,0,0.6)', border: '1px solid rgba(255,255,255,0.06)', maxHeight: '90vh', overflowY: 'auto' }}
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
                <button onClick={() => { setSubmitted(false); setForm({ name: '', email: '', password: '', phone: '', city: '', vehicle: '', license: '', insurance: '', face_photo: '', accept: false }); setErrors({}); }}
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

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <Field value={form.name} onChange={(e) => set('name', e.target.value)} error={errors.name} placeholder="Nom complet" />
                  <Field value={form.email} onChange={(e) => set('email', e.target.value)} error={errors.email} type="email" placeholder="Adresse e-mail" />
                  <Field value={form.password} onChange={(e) => set('password', e.target.value)} error={errors.password} type="password" placeholder="Mot de passe" />
                  <Field value={form.phone} onChange={(e) => set('phone', e.target.value)} error={errors.phone} type="tel" placeholder="Numéro de téléphone" />

                  <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                    <SelectField value={form.city} onChange={(val) => set('city', val)} error={errors.city} placeholder="Ville" options={cities} />
                    <SelectField value={form.vehicle} onChange={(val) => set('vehicle', val)} error={errors.vehicle} placeholder="Type de véhicule" options={vehicles} />
                  </div>

                  <RadioField value={form.license} onChange={(val) => set('license', val)} error={errors.license} label="Avez-vous un permis de conduire ?" />
                  <RadioField value={form.insurance} onChange={(val) => set('insurance', val)} error={errors.insurance} label="Avez-vous une assurance pour le véhicule ?" />

                  <ImageUploadField
                    value={form.face_photo}
                    onChange={(val) => set('face_photo', val)}
                    error={errors.face_photo}
                    label="Photo de votre visage"
                  />

                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', paddingTop: '4px' }}>
                    <div onClick={() => set('accept', !form.accept)}
                      style={{ width: '18px', height: '18px', borderRadius: '5px', flexShrink: 0, marginTop: '1px', cursor: 'pointer', border: `2px solid ${errors.accept ? '#ef4444' : form.accept ? '#A51C1C' : 'rgba(255,255,255,0.25)'}`, background: form.accept ? '#A51C1C' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s' }}>
                      {form.accept && <CheckCircle size={12} color="#fff" />}
                    </div>
                    <label onClick={() => set('accept', !form.accept)} style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)', cursor: 'pointer', lineHeight: '1.5' }}>
                      J'accepte les <span style={{ color: '#A51C1C', fontWeight: '700' }}>conditions</span> et <span style={{ color: '#A51C1C', fontWeight: '700' }}>politique</span>
                    </label>
                  </div>
                  {errors.accept && <p style={{ color: '#ef4444', fontSize: '11px', marginTop: '-8px' }}>{errors.accept}</p>}
                  {errors.submit && <p style={{ color: '#ef4444', fontSize: '12px', marginTop: '2px' }}>{errors.submit}</p>}

                  <motion.button whileHover={{ y: -2 }} whileTap={{ scale: 0.97 }} type="submit" disabled={loading}
                    style={{ width: '100%', background: loading ? '#c97a7a' : '#A51C1C', color: '#fff', padding: '16px', borderRadius: '12px', border: 'none', fontWeight: '800', fontSize: '16px', cursor: loading ? 'not-allowed' : 'pointer', marginTop: '4px', boxShadow: '0 8px 25px rgba(165,28,28,0.4)' }}>
                    {loading ? 'Envoi...' : 'Envoyer'}
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
          <SectionTitle
            title="Rejoignez SpeedMeal"
            subtitle="Devenez livreur et gagnez votre indépendance"
            dark={true}
          />
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
