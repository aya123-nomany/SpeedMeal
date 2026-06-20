import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Mail, Lock } from 'lucide-react';
import axios from 'axios';
import logoUrl from '../assets/logo.png';

const API = 'https://speedmeal.ayaennoamany.workers.dev/api/auth';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [step, setStep] = useState(1); // 1: email, 2: otp, 3: success
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
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

  const handleSendOtp = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await axios.post(`${API}/send-otp`, { email });
      setStep(2);
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur lors de l\'envoi de l\'OTP');
    }
    setLoading(false);
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await axios.post(`${API}/verify-otp`, { email, otp, newPassword });
      setStep(3);
    } catch (err) {
      setError(err.response?.data?.message || 'OTP invalide ou expiré');
    }
    setLoading(false);
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

          {step === 1 ? (
            <>
              {/* Title */}
              <h2 style={{ fontSize: '30px', fontWeight: '800', color: '#111', marginBottom: '10px', letterSpacing: '-1px' }}>
                Mot de passe oublié ?
              </h2>
              <p style={{ color: '#777', marginBottom: '35px', fontSize: '15px', fontWeight: '500', lineHeight: '1.6' }}>
                Entrez votre email et nous vous enverrons un code de réinitialisation.
              </p>

              {/* Form */}
              <form onSubmit={handleSendOtp} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                <div style={{ position: 'relative' }}>
                  <input
                    type="email"
                    required
                    placeholder="Adresse email"
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

                {error && <p style={{ color: '#DC2626', fontSize: '13px', fontWeight: '600' }}>{error}</p>}

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
                  {loading ? 'Envoi en cours...' : 'Envoyer le code'}
                </motion.button>
              </form>
            </>
          ) : step === 2 ? (
            <>
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
                  Entrez le code
                </h2>
                <p style={{ color: '#777', marginBottom: '35px', fontSize: '15px', fontWeight: '500', lineHeight: '1.6' }}>
                  Code envoyé à <strong style={{ color: '#111' }}>{email}</strong>
                </p>
              </motion.div>

              <form onSubmit={handleVerifyOtp} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                <div style={{ position: 'relative' }}>
                  <input
                    type="text"
                    required
                    placeholder="Code à 6 chiffres"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    maxLength={6}
                    style={{ ...inputStyle, textAlign: 'center', letterSpacing: '8px', fontSize: '24px', fontWeight: '700' }}
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
                  <Lock size={18} style={{ position: 'absolute', left: '20px', top: '50%', transform: 'translateY(-50%)', color: '#bbb' }} />
                  <input
                    type="password"
                    required
                    placeholder="Nouveau mot de passe"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    style={{ ...inputStyle, paddingLeft: '50px' }}
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

                {error && <p style={{ color: '#DC2626', fontSize: '13px', fontWeight: '600' }}>{error}</p>}

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
                  {loading ? 'Vérification...' : 'Réinitialiser'}
                </motion.button>

                <button
                  type="button"
                  onClick={() => setStep(1)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#777',
                    fontWeight: '700',
                    fontSize: '14px',
                    cursor: 'pointer',
                    textDecoration: 'underline'
                  }}
                >
                  Changer d'email
                </button>
              </form>
            </>
          ) : (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
            >
              <div style={{
                width: '80px',
                height: '80px',
                background: '#F0FDF4',
                color: '#16A34A',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 30px'
              }}>
                <Mail size={40} />
              </div>
              <h2 style={{ fontSize: '28px', fontWeight: '800', color: '#111', marginBottom: '10px' }}>
                Mot de passe réinitialisé !
              </h2>
              <p style={{ color: '#777', marginBottom: '35px', fontSize: '15px', fontWeight: '500', lineHeight: '1.6' }}>
                Votre mot de passe a été réinitialisé avec succès.
              </p>
              <motion.button
                whileHover={{ y: -2 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => navigate('/login')}
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
                  boxShadow: '0 12px 25px rgba(165, 28, 28, 0.25)',
                  transition: 'all 0.3s ease'
                }}
              >
                Se connecter
              </motion.button>
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
