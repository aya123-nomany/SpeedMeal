import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import {
  Store, ShoppingBag, BarChart2, LogOut, Plus, Edit3,
  Trash2, Check, X, Clock, ChevronRight, Home,
  TrendingUp, Star, Package, ToggleLeft, ToggleRight, Bell
} from 'lucide-react';
import { Bar, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS, CategoryScale, LinearScale, BarElement,
  ArcElement, Title, Tooltip, Legend
} from 'chart.js';
import logoUrl from '../assets/logo.png';

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Title, Tooltip, Legend);

const API = 'http://localhost:5000/api';

const statusColors = {
  pending:    { bg: '#fff7ed', color: '#c2410c', label: 'En attente' },
  preparing:  { bg: '#fefce8', color: '#a16207', label: 'En préparation' },
  on_the_way: { bg: '#eff6ff', color: '#1d4ed8', label: 'En route' },
  delivered:  { bg: '#f0fdf4', color: '#15803d', label: 'Livré' },
  cancelled:  { bg: '#fef2f2', color: '#b91c1c', label: 'Annulé' },
};

const inputStyle = {
  width: '100%', padding: '12px 16px', borderRadius: '10px',
  border: '1.5px solid #e5e7eb', fontSize: '14px', outline: 'none',
  background: '#fafafa', boxSizing: 'border-box',
};

export default function RestaurantDashboard() {
  const [tab, setTab] = useState('orders');
  const [restaurant, setRestaurant] = useState(null);
  const [orders, setOrders] = useState([]);
  const [menu, setMenu] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showItemForm, setShowItemForm] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [showRestaurantForm, setShowRestaurantForm] = useState(false);
  const [itemForm, setItemForm] = useState({ name: '', description: '', price: '', category: '', image_url: '' });
  const [restoForm, setRestoForm] = useState({});
  const [msg, setMsg] = useState('');
  const navigate = useNavigate();
  const token = localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  useEffect(() => {
    if (!token || !['restaurant', 'admin'].includes(user.role)) {
      navigate('/login');
      return;
    }
    fetchRestaurant();
  }, []);

  const headers = { Authorization: `Bearer ${token}` };

  const fetchRestaurant = async () => {
    try {
      const { data } = await axios.get(`${API}/restaurant-dashboard/my-restaurant`, { headers });
      setRestaurant(data);
      if (data) {
        setRestoForm({ name: data.name, description: data.description, address: data.address, city: data.city, cuisine: data.cuisine, image_url: data.image_url });
        fetchOrders(data.id);
        fetchMenu(data.id);
        fetchStats(data.id);
      }
    } catch { navigate('/login'); }
  };

  const fetchOrders = async (id) => {
    setLoading(true);
    try {
      const { data } = await axios.get(`${API}/restaurant-dashboard/${id}/orders`, { headers });
      setOrders(data);
    } catch { setOrders([]); }
    setLoading(false);
  };

  const fetchMenu = async (id) => {
    try {
      const { data } = await axios.get(`${API}/restaurant-dashboard/${id}/menu`, { headers });
      setMenu(data);
    } catch { setMenu([]); }
  };

  const fetchStats = async (id) => {
    try {
      const { data } = await axios.get(`${API}/restaurant-dashboard/${id}/stats`, { headers });
      setStats(data);
    } catch { setStats(null); }
  };

  const handleOrderStatus = async (orderId, status) => {
    try {
      await axios.put(`${API}/restaurant-dashboard/${restaurant.id}/orders/${orderId}/status`, { status }, { headers });
      fetchOrders(restaurant.id);
      if (status === 'preparing') fetchStats(restaurant.id);
    } catch (err) {
      alert(err.response?.data?.message || 'Error');
    }
  };

  const handleToggleStatus = async () => {
    try {
      await axios.put(`${API}/restaurant-dashboard/${restaurant.id}/toggle-status`, {}, { headers });
      setRestaurant(r => ({ ...r, isOpen: !r.isOpen }));
    } catch (err) {
      alert('Error toggling status');
    }
  };

  const handleSaveItem = async (e) => {
    e.preventDefault();
    try {
      if (editItem) {
        await axios.put(`${API}/restaurant-dashboard/${restaurant.id}/menu/${editItem.id}`, itemForm, { headers });
        setMsg('Item updated!');
      } else {
        await axios.post(`${API}/restaurant-dashboard/${restaurant.id}/menu`, itemForm, { headers });
        setMsg('Item added!');
      }
      setShowItemForm(false);
      setEditItem(null);
      setItemForm({ name: '', description: '', price: '', category: '', image_url: '' });
      fetchMenu(restaurant.id);
    } catch (err) {
      setMsg(err.response?.data?.message || 'Error');
    }
    setTimeout(() => setMsg(''), 3000);
  };

  const handleDeleteItem = async (itemId) => {
    if (!window.confirm('Delete this item?')) return;
    await axios.delete(`${API}/restaurant-dashboard/${restaurant.id}/menu/${itemId}`, { headers });
    fetchMenu(restaurant.id);
  };

  const handleSaveRestaurant = async (e) => {
    e.preventDefault();
    try {
      await axios.put(`${API}/restaurant-dashboard/${restaurant.id}`, restoForm, { headers });
      setMsg('Restaurant updated!');
      fetchRestaurant();
      setShowRestaurantForm(false);
    } catch (err) {
      setMsg('Error updating restaurant');
    }
    setTimeout(() => setMsg(''), 3000);
  };

  const handleCreateRestaurant = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API}/restaurant-dashboard/create`, restoForm, { headers });
      setMsg('Restaurant created!');
      fetchRestaurant();
      setShowRestaurantForm(false);
    } catch (err) {
      setMsg(err.response?.data?.message || 'Error');
    }
    setTimeout(() => setMsg(''), 3000);
  };

  const pendingOrders = orders.filter(o => o.status === 'pending');
  const activeOrders = orders.filter(o => ['preparing', 'on_the_way'].includes(o.status));

  const TABS = [
    { id: 'orders', label: 'Commandes', icon: <ShoppingBag size={16} /> },
    { id: 'menu',   label: 'Menu',      icon: <Store size={16} /> },
    { id: 'stats',  label: 'Stats',     icon: <BarChart2 size={16} /> },
  ];

  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const monthlyData = stats?.monthly || [];
  const revenueByMonth = {
    labels: months,
    datasets: [{
      label: 'Revenus (MAD)',
      data: months.map((_, i) => {
        const m = monthlyData.find(x => x.month === i + 1);
        return m ? Number(m.revenue) : 0;
      }),
      backgroundColor: '#A51C1C',
      borderRadius: 8,
    }],
  };

  return (
    <div style={{ minHeight: '100vh', background: '#f4f5f7', display: 'flex' }}>
      {/* SIDEBAR */}
      <div style={{ width: '240px', background: '#111', minHeight: '100vh', padding: '24px 16px', display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <img src={logoUrl} alt="SpeedMeal" style={{ height: '60px', objectFit: 'contain' }} />
          <p style={{ margin: '6px 0 0', color: '#888', fontSize: '11px', fontWeight: '600', letterSpacing: '1px', textTransform: 'uppercase' }}>Restaurant</p>
        </div>

        {restaurant && (
          <div style={{ background: '#1a1a1a', borderRadius: '12px', padding: '14px', marginBottom: '20px' }}>
            <p style={{ margin: 0, color: '#fff', fontWeight: '700', fontSize: '13px' }}>{restaurant.name}</p>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '8px' }}>
              <span style={{
                padding: '3px 10px', borderRadius: '999px', fontSize: '11px', fontWeight: '700',
                background: restaurant.isOpen ? '#dcfce7' : '#fee2e2',
                color: restaurant.isOpen ? '#15803d' : '#b91c1c'
              }}>
                {restaurant.isOpen ? 'Ouvert' : 'Fermé'}
              </span>
              <button onClick={handleToggleStatus} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#888', display: 'flex' }}>
                {restaurant.isOpen ? <ToggleRight size={22} color="#22c55e" /> : <ToggleLeft size={22} color="#888" />}
              </button>
            </div>
          </div>
        )}

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
              {t.id === 'orders' && pendingOrders.length > 0 && (
                <span style={{ marginLeft: 'auto', background: '#ef4444', color: '#fff', borderRadius: '999px', fontSize: '10px', fontWeight: '800', padding: '2px 7px' }}>
                  {pendingOrders.length}
                </span>
              )}
            </button>
          ))}

          {restaurant && (
            <button onClick={() => { setShowRestaurantForm(true); }} style={{
              display: 'flex', alignItems: 'center', gap: '10px',
              padding: '12px 14px', borderRadius: '10px', border: 'none', cursor: 'pointer',
              fontWeight: '700', fontSize: '13px', textAlign: 'left',
              background: 'transparent', color: '#888',
            }}>
              <Edit3 size={16} /> Modifier info
            </button>
          )}
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
        {msg && (
          <div style={{ background: '#f0fdf4', border: '1px solid #86efac', color: '#15803d', padding: '12px 20px', borderRadius: '12px', marginBottom: '20px', fontWeight: '700' }}>
            {msg}
          </div>
        )}

        {/* No restaurant yet */}
        {!restaurant && (
          <div style={{ background: '#fff', borderRadius: '24px', padding: '60px', textAlign: 'center', boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
            <Store size={60} color="#ddd" style={{ marginBottom: '20px' }} />
            <h2 style={{ margin: '0 0 12px', color: '#111', fontWeight: '900' }}>Créez votre restaurant</h2>
            <p style={{ color: '#888', marginBottom: '28px' }}>Vous n'avez pas encore de restaurant enregistré.</p>
            <button onClick={() => setShowRestaurantForm(true)} style={{ background: '#A51C1C', color: '#fff', border: 'none', padding: '14px 32px', borderRadius: '999px', fontWeight: '800', cursor: 'pointer', fontSize: '15px' }}>
              + Créer mon restaurant
            </button>
          </div>
        )}

        {restaurant && (
          <AnimatePresence mode="wait">
            {/* ORDERS TAB */}
            {tab === 'orders' && (
              <motion.div key="orders" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
                  <h2 style={{ margin: 0, fontWeight: '900', fontSize: '22px', color: '#111' }}>Commandes</h2>
                  <div style={{ display: 'flex', gap: '12px' }}>
                    <div style={{ background: '#fff7ed', color: '#c2410c', padding: '8px 16px', borderRadius: '999px', fontSize: '13px', fontWeight: '700' }}>
                      {pendingOrders.length} en attente
                    </div>
                    <div style={{ background: '#eff6ff', color: '#1d4ed8', padding: '8px 16px', borderRadius: '999px', fontSize: '13px', fontWeight: '700' }}>
                      {activeOrders.length} actives
                    </div>
                  </div>
                </div>

                {loading ? (
                  <p style={{ color: '#aaa', textAlign: 'center' }}>Chargement...</p>
                ) : orders.length === 0 ? (
                  <div style={{ background: '#fff', borderRadius: '20px', padding: '60px', textAlign: 'center' }}>
                    <ShoppingBag size={40} color="#ddd" />
                    <p style={{ color: '#aaa', marginTop: '12px' }}>Aucune commande pour l'instant</p>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    {orders.map(order => (
                      <motion.div key={order.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                        style={{ background: '#fff', borderRadius: '16px', padding: '20px 24px', boxShadow: '0 2px 12px rgba(0,0,0,0.04)', border: `2px solid ${order.status === 'pending' ? '#fed7aa' : '#f0f0f0'}` }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
                          <div>
                            <p style={{ margin: 0, fontWeight: '800', color: '#111', fontSize: '15px' }}>
                              Commande #{order.id} — <span style={{ color: '#A51C1C' }}>{Number(order.total_price).toFixed(2)} MAD</span>
                            </p>
                            <p style={{ margin: '4px 0', color: '#666', fontSize: '13px' }}>👤 {order.client_name} {order.client_phone && `· ${order.client_phone}`}</p>
                            <p style={{ margin: '4px 0', color: '#888', fontSize: '12px' }}>📍 {order.address}</p>
                            {order.items?.map(item => (
                              <span key={item.id} style={{ display: 'inline-block', background: '#f9f9f9', border: '1px solid #eee', borderRadius: '6px', padding: '3px 10px', fontSize: '12px', margin: '2px', color: '#555' }}>
                                {item.quantity}× {item.item_name}
                              </span>
                            ))}
                            {order.note && <p style={{ margin: '6px 0 0', color: '#888', fontSize: '12px', fontStyle: 'italic' }}>Note: {order.note}</p>}
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px' }}>
                            <span style={{ background: statusColors[order.status]?.bg, color: statusColors[order.status]?.color, padding: '5px 14px', borderRadius: '999px', fontSize: '12px', fontWeight: '700' }}>
                              {statusColors[order.status]?.label || order.status}
                            </span>
                            <p style={{ margin: 0, color: '#bbb', fontSize: '12px' }}>
                              {new Date(order.created_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                            </p>
                            {order.status === 'pending' && (
                              <div style={{ display: 'flex', gap: '8px' }}>
                                <button onClick={() => handleOrderStatus(order.id, 'preparing')}
                                  style={{ background: '#f0fdf4', color: '#15803d', border: '1px solid #86efac', padding: '8px 14px', borderRadius: '8px', fontWeight: '700', fontSize: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                  <Check size={14} /> Accepter
                                </button>
                                <button onClick={() => handleOrderStatus(order.id, 'cancelled')}
                                  style={{ background: '#fef2f2', color: '#b91c1c', border: '1px solid #fca5a5', padding: '8px 14px', borderRadius: '8px', fontWeight: '700', fontSize: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                  <X size={14} /> Refuser
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </motion.div>
            )}

            {/* MENU TAB */}
            {tab === 'menu' && (
              <motion.div key="menu" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
                  <h2 style={{ margin: 0, fontWeight: '900', fontSize: '22px', color: '#111' }}>Menu ({menu.length} plats)</h2>
                  <button onClick={() => { setEditItem(null); setItemForm({ name: '', description: '', price: '', category: '', image_url: '' }); setShowItemForm(true); }}
                    style={{ background: '#A51C1C', color: '#fff', border: 'none', padding: '12px 20px', borderRadius: '999px', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px' }}>
                    <Plus size={16} /> Ajouter un plat
                  </button>
                </div>

                {menu.length === 0 ? (
                  <div style={{ background: '#fff', borderRadius: '20px', padding: '60px', textAlign: 'center' }}>
                    <p style={{ color: '#aaa' }}>Aucun plat dans votre menu</p>
                  </div>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
                    {menu.map(item => (
                      <motion.div key={item.id} whileHover={{ y: -3 }}
                        style={{ background: '#fff', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 2px 12px rgba(0,0,0,0.05)', opacity: item.isAvailable ? 1 : 0.6 }}>
                        {item.image_url && (
                          <img src={item.image_url} alt={item.name} style={{ width: '100%', height: '140px', objectFit: 'cover' }} />
                        )}
                        <div style={{ padding: '16px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <div>
                              <p style={{ margin: 0, fontWeight: '800', fontSize: '15px', color: '#111' }}>{item.name}</p>
                              <p style={{ margin: '3px 0', color: '#888', fontSize: '12px' }}>{item.category}</p>
                              <p style={{ margin: '6px 0 0', color: '#A51C1C', fontWeight: '900', fontSize: '16px' }}>{Number(item.price).toFixed(2)} MAD</p>
                            </div>
                            <div style={{ display: 'flex', gap: '6px' }}>
                              <button onClick={() => { setEditItem(item); setItemForm({ name: item.name, description: item.description || '', price: item.price, category: item.category, image_url: item.image_url || '', isAvailable: item.isAvailable }); setShowItemForm(true); }}
                                style={{ background: '#f0f4ff', color: '#3b82f6', border: 'none', width: '32px', height: '32px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <Edit3 size={14} />
                              </button>
                              <button onClick={() => handleDeleteItem(item.id)}
                                style={{ background: '#fef2f2', color: '#b91c1c', border: 'none', width: '32px', height: '32px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </div>
                          {item.description && <p style={{ margin: '8px 0 0', color: '#aaa', fontSize: '12px', lineHeight: 1.5 }}>{item.description.substring(0, 60)}...</p>}
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </motion.div>
            )}

            {/* STATS TAB */}
            {tab === 'stats' && stats && (
              <motion.div key="stats" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                <h2 style={{ margin: '0 0 24px', fontWeight: '900', fontSize: '22px', color: '#111' }}>Statistiques</h2>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '28px' }}>
                  {[
                    { label: 'Total commandes', value: stats.totalOrders, color: '#6366f1' },
                    { label: 'En attente', value: stats.pendingOrders, color: '#f97316' },
                    { label: 'Revenus (MAD)', value: stats.revenue, color: '#A51C1C' },
                    { label: 'Note moyenne', value: `★ ${stats.avgRating}`, color: '#f59e0b' },
                  ].map((s, i) => (
                    <div key={i} style={{ background: '#fff', borderRadius: '16px', padding: '24px', boxShadow: '0 2px 12px rgba(0,0,0,0.05)' }}>
                      <p style={{ margin: 0, color: '#888', fontSize: '12px', fontWeight: '600' }}>{s.label}</p>
                      <p style={{ margin: '6px 0 0', fontSize: '24px', fontWeight: '900', color: s.color }}>{s.value}</p>
                    </div>
                  ))}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                  <div style={{ background: '#fff', borderRadius: '20px', padding: '24px', boxShadow: '0 2px 12px rgba(0,0,0,0.05)' }}>
                    <p style={{ margin: '0 0 16px', fontWeight: '800', color: '#111' }}>Revenus mensuels (MAD)</p>
                    <Bar data={revenueByMonth} options={{ responsive: true, plugins: { legend: { display: false } }, scales: { x: { grid: { display: false } }, y: { beginAtZero: true } } }} />
                  </div>

                  {stats.topItems?.length > 0 && (
                    <div style={{ background: '#fff', borderRadius: '20px', padding: '24px', boxShadow: '0 2px 12px rgba(0,0,0,0.05)' }}>
                      <p style={{ margin: '0 0 16px', fontWeight: '800', color: '#111' }}>Top plats vendus</p>
                      {stats.topItems.map((item, i) => (
                        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: i < stats.topItems.length - 1 ? '1px solid #f5f5f5' : 'none' }}>
                          <span style={{ fontSize: '14px', color: '#333', fontWeight: '600' }}>{item.name}</span>
                          <span style={{ fontSize: '14px', color: '#A51C1C', fontWeight: '800' }}>{item.total_sold} vendus</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        )}
      </div>

      {/* ITEM FORM MODAL */}
      <AnimatePresence>
        {showItemForm && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setShowItemForm(false)}
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 3000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
            <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9 }}
              onClick={e => e.stopPropagation()}
              style={{ background: '#fff', borderRadius: '24px', padding: '36px', width: '100%', maxWidth: '500px' }}>
              <h3 style={{ margin: '0 0 24px', fontWeight: '900', fontSize: '20px' }}>{editItem ? 'Modifier' : 'Ajouter'} un plat</h3>
              <form onSubmit={handleSaveItem} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <input style={inputStyle} placeholder="Nom du plat *" value={itemForm.name} onChange={e => setItemForm({ ...itemForm, name: e.target.value })} required />
                <input style={inputStyle} placeholder="Description" value={itemForm.description} onChange={e => setItemForm({ ...itemForm, description: e.target.value })} />
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                  <input style={inputStyle} placeholder="Prix (MAD) *" type="number" step="0.01" value={itemForm.price} onChange={e => setItemForm({ ...itemForm, price: e.target.value })} required />
                  <input style={inputStyle} placeholder="Catégorie" value={itemForm.category} onChange={e => setItemForm({ ...itemForm, category: e.target.value })} />
                </div>
                <input style={inputStyle} placeholder="URL image" value={itemForm.image_url} onChange={e => setItemForm({ ...itemForm, image_url: e.target.value })} />
                {editItem && (
                  <label style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '14px', fontWeight: '600', cursor: 'pointer' }}>
                    <input type="checkbox" checked={itemForm.isAvailable} onChange={e => setItemForm({ ...itemForm, isAvailable: e.target.checked })} />
                    Disponible
                  </label>
                )}
                <div style={{ display: 'flex', gap: '10px', marginTop: '6px' }}>
                  <button type="submit" style={{ flex: 1, background: '#A51C1C', color: '#fff', border: 'none', padding: '14px', borderRadius: '12px', fontWeight: '800', cursor: 'pointer', fontSize: '15px' }}>
                    {editItem ? 'Mettre à jour' : 'Ajouter'}
                  </button>
                  <button type="button" onClick={() => setShowItemForm(false)} style={{ padding: '14px 20px', borderRadius: '12px', border: '1px solid #e5e7eb', background: '#fff', cursor: 'pointer', fontWeight: '700' }}>
                    Annuler
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* RESTAURANT FORM MODAL */}
      <AnimatePresence>
        {showRestaurantForm && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setShowRestaurantForm(false)}
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 3000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
            <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9 }}
              onClick={e => e.stopPropagation()}
              style={{ background: '#fff', borderRadius: '24px', padding: '36px', width: '100%', maxWidth: '520px', maxHeight: '90vh', overflowY: 'auto' }}>
              <h3 style={{ margin: '0 0 24px', fontWeight: '900', fontSize: '20px' }}>{restaurant ? 'Modifier' : 'Créer'} le restaurant</h3>
              <form onSubmit={restaurant ? handleSaveRestaurant : handleCreateRestaurant} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <input style={inputStyle} placeholder="Nom du restaurant *" value={restoForm.name || ''} onChange={e => setRestoForm({ ...restoForm, name: e.target.value })} required />
                <textarea style={{ ...inputStyle, resize: 'vertical', minHeight: '80px' }} placeholder="Description" value={restoForm.description || ''} onChange={e => setRestoForm({ ...restoForm, description: e.target.value })} />
                <input style={inputStyle} placeholder="Adresse *" value={restoForm.address || ''} onChange={e => setRestoForm({ ...restoForm, address: e.target.value })} required />
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                  <input style={inputStyle} placeholder="Ville" value={restoForm.city || ''} onChange={e => setRestoForm({ ...restoForm, city: e.target.value })} />
                  <input style={inputStyle} placeholder="Cuisine (ex: Pizza)" value={restoForm.cuisine || ''} onChange={e => setRestoForm({ ...restoForm, cuisine: e.target.value })} />
                </div>
                <input style={inputStyle} placeholder="URL image" value={restoForm.image_url || ''} onChange={e => setRestoForm({ ...restoForm, image_url: e.target.value })} />
                <div style={{ display: 'flex', gap: '10px', marginTop: '6px' }}>
                  <button type="submit" style={{ flex: 1, background: '#A51C1C', color: '#fff', border: 'none', padding: '14px', borderRadius: '12px', fontWeight: '800', cursor: 'pointer', fontSize: '15px' }}>
                    {restaurant ? 'Mettre à jour' : 'Créer'}
                  </button>
                  <button type="button" onClick={() => setShowRestaurantForm(false)} style={{ padding: '14px 20px', borderRadius: '12px', border: '1px solid #e5e7eb', background: '#fff', cursor: 'pointer', fontWeight: '700' }}>
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
