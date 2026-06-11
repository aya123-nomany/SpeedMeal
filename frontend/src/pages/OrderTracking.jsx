import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import axios from 'axios';
import { io } from 'socket.io-client';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { CheckCircle, Clock, Package, Bike, Home, Star, ArrowLeft, XCircle, MapPin, CreditCard } from 'lucide-react';

// Fix leaflet icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const bikeIcon = L.divIcon({
  className: '',
  html: `<div style="background:#A51C1C;width:36px;height:36px;border-radius:50%;display:flex;align-items:center;justify-content:center;box-shadow:0 4px 14px rgba(165,28,28,0.4);border:3px solid #fff"><svg xmlns='http://www.w3.org/2000/svg' width='18' height='18' viewBox='0 0 24 24' fill='none' stroke='white' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'><circle cx='18.5' cy='17.5' r='3.5'/><circle cx='5.5' cy='17.5' r='3.5'/><circle cx='15' cy='5' r='1'/><path d='M12 17.5V14l-3-3 4-3 2 3h2'/></svg></div>`,
  iconSize: [36, 36],
  iconAnchor: [18, 18],
});

// Component to update map center on location change
const MapUpdater = ({ center }) => {
  const map = useMap();
  useEffect(() => { if (center) map.flyTo(center, 15, { animate: true, duration: 1 }); }, [center]);
  return null;
};

const STEPS = [
  { key: 'pending',    icon: <Clock size={20} />,       label: 'Commande reçue' },
  { key: 'preparing',  icon: <Package size={20} />,     label: 'En préparation' },
  { key: 'on_the_way', icon: <Bike size={20} />,        label: 'En route' },
  { key: 'delivered',  icon: <CheckCircle size={20} />, label: 'Livré' },
];
const STEP_ORDER = ['pending', 'preparing', 'on_the_way', 'delivered'];

const API = 'http://localhost:5000/api';

export default function OrderTracking() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [driverPos, setDriverPos] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showReview, setShowReview] = useState(false);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [reviewed, setReviewed] = useState(false);
  const socketRef = useRef(null);
  const token = localStorage.getItem('token');

  useEffect(() => {
    if (!token) { navigate('/login'); return; }
    fetchOrder();

    // Socket.io for real-time updates
    socketRef.current = io('http://localhost:5000');
    socketRef.current.emit('joinOrder', id);

    socketRef.current.on('orderStatusUpdate', ({ orderId, status }) => {
      if (String(orderId) === String(id)) {
        setOrder(prev => ({ ...prev, status }));
        if (status === 'delivered') setShowReview(true);
      }
    });

    socketRef.current.on('driverLocationUpdate', ({ orderId, latitude, longitude }) => {
      if (String(orderId) === String(id)) {
        setDriverPos([latitude, longitude]);
      }
    });

    return () => socketRef.current?.disconnect();
  }, [id]);

  const fetchOrder = async () => {
    setLoading(true);
    try {
      const { data } = await axios.get(`${API}/orders/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setOrder(data);
      if (data.driver_location) {
        setDriverPos([data.driver_location.latitude, data.driver_location.longitude]);
      }
    } catch { navigate('/dashboard'); }
    setLoading(false);
  };

  const handleReview = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API}/reviews`, {
        restaurant_id: order.restaurant_id,
        order_id: order.id,
        rating,
        comment
      }, { headers: { Authorization: `Bearer ${token}` } });
      setReviewed(true);
    } catch (err) {
      alert(err.response?.data?.message || 'Error submitting review');
    }
  };

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f4f5f7' }}>
      <div style={{ width: '44px', height: '44px', border: '4px solid #f3f3f3', borderTop: '4px solid #A51C1C', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  if (!order) return null;

  const currentStepIdx = STEP_ORDER.indexOf(order.status);
  const mapCenter = driverPos || (order.rest_lat ? [Number(order.rest_lat), Number(order.rest_lng)] : [33.5731, -7.5898]);

  return (
    <div style={{ minHeight: '100vh', background: '#f4f5f7', paddingBottom: '60px' }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>

      {/* Header */}
      <div style={{ background: '#A51C1C', padding: '20px 24px', color: '#fff' }}>
        <div style={{ maxWidth: '900px', margin: '0 auto', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <button onClick={() => navigate('/dashboard')} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: '50%', padding: '10px', cursor: 'pointer', color: '#fff', display: 'flex' }}>
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 style={{ margin: 0, fontSize: '20px', fontWeight: '900' }}>Commande #{order.id}</h1>
            <p style={{ margin: '4px 0 0', opacity: 0.8, fontSize: '14px' }}>{order.restaurant_name}</p>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: '900px', margin: '0 auto', padding: '24px' }}>

        {/* Progress Steps */}
        {order.status !== 'cancelled' && (
          <div style={{ background: '#fff', borderRadius: '20px', padding: '28px', marginBottom: '20px', boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'relative' }}>
              {/* Progress line */}
              <div style={{ position: 'absolute', top: '22px', left: '10%', right: '10%', height: '3px', background: '#f0f0f0', zIndex: 0 }} />
              <div style={{
                position: 'absolute', top: '22px', left: '10%',
                width: `${Math.min(currentStepIdx / (STEPS.length - 1) * 80, 80)}%`,
                height: '3px', background: '#A51C1C', zIndex: 1,
                transition: 'width 0.6s ease'
              }} />

              {STEPS.map((step, i) => {
                const done = i < currentStepIdx;
                const active = i === currentStepIdx;
                return (
                  <div key={step.key} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px', zIndex: 2, flex: 1 }}>
                    <motion.div
                      animate={{ scale: active ? 1.15 : 1 }}
                      style={{
                        width: '44px', height: '44px', borderRadius: '50%',
                        background: done || active ? '#A51C1C' : '#f0f0f0',
                        color: done || active ? '#fff' : '#aaa',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        boxShadow: active ? '0 0 0 6px rgba(165,28,28,0.15)' : 'none',
                        transition: 'all 0.3s'
                      }}>
                      {step.icon}
                    </motion.div>
                    <span style={{ fontSize: '11px', fontWeight: '700', color: done || active ? '#A51C1C' : '#aaa', textAlign: 'center' }}>
                      {step.label}
                    </span>
                  </div>
                );
              })}
            </div>

            <div style={{ textAlign: 'center', marginTop: '20px' }}>
              <p style={{ margin: 0, fontSize: '16px', fontWeight: '800', color: '#111', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                {order.status === 'pending'    && <><Clock size={18} color="#f97316"/> Votre commande attend la confirmation du restaurant</>}
                {order.status === 'preparing'  && <><Package size={18} color="#8b5cf6"/> Le restaurant prépare votre commande...</>}
                {order.status === 'on_the_way' && <><Bike size={18} color="#3b82f6"/> Le livreur est en route vers vous!</>}
                {order.status === 'delivered'  && <><CheckCircle size={18} color="#22c55e"/> Commande livrée! Bon appétit!</>}
              </p>
            </div>
          </div>
        )}

        {order.status === 'cancelled' && (
          <div style={{ background: '#fef2f2', borderRadius: '20px', padding: '24px', marginBottom: '20px', border: '1px solid #fca5a5', textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
            <XCircle size={20} color="#b91c1c"/>
            <p style={{ margin: 0, color: '#b91c1c', fontWeight: '800', fontSize: '16px' }}>Cette commande a été annulée</p>
          </div>
        )}

        {/* Map - show when on the way */}
        {order.status === 'on_the_way' && (
          <div style={{ background: '#fff', borderRadius: '20px', overflow: 'hidden', marginBottom: '20px', boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid #f0f0f0' }}>
              <p style={{ margin: 0, fontWeight: '800', color: '#111', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Bike size={18} color="#A51C1C" />
                Suivi en temps réel du livreur
                <span style={{ marginLeft: 'auto', background: '#dcfce7', color: '#15803d', padding: '3px 10px', borderRadius: '999px', fontSize: '11px', fontWeight: '700' }}>
                  LIVE
                </span>
              </p>
              {order.driver_name && (
                <p style={{ margin: '4px 0 0', color: '#888', fontSize: '13px' }}>
                  Livreur: {order.driver_name} {order.driver_phone && `· ${order.driver_phone}`}
                </p>
              )}
            </div>
            <MapContainer center={mapCenter} zoom={14} style={{ height: '320px' }} scrollWheelZoom={false}>
              <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution="© OpenStreetMap" />
              {driverPos && (
                <Marker position={driverPos} icon={bikeIcon}>
                  <Popup>Livreur en route</Popup>
                </Marker>
              )}
              <MapUpdater center={driverPos} />
            </MapContainer>
          </div>
        )}

        {/* Order details */}
        <div style={{ background: '#fff', borderRadius: '20px', padding: '24px', marginBottom: '20px', boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
          <h3 style={{ margin: '0 0 16px', fontWeight: '800', color: '#111' }}>Détails de la commande</h3>
          {order.items?.map(item => (
            <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #f9f9f9' }}>
              <span style={{ color: '#333', fontSize: '14px' }}>{item.quantity}× {item.item_name}</span>
              <span style={{ color: '#111', fontWeight: '700', fontSize: '14px' }}>{Number(item.price * item.quantity).toFixed(2)} MAD</span>
            </div>
          ))}
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '14px 0 0', fontWeight: '900', fontSize: '16px' }}>
            <span>Total</span>
            <span style={{ color: '#A51C1C' }}>{Number(order.total_price).toFixed(2)} MAD</span>
          </div>
          <div style={{ marginTop: '14px', padding: '12px 16px', background: '#f9f9f9', borderRadius: '12px' }}>
            <p style={{ margin: '3px 0', fontSize: '13px', color: '#666', display: 'flex', alignItems: 'center', gap: '6px' }}><MapPin size={13} color="#666"/> Livraison: {order.address}</p>
            <p style={{ margin: '3px 0', fontSize: '13px', color: '#666', display: 'flex', alignItems: 'center', gap: '6px' }}><CreditCard size={13} color="#666"/> Paiement: {order.payment_method === 'card' ? 'Carte bancaire' : 'Cash à la livraison'}</p>
          </div>
        </div>

        {/* Review form - after delivery */}
        {(order.status === 'delivered' || showReview) && !reviewed && (
          <motion.div
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            style={{ background: '#fff', borderRadius: '20px', padding: '28px', boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
            <h3 style={{ margin: '0 0 6px', fontWeight: '800', color: '#111', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Star size={20} color="#f59e0b" /> Évaluer votre expérience
            </h3>
            <p style={{ margin: '0 0 20px', color: '#888', fontSize: '14px' }}>Comment était votre commande chez {order.restaurant_name}?</p>
            <form onSubmit={handleReview}>
              <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
                {[1,2,3,4,5].map(s => (
                  <button key={s} type="button" onClick={() => setRating(s)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', transition: 'transform 0.1s' }}
                    onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.2)'}
                    onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}>
                    <Star size={28} fill={s <= rating ? '#f59e0b' : 'none'} color={s <= rating ? '#f59e0b' : '#d1d5db'} strokeWidth={1.5}/>
                  </button>
                ))}
              </div>
              <textarea
                value={comment}
                onChange={e => setComment(e.target.value)}
                placeholder="Partagez votre expérience (optionnel)..."
                style={{ width: '100%', padding: '14px', borderRadius: '12px', border: '1.5px solid #e5e7eb', fontSize: '14px', outline: 'none', resize: 'vertical', minHeight: '80px', boxSizing: 'border-box' }}
              />
              <button type="submit" style={{ marginTop: '14px', background: '#A51C1C', color: '#fff', border: 'none', padding: '14px 28px', borderRadius: '999px', fontWeight: '800', cursor: 'pointer', fontSize: '15px' }}>
                Envoyer mon avis
              </button>
            </form>
          </motion.div>
        )}

        {reviewed && (
          <div style={{ background: '#f0fdf4', borderRadius: '20px', padding: '24px', textAlign: 'center', border: '1px solid #86efac', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
            <CheckCircle size={20} color="#15803d"/>
            <p style={{ margin: 0, color: '#15803d', fontWeight: '800', fontSize: '16px' }}>Merci pour votre avis!</p>
          </div>
        )}

        <div style={{ textAlign: 'center', marginTop: '24px' }}>
          <Link to="/dashboard" style={{ color: '#A51C1C', fontWeight: '700', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
            <Home size={16} /> Retour au tableau de bord
          </Link>
        </div>
      </div>
    </div>
  );
}
