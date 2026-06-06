import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { useCart } from '../context/CartContext';
import {
  ShoppingBag, MapPin, CreditCard, Banknote, Tag,
  ChevronRight, Trash2, Plus, Minus, ArrowLeft, Clock, Check, X
} from 'lucide-react';

const API = 'http://localhost:5000/api';

export default function Checkout() {
  const navigate = useNavigate();
  const { cart, restaurantId, restaurantName, updateQuantity, removeItem, clearCart, total } = useCart();
  const [addresses, setAddresses] = useState([]);
  const [selectedAddress, setSelectedAddress] = useState('');
  const [customAddress, setCustomAddress] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [couponCode, setCouponCode] = useState('');
  const [coupon, setCoupon] = useState(null);
  const [couponError, setCouponError] = useState('');
  const [couponLoading, setCouponLoading] = useState(false);
  const [note, setNote] = useState('');
  const [deliveryTime, setDeliveryTime] = useState('');
  const [placing, setPlacing] = useState(false);
  const [error, setError] = useState('');
  const token = localStorage.getItem('token');

  useEffect(() => {
    if (!token) { navigate('/login'); return; }
    if (cart.length === 0) { navigate('/menu'); return; }
    fetchAddresses();
  }, []);

  const fetchAddresses = async () => {
    try {
      const { data } = await axios.get(`${API}/addresses`, { headers: { Authorization: `Bearer ${token}` } });
      setAddresses(data);
      const def = data.find(a => a.is_default);
      if (def) setSelectedAddress(String(def.id));
    } catch { setAddresses([]); }
  };

  const applyCoupon = async () => {
    if (!couponCode.trim()) return;
    setCouponLoading(true); setCouponError(''); setCoupon(null);
    try {
      const { data } = await axios.post(`${API}/coupons/validate`, {
        code: couponCode,
        order_total: total
      }, { headers: { Authorization: `Bearer ${token}` } });
      setCoupon(data);
    } catch (err) {
      setCouponError(err.response?.data?.message || 'Coupon invalide');
    }
    setCouponLoading(false);
  };

  const getDeliveryAddress = () => {
    if (selectedAddress) {
      const addr = addresses.find(a => String(a.id) === selectedAddress);
      return addr?.address || customAddress;
    }
    return customAddress;
  };

  const discount = coupon ? Number(coupon.discount_amount) : 0;
  const finalTotal = Math.max(0, total - discount);

  const placeOrder = async () => {
    const deliveryAddress = getDeliveryAddress();
    if (!deliveryAddress) {
      setError("Veuillez saisir ou sélectionner une adresse de livraison");
      return;
    }

    setPlacing(true); setError('');
    try {
      const payload = {
        restaurant_id: Number(restaurantId),
        items: cart.map(i => ({ id: i.id, quantity: i.quantity, price: Number(i.price) })),
        total_price: finalTotal,
        address: deliveryAddress,
        payment_method: paymentMethod,
        coupon_id: coupon?.coupon_id || null,
        discount_amount: discount,
        note: note || null,
        delivery_time: deliveryTime || null,
      };

      const { data } = await axios.post(`${API}/orders`, payload, {
        headers: { Authorization: `Bearer ${token}` }
      });

      clearCart();
      navigate(`/order/${data.orderId}`);
    } catch (err) {
      setError(err.response?.data?.message || err.response?.data?.error || 'Erreur lors de la commande');
    }
    setPlacing(false);
  };

  const inputStyle = {
    width: '100%', padding: '13px 16px', borderRadius: '12px',
    border: '1.5px solid #e5e7eb', fontSize: '14px', outline: 'none',
    background: '#fafafa', boxSizing: 'border-box',
  };

  return (
    <div style={{ minHeight: '100vh', background: '#f4f5f7', paddingBottom: '60px' }}>
      {/* Header */}
      <div style={{ background: '#fff', borderBottom: '1px solid #f0f0f0', padding: '16px 24px', position: 'sticky', top: 0, zIndex: 100 }}>
        <div style={{ maxWidth: '1000px', margin: '0 auto', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <button onClick={() => navigate(-1)} style={{ background: '#f5f5f5', border: 'none', borderRadius: '50%', padding: '10px', cursor: 'pointer', display: 'flex' }}>
            <ArrowLeft size={20} />
          </button>
          <h1 style={{ margin: 0, fontSize: '20px', fontWeight: '900', color: '#111' }}>Commander</h1>
          <span style={{ marginLeft: 'auto', color: '#888', fontSize: '14px', fontWeight: '600' }}>{restaurantName}</span>
        </div>
      </div>

      <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '24px', display: 'grid', gridTemplateColumns: '1fr 360px', gap: '24px', alignItems: 'flex-start' }}>

        {/* LEFT: Form */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

          {/* Cart items */}
          <div style={{ background: '#fff', borderRadius: '20px', padding: '24px', boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
            <h3 style={{ margin: '0 0 18px', fontWeight: '800', color: '#111', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <ShoppingBag size={18} color="#A51C1C" /> Votre panier
            </h3>
            {cart.map(item => (
              <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid #f9f9f9' }}>
                <div style={{ flex: 1 }}>
                  <p style={{ margin: 0, fontWeight: '700', fontSize: '14px', color: '#111' }}>{item.name}</p>
                  <p style={{ margin: '2px 0 0', color: '#A51C1C', fontWeight: '700', fontSize: '13px' }}>{Number(item.price).toFixed(2)} MAD</p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: '#f9f9f9', borderRadius: '10px', padding: '6px 12px' }}>
                    <button onClick={() => updateQuantity(item.id, item.quantity - 1)} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', color: '#555' }}>
                      <Minus size={14} />
                    </button>
                    <span style={{ fontWeight: '800', fontSize: '14px', minWidth: '20px', textAlign: 'center' }}>{item.quantity}</span>
                    <button onClick={() => updateQuantity(item.id, item.quantity + 1)} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', color: '#555' }}>
                      <Plus size={14} />
                    </button>
                  </div>
                  <span style={{ fontWeight: '800', minWidth: '70px', textAlign: 'right', fontSize: '14px' }}>
                    {Number(item.price * item.quantity).toFixed(2)} MAD
                  </span>
                  <button onClick={() => removeItem(item.id)} style={{ background: '#fef2f2', border: 'none', borderRadius: '8px', padding: '8px', cursor: 'pointer', display: 'flex', color: '#b91c1c' }}>
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Delivery address */}
          <div style={{ background: '#fff', borderRadius: '20px', padding: '24px', boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
            <h3 style={{ margin: '0 0 18px', fontWeight: '800', color: '#111', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <MapPin size={18} color="#A51C1C" /> Adresse de livraison
            </h3>

            {addresses.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '14px' }}>
                {addresses.map(addr => (
                  <label key={addr.id} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', borderRadius: '12px', border: `2px solid ${selectedAddress === String(addr.id) ? '#A51C1C' : '#e5e7eb'}`, cursor: 'pointer', transition: '0.2s' }}>
                    <input type="radio" name="address" value={String(addr.id)} checked={selectedAddress === String(addr.id)}
                      onChange={() => { setSelectedAddress(String(addr.id)); setCustomAddress(''); }} style={{ display: 'none' }} />
                    <div style={{ width: '18px', height: '18px', borderRadius: '50%', border: `2px solid ${selectedAddress === String(addr.id) ? '#A51C1C' : '#ccc'}`, background: selectedAddress === String(addr.id) ? '#A51C1C' : '#fff', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {selectedAddress === String(addr.id) && <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#fff' }} />}
                    </div>
                    <div>
                      <p style={{ margin: 0, fontWeight: '700', fontSize: '13px', color: '#111' }}>{addr.label}</p>
                      <p style={{ margin: '2px 0 0', color: '#888', fontSize: '12px' }}>{addr.address}</p>
                    </div>
                  </label>
                ))}
                <label style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', borderRadius: '12px', border: `2px solid ${!selectedAddress ? '#A51C1C' : '#e5e7eb'}`, cursor: 'pointer' }}>
                  <input type="radio" name="address" value="" checked={!selectedAddress}
                    onChange={() => setSelectedAddress('')} style={{ display: 'none' }} />
                  <div style={{ width: '18px', height: '18px', borderRadius: '50%', border: `2px solid ${!selectedAddress ? '#A51C1C' : '#ccc'}`, background: !selectedAddress ? '#A51C1C' : '#fff', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {!selectedAddress && <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#fff' }} />}
                  </div>
                  <span style={{ fontWeight: '700', fontSize: '13px', color: '#111' }}>Nouvelle adresse</span>
                </label>
              </div>
            )}

            {(!selectedAddress || addresses.length === 0) && (
              <input style={inputStyle} placeholder="Entrez votre adresse de livraison *"
                value={customAddress} onChange={e => setCustomAddress(e.target.value)} />
            )}

            <div style={{ marginTop: '14px' }}>
              <label style={{ fontSize: '12px', fontWeight: '700', color: '#888', marginBottom: '6px', display: 'block', textTransform: 'uppercase' }}>
                Heure de livraison souhaitée (optionnel)
              </label>
              <input type="datetime-local" style={inputStyle} value={deliveryTime}
                onChange={e => setDeliveryTime(e.target.value)}
                min={new Date().toISOString().slice(0, 16)} />
            </div>
          </div>

          {/* Payment method */}
          <div style={{ background: '#fff', borderRadius: '20px', padding: '24px', boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
            <h3 style={{ margin: '0 0 18px', fontWeight: '800', color: '#111', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <CreditCard size={18} color="#A51C1C" /> Mode de paiement
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              {[
                { value: 'cash', icon: <Banknote size={22} />, label: 'Cash à la livraison' },
                { value: 'card', icon: <CreditCard size={22} />, label: 'Carte bancaire' },
              ].map(opt => (
                <button key={opt.value} onClick={() => setPaymentMethod(opt.value)} style={{
                  padding: '16px', borderRadius: '14px', border: `2px solid ${paymentMethod === opt.value ? '#A51C1C' : '#e5e7eb'}`,
                  background: paymentMethod === opt.value ? '#fff0f0' : '#fafafa',
                  cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px',
                  color: paymentMethod === opt.value ? '#A51C1C' : '#666', transition: '0.2s',
                }}>
                  {opt.icon}
                  <span style={{ fontSize: '13px', fontWeight: '700' }}>{opt.label}</span>
                </button>
              ))}
            </div>
            {paymentMethod === 'card' && (
              <div style={{ marginTop: '12px', padding: '12px 16px', background: '#eff6ff', borderRadius: '12px', fontSize: '13px', color: '#1d4ed8' }}>
                💳 Le paiement par carte sera traité via Stripe de manière sécurisée.
              </div>
            )}
          </div>

          {/* Note */}
          <div style={{ background: '#fff', borderRadius: '20px', padding: '24px', boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
            <h3 style={{ margin: '0 0 14px', fontWeight: '800', color: '#111' }}>Note pour le restaurant (optionnel)</h3>
            <textarea style={{ ...inputStyle, resize: 'vertical', minHeight: '70px' }}
              placeholder="Ex: Pas d'oignons, sans gluten..."
              value={note} onChange={e => setNote(e.target.value)} />
          </div>
        </div>

        {/* RIGHT: Summary */}
        <div style={{ position: 'sticky', top: '80px' }}>
          <div style={{ background: '#fff', borderRadius: '20px', padding: '24px', boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
            <h3 style={{ margin: '0 0 20px', fontWeight: '800', color: '#111' }}>Récapitulatif</h3>

            {/* Coupon */}
            <div style={{ marginBottom: '20px' }}>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input style={{ ...inputStyle, flex: 1 }} placeholder="Code promo"
                  value={couponCode} onChange={e => { setCouponCode(e.target.value.toUpperCase()); setCouponError(''); setCoupon(null); }}
                  onKeyDown={e => e.key === 'Enter' && applyCoupon()} />
                <button onClick={applyCoupon} disabled={couponLoading}
                  style={{ background: '#111', color: '#fff', border: 'none', padding: '0 16px', borderRadius: '12px', fontWeight: '700', cursor: 'pointer', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Tag size={14} /> OK
                </button>
              </div>
              {couponError && <p style={{ margin: '6px 0 0', color: '#b91c1c', fontSize: '12px', fontWeight: '600' }}>{couponError}</p>}
              {coupon && (
                <div style={{ marginTop: '8px', background: '#f0fdf4', border: '1px solid #86efac', borderRadius: '10px', padding: '10px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <p style={{ margin: 0, fontSize: '13px', fontWeight: '700', color: '#15803d' }}>✅ {coupon.code}</p>
                    <p style={{ margin: '2px 0 0', fontSize: '12px', color: '#15803d' }}>−{coupon.discount_amount} MAD</p>
                  </div>
                  <button onClick={() => { setCoupon(null); setCouponCode(''); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#888' }}>
                    <X size={16} />
                  </button>
                </div>
              )}
            </div>

            {/* Price breakdown */}
            <div style={{ borderTop: '1px solid #f0f0f0', paddingTop: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                <span style={{ color: '#666', fontSize: '14px' }}>Sous-total</span>
                <span style={{ fontWeight: '700' }}>{total.toFixed(2)} MAD</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                <span style={{ color: '#666', fontSize: '14px' }}>Frais de livraison</span>
                <span style={{ fontWeight: '700', color: '#22c55e' }}>Gratuit</span>
              </div>
              {discount > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                  <span style={{ color: '#22c55e', fontSize: '14px', fontWeight: '600' }}>Réduction</span>
                  <span style={{ fontWeight: '700', color: '#22c55e' }}>−{discount.toFixed(2)} MAD</span>
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '12px', borderTop: '2px solid #f0f0f0' }}>
                <span style={{ fontWeight: '900', fontSize: '16px' }}>Total</span>
                <span style={{ fontWeight: '900', fontSize: '18px', color: '#A51C1C' }}>{finalTotal.toFixed(2)} MAD</span>
              </div>
            </div>

            {error && (
              <div style={{ marginTop: '14px', background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: '12px', padding: '12px', color: '#b91c1c', fontSize: '13px', fontWeight: '600' }}>
                {error}
              </div>
            )}

            <button onClick={placeOrder} disabled={placing || cart.length === 0}
              style={{
                width: '100%', marginTop: '20px', padding: '18px', borderRadius: '16px',
                border: 'none', background: placing ? '#c97a7a' : '#A51C1C',
                color: '#fff', fontWeight: '800', fontSize: '16px',
                cursor: placing ? 'not-allowed' : 'pointer',
                boxShadow: '0 8px 25px rgba(165,28,28,0.3)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
              }}>
              {placing ? 'Traitement en cours...' : <><Check size={18} /> Confirmer la commande</>}
            </button>

            <p style={{ textAlign: 'center', color: '#aaa', fontSize: '12px', marginTop: '12px' }}>
              En commandant, vous acceptez nos <a href="#" style={{ color: '#A51C1C' }}>CGU</a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
