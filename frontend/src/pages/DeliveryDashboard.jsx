import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
  Bike, Package, CheckCircle, MapPin, Clock, LogOut,
  Home, TrendingUp, Phone, Navigation, RefreshCw, Store
} from 'lucide-react';
import logoUrl from '../assets/logo.png';

// Fix leaflet marker icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const API = 'http://localhost:5000/api';

const statusColors = {
  pending:    { bg: '#fff7ed', color: '#c2410c', label: 'En attente' },
  preparing:  { bg: '#fefce8', color: '#a16207', label: 'En préparation' },
  on_the_way: { bg: '#eff6ff', color: '#1d4ed8', label: 'En route' },
  delivered:  { bg: '#f0fdf4', color: '#15803d', label: 'Livré' },
  cancelled:  { bg: '#fef2f2', color: '#b91c1c', label: 'Annulé' },
};

export default function DeliveryDashboard() {
  const [tab, setTab] = useState('available');
  const [available, setAvailable] = useState([]);
  const [myDeliveries, setMyDeliveries] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [myLocation, setMyLocation] = useState(null);
  const [activeOrderId, setActiveOrderId] = useState(null);
  const [tracking, setTracking] = useState(false);
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
      const active = data.find(d => d.status === 'on_the_way');
      if (active) setActiveOrderId(active.id);
    } catch { setMyDeliveries([]); }
  };

  const fetchStats = async () => {
    try {
      const { data } = await axios.get(`${API}/delivery/stats`, { headers });
      setStats(data);
    } catch { setStats(null); }
  };

  const handleAccept = async (orderId) => {
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

  const TABS = [
    { id: 'available', label: 'Disponibles', icon: <Package size={16} /> },
    { id: 'my',        label: 'Mes livraisons', icon: <Bike size={16} /> },
    { id: 'stats',     label: 'Gains',          icon: <TrendingUp size={16} /> },
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
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '6px' }}>
            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: tracking ? '#22c55e' : '#888' }} />
            <span style={{ color: tracking ? '#22c55e' : '#888', fontSize: '12px', fontWeight: '600' }}>
              {tracking ? 'En livraison' : 'Disponible'}
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
                        </div>
                        <button onClick={() => handleAccept(order.id)} disabled={!!activeOrderId && activeOrderId !== order.id}
                          style={{
                            background: activeOrderId ? '#f5f5f5' : '#22c55e',
                            color: activeOrderId ? '#aaa' : '#fff',
                            border: 'none', padding: '14px 24px', borderRadius: '999px',
                            fontWeight: '800', cursor: activeOrderId ? 'not-allowed' : 'pointer',
                            fontSize: '14px', display: 'flex', alignItems: 'center', gap: '8px',
                            opacity: activeOrderId && activeOrderId !== order.id ? 0.5 : 1
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
                    <button
                      onClick={() => {
                        const order = myDeliveries.find(o => o.id === activeOrderId);
                        if (order) handleComplete(activeOrderId);
                      }}
                      style={{ background: '#A51C1C', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: '999px', fontWeight: '700', cursor: 'pointer', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <CheckCircle size={14}/> Marquer comme livré
                    </button>
                  </div>
                  <MapContainer
                    center={[myLocation.lat, myLocation.lng]}
                    zoom={15}
                    style={{ height: '300px' }}
                    scrollWheelZoom={false}
                  >
                    <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution="© OpenStreetMap" />
                    <Marker position={[myLocation.lat, myLocation.lng]}>
                      <Popup>Ma position actuelle</Popup>
                    </Marker>
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
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px' }}>
                          <span style={{ background: statusColors[order.status]?.bg, color: statusColors[order.status]?.color, padding: '5px 14px', borderRadius: '999px', fontSize: '12px', fontWeight: '700' }}>
                            {statusColors[order.status]?.label}
                          </span>
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
        </AnimatePresence>
      </div>
    </div>
  );
}
