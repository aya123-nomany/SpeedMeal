import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronDown, CheckCircle, Store, TrendingUp, Users,
  FileText, Smartphone, CreditCard, X, Star, ArrowRight,
  Mail, Phone as PhoneIcon
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import img1 from '../assets/smile.jpg';
import img2 from '../assets/2.jpeg';
import img3 from '../assets/3.jpeg';
import partnerHero from '../assets/télécharger.png';

/* ─── FAQ ─── */
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

/* ─── SIGNUP MODAL ─── */
const SignupModal = ({ isOpen, onClose }) => {
  const [form, setForm] = useState({ business: '', name: '', email: '', phone: '', city: '', type: '', accept: false });
  const [errors, setErrors] = useState({});
  const [submitted, setSubmitted] = useState(false);

  const set = (k, v) => { setForm(f => ({ ...f, [k]: v })); setErrors(e => ({ ...e, [k]: '' })); };

  const validate = () => {
    const e = {};
    if (!form.business.trim()) e.business = 'Requis';
    if (!form.name.trim())     e.name     = 'Requis';
    if (!form.email.trim())    e.email    = 'Requis';
    if (!form.phone.trim())    e.phone    = 'Requis';
    if (!form.city)            e.city     = 'Requis';
    if (!form.type)            e.type     = 'Requis';
    if (!form.accept)          e.accept   = 'Veuillez accepter';
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
          onBlur={e => { e.target.style.borderColor = errors[fkey] ? '#ef4444' : 'rgba(255,255,255,0.12)'; }}>
          <option value="" style={{ background: '#1a1a1a' }}>Sélectionner</option>
          {options.map(o => <option key={o.value} value={o.value} style={{ background: '#1a1a1a' }}>{o.label}</option>)}
        </select>
        <ChevronDown size={16} color="rgba(255,255,255,0.4)" style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
      </div>
      {errors[fkey] && <p style={{ color: '#ef4444', fontSize: '11px', marginTop: '4px' }}>{errors[fkey]}</p>}
    </div>
  );

  const cities = ['Casablanca','Rabat','Marrakech','Fès','Tanger','Agadir','Meknès','Oujda','Kenitra','Tétouan'].map(c => ({ value: c, label: c }));
  const types  = [
    { value: 'restaurant',  label: '🍽️ Restaurant' },
    { value: 'cafe',        label: '☕ Café' },
    { value: 'patisserie',  label: '🥐 Pâtisserie' },
    { value: 'snack',       label: '🌮 Snack' },
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          onClick={onClose}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)', zIndex: 9000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', overflowY: 'auto' }}>
          <motion.div initial={{ scale: 0.92, opacity: 0, y: 30 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.92, opacity: 0, y: 30 }}
            transition={{ type: 'spring', damping: 28, stiffness: 300 }}
            onClick={e => e.stopPropagation()}
            style={{ width: '100%', maxWidth: '580px', background: '#1a1a1a', borderRadius: '24px', padding: '40px', position: 'relative', boxShadow: '0 40px 100px rgba(0,0,0,0.6)', border: '1px solid rgba(255,255,255,0.06)' }}>

            <button onClick={onClose}
              style={{ position: 'absolute', top: '20px', right: '20px', background: 'rgba(255,255,255,0.08)', border: 'none', borderRadius: '50%', width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.15)'}
              onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.08)'}>
              <X size={18} color="#fff" />
            </button>

            {submitted ? (
              <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} style={{ textAlign: 'center', padding: '20px 0' }}>
                <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'rgba(165,28,28,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
                  <CheckCircle size={44} color="#A51C1C" />
                </div>
                <h3 style={{ fontSize: '24px', fontWeight: '900', color: '#fff', marginBottom: '12px' }}>Demande envoyée !</h3>
                <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '15px', lineHeight: '1.7', marginBottom: '28px' }}>
                  Merci <strong style={{ color: '#fff' }}>{form.name}</strong> ! Notre équipe vous contactera au <strong style={{ color: '#fff' }}>{form.phone}</strong> dans les 48h.
                </p>
                <button onClick={() => { setSubmitted(false); setForm({ business: '', name: '', email: '', phone: '', city: '', type: '', accept: false }); setErrors({}); }}
                  style={{ background: '#A51C1C', color: '#fff', border: 'none', padding: '14px 32px', borderRadius: '999px', fontWeight: '800', cursor: 'pointer', fontSize: '15px' }}>
                  Nouvelle demande
                </button>
              </motion.div>
            ) : (
              <>
                <h2 style={{ fontSize: '22px', fontWeight: '900', color: '#fff', marginBottom: '4px' }}>Devenez partenaire SpeedMeal</h2>
                <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: '13px', lineHeight: '1.6', marginBottom: '28px' }}>
                  Rejoignez notre réseau et faites découvrir votre commerce à des milliers de clients.
                </p>
                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <Field fkey="business" placeholder="Nom du commerce" />
                  <Field fkey="name"     placeholder="Nom du responsable" />
                  <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                    <Field fkey="email" type="email" placeholder="Adresse e-mail" />
                    <Field fkey="phone" type="tel"   placeholder="Téléphone" />
                  </div>
                  <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                    <SelectField fkey="city" placeholder="Ville"              options={cities} />
                    <SelectField fkey="type" placeholder="Type de commerce"   options={types} />
                  </div>

                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', paddingTop: '4px' }}>
                    <div onClick={() => set('accept', !form.accept)}
                      style={{ width: '18px', height: '18px', borderRadius: '5px', flexShrink: 0, marginTop: '1px', cursor: 'pointer', border: `2px solid ${errors.accept ? '#ef4444' : form.accept ? '#A51C1C' : 'rgba(255,255,255,0.25)'}`, background: form.accept ? '#A51C1C' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s' }}>
                      {form.accept && <CheckCircle size={12} color="#fff" />}
                    </div>
                    <label onClick={() => set('accept', !form.accept)} style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)', cursor: 'pointer', lineHeight: '1.6' }}>
                      J'accepte les <span style={{ color: '#A51C1C', fontWeight: '700' }}>conditions d'utilisation</span> et la <span style={{ color: '#A51C1C', fontWeight: '700' }}>politique de confidentialité</span>.
                    </label>
                  </div>
                  {errors.accept && <p style={{ color: '#ef4444', fontSize: '11px', marginTop: '-8px' }}>{errors.accept}</p>}

                  <motion.button whileHover={{ y: -2 }} whileTap={{ scale: 0.97 }} type="submit"
                    style={{ width: '100%', background: '#A51C1C', color: '#fff', padding: '16px', borderRadius: '12px', border: 'none', fontWeight: '800', fontSize: '16px', cursor: 'pointer', marginTop: '4px', boxShadow: '0 8px 25px rgba(165,28,28,0.4)' }}>
                    Envoyer la demande →
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

/* ─── MAIN PAGE ─── */
const Partner = () => {
  const navigate = useNavigate();
  const [modalOpen, setModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState(0);

  const tabs = [
    {
      label: 'Croissance',
      icon: TrendingUp,
      img: img1,
      title: 'Vendez à de nouveaux clients hors de votre quartier',
      desc: 'Accédez à des milliers de nouveaux clients dans votre ville grâce à notre plateforme. Développez votre chiffre d\'affaires sans frais fixes supplémentaires.',
      points: ['Visibilité auprès de milliers d\'utilisateurs', 'Commandes en ligne 24h/24', 'Statistiques de vente en temps réel'],
    },
    {
      label: 'Flotte',
      icon: Users,
      img: img2,
      title: 'Profitez de notre réseau de livreurs',
      desc: 'Pas besoin de gérer votre propre flotte. Nos livreurs partenaires assurent la livraison rapide de vos commandes directement chez vos clients.',
      points: ['Livraison en moins de 45 minutes', 'Suivi GPS en temps réel', 'Assurance incluse sur chaque livraison'],
    },
    {
      label: 'Technologie',
      icon: Smartphone,
      img: img3,
      title: 'Un tableau de bord simple et puissant',
      desc: 'Gérez vos commandes, votre menu et vos promotions depuis une interface intuitive. Compatible mobile et desktop.',
      points: ['Gestion des commandes en temps réel', 'Mise à jour du menu instantanée', 'Rapports et analytiques détaillés'],
    },
  ];

  const docs = [
    { icon: FileText,    label: 'Registre de commerce' },
    { icon: CreditCard,  label: 'RIB bancaire' },
    { icon: Smartphone,  label: 'Photos du commerce' },
    { icon: FileText,    label: 'Carte d\'identité du gérant' },
  ];

  const faqs = [
    { q: 'Comment rejoindre SpeedMeal en tant que partenaire ?',   a: 'Remplissez le formulaire d\'inscription. Notre équipe vous contactera sous 48h pour finaliser votre dossier.' },
    { q: 'Quels sont les frais d\'inscription ?',                  a: 'L\'inscription est entièrement gratuite. Nous prélevons uniquement une commission sur les commandes livrées.' },
    { q: 'Comment les paiements sont-ils effectués ?',             a: 'Les paiements sont virés directement sur votre compte bancaire chaque semaine, sans délai.' },
    { q: 'Puis-je gérer mon menu moi-même ?',                      a: 'Oui, via votre tableau de bord partenaire vous pouvez modifier votre menu, vos prix et vos horaires à tout moment.' },
  ];

  return (
    <div style={{ background: '#fff', minHeight: '100vh', paddingTop: '110px' }}>
      <SignupModal isOpen={modalOpen} onClose={() => setModalOpen(false)} />

      {/* ── HERO ── */}
      <section style={{ position: 'relative', height: '400px', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', marginTop: '24px' }}>
        <img src={partnerHero} alt=""
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center' }}
          onError={e => { e.target.parentElement.style.background = 'linear-gradient(135deg,#A51C1C,#7a1010)'; e.target.style.display = 'none'; }}
        />
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.45)' }} />
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}
          style={{ position: 'relative', zIndex: 2, textAlign: 'center', padding: '0 20px' }}>
          <h1 style={{ fontSize: 'clamp(28px, 5vw, 52px)', fontWeight: '950', color: '#fff', lineHeight: 1.15, marginBottom: '28px', letterSpacing: '-1px' }}>
            Passez votre commerce<br />en ligne avec <span style={{ color: '#FFC244' }}>SpeedMeal</span>
          </h1>
          <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.97 }} onClick={() => setModalOpen(true)}
            style={{ background: '#fff', color: '#A51C1C', padding: '16px 44px', borderRadius: '999px', border: 'none', fontWeight: '900', fontSize: '16px', cursor: 'pointer', boxShadow: '0 8px 30px rgba(0,0,0,0.25)' }}>
            Commencer maintenant
          </motion.button>
        </motion.div>
      </section>

      {/* ── STATS ── */}
      <section style={{ padding: '60px 40px', background: '#fff' }}>
        <div style={{ maxWidth: '900px', margin: '0 auto', display: 'flex', justifyContent: 'center', gap: '60px', flexWrap: 'wrap', textAlign: 'center' }}>
          {[['500+', 'Restaurants partenaires'], ['50K+', 'Clients actifs'], ['48h', 'Délai d\'activation'], ['7j/7', 'Support dédié']].map(([n, l]) => (
            <motion.div key={l} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
              <div style={{ fontSize: '36px', fontWeight: '950', color: '#A51C1C' }}>{n}</div>
              <div style={{ fontSize: '13px', color: '#999', fontWeight: '600', marginTop: '4px' }}>{l}</div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── SOLUTIONS TABS ── */}
      <section style={{ padding: '80px 40px', background: '#f8f8f8' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} style={{ textAlign: 'center', marginBottom: '50px' }}>
            <h2 style={{ fontSize: 'clamp(26px, 4vw, 42px)', fontWeight: '950', color: '#111', marginBottom: '12px' }}>
              Trouvez la meilleure solution<br />pour votre <span style={{ color: '#A51C1C' }}>commerce</span>
            </h2>
          </motion.div>

          {/* Tab buttons */}
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', marginBottom: '50px', flexWrap: 'wrap' }}>
            {tabs.map(({ label, icon: Icon }, i) => (
              <button key={i} onClick={() => setActiveTab(i)}
                style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 28px', borderRadius: '999px', border: `2px solid ${activeTab === i ? '#A51C1C' : '#e0e0e0'}`, background: activeTab === i ? '#A51C1C' : '#fff', color: activeTab === i ? '#fff' : '#555', fontWeight: '700', fontSize: '14px', cursor: 'pointer', transition: 'all 0.2s' }}>
                <Icon size={16} />
                {label}
              </button>
            ))}
          </div>

          {/* Tab content */}
          <AnimatePresence mode="wait">
            <motion.div key={activeTab} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.3 }}
              style={{ display: 'flex', gap: '60px', alignItems: 'center', flexWrap: 'wrap' }}>
              <div style={{ flex: 1, minWidth: '280px' }}>
                <h3 style={{ fontSize: '26px', fontWeight: '900', color: '#111', marginBottom: '16px', lineHeight: 1.3 }}>{tabs[activeTab].title}</h3>
                <p style={{ color: '#666', fontSize: '15px', lineHeight: '1.7', marginBottom: '24px' }}>{tabs[activeTab].desc}</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {tabs[activeTab].points.map((p, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{ width: '22px', height: '22px', borderRadius: '50%', background: 'rgba(165,28,28,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <CheckCircle size={13} color="#A51C1C" />
                      </div>
                      <span style={{ fontSize: '14px', fontWeight: '600', color: '#444' }}>{p}</span>
                    </div>
                  ))}
                </div>
                <button onClick={() => setModalOpen(true)}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', marginTop: '30px', background: '#A51C1C', color: '#fff', padding: '14px 28px', borderRadius: '999px', border: 'none', fontWeight: '800', fontSize: '14px', cursor: 'pointer' }}>
                  Commencer <ArrowRight size={16} />
                </button>
              </div>
              <div style={{ flex: '0 0 380px', borderRadius: '24px', overflow: 'hidden', boxShadow: '0 10px 40px rgba(0,0,0,0.1)', minHeight: '260px' }}>
                <img src={tabs[activeTab].img} alt={tabs[activeTab].label}
                  style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', minHeight: '260px' }} />
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </section>

      {/* ── DOCS ── */}
      <section style={{ padding: '80px 40px', background: '#fff' }}>
        <div style={{ maxWidth: '900px', margin: '0 auto' }}>
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} style={{ textAlign: 'center', marginBottom: '50px' }}>
            <h2 style={{ fontSize: 'clamp(22px, 3vw, 36px)', fontWeight: '950', color: '#111', marginBottom: '12px' }}>
              Documents nécessaires pour devenir<br /><span style={{ color: '#A51C1C' }}>partenaire SpeedMeal</span>
            </h2>
            <p style={{ color: '#999', fontSize: '15px', maxWidth: '500px', margin: '0 auto' }}>
              Un dossier simple et rapide. Préparez ces documents et notre équipe s'occupe du reste.
            </p>
          </motion.div>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '20px', flexWrap: 'wrap' }}>
            {docs.map(({ icon: Icon, label }, i) => (
              <motion.div key={i} initial={{ opacity: 0, scale: 0.9 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}
                whileHover={{ y: -4 }}
                style={{ background: '#fff', border: '1.5px solid #f0f0f0', borderRadius: '20px', padding: '28px 24px', minWidth: '160px', textAlign: 'center', boxShadow: '0 4px 20px rgba(0,0,0,0.05)', transition: 'all 0.3s' }}>
                <div style={{ width: '56px', height: '56px', borderRadius: '16px', background: '#fff4e5', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px', color: '#FFC244' }}>
                  <Icon size={24} />
                </div>
                <p style={{ fontWeight: '700', fontSize: '13px', color: '#333', lineHeight: '1.4' }}>{label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA BAND ── */}
      <section style={{ padding: '70px 40px', background: 'linear-gradient(135deg, #A51C1C 0%, #7a1010 100%)', textAlign: 'center' }}>
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
          <Store size={44} color="#FFC244" style={{ marginBottom: '16px' }} />
          <h2 style={{ fontSize: 'clamp(22px, 3vw, 40px)', fontWeight: '950', color: '#fff', marginBottom: '12px' }}>
            Pas encore partenaire de SpeedMeal ?
          </h2>
          <p style={{ color: 'rgba(255,255,255,0.75)', fontSize: '16px', marginBottom: '30px' }}>
            Rejoignez des centaines de commerces qui développent leur activité avec nous.
          </p>
          <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.97 }} onClick={() => setModalOpen(true)}
            style={{ background: '#FFC244', color: '#111', padding: '18px 48px', borderRadius: '999px', border: 'none', fontWeight: '900', fontSize: '16px', cursor: 'pointer', boxShadow: '0 10px 30px rgba(255,194,68,0.4)' }}>
            Rejoignez-nous
          </motion.button>
        </motion.div>
      </section>

      {/* ── FAQ ── */}
      <section style={{ padding: '90px 40px', background: '#fff' }}>
        <div style={{ maxWidth: '740px', margin: '0 auto' }}>
          <motion.h2 initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            style={{ fontSize: 'clamp(24px, 3vw, 38px)', fontWeight: '950', color: '#111', textAlign: 'center', marginBottom: '50px' }}>
            Questions <span style={{ color: '#A51C1C' }}>fréquentes</span>
          </motion.h2>
          {faqs.map(({ q, a }, i) => <FAQItem key={i} question={q} answer={a} />)}
        </div>
      </section>

      {/* ── SUPPORT ── */}
      <section style={{ padding: '60px 40px', background: '#fafafa', borderTop: '1px solid #f0f0f0' }}>
        <div style={{ maxWidth: '780px', margin: '0 auto', textAlign: 'center' }}>
          <motion.h2 initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            style={{ fontSize: 'clamp(20px, 3vw, 32px)', fontWeight: '950', color: '#111', marginBottom: '10px' }}>
            Vous avez des questions ou besoin d'aide ?
          </motion.h2>
          <p style={{ color: '#999', fontSize: '14px', marginBottom: '32px' }}>Notre équipe est disponible 7j/7.</p>
          <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap' }}>
            {[
              { icon: Mail,      label: 'Contactez-nous par e-mail', sub: 'partenaires@speedmeal.ma' },
              { icon: PhoneIcon, label: "Depuis l'application",      sub: 'Contactez notre support' },
            ].map(({ icon: Icon, label, sub }, i) => (
              <motion.div key={i} whileHover={{ y: -4 }}
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

export default Partner;
