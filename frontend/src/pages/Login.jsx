import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, Lock, Eye, EyeOff, ArrowLeft } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import logoUrl from '../assets/logo.png';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    if (!email || !password) {
      setError('Please fill in all fields.');
      return;
    }
    setLoading(true);
    try {
      const { data } = await axios.post('http://localhost:5000/api/auth/login', { email, password });
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      navigate(data.user.role === 'admin' ? '/admin' : '/');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = {
    width: '100%',
    padding: '18px 24px',
    borderRadius: '16px',
    border: '1.5px solid #f0f0f0',
    fontSize: '16px',
    fontWeight: '500',
    outline: 'none',
    background: '#fafafa',
    color: '#111',
    boxSizing: 'border-box',
    transition: 'all 0.3s ease'
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      background: '#fff',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Decorative Background Blobs */}
      <div style={{ position: 'absolute', top: '-100px', right: '-100px', width: '400px', height: '400px', background: 'radial-gradient(circle, rgba(165, 28, 28, 0.04) 0%, transparent 70%)', borderRadius: '50%', zIndex: 0 }}></div>
      <div style={{ position: 'absolute', bottom: '-150px', left: '-150px', width: '500px', height: '500px', background: 'radial-gradient(circle, rgba(165, 28, 28, 0.03) 0%, transparent 70%)', borderRadius: '50%', zIndex: 0 }}></div>

      {/* Back Button */}
      <div style={{ maxWidth: '1200px', margin: '0 auto', width: '100%', paddingTop: '30px', paddingLeft: '30px', position: 'relative', zIndex: 10 }}>
        <button
          onClick={() => navigate(-1)}
          style={{
            background: '#fff',
            border: '1px solid #eee',
            cursor: 'pointer',
            color: '#111',
            padding: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: '50%',
            boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
            transition: 'all 0.3s ease'
          }}
          onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateX(-5px)'; e.currentTarget.style.background = '#fafafa'; }}
          onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateX(0)'; e.currentTarget.style.background = '#fff'; }}
        >
          <ArrowLeft size={22} strokeWidth={2.5} />
        </button>
      </div>

      <div style={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
        position: 'relative',
        zIndex: 1
      }}>
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          style={{
            width: '100%',
            maxWidth: '480px',
            background: '#fff',
            padding: '50px 40px',
            borderRadius: '32px',
            border: '1px solid #f2f2f2',
            boxShadow: '0 25px 60px -15px rgba(0,0,0,0.06)'
          }}
        >
          {/* Logo */}
          <div style={{ textAlign: 'center', marginBottom: '40px' }}>
            <img src={logoUrl} alt="SpeedMeal" style={{ height: '100px', objectFit: 'contain' }} />
          </div>

          {/* Title */}
          <h2 style={{ fontSize: '30px', fontWeight: '800', color: '#111', marginBottom: '10px', textAlign: 'center', letterSpacing: '-1px' }}>
            Welcome Back!
          </h2>
          <p style={{ color: '#777', textAlign: 'center', marginBottom: '35px', fontSize: '15px', fontWeight: '500' }}>
            Ready for your next delicious meal?
          </p>

          {/* Form */}
          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>

            <div style={{ position: 'relative' }}>
              <input
                type="email"
                placeholder="Email Address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={inputStyle}
                onFocus={(e) => {
                  e.target.style.borderColor = '#A51C1C';
                  e.target.style.background = '#fff';
                  e.target.style.boxShadow = '0 0 0 4px rgba(165, 28, 28, 0.06)';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = '#f0f0f0';
                  e.target.style.background = '#fafafa';
                  e.target.style.boxShadow = 'none';
                }}
              />
            </div>

            <div style={{ position: 'relative' }}>
              <input
                type={showPass ? 'text' : 'password'}
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{ ...inputStyle, paddingRight: '60px' }}
                onFocus={(e) => {
                  e.target.style.borderColor = '#A51C1C';
                  e.target.style.background = '#fff';
                  e.target.style.boxShadow = '0 0 0 4px rgba(165, 28, 28, 0.06)';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = '#f0f0f0';
                  e.target.style.background = '#fafafa';
                  e.target.style.boxShadow = 'none';
                }}
              />
              <div
                onClick={() => setShowPass(!showPass)}
                style={{ position: 'absolute', right: '20px', top: '50%', transform: 'translateY(-50%)', cursor: 'pointer', color: '#888', display: 'flex' }}
              >
                {showPass ? <EyeOff size={20} /> : <Eye size={20} />}
              </div>
            </div>

            <div style={{ textAlign: 'right', marginTop: '-5px' }}>
              <Link to="/forgot-password" style={{ fontSize: '14px', color: '#A51C1C', fontWeight: '700', textDecoration: 'none' }}>
                Forgot Password?
              </Link>
            </div>

            {error && (
              <div style={{ background: '#fff0f0', border: '1px solid #fca5a5', borderRadius: '12px', padding: '12px 16px', color: '#b91c1c', fontSize: '14px', fontWeight: '600' }}>
                {error}
              </div>
            )}

            <motion.button
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                padding: '20px',
                borderRadius: '20px',
                border: 'none',
                background: loading ? '#c97a7a' : '#A51C1C',
                color: '#fff',
                fontSize: '17px',
                fontWeight: '800',
                cursor: loading ? 'not-allowed' : 'pointer',
                marginTop: '15px',
                boxShadow: '0 12px 25px rgba(165, 28, 28, 0.25)',
                transition: 'all 0.3s ease'
              }}
            >
              {loading ? 'Logging in...' : 'Log In'}
            </motion.button>
          </form>

          {/* Divider */}
          <div style={{ display: 'flex', alignItems: 'center', margin: '40px 0', gap: '15px' }}>
            <div style={{ flex: 1, height: '1px', background: '#eee' }}></div>
            <span style={{ color: '#aaa', fontSize: '14px', fontWeight: '600' }}>or sign in with</span>
            <div style={{ flex: 1, height: '1px', background: '#eee' }}></div>
          </div>

          {/* Social Buttons */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '40px' }}>
            <button style={{
              padding: '16px',
              borderRadius: '18px',
              border: '1.5px solid #f0f0f0',
              background: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '12px',
              fontWeight: '700',
              fontSize: '15px',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }} onMouseEnter={(e) => { e.target.style.borderColor = '#ddd'; e.target.style.background = '#fafafa'; }} onMouseLeave={(e) => { e.target.style.borderColor = '#f0f0f0'; e.target.style.background = '#fff'; }}>
              <svg width="20" height="20" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" /><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" /><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" /><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" /></svg>
              Google
            </button>
            <button style={{
              padding: '16px',
              borderRadius: '18px',
              border: '1.5px solid #f0f0f0',
              background: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '12px',
              fontWeight: '700',
              fontSize: '15px',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }} onMouseEnter={(e) => { e.target.style.borderColor = '#ddd'; e.target.style.background = '#fafafa'; }} onMouseLeave={(e) => { e.target.style.borderColor = '#f0f0f0'; e.target.style.background = '#fff'; }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="#1877F2"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" /></svg>
              Facebook
            </button>
          </div>

          {/* Link to Sign Up */}
          <p style={{ textAlign: 'center', color: '#777', fontSize: '15px', fontWeight: '600' }}>
            Don't have an account?{' '}
            <Link to="/signup" style={{ color: '#A51C1C', fontWeight: '800', textDecoration: 'none' }}>
              Sign Up
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
};

export default Login;
