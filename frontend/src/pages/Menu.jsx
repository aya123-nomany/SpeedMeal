import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Star, Flame, Pizza, Bird, Coffee, Utensils, Fish, IceCream,
  ShoppingCart, Heart, Search, Plus, Minus, X, MapPin, ChevronRight,
  Tag, Globe, Leaf, Calendar, ArrowLeft, Check,
} from 'lucide-react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import axios from 'axios';
import SectionTitle from '../components/SectionTitle';
import { useCart } from '../context/CartContext';
import {
  searchOpenMenu, getDeals, normalizeRestaurant, normalizeMenuItem,
} from '../services/openMenuAPI';
import logoUrl from '../assets/logo.png';

const API = 'http://localhost:5000/api';

// ── Cart Button ──────────────────────────────────────────────────────────────
const CartButton = ({ count, total, onClick }) => {
  if (count === 0) return null;
  return (
    <motion.button initial={{ y: 80 }} animate={{ y: 0 }} onClick={onClick}
      style={{
        position: 'fixed', bottom: '30px', left: '50%', transform: 'translateX(-50%)',
        background: '#111', color: '#fff', border: 'none', borderRadius: '999px',
        padding: '16px 32px', fontWeight: '800', fontSize: '15px', cursor: 'pointer',
        display: 'flex', alignItems: 'center', gap: '14px', zIndex: 1000,
        boxShadow: '0 8px 30px rgba(0,0,0,0.3)', minWidth: '280px', justifyContent: 'space-between',
      }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <div style={{ background: '#A51C1C', borderRadius: '50%', width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', fontWeight: '900' }}>
          {count}
        </div>
        <span>Voir mon panier</span>
      </div>
      <span>{total.toFixed(2)} MAD</span>
    </motion.button>
  );
};

// ── Restaurant Card (SpeedMeal DB) ───────────────────────────────────────────
const RestaurantCardDB = ({ restaurant, onSelect }) => (
  <motion.div whileHover={{ y: -6 }} onClick={() => onSelect(restaurant)}
    style={{ background: '#fff', borderRadius: '20px', overflow: 'hidden', cursor: 'pointer', boxShadow: '0 4px 20px rgba(0,0,0,0.06)', border: '1px solid #f0f0f0' }}>
    <div style={{ height: '180px', overflow: 'hidden', position: 'relative', background: '#f5f5f5' }}>
      {restaurant.image_url
        ? <img src={restaurant.image_url} alt={restaurant.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#A51C1C20' }}><Utensils size={40} color="#A51C1C" style={{ opacity: 0.4 }} /></div>
      }
      <span style={{ position: 'absolute', top: '10px', right: '10px', background: restaurant.isOpen ? '#dcfce7' : '#fee2e2', color: restaurant.isOpen ? '#15803d' : '#b91c1c', padding: '4px 10px', borderRadius: '999px', fontSize: '11px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '5px' }}>
        <span style={{ width: 7, height: 7, borderRadius: '50%', background: restaurant.isOpen ? '#15803d' : '#b91c1c', display: 'inline-block', flexShrink: 0 }} />
        {restaurant.isOpen ? 'Ouvert' : 'Fermé'}
      </span>
    </div>
    <div style={{ padding: '16px 20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '800', color: '#111' }}>{restaurant.name}</h3>
          <p style={{ margin: '4px 0', color: '#888', fontSize: '13px' }}>{restaurant.cuisine} · {restaurant.city}</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', background: '#fff7ed', padding: '4px 8px', borderRadius: '8px' }}>
          <Star size={12} fill="#f59e0b" color="#f59e0b" />
          <span style={{ fontSize: '12px', fontWeight: '800', color: '#92400e' }}>{Number(restaurant.rating || 0).toFixed(1)}</span>
        </div>
      </div>
      {restaurant.address && (
        <p style={{ margin: '8px 0 0', color: '#bbb', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}>
          <MapPin size={11} /> {restaurant.address.substring(0, 40)}
        </p>
      )}
    </div>
  </motion.div>
);

// ── Restaurant Card (OpenMenu) ───────────────────────────────────────────────
const CUISINE_ICON = { american: Flame, italian: Pizza, mexican: Utensils, chinese: Utensils, japanese: Fish, thai: Utensils, indian: Utensils, french: Coffee, seafood: Fish, pizza: Pizza, burger: Flame, default: Utensils };
const getCuisineIcon = (c = '') => { const key = c.toLowerCase(); return Object.entries(CUISINE_ICON).find(([k]) => key.includes(k))?.[1] || CUISINE_ICON.default; };
const CARD_BG = ['#fff4ee','#f0fdf4','#eff6ff','#fdf4ff','#fffbeb','#f0f9ff'];

const RestaurantCardOM = ({ restaurant, index, onSelect }) => (
  <motion.div whileHover={{ y: -6 }} onClick={() => onSelect(restaurant)}
    style={{ background: '#fff', borderRadius: '20px', overflow: 'hidden', cursor: 'pointer', boxShadow: '0 4px 20px rgba(0,0,0,0.06)', border: '1px solid #f0f0f0' }}>
    <div style={{ height: '180px', background: CARD_BG[index % CARD_BG.length], display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden' }}>
      {restaurant.image_url
        ? <img src={restaurant.image_url} alt={restaurant.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={e => { e.target.style.display = 'none'; }} />
        : (() => { const Icon = getCuisineIcon(restaurant.cuisine); return <Icon size={52} color={CARD_BG[index % CARD_BG.length] === '#fff4ee' ? '#F97316' : '#A51C1C'} style={{ opacity: 0.35 }} />; })()
      }
      {restaurant.deals_count > 0 && (
        <div style={{ position: 'absolute', top: '10px', right: '10px', background: '#A51C1C', color: '#fff', padding: '4px 10px', borderRadius: '999px', fontSize: '11px', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '4px' }}>
          <Tag size={11} /> {restaurant.deals_count} deal{restaurant.deals_count > 1 ? 's' : ''}
        </div>
      )}
      <div style={{ position: 'absolute', top: '10px', left: '10px', background: 'rgba(255,255,255,0.9)', padding: '3px 10px', borderRadius: '999px', fontSize: '11px', fontWeight: '700', color: '#555' }}>
        OpenMenu
      </div>
    </div>
    <div style={{ padding: '16px 20px' }}>
      <h3 style={{ margin: '0 0 4px', fontSize: '16px', fontWeight: '800', color: '#111' }}>{restaurant.name}</h3>
      <p style={{ margin: '0 0 8px', color: '#888', fontSize: '13px' }}>{restaurant.cuisine}</p>
      {restaurant.address && (
        <p style={{ margin: 0, color: '#bbb', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}>
          <MapPin size={11} /> {restaurant.address.substring(0, 40)}
        </p>
      )}
    </div>
  </motion.div>
);

// ── Menu Item Card ───────────────────────────────────────────────────────────
const MenuItemCard = ({ item, onAdd, onFavorite, isLoggedIn, source }) => {
  const [added, setAdded] = useState(false);
  const handleAdd = () => { onAdd(item); setAdded(true); setTimeout(() => setAdded(false), 1500); };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} whileHover={{ y: -4 }}
      style={{ background: '#fff', borderRadius: '20px', overflow: 'hidden', boxShadow: '0 4px 20px rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column' }}>
      <div style={{ height: '180px', overflow: 'hidden', position: 'relative', background: '#f5f5f5' }}>
        {item.image_url
          ? <img src={item.image_url} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          : <div style={{ width: '100%', height: '100%', background: 'linear-gradient(135deg, #fff0f0, #fce7e7)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Utensils size={44} color="#A51C1C" style={{ opacity: 0.35 }} /></div>
        }
        {item.category && (
          <span style={{ position: 'absolute', top: '10px', left: '10px', background: '#A51C1C', color: '#fff', padding: '4px 10px', borderRadius: '999px', fontSize: '11px', fontWeight: '700' }}>
            {item.category}
          </span>
        )}
        {/* Dietary badges */}
        <div style={{ position: 'absolute', bottom: '8px', left: '10px', display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
          {item.vegetarian && <span style={{ background: '#dcfce7', color: '#15803d', padding: '2px 7px', borderRadius: '6px', fontSize: '10px', fontWeight: '700', display: 'inline-flex', alignItems: 'center', gap: '3px' }}><Leaf size={9} /> Végé</span>}
          {item.halal      && <span style={{ background: '#eff6ff', color: '#1d4ed8', padding: '2px 7px', borderRadius: '6px', fontSize: '10px', fontWeight: '700', display: 'inline-flex', alignItems: 'center', gap: '3px' }}><Check size={9} /> Halal</span>}
          {item.gluten_free && <span style={{ background: '#fffbeb', color: '#92400e', padding: '2px 7px', borderRadius: '6px', fontSize: '10px', fontWeight: '700', display: 'inline-flex', alignItems: 'center', gap: '3px' }}><Leaf size={9} /> Sans gluten</span>}
          {item.special    && <span style={{ background: '#fef3c7', color: '#b45309', padding: '2px 7px', borderRadius: '6px', fontSize: '10px', fontWeight: '700', display: 'inline-flex', alignItems: 'center', gap: '3px' }}><Star size={9} /> Spécial</span>}
        </div>
        {isLoggedIn && source !== 'openmenu' && (
          <button onClick={() => onFavorite(item.id)} style={{ position: 'absolute', top: '10px', right: '10px', background: 'rgba(255,255,255,0.9)', border: 'none', borderRadius: '50%', padding: '8px', cursor: 'pointer', display: 'flex' }}>
            <Heart size={16} color="#A51C1C" />
          </button>
        )}
      </div>
      <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', flex: 1 }}>
        <h3 style={{ margin: '0 0 6px', fontSize: '15px', fontWeight: '800', color: '#111' }}>{item.name}</h3>
        {item.description && (
          <p style={{ margin: '0 0 12px', color: '#888', fontSize: '13px', lineHeight: 1.5, flex: 1,
            display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
            {item.description}
          </p>
        )}
        {/* Sizes (OpenMenu) */}
        {item.sizes?.length > 0 && (
          <div style={{ display: 'flex', gap: '6px', marginBottom: '10px', flexWrap: 'wrap' }}>
            {item.sizes.map((s, i) => (
              <span key={i} style={{ background: '#fff0f0', color: '#A51C1C', padding: '3px 10px', borderRadius: '8px', fontSize: '11px', fontWeight: '700' }}>
                {s.menu_item_size_name}{s.menu_item_size_price ? ` $${s.menu_item_size_price}` : ''}
              </span>
            ))}
          </div>
        )}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto' }}>
          <span style={{ fontSize: '18px', fontWeight: '900', color: '#A51C1C' }}>
            {Number(item.price) > 0 ? `${Number(item.price).toFixed(2)} ${source === 'openmenu' ? '$' : 'MAD'}` : 'Prix sur place'}
          </span>
          {source !== 'openmenu' && (
            <motion.button whileTap={{ scale: 0.9 }} onClick={handleAdd}
              style={{ background: added ? '#22c55e' : '#111', color: '#fff', border: 'none', borderRadius: '12px', padding: '10px 16px', fontWeight: '800', fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', transition: 'background 0.3s' }}>
              {added ? <><Check size={14} /> Ajouté</> : <><Plus size={14} /> Ajouter</>}
            </motion.button>
          )}
        </div>
      </div>
    </motion.div>
  );
};

// ── Deal Card ────────────────────────────────────────────────────────────────
const DAYS_KEYS = ['day_sun','day_mon','day_tue','day_wed','day_thu','day_fri','day_sat'];
const DAYS_LABELS = ['Dim','Lun','Mar','Mer','Jeu','Ven','Sam'];

const DealCard = ({ deal }) => {
  const activeDays = DAYS_KEYS.map((k,i) => deal[k]==1 ? DAYS_LABELS[i] : null).filter(Boolean);
  return (
    <div style={{ background: '#fff', borderRadius: '18px', overflow: 'hidden', boxShadow: '0 4px 20px rgba(0,0,0,0.06)' }}>
      <div style={{ background: 'linear-gradient(135deg, #A51C1C, #c0392b)', padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div style={{ background: 'rgba(255,255,255,0.2)', borderRadius: '8px', padding: '8px', display: 'flex' }}>
          <Tag size={18} color="#fff" />
        </div>
        <div>
          <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '11px', fontWeight: '600', textTransform: 'uppercase', margin: 0 }}>{deal.provider || 'OpenMenu'}</p>
          <h4 style={{ color: '#fff', fontWeight: '800', fontSize: '15px', margin: '2px 0 0' }}>{deal.headline}</h4>
        </div>
      </div>
      <div style={{ padding: '14px 18px' }}>
        {deal.description && <p style={{ fontSize: '13px', color: '#666', lineHeight: 1.6, marginBottom: '10px' }}>{deal.description}</p>}
        {deal.disclaimer   && <p style={{ fontSize: '12px', color: '#bbb', fontStyle: 'italic', marginBottom: '10px' }}>* {deal.disclaimer}</p>}
        {activeDays.length > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
            <Calendar size={13} color="#A51C1C" />
            {activeDays.map(d => (
              <span key={d} style={{ background: '#fff0f0', color: '#A51C1C', padding: '2px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: '700' }}>{d}</span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// ── Cart Sidebar ─────────────────────────────────────────────────────────────
const CartSidebar = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const { cart, restaurantName, updateQuantity, removeItem, total } = useCart();
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }} onClick={onClose}
            style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.4)', zIndex:2000 }} />
          <motion.div initial={{ x:'100%' }} animate={{ x:0 }} exit={{ x:'100%' }}
            transition={{ type:'spring', damping:25, stiffness:200 }}
            style={{ position:'fixed', top:0, right:0, bottom:0, width:'360px', background:'#fff', zIndex:2001, display:'flex', flexDirection:'column', boxShadow:'-10px 0 40px rgba(0,0,0,0.1)' }}>
            <div style={{ padding:'20px 24px', borderBottom:'1px solid #f0f0f0', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
              <div>
                <h3 style={{ margin:0, fontWeight:'900', fontSize:'17px' }}>Mon panier</h3>
                {restaurantName && <p style={{ margin:'3px 0 0', color:'#888', fontSize:'13px' }}>{restaurantName}</p>}
              </div>
              <button onClick={onClose} style={{ background:'#f5f5f5', border:'none', borderRadius:'50%', padding:'10px', cursor:'pointer', display:'flex' }}>
                <X size={18} />
              </button>
            </div>
            <div style={{ flex:1, overflowY:'auto', padding:'14px 20px' }}>
              {cart.length === 0
                ? <p style={{ color:'#aaa', textAlign:'center', padding:'40px 0' }}>Panier vide</p>
                : cart.map(item => (
                    <div key={item.id} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'10px 0', borderBottom:'1px solid #f9f9f9' }}>
                      <div style={{ flex:1 }}>
                        <p style={{ margin:0, fontWeight:'700', fontSize:'14px' }}>{item.name}</p>
                        <p style={{ margin:'2px 0 0', color:'#A51C1C', fontWeight:'700', fontSize:'12px' }}>{Number(item.price).toFixed(2)} MAD</p>
                      </div>
                      <div style={{ display:'flex', alignItems:'center', gap:'8px' }}>
                        <button onClick={() => updateQuantity(item.id, item.quantity-1)} style={{ background:'#f5f5f5', border:'none', borderRadius:'6px', width:'26px', height:'26px', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}><Minus size={11} /></button>
                        <span style={{ fontWeight:'800', fontSize:'14px', minWidth:'18px', textAlign:'center' }}>{item.quantity}</span>
                        <button onClick={() => updateQuantity(item.id, item.quantity+1)} style={{ background:'#f5f5f5', border:'none', borderRadius:'6px', width:'26px', height:'26px', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}><Plus size={11} /></button>
                        <button onClick={() => removeItem(item.id)} style={{ background:'none', border:'none', cursor:'pointer', color:'#bbb' }}><X size={13} /></button>
                      </div>
                    </div>
                  ))
              }
            </div>
            {cart.length > 0 && (
              <div style={{ padding:'18px 20px', borderTop:'1px solid #f0f0f0' }}>
                <div style={{ display:'flex', justifyContent:'space-between', marginBottom:'14px' }}>
                  <span style={{ fontWeight:'900', fontSize:'15px' }}>Total</span>
                  <span style={{ fontWeight:'900', fontSize:'17px', color:'#A51C1C' }}>{total.toFixed(2)} MAD</span>
                </div>
                <button onClick={() => { onClose(); navigate('/checkout'); }}
                  style={{ width:'100%', background:'#A51C1C', color:'#fff', border:'none', padding:'15px', borderRadius:'14px', fontWeight:'800', fontSize:'14px', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:'8px' }}>
                  Commander <ChevronRight size={17} />
                </button>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

// ═══════════════════════════════════════════════════════════════════════════
// MAIN MENU PAGE
// ═══════════════════════════════════════════════════════════════════════════
export default function Menu() {
  const navigate    = useNavigate();
  const location    = useLocation();
  const token       = localStorage.getItem('token');
  const { addItem, count, total } = useCart();

  // State
  const [source, setSource]                   = useState('both');   // 'both' | 'db' | 'openmenu'
  const [dbRestaurants, setDbRestaurants]     = useState([]);
  const [omRestaurants, setOmRestaurants]     = useState([]);
  const [selectedRestaurant, setSelectedRestaurant] = useState(null);
  const [menuItems, setMenuItems]             = useState([]);
  const [deals, setDeals]                     = useState([]);
  const [activeTab, setActiveTab]             = useState('menu');   // 'menu' | 'deals'
  const [activeCategory, setActiveCategory]   = useState('all');
  const [categories, setCategories]           = useState([]);
  const [searchQuery, setSearchQuery]         = useState('');
  const [searchCategory, setSearchCategory]   = useState('');
  const [loading, setLoading]                 = useState(true);
  const [loadingMenu, setLoadingMenu]         = useState(false);
  const [cartOpen, setCartOpen]               = useState(false);
  const [omSearch, setOmSearch]               = useState('');
  const [omPage, setOmPage]                   = useState(0);
  const [omHasNext, setOmHasNext]             = useState(false);

  // On mount: check URL params (from RestaurantsSection link)
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const rsource = params.get('source');
    const rid     = params.get('restaurant');
    const rname   = params.get('name');
    if (rsource === 'openmenu' && rid) {
      // Auto-select the OpenMenu restaurant
      handleSelectOMRestaurant({ id: rid, name: decodeURIComponent(rname || ''), source: 'openmenu' });
    }
  }, []);

  useEffect(() => { fetchDbRestaurants(); fetchDbCategories(); }, []);
  useEffect(() => { fetchOmRestaurants(); }, [omSearch, omPage]);
  useEffect(() => { const t = setTimeout(fetchDbRestaurants, 400); return () => clearTimeout(t); }, [searchQuery, searchCategory]);

  // ── DB restaurants ────────────────────────────────────────────────────────
  const fetchDbRestaurants = async () => {
    setLoading(true);
    try {
      const params = {};
      if (searchCategory) params.category = searchCategory;
      if (searchQuery)    params.search   = searchQuery;
      const { data } = await axios.get(`${API}/restaurants`, { params });
      setDbRestaurants(data);
    } catch { setDbRestaurants([]); }
    setLoading(false);
  };

  const fetchDbCategories = async () => {
    try {
      const { data } = await axios.get(`${API}/restaurants/categories`);
      setCategories(data);
    } catch { setCategories([]); }
  };

  // ── OpenMenu restaurants ──────────────────────────────────────────────────
  const fetchOmRestaurants = async () => {
    try {
      const term = omSearch.trim() || 'sample';
      const { restaurants } = await searchOpenMenu(term, { offset: omPage });
      const normalized = restaurants.map(normalizeRestaurant);
      setOmRestaurants(normalized);
      setOmHasNext(restaurants.length >= 10);
    } catch { setOmRestaurants([]); }
  };

  // ── Select restaurant (DB) ────────────────────────────────────────────────
  const handleSelectDbRestaurant = async (restaurant) => {
    setSelectedRestaurant({ ...restaurant, source: 'db' });
    setActiveCategory('all'); setActiveTab('menu'); setLoadingMenu(true);
    try {
      const { data } = await axios.get(`${API}/restaurants/${restaurant.id}`);
      setMenuItems(data.menu || []);
    } catch { setMenuItems([]); }
    setLoadingMenu(false);
    setDeals([]);
  };

  // ── Select restaurant (OpenMenu) ──────────────────────────────────────────
  const handleSelectOMRestaurant = async (restaurant) => {
    setSelectedRestaurant({ ...restaurant, source: 'openmenu' });
    setActiveCategory('all'); setActiveTab('menu'); setLoadingMenu(true);
    try {
      const { items, menus } = await searchOpenMenu('sample');
      // Filter items belonging to this restaurant (sandbox returns all from "sample")
      const allItems = [
        ...items,
        ...(menus.flatMap(m => m.items?.map(i => ({ ...i, restaurant_name: m.restaurant_name, id: m.id })) || [])),
      ];
      setMenuItems(allItems.map(i => normalizeMenuItem(i, restaurant.id)));
    } catch { setMenuItems([]); }
    setLoadingMenu(false);

    // Fetch deals
    try {
      const d = await getDeals(restaurant.id);
      setDeals(d);
    } catch { setDeals([]); }
  };

  const handleAddToCart = (item) => {
    if (!selectedRestaurant || selectedRestaurant.source === 'openmenu') return;
    addItem(item, selectedRestaurant.id, selectedRestaurant.name);
  };

  const handleFavorite = async (itemId) => {
    if (!token) { navigate('/login'); return; }
    try { await axios.post(`${API}/favorites/item/${itemId}`, {}, { headers: { Authorization: `Bearer ${token}` } }); }
    catch {}
  };

  const handleBack = () => {
    setSelectedRestaurant(null); setMenuItems([]); setDeals([]);
    setSearchQuery(''); setActiveTab('menu');
    // Clear URL params
    navigate('/menu', { replace: true });
  };

  // ── Derived data ──────────────────────────────────────────────────────────
  const menuCategories = [...new Set(menuItems.map(i => i.category).filter(Boolean))];
  const filteredMenu = menuItems.filter(item => {
    const matchCat   = activeCategory === 'all' || item.category === activeCategory;
    const matchSearch = item.name?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCat && matchSearch;
  });

  const showingBoth = source === 'both';
  const allRestaurants = showingBoth
    ? [...dbRestaurants, ...omRestaurants]
    : source === 'db' ? dbRestaurants : omRestaurants;

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div style={{ background: '#A51C1C', minHeight: '100vh', paddingBottom: '100px' }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      <CartSidebar isOpen={cartOpen} onClose={() => setCartOpen(false)} />
      <CartButton count={count} total={total} onClick={() => setCartOpen(true)} />

      {/* ── Hero ── */}
      <div style={{ padding: '180px 20px 50px' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <SectionTitle
            title={selectedRestaurant ? selectedRestaurant.name : 'Nos Restaurants'}
            subtitle={selectedRestaurant
              ? selectedRestaurant.source === 'openmenu' ? 'Via OpenMenu API' : selectedRestaurant.description || selectedRestaurant.cuisine
              : 'SpeedMeal + données OpenMenu'}
            dark={true}
          />

          {/* Search bar */}
          {!selectedRestaurant && (
            <div style={{ position: 'relative', maxWidth: '680px', margin: '36px auto 0' }}>
              <div style={{ display: 'flex', alignItems: 'center', background: '#fff', borderRadius: '999px', padding: '14px 26px', boxShadow: '0 20px 40px rgba(0,0,0,0.15)' }}>
                <Search size={20} style={{ color: '#888', marginRight: '14px', flexShrink: 0 }} />
                <input type="text" placeholder="Rechercher un restaurant ou un plat..."
                  value={searchQuery} onChange={e => { setSearchQuery(e.target.value); setOmSearch(e.target.value); setOmPage(0); }}
                  style={{ width: '100%', border: 'none', outline: 'none', fontSize: '15px', fontWeight: '500', background: 'transparent' }}
                />
              </div>
            </div>
          )}

          {/* Search inside restaurant */}
          {selectedRestaurant && (
            <div style={{ position: 'relative', maxWidth: '680px', margin: '36px auto 0' }}>
              <div style={{ display: 'flex', alignItems: 'center', background: '#fff', borderRadius: '999px', padding: '14px 26px', boxShadow: '0 20px 40px rgba(0,0,0,0.15)' }}>
                <Search size={20} style={{ color: '#888', marginRight: '14px' }} />
                <input type="text" placeholder="Rechercher un plat..." value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  style={{ width: '100%', border: 'none', outline: 'none', fontSize: '15px', fontWeight: '500', background: 'transparent' }}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 20px' }}>

        {/* ── BACK BUTTON ── */}
        {selectedRestaurant && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
            <button onClick={handleBack}
              style={{ background: 'rgba(255,255,255,0.15)', color: '#fff', border: '1px solid rgba(255,255,255,0.3)', padding: '10px 20px', borderRadius: '999px', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', backdropFilter: 'blur(8px)' }}>
              <ArrowLeft size={15}/> Tous les restaurants
            </button>

            {/* Menu / Deals tabs */}
            <div style={{ display: 'flex', gap: '8px' }}>
              <button onClick={() => setActiveTab('menu')}
                style={{ padding: '10px 20px', background: activeTab === 'menu' ? '#fff' : 'rgba(255,255,255,0.12)', border: activeTab === 'menu' ? 'none' : '1px solid rgba(255,255,255,0.25)', borderRadius: '999px', cursor: 'pointer', color: activeTab === 'menu' ? '#A51C1C' : '#fff', fontWeight: '700', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Utensils size={14} /> Menu
              </button>
              <button onClick={() => setActiveTab('deals')}
                style={{ padding: '10px 20px', background: activeTab === 'deals' ? '#fff' : 'rgba(255,255,255,0.12)', border: activeTab === 'deals' ? 'none' : '1px solid rgba(255,255,255,0.25)', borderRadius: '999px', cursor: 'pointer', color: activeTab === 'deals' ? '#A51C1C' : '#fff', fontWeight: '700', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Tag size={14} /> Deals {deals.length > 0 && `(${deals.length})`}
              </button>
            </div>
          </div>
        )}
        {/* ── MENU CATEGORY FILTER ── */}
        {selectedRestaurant && activeTab === 'menu' && menuCategories.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginBottom: '28px' }}>
            {['all', ...menuCategories].map(cat => (
              <button key={cat} onClick={() => setActiveCategory(cat)}
                style={{ padding: '8px 18px', background: activeCategory === cat ? '#fff' : 'rgba(255,255,255,0.1)', border: activeCategory === cat ? 'none' : '1px solid rgba(255,255,255,0.2)', borderRadius: '999px', cursor: 'pointer', color: activeCategory === cat ? '#A51C1C' : '#fff', fontWeight: '700', fontSize: '13px' }}>
                {cat === 'all' ? 'Tous' : cat}
              </button>
            ))}
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════════
            RESTAURANT LIST
        ══════════════════════════════════════════════════════════════════ */}
        {!selectedRestaurant && (
          <>
            {loading ? (
              <div style={{ textAlign: 'center', padding: '80px 0' }}>
                <div style={{ width: '40px', height: '40px', border: '3px solid rgba(255,255,255,0.3)', borderTop: '3px solid #fff', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 12px' }} />
                <p style={{ color: 'rgba(255,255,255,0.7)', fontWeight: '600' }}>Chargement...</p>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(290px, 1fr))', gap: '24px', paddingBottom: '40px' }}>
                {/* DB restaurants */}
                {(source === 'db' || source === 'both') && dbRestaurants.map(r => (
                  <RestaurantCardDB key={`db_${r.id}`} restaurant={r} onSelect={handleSelectDbRestaurant} />
                ))}
                {/* OpenMenu restaurants */}
                {(source === 'openmenu' || source === 'both') && omRestaurants.map((r, i) => (
                  <RestaurantCardOM key={`om_${r.id || i}`} restaurant={r} index={i} onSelect={handleSelectOMRestaurant} />
                ))}
                {/* Empty state */}
                {allRestaurants.length === 0 && (
                  <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '80px', color: 'rgba(255,255,255,0.7)' }}>
                    <p style={{ fontSize: '18px', fontWeight: '700' }}>Aucun restaurant trouvé</p>
                  </div>
                )}
              </div>
            )}

            {/* OpenMenu pagination */}
            {(source === 'openmenu' || source === 'both') && omRestaurants.length > 0 && (
              <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', paddingBottom: '40px' }}>
                <button onClick={() => setOmPage(p => Math.max(0, p-1))} disabled={omPage === 0}
                  style={{ padding: '10px 22px', background: omPage === 0 ? 'rgba(255,255,255,0.1)' : '#fff', color: omPage === 0 ? 'rgba(255,255,255,0.4)' : '#A51C1C', border: 'none', borderRadius: '999px', fontWeight: '700', cursor: omPage === 0 ? 'not-allowed' : 'pointer' }}>
                  ← Précédent
                </button>
                <span style={{ color: '#fff', fontWeight: '800', display: 'flex', alignItems: 'center', padding: '0 8px' }}>Page {omPage + 1}</span>
                <button onClick={() => setOmPage(p => p+1)} disabled={!omHasNext}
                  style={{ padding: '10px 22px', background: !omHasNext ? 'rgba(255,255,255,0.1)' : '#fff', color: !omHasNext ? 'rgba(255,255,255,0.4)' : '#A51C1C', border: 'none', borderRadius: '999px', fontWeight: '700', cursor: !omHasNext ? 'not-allowed' : 'pointer' }}>
                  Suivant →
                </button>
              </div>
            )}
          </>
        )}

        {/* ══════════════════════════════════════════════════════════════════
            MENU TAB
        ══════════════════════════════════════════════════════════════════ */}
        {selectedRestaurant && activeTab === 'menu' && (
          loadingMenu ? (
            <div style={{ textAlign: 'center', padding: '80px 0' }}>
              <div style={{ width: '40px', height: '40px', border: '3px solid rgba(255,255,255,0.3)', borderTop: '3px solid #fff', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 12px' }} />
              <p style={{ color: 'rgba(255,255,255,0.7)', fontWeight: '600' }}>Chargement du menu...</p>
            </div>
          ) : filteredMenu.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '80px', color: 'rgba(255,255,255,0.7)' }}>
              <Utensils size={40} color="rgba(255,255,255,0.4)" style={{ marginBottom: '12px' }} />
              <p style={{ fontSize: '16px', fontWeight: '700' }}>Aucun plat disponible</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(290px, 1fr))', gap: '20px', paddingBottom: '60px' }}>
              {filteredMenu.map(item => (
                <MenuItemCard key={item.id} item={item}
                  source={selectedRestaurant.source}
                  onAdd={handleAddToCart}
                  onFavorite={handleFavorite}
                  isLoggedIn={!!token}
                />
              ))}
            </div>
          )
        )}

        {/* ══════════════════════════════════════════════════════════════════
            DEALS TAB
        ══════════════════════════════════════════════════════════════════ */}
        {selectedRestaurant && activeTab === 'deals' && (
          <div style={{ paddingBottom: '60px' }}>
            {deals.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '80px', color: 'rgba(255,255,255,0.7)' }}>
                <p style={{ fontSize: '32px', marginBottom: '12px' }}>🎟️</p>
                <p style={{ fontSize: '16px', fontWeight: '700' }}>Aucun deal disponible</p>
                <p style={{ fontSize: '14px', marginTop: '8px', opacity: 0.7 }}>Ce restaurant n'a pas de promotions en ce moment</p>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px' }}>
                {deals.map((deal, i) => <DealCard key={i} deal={deal} />)}
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}
