import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import axios from 'axios';
import logoUrl from '../assets/logo.png';

const Signup = () => {
  const [formData, setFormData] = useState({
    fullName: '',
    location: '',
    dateOfBirth: '',
    mobileNumber: '',
    email: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    setError('');
    const { fullName, email, password, mobileNumber, location } = formData;
    if (!fullName || !email || !password) {
      setError('Full name, email, and password are required.');
      return;
    }
    setLoading(true);
    try {
      const { data } = await axios.post('http://localhost:5000/api/auth/register', {
        name: fullName,
        email,
        password,
        phone: mobileNumber || null,
        address: location || null,
        role: 'client'
      });
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed. Please try again.');
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

  const inputFocus = (e) => {
    e.target.style.borderColor = '#A51C1C';
    e.target.style.background = '#fff';
    e.target.style.boxShadow = '0 0 0 4px rgba(165, 28, 28, 0.05)';
  };

  const inputBlur = (e) => {
    e.target.style.borderColor = '#f0f0f0';
    e.target.style.background = '#fafafa';
    e.target.style.boxShadow = 'none';
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
            maxWidth: '500px',
            background: '#fff',
            padding: '50px 40px',
            borderRadius: '32px',
            border: '1px solid #f2f2f2',
            boxShadow: '0 25px 60px -15px rgba(0,0,0,0.06)'
          }}
        >
          {/* Logo */}
          <div style={{ textAlign: 'center', marginBottom: '40px' }}>
            <img src={logoUrl} alt="SpeedMeal Logo" style={{ height: '100px', objectFit: 'contain' }} />
          </div>

          {/* Title */}
          <h2 style={{ fontSize: '30px', fontWeight: '800', color: '#111', marginBottom: '10px', textAlign: 'center', letterSpacing: '-1px' }}>
            Create Account
          </h2>
          <p style={{ color: '#777', textAlign: 'center', marginBottom: '35px', fontSize: '15px', fontWeight: '500' }}>
            Join our community of food lovers today!
          </p>

          {/* Form */}
          <form onSubmit={handleSignup} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>

            <input
              type="text"
              name="fullName"
              placeholder="Full Name"
              value={formData.fullName}
              onChange={handleChange}
              style={inputStyle}
              onFocus={inputFocus}
              onBlur={inputBlur}
            />

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
              <input
                type="text"
                name="location"
                placeholder="Location"
                value={formData.location}
                onChange={handleChange}
                style={inputStyle}
                onFocus={inputFocus}
                onBlur={inputBlur}
              />

              <input
                type="text"
                name="dateOfBirth"
                placeholder="Birth Date"
                value={formData.dateOfBirth}
                onChange={handleChange}
                style={inputStyle}
                onFocus={inputFocus}
                onBlur={inputBlur}
              />
            </div>

            <input
              type="tel"
              name="mobileNumber"
              placeholder="Mobile Number"
              value={formData.mobileNumber}
              onChange={handleChange}
              style={inputStyle}
              onFocus={inputFocus}
              onBlur={inputBlur}
            />

            <input
              type="email"
              name="email"
              placeholder="Email Address"
              value={formData.email}
              onChange={handleChange}
              style={inputStyle}
              onFocus={inputFocus}
              onBlur={inputBlur}
            />

            <input
              type="password"
              name="password"
              placeholder="Password"
              value={formData.password}
              onChange={handleChange}
              style={inputStyle}
              onFocus={inputFocus}
              onBlur={inputBlur}
            />

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
              {loading ? 'Creating account...' : 'Sign Up'}
            </motion.button>
          </form>

          {/* Divider */}
          <div style={{ display: 'flex', alignItems: 'center', margin: '35px 0', gap: '15px' }}>
            <div style={{ flex: 1, height: '1px', background: '#eee' }}></div>
            <span style={{ color: '#aaa', fontSize: '13px', fontWeight: '600' }}>or sign up with</span>
            <div style={{ flex: 1, height: '1px', background: '#eee' }}></div>
          </div>

          <div style={{ textAlign: 'center', color: '#777', fontSize: '15px', fontWeight: '600' }}>
            Already have an account?{' '}
            <Link to="/login" style={{ color: '#A51C1C', fontWeight: '800', textDecoration: 'none' }}>
              Login
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Signup;
