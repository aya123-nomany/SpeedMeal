import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Mail } from 'lucide-react';
import logoUrl from '../assets/logo.png';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [isSent, setIsSent] = useState(false);
  const navigate = useNavigate();

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
          onClick={() => navigate('/login')}
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
            boxShadow: '0 25px 60px -15px rgba(0,0,0,0.06)',
            textAlign: 'center'
          }}
        >
          {/* Logo */}
          <div style={{ textAlign: 'center', marginBottom: '40px' }}>
            <img src={logoUrl} alt="SpeedMeal" style={{ height: '100px', objectFit: 'contain' }} />
          </div>

          {!isSent ? (
            <>
              {/* Title */}
              <h2 style={{ fontSize: '30px', fontWeight: '800', color: '#111', marginBottom: '10px', letterSpacing: '-1px' }}>
                Forgot Password?
              </h2>
              <p style={{ color: '#777', marginBottom: '35px', fontSize: '15px', fontWeight: '500', lineHeight: '1.6' }}>
                Enter your email address and we'll send you a link to reset your password.
              </p>

              {/* Form */}
              <form onSubmit={(e) => { e.preventDefault(); setIsSent(true); }} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>

                <div style={{ position: 'relative' }}>
                  <input
                    type="email"
                    required
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

                <motion.button
                  whileHover={{ y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  type="submit"
                  style={{
                    width: '100%',
                    padding: '20px',
                    borderRadius: '20px',
                    border: 'none',
                    background: '#A51C1C',
                    color: '#fff',
                    fontSize: '17px',
                    fontWeight: '800',
                    cursor: 'pointer',
                    marginTop: '15px',
                    boxShadow: '0 12px 25px rgba(165, 28, 28, 0.25)',
                    transition: 'all 0.3s ease'
                  }}
                >
                  Send Reset Link
                </motion.button>
              </form>
            </>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div style={{
                width: '80px',
                height: '80px',
                background: '#FFF5F2',
                color: '#A51C1C',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 30px'
              }}>
                <Mail size={40} />
              </div>
              <h2 style={{ fontSize: '28px', fontWeight: '800', color: '#111', marginBottom: '10px' }}>
                Check your Email
              </h2>
              <p style={{ color: '#777', marginBottom: '35px', fontSize: '15px', fontWeight: '500', lineHeight: '1.6' }}>
                We've sent a password reset link to <br />
                <strong style={{ color: '#111' }}>{email}</strong>
              </p>
              <button
                onClick={() => setIsSent(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#A51C1C',
                  fontWeight: '800',
                  fontSize: '15px',
                  cursor: 'pointer',
                  textDecoration: 'underline'
                }}
              >
                Didn't receive the email? Try again
              </button>
            </motion.div>
          )}

          {/* Link back to Login */}
          <div style={{ marginTop: '40px', paddingTop: '30px', borderTop: '1px solid #eee' }}>
            <Link to="/login" style={{ color: '#777', fontWeight: '700', textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
              <ArrowLeft size={16} /> Back to Login
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default ForgotPassword;
