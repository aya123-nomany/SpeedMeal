import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, Lock, Eye, EyeOff, ArrowLeft } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import logoUrl from '../assets/logo.png';

const API = 'http://localhost:5000/api/auth';

export default function Login() {
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    if (!email || !password) { setError('Remplissez tous les champs.'); return; }
    setLoading(true);
    try {
      const { data } = await axios.post(`${API}/login`, { email, password });
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      const role = data.user.role;
      if (role === 'admin')       navigate('/admin');
      else if (role === 'restaurant') navigate('/restaurant-dashboard');
      else if (role === 'delivery')   navigate('/delivery-dashboard');
      else navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Identifiants incorrects.');
    }
    setLoading(false);
  };

  const inp = {
    width: '100%', padding: '16px 20px', borderRadius: '14px',
    border: '1.5px solid #f0f0f0', fontSize: '15px', fontWeight: '500',
    outline: 'none', background: '#fafafa', color: '#111',
    boxSizing: 'border-box', transition: 'all 0.2s',
  };
  const focus = e => { e.target.style.borderColor='#A51C1C'; e.target.style.background='#fff'; e.target.style.boxShadow='0 0 0 4px rgba(165,28,28,0.06)'; };
  const blur  = e => { e.target.style.borderColor='#f0f0f0'; e.target.style.background='#fafafa'; e.target.style.boxShadow='none'; };

  return (
    <div style={{ minHeight:'100vh', display:'flex', flexDirection:'column', background:'#fff', position:'relative', overflow:'hidden' }}>
      <div style={{ position:'absolute', top:'-100px', right:'-100px', width:'400px', height:'400px', background:'radial-gradient(circle, rgba(165,28,28,0.04) 0%, transparent 70%)', borderRadius:'50%', zIndex:0 }} />
      <div style={{ position:'absolute', bottom:'-150px', left:'-150px', width:'500px', height:'500px', background:'radial-gradient(circle, rgba(165,28,28,0.03) 0%, transparent 70%)', borderRadius:'50%', zIndex:0 }} />

      <div style={{ padding:'30px 0 0 30px', position:'relative', zIndex:10 }}>
        <button onClick={() => navigate('/')} style={{ background:'#fff', border:'1px solid #eee', cursor:'pointer', padding:'12px', display:'flex', alignItems:'center', justifyContent:'center', borderRadius:'50%', boxShadow:'0 4px 12px rgba(0,0,0,0.05)' }}>
          <ArrowLeft size={22} strokeWidth={2.5} />
        </button>
      </div>

      <div style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', padding:'20px', position:'relative', zIndex:1 }}>
        <motion.div initial={{ opacity:0, scale:0.95 }} animate={{ opacity:1, scale:1 }} transition={{ duration:0.4 }}
          style={{ width:'100%', maxWidth:'460px', background:'#fff', padding:'50px 40px', borderRadius:'32px', border:'1px solid #f2f2f2', boxShadow:'0 25px 60px -15px rgba(0,0,0,0.07)' }}>

          <div style={{ textAlign:'center', marginBottom:'32px' }}>
            <img src={logoUrl} alt="SpeedMeal" style={{ height:'90px', objectFit:'contain' }} />
          </div>

          <h2 style={{ fontSize:'28px', fontWeight:'900', color:'#111', marginBottom:'8px', textAlign:'center', letterSpacing:'-0.5px' }}>Bon retour !</h2>
          <p style={{ color:'#888', textAlign:'center', marginBottom:'28px', fontSize:'14px' }}>Connectez-vous à votre compte SpeedMeal</p>

          <form onSubmit={handleLogin} style={{ display:'flex', flexDirection:'column', gap:'16px' }}>
            <div style={{ position:'relative' }}>
              <Mail size={17} style={{ position:'absolute', left:'16px', top:'50%', transform:'translateY(-50%)', color:'#bbb' }} />
              <input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)}
                style={{ ...inp, paddingLeft:'46px' }} onFocus={focus} onBlur={blur} />
            </div>

            <div style={{ position:'relative' }}>
              <Lock size={17} style={{ position:'absolute', left:'16px', top:'50%', transform:'translateY(-50%)', color:'#bbb' }} />
              <input type={showPass ? 'text' : 'password'} placeholder="Mot de passe" value={password} onChange={e => setPassword(e.target.value)}
                style={{ ...inp, paddingLeft:'46px', paddingRight:'48px' }} onFocus={focus} onBlur={blur} />
              <button type="button" onClick={() => setShowPass(v => !v)}
                style={{ position:'absolute', right:'16px', top:'50%', transform:'translateY(-50%)', background:'none', border:'none', cursor:'pointer', color:'#aaa', display:'flex' }}>
                {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>

            <div style={{ textAlign:'right', marginTop:'-6px' }}>
              <Link to="/forgot-password" style={{ fontSize:'13px', color:'#A51C1C', fontWeight:'700', textDecoration:'none' }}>Mot de passe oublié ?</Link>
            </div>

            {error && (
              <div style={{ background:'#fff0f0', border:'1px solid #fca5a5', borderRadius:'12px', padding:'12px 16px', color:'#b91c1c', fontSize:'14px', fontWeight:'600' }}>
                {error}
              </div>
            )}

            <motion.button whileHover={{ y:-2 }} whileTap={{ scale:0.97 }} type="submit" disabled={loading}
              style={{ width:'100%', padding:'18px', borderRadius:'16px', border:'none', background: loading ? '#c97a7a' : '#A51C1C', color:'#fff', fontWeight:'800', fontSize:'16px', cursor: loading ? 'not-allowed' : 'pointer', boxShadow:'0 10px 25px rgba(165,28,28,0.22)', marginTop:'4px' }}>
              {loading ? 'Connexion...' : 'Se connecter'}
            </motion.button>
          </form>

          <p style={{ textAlign:'center', marginTop:'28px', color:'#777', fontSize:'14px' }}>
            Pas de compte ?{' '}
            <Link to="/signup" style={{ color:'#A51C1C', fontWeight:'800', textDecoration:'none' }}>Créer un compte</Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
