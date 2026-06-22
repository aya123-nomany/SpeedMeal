import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
  Bike, Package, CheckCircle, MapPin, Clock, LogOut,
  Home, TrendingUp, Phone, Navigation, RefreshCw, Store, Banknote, Bell, Star
} from 'lucide-react';
import logoUrl from '../assets/logo.png';

// Fix leaflet marker icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const bikeIcon = L.divIcon({
  className: '',
  html: `<div style="background:#A51C1C;width:40px;height:40px;border-radius:50%;display:flex;align-items:center;justify-content:center;box-shadow:0 4px 14px rgba(165,28,28,0.4);border:3px solid #fff;font-size:24px">🏍️</div>`,
  iconSize: [40, 40],
  iconAnchor: [20, 20],
});

const restaurantIcon = L.divIcon({
  className: '',
  html: `<div style="background:#f59e0b;width:36px;height:36px;border-radius:50%;display:flex;align-items:center;justify-content:center;box-shadow:0 4px 14px rgba(245,158,11,0.4);border:3px solid #fff;font-size:20px">🏪</div>`,
  iconSize: [36, 36],
  iconAnchor: [18, 18],
});

const customerIcon = L.divIcon({
  className: '',
  html: `<div style="background:#22c55e;width:36px;height:36px;border-radius:50%;display:flex;align-items:center;justify-content:center;box-shadow:0 4px 14px rgba(34,197,94,0.4);border:3px solid #fff;font-size:20px">🏠</div>`,
  iconSize: [36, 36],
  iconAnchor: [18, 18],
});

// Component to fit bounds to show all markers
const MapBounds = ({ positions }) => {
  const map = useMap();
  useEffect(() => {
    if (positions && positions.length > 0) {
      const validPositions = positions.filter(p => p && p[0] && p[1]);
      if (validPositions.length > 0) {
        const bounds = L.latLngBounds(validPositions);
        map.fitBounds(bounds, { padding: [50, 50], maxZoom: 16 });
      }
    }
  }, [positions, map]);
  return null;
};

import API_BASE_URL from '../config/api';

const API = API_BASE_URL;

const statusColors = {
  pending:    { bg: '#fff7ed', color: '#c2410c', label: 'En attente' },
  accepted:   { bg: '#fefce8', color: '#a16207', label: 'Acceptée' },
  preparing:  { bg: '#fefce8', color: '#a16207', label: 'En préparation' },
  ready:      { bg: '#fefce8', color: '#a16207', label: 'Prête' },
  searching_driver: { bg: '#eff6ff', color: '#1d4ed8', label: 'Recherche' },
  driver_assigned: { bg: '#eff6ff', color: '#1d4ed8', label: 'En route resto' },
  driver_at_restaurant: { bg: '#eff6ff', color: '#1d4ed8', label: 'Au resto' },
  on_the_way: { bg: '#eff6ff', color: '#1d4ed8', label: 'En livraison' },
  delivered:  { bg: '#f0fdf4', color: '#15803d', label: 'Livré' },
  cancelled:  { bg: '#fef2f2', color: '#b91c1c', label: 'Annulé' },
};

export default function DeliveryDashboard() {
  const [tab, setTab] = useState('available');
  const [available, setAvailable] = useState([]);
  const [myDeliveries, setMyDeliveries] = useState([]);
  const [stats, setStats] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(false);
  const [myLocation, setMyLocation] = useState(null);
  const [activeOrderId, setActiveOrderId] = useState(null);
  const [tracking, setTracking] = useState(false);
  const [isAvailable, setIsAvailable] = useState(true);
  const [showLocationPrompt, setShowLocationPrompt] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [notifOpen, setNotifOpen] = useState(false);
  const navigate = useNavigate();

  const token = localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const headers = { Authorization: `Bearer ${token}` };

  useEffect(() => {
    if (!token || !['delivery', 'admin'].includes(user.role)) {
      navigate('/login');
      return;
    }
    fetchAvailable();
    fetchMyDeliveries();
    fetchStats();
    fetchAvailability();
    fetchNotifications();
    fetchReviews();
  }, []);

  // Live location tracking for active order
  useEffect(() => {
    let watcher;
    if (tracking && activeOrderId) {
      watcher = navigator.geolocation?.watchPosition(
        async (pos) => {
          const { latitude, longitude } = pos.coords;
          setMyLocation({ lat: latitude, lng: longitude });
          try {
            await axios.post(`${API}/delivery/update-location/${activeOrderId}`,
              { latitude, longitude }, { headers }
            );
          } catch (_) {}
        },
        null,
        { enableHighAccuracy: true, maximumAge: 5000, timeout: 10000 }
      );
    }
    return () => { if (watcher) navigator.geolocation?.clearWatch(watcher); };
  }, [tracking, activeOrderId]);

  const fetchAvailable = async () => {
    setLoading(true);
    try {
      const { data } = await axios.get(`${API}/delivery/available-orders`, { headers });
      setAvailable(data);
    } catch { setAvailable([]); }
    setLoading(false);
  };

  const fetchMyDeliveries = async () => {
    try {
      const { data } = await axios.get(`${API}/delivery/my-deliveries`, { headers });
      setMyDeliveries(data);
      const active = data.find(d => ['driver_assigned', 'driver_at_restaurant', 'on_the_way'].includes(d.status));
      if (active) setActiveOrderId(active.id);
    } catch { setMyDeliveries([]); }
  };

  // Derive active order details from myDeliveries state
  const activeOrderDetails = myDeliveries.find(d => d.id === activeOrderId) || null;

  const fetchStats = async () => {
    try {
      const { data } = await axios.get(`${API}/delivery/stats`, { headers });
      setStats(data);
    } catch { setStats(null); }
  };

  const fetchAvailability = async () => {
    try {
      const { data } = await axios.get(`${API}/delivery/availability`, { headers });
      setIsAvailable(data.is_available);
    } catch {}
  };

  const fetchNotifications = async () => {
    try {
      const { data } = await axios.get(`${API}/notifications`, { headers });
      setNotifications(data);
    } catch {}
  };

  const fetchReviews = async () => {
    try {
      const { data } = await axios.get(`${API}/reviews/driver`, { headers });
      setReviews(data);
    } catch { setReviews([]); }
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

  const handleToggleAvailability = async () => {
    if (activeOrderId) {
      alert("Vous ne pouvez pas changer votre disponibilité pendant une livraison active.");
      return;
    }
    try {
      const { data } = await axios.put(`${API}/delivery/toggle-availability`, {}, { headers });
      setIsAvailable(data.is_available);
    } catch (err) {
      alert(err.response?.data?.message || 'Erreur lors de la modification de disponibilité');
    }
  };

  const requestLocationPermission = async () => {
    if (!navigator.geolocation) {
      alert('Votre navigateur ne supporte pas la géolocalisation');
      return false;
    }
    try {
      await new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0
        });
      });
      return true;
    } catch (error) {
      alert('Veuillez activer la géolocalisation dans votre navigateur pour continuer');
      return false;
    }
  };

  const handleAccept = async (orderId) => {
    const hasLocationPermission = await requestLocationPermission();
    if (!hasLocationPermission) return;
    
    try {
      await axios.post(`${API}/delivery/accept-order/${orderId}`, {}, { headers });
      setActiveOrderId(orderId);
      setTracking(true);
      fetchAvailable();
      fetchMyDeliveries();
      setTab('my');
    } catch (err) {
      alert(err.response?.data?.message || 'Error accepting order');
    }
  };

  const handleAtRestaurant = async (orderId) => {
    try {
      await axios.post(`${API}/delivery/at-restaurant/${orderId}`, {}, { headers });
      fetchMyDeliveries();
    } catch (err) {
      alert(err.response?.data?.message || 'Error updating status');
    }
  };

  const handlePickedUp = async (orderId) => {
    try {
      await axios.post(`${API}/delivery/picked-up/${orderId}`, {}, { headers });
      fetchMyDeliveries();
    } catch (err) {
      alert(err.response?.data?.message || 'Error updating status');
    }
  };

  const handleComplete = async (orderId) => {
    try {
      await axios.put(`${API}/delivery/complete/${orderId}`, {}, { headers });
      setTracking(false);
      setActiveOrderId(null);
      fetchMyDeliveries();
      fetchStats();
      setTab('available');
    } catch (err) {
      alert(err.response?.data?.message || 'Error completing delivery');
    }
  };

  const handleConfirmCashPayment = async (orderId) => {
    try {
      await axios.put(`${API}/delivery/confirm-payment/${orderId}`, {}, { headers });
      fetchMyDeliveries();
    } catch (err) {
      alert(err.response?.data?.message || 'Erreur confirmation paiement');
    }
  };

  const TABS = [
    { id: 'available', label: 'Disponibles', icon: <Package size={16} /> },
    { id: 'my',        label: 'Mes livraisons', icon: <Bike size={16} /> },
    { id: 'stats',     label: 'Gains',          icon: <TrendingUp size={16} /> },
    { id: 'reviews',   label: 'Avis clients',   icon: <Star size={16} /> },
  ];

  return (
    <div style={{ minHeight: '100vh', background: '#f4f5f7', display: 'flex' }}>
      {/* SIDEBAR */}
      <div style={{ width: '240px', background: '#111', minHeight: '100vh', padding: '24px 16px', display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <img src={logoUrl} alt="SpeedMeal" style={{ height: '60px', objectFit: 'contain' }} />
          <p style={{ margin: '6px 0 0', color: '#888', fontSize: '11px', fontWeight: '600', letterSpacing: '1px', textTransform: 'uppercase' }}>Livreur</p>
        </div>

        <div style={{ background: '#1a1a1a', borderRadius: '12px', padding: '14px', marginBottom: '20px' }}>
          <p style={{ margin: 0, color: '#fff', fontWeight: '700', fontSize: '13px' }}>{user.name}</p>
          <div 
            onClick={handleToggleAvailability}
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '6px', 
              marginTop: '8px', 
              cursor: activeOrderId ? 'not-allowed' : 'pointer',
              background: '#222',
              padding: '6px 10px',
              borderRadius: '8px',
              transition: 'background 0.2s',
            }}
            title={activeOrderId ? 'En livraison active' : 'Cliquez pour basculer la disponibilité'}
            onMouseEnter={e => { if (!activeOrderId) e.currentTarget.style.background = '#2d2d2d'; }}
            onMouseLeave={e => { if (!activeOrderId) e.currentTarget.style.background = '#222'; }}
          >
            <div style={{ 
              width: '8px', 
              height: '8px', 
              borderRadius: '50%', 
              background: activeOrderId ? '#3b82f6' : (isAvailable ? '#22c55e' : '#ef4444'),
              boxShadow: activeOrderId ? '0 0 8px #3b82f6' : (isAvailable ? '0 0 8px #22c55e' : '0 0 8px #ef4444'),
            }} />
            <span style={{ color: '#fff', fontSize: '11px', fontWeight: '700' }}>
              {activeOrderId ? 'En livraison' : (isAvailable ? 'Disponible' : 'Indisponible')}
            </span>
          </div>
        </div>

        <nav style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: 1 }}>
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)} style={{
              display: 'flex', alignItems: 'center', gap: '10px',
              padding: '12px 14px', borderRadius: '10px', border: 'none', cursor: 'pointer',
              fontWeight: '700', fontSize: '13px', textAlign: 'left',
              background: tab === t.id ? '#A51C1C' : 'transparent',
              color: tab === t.id ? '#fff' : '#888',
            }}>
              {t.icon} {t.label}
              {t.id === 'available' && available.length > 0 && (
                <span style={{ marginLeft: 'auto', background: '#22c55e', color: '#fff', borderRadius: '999px', fontSize: '10px', fontWeight: '800', padding: '2px 7px' }}>
                  {available.length}
                </span>
              )}
            </button>
          ))}
        </nav>

        <div style={{ borderTop: '1px solid #222', paddingTop: '16px' }}>
          <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 14px', color: '#888', textDecoration: 'none', fontWeight: '700', fontSize: '13px' }}>
            <Home size={16} /> Accueil
          </Link>
          <button onClick={() => { localStorage.removeItem('token'); localStorage.removeItem('user'); navigate('/'); }}
            style={{ display: 'flex', alignItems: 'center', gap: '10px', background: 'transparent', border: 'none', color: '#ef4444', padding: '12px 14px', cursor: 'pointer', fontWeight: '700', fontSize: '13px', width: '100%', textAlign: 'left' }}>
            <LogOut size={16} /> Déconnexion
          </button>
        </div>
      </div>

      {/* MAIN */}
      <div style={{ flex: 1, padding: '32px', overflowY: 'auto' }}>

        {/* Header with Notifications */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', marginBottom: 24, position: 'relative' }}>
          <button 
            onClick={() => setNotifOpen(!notifOpen)} 
            style={{
              width: 44, 
              height: 44, 
              borderRadius: 12, 
              border: '1px solid #e5e7eb',
              background: '#fff',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              position: 'relative',
              transition: 'all 0.15s'
            }}
          >
            <Bell size={20} color="#111" />
            {notifications.filter(n => !n.is_read).length > 0 && (
              <span style={{
                position: 'absolute',
                top: 8,
                right: 8,
                width: 10,
                height: 10,
                borderRadius: '50%',
                background: '#A51C1C'
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
                  background: '#fff',
                  borderRadius: 16,
                  boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
                  zIndex: 1000,
                  border: '1px solid #e5e7eb'
                }}
              >
                <div style={{ padding: '16px 20px', borderBottom: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h3 style={{ margin: 0, fontWeight: 800, fontSize: 16, color: '#111' }}>Notifications</h3>
                  {notifications.filter(n => !n.is_read).length > 0 && (
                    <button 
                      onClick={markAllAsRead}
                      style={{ 
                        fontSize: 12, 
                        fontWeight: 700, 
                        color: '#A51C1C', 
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
                    <div style={{ padding: 32, textAlign: 'center', color: '#aaa' }}>
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
                          background: n.is_read ? 'transparent' : '#A51C1C08',
                          cursor: 'pointer',
                          marginBottom: 4,
                          transition: 'background 0.15s'
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <div style={{ flex: 1 }}>
                            <p style={{ margin: 0, fontWeight: 700, fontSize: 13, color: '#111' }}>{n.title}</p>
                            <p style={{ margin: '4px 0 0', fontSize: 12, color: '#555' }}>{n.message}</p>
                          </div>
                          <p style={{ margin: 0, fontSize: 11, color: '#aaa', whiteSpace: 'nowrap', marginLeft: 8 }}>
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

        <AnimatePresence mode="wait">

          {/* AVAILABLE ORDERS */}
          {tab === 'available' && (
            <motion.div key="available" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
                <h2 style={{ margin: 0, fontWeight: '900', fontSize: '22px', color: '#111' }}>Commandes disponibles</h2>
                <button onClick={fetchAvailable} style={{ background: '#fff', border: '1px solid #e5e7eb', padding: '10px', borderRadius: '10px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', color: '#555', fontWeight: '700', fontSize: '13px' }}>
                  <RefreshCw size={15} /> Actualiser
                </button>
              </div>

              {!isAvailable && (
                <div style={{ background: '#fef2f2', border: '1.5px solid #fee2e2', color: '#b91c1c', padding: '16px 20px', borderRadius: '14px', marginBottom: '24px', fontWeight: '700', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '18px' }}>⚠️</span> Vous êtes actuellement hors ligne (Indisponible). Cliquez sur votre statut dans la barre latérale pour repasser en ligne.
                </div>
              )}

              {loading ? (
                <p style={{ color: '#aaa', textAlign: 'center', padding: '40px' }}>Chargement...</p>
              ) : available.length === 0 ? (
                <div style={{ background: '#fff', borderRadius: '20px', padding: '60px', textAlign: 'center', boxShadow: '0 2px 12px rgba(0,0,0,0.05)' }}>
                  <Package size={50} color="#ddd" style={{ marginBottom: '16px' }} />
                  <p style={{ color: '#aaa', fontSize: '16px' }}>Aucune commande disponible pour l'instant</p>
                  <p style={{ color: '#bbb', fontSize: '13px' }}>Actualisez régulièrement pour voir de nouvelles commandes</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  {available.map(order => (
                    <motion.div key={order.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                      style={{ background: '#fff', borderRadius: '16px', padding: '20px 24px', boxShadow: '0 2px 12px rgba(0,0,0,0.05)', border: '2px solid #dcfce7' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
                        <div>
                          <p style={{ margin: 0, fontWeight: '800', fontSize: '16px', color: '#111' }}>
                            Commande #{order.id} — <span style={{ color: '#A51C1C' }}>{Number(order.total_price).toFixed(2)} MAD</span>
                          </p>
                          <p style={{ margin: '6px 0 3px', color: '#555', fontSize: '14px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <Store size={14} color="#555"/> {order.restaurant_name}
                          </p>
                          <p style={{ margin: '3px 0', color: '#888', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                            <MapPin size={13} /> {order.restaurant_address}
                          </p>
                          <p style={{ margin: '3px 0', color: '#888', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                            <Navigation size={13} /> Livraison: {order.address?.substring(0, 50)}
                          </p>
                          {order.client_phone && (
                            <p style={{ margin: '3px 0', color: '#888', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                              <Phone size={13} /> {order.client_name} · {order.client_phone}
                            </p>
                          )}
                          <p style={{ margin: '6px 0 0', color: '#bbb', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                            <Clock size={12} /> {new Date(order.created_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                          </p>
                          {/* COD indicator */}
                          {order.payment_method === 'cash' && (
                            <div style={{ marginTop: '8px', display: 'inline-flex', alignItems: 'center', gap: '6px', background: '#fff7ed', color: '#c2410c', padding: '4px 10px', borderRadius: '999px', fontSize: '12px', fontWeight: '700' }}>
                              <Banknote size={13} /> Montant à récupérer: {Number(order.total_price).toFixed(2)} MAD
                            </div>
                          )}
                          {order.payment_method === 'card' && (
                            <div style={{ marginTop: '8px', display: 'inline-flex', alignItems: 'center', gap: '6px', background: '#f0fdf4', color: '#15803d', padding: '4px 10px', borderRadius: '999px', fontSize: '12px', fontWeight: '700' }}>
                              ✔ Payé par carte
                            </div>
                          )}
                        </div>
                        <button onClick={() => handleAccept(order.id)} disabled={!!activeOrderId || !isAvailable}
                          style={{
                            background: (activeOrderId || !isAvailable) ? '#f5f5f5' : '#22c55e',
                            color: (activeOrderId || !isAvailable) ? '#aaa' : '#fff',
                            border: 'none', padding: '14px 24px', borderRadius: '999px',
                            fontWeight: '800', cursor: (activeOrderId || !isAvailable) ? 'not-allowed' : 'pointer',
                            fontSize: '14px', display: 'flex', alignItems: 'center', gap: '8px',
                            opacity: (activeOrderId || !isAvailable) && activeOrderId !== order.id ? 0.5 : 1
                          }}>
                          <CheckCircle size={18} /> Accepter
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {/* MY DELIVERIES */}
          {tab === 'my' && (
            <motion.div key="my" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <h2 style={{ margin: '0 0 24px', fontWeight: '900', fontSize: '22px', color: '#111' }}>Mes livraisons</h2>

              {/* Active delivery map */}
              {activeOrderId && myLocation && (
                <div style={{ background: '#fff', borderRadius: '20px', overflow: 'hidden', boxShadow: '0 2px 12px rgba(0,0,0,0.05)', marginBottom: '24px' }}>
                  <div style={{ padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <p style={{ margin: 0, fontWeight: '800', color: '#111', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#22c55e', animation: 'pulse 1.5s infinite' }} />
                      Suivi GPS actif — Commande #{activeOrderId}
                    </p>
                      {activeOrderDetails?.status === 'driver_assigned' && (
                        <button
                          onClick={() => handleAtRestaurant(activeOrderId)}
                          style={{ background: '#A51C1C', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: '999px', fontWeight: '700', cursor: 'pointer', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <MapPin size={14}/> Je suis arrivé au restaurant
                        </button>
                      )}
                      {activeOrderDetails?.status === 'driver_at_restaurant' && (
                        <button
                          onClick={() => handlePickedUp(activeOrderId)}
                          style={{ background: '#A51C1C', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: '999px', fontWeight: '700', cursor: 'pointer', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <Package size={14}/> J'ai récupéré la commande
                        </button>
                      )}
                      {activeOrderDetails?.status === 'on_the_way' && (
                        <button
                          onClick={() => handleComplete(activeOrderId)}
                          style={{ background: '#A51C1C', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: '999px', fontWeight: '700', cursor: 'pointer', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <CheckCircle size={14}/> Marquer comme livré
                        </button>
                      )}
                  </div>
                  <MapContainer
                    center={[myLocation.lat, myLocation.lng]}
                    zoom={15}
                    style={{ height: '350px' }}
                    scrollWheelZoom={false}
                  >
                    <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution="© OpenStreetMap" />
                    
                    {/* Calculate all positions */}
                    {(() => {
                      const positions = [];
                      if (myLocation) positions.push([myLocation.lat, myLocation.lng]);
                      if (activeOrderDetails?.rest_lat && activeOrderDetails?.rest_lng) {
                        positions.push([Number(activeOrderDetails.rest_lat), Number(activeOrderDetails.rest_lng)]);
                      }
                      if (activeOrderDetails?.delivery_lat && activeOrderDetails?.delivery_lng) {
                        positions.push([Number(activeOrderDetails.delivery_lat), Number(activeOrderDetails.delivery_lng)]);
                      }
                      
                      // Route line between restaurant and client
                      const routePositions = [];
                      if (activeOrderDetails?.rest_lat && activeOrderDetails?.rest_lng) {
                        routePositions.push([Number(activeOrderDetails.rest_lat), Number(activeOrderDetails.rest_lng)]);
                      }
                      if (activeOrderDetails?.delivery_lat && activeOrderDetails?.delivery_lng) {
                        routePositions.push([Number(activeOrderDetails.delivery_lat), Number(activeOrderDetails.delivery_lng)]);
                      }
                      
                      return (
                        <>
                          {routePositions.length === 2 && (
                            <Polyline 
                              positions={routePositions} 
                              color="#A51C1C" 
                              weight={4} 
                              opacity={0.7}
                              dashArray="10, 10"
                            />
                          )}
                          
                          <Marker position={[myLocation.lat, myLocation.lng]} icon={bikeIcon}>
                            <Popup>Ma position actuelle 🏍️</Popup>
                          </Marker>
                          
                          {activeOrderDetails?.rest_lat && activeOrderDetails?.rest_lng && (
                            <Marker position={[Number(activeOrderDetails.rest_lat), Number(activeOrderDetails.rest_lng)]} icon={restaurantIcon}>
                              <Popup><strong>Point de départ</strong><br/>Restaurant: {activeOrderDetails.restaurant_name}</Popup>
                            </Marker>
                          )}
                          
                          {activeOrderDetails?.delivery_lat && activeOrderDetails?.delivery_lng && (
                            <Marker position={[Number(activeOrderDetails.delivery_lat), Number(activeOrderDetails.delivery_lng)]} icon={customerIcon}>
                              <Popup><strong>Point d'arrivée</strong><br/>Livraison: {activeOrderDetails.address}</Popup>
                            </Marker>
                          )}
                          
                          <MapBounds positions={positions} />
                        </>
                      );
                    })()}
                  </MapContainer>
                  <style>{`@keyframes pulse { 0%,100% { opacity:1 } 50% { opacity:0.4 } }`}</style>
                </div>
              )}

              {myDeliveries.length === 0 ? (
                <div style={{ background: '#fff', borderRadius: '20px', padding: '60px', textAlign: 'center', boxShadow: '0 2px 12px rgba(0,0,0,0.05)' }}>
                  <Bike size={50} color="#ddd" style={{ marginBottom: '16px' }} />
                  <p style={{ color: '#aaa' }}>Aucune livraison encore</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  {myDeliveries.map(order => (
                    <div key={order.id} style={{ background: '#fff', borderRadius: '16px', padding: '20px 24px', boxShadow: '0 2px 12px rgba(0,0,0,0.05)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                        <div>
                          <p style={{ margin: 0, fontWeight: '800', color: '#111' }}>Commande #{order.id}</p>
                          <p style={{ margin: '4px 0', color: '#888', fontSize: '13px' }}>{order.restaurant_name} → {order.address?.substring(0, 40)}</p>
                          <p style={{ margin: '4px 0', color: '#A51C1C', fontWeight: '800' }}>{Number(order.total_price).toFixed(2)} MAD</p>
                          {order.client_phone && (
                            <p style={{ margin: '4px 0', color: '#555', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                              <Phone size={13} color="#555"/> {order.client_name} · {order.client_phone}
                            </p>
                          )}
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px' }}>
                          <span style={{ background: statusColors[order.status]?.bg, color: statusColors[order.status]?.color, padding: '5px 14px', borderRadius: '999px', fontSize: '12px', fontWeight: '700' }}>
                            {statusColors[order.status]?.label}
                          </span>
                          {/* Payment info */}
                          {order.payment_method === 'cash' && order.status === 'on_the_way' && order.payment_status !== 'paid' && (
                            <div style={{ textAlign: 'right' }}>
                              <p style={{ margin: '0 0 4px', fontSize: '12px', color: '#c2410c', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '5px' }}>
                                <Banknote size={13} /> {Number(order.total_price).toFixed(2)} MAD à récupérer
                              </p>
                              <button onClick={() => handleConfirmCashPayment(order.id)}
                                style={{ background: '#f0fdf4', color: '#15803d', border: '1.5px solid #86efac', padding: '7px 14px', borderRadius: '999px', fontWeight: '700', cursor: 'pointer', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                                <CheckCircle size={13} /> Paiement reçu
                              </button>
                            </div>
                          )}
                          {order.payment_method === 'cash' && order.payment_status === 'paid' && (
                            <span style={{ fontSize: '12px', color: '#15803d', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '5px' }}>
                              ✔ Paiement confirmé
                            </span>
                          )}
                          {order.payment_method === 'card' && (
                            <span style={{ fontSize: '12px', color: '#15803d', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '5px' }}>
                              ✔ Payé par carte
                            </span>
                          )}
                          {order.status === 'driver_assigned' && (
                            <button onClick={() => handleAtRestaurant(order.id)}
                              style={{ background: '#A51C1C', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: '999px', fontWeight: '700', cursor: 'pointer', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                              <MapPin size={13}/> Au resto
                            </button>
                          )}
                          {order.status === 'driver_at_restaurant' && (
                            <button onClick={() => handlePickedUp(order.id)}
                              style={{ background: '#A51C1C', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: '999px', fontWeight: '700', cursor: 'pointer', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                              <Package size={13}/> Récupéré
                            </button>
                          )}
                          {order.status === 'on_the_way' && (
                            <button onClick={() => handleComplete(order.id)}
                              style={{ background: '#A51C1C', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: '999px', fontWeight: '700', cursor: 'pointer', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                              <CheckCircle size={13}/> Livré
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {/* STATS / GAINS */}
          {tab === 'stats' && (
            <motion.div key="stats" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <h2 style={{ margin: '0 0 24px', fontWeight: '900', fontSize: '22px', color: '#111' }}>Mes gains</h2>

              {stats && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '28px' }}>
                  {[
                    { label: 'Livraisons totales', value: stats.total, color: '#6366f1', icon: <Bike size={24} /> },
                    { label: "Aujourd'hui", value: stats.today, color: '#22c55e', icon: <CheckCircle size={24} /> },
                    { label: 'Gains estimés (MAD)', value: stats.earnings, color: '#A51C1C', icon: <TrendingUp size={24} /> },
                  ].map((s, i) => (
                    <div key={i} style={{ background: '#fff', borderRadius: '20px', padding: '28px', boxShadow: '0 2px 12px rgba(0,0,0,0.05)', display: 'flex', alignItems: 'center', gap: '20px' }}>
                      <div style={{ width: '52px', height: '52px', borderRadius: '14px', background: s.color + '15', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {React.cloneElement(s.icon, { color: s.color })}
                      </div>
                      <div>
                        <p style={{ margin: 0, color: '#888', fontSize: '12px', fontWeight: '600' }}>{s.label}</p>
                        <p style={{ margin: '4px 0 0', fontSize: '24px', fontWeight: '900', color: s.color }}>{s.value}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div style={{ background: '#fff', borderRadius: '20px', padding: '24px', boxShadow: '0 2px 12px rgba(0,0,0,0.05)' }}>
                <p style={{ margin: '0 0 12px', fontWeight: '800', color: '#111' }}>Commission: 10% du total de chaque commande</p>
                <p style={{ color: '#888', fontSize: '14px', lineHeight: 1.6 }}>
                  Vos gains sont calculés sur la base de 10% du montant total de chaque commande livrée avec succès.
                  Le paiement est effectué chaque semaine.
                </p>
              </div>
            </motion.div>
          )}

          {/* REVIEWS */}
          {tab === 'reviews' && (
            <motion.div key="reviews" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
                <h2 style={{ margin: 0, fontWeight: '900', fontSize: '22px', color: '#111' }}>Avis clients <span style={{ color: '#888', fontWeight: '600', fontSize: '16px' }}>({reviews.length})</span></h2>
                <button onClick={fetchReviews} style={{ background: '#fff', border: '1px solid #e5e7eb', padding: '10px', borderRadius: '10px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', color: '#555', fontWeight: '700', fontSize: '13px' }}>
                  <RefreshCw size={15} /> Actualiser
                </button>
              </div>

              {reviews.length === 0 ? (
                <div style={{ background: '#fff', borderRadius: '20px', padding: '60px', textAlign: 'center', boxShadow: '0 2px 12px rgba(0,0,0,0.05)' }}>
                  <Star size={50} color="#ddd" style={{ marginBottom: '16px' }} />
                  <p style={{ color: '#aaa', fontSize: '16px' }}>Aucun avis pour le moment</p>
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(300px,1fr))', gap: '14px' }}>
                  {reviews.map(review => (
                    <motion.div key={review.id} whileHover={{ y: -2 }} style={{ background: '#fff', borderRadius: '16px', padding: '20px 24px', boxShadow: '0 2px 12px rgba(0,0,0,0.05)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                        <div>
                          <p style={{ margin: 0, fontWeight: '800', fontSize: '15px', color: '#111' }}>{review.user_name}</p>
                          <p style={{ margin: '2px 0 0', color: '#888', fontSize: '11px' }}>
                            {new Date(review.created_at).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })}
                            {' • Commande #'}{review.order_id}
                          </p>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', background: '#fff7ed', padding: '4px 8px', borderRadius: '8px' }}>
                          <Star size={14} fill="#f59e0b" color="#f59e0b"/>
                          <span style={{ fontWeight: '800', fontSize: '13px', color: '#d97706' }}>{review.driver_rating}/5</span>
                        </div>
                      </div>
                      {review.driver_comment ? (
                        <p style={{ margin: 0, color: '#555', fontSize: '13px', lineHeight: 1.5 }}>"{review.driver_comment}"</p>
                      ) : (
                        <p style={{ margin: 0, color: '#aaa', fontSize: '13px', fontStyle: 'italic' }}>Aucun commentaire laissé.</p>
                      )}
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </div>
  );
}
