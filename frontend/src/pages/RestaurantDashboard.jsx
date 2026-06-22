import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import {
  Store, ShoppingBag, BarChart2, LogOut, Plus, Edit3,
  Trash2, Check, X, Clock, Home, TrendingUp, Star,
  Package, ToggleLeft, ToggleRight, User, MapPin,
  Camera, ChevronRight, AlertCircle, Utensils,
  DollarSign, Eye, EyeOff, RefreshCw, Banknote, CreditCard, Tag, Bell
} from 'lucide-react';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS, CategoryScale, LinearScale, BarElement,
  Title, Tooltip, Legend
} from 'chart.js';
import logoUrl from '../assets/logo.png';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

import API_BASE_URL from '../config/api';
const API = API_BASE_URL;

const C = {
  red: '#A51C1C', dark: '#111', bg: '#F4F6FB',
  border: '#EEF0F6', muted: '#94A3B8', text: '#1C1C2E', sub: '#64748B',
  card: '#FFFFFF',
};

const STATUS = {
  pending:    { bg: '#FFF7ED', color: '#C2410C', dot: '#F97316', label: 'En attente' },
  preparing:  { bg: '#FEFCE8', color: '#A16207', dot: '#EAB308', label: 'En préparation' },
  on_the_way: { bg: '#EFF6FF', color: '#1D4ED8', dot: '#3B82F6', label: 'En route' },
  delivered:  { bg: '#F0FDF4', color: '#15803D', dot: '#22C55E', label: 'Livré' },
  cancelled:  { bg: '#FEF2F2', color: '#B91C1C', dot: '#EF4444', label: 'Annulé' },
};

const inputStyle = {
  width: '100%', padding: '11px 14px', borderRadius: '10px',
  border: `1.5px solid ${C.border}`, fontSize: '13px', outline: 'none',
  background: '#FAFBFD', boxSizing: 'border-box', fontFamily: 'Outfit,sans-serif',
  color: C.text, transition: 'border .15s',
};

/* ── Image upload helper ── */
const ImageUpload = ({ value, onChange, height = 140, placeholder = 'Ajouter une image' }) => {
  const ref = useRef();
  const handle = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { alert('Max 5 Mo'); return; }
    const reader = new FileReader();
    reader.onload = ev => onChange(ev.target.result);
    reader.readAsDataURL(file);
  };
  return (
    <div onClick={() => ref.current.click()} style={{
      width: '100%', height, borderRadius: 12, overflow: 'hidden', cursor: 'pointer',
      border: `2px dashed ${value ? C.red : C.border}`, position: 'relative',
      background: value ? 'transparent' : '#FAFBFD', transition: 'border .2s',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}
      onMouseEnter={e => e.currentTarget.style.borderColor = C.red}
      onMouseLeave={e => e.currentTarget.style.borderColor = value ? C.red : C.border}
    >
      {value
        ? <>
            <img src={value} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
            <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0, transition: '.2s' }}
              onMouseEnter={e => e.currentTarget.style.opacity = 1}
              onMouseLeave={e => e.currentTarget.style.opacity = 0}>
              <Camera size={24} color="#fff" />
            </div>
          </>
        : <div style={{ textAlign: 'center', pointerEvents: 'none' }}>
            <Camera size={26} color={C.muted} style={{ marginBottom: 6 }} />
            <p style={{ margin: 0, fontSize: 12, color: C.muted, fontWeight: 600 }}>{placeholder}</p>
            <p style={{ margin: '3px 0 0', fontSize: 11, color: C.muted }}>JPG / PNG — max 5 Mo</p>
          </div>
      }
      <input ref={ref} type="file" accept="image/*" onChange={handle} style={{ display: 'none' }} />
    </div>
  );
};

/* ── Status badge ── */
const StatusBadge = ({ status }) => {
  const s = STATUS[status] || { bg: '#f5f5f5', color: '#888', dot: '#aaa', label: status };
  return (
    <span style={{ background: s.bg, color: s.color, padding: '4px 12px', borderRadius: 999, fontSize: 11, fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 5 }}>
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: s.dot, flexShrink: 0 }} />
      {s.label}
    </span>
  );
};

/* ── Stat card ── */
const StatCard = ({ label, value, color, icon: Icon, sub }) => (
  <div style={{ background: C.card, borderRadius: 16, padding: '18px 20px', boxShadow: '0 2px 12px rgba(0,0,0,0.05)', display: 'flex', gap: 14, alignItems: 'center' }}>
    <div style={{ width: 44, height: 44, borderRadius: 12, background: color + '18', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
      <Icon size={20} color={color} />
    </div>
    <div>
      <p style={{ margin: 0, fontSize: 11, color: C.muted, fontWeight: 600 }}>{label}</p>
      <p style={{ margin: '2px 0 0', fontSize: 22, fontWeight: 900, color: C.text, lineHeight: 1 }}>{value}</p>
      {sub && <p style={{ margin: '2px 0 0', fontSize: 11, color: C.muted }}>{sub}</p>}
    </div>
  </div>
);

export default function RestaurantDashboard() {
  const [tab, setTab]                         = useState('orders');
  const [restaurant, setRestaurant]           = useState(null);
  const [orders, setOrders]                   = useState([]);
  const [menu, setMenu]                       = useState([]);
  const [stats, setStats]                     = useState(null);
  const [reviews, setReviews]                 = useState([]);
  const [loading, setLoading]                 = useState(false);
  const [menuLoading, setMenuLoading]         = useState(false);
  const [coupons, setCoupons] = useState({ myCoupons: [], adminCoupons: [] });
  const [couponForm, setCouponForm] = useState({ code: '', discount_type: 'percentage', discount_value: '', min_order: '', max_uses: '' });
  const [couponModal, setCouponModal] = useState(false);
  
  // Notifications
  const [notifications, setNotifications] = useState([]);
  const [notifOpen, setNotifOpen] = useState(false);

  // Modals
  const [itemModal, setItemModal]             = useState(false);
  const [editItem, setEditItem]               = useState(null);
  const [infoModal, setInfoModal]             = useState(false);

  // Forms
  const [itemForm, setItemForm]               = useState({ name: '', description: '', price: '', category: '', image_url: '', isAvailable: true });
  const [restoForm, setRestoForm]             = useState({});

  // Feedback
  const [msg, setMsg]                         = useState({ text: '', ok: true });
  const [savingItem, setSavingItem]           = useState(false);
  const [savingResto, setSavingResto]         = useState(false);

  // Filter
  const [orderFilter, setOrderFilter]         = useState('all');
  const [menuSearch, setMenuSearch]           = useState('');

  const navigate = useNavigate();
  const token    = localStorage.getItem('token');
  const user     = JSON.parse(localStorage.getItem('user') || '{}');
  const headers  = { Authorization: `Bearer ${token}` };

  useEffect(() => {
    if (!token || !['restaurant', 'admin'].includes(user.role)) { navigate('/login'); return; }
    init();
  }, []);

  const notify = (text, ok = true) => { setMsg({ text, ok }); setTimeout(() => setMsg({ text: '', ok: true }), 3000); };

  const init = async () => {
    try {
      const { data } = await axios.get(`${API}/restaurant-dashboard/my-restaurant`, { headers });
      setRestaurant(data);
      if (data) {
        setRestoForm({ name: data.name, description: data.description || '', address: data.address || '', city: data.city || '', cuisine: data.cuisine || '', image_url: data.image_url || '' });
        loadOrders(data.id);
        loadMenu(data.id);
        loadStats(data.id);
        loadCoupons();
        loadReviews(data.id);
        fetchNotifications();
      }
    } catch { navigate('/login'); }
  };

  const handleCreateCoupon = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API}/coupons/restaurant/my`, couponForm, { headers });
      notify('Coupon créé !');
      setCouponForm({ code: '', discount_type: 'percentage', discount_value: '', min_order: '', max_uses: '' });
      setCouponModal(false);
      loadCoupons();
    } catch (err) {
      notify(err.response?.data?.message || 'Erreur', false);
    }
  };

  const handleToggleCoupon = async (id) => {
    try {
      await axios.put(`${API}/coupons/restaurant/toggle/${id}`, {}, { headers });
      loadCoupons();
      notify('Statut du coupon modifié');
    } catch (err) {
      notify('Erreur', false);
    }
  };

  const handleDeleteCoupon = async (id) => {
    if (!window.confirm('Supprimer ce coupon ?')) return;
    try {
      await axios.delete(`${API}/coupons/restaurant/my/${id}`, { headers });
      loadCoupons();
      notify('Coupon supprimé');
    } catch (err) {
      notify('Erreur', false);
    }
  };

  const handleAdminCouponAccept = async (id, status) => {
    try {
      await axios.put(`${API}/coupons/restaurant/accept/${id}`, { status }, { headers });
      loadCoupons();
      notify(`Coupon ${status === 'accepted' ? 'accepté' : 'refusé'} !`);
    } catch (err) {
      notify('Erreur', false);
    }
  };

  const loadOrders = async (id) => {
    setLoading(true);
    try { const { data } = await axios.get(`${API}/restaurant-dashboard/${id}/orders`, { headers }); setOrders(data); }
    catch { setOrders([]); }
    setLoading(false);
  };

  const loadMenu = async (id) => {
    setMenuLoading(true);
    try { const { data } = await axios.get(`${API}/restaurant-dashboard/${id}/menu`, { headers }); setMenu(data); }
    catch { setMenu([]); }
    setMenuLoading(false);
  };

  const loadStats = async (id) => {
    try { const { data } = await axios.get(`${API}/restaurant-dashboard/${id}/stats`, { headers }); setStats(data); }
    catch { setStats(null); }
  };

  const fetchNotifications = async () => {
    try {
      const { data } = await axios.get(`${API}/notifications`, { headers });
      setNotifications(data);
    } catch {}
  };

  const markAsRead = async (id) => {
    try {
      await axios.put(`${API}/notifications/${id}/read`, {}, { headers });
      fetchNotifications();
    } catch {}
  };

  const markAllAsRead = async () => {
    try {
      await axios.put(`${API}/notifications/read-all`, {}, { headers });
      fetchNotifications();
    } catch {}
  };

  const loadCoupons = async () => {
    try {
      const { data } = await axios.get(`${API}/coupons/restaurant/my`, { headers });
      setCoupons(data);
    } catch (err) {
      console.error(err);
    }
  };

  const loadReviews = async (id) => {
    try {
      const { data } = await axios.get(`${API}/reviews/restaurant/${id}`, { headers });
      setReviews(data);
    } catch {
      setReviews([]);
    }
  };

  const handleOrderStatus = async (orderId, status) => {
    try {
      await axios.put(`${API}/restaurant-dashboard/${restaurant.id}/orders/${orderId}/status`, { status }, { headers });
      loadOrders(restaurant.id);
      loadStats(restaurant.id);
    } catch (err) { notify(err.response?.data?.message || 'Erreur', false); }
  };

  const handleToggle = async () => {
    try {
      await axios.put(`${API}/restaurant-dashboard/${restaurant.id}/toggle-status`, {}, { headers });
      setRestaurant(r => ({ ...r, isOpen: !r.isOpen }));
    } catch { notify('Erreur', false); }
  };

  const openItemModal = (item = null) => {
    setEditItem(item);
    setItemForm(item
      ? { name: item.name, description: item.description || '', price: item.price, category: item.category || '', image_url: item.image_url || '', isAvailable: item.isAvailable }
      : { name: '', description: '', price: '', category: '', image_url: '', isAvailable: true }
    );
    setItemModal(true);
  };

  const handleSaveItem = async (e) => {
    e.preventDefault();
    setSavingItem(true);
    try {
      if (editItem) {
        await axios.put(`${API}/restaurant-dashboard/${restaurant.id}/menu/${editItem.id}`, itemForm, { headers });
        notify('Plat mis à jour');
      } else {
        await axios.post(`${API}/restaurant-dashboard/${restaurant.id}/menu`, itemForm, { headers });
        notify('Plat ajouté');
      }
      setItemModal(false);
      loadMenu(restaurant.id);
      loadStats(restaurant.id);
    } catch (err) { notify(err.response?.data?.message || 'Erreur', false); }
    setSavingItem(false);
  };

  const handleDeleteItem = async (itemId) => {
    if (!window.confirm('Supprimer ce plat ?')) return;
    try {
      await axios.delete(`${API}/restaurant-dashboard/${restaurant.id}/menu/${itemId}`, { headers });
      notify('Plat supprimé');
      loadMenu(restaurant.id);
      loadStats(restaurant.id);
    } catch { notify('Erreur', false); }
  };

  const handleSaveResto = async (e) => {
    e.preventDefault();
    setSavingResto(true);
    try {
      if (restaurant) {
        await axios.put(`${API}/restaurant-dashboard/${restaurant.id}`, restoForm, { headers });
        notify('Informations mises à jour');
        init();
      } else {
        await axios.post(`${API}/restaurant-dashboard/create`, restoForm, { headers });
        notify('Restaurant créé');
        init();
      }
      setInfoModal(false);
    } catch (err) { notify(err.response?.data?.message || 'Erreur', false); }
    setSavingResto(false);
  };

  // Derived
  const pendingOrders  = orders.filter(o => o.status === 'pending');
  const activeOrders   = orders.filter(o => ['preparing', 'on_the_way'].includes(o.status));
  const filteredOrders = orderFilter === 'all' ? orders : orders.filter(o => o.status === orderFilter);
  const filteredMenu   = menu.filter(m => m.name.toLowerCase().includes(menuSearch.toLowerCase()) || (m.category || '').toLowerCase().includes(menuSearch.toLowerCase()));
  const categories     = [...new Set(menu.map(m => m.category).filter(Boolean))];

  // Chart
  const months   = ['Jan','Fév','Mar','Avr','Mai','Jun','Jul','Aoû','Sep','Oct','Nov','Déc'];
  const chartData = {
    labels: months,
    datasets: [{
      data: months.map((_, i) => { const m = stats?.monthly?.find(x => x.month === i + 1); return m ? Number(m.revenue) : 0; }),
      backgroundColor: months.map((_, i) => i === new Date().getMonth() ? C.red : C.red + '55'),
      borderRadius: 8, borderSkipped: false,
    }],
  };

  const NAV = [
    { id: 'orders', label: 'Commandes', icon: ShoppingBag },
    { id: 'menu',   label: 'Menu',      icon: Utensils },
    { id: 'stats',  label: 'Statistiques', icon: BarChart2 },
    { id: 'coupons', label: 'Coupons', icon: Tag },
    { id: 'reviews', label: 'Avis clients', icon: Star },
  ];

  return (
    <div style={{ minHeight: '100vh', background: C.bg, display: 'flex', fontFamily: 'Outfit,sans-serif' }}>

      {/* ── SIDEBAR ── */}
      <aside style={{ width: 220, background: C.dark, minHeight: '100vh', display: 'flex', flexDirection: 'column', flexShrink: 0, position: 'sticky', top: 0, height: '100vh' }}>
        <div style={{ padding: '24px 16px 16px', borderBottom: '1px solid #222' }}>
          <img src={logoUrl} alt="SpeedMeal" style={{ height: 40, objectFit: 'contain', display: 'block', margin: '0 auto 12px' }} />
          {restaurant && (
            <div style={{ background: '#1a1a1a', borderRadius: 12, padding: '12px 14px' }}>
              {restaurant.image_url
                ? <img src={restaurant.image_url} alt="" style={{ width: '100%', height: 70, objectFit: 'cover', borderRadius: 8, marginBottom: 8 }} />
                : <div style={{ width: '100%', height: 70, background: '#222', borderRadius: 8, marginBottom: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Store size={28} color="#444"/></div>
              }
              <p style={{ margin: 0, color: '#fff', fontWeight: 800, fontSize: 13, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{restaurant.name}</p>
              <p style={{ margin: '2px 0 8px', color: '#666', fontSize: 11 }}>{restaurant.city} · {restaurant.cuisine}</p>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ flex: 1, textAlign: 'center', padding: '4px 0', borderRadius: 8, fontSize: 11, fontWeight: 700, background: restaurant.isOpen ? '#14532d' : '#3f1010', color: restaurant.isOpen ? '#4ade80' : '#f87171' }}>
                  {restaurant.isOpen ? 'Ouvert' : 'Fermé'}
                </span>
                <button onClick={handleToggle} title="Basculer statut" style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#666', display: 'flex', padding: 4 }}>
                  {restaurant.isOpen ? <ToggleRight size={22} color="#4ade80" /> : <ToggleLeft size={22} color="#555" />}
                </button>
              </div>
            </div>
          )}
        </div>

        <nav style={{ flex: 1, padding: '12px 10px', display: 'flex', flexDirection: 'column', gap: 2 }}>
          {NAV.map(({ id, label, icon: Icon }) => (
            <button key={id} onClick={() => setTab(id)} style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '11px 12px', borderRadius: 10, border: 'none', cursor: 'pointer',
              fontWeight: 700, fontSize: 13, textAlign: 'left', fontFamily: 'Outfit,sans-serif',
              background: tab === id ? C.red : 'transparent',
              color: tab === id ? '#fff' : '#888', transition: 'all .18s', position: 'relative',
            }}>
              <Icon size={16} strokeWidth={tab === id ? 2.5 : 2} />
              {label}
              {id === 'orders' && pendingOrders.length > 0 && (
                <span style={{ marginLeft: 'auto', background: '#ef4444', color: '#fff', borderRadius: 999, fontSize: 10, fontWeight: 800, padding: '2px 7px', flexShrink: 0 }}>
                  {pendingOrders.length}
                </span>
              )}
            </button>
          ))}
          <button onClick={() => setInfoModal(true)} style={{
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '11px 12px', borderRadius: 10, border: 'none', cursor: 'pointer',
            fontWeight: 700, fontSize: 13, background: 'transparent', color: '#888',
            fontFamily: 'Outfit,sans-serif', transition: 'all .18s',
          }}>
            <Edit3 size={16} /> {restaurant ? 'Modifier infos' : 'Créer restaurant'}
          </button>
        </nav>

        <div style={{ padding: '12px 10px', borderTop: '1px solid #222' }}>
          <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', color: '#888', textDecoration: 'none', fontWeight: 700, fontSize: 13, borderRadius: 10 }}>
            <Home size={16} /> Accueil
          </Link>
          <button onClick={() => { localStorage.removeItem('token'); localStorage.removeItem('user'); navigate('/'); }}
            style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', padding: '10px 12px', background: 'transparent', border: 'none', color: '#ef4444', fontWeight: 700, fontSize: 13, cursor: 'pointer', borderRadius: 10, fontFamily: 'Outfit,sans-serif' }}>
            <LogOut size={16} /> Déconnexion
          </button>
        </div>
      </aside>

      {/* ── MAIN ── */}
      <div style={{ flex: 1, padding: '28px 32px', overflowY: 'auto', minWidth: 0 }}>

        {/* Header with Notifications */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', marginBottom: 24, position: 'relative' }}>
          <button 
            onClick={() => setNotifOpen(!notifOpen)} 
            style={{
              width: 44, 
              height: 44, 
              borderRadius: 12, 
              border: `1px solid ${C.border}`,
              background: C.card,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              position: 'relative',
              transition: 'all 0.15s'
            }}
          >
            <Bell size={20} color={C.text} />
            {notifications.filter(n => !n.is_read).length > 0 && (
              <span style={{
                position: 'absolute',
                top: 8,
                right: 8,
                width: 10,
                height: 10,
                borderRadius: '50%',
                background: C.red
              }} />
            )}
          </button>

          {/* Notifications Dropdown */}
          <AnimatePresence>
            {notifOpen && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                style={{
                  position: 'absolute',
                  top: 56,
                  right: 0,
                  width: 380,
                  maxHeight: 450,
                  overflowY: 'auto',
                  background: C.card,
                  borderRadius: 16,
                  boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
                  zIndex: 1000,
                  border: `1px solid ${C.border}`
                }}
              >
                <div style={{ padding: '16px 20px', borderBottom: `1px solid ${C.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h3 style={{ margin: 0, fontWeight: 800, fontSize: 16, color: C.text }}>Notifications</h3>
                  {notifications.filter(n => !n.is_read).length > 0 && (
                    <button 
                      onClick={markAllAsRead}
                      style={{ 
                        fontSize: 12, 
                        fontWeight: 700, 
                        color: C.red, 
                        background: 'none', 
                        border: 'none', 
                        cursor: 'pointer' 
                      }}
                    >
                      Tous lus
                    </button>
                  )}
                </div>
                
                <div style={{ padding: 8 }}>
                  {notifications.length === 0 ? (
                    <div style={{ padding: 32, textAlign: 'center', color: C.muted }}>
                      <p>Aucune notification</p>
                    </div>
                  ) : (
                    notifications.map((n) => (
                      <div 
                        key={n.id}
                        onClick={() => !n.is_read && markAsRead(n.id)}
                        style={{
                          padding: '14px 16px',
                          borderRadius: 12,
                          background: n.is_read ? 'transparent' : C.red + '08',
                          cursor: 'pointer',
                          marginBottom: 4,
                          transition: 'background 0.15s'
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <div style={{ flex: 1 }}>
                            <p style={{ margin: 0, fontWeight: 700, fontSize: 13, color: C.text }}>{n.title}</p>
                            <p style={{ margin: '4px 0 0', fontSize: 12, color: C.sub }}>{n.message}</p>
                          </div>
                          <p style={{ margin: 0, fontSize: 11, color: C.muted, whiteSpace: 'nowrap', marginLeft: 8 }}>
                            {new Date(n.created_at).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Feedback toast */}
        <AnimatePresence>
          {msg.text && (
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
              style={{ background: msg.ok ? '#F0FDF4' : '#FEF2F2', border: `1px solid ${msg.ok ? '#86EFAC' : '#FECACA'}`, color: msg.ok ? '#15803D' : '#DC2626', padding: '12px 20px', borderRadius: 12, marginBottom: 20, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
              {msg.ok ? <Check size={16}/> : <AlertCircle size={16}/>} {msg.text}
            </motion.div>
          )}
        </AnimatePresence>

        {/* No restaurant */}
        {!restaurant && (
          <div style={{ background: C.card, borderRadius: 24, padding: '60px 40px', textAlign: 'center', boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
            <Store size={60} color="#ddd" style={{ marginBottom: 20 }} />
            <h2 style={{ margin: '0 0 10px', color: C.text, fontWeight: 900 }}>Créez votre restaurant</h2>
            <p style={{ color: C.muted, marginBottom: 28 }}>Votre compte a été approuvé. Configurez maintenant votre restaurant.</p>
            <button onClick={() => setInfoModal(true)} style={{ background: C.red, color: '#fff', border: 'none', padding: '14px 32px', borderRadius: 999, fontWeight: 800, cursor: 'pointer', fontSize: 15, boxShadow: `0 6px 20px ${C.red}40` }}>
              + Créer mon restaurant
            </button>
          </div>
        )}

        {restaurant && (
          <AnimatePresence mode="wait">

            {/* ══════════════ COMMANDES ══════════════ */}
            {tab === 'orders' && (
              <motion.div key="orders" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                {/* Header */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
                  <h2 style={{ margin: 0, fontWeight: 900, fontSize: 22, color: C.text }}>Commandes</h2>
                  <div style={{ display: 'flex', gap: 8 }}>
                    {[
                      { id: 'all', label: 'Toutes' },
                      { id: 'pending', label: `En attente${pendingOrders.length ? ` (${pendingOrders.length})` : ''}` },
                      { id: 'preparing', label: 'Préparation' },
                      { id: 'delivered', label: 'Livrées' },
                      { id: 'cancelled', label: 'Annulées' },
                    ].map(f => (
                      <button key={f.id} onClick={() => setOrderFilter(f.id)} style={{
                        padding: '7px 14px', borderRadius: 999, border: 'none', cursor: 'pointer', fontSize: 12,
                        fontWeight: 700, fontFamily: 'Outfit,sans-serif',
                        background: orderFilter === f.id ? C.red : C.card,
                        color: orderFilter === f.id ? '#fff' : C.sub,
                        boxShadow: orderFilter === f.id ? `0 4px 12px ${C.red}40` : '0 1px 4px rgba(0,0,0,0.06)',
                      }}>
                        {f.label}
                      </button>
                    ))}
                    <button onClick={() => loadOrders(restaurant.id)} style={{ width: 34, height: 34, borderRadius: 9, border: `1px solid ${C.border}`, background: C.card, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.muted }}>
                      <RefreshCw size={14}/>
                    </button>
                  </div>
                </div>

                {loading ? (
                  <div style={{ textAlign: 'center', padding: 60, color: C.muted }}>Chargement...</div>
                ) : filteredOrders.length === 0 ? (
                  <div style={{ background: C.card, borderRadius: 20, padding: 60, textAlign: 'center', boxShadow: '0 2px 12px rgba(0,0,0,0.05)' }}>
                    <ShoppingBag size={44} color="#ddd" style={{ marginBottom: 12 }} />
                    <p style={{ color: C.muted, fontWeight: 600 }}>Aucune commande</p>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                    {filteredOrders.map(order => (
                      <motion.div key={order.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                        style={{ background: C.card, borderRadius: 16, padding: '18px 22px', boxShadow: '0 2px 12px rgba(0,0,0,0.05)', borderLeft: `4px solid ${STATUS[order.status]?.dot || '#eee'}` }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8, flexWrap: 'wrap' }}>
                              <span style={{ fontWeight: 900, fontSize: 15, color: C.text }}>Commande #{order.id}</span>
                              <span style={{ fontWeight: 900, fontSize: 15, color: C.red }}>{Number(order.total_price).toFixed(2)} MAD</span>
                              <StatusBadge status={order.status} />
                              {/* Payment status badge */}
                              <span style={{
                                display: 'inline-flex', alignItems: 'center', gap: 5,
                                background: order.payment_status === 'paid' ? '#f0fdf4' : '#fff7ed',
                                color: order.payment_status === 'paid' ? '#15803d' : '#c2410c',
                                padding: '3px 10px', borderRadius: 999, fontSize: 11, fontWeight: 700
                              }}>
                                {order.payment_status === 'paid'
                                  ? <><Check size={11} /> Payé</>  
                                  : <><Banknote size={11} /> {order.payment_method === 'cash' ? 'COD' : 'En attente'}</>}
                              </span>
                              <span style={{ color: C.muted, fontSize: 11, marginLeft: 'auto' }}>
                                {new Date(order.created_at).toLocaleString('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                            <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 8 }}>
                              <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 13, color: C.sub }}><User size={13}/>{order.client_name}{order.client_phone && ` · ${order.client_phone}`}</span>
                              {order.address && <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 13, color: C.sub }}><MapPin size={13}/>{order.address.substring(0, 50)}</span>}
                            </div>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                              {order.items?.map(item => (
                                <span key={item.id} style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: 6, padding: '3px 10px', fontSize: 12, color: C.sub }}>
                                  {item.quantity}× {item.item_name}
                                </span>
                              ))}
                            </div>
                            {order.note && <p style={{ margin: '6px 0 0', color: C.muted, fontSize: 12, fontStyle: 'italic' }}>Note: {order.note}</p>}
                          </div>
                          <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                            {order.status === 'pending' && (
                              <>
                                <button onClick={() => handleOrderStatus(order.id, 'accepted')}
                                  style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#F0FDF4', color: '#15803D', border: '1.5px solid #BBF7D0', padding: '9px 16px', borderRadius: 10, fontWeight: 700, fontSize: 13, cursor: 'pointer', fontFamily: 'Outfit,sans-serif' }}>
                                  <Check size={14}/> Accepter
                                </button>
                                <button onClick={() => handleOrderStatus(order.id, 'cancelled')}
                                  style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#FEF2F2', color: '#DC2626', border: '1.5px solid #FECACA', padding: '9px 16px', borderRadius: 10, fontWeight: 700, fontSize: 13, cursor: 'pointer', fontFamily: 'Outfit,sans-serif' }}>
                                  <X size={14}/> Refuser
                                </button>
                              </>
                            )}
                            {order.status === 'accepted' && (
                              <button onClick={() => handleOrderStatus(order.id, 'preparing')}
                                style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#FEFCE8', color: '#A16207', border: '1.5px solid #FEF08A', padding: '9px 16px', borderRadius: 10, fontWeight: 700, fontSize: 13, cursor: 'pointer', fontFamily: 'Outfit,sans-serif' }}>
                                <Utensils size={14}/> Lancer préparation
                              </button>
                            )}
                            {order.status === 'preparing' && (
                              <button onClick={() => handleOrderStatus(order.id, 'ready')}
                                style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#EFF6FF', color: '#1D4ED8', border: '1.5px solid #BFDBFE', padding: '9px 16px', borderRadius: 10, fontWeight: 700, fontSize: 13, cursor: 'pointer', fontFamily: 'Outfit,sans-serif' }}>
                                <Package size={14}/> Commande prête (Recherche livreur)
                              </button>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </motion.div>
            )}

            {/* ══════════════ MENU ══════════════ */}
            {tab === 'menu' && (
              <motion.div key="menu" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
                  <h2 style={{ margin: 0, fontWeight: 900, fontSize: 22, color: C.text }}>Menu <span style={{ color: C.muted, fontWeight: 600, fontSize: 16 }}>({menu.length} plats)</span></h2>
                  <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                    <input value={menuSearch} onChange={e => setMenuSearch(e.target.value)} placeholder="Rechercher..."
                      style={{ ...inputStyle, width: 180, padding: '8px 12px' }} />
                    <button onClick={() => openItemModal()} style={{ display: 'flex', alignItems: 'center', gap: 7, background: C.red, color: '#fff', border: 'none', padding: '10px 18px', borderRadius: 10, fontWeight: 700, cursor: 'pointer', fontSize: 13, fontFamily: 'Outfit,sans-serif', boxShadow: `0 4px 14px ${C.red}40` }}>
                      <Plus size={15}/> Ajouter un plat
                    </button>
                  </div>
                </div>

                {/* Category filter */}
                {categories.length > 0 && (
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 18 }}>
                    {categories.map(cat => (
                      <button key={cat} onClick={() => setMenuSearch(cat === menuSearch ? '' : cat)}
                        style={{ padding: '6px 14px', borderRadius: 999, border: `1.5px solid ${menuSearch === cat ? C.red : C.border}`, background: menuSearch === cat ? C.red + '12' : C.card, color: menuSearch === cat ? C.red : C.sub, fontWeight: 700, fontSize: 12, cursor: 'pointer', fontFamily: 'Outfit,sans-serif' }}>
                        {cat}
                      </button>
                    ))}
                  </div>
                )}

                {menuLoading ? (
                  <div style={{ textAlign: 'center', padding: 60, color: C.muted }}>Chargement...</div>
                ) : filteredMenu.length === 0 ? (
                  <div style={{ background: C.card, borderRadius: 20, padding: 60, textAlign: 'center', boxShadow: '0 2px 12px rgba(0,0,0,0.05)' }}>
                    <Utensils size={44} color="#ddd" style={{ marginBottom: 12 }} />
                    <p style={{ color: C.muted, fontWeight: 600 }}>Aucun plat dans le menu</p>
                    <button onClick={() => openItemModal()} style={{ marginTop: 16, background: C.red, color: '#fff', border: 'none', padding: '12px 24px', borderRadius: 999, fontWeight: 700, cursor: 'pointer', fontSize: 14 }}>
                      + Ajouter le premier plat
                    </button>
                  </div>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(270px,1fr))', gap: 16 }}>
                    {filteredMenu.map(item => (
                      <motion.div key={item.id} whileHover={{ y: -3 }} transition={{ type: 'spring', stiffness: 300, damping: 22 }}
                        style={{ background: C.card, borderRadius: 16, overflow: 'hidden', boxShadow: '0 2px 12px rgba(0,0,0,0.06)', opacity: item.isAvailable ? 1 : 0.55, position: 'relative' }}>
                        {/* Image */}
                        <div style={{ height: 150, overflow: 'hidden', background: C.bg, position: 'relative' }}>
                          {item.image_url
                            ? <img src={item.image_url} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Utensils size={36} color={C.muted} style={{ opacity: .4 }}/></div>
                          }
                          {/* Availability badge */}
                          <span style={{ position: 'absolute', top: 8, left: 8, background: item.isAvailable ? '#15803D' : '#DC2626', color: '#fff', fontSize: 10, fontWeight: 800, padding: '3px 8px', borderRadius: 999, display: 'inline-flex', alignItems: 'center', gap: 3 }}>
                            <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#fff' }}/>
                            {item.isAvailable ? 'Disponible' : 'Indisponible'}
                          </span>
                          {/* Actions overlay */}
                          <div style={{ position: 'absolute', top: 8, right: 8, display: 'flex', gap: 5 }}>
                            <button onClick={() => openItemModal(item)} style={{ width: 30, height: 30, borderRadius: 8, background: 'rgba(255,255,255,0.9)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
                              <Edit3 size={13} color="#3B82F6"/>
                            </button>
                            <button onClick={() => handleDeleteItem(item.id)} style={{ width: 30, height: 30, borderRadius: 8, background: 'rgba(255,255,255,0.9)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
                              <Trash2 size={13} color="#DC2626"/>
                            </button>
                          </div>
                        </div>
                        {/* Info */}
                        <div style={{ padding: '14px 16px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <p style={{ margin: 0, fontWeight: 800, fontSize: 14, color: C.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.name}</p>
                              {item.category && <p style={{ margin: '2px 0 0', fontSize: 11, color: C.muted, fontWeight: 600 }}>{item.category}</p>}
                            </div>
                            <span style={{ fontWeight: 900, fontSize: 16, color: C.red, flexShrink: 0 }}>{Number(item.price).toFixed(2)} MAD</span>
                          </div>
                          {item.description && <p style={{ margin: '8px 0 0', color: C.muted, fontSize: 12, lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{item.description}</p>}
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </motion.div>
            )}

            {/* ══════════════ STATS ══════════════ */}
            {tab === 'stats' && (
              <motion.div key="stats" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                <h2 style={{ margin: '0 0 20px', fontWeight: 900, fontSize: 22, color: C.text }}>Statistiques</h2>

                {!stats ? (
                  <div style={{ textAlign: 'center', padding: 60, color: C.muted }}>Chargement...</div>
                ) : (
                  <>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: 14, marginBottom: 20 }}>
                      <StatCard label="Total commandes"  value={stats.totalOrders}                            color="#6366F1" icon={ShoppingBag} />
                      <StatCard label="En attente"       value={stats.pendingOrders}                          color="#F97316" icon={Clock} />
                      <StatCard label="Revenus (MAD)"    value={Number(stats.revenue).toFixed(0)}             color={C.red}  icon={DollarSign} sub="commandes livrées" />
                      <StatCard label="Note moyenne"     value={<span style={{display:'flex',alignItems:'center',gap:4}}><Star size={16} fill="#F59E0B" color="#F59E0B"/>{stats.avgRating}</span>} color="#F59E0B" icon={Star} />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 16 }}>
                      {/* Revenue chart */}
                      <div style={{ background: C.card, borderRadius: 18, padding: '22px 24px', boxShadow: '0 2px 12px rgba(0,0,0,0.05)' }}>
                        <p style={{ margin: '0 0 16px', fontWeight: 800, fontSize: 14, color: C.text }}>Revenus mensuels (MAD)</p>
                        <Bar data={chartData} options={{ responsive: true, plugins: { legend: { display: false } }, scales: { x: { grid: { display: false }, ticks: { font: { family: 'Outfit', size: 10 } } }, y: { grid: { color: C.bg }, ticks: { font: { family: 'Outfit', size: 10 } }, beginAtZero: true } } }} />
                      </div>

                      {/* Top items */}
                      <div style={{ background: C.card, borderRadius: 18, padding: '22px 24px', boxShadow: '0 2px 12px rgba(0,0,0,0.05)' }}>
                        <p style={{ margin: '0 0 16px', fontWeight: 800, fontSize: 14, color: C.text }}>Top plats vendus</p>
                        {stats.topItems?.length > 0
                          ? stats.topItems.map((item, i) => (
                              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 0', borderBottom: i < stats.topItems.length - 1 ? `1px solid ${C.border}` : 'none' }}>
                                <span style={{ width: 22, height: 22, borderRadius: 6, background: C.red + '18', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 800, color: C.red, flexShrink: 0 }}>#{i + 1}</span>
                                <span style={{ flex: 1, fontSize: 13, color: C.text, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.name}</span>
                                <span style={{ fontSize: 13, color: C.red, fontWeight: 800 }}>{item.total_sold} vendus</span>
                              </div>
                            ))
                          : <p style={{ color: C.muted, fontSize: 13 }}>Aucune donnée encore</p>
                        }
                      </div>
                    </div>
                  </>
                )}
              </motion.div>
            )}

            {/* ══════════════ COUPONS ══════════════ */}
            {tab === 'coupons' && (
              <motion.div key="coupons" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                <h2 style={{ margin: '0 0 20px', fontWeight: 900, fontSize: 22, color: C.text }}>Coupons & Offres</h2>
                <div style={{ display: 'flex', gap: 14, marginBottom: 20, flexWrap: 'wrap' }}>
                  <button onClick={() => { setCouponForm({ code: '', discount_type: 'percentage', discount_value: '', min_order: '', max_uses: '' }); setCouponModal(true); }} style={{ display: 'flex', alignItems: 'center', gap: 7, background: C.red, color: '#fff', border: 'none', padding: '10px 18px', borderRadius: 10, fontWeight: 700, cursor: 'pointer', fontSize: 13, fontFamily: 'Outfit,sans-serif', boxShadow: `0 4px 14px ${C.red}40` }}>
                    <Plus size={15}/> Créer mon coupon
                  </button>
                  <button onClick={loadCoupons} style={{ width: 34, height: 34, borderRadius: 9, border: `1px solid ${C.border}`, background: C.card, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.muted }}>
                    <RefreshCw size={14}/>
                  </button>
                </div>

                {/* Admin Coupons */}
                {coupons.adminCoupons.length > 0 && (
                  <div style={{ marginBottom: 30 }}>
                    <h3 style={{ margin: '0 0 14px', fontWeight: 800, fontSize: 16, color: C.text }}>Coupons de l'administration</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                      {coupons.adminCoupons.map(c => (
                        <div key={c.id} style={{ background: C.card, borderRadius: 14, padding: '18px 20px', boxShadow: '0 2px 12px rgba(0,0,0,0.05)', borderLeft: `4px solid ${c.acceptance_status === 'accepted' ? '#15803D' : c.acceptance_status === 'declined' ? '#DC2626' : '#F97316'}` }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10, marginBottom: 10 }}>
                            <div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                                <span style={{ fontWeight: 900, fontSize: 15, color: C.text }}>{c.code}</span>
                                <span style={{ fontSize: 12, fontWeight: 800, color: C.red }}>{c.discount_type === 'percentage' ? `${c.discount_value}%` : `${c.discount_value} MAD`}</span>
                              </div>
                              <p style={{ margin: 0, color: C.muted, fontSize: 12 }}>
                                Minimum: {c.min_order} MAD | {c.max_uses ? `Max ${c.max_uses} utilisations` : 'Illimité'}
                              </p>
                            </div>
                            <span style={{
                              background: c.acceptance_status === 'accepted' ? '#F0FDF4' : c.acceptance_status === 'declined' ? '#FEF2F2' : '#FFF7ED',
                              color: c.acceptance_status === 'accepted' ? '#15803D' : c.acceptance_status === 'declined' ? '#DC2626' : '#C2410C',
                              padding: '4px 10px', borderRadius: 999, fontSize: 11, fontWeight: 700
                            }}>
                              {c.acceptance_status === 'accepted' ? 'Accepté' : c.acceptance_status === 'declined' ? 'Refusé' : 'En attente'}
                            </span>
                          </div>
                          {c.acceptance_status === 'pending' && (
                            <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                              <button onClick={() => handleAdminCouponAccept(c.id, 'accepted')} style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#F0FDF4', color: '#15803D', border: '1.5px solid #BBF7D0', padding: '8px 14px', borderRadius: 9, fontWeight: 700, fontSize: 12, cursor: 'pointer', fontFamily: 'Outfit,sans-serif' }}>
                                <Check size={14}/> Accepter
                              </button>
                              <button onClick={() => handleAdminCouponAccept(c.id, 'declined')} style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#FEF2F2', color: '#DC2626', border: '1.5px solid #FECACA', padding: '8px 14px', borderRadius: 9, fontWeight: 700, fontSize: 12, cursor: 'pointer', fontFamily: 'Outfit,sans-serif' }}>
                                <X size={14}/> Refuser
                              </button>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* My Coupons */}
                <h3 style={{ margin: '0 0 14px', fontWeight: 800, fontSize: 16, color: C.text }}>Mes coupons</h3>
                {coupons.myCoupons.length === 0 ? (
                  <div style={{ background: C.card, borderRadius: 20, padding: '60px 40px', textAlign: 'center', boxShadow: '0 2px 12px rgba(0,0,0,0.05)' }}>
                    <Tag size={48} color="#ddd" style={{ marginBottom: 12 }} />
                    <p style={{ color: C.muted, fontWeight: 600 }}>Vous n'avez pas encore créé de coupon</p>
                    <button onClick={() => { setCouponForm({ code: '', discount_type: 'percentage', discount_value: '', min_order: '', max_uses: '' }); setCouponModal(true); }} style={{ marginTop: 16, background: C.red, color: '#fff', border: 'none', padding: '12px 24px', borderRadius: 999, fontWeight: 700, cursor: 'pointer', fontSize: 14 }}>
                      + Créer mon premier coupon
                    </button>
                  </div>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(300px,1fr))', gap: 14 }}>
                    {coupons.myCoupons.map(c => (
                      <motion.div key={c.id} whileHover={{ y: -2 }} style={{ background: C.card, borderRadius: 14, padding: '16px 18px', boxShadow: '0 2px 12px rgba(0,0,0,0.05)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10, marginBottom: 10 }}>
                          <div>
                            <span style={{ display: 'block', fontWeight: 900, fontSize: 16, color: C.text }}>{c.code}</span>
                            <span style={{ fontSize: 14, fontWeight: 800, color: C.red }}>{c.discount_type === 'percentage' ? `${c.discount_value}%` : `${c.discount_value} MAD`}</span>
                          </div>
                          <div style={{ display: 'flex', gap: 6 }}>
                            <button onClick={() => handleToggleCoupon(c.id)} style={{ width: 30, height: 30, borderRadius: 8, background: c.is_active ? '#F0FDF4' : '#FFF7ED', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: c.is_active ? '#15803D' : '#C2410C' }}>
                              {c.is_active ? <Eye size={14}/> : <EyeOff size={14}/>}
                            </button>
                            <button onClick={() => handleDeleteCoupon(c.id)} style={{ width: 30, height: 30, borderRadius: 8, background: '#FEF2F2', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#DC2626' }}>
                              <Trash2 size={14}/>
                            </button>
                          </div>
                        </div>
                        <p style={{ margin: '4px 0 0', color: C.muted, fontSize: 12 }}>
                          Minimum: {c.min_order} MAD | Utilisés: {c.used_count}{c.max_uses ? `/${c.max_uses}` : ''}
                        </p>
                        <div style={{ marginTop: 10, display: 'flex', gap: 4 }}>
                          <span style={{ padding: '3px 8px', borderRadius: 6, background: c.is_active ? '#F0FDF4' : '#FFF7ED', color: c.is_active ? '#15803D' : '#C2410C', fontSize: 10, fontWeight: 700 }}>
                            {c.is_active ? 'Actif' : 'Inactif'}
                          </span>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}

              </motion.div>
            )}

            {/* ══════════════ REVIEWS ══════════════ */}
            {tab === 'reviews' && (
              <motion.div key="reviews" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
                  <h2 style={{ margin: 0, fontWeight: 900, fontSize: 22, color: C.text }}>Avis clients <span style={{ color: C.muted, fontWeight: 600, fontSize: 16 }}>({reviews.length})</span></h2>
                  <button onClick={() => loadReviews(restaurant.id)} style={{ width: 34, height: 34, borderRadius: 9, border: `1px solid ${C.border}`, background: C.card, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.muted }}>
                    <RefreshCw size={14}/>
                  </button>
                </div>

                {reviews.length === 0 ? (
                  <div style={{ background: C.card, borderRadius: 20, padding: 60, textAlign: 'center', boxShadow: '0 2px 12px rgba(0,0,0,0.05)' }}>
                    <Star size={44} color="#ddd" style={{ marginBottom: 12 }} />
                    <p style={{ color: C.muted, fontWeight: 600 }}>Aucun avis pour le moment</p>
                  </div>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(300px,1fr))', gap: 14 }}>
                    {reviews.map(review => (
                      <motion.div key={review.id} whileHover={{ y: -2 }} style={{ background: C.card, borderRadius: 14, padding: '18px 20px', boxShadow: '0 2px 12px rgba(0,0,0,0.05)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                          <div>
                            <p style={{ margin: 0, fontWeight: 800, fontSize: 15, color: C.text }}>{review.user_name}</p>
                            <p style={{ margin: '2px 0 0', color: C.muted, fontSize: 11 }}>
                              {new Date(review.created_at).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })}
                            </p>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 4, background: '#FFFBEB', padding: '4px 8px', borderRadius: 8 }}>
                            <Star size={14} fill="#F59E0B" color="#F59E0B"/>
                            <span style={{ fontWeight: 800, fontSize: 13, color: '#D97706' }}>{review.rating}/5</span>
                          </div>
                        </div>
                        {review.comment ? (
                          <p style={{ margin: 0, color: C.sub, fontSize: 13, lineHeight: 1.5 }}>"{review.comment}"</p>
                        ) : (
                          <p style={{ margin: 0, color: C.muted, fontSize: 13, fontStyle: 'italic' }}>Aucun commentaire laissé.</p>
                        )}
                      </motion.div>
                    ))}
                  </div>
                )}
              </motion.div>
            )}

          </AnimatePresence>
        )}
      </div>

      {/* ══════════════ MODAL — PLAT ══════════════ */}
      <AnimatePresence>
        {itemModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setItemModal(false)}
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 3000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
            <motion.div initial={{ scale: 0.92, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.92 }}
              onClick={e => e.stopPropagation()}
              style={{ background: '#fff', borderRadius: 22, padding: '32px 36px', width: '100%', maxWidth: 520, maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 30px 80px rgba(0,0,0,0.2)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                <h3 style={{ margin: 0, fontWeight: 900, fontSize: 20, color: C.text }}>{editItem ? 'Modifier le plat' : 'Ajouter un plat'}</h3>
                <button onClick={() => setItemModal(false)} style={{ background: C.bg, border: 'none', borderRadius: '50%', width: 34, height: 34, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}><X size={16} color={C.muted}/></button>
              </div>
              <form onSubmit={handleSaveItem} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {/* Image upload */}
                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, color: C.muted, display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '.05em' }}>Photo du plat</label>
                  <ImageUpload value={itemForm.image_url} onChange={v => setItemForm(f => ({ ...f, image_url: v }))} height={160} placeholder="Ajouter une photo du plat" />
                </div>
                <input style={inputStyle} placeholder="Nom du plat *" value={itemForm.name} onChange={e => setItemForm(f => ({ ...f, name: e.target.value }))} required
                  onFocus={e => e.target.style.borderColor = C.red} onBlur={e => e.target.style.borderColor = C.border} />
                <textarea style={{ ...inputStyle, resize: 'vertical', minHeight: 70 }} placeholder="Description (optionnel)" value={itemForm.description} onChange={e => setItemForm(f => ({ ...f, description: e.target.value }))}
                  onFocus={e => e.target.style.borderColor = C.red} onBlur={e => e.target.style.borderColor = C.border} />
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <input style={inputStyle} placeholder="Prix (MAD) *" type="number" step="0.01" min="0" value={itemForm.price} onChange={e => setItemForm(f => ({ ...f, price: e.target.value }))} required
                    onFocus={e => e.target.style.borderColor = C.red} onBlur={e => e.target.style.borderColor = C.border} />
                  <input style={inputStyle} placeholder="Catégorie" value={itemForm.category} onChange={e => setItemForm(f => ({ ...f, category: e.target.value }))}
                    onFocus={e => e.target.style.borderColor = C.red} onBlur={e => e.target.style.borderColor = C.border} />
                </div>
                <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', padding: '10px 14px', borderRadius: 10, border: `1.5px solid ${itemForm.isAvailable ? '#BBF7D0' : C.border}`, background: itemForm.isAvailable ? '#F0FDF4' : C.bg }}>
                  <div onClick={() => setItemForm(f => ({ ...f, isAvailable: !f.isAvailable }))}
                    style={{ width: 20, height: 20, borderRadius: 6, border: `2px solid ${itemForm.isAvailable ? '#16A34A' : C.border}`, background: itemForm.isAvailable ? '#16A34A' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: '.15s' }}>
                    {itemForm.isAvailable && <Check size={12} color="#fff" strokeWidth={3}/>}
                  </div>
                  <span style={{ fontSize: 13, fontWeight: 700, color: itemForm.isAvailable ? '#15803D' : C.muted }}>
                    {itemForm.isAvailable ? 'Disponible à la commande' : 'Non disponible'}
                  </span>
                </label>
                <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
                  <button type="submit" disabled={savingItem} style={{ flex: 1, background: savingItem ? C.muted : C.red, color: '#fff', border: 'none', padding: 14, borderRadius: 12, fontWeight: 800, cursor: savingItem ? 'not-allowed' : 'pointer', fontSize: 15, fontFamily: 'Outfit,sans-serif', boxShadow: `0 6px 18px ${C.red}40`, transition: '.18s' }}>
                    {savingItem ? 'Enregistrement...' : editItem ? 'Mettre à jour' : 'Ajouter le plat'}
                  </button>
                  <button type="button" onClick={() => setItemModal(false)} style={{ padding: '14px 20px', borderRadius: 12, border: `1.5px solid ${C.border}`, background: '#fff', cursor: 'pointer', fontWeight: 700, fontFamily: 'Outfit,sans-serif', color: C.sub }}>
                    Annuler
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ══════════════ MODAL — INFOS RESTAURANT ══════════════ */}
      <AnimatePresence>
        {infoModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setInfoModal(false)}
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 3000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
            <motion.div initial={{ scale: 0.92, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.92 }}
              onClick={e => e.stopPropagation()}
              style={{ background: '#fff', borderRadius: 22, padding: '32px 36px', width: '100%', maxWidth: 560, maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 30px 80px rgba(0,0,0,0.2)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                <h3 style={{ margin: 0, fontWeight: 900, fontSize: 20, color: C.text }}>{restaurant ? 'Modifier le restaurant' : 'Créer mon restaurant'}</h3>
                <button onClick={() => setInfoModal(false)} style={{ background: C.bg, border: 'none', borderRadius: '50%', width: 34, height: 34, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}><X size={16} color={C.muted}/></button>
              </div>
              <form onSubmit={handleSaveResto} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {/* Photo du restaurant */}
                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, color: C.muted, display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '.05em' }}>Photo du restaurant</label>
                  <ImageUpload value={restoForm.image_url || ''} onChange={v => setRestoForm(f => ({ ...f, image_url: v }))} height={180} placeholder="Ajouter une photo de couverture" />
                </div>
                <input style={inputStyle} placeholder="Nom du restaurant *" value={restoForm.name || ''} onChange={e => setRestoForm(f => ({ ...f, name: e.target.value }))} required
                  onFocus={e => e.target.style.borderColor = C.red} onBlur={e => e.target.style.borderColor = C.border} />
                <textarea style={{ ...inputStyle, resize: 'vertical', minHeight: 80 }} placeholder="Description" value={restoForm.description || ''} onChange={e => setRestoForm(f => ({ ...f, description: e.target.value }))}
                  onFocus={e => e.target.style.borderColor = C.red} onBlur={e => e.target.style.borderColor = C.border} />
                <input style={inputStyle} placeholder="Adresse *" value={restoForm.address || ''} onChange={e => setRestoForm(f => ({ ...f, address: e.target.value }))} required
                  onFocus={e => e.target.style.borderColor = C.red} onBlur={e => e.target.style.borderColor = C.border} />
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <input style={inputStyle} placeholder="Ville" value={restoForm.city || ''} onChange={e => setRestoForm(f => ({ ...f, city: e.target.value }))}
                    onFocus={e => e.target.style.borderColor = C.red} onBlur={e => e.target.style.borderColor = C.border} />
                  <input style={inputStyle} placeholder="Type de cuisine" value={restoForm.cuisine || ''} onChange={e => setRestoForm(f => ({ ...f, cuisine: e.target.value }))}
                    onFocus={e => e.target.style.borderColor = C.red} onBlur={e => e.target.style.borderColor = C.border} />
                </div>
                <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
                  <button type="submit" disabled={savingResto} style={{ flex: 1, background: savingResto ? C.muted : C.red, color: '#fff', border: 'none', padding: 14, borderRadius: 12, fontWeight: 800, cursor: savingResto ? 'not-allowed' : 'pointer', fontSize: 15, fontFamily: 'Outfit,sans-serif', boxShadow: `0 6px 18px ${C.red}40` }}>
                    {savingResto ? 'Enregistrement...' : restaurant ? 'Sauvegarder' : 'Créer le restaurant'}
                  </button>
                  <button type="button" onClick={() => setInfoModal(false)} style={{ padding: '14px 20px', borderRadius: 12, border: `1.5px solid ${C.border}`, background: '#fff', cursor: 'pointer', fontWeight: 700, fontFamily: 'Outfit,sans-serif', color: C.sub }}>
                    Annuler
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ══════════════ MODAL — COUPON ══════════════ */}
      <AnimatePresence>
        {couponModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setCouponModal(false)}
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 3000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
            <motion.div initial={{ scale: 0.92, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.92 }}
              onClick={e => e.stopPropagation()}
              style={{ background: '#fff', borderRadius: 22, padding: '32px 36px', width: '100%', maxWidth: 500, maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 30px 80px rgba(0,0,0,0.2)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                <h3 style={{ margin: 0, fontWeight: 900, fontSize: 20, color: C.text }}>Créer un coupon</h3>
                <button onClick={() => setCouponModal(false)} style={{ background: C.bg, border: 'none', borderRadius: '50%', width: 34, height: 34, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}><X size={16} color={C.muted}/></button>
              </div>
              <form onSubmit={handleCreateCoupon} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <input style={inputStyle} placeholder="Code coupon * (ex: BIENVENUE10)" value={couponForm.code} onChange={e => setCouponForm({ ...couponForm, code: e.target.value.toUpperCase() })} required
                  onFocus={e => e.target.style.borderColor = C.red} onBlur={e => e.target.style.borderColor = C.border} />
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <select value={couponForm.discount_type} onChange={e => setCouponForm({ ...couponForm, discount_type: e.target.value })}
                    style={{ ...inputStyle, background: '#fff' }}>
                    <option value="percentage">Pourcentage (%)</option>
                    <option value="fixed">Montant fixe (MAD)</option>
                  </select>
                  <input style={inputStyle} placeholder="Valeur *" type="number" min="0" value={couponForm.discount_value} onChange={e => setCouponForm({ ...couponForm, discount_value: e.target.value })} required
                    onFocus={e => e.target.style.borderColor = C.red} onBlur={e => e.target.style.borderColor = C.border} />
                </div>
                <input style={inputStyle} placeholder="Commande minimum (MAD)" type="number" min="0" value={couponForm.min_order} onChange={e => setCouponForm({ ...couponForm, min_order: e.target.value })}
                  onFocus={e => e.target.style.borderColor = C.red} onBlur={e => e.target.style.borderColor = C.border} />
                <input style={inputStyle} placeholder="Utilisations maximum (laisser vide pour illimité)" type="number" min="1" value={couponForm.max_uses} onChange={e => setCouponForm({ ...couponForm, max_uses: e.target.value })}
                  onFocus={e => e.target.style.borderColor = C.red} onBlur={e => e.target.style.borderColor = C.border} />
                <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
                  <button type="submit" style={{ flex: 1, background: C.red, color: '#fff', border: 'none', padding: 14, borderRadius: 12, fontWeight: 800, cursor: 'pointer', fontSize: 15, fontFamily: 'Outfit,sans-serif', boxShadow: `0 6px 18px ${C.red}40` }}>
                    Créer le coupon
                  </button>
                  <button type="button" onClick={() => setCouponModal(false)} style={{ padding: '14px 20px', borderRadius: 12, border: `1.5px solid ${C.border}`, background: '#fff', cursor: 'pointer', fontWeight: 700, fontFamily: 'Outfit,sans-serif', color: C.sub }}>
                    Annuler
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
