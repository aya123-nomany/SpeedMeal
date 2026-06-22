import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { io } from 'socket.io-client';
import {
  User, ShoppingBag, LogOut, MapPin, Phone,
  Mail, Clock, ChevronRight, Home, Settings,
  Package, Star, Edit3, Check, X, Heart, Bell,
  Plus, Trash2, RefreshCw, Eye, Bike, Tag, AlertCircle, Send, Store, Globe
} from 'lucide-react';

const STATUS = {
  pending:              { bg: '#fff7ed', color: '#c2410c', dot: '#f97316', label: 'En attente' },
  accepted:             { bg: '#fefce8', color: '#a16207', dot: '#eab308', label: 'Acceptée' },
  preparing:            { bg: '#fefce8', color: '#a16207', dot: '#eab308', label: 'En préparation' },
  ready:                { bg: '#eff6ff', color: '#1d4ed8', dot: '#3b82f6', label: 'Prête' },
  searching_driver:     { bg: '#eff6ff', color: '#1d4ed8', dot: '#3b82f6', label: 'Recherche livreur' },
  driver_assigned:      { bg: '#eff6ff', color: '#1d4ed8', dot: '#3b82f6', label: 'Livreur assigné' },
  driver_at_restaurant: { bg: '#eff6ff', color: '#1d4ed8', dot: '#3b82f6', label: 'Livreur au resto' },
  on_the_way:           { bg: '#eff6ff', color: '#1d4ed8', dot: '#3b82f6', label: 'En route' },
  delivered:            { bg: '#f0fdf4', color: '#15803d', dot: '#22c55e', label: 'Livré' },
  cancelled:            { bg: '#fef2f2', color: '#b91c1c', dot: '#ef4444', label: 'Annulé' },
};

const StatusBadge = ({ status }) => {
  const s = STATUS[status] || { bg: '#f5f5f5', color: '#555', dot: '#aaa', label: status };
  return (
    <motion.button
      whileHover={{ scale: 1.05, boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
      whileTap={{ scale: 0.97 }}
      style={{ background: s.bg, color: s.color, padding: '6px 16px', borderRadius: '999px', fontSize: '12px', fontWeight: '800', display: 'inline-flex', alignItems: 'center', gap: '8px', border: 'none', cursor: 'pointer', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', transition: 'all 0.2s' }}
    >
      <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: s.dot, display: 'inline-block' }} />
      {s.label}
    </motion.button>
  );
};

import API_BASE_URL, { SOCKET_URL } from '../config/api';
const API = API_BASE_URL;

const inputStyle = {
  width: '100%', padding: '13px 16px', borderRadius: '12px',
  border: '1.5px solid #e5e7eb', fontSize: '15px', outline: 'none',
  background: '#fafafa', color: '#111', boxSizing: 'border-box',
  transition: 'border-color 0.2s',
};

export default function UserDashboard() {
  const [user, setUser]         = useState(null);
  const [orders, setOrders]     = useState([]);
  const [tab, setTab]           = useState('orders');
  const [profile, setProfile]   = useState({ name: '', phone: '', address: '' });
  const [saving, setSaving]     = useState(false);
  const [saveMsg, setSaveMsg]   = useState('');
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [favorites, setFavorites] = useState({ restaurants: [], items: [] });
  const [addresses, setAddresses] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [loyalty, setLoyalty]   = useState(null);
  const [newAddress, setNewAddress] = useState({ label: 'Maison', address: '', is_default: false });
  const [addingAddr, setAddingAddr] = useState(false);
  const [complaints, setComplaints] = useState([]);
  const [showComplaintForm, setShowComplaintForm] = useState(false);
  const [complaintForm, setComplaintForm] = useState({ subject: '', description: '', order_id: '', target: 'site', restaurant_id: '', driver_id: '' });
  const [submittingComplaint, setSubmittingComplaint] = useState(false);
  const [editingComplaint, setEditingComplaint] = useState(null);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const socketRef = useRef(null);
  const navigate = useNavigate();
  const token = localStorage.getItem('token');

  useEffect(() => {
    if (!token) { navigate('/login'); return; }
    fetchUser();
    fetchOrders();
    fetchFavorites();
    fetchAddresses();
    fetchNotifications();
    fetchComplaints();

    // Socket.io for real time updates
    socketRef.current = io(SOCKET_URL);
    
    // Listen to order status updates and refresh orders
    socketRef.current.on('orderStatusUpdate', () => {
      fetchOrders();
      fetchNotifications();
    });

    // Listen to new notifications
    socketRef.current.on('newNotification', () => {
      fetchNotifications();
    });

    return () => {
      socketRef.current?.disconnect();
    };
  }, []);

  const headers = { Authorization: `Bearer ${token}` };

  const fetchUser = async () => {
    try {
      const { data } = await axios.get(`${API}/auth/me`, { headers });
      setUser(data);
      setProfile({ name: data.name || '', phone: data.phone || '', address: data.address || '' });
      
      // Join user's socket room after getting user data
      if (socketRef.current && data) {
        socketRef.current.emit('joinUser', data.id);
      }
    } catch { navigate('/login'); }
  };

  const fetchOrders = async () => {
    setLoadingOrders(true);
    try {
      const { data } = await axios.get(`${API}/orders/my`, { headers });
      setOrders(data);
    } catch { setOrders([]); }
    setLoadingOrders(false);
  };

  const fetchFavorites = async () => {
    try {
      const { data } = await axios.get(`${API}/favorites`, { headers });
      setFavorites(data);
    } catch { setFavorites({ restaurants: [], items: [] }); }
  };

  const fetchAddresses = async () => {
    try {
      const { data } = await axios.get(`${API}/addresses`, { headers });
      setAddresses(data);
    } catch { setAddresses([]); }
  };

  const fetchNotifications = async () => {
    try {
      const { data } = await axios.get(`${API}/notifications`, { headers });
      setNotifications(data);
    } catch { setNotifications([]); }
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setSaving(true); setSaveMsg('');
    try {
      await axios.put(`${API}/auth/profile`, profile, { headers });
      setSaveMsg('success');
      fetchUser();
    } catch { setSaveMsg('error'); }
    setSaving(false);
  };

  const handleAddAddress = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API}/addresses`, newAddress, { headers });
      setNewAddress({ label: 'Maison', address: '', is_default: false });
      setAddingAddr(false);
      fetchAddresses();
    } catch (err) {
      alert(err.response?.data?.message || 'Error');
    }
  };

  const handleDeleteAddress = async (id) => {
    if (!window.confirm('Supprimer cette adresse?')) return;
    await axios.delete(`${API}/addresses/${id}`, { headers });
    fetchAddresses();
  };

  const handleSetDefaultAddress = async (id) => {
    await axios.put(`${API}/addresses/${id}/default`, {}, { headers });
    fetchAddresses();
  };

  const handleMarkRead = async (id) => {
    await axios.put(`${API}/notifications/${id}/read`, {}, { headers });
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
  };

  const handleMarkAllRead = async () => {
    await axios.put(`${API}/notifications/read-all`, {}, { headers });
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
  };

  const handleReorder = async (e, orderId) => {
    e.stopPropagation();
    try {
      const { data } = await axios.post(`${API}/orders/${orderId}/reorder`, {}, { headers });
      // Store reorder data and navigate to menu
      localStorage.setItem('reorderData', JSON.stringify(data));
      navigate('/menu');
    } catch (err) {
      alert(err.response?.data?.message || 'Error');
    }
  };

   const handleRemoveFavoriteRestaurant = async (restaurantId) => {
    await axios.post(`${API}/favorites/restaurant/${restaurantId}`, {}, { headers });
    fetchFavorites();
  };

  const handleRemoveFavoriteItem = async (itemId) => {
    await axios.post(`${API}/favorites/item/${itemId}`, {}, { headers });
    fetchFavorites();
  };

  const fetchComplaints = async () => {
    try {
      const { data } = await axios.get(`${API}/complaints/my`, { headers });
      setComplaints(data);
    } catch { setComplaints([]); }
  };

  const handleSubmitComplaint = async (e) => {
    e.preventDefault();
    if (!complaintForm.subject || !complaintForm.description) {
      alert('Veuillez remplir le sujet et la description');
      return;
    }
    setSubmittingComplaint(true);
    const payload = {
      ...complaintForm,
      restaurant_id: complaintForm.target === 'restaurant' && selectedOrder ? selectedOrder.restaurant_id : null,
      driver_id: complaintForm.target === 'driver' && selectedOrder ? selectedOrder.driver_id : null,
    };
    try {
      if (editingComplaint) {
        await axios.put(`${API}/complaints/${editingComplaint.id}`, payload, { headers });
      } else {
        await axios.post(`${API}/complaints`, payload, { headers });
      }
      setComplaintForm({ subject: '', description: '', order_id: '', target: 'site', restaurant_id: '', driver_id: '' });
      setShowComplaintForm(false);
      setEditingComplaint(null);
      setSelectedOrder(null);
      fetchComplaints();
      // Show success notification
      setNotifications(prev => [{
        id: Date.now(),
        title: editingComplaint ? 'Réclamation modifiée' : 'Réclamation envoyée',
        message: editingComplaint ? 'Votre réclamation a été modifiée avec succès' : 'Votre réclamation a été envoyée avec succès',
        type: 'promo',
        is_read: false,
        created_at: new Date().toISOString()
      }, ...prev]);
    } catch (err) {
      alert(err.response?.data?.error || 'Erreur lors de l\'envoi');
    }
    setSubmittingComplaint(false);
  };

  const handleEditComplaint = (complaint) => {
    setComplaintForm({
      subject: complaint.subject,
      description: complaint.description,
      order_id: complaint.order_id || '',
      target: complaint.target || 'site',
      restaurant_id: complaint.restaurant_id || '',
      driver_id: complaint.driver_id || ''
    });
    const order = orders.find(o => o.id === complaint.order_id);
    setSelectedOrder(order || null);
    setEditingComplaint(complaint);
    setShowComplaintForm(true);
  };

  const handleDeleteComplaint = async (id) => {
    try {
      await axios.delete(`${API}/complaints/${id}`, { headers });
      fetchComplaints();
      setNotifications(prev => [{
        id: Date.now(),
        title: 'Réclamation supprimée',
        message: 'Votre réclamation a été supprimée',
        type: 'promo',
        is_read: false,
        created_at: new Date().toISOString()
      }, ...prev]);
    } catch (err) {
      setNotifications(prev => [{
        id: Date.now(),
        title: 'Erreur',
        message: err.response?.data?.error || 'Erreur lors de la suppression',
        type: 'promo',
        is_read: false,
        created_at: new Date().toISOString()
      }, ...prev]);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/');
  };

  if (!user) return (
    <div style={{ minHeight: '100vh', background: '#f4f5f7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ width: '44px', height: '44px', border: '4px solid #f3f3f3', borderTop: '4px solid #A51C1C', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  const deliveredCount = orders.filter(o => o.status === 'delivered').length;
  const totalSpent     = orders.filter(o => o.status === 'delivered').reduce((s, o) => s + Number(o.total_price), 0);
  const activeStatuses = ['pending','accepted','preparing','ready','searching_driver','driver_assigned','driver_at_restaurant','on_the_way'];
  const pendingCount   = orders.filter(o => activeStatuses.includes(o.status)).length;
  const unreadNotifs   = notifications.filter(n => !n.is_read).length;

  const TABS = [
    { id: 'orders',        label: 'Mes commandes',   icon: <ShoppingBag size={17} /> },
    { id: 'favorites',     label: 'Favoris',          icon: <Heart size={17} /> },
    { id: 'addresses',     label: 'Adresses',         icon: <MapPin size={17} /> },
    { id: 'complaints',    label: 'Réclamations',     icon: <AlertCircle size={17} /> },
    { id: 'notifications', label: 'Notifications',    icon: <Bell size={17} />, badge: unreadNotifs },
    { id: 'profile',       label: 'Mon profil',       icon: <Settings size={17} /> },
  ];

  return (
    <div style={{ minHeight: '100vh', background: '#f4f5f7', paddingTop: '90px', paddingBottom: '60px' }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

      <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '0 20px', display: 'flex', gap: '28px', alignItems: 'flex-start' }}>

        {/* â”€â”€ SIDEBAR â”€â”€ */}
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
          style={{ width: '280px', flexShrink: 0, display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Avatar card */}
          <div style={{ background: '#fff', borderRadius: '24px', padding: '30px 24px', boxShadow: '0 4px 20px rgba(0,0,0,0.05)', textAlign: 'center' }}>
            <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'linear-gradient(135deg, #A51C1C, #c0392b)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
              <User size={36} color="#fff" />
            </div>
            <h3 style={{ margin: '0 0 4px', fontSize: '18px', fontWeight: '800', color: '#111' }}>{user.name}</h3>
            <p style={{ margin: '0 0 6px', color: '#888', fontSize: '13px' }}>{user.email}</p>
            <span style={{ background: '#fff0f0', color: '#A51C1C', padding: '4px 14px', borderRadius: '999px', fontSize: '12px', fontWeight: '800', textTransform: 'capitalize' }}>
              {user.role}
            </span>
            <p style={{ margin: '16px 0 0', color: '#bbb', fontSize: '12px', fontWeight: '600' }}>
              Membre depuis {new Date(user.created_at).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}
            </p>
          </div>

          {/* Stats */}
          <div style={{ background: '#fff', borderRadius: '20px', padding: '20px 24px', boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
            <p style={{ margin: '0 0 16px', fontSize: '13px', fontWeight: '800', color: '#888', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Statistiques</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {[
                { label: 'Commandes livrées', value: deliveredCount, color: '#22c55e' },
                { label: 'En cours',           value: pendingCount,   color: '#3b82f6' },
                { label: 'Total dépensé',      value: `${totalSpent.toFixed(2)} MAD`, color: '#A51C1C' },
              ].map((s, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '13px', color: '#666', fontWeight: '600' }}>{s.label}</span>
                  <span style={{ fontSize: '14px', fontWeight: '900', color: s.color }}>{s.value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Nav */}
          <div style={{ background: '#fff', borderRadius: '20px', padding: '12px', boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
            {TABS.map(t => (
              <button key={t.id} onClick={() => setTab(t.id)} style={{
                width: '100%', display: 'flex', alignItems: 'center', gap: '12px',
                padding: '13px 16px', borderRadius: '14px', border: 'none', cursor: 'pointer',
                fontWeight: '700', fontSize: '14px', textAlign: 'left', transition: 'all 0.2s',
                background: tab === t.id ? '#A51C1C' : 'transparent',
                color: tab === t.id ? '#fff' : '#555',
                marginBottom: '4px',
              }}>
                {t.icon} {t.label}
                {t.badge > 0 && (
                  <span style={{ marginLeft: 'auto', background: tab === t.id ? 'rgba(255,255,255,0.3)' : '#ef4444', color: '#fff', borderRadius: '999px', fontSize: '11px', fontWeight: '800', padding: '2px 7px' }}>
                    {t.badge}
                  </span>
                )}
                {tab === t.id && !t.badge && <ChevronRight size={15} style={{ marginLeft: 'auto' }} />}
              </button>
            ))}
            <div style={{ borderTop: '1px solid #f0f0f0', marginTop: '8px', paddingTop: '8px' }}>
              <Link to="/" style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '12px', padding: '13px 16px', borderRadius: '14px', color: '#555', textDecoration: 'none', fontWeight: '700', fontSize: '14px' }}>
                <Home size={17} /> Accueil
              </Link>
              <button onClick={handleLogout} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '12px', padding: '13px 16px', borderRadius: '14px', border: 'none', cursor: 'pointer', fontWeight: '700', fontSize: '14px', background: 'transparent', color: '#ef4444', textAlign: 'left' }}>
                <LogOut size={17} /> Déconnexion
              </button>
            </div>
          </div>
        </motion.div>

        {/* â”€â”€ MAIN CONTENT â”€â”€ */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <AnimatePresence mode="wait">

            {/* ORDERS TAB */}
            {tab === 'orders' && (
              <motion.div key="orders" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
                          <h2 style={{ margin: 0, fontSize: '22px', fontWeight: '900', color: '#111' }}>Mes commandes</h2>
                          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                            <button onClick={fetchOrders} style={{ background: '#fff', padding: '6px 12px', borderRadius: '999px', fontSize: '13px', fontWeight: '700', color: '#555', border: 'none', cursor: 'pointer', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <RefreshCw size={14} /> Actualiser
                            </button>
                            <span style={{ background: '#fff', padding: '6px 16px', borderRadius: '999px', fontSize: '13px', fontWeight: '700', color: '#888', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
                              {orders.length} commande{orders.length !== 1 ? 's' : ''}
                            </span>
                          </div>
                        </div>

                {loadingOrders ? (
                  <div style={{ background: '#fff', borderRadius: '20px', padding: '60px', textAlign: 'center' }}>
                    <div style={{ width: '36px', height: '36px', border: '3px solid #f3f3f3', borderTop: '3px solid #A51C1C', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto' }} />
                  </div>
                ) : orders.length === 0 ? (
                  <div style={{ background: '#fff', borderRadius: '24px', padding: '70px 40px', textAlign: 'center', boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
                    <ShoppingBag size={40} color="#ddd" />
                    <h3 style={{ margin: '16px 0 8px', color: '#333' }}>Aucune commande</h3>
                    <p style={{ color: '#aaa', marginBottom: '24px' }}>Vous n'avez pas encore passé de commande.</p>
                    <Link to="/menu" style={{ background: '#A51C1C', color: '#fff', padding: '14px 32px', borderRadius: '999px', textDecoration: 'none', fontWeight: '800', fontSize: '14px' }}>
                      Explorer le menu
                    </Link>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    {orders.map((order, i) => (
                      <motion.div key={order.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                        onClick={() => navigate(`/order/${order.id}`)}
                        style={{ background: '#fff', borderRadius: '20px', padding: '22px 26px', boxShadow: '0 4px 20px rgba(0,0,0,0.04)', border: '1px solid #f5f5f5', cursor: 'pointer' }}>
                        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
                          <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
                            {order.restaurant_image
                              ? <img src={order.restaurant_image} alt="" style={{ width: '48px', height: '48px', borderRadius: '12px', objectFit: 'cover', flexShrink: 0 }} />
                              : <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: '#fff0f0', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                  <Package size={22} color="#A51C1C" />
                                </div>
                            }
                            <div>
                              <p style={{ margin: 0, fontWeight: '800', fontSize: '15px', color: '#111' }}>Commande #{order.id}</p>
                              <p style={{ margin: '3px 0 0', color: '#888', fontSize: '13px', fontWeight: '600' }}>{order.restaurant_name}</p>
                              {order.items?.slice(0, 2).map(item => (
                                <span key={item.id} style={{ display: 'inline-block', background: '#f9f9f9', borderRadius: '6px', padding: '2px 8px', fontSize: '11px', margin: '3px 3px 0 0', color: '#666' }}>
                                  {item.quantity}× {item.item_name}
                                </span>
                              ))}
                              {order.items?.length > 2 && <span style={{ fontSize: '11px', color: '#bbb' }}> +{order.items.length - 2} autres</span>}
                              <div style={{ display: 'flex', gap: '10px', marginTop: '6px' }}>
                                <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#aaa', fontSize: '12px' }}>
                                  <Clock size={12} />
                                  {new Date(order.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                                </span>
                              </div>
                            </div>
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px' }}>
                            <StatusBadge status={order.status} />
                            {/* Payment badge */}
                            <motion.button
                              whileHover={{ scale: 1.05, boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                              whileTap={{ scale: 0.97 }}
                              style={{
                                display: 'inline-flex', alignItems: 'center', gap: '6px',
                                background: order.payment_status === 'paid' ? '#f0fdf4' : '#fff7ed',
                                color: order.payment_status === 'paid' ? '#15803d' : '#c2410c',
                                padding: '6px 14px', borderRadius: '999px', fontSize: '12px', fontWeight: '800', border: 'none', cursor: 'pointer', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', transition: 'all 0.2s'
                              }}
                            >
                              {order.payment_status === 'paid' ? '✔ Payé' : '⏳ À payer à la livraison'}
                              {order.payment_method === 'card' && <span style={{ opacity: 0.7 }}> · Carte</span>}
                              {order.payment_method === 'cash' && <span style={{ opacity: 0.7 }}> · Cash</span>}
                            </motion.button>
                            <span style={{ fontWeight: '900', fontSize: '17px', color: '#111' }}>{Number(order.total_price).toFixed(2)} MAD</span>
                            <div style={{ display: 'flex', gap: '8px' }}>
                              {/* Tracking link for all active orders */}
                            {['pending','accepted','preparing','ready','searching_driver','driver_assigned','driver_at_restaurant','on_the_way'].includes(order.status) && (
                              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.97 }}>
                                <Link to={`/order/${order.id}`} style={{ background: '#eff6ff', color: '#1d4ed8', padding: '7px 14px', borderRadius: '10px', textDecoration: 'none', fontWeight: '700', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '5px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
                                  <Eye size={14} /> Suivre
                                </Link>
                              </motion.div>
                            )}
                              {order.status === 'delivered' && (
                                <motion.button
                                  whileHover={{ scale: 1.05 }}
                                  whileTap={{ scale: 0.97 }}
                                  onClick={(e) => handleReorder(e, order.id)}
                                  style={{ background: '#fff0f0', color: '#A51C1C', border: 'none', padding: '7px 14px', borderRadius: '10px', fontWeight: '700', fontSize: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}
                                >
                                  <RefreshCw size={14} /> Recommander
                                </motion.button>
                              )}
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </motion.div>
            )}

            {/* FAVORITES TAB */}
            {tab === 'favorites' && (
              <motion.div key="favorites" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                <h2 style={{ margin: '0 0 20px', fontSize: '22px', fontWeight: '900', color: '#111' }}>Mes favoris</h2>

                {favorites.restaurants.length === 0 && favorites.items.length === 0 ? (
                  <div style={{ background: '#fff', borderRadius: '24px', padding: '60px', textAlign: 'center', boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
                    <Heart size={40} color="#ddd" />
                    <p style={{ color: '#aaa', marginTop: '16px' }}>Aucun favori encore</p>
                    <Link to="/menu" style={{ background: '#A51C1C', color: '#fff', padding: '12px 28px', borderRadius: '999px', textDecoration: 'none', fontWeight: '800', fontSize: '14px', display: 'inline-block', marginTop: '16px' }}>
                      Explorer les restaurants
                    </Link>
                  </div>
                ) : (
                  <div>
                    {favorites.restaurants.length > 0 && (
                      <>
                        <h3 style={{ margin: '0 0 16px', fontWeight: '800', color: '#555', fontSize: '14px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Restaurants</h3>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '14px', marginBottom: '28px' }}>
                          {favorites.restaurants.map(r => (
                            <div key={r.id} style={{ background: '#fff', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 2px 12px rgba(0,0,0,0.05)' }}>
                              {r.image_url ? (
                                <img src={r.image_url} alt={r.name} style={{ width: '100%', height: '120px', objectFit: 'cover' }} />
                              ) : (
                                <div style={{ width: '100%', height: '120px', background: 'linear-gradient(135deg,#fff0f0,#fce7e7)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>🏪</div>
                              )}
                              <div style={{ padding: '14px' }}>
                                <p style={{ margin: 0, fontWeight: '800', color: '#111', fontSize: '14px' }}>{r.name}</p>
                                <p style={{ margin: '3px 0 12px', color: '#888', fontSize: '12px' }}>{r.cuisine}</p>
                                <div style={{ display: 'flex', gap: '6px' }}>
                                  <Link to={`/menu?source=db&restaurant=${r.id}&name=${encodeURIComponent(r.name)}`} style={{ flex: 1, background: '#A51C1C', color: '#fff', padding: '8px', borderRadius: '8px', textDecoration: 'none', fontWeight: '700', fontSize: '12px', textAlign: 'center' }}>Commander</Link>
                                  <button onClick={() => handleRemoveFavoriteRestaurant(r.id)} style={{ background: '#fef2f2', color: '#b91c1c', border: 'none', padding: '8px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                                    <Trash2 size={14} />
                                  </button>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </>
                    )}

                    {favorites.items.length > 0 && (
                      <>
                        <h3 style={{ margin: '0 0 16px', fontWeight: '800', color: '#555', fontSize: '14px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Plats / Repas</h3>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '14px' }}>
                          {favorites.items.map(item => (
                            <div key={item.id} style={{ background: '#fff', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 2px 12px rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column' }}>
                              {item.image_url ? (
                                <img src={item.image_url} alt={item.name} style={{ width: '100%', height: '120px', objectFit: 'cover' }} />
                              ) : (
                                <div style={{ width: '100%', height: '120px', background: 'linear-gradient(135deg,#fff0f0,#fce7e7)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>🍔</div>
                              )}
                              <div style={{ padding: '14px', display: 'flex', flexDirection: 'column', flex: 1 }}>
                                <p style={{ margin: 0, fontWeight: '800', color: '#111', fontSize: '14px' }}>{item.name}</p>
                                <p style={{ margin: '3px 0 2px', color: '#888', fontSize: '11px' }}>Chez {item.restaurant_name}</p>
                                <p style={{ margin: '0 0 12px', fontWeight: '900', color: '#A51C1C', fontSize: '14px' }}>{Number(item.price).toFixed(2)} MAD</p>
                                <div style={{ display: 'flex', gap: '6px', marginTop: 'auto' }}>
                                  <Link to={`/menu?source=db&restaurant=${item.restaurant_id}&name=${encodeURIComponent(item.restaurant_name)}`} style={{ flex: 1, background: '#111', color: '#fff', padding: '8px', borderRadius: '8px', textDecoration: 'none', fontWeight: '700', fontSize: '12px', textAlign: 'center' }}>Aller au Resto</Link>
                                  <button onClick={() => handleRemoveFavoriteItem(item.id)} style={{ background: '#fef2f2', color: '#b91c1c', border: 'none', padding: '8px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                                    <Trash2 size={14} />
                                  </button>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                )}
              </motion.div>
            )}

            {/* ADDRESSES TAB */}
            {tab === 'addresses' && (
              <motion.div key="addresses" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                  <h2 style={{ margin: 0, fontSize: '22px', fontWeight: '900', color: '#111' }}>Mes adresses</h2>
                  <button onClick={() => setAddingAddr(!addingAddr)} style={{ background: '#A51C1C', color: '#fff', border: 'none', padding: '10px 18px', borderRadius: '999px', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px' }}>
                    <Plus size={15} /> Ajouter
                  </button>
                </div>

                {addingAddr && (
                  <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
                    style={{ background: '#fff', borderRadius: '20px', padding: '24px', boxShadow: '0 4px 20px rgba(0,0,0,0.05)', marginBottom: '20px' }}>
                    <h3 style={{ margin: '0 0 16px', fontWeight: '800', color: '#111', fontSize: '16px' }}>Nouvelle adresse</h3>
                    <form onSubmit={handleAddAddress} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                        <div>
                          <label style={{ fontSize: '12px', fontWeight: '700', color: '#888', marginBottom: '6px', display: 'block' }}>Label</label>
                          <select style={inputStyle} value={newAddress.label} onChange={e => setNewAddress({ ...newAddress, label: e.target.value })}>
                            <option>Maison</option><option>Travail</option><option>Autre</option>
                          </select>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'flex-end' }}>
                          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', fontWeight: '600', cursor: 'pointer', padding: '13px 0' }}>
                            <input type="checkbox" checked={newAddress.is_default} onChange={e => setNewAddress({ ...newAddress, is_default: e.target.checked })} />
                            Adresse par défaut
                          </label>
                        </div>
                      </div>
                      <input style={inputStyle} placeholder="Adresse complète *" required value={newAddress.address}
                        onChange={e => setNewAddress({ ...newAddress, address: e.target.value })}
                        onFocus={e => e.target.style.borderColor = '#A51C1C'}
                        onBlur={e => e.target.style.borderColor = '#e5e7eb'} />
                      <div style={{ display: 'flex', gap: '10px' }}>
                        <button type="submit" style={{ background: '#A51C1C', color: '#fff', border: 'none', padding: '12px 24px', borderRadius: '12px', fontWeight: '800', cursor: 'pointer' }}>
                          Enregistrer
                        </button>
                        <button type="button" onClick={() => setAddingAddr(false)} style={{ background: '#f5f5f5', border: 'none', padding: '12px 20px', borderRadius: '12px', fontWeight: '700', cursor: 'pointer' }}>
                          Annuler
                        </button>
                      </div>
                    </form>
                  </motion.div>
                )}

                {addresses.length === 0 ? (
                  <div style={{ background: '#fff', borderRadius: '20px', padding: '60px', textAlign: 'center', boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
                    <MapPin size={40} color="#ddd" />
                    <p style={{ color: '#aaa', marginTop: '12px' }}>Aucune adresse enregistrée</p>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {addresses.map(addr => (
                      <div key={addr.id} style={{ background: '#fff', borderRadius: '16px', padding: '20px 24px', boxShadow: '0 2px 12px rgba(0,0,0,0.04)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: addr.is_default ? '2px solid #A51C1C' : '1px solid #f5f5f5' }}>
                        <div style={{ display: 'flex', gap: '14px', alignItems: 'center' }}>
                          <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: '#fff0f0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <MapPin size={18} color="#A51C1C" />
                          </div>
                          <div>
                            <p style={{ margin: 0, fontWeight: '800', color: '#111', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                              {addr.label}
                              {addr.is_default && <span style={{ background: '#A51C1C', color: '#fff', padding: '2px 8px', borderRadius: '999px', fontSize: '10px', fontWeight: '700' }}>Défaut</span>}
                            </p>
                            <p style={{ margin: '3px 0 0', color: '#888', fontSize: '13px' }}>{addr.address}</p>
                          </div>
                        </div>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          {!addr.is_default && (
                            <button onClick={() => handleSetDefaultAddress(addr.id)} style={{ background: '#f0fdf4', color: '#15803d', border: 'none', padding: '8px 14px', borderRadius: '8px', fontWeight: '700', cursor: 'pointer', fontSize: '12px' }}>
                              Définir par défaut
                            </button>
                          )}
                          <button onClick={() => handleDeleteAddress(addr.id)} style={{ background: '#fef2f2', color: '#b91c1c', border: 'none', padding: '8px', borderRadius: '8px', cursor: 'pointer', display: 'flex' }}>
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>
            )}

            {/* COMPLAINTS TAB */}
            {tab === 'complaints' && (
              <motion.div key="complaints" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                  <h2 style={{ margin: 0, fontSize: '22px', fontWeight: '900', color: '#111' }}>Réclamations</h2>
                  <button onClick={() => setShowComplaintForm(!showComplaintForm)} style={{ background: '#A51C1C', color: '#fff', border: 'none', padding: '10px 18px', borderRadius: '999px', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px' }}>
                    <Send size={15} /> Nouvelle réclamation
                  </button>
                </div>

                {showComplaintForm && (
                  <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
                    style={{ background: '#fff', borderRadius: '20px', padding: '24px', boxShadow: '0 4px 20px rgba(0,0,0,0.05)', marginBottom: '20px' }}>
                    <h3 style={{ margin: '0 0 16px', fontWeight: '800', color: '#111', fontSize: '16px' }}>{editingComplaint ? 'Modifier la réclamation' : 'Envoyer une réclamation'}</h3>
                    <form onSubmit={handleSubmitComplaint} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      <div>
                        <label style={{ fontSize: '12px', fontWeight: '700', color: '#888', marginBottom: '6px', display: 'block' }}>Commande concernée (optionnel)</label>
                        <select style={inputStyle} value={complaintForm.order_id} onChange={e => {
                          const orderId = e.target.value;
                          const order = orders.find(o => o.id === parseInt(orderId));
                          setSelectedOrder(order || null);
                          setComplaintForm(prev => ({
                            ...prev,
                            order_id: orderId,
                            restaurant_id: order ? order.restaurant_id : '',
                            driver_id: order ? order.driver_id : ''
                          }));
                        }}>
                          <option value="">Sélectionner une commande</option>
                          {orders.filter(o => o.status === 'delivered').map(o => (
                            <option key={o.id} value={o.id}>Commande #{o.id} - {o.restaurant_name}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label style={{ fontSize: '12px', fontWeight: '700', color: '#888', marginBottom: '6px', display: 'block' }}>Type de réclamation *</label>
                        <div style={{ display: 'flex', gap: '10px' }}>
                          {[
                            { value: 'restaurant', label: 'Restaurant', icon: <Store size={16} /> },
                            { value: 'driver', label: 'Livreur', icon: <Bike size={16} /> },
                            { value: 'site', label: 'Site Web', icon: <Globe size={16} /> }
                          ].map(opt => (
                            <button
                              key={opt.value}
                              type="button"
                              onClick={() => setComplaintForm({ ...complaintForm, target: opt.value })}
                              style={{
                                flex: 1,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '8px',
                                padding: '12px',
                                borderRadius: '12px',
                                border: complaintForm.target === opt.value ? '2px solid #A51C1C' : '1.5px solid #e5e7eb',
                                background: complaintForm.target === opt.value ? '#fff0f0' : '#fafafa',
                                color: complaintForm.target === opt.value ? '#A51C1C' : '#555',
                                fontWeight: '700',
                                fontSize: '14px',
                                cursor: 'pointer',
                                transition: 'all 0.2s'
                              }}
                            >
                              {opt.icon} {opt.label}
                            </button>
                          ))}
                        </div>
                        {complaintForm.target !== 'site' && !selectedOrder && (
                          <p style={{ margin: '6px 0 0', fontSize: '11px', color: '#f59e0b', fontWeight: '600' }}>
                            💡 Conseil: Sélectionnez une commande concernée pour lier précisément cette réclamation.
                          </p>
                        )}
                      </div>

                      {selectedOrder && (
                        <div style={{ background: '#f9f9f9', borderRadius: '12px', padding: '16px', border: '1px solid #e5e7eb' }}>
                          <p style={{ margin: '0 0 10px', fontWeight: '800', color: '#111', fontSize: '14px' }}>Détails de la commande</p>
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '12px' }}>
                            <div><span style={{ color: '#888', fontWeight: '600' }}>Restaurant:</span> {selectedOrder.restaurant_name}</div>
                            <div><span style={{ color: '#888', fontWeight: '600' }}>Total:</span> {Number(selectedOrder.total_price).toFixed(2)} MAD</div>
                            <div><span style={{ color: '#888', fontWeight: '600' }}>Date:</span> {new Date(selectedOrder.created_at).toLocaleDateString('fr-FR')}</div>
                            {selectedOrder.delivery_name && <div><span style={{ color: '#888', fontWeight: '600' }}>Livreur:</span> {selectedOrder.delivery_name}</div>}
                          </div>
                          {selectedOrder.items && selectedOrder.items.length > 0 && (
                            <div style={{ marginTop: '10px' }}>
                              <p style={{ margin: '0 0 6px', fontSize: '11px', fontWeight: '700', color: '#888' }}>Articles:</p>
                              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                                {selectedOrder.items.slice(0, 5).map((item, idx) => (
                                  <span key={idx} style={{ background: '#fff', padding: '3px 8px', borderRadius: '6px', fontSize: '11px', color: '#666', border: '1px solid #e5e7eb' }}>
                                    {item.quantity}× {item.item_name}
                                  </span>
                                ))}
                                {selectedOrder.items.length > 5 && <span style={{ fontSize: '11px', color: '#888' }}>+{selectedOrder.items.length - 5} autres</span>}
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      <div>
                        <label style={{ fontSize: '12px', fontWeight: '700', color: '#888', marginBottom: '6px', display: 'block' }}>Sujet *</label>
                        <input style={inputStyle} placeholder="Ex: Problème avec la livraison" required value={complaintForm.subject}
                          onChange={e => setComplaintForm({ ...complaintForm, subject: e.target.value })}
                          onFocus={e => e.target.style.borderColor = '#A51C1C'}
                          onBlur={e => e.target.style.borderColor = '#e5e7eb'} />
                      </div>
                      <div>
                        <label style={{ fontSize: '12px', fontWeight: '700', color: '#888', marginBottom: '6px', display: 'block' }}>Description *</label>
                        <textarea style={{ ...inputStyle, minHeight: '100px', resize: 'vertical' }} placeholder="Décrivez votre problème en détail..." required value={complaintForm.description}
                          onChange={e => setComplaintForm({ ...complaintForm, description: e.target.value })}
                          onFocus={e => e.target.style.borderColor = '#A51C1C'}
                          onBlur={e => e.target.style.borderColor = '#e5e7eb'} />
                      </div>
                      <div style={{ display: 'flex', gap: '10px' }}>
                        <button type="submit" disabled={submittingComplaint} style={{ background: '#A51C1C', color: '#fff', border: 'none', padding: '12px 24px', borderRadius: '12px', fontWeight: '800', cursor: submittingComplaint ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          {submittingComplaint ? (editingComplaint ? 'Modification...' : 'Envoi...') : <><Send size={14} /> {editingComplaint ? 'Modifier' : 'Envoyer'}</>}
                        </button>
                        <button type="button" onClick={() => { setShowComplaintForm(false); setEditingComplaint(null); setComplaintForm({ subject: '', description: '', order_id: '', target: 'site', restaurant_id: '', driver_id: '' }); setSelectedOrder(null); }} style={{ background: '#f5f5f5', border: 'none', padding: '12px 20px', borderRadius: '12px', fontWeight: '700', cursor: 'pointer' }}>
                          Annuler
                        </button>
                      </div>
                    </form>
                  </motion.div>
                )}

                {complaints.length === 0 ? (
                  <div style={{ background: '#fff', borderRadius: '20px', padding: '60px', textAlign: 'center', boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
                    <AlertCircle size={40} color="#ddd" />
                    <p style={{ color: '#aaa', marginTop: '12px' }}>Aucune réclamation</p>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {complaints.map(c => (
                      <div key={c.id} style={{ background: '#fff', borderRadius: '16px', padding: '20px 24px', boxShadow: '0 2px 12px rgba(0,0,0,0.04)', border: '1px solid #f5f5f5' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px', flexWrap: 'wrap' }}>
                              <span style={{
                                background: c.target === 'restaurant' ? '#fff0f0' : c.target === 'driver' ? '#eff6ff' : '#f3f4f6',
                                color: c.target === 'restaurant' ? '#A51C1C' : c.target === 'driver' ? '#1d4ed8' : '#4b5563',
                                padding: '3px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: '800', display: 'inline-flex', alignItems: 'center', gap: '4px'
                              }}>
                                {c.target === 'restaurant' ? <Store size={12} /> : c.target === 'driver' ? <Bike size={12} /> : <Globe size={12} />}
                                {c.target === 'restaurant' ? 'Restaurant' : c.target === 'driver' ? 'Livreur' : 'Site Web'}
                              </span>
                              {c.restaurant_name && <span style={{ fontSize: '12px', color: '#666', fontWeight: '700' }}>({c.restaurant_name})</span>}
                            </div>
                            <p style={{ margin: 0, fontWeight: '800', color: '#111', fontSize: '15px' }}>{c.subject}</p>
                            {c.order_id && <p style={{ margin: '3px 0 0', color: '#888', fontSize: '12px' }}>Commande #{c.order_id}</p>}
                          </div>
                          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                            <span style={{
                              padding: '4px 12px', borderRadius: '999px', fontSize: '11px', fontWeight: '700',
                              background: c.status === 'pending' ? '#fff7ed' : c.status === 'in_review' ? '#fefce8' : c.status === 'resolved' ? '#f0fdf4' : '#fef2f2',
                              color: c.status === 'pending' ? '#c2410c' : c.status === 'in_review' ? '#a16207' : c.status === 'resolved' ? '#15803d' : '#b91c1c'
                            }}>
                              {c.status === 'pending' ? 'En attente' : c.status === 'in_review' ? 'En cours' : c.status === 'resolved' ? 'Résolu' : 'Rejeté'}
                            </span>
                            {c.status === 'pending' && (
                              <div style={{ display: 'flex', gap: '6px' }}>
                                <button onClick={() => handleEditComplaint(c)} style={{ background: '#f0fdf4', color: '#15803d', border: 'none', padding: '6px 10px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', fontWeight: '700' }}>
                                  <Edit3 size={12} /> Modifier
                                </button>
                                <button onClick={() => handleDeleteComplaint(c.id)} style={{ background: '#fef2f2', color: '#b91c1c', border: 'none', padding: '6px 10px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', fontWeight: '700' }}>
                                  <Trash2 size={12} /> Supprimer
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                        <p style={{ margin: '0 0 12px', color: '#666', fontSize: '14px', lineHeight: '1.5' }}>{c.description}</p>
                        <p style={{ margin: 0, color: '#bbb', fontSize: '11px' }}>
                          {new Date(c.created_at).toLocaleString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>
            )}

            {/* NOTIFICATIONS TAB */}
            {tab === 'notifications' && (
              <motion.div key="notifications" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                  <h2 style={{ margin: 0, fontSize: '22px', fontWeight: '900', color: '#111' }}>Notifications</h2>
                  {unreadNotifs > 0 && (
                    <button onClick={handleMarkAllRead} style={{ background: '#f5f5f5', border: 'none', padding: '8px 16px', borderRadius: '999px', fontWeight: '700', cursor: 'pointer', fontSize: '13px', color: '#555' }}>
                      Tout marquer comme lu
                    </button>
                  )}
                </div>

                {notifications.length === 0 ? (
                  <div style={{ background: '#fff', borderRadius: '20px', padding: '60px', textAlign: 'center', boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
                    <Bell size={40} color="#ddd" />
                    <p style={{ color: '#aaa', marginTop: '12px' }}>Aucune notification</p>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {notifications.map(n => (
                      <div key={n.id} onClick={() => !n.is_read && handleMarkRead(n.id)}
                        style={{ background: n.is_read ? '#fff' : '#fff7ed', borderRadius: '16px', padding: '16px 20px', boxShadow: '0 2px 8px rgba(0,0,0,0.04)', border: `1px solid ${n.is_read ? '#f5f5f5' : '#fed7aa'}`, cursor: n.is_read ? 'default' : 'pointer', display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
                        <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: n.is_read ? '#f5f5f5' : '#fff0f0', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          {n.type === 'order' ? <Bike size={17} color={n.is_read ? '#aaa' : '#A51C1C'}/> : n.type === 'promo' ? <Tag size={17} color={n.is_read ? '#aaa' : '#f97316'}/> : <Bell size={17} color={n.is_read ? '#aaa' : '#A51C1C'}/>}
                        </div>
                        <div style={{ flex: 1 }}>
                          <p style={{ margin: 0, fontWeight: '800', fontSize: '14px', color: '#111' }}>{n.title}</p>
                          <p style={{ margin: '3px 0 0', color: '#666', fontSize: '13px' }}>{n.message}</p>
                          <p style={{ margin: '4px 0 0', color: '#bbb', fontSize: '11px' }}>
                            {new Date(n.created_at).toLocaleString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                        {!n.is_read && <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#f97316', flexShrink: 0, marginTop: '4px' }} />}
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>
            )}

            {/* PROFILE TAB */}
            {tab === 'profile' && (
              <motion.div key="profile" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                <h2 style={{ margin: '0 0 20px', fontSize: '22px', fontWeight: '900', color: '#111' }}>Mon profil</h2>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '20px' }}>
                  {[
                    { icon: <Mail size={18} color="#A51C1C" />, label: 'Email', value: user.email },
                    { icon: <Phone size={18} color="#A51C1C" />, label: 'Téléphone', value: user.phone || 'â€”' },
                    { icon: <MapPin size={18} color="#A51C1C" />, label: 'Adresse', value: user.address || 'â€”' },
                    { icon: <User size={18} color="#A51C1C" />, label: 'Rôle', value: user.role },
                  ].map((item, i) => (
                    <div key={i} style={{ background: '#fff', borderRadius: '16px', padding: '18px 20px', boxShadow: '0 4px 16px rgba(0,0,0,0.04)', display: 'flex', gap: '14px', alignItems: 'center' }}>
                      <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: '#fff0f0', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{item.icon}</div>
                      <div style={{ minWidth: 0 }}>
                        <p style={{ margin: 0, fontSize: '11px', fontWeight: '700', color: '#aaa', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{item.label}</p>
                        <p style={{ margin: '2px 0 0', fontSize: '14px', fontWeight: '700', color: '#111', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.value}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <div style={{ background: '#fff', borderRadius: '24px', padding: '30px', boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '24px' }}>
                    <Edit3 size={18} color="#A51C1C" />
                    <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '800', color: '#111' }}>Modifier le profil</h3>
                  </div>

                  <form onSubmit={handleSaveProfile} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                      <div>
                        <label style={{ fontSize: '12px', fontWeight: '700', color: '#888', marginBottom: '7px', display: 'block', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Nom complet</label>
                        <input style={inputStyle} value={profile.name} onChange={e => setProfile({ ...profile, name: e.target.value })}
                          onFocus={e => e.target.style.borderColor = '#A51C1C'} onBlur={e => e.target.style.borderColor = '#e5e7eb'} />
                      </div>
                      <div>
                        <label style={{ fontSize: '12px', fontWeight: '700', color: '#888', marginBottom: '7px', display: 'block', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Téléphone</label>
                        <input style={inputStyle} value={profile.phone} onChange={e => setProfile({ ...profile, phone: e.target.value })}
                          onFocus={e => e.target.style.borderColor = '#A51C1C'} onBlur={e => e.target.style.borderColor = '#e5e7eb'} />
                      </div>
                    </div>
                    <div>
                      <label style={{ fontSize: '12px', fontWeight: '700', color: '#888', marginBottom: '7px', display: 'block', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Adresse principale</label>
                      <input style={inputStyle} value={profile.address} onChange={e => setProfile({ ...profile, address: e.target.value })}
                        placeholder="Ex: 12 Rue Mohammed V, Casablanca"
                        onFocus={e => e.target.style.borderColor = '#A51C1C'} onBlur={e => e.target.style.borderColor = '#e5e7eb'} />
                    </div>
                    <div>
                      <label style={{ fontSize: '12px', fontWeight: '700', color: '#888', marginBottom: '7px', display: 'block', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Email</label>
                      <input style={{ ...inputStyle, background: '#f5f5f5', color: '#aaa', cursor: 'not-allowed' }} value={user.email} disabled />
                    </div>

                    {saveMsg && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 16px', borderRadius: '12px', background: saveMsg === 'success' ? '#f0fdf4' : '#fef2f2', color: saveMsg === 'success' ? '#15803d' : '#b91c1c', fontWeight: '700', fontSize: '14px' }}>
                        {saveMsg === 'success' ? <Check size={16} /> : <X size={16} />}
                        {saveMsg === 'success' ? 'Profil mis à jour avec succès !' : 'Erreur lors de la mise à jour.'}
                      </div>
                    )}

                    <button type="submit" disabled={saving}
                      style={{ padding: '16px', borderRadius: '14px', border: 'none', background: saving ? '#c97a7a' : '#A51C1C', color: '#fff', fontWeight: '800', fontSize: '15px', cursor: saving ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                      {saving ? 'Enregistrement...' : <><Check size={16} /> Enregistrer</>}
                    </button>
                  </form>
                </div>
              </motion.div>
            )}

          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
