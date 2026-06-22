import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, User, Mail, Lock, Phone, MapPin, Eye, EyeOff } from 'lucide-react';
import axios from 'axios';
import logoUrl from '../assets/logo.png';

import API_BASE_URL from '../config/api';

const API = `${API_BASE_URL}/auth`;

const inp = {
  width:'100%', padding:'14px 16px 14px 44px', borderRadius:'14px',
  border:'1.5px solid #f0f0f0', fontSize:'15px', fontWeight:'500',
  outline:'none', background:'#fafafa', color:'#111',
  boxSizing:'border-box', transition:'all 0.2s',
};
const focus = e => { e.target.style.borderColor='#A51C1C'; e.target.style.background='#fff'; e.target.style.boxShadow='0 0 0 4px rgba(165,28,28,0.06)'; };
const blur  = e => { e.target.style.borderColor='#f0f0f0'; e.target.style.background='#fafafa'; e.target.style.boxShadow='none'; };
const iconStyle = { position:'absolute', left:'14px', top:'50%', transform:'translateY(-50%)', color:'#bbb' };

const Field = React.memo(function Field({
  icon,
  type = 'text',
  placeholder,
  value,
  onChange,
  rightEl,
  showPass,
  togglePass,
}) {
  return (
    <div style={{ position:'relative' }}>
      <span style={iconStyle}>{icon}</span>
      <input
        type={rightEl ? (showPass ? 'text' : 'password') : type}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        style={{ ...inp, ...(rightEl && { paddingRight:'46px' }) }}
        onFocus={focus}
        onBlur={blur}
      />
      {rightEl && (
        <button
          type="button"
          onClick={togglePass}
          style={{ position:'absolute', right:'14px', top:'50%', transform:'translateY(-50%)', background:'none', border:'none', cursor:'pointer', color:'#aaa', display:'flex' }}
        >
          {showPass ? <EyeOff size={17} /> : <Eye size={17} />}
        </button>
      )}
    </div>
  );
});

export default function Signup() {
  const [form, setForm]       = useState({ name:'', email:'', password:'', phone:'', address:'' });
  const [showPass, setShowPass] = useState(false);
  const [error, setError]     = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

  const handleSignup = async (e) => {
    e.preventDefault();
    setError('');
    if (!form.name || !form.email || !form.password || !form.phone) {
      setError('Nom, email, mot de passe et téléphone sont obligatoires.');
      return;
    }
    setLoading(true);
    try {
      const { data } = await axios.post(`${API}/register`, {
        name: form.name, email: form.email, password: form.password,
        phone: form.phone || null, address: form.address || null, role: 'client',
      });
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur lors de l\'inscription.');
    }
    setLoading(false);
  };

  return (
    <div style={{ minHeight:'100vh', display:'flex', flexDirection:'column', background:'#fff', position:'relative', overflow:'hidden' }}>
      <div style={{ position:'absolute', top:'-100px', right:'-100px', width:'400px', height:'400px', background:'radial-gradient(circle, rgba(165,28,28,0.04) 0%, transparent 70%)', borderRadius:'50%', zIndex:0 }} />

      <div style={{ padding:'30px 0 0 30px', position:'relative', zIndex:10 }}>
        <button onClick={() => navigate('/')} style={{ background:'#fff', border:'1px solid #eee', cursor:'pointer', padding:'12px', display:'flex', alignItems:'center', justifyContent:'center', borderRadius:'50%', boxShadow:'0 4px 12px rgba(0,0,0,0.05)' }}>
          <ArrowLeft size={22} strokeWidth={2.5} />
        </button>
      </div>

      <div style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', padding:'20px 20px 40px', position:'relative', zIndex:1 }}>
        <motion.div initial={{ opacity:0, scale:0.95 }} animate={{ opacity:1, scale:1 }} transition={{ duration:0.4 }}
          style={{ width:'100%', maxWidth:'460px', background:'#fff', padding:'44px 40px', borderRadius:'32px', border:'1px solid #f2f2f2', boxShadow:'0 25px 60px -15px rgba(0,0,0,0.07)' }}>

          <div style={{ textAlign:'center', marginBottom:'24px' }}>
            <img src={logoUrl} alt="SpeedMeal" style={{ height:'80px', objectFit:'contain' }} />
          </div>

          <h2 style={{ fontSize:'26px', fontWeight:'900', color:'#111', marginBottom:'6px', textAlign:'center', letterSpacing:'-0.5px' }}>Créer un compte</h2>
          <p style={{ color:'#888', textAlign:'center', marginBottom:'24px', fontSize:'14px' }}>Rejoignez SpeedMeal aujourd'hui</p>

          <form onSubmit={handleSignup} style={{ display:'flex', flexDirection:'column', gap:'13px' }}>
            <Field icon={<User size={16} />}  placeholder="Nom complet *" value={form.name} onChange={set('name')} />
            <Field icon={<Mail size={16} />}  type="email" placeholder="Email *" value={form.email} onChange={set('email')} />
            <Field icon={<Lock size={16} />}  placeholder="Mot de passe *" value={form.password} onChange={set('password')} rightEl={true} showPass={showPass} togglePass={() => setShowPass(v => !v)} />
            <Field icon={<Phone size={16} />} type="tel" placeholder="Téléphone *" value={form.phone} onChange={set('phone')} />
            <Field icon={<MapPin size={16} />} placeholder="Adresse (optionnel)" value={form.address} onChange={set('address')} />

            {error && (
              <div style={{ background:'#fff0f0', border:'1px solid #fca5a5', borderRadius:'12px', padding:'12px 16px', color:'#b91c1c', fontSize:'14px', fontWeight:'600' }}>
                {error}
              </div>
            )}

            <motion.button whileHover={{ y:-2 }} whileTap={{ scale:0.97 }} type="submit" disabled={loading}
              style={{ width:'100%', padding:'17px', borderRadius:'16px', border:'none', background: loading ? '#c97a7a' : '#A51C1C', color:'#fff', fontWeight:'800', fontSize:'15px', cursor: loading ? 'not-allowed' : 'pointer', boxShadow:'0 10px 25px rgba(165,28,28,0.22)', marginTop:'4px' }}>
              {loading ? 'Création...' : 'Créer mon compte'}
            </motion.button>
          </form>

          <p style={{ textAlign:'center', marginTop:'24px', color:'#777', fontSize:'14px' }}>
            Déjà un compte ?{' '}
            <Link to="/login" style={{ color:'#A51C1C', fontWeight:'800', textDecoration:'none' }}>Se connecter</Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
