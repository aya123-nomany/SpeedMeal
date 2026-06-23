import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingCart, User, Search, Menu as MenuIcon, X, MapPin, Phone, Mail, Bike, Store, LogOut, LayoutDashboard } from 'lucide-react';
import Home from './pages/Home';
import Login from './pages/Login';
import About from './pages/About';
import Contact from './pages/Contact';
import Blog from './pages/Blog';
import BlogDetail from './pages/BlogDetail';
import Menu from './pages/Menu';
import Signup from './pages/Signup';
import ForgotPassword from './pages/ForgotPassword';
import Delivery from "./pages/Delivery";
import Partner from "./pages/Partner";
import LoadingScreen from "./components/LoadingScreen";
import UserDashboard from "./pages/UserDashboard";
import AdminDashboard from "./pages/AdminDashboard";
import RestaurantDashboard from "./pages/RestaurantDashboard";
import DeliveryDashboard from "./pages/DeliveryDashboard";
import Checkout from "./pages/Checkout";
import OrderTracking from "./pages/OrderTracking";
import MealDB from "./pages/MealDB";
import { CartProvider, useCart } from "./context/CartContext";
import { NotificationProvider } from "./context/NotificationContext";
import AIChatWidget from "./components/AIChatWidget";
import { LanguageProvider, useLanguage } from "./context/LanguageContext";

import logoUrl from "./assets/logo.png";

const Footer = () => {
  const { t } = useLanguage();
  return (
    <footer style={{ background: '#fff9e6', color: '#111', position: 'relative', overflow: 'visible', padding: '0 0 40px' }}>
      {/* Smooth Beige Wave Transition */}
      <div style={{ position: 'absolute', top: '-100px', left: 0, width: '100%', overflow: 'hidden', lineHeight: 0 }}>
        <svg viewBox="0 0 1440 320" preserveAspectRatio="none" style={{ position: 'relative', display: 'block', width: '100%', height: '100px' }}>
          <path fill="#fff9e6" fillOpacity="1" d="M0,160L48,176C96,192,192,224,288,213.3C384,203,480,149,576,144C672,139,768,181,864,181.3C960,181,1056,139,1152,122.7C1248,107,1344,117,1392,122.7L1440,128L1440,320L0,320Z"></path>
        </svg>
      </div>

      <div className="container" style={{ maxWidth: '1300px', margin: '0 auto', padding: '60px 30px 0', position: 'relative', zIndex: 1 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '40px', marginBottom: '60px' }}>
          {/* Brand Column */}
          <div>
            <img src={logoUrl} alt="SpeedMeal" style={{ height: '70px', marginBottom: '20px' }} />
            <p style={{ color: '#444', fontSize: '15px', lineHeight: '1.6', maxWidth: '300px' }}>
              {t('footerDesc')}
            </p>
            <div style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
              <a href="#" style={{ color: '#111', background: 'rgba(0,0,0,0.05)', width: '35px', height: '35px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: '0.3s' }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line></svg>
              </a>
              <a href="#" style={{ color: '#111', background: 'rgba(0,0,0,0.05)', width: '35px', height: '35px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: '0.3s' }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path></svg>
              </a>
              <a href="#" style={{ color: '#111', background: 'rgba(0,0,0,0.05)', width: '35px', height: '35px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: '0.3s' }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z"></path></svg>
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 style={{ fontSize: '16px', fontWeight: '800', color: '#A51C1C', marginBottom: '25px', textTransform: 'uppercase' }}>{t('footerLinks')}</h4>
            <ul style={{ listStyle: 'none', padding: 0, display: 'grid', gap: '12px' }}>
              <li><Link to="/menu" style={{ color: '#444', textDecoration: 'none', fontSize: '14px', transition: '0.3s' }}>{t('navMenu')}</Link></li>
              <li><Link to="/about" style={{ color: '#444', textDecoration: 'none', fontSize: '14px', transition: '0.3s' }}>{t('navAbout')}</Link></li>
              <li><Link to="/blog" style={{ color: '#444', textDecoration: 'none', fontSize: '14px', transition: '0.3s' }}>Blog</Link></li>
              <li><Link to="/contact" style={{ color: '#444', textDecoration: 'none', fontSize: '14px', transition: '0.3s' }}>{t('navContact')}</Link></li>
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h4 style={{ fontSize: '16px', fontWeight: '800', color: '#A51C1C', marginBottom: '25px', textTransform: 'uppercase' }}>{t('footerContact')}</h4>
            <ul style={{ listStyle: 'none', padding: 0, display: 'grid', gap: '15px' }}>
              <li style={{ display: 'flex', gap: '10px', color: '#444' }}>
                <MapPin size={18} style={{ color: '#A51C1C' }} />
                <span style={{ fontSize: '14px' }}>Food City, FC 12345</span>
              </li>
              <li style={{ display: 'flex', gap: '10px', color: '#444' }}>
                <Phone size={18} style={{ color: '#A51C1C' }} />
                <span style={{ fontSize: '14px' }}>+1 555 000 1234</span>
              </li>
            </ul>
          </div>

          {/* Newsletter */}
          <div>
            <h4 style={{ fontSize: '16px', fontWeight: '800', color: '#A51C1C', marginBottom: '20px', textTransform: 'uppercase' }}>{t('footerNewsletter')}</h4>
            <div style={{ display: 'flex', gap: '8px' }}>
              <input 
                type="email" 
                placeholder="Email" 
                style={{ background: '#fff', border: '1px solid #ddd', borderRadius: '8px', padding: '10px', color: '#111', flex: 1, fontSize: '13px' }}
              />
              <button style={{ background: '#A51C1C', color: '#fff', border: 'none', borderRadius: '8px', padding: '0 15px', fontWeight: '800', cursor: 'pointer', fontSize: '13px' }}>{t('footerSubscribe')}</button>
            </div>
          </div>
        </div>

        <div style={{ borderTop: '1px solid rgba(0,0,0,0.05)', paddingTop: '30px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '20px' }}>
          <p style={{ color: '#888', fontSize: '13px' }}>
            © 2026 SpeedMeal.
          </p>
          <div style={{ display: 'flex', gap: '20px' }}>
            <a href="#" style={{ color: '#888', textDecoration: 'none', fontSize: '13px' }}>{t('footerPrivacy')}</a>
            <a href="#" style={{ color: '#888', textDecoration: 'none', fontSize: '13px' }}>{t('footerTerms')}</a>
          </div>
        </div>
      </div>
    </footer>
  );
};

const Navbar = () => {
  const [isOpen, setIsOpen] = React.useState(false);
  const navigate = useNavigate();
  const { count } = useCart();
  const { language, setLanguage, t } = useLanguage();

  const storedUser = JSON.parse(localStorage.getItem('user') || 'null');
  const isLoggedIn = !!localStorage.getItem('token');

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/');
    window.location.reload();
  };

  const dashboardPath = storedUser?.role === 'admin' ? '/admin' 
    : storedUser?.role === 'restaurant' ? '/restaurant-dashboard'
    : storedUser?.role === 'delivery' ? '/delivery-dashboard'
    : '/dashboard';

  return (
    <>
      <style>{`
        .navbar-root {
          width: 100%;
          position: absolute;
          top: 12px;
          z-index: 1000;
          padding: 0 12px;
          box-sizing: border-box;
          left: 0;
          right: 0;
        }
        .navbar-inner {
          background: #fff;
          border-radius: 999px;
          box-shadow: 0 10px 30px rgba(0,0,0,0.08);
          max-width: 1300px;
          margin: 0 auto;
          padding: 0 20px;
          height: 64px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          width: 100%;
          box-sizing: border-box;
          overflow: hidden;
        }
        .navbar-left {
          display: flex;
          align-items: center;
          gap: 12px;
          flex-shrink: 0;
          min-width: 0;
        }
        .navbar-center {
          display: flex;
          align-items: center;
          gap: 24px;
          margin: 0 auto;
        }
        .navbar-right {
          display: flex;
          align-items: center;
          gap: 12px;
          flex-shrink: 0;
        }
        .navbar-logo {
          height: 58px;
          object-fit: contain;
          display: block;
        }
        .navbar-lang-select {
          background: #f8fafc;
          border: 1.5px solid #e2e8f0;
          border-radius: 12px;
          padding: 7px 10px;
          font-size: 13px;
          font-weight: 700;
          color: #1e293b;
          cursor: pointer;
          outline: none;
          font-family: 'Outfit', sans-serif;
        }

        /* ── Mobile (≤900px) ── */
        @media (max-width: 900px) {
          .navbar-root { top: 8px; padding: 0 10px; }
          .navbar-inner { height: 56px; padding: 0 14px; }
          .navbar-center { display: none !important; }
          .navbar-right-desktop { display: none !important; }
          .navbar-right-mobile { display: flex !important; }
          .navbar-logo { height: 48px; }
        }
        @media (min-width: 901px) {
          .navbar-right-mobile { display: none !important; }
        }
        @media (max-width: 380px) {
          .navbar-root { padding: 0 8px; }
          .navbar-inner { height: 52px; padding: 0 10px; }
          .navbar-logo { height: 42px; }
          .navbar-left { gap: 8px; }
        }
      `}</style>

      <header className="navbar-root">
        <nav className="navbar-inner">
          {/* Left: Hamburger + Logo */}
          <div className="navbar-left">
            <button
              onClick={() => setIsOpen(true)}
              style={{ background: 'none', border: 'none', padding: '8px', cursor: 'pointer', color: '#334155', display: 'flex', alignItems: 'center' }}
            >
              <MenuIcon size={26} />
            </button>
            <Link to="/" style={{ display: 'flex', alignItems: 'center', textDecoration: 'none' }}>
              <img src={logoUrl} alt="SpeedMeal" className="navbar-logo" />
            </Link>
          </div>

          {/* Center: Partner links (desktop only) */}
          <div className="navbar-center">
            <Link to="/delivery" style={{ display: 'flex', alignItems: 'center', gap: '8px', textDecoration: 'none', color: '#ef4444', fontWeight: '600', fontSize: '14px' }}>
              <div style={{ background: '#fef2f2', padding: '7px', borderRadius: '10px', display: 'flex' }}>
                <Bike size={18} />
              </div>
              <span>{t('navCourier')}</span>
            </Link>
            <Link to="/partner" style={{ display: 'flex', alignItems: 'center', gap: '8px', textDecoration: 'none', color: '#ef4444', fontWeight: '600', fontSize: '14px' }}>
              <div style={{ background: '#fef2f2', padding: '7px', borderRadius: '10px', display: 'flex' }}>
                <Store size={18} />
              </div>
              <span>{t('navPartner')}</span>
            </Link>
          </div>

          {/* Right: Desktop full actions */}
          <div className="navbar-right navbar-right-desktop">
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="navbar-lang-select"
            >
              <option value="fr">🇫🇷 FR</option>
              <option value="en">🇬🇧 EN</option>
              <option value="ar">🇲🇦 AR</option>
            </select>

            {isLoggedIn && (!storedUser || storedUser.role === 'client') && (
              <Link to="/checkout" style={{
                position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: '#f8fafc', border: '1.5px solid #e2e8f0', borderRadius: '50%',
                width: '44px', height: '44px', color: '#1e293b', textDecoration: 'none',
              }}>
                <ShoppingCart size={19} />
                {count > 0 && (
                  <span style={{
                    position: 'absolute', top: '-5px', right: '-5px',
                    background: '#ef4444', color: '#fff', borderRadius: '50%',
                    fontSize: '10px', fontWeight: '800', width: '18px', height: '18px',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>{count}</span>
                )}
              </Link>
            )}

            {isLoggedIn ? (
              <>
                <Link to={dashboardPath} style={{ display: 'flex', alignItems: 'center', gap: '7px', color: '#1e293b', textDecoration: 'none', fontWeight: '700', fontSize: '14px' }}>
                  <div style={{ width: '34px', height: '34px', borderRadius: '50%', background: '#A51C1C', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <User size={16} color="#fff" />
                  </div>
                  <span>{storedUser?.name?.split(' ')[0]}</span>
                </Link>
                <button onClick={handleLogout} style={{ display: 'flex', alignItems: 'center', gap: '7px', background: '#fff0f0', border: 'none', color: '#A51C1C', padding: '9px 16px', borderRadius: '999px', fontWeight: '700', fontSize: '13px', cursor: 'pointer', fontFamily: 'Outfit, sans-serif' }}>
                  <LogOut size={14} /> {t('navLogout')}
                </button>
              </>
            ) : (
              <>
                <Link to="/login" style={{ color: '#1e293b', textDecoration: 'none', fontWeight: '700', fontSize: '14px' }}>
                  {t('navLogin')}
                </Link>
                <Link to="/signup" style={{
                  background: '#1e293b', color: '#fff', padding: '11px 24px',
                  borderRadius: '999px', textDecoration: 'none', fontWeight: '700', fontSize: '14px',
                }}>
                  {t('navSignup')}
                </Link>
              </>
            )}
          </div>

          {/* Right: Mobile — only cart + user icon */}
          <div className="navbar-right navbar-right-mobile" style={{ display: 'none', alignItems: 'center', gap: '10px' }}>
            {isLoggedIn && (!storedUser || storedUser.role === 'client') && (
              <Link to="/checkout" style={{
                position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: '#f8fafc', border: '1.5px solid #e2e8f0', borderRadius: '50%',
                width: '40px', height: '40px', color: '#1e293b', textDecoration: 'none', flexShrink: 0,
              }}>
                <ShoppingCart size={18} />
                {count > 0 && (
                  <span style={{
                    position: 'absolute', top: '-4px', right: '-4px',
                    background: '#ef4444', color: '#fff', borderRadius: '50%',
                    fontSize: '9px', fontWeight: '800', width: '16px', height: '16px',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>{count}</span>
                )}
              </Link>
            )}
            {isLoggedIn ? (
              <Link to={dashboardPath} style={{ display: 'flex', alignItems: 'center', textDecoration: 'none' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: '#A51C1C', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <User size={16} color="#fff" />
                </div>
              </Link>
            ) : (
              <Link to="/login" style={{
                background: '#1e293b', color: '#fff', padding: '8px 16px',
                borderRadius: '999px', textDecoration: 'none', fontWeight: '700', fontSize: '13px', whiteSpace: 'nowrap',
              }}>
                {t('navLogin')}
              </Link>
            )}
          </div>
        </nav>
      </header>

      {/* Mobile Sidebar */}
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(10px)', zIndex: 2000 }}
            />
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              style={{
                position: 'fixed',
                top: 0,
                left: 0,
                bottom: 0,
                width: '100%',
                maxWidth: '450px',
                background: '#fff',
                zIndex: 2001,
                padding: '40px',
                display: 'flex',
                flexDirection: 'column',
                boxShadow: '10px 0 50px rgba(0,0,0,0.1)'
              }}
            >
              <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', alignItems: 'center', marginBottom: '50px' }}>
                <div></div>
                <div style={{ display: 'flex', justifyContent: 'center' }}>
                  <img src={logoUrl} alt="SpeedMeal" style={{ height: '110px', objectFit: 'contain' }} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <button onClick={() => setIsOpen(false)} style={{ background: '#f5f5f5', border: 'none', width: '45px', height: '45px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                    <X size={24} />
                  </button>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {[
                  { name: 'Home',       path: '/' },
                  { name: 'Menu',       path: '/menu' },
                  { name: 'Recettes',   path: '/recipes' },
                  { name: 'About us',   path: '/about' },
                  { name: 'Blog',       path: '/blog' },
                  { name: 'Contact us', path: '/contact' }
                ].map((item, index) => (
                  <Link
                    key={index}
                    to={item.path}
                    onClick={() => setIsOpen(false)}
                    style={{
                      fontSize: '20px',
                      fontWeight: '600',
                      color: '#111',
                      textDecoration: 'none',
                      padding: '12px 0',
                      transition: 'all 0.3s ease',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '15px'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.color = '#A51C1C';
                      e.currentTarget.style.paddingLeft = '10px';
                      e.currentTarget.querySelector('.nav-dot').style.opacity = 1;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.color = '#111';
                      e.currentTarget.style.paddingLeft = '0';
                      e.currentTarget.querySelector('.nav-dot').style.opacity = 0;
                    }}
                  >
                    <div className="nav-dot" style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#A51C1C', opacity: 0, transition: '0.3s' }}></div>
                    {item.name}
                  </Link>
                ))}
              </div>

              <div style={{ marginTop: 'auto', borderTop: '1px solid #eee', paddingTop: '40px' }}>
                <p style={{ color: '#111', fontSize: '18px', fontWeight: '800', marginBottom: '24px' }}>Join our journey</p>
                <div style={{ display: 'flex', gap: '20px' }}>
                  <a href="#" style={{ width: '50px', height: '50px', borderRadius: '15px', background: '#f5f5f5', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s', color: '#111' }} onMouseEnter={(e) => { e.currentTarget.style.background = '#E1306C'; e.currentTarget.style.color = '#fff' }}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line></svg>
                  </a>
                  <a href="#" style={{ width: '50px', height: '50px', borderRadius: '15px', background: '#f5f5f5', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s', color: '#111' }} onMouseEnter={(e) => { e.currentTarget.style.background = '#1877F2'; e.currentTarget.style.color = '#fff' }}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path></svg>
                  </a>
                  <a href="#" style={{ width: '50px', height: '50px', borderRadius: '15px', background: '#f5f5f5', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s', color: '#111' }} onMouseEnter={(e) => { e.currentTarget.style.background = '#000'; e.currentTarget.style.color = '#fff' }}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z"></path></svg>
                  </a>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

function App() {
  return (
    <LanguageProvider>
      <NotificationProvider>
        <CartProvider>
          <Router>
            <AppContent />
          </Router>
        </CartProvider>
      </NotificationProvider>
    </LanguageProvider>
  );
}

const AppContent = () => {
  const location = useLocation();
  const [isLoading, setIsLoading] = React.useState(true);

  const { language } = useLanguage();

  React.useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 2500);
    return () => clearTimeout(timer);
  }, []);

  React.useEffect(() => {
    document.body.dir = language === 'ar' ? 'rtl' : 'ltr';
  }, [language]);

  const shouldHide = ['/login', '/signup', '/forgot-password', '/dashboard', '/admin', '/restaurant-dashboard', '/delivery-dashboard', '/checkout'].includes(location.pathname.toLowerCase()) || location.pathname.startsWith('/order/');

  return (
    <>
      <AnimatePresence mode="wait">
        {isLoading && <LoadingScreen key="loading" />}
      </AnimatePresence>
      {!shouldHide && <Navbar />}
      <AnimatePresence mode="wait">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/about" element={<About />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/blog" element={<Blog />} />
<Route path="/blog/:id" element={<BlogDetail />} />
          <Route path="/menu" element={<Menu />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/delivery" element={<Delivery />} />
          <Route path="/partner" element={<Partner />} />
          <Route path="/dashboard" element={<UserDashboard />} />
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/restaurant-dashboard" element={<RestaurantDashboard />} />
          <Route path="/delivery-dashboard" element={<DeliveryDashboard />} />
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/order/:id" element={<OrderTracking />} />
          <Route path="/recipes" element={<MealDB />} />
        </Routes>
      </AnimatePresence>
      {!shouldHide && <Footer />}
      {!shouldHide && <AIChatWidget />}
    </>
  );
};

export default App;
