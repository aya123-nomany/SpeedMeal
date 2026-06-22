import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import axios from 'axios';
import { io } from 'socket.io-client';
import { MapContainer, TileLayer, Marker, Popup, useMap, Polyline } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { CheckCircle, Clock, Package, Bike, Home, Star, ArrowLeft, XCircle, MapPin, CreditCard, Phone, User, Receipt } from 'lucide-react';

// Fix leaflet icons
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

// Component to update map center on location change
const MapUpdater = ({ center }) => {
  const map = useMap();
  useEffect(() => { if (center) map.flyTo(center, 15, { animate: true, duration: 1 }); }, [center]);
  return null;
};

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

const STATUS_DETAILS = {
  pending: { pct: 5, label: 'En attente', msg: 'Votre commande attend la confirmation.', eta: 'Calcul...' },
  accepted: { pct: 20, label: 'Acceptée', msg: 'Le restaurant a accepté votre commande.', eta: '35 min' },
  preparing: { pct: 40, label: 'En préparation', msg: 'Le restaurant prépare votre commande.', eta: '25 min' },
  ready: { pct: 60, label: 'Recherche livreur', msg: 'Votre commande est prête, nous cherchons un livreur.', eta: '20 min' },
  searching_driver: { pct: 60, label: 'Recherche livreur', msg: 'Votre commande est prête, nous cherchons un livreur.', eta: '20 min' },
  driver_assigned: { pct: 70, label: 'Livreur en route vers le resto', msg: 'Un livreur est en route pour récupérer votre commande.', eta: '15 min' },
  driver_at_restaurant: { pct: 80, label: 'Récupération', msg: 'Le livreur récupère votre commande au restaurant.', eta: '12 min' },
  on_the_way: { pct: 90, label: 'En livraison', msg: 'Le livreur arrive dans quelques minutes!', eta: '7 min' },
  delivered: { pct: 100, label: 'Livrée', msg: 'Commande livrée! Bon appétit!', eta: 'Livrée' },
  cancelled: { pct: 0, label: 'Annulée', msg: 'Cette commande a été annulée.', eta: '-' }
};

const CANCEL_REASONS = [
  { value: 'change_of_mind', label: 'Changement d\'avis' },
  { value: 'wrong_address', label: 'Mauvaise adresse' },
  { value: 'too_long', label: 'Délai trop long' },
  { value: 'other', label: 'Autre' }
];

import API_BASE_URL, { SOCKET_URL } from '../config/api';
const API = API_BASE_URL;

export default function OrderTracking() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [driverPos, setDriverPos] = useState(null);
  const [clientPos, setClientPos] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showReview, setShowReview] = useState(false);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [driverRating, setDriverRating] = useState(5);
  const [driverComment, setDriverComment] = useState('');
  const [reviewed, setReviewed] = useState(false);
  const [showInvoice, setShowInvoice] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [simulationInterval, setSimulationInterval] = useState(null);
  const socketRef = useRef(null);
  const token = localStorage.getItem('token');

  // Get client's real location
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setClientPos([position.coords.latitude, position.coords.longitude]);
        },
        (error) => {
          console.log('Geolocation error:', error);
          // Fallback to order's delivery location if geolocation fails
          if (order?.delivery_lat && order?.delivery_lng) {
            setClientPos([Number(order.delivery_lat), Number(order.delivery_lng)]);
          }
        }
      );
    }
  }, [order?.delivery_lat, order?.delivery_lng]);

  useEffect(() => {
    if (!token) { navigate('/login'); return; }
    fetchOrder();

    // Socket.io for real-time updates
    socketRef.current = io(SOCKET_URL);
    socketRef.current.emit('joinOrder', id);

    socketRef.current.on('orderStatusUpdate', ({ orderId, status }) => {
      if (String(orderId) === String(id)) {
        setOrder(prev => ({ ...prev, status }));
        if (status === 'delivered') {
          setShowReview(true);
          if (simulationInterval) clearInterval(simulationInterval);
        }
      }
    });

    socketRef.current.on('driverLocationUpdate', ({ orderId, latitude, longitude }) => {
      if (String(orderId) === String(id)) {
        setDriverPos([latitude, longitude]);
      }
    });

    return () => {
      socketRef.current?.disconnect();
      if (simulationInterval) clearInterval(simulationInterval);
    };
  }, [id, simulationInterval]);

  // Start simulation when driver is assigned
  useEffect(() => {
    if (order && ['driver_assigned', 'driver_at_restaurant', 'on_the_way'].includes(order.status) && !driverPos) {
      startDriverSimulation();
    }
    return () => {
      if (simulationInterval) clearInterval(simulationInterval);
    };
  }, [order?.status]);

  // Simulation function to move driver from restaurant to client (in Rabat)
  const startDriverSimulation = () => {
    // Rabat center coordinates as fallback
    const rabatLat = 33.9716;
    const rabatLng = -6.8498;
    
    let startPos = null;
    if (order?.rest_lat && order?.rest_lng) {
      startPos = [Number(order.rest_lat), Number(order.rest_lng)];
    } else {
      // If no restaurant location, start in Rabat
      startPos = [rabatLat, rabatLng];
    }
    setDriverPos(startPos);

    // Determine target
    let target = null;
    if (clientPos) {
      target = clientPos;
    } else if (order?.delivery_lat && order?.delivery_lng) {
      target = [Number(order.delivery_lat), Number(order.delivery_lng)];
    } else {
      // Default target in Rabat (near center)
      target = [startPos[0] + 0.008, startPos[1] + 0.008];
    }

    // Calculate small step (for smooth continuous movement)
    const latStep = (target[0] - startPos[0]) / 100;
    const lngStep = (target[1] - startPos[1]) / 100;
    let currentPos = [...startPos];

    const interval = setInterval(async () => {
      // Stop if order is already delivered
      if (order?.status === 'delivered') {
        clearInterval(interval);
        return;
      }

      // Calculate distance to target
      const distance = Math.sqrt(
        Math.pow(target[0] - currentPos[0], 2) +
        Math.pow(target[1] - currentPos[1], 2)
      );

      // If reached target, mark as delivered (demo only)
      if (distance < 0.0001) {
        clearInterval(interval);
        try {
          // Call backend to mark order as delivered
          await axios.put(`${API}/orders/${id}/status`, 
            { status: 'delivered' },
            { headers: { Authorization: `Bearer ${token}` } }
          );
          // Refresh order from backend
          fetchOrder();
        } catch (err) {
          console.error('Error marking order as delivered:', err);
          // Fallback to local update if backend call fails
          setOrder(prev => prev ? { ...prev, status: 'delivered' } : prev);
        }
        setShowReview(true);
        return;
      }

      // Move driver
      currentPos = [currentPos[0] + latStep, currentPos[1] + lngStep];
      setDriverPos([...currentPos]);
    }, 300); // Update every 300ms for smoother movement

    setSimulationInterval(interval);
  };

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

  const handleCancel = async () => {
    if (!cancelReason) {
      alert('Veuillez sélectionner une raison d\'annulation');
      return;
    }
    try {
      await axios.post(`${API}/orders/${id}/cancel`, { reason: cancelReason }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setShowCancelModal(false);
      setCancelReason('');
      fetchOrder();
    } catch (err) {
      alert(err.response?.data?.message || 'Erreur lors de l\'annulation');
    }
  };

  const handleReview = async (e) => {
    e.preventDefault();
    console.log('Submitting review for order:', order.id, 'status:', order.status);
    try {
      await axios.post(`${API}/reviews`, {
        restaurant_id: order.restaurant_id,
        order_id: order.id,
        rating,
        comment,
        driver_rating: order.delivery_id ? driverRating : null,
        driver_comment: order.delivery_id ? driverComment : null
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

  const currentStatus = STATUS_DETAILS[order.status] || STATUS_DETAILS.pending;
  const pct = currentStatus.pct;
  const showMap = ['driver_assigned', 'driver_at_restaurant', 'on_the_way'].includes(order.status);
  // Default map center to Rabat (33.9716, -6.8498)
  const mapCenter = driverPos || (order.rest_lat ? [Number(order.rest_lat), Number(order.rest_lng)] : [33.9716, -6.8498]);
  
  // Calculate all positions for bounds fitting
  const allMapPositions = [];
  if (order.rest_lat && order.rest_lng) {
    allMapPositions.push([Number(order.rest_lat), Number(order.rest_lng)]);
  }
  if (clientPos) {
    allMapPositions.push(clientPos);
  } else if (order.delivery_lat && order.delivery_lng) {
    allMapPositions.push([Number(order.delivery_lat), Number(order.delivery_lng)]);
  }
  if (driverPos) {
    allMapPositions.push(driverPos);
  }
  
  // Route line positions (restaurant -> client)
  const routePositions = [];
  if (order.rest_lat && order.rest_lng) {
    routePositions.push([Number(order.rest_lat), Number(order.rest_lng)]);
  }
  if (clientPos) {
    routePositions.push(clientPos);
  } else if (order.delivery_lat && order.delivery_lng) {
    routePositions.push([Number(order.delivery_lat), Number(order.delivery_lng)]);
  }

  // Final client position to use on map
  const finalClientPos = clientPos || (order.delivery_lat && order.delivery_lng ? [Number(order.delivery_lat), Number(order.delivery_lng)] : null);

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
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
              <p style={{ margin: 0, opacity: 0.8, fontSize: '14px' }}>{order.restaurant_name}</p>
              {order.restaurant_rating > 0 && (
                <span style={{ display: 'flex', alignItems: 'center', gap: '2px', background: '#f59e0b', color: '#fff', padding: '2px 6px', borderRadius: '4px', fontSize: '11px', fontWeight: '800' }}>
                  <Star size={10} fill="currentColor" /> {order.restaurant_rating}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: '900px', margin: '0 auto', padding: '24px' }}>

        {/* Cancel Button (show only if status is pending or accepted) */}
        {['pending', 'accepted'].includes(order.status) && (
          <div style={{ marginBottom: '20px' }}>
            <button onClick={() => setShowCancelModal(true)}
              style={{
                width: '100%',
                padding: '12px 20px',
                borderRadius: '12px',
                border: '2px solid #b91c1c',
                background: 'none',
                color: '#b91c1c',
                fontWeight: '800',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px'
              }}>
              <XCircle size={18} /> Annuler la commande
            </button>
          </div>
        )}

        {/* Dynamic Progress Bar Status */}
        {order.status !== 'cancelled' && (
          <div style={{ background: '#fff', borderRadius: '20px', padding: '28px', marginBottom: '20px', boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div>
                <h2 style={{ margin: '0 0 6px', fontSize: '22px', fontWeight: '900', color: '#111' }}>
                  {pct}% - {currentStatus.label}
                </h2>
                <p style={{ margin: 0, color: '#666', fontSize: '14px' }}>{currentStatus.msg}</p>
              </div>
              <div style={{ background: '#fef2f2', padding: '12px 20px', borderRadius: '14px', textAlign: 'center' }}>
                <p style={{ margin: 0, fontSize: '12px', fontWeight: '800', color: '#A51C1C', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Temps estimé</p>
                <p style={{ margin: '2px 0 0', fontSize: '18px', fontWeight: '900', color: '#111' }}>{currentStatus.eta}</p>
              </div>
            </div>

            {/* Progress line */}
            <div style={{ width: '100%', height: '12px', background: '#f0f0f0', borderRadius: '999px', overflow: 'hidden', position: 'relative' }}>
              <motion.div 
                initial={{ width: 0 }} 
                animate={{ width: `${pct}%` }} 
                transition={{ duration: 0.8, ease: "easeInOut" }}
                style={{ height: '100%', background: '#A51C1C', borderRadius: '999px' }} 
              />
            </div>
            
            {/* Visual Milestones */}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '16px', padding: '0 5px' }}>
              <div style={{ textAlign: 'center', opacity: pct >= 0 ? 1 : 0.4 }}>
                <Clock size={20} color={pct >= 0 ? '#A51C1C' : '#aaa'} style={{ marginBottom: '4px' }} />
                <p style={{ margin: 0, fontSize: '11px', fontWeight: '700', color: '#555' }}>Reçue</p>
              </div>
              <div style={{ textAlign: 'center', opacity: pct >= 40 ? 1 : 0.4 }}>
                <Package size={20} color={pct >= 40 ? '#A51C1C' : '#aaa'} style={{ marginBottom: '4px' }} />
                <p style={{ margin: 0, fontSize: '11px', fontWeight: '700', color: '#555' }}>Préparation</p>
              </div>
              <div style={{ textAlign: 'center', opacity: pct >= 70 ? 1 : 0.4 }}>
                <Bike size={20} color={pct >= 70 ? '#A51C1C' : '#aaa'} style={{ marginBottom: '4px' }} />
                <p style={{ margin: 0, fontSize: '11px', fontWeight: '700', color: '#555' }}>En route</p>
              </div>
              <div style={{ textAlign: 'center', opacity: pct >= 100 ? 1 : 0.4 }}>
                <CheckCircle size={20} color={pct >= 100 ? '#22c55e' : '#aaa'} style={{ marginBottom: '4px' }} />
                <p style={{ margin: 0, fontSize: '11px', fontWeight: '700', color: '#555' }}>Livrée</p>
              </div>
            </div>
          </div>
        )}

        {order.status === 'cancelled' && (
          <div style={{ background: '#fef2f2', borderRadius: '20px', padding: '24px', marginBottom: '20px', border: '1px solid #fca5a5', textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
            <XCircle size={20} color="#b91c1c"/>
            <p style={{ margin: 0, color: '#b91c1c', fontWeight: '800', fontSize: '16px' }}>Cette commande a été annulée</p>
          </div>
        )}

        {/* Map & Driver Details - show when assigned or further */}
        {showMap && (
          <div style={{ background: '#fff', borderRadius: '20px', overflow: 'hidden', marginBottom: '20px', boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
            <div style={{ padding: '20px', borderBottom: '1px solid #f0f0f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
              <div>
                <p style={{ margin: 0, fontWeight: '800', color: '#111', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '16px' }}>
                  <Bike size={20} color="#A51C1C" />
                  Votre Livreur
                  <span style={{ background: '#dcfce7', color: '#15803d', padding: '4px 12px', borderRadius: '999px', fontSize: '11px', fontWeight: '800', animation: 'pulse 1.5s infinite' }}>
                    ● LIVE
                  </span>
                </p>
                {order.driver_name && (
                  <div style={{ marginTop: '12px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#f4f5f7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <User size={20} color="#888" />
                    </div>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <p style={{ margin: 0, fontWeight: '800', color: '#111', fontSize: '15px' }}>{order.driver_name}</p>
                        {order.driver_rating > 0 && (
                          <span style={{ display: 'flex', alignItems: 'center', gap: '2px', background: '#f59e0b', color: '#fff', padding: '2px 6px', borderRadius: '4px', fontSize: '11px', fontWeight: '800' }}>
                            <Star size={10} fill="currentColor" /> {order.driver_rating}
                          </span>
                        )}
                      </div>
                      {order.driver_phone && (
                        <p style={{ margin: '2px 0 0', color: '#555', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <Phone size={12} /> {order.driver_phone}
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            <MapContainer center={mapCenter} zoom={14} style={{ height: '360px', zIndex: 0 }} scrollWheelZoom={false}>
              <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution="© OpenStreetMap" />
              
              {/* Dynamic Line: Driver to Client */}
              {driverPos && finalClientPos && (
                <Polyline 
                  positions={[driverPos, finalClientPos]} 
                  color="#22c55e" 
                  weight={5} 
                  opacity={0.8}
                />
              )}
              
              {/* Original Route line between restaurant and client (faded) */}
              {routePositions.length === 2 && (
                <Polyline 
                  positions={routePositions} 
                  color="#A51C1C" 
                  weight={3} 
                  opacity={0.3}
                  dashArray="10, 10"
                />
              )}
              
              {/* Restaurant Marker (Point de départ) */}
              {order.rest_lat && order.rest_lng && (
                 <Marker position={[Number(order.rest_lat), Number(order.rest_lng)]} icon={restaurantIcon}>
                   <Popup><strong>Point de départ</strong><br/>Restaurant: {order.restaurant_name}</Popup>
                 </Marker>
              )}
              
              {/* Customer Location Marker (Point d'arrivée) */}
              {finalClientPos && (
                <Marker position={finalClientPos} icon={customerIcon}>
                  <Popup><strong>Point d'arrivée</strong><br/>Livraison: {order.address}</Popup>
                </Marker>
              )}
              
              {/* Driver Live Marker */}
              {driverPos && (
                <Marker position={driverPos} icon={bikeIcon}>
                  <Popup>Livreur en mouvement</Popup>
                </Marker>
              )}
              
              {/* Fit all markers on map */}
              <MapBounds positions={allMapPositions} />
              <MapUpdater center={driverPos} />
            </MapContainer>
            <style>{`@keyframes pulse { 0%,100% { opacity:1 } 50% { opacity:0.5 } }`}</style>
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
          <button onClick={() => setShowInvoice(true)} style={{
            marginTop: '16px', width: '100%', padding: '12px', borderRadius: '12px', border: '1.5px solid #A51C1C',
            background: 'none', color: '#A51C1C', fontWeight: '700', fontSize: '14px', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', transition: 'all 0.2s'
          }}>
            <Receipt size={16} /> Afficher le reçu / la facture
          </button>
        </div>

        {/* Review form - after delivery */}
        {(order.status === 'delivered' || showReview) && !reviewed && (
          <motion.div
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            style={{ background: '#fff', borderRadius: '20px', padding: '28px', boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
            <h3 style={{ margin: '0 0 20px', fontWeight: '800', color: '#111', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '22px' }}>
              <Star size={24} color="#f59e0b" /> Évaluer votre expérience
            </h3>
            
            <form onSubmit={handleReview}>
              {/* Restaurant Review */}
              <div style={{ marginBottom: '30px', padding: '20px', background: '#fcfcfc', borderRadius: '16px', border: '1px solid #f0f0f0' }}>
                <p style={{ margin: '0 0 12px', fontWeight: '700', color: '#111', fontSize: '16px' }}>Le Restaurant: {order.restaurant_name}</p>
                <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
                  {[1,2,3,4,5].map(s => (
                    <button key={s} type="button" onClick={() => setRating(s)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', transition: 'transform 0.1s' }}>
                      <Star size={24} fill={s <= rating ? '#f59e0b' : 'none'} color={s <= rating ? '#f59e0b' : '#d1d5db'} strokeWidth={1.5}/>
                    </button>
                  ))}
                </div>
                <textarea
                  value={comment}
                  onChange={e => setComment(e.target.value)}
                  placeholder="Comment était la nourriture? (optionnel)..."
                  style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1.5px solid #eee', fontSize: '14px', outline: 'none', resize: 'vertical', minHeight: '60px' }}
                />
              </div>

              {/* Driver Review - Only if there's a driver */}
              {order.delivery_id && (
                <div style={{ marginBottom: '30px', padding: '20px', background: '#fcfcfc', borderRadius: '16px', border: '1px solid #f0f0f0' }}>
                  <p style={{ margin: '0 0 12px', fontWeight: '700', color: '#111', fontSize: '16px' }}>Le Livreur: {order.driver_name || 'Votre livreur'}</p>
                  <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
                    {[1,2,3,4,5].map(s => (
                      <button key={s} type="button" onClick={() => setDriverRating(s)}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', transition: 'transform 0.1s' }}>
                        <Star size={24} fill={s <= driverRating ? '#f59e0b' : 'none'} color={s <= driverRating ? '#f59e0b' : '#d1d5db'} strokeWidth={1.5}/>
                      </button>
                    ))}
                  </div>
                  <textarea
                    value={driverComment}
                    onChange={e => setDriverComment(e.target.value)}
                    placeholder="Le livreur était-il poli et rapide? (optionnel)..."
                    style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1.5px solid #eee', fontSize: '14px', outline: 'none', resize: 'vertical', minHeight: '60px' }}
                  />
                </div>
              )}

              <button type="submit" style={{ width: '100%', background: '#A51C1C', color: '#fff', border: 'none', padding: '16px', borderRadius: '12px', fontWeight: '800', cursor: 'pointer', fontSize: '16px', transition: 'all 0.2s' }}>
                Envoyer mes avis
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

      {/* Invoice / Facture Modal */}
      {showInvoice && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }} onClick={() => setShowInvoice(false)}>
          <div style={{ background: '#fff', borderRadius: '16px', width: '100%', maxWidth: '500px', maxHeight: '90vh', overflowY: 'auto', padding: '32px', boxShadow: '0 20px 50px rgba(0,0,0,0.15)', position: 'relative' }} onClick={e => e.stopPropagation()}>
            
            {/* Close button */}
            <button onClick={() => setShowInvoice(false)} style={{ position: 'absolute', top: '20px', right: '20px', background: '#f5f5f5', border: 'none', borderRadius: '50%', width: '32px', height: '32px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <XCircle size={18} color="#666" />
            </button>

            {/* Invoice Header */}
            <div style={{ textAlign: 'center', borderBottom: '2px dashed #e5e7eb', paddingBottom: '20px', marginBottom: '20px' }}>
              <h2 style={{ color: '#A51C1C', margin: '0 0 4px', fontWeight: '900', fontSize: '24px', letterSpacing: '1px' }}>SPEED MEAL</h2>
              <p style={{ margin: 0, color: '#666', fontSize: '12px', fontWeight: '600' }}>Reçu de Paiement / Facture</p>
              <p style={{ margin: '8px 0 0', color: '#999', fontSize: '11px' }}>Date: {new Date(order.created_at || Date.now()).toLocaleString('fr-FR')}</p>
              <p style={{ margin: '2px 0 0', color: '#111', fontSize: '13px', fontWeight: '700' }}>N° Commande: #{order.id}</p>
            </div>

            {/* Info fields */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', fontSize: '13px', marginBottom: '20px', color: '#444' }}>
              <div>
                <p style={{ margin: '0 0 4px', fontWeight: '700', color: '#888', fontSize: '11px', textTransform: 'uppercase' }}>Émetteur</p>
                <p style={{ margin: 0, fontWeight: '800', color: '#111' }}>{order.restaurant_name}</p>
                <p style={{ margin: '2px 0 0', color: '#666', fontSize: '12px' }}>{order.restaurant_address || 'Adresse du restaurant'}</p>
              </div>
              <div>
                <p style={{ margin: '0 0 4px', fontWeight: '700', color: '#888', fontSize: '11px', textTransform: 'uppercase' }}>Destinataire</p>
                <p style={{ margin: 0, fontWeight: '800', color: '#111' }}>{order.client_name || 'Client SpeedMeal'}</p>
                <p style={{ margin: '2px 0 0', color: '#666', fontSize: '12px' }}>Tél: {order.client_phone || '-'}</p>
                <p style={{ margin: '2px 0 0', color: '#666', fontSize: '12px', wordBreak: 'break-word' }}>{order.address}</p>
              </div>
            </div>

            {/* Items Table */}
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', marginBottom: '20px' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #e5e7eb', textAlign: 'left', color: '#888' }}>
                  <th style={{ padding: '8px 0', fontWeight: '700' }}>Article</th>
                  <th style={{ padding: '8px 0', textAlign: 'center', fontWeight: '700' }}>Qté</th>
                  <th style={{ padding: '8px 0', textAlign: 'right', fontWeight: '700' }}>Prix</th>
                </tr>
              </thead>
              <tbody>
                {order.items?.map(item => (
                  <tr key={item.id} style={{ borderBottom: '1px solid #f9f9f9' }}>
                    <td style={{ padding: '8px 0', fontWeight: '600' }}>{item.item_name}</td>
                    <td style={{ padding: '8px 0', textAlign: 'center', color: '#666' }}>{item.quantity}</td>
                    <td style={{ padding: '8px 0', textAlign: 'right', fontWeight: '700' }}>{(item.price * item.quantity).toFixed(2)} MAD</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Totals */}
            <div style={{ borderTop: '2px solid #e5e7eb', paddingTop: '12px', fontSize: '13px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#666' }}>
                <span>Sous-total</span>
                 <span>{(Number(order.total_price) - Number(order.delivery_fee || 0) + Number(order.discount_amount || 0)).toFixed(2)} MAD</span>
              </div>
              {order.discount_amount > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#22c55e', fontWeight: '600' }}>
                  <span>Réduction</span>
                  <span>-{Number(order.discount_amount).toFixed(2)} MAD</span>
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#666' }}>
                <span>Frais de livraison</span>
                <span style={{ color: '#22c55e', fontWeight: '600' }}>Gratuit</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: '800', fontSize: '16px', borderTop: '1px solid #f3f4f6', paddingTop: '10px', marginTop: '4px', color: '#111' }}>
                <span>Total Payé</span>
                <span style={{ color: '#A51C1C' }}>{Number(order.total_price).toFixed(2)} MAD</span>
              </div>
            </div>

            {/* Payment and status info */}
            <div style={{ marginTop: '24px', padding: '12px', background: '#f8fafc', borderRadius: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px' }}>
              <div>
                <span style={{ color: '#64748b', display: 'block' }}>Mode de Paiement</span>
                <span style={{ fontWeight: '700', color: '#334155' }}>{order.payment_method === 'card' ? '💳 Carte Bancaire' : '💵 Cash à la livraison'}</span>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span style={{ color: '#64748b', display: 'block' }}>Statut</span>
                <span style={{ fontWeight: '800', color: order.payment_status === 'paid' ? '#16a34a' : '#ea580c' }}>
                  {order.payment_status === 'paid' ? '✔ PAYÉ' : '⏳ À payer'}
                </span>
              </div>
            </div>

            {/* Actions */}
            <div style={{ marginTop: '28px', display: 'flex', gap: '12px' }}>
              <button onClick={() => window.print()} style={{ flex: 1, padding: '12px', background: '#f1f5f9', color: '#334155', border: 'none', borderRadius: '10px', fontWeight: '700', fontSize: '14px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                Imprimer
              </button>
              <button onClick={() => setShowInvoice(false)} style={{ flex: 1, padding: '12px', background: '#A51C1C', color: '#fff', border: 'none', borderRadius: '10px', fontWeight: '700', fontSize: '14px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                Fermer
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Cancel Order Modal */}
      {showCancelModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }} onClick={() => setShowCancelModal(false)}>
          <div style={{ background: '#fff', borderRadius: '16px', width: '100%', maxWidth: '450px', padding: '32px', boxShadow: '0 20px 50px rgba(0,0,0,0.15)', position: 'relative' }} onClick={e => e.stopPropagation()}>
            
            {/* Close button */}
            <button onClick={() => setShowCancelModal(false)} style={{ position: 'absolute', top: '20px', right: '20px', background: '#f5f5f5', border: 'none', borderRadius: '50%', width: '32px', height: '32px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <XCircle size={18} color="#666" />
            </button>

            <div style={{ marginBottom: '24px' }}>
              <h2 style={{ margin: 0, color: '#b91c1c', fontWeight: '900', fontSize: '22px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <XCircle size={24} color="#b91c1c" /> Annuler la commande
              </h2>
              <p style={{ margin: '8px 0 0', color: '#666', fontSize: '14px' }}>Êtes-vous sûr de vouloir annuler cette commande? Cette action est irréversible.</p>
            </div>

            {/* Cancel Reason Select */}
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '700', color: '#111', fontSize: '14px' }}>Raison de l'annulation</label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '10px' }}>
                {CANCEL_REASONS.map(reason => (
                  <button
                    key={reason.value}
                    type="button"
                    onClick={() => setCancelReason(reason.value)}
                    style={{
                      padding: '10px 14px',
                      borderRadius: '10px',
                      border: cancelReason === reason.value ? '2px solid #A51C1C' : '2px solid #e5e7eb',
                      background: cancelReason === reason.value ? '#fef2f2' : '#fafafa',
                      color: cancelReason === reason.value ? '#A51C1C' : '#111',
                      fontWeight: cancelReason === reason.value ? '800' : '600',
                      fontSize: '14px',
                      cursor: 'pointer',
                      textAlign: 'left'
                    }}>
                    {reason.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Action Buttons */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <button
                onClick={() => setShowCancelModal(false)}
                style={{
                  padding: '14px',
                  borderRadius: '12px',
                  border: 'none',
                  background: '#f3f4f6',
                  color: '#374151',
                  fontWeight: '800',
                  fontSize: '14px',
                  cursor: 'pointer'
                }}>
                Annuler
              </button>
              <button
                onClick={handleCancel}
                style={{
                  padding: '14px',
                  borderRadius: '12px',
                  border: 'none',
                  background: '#b91c1c',
                  color: '#fff',
                  fontWeight: '800',
                  fontSize: '14px',
                  cursor: 'pointer'
                }}>
                Confirmer l'annulation
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}

