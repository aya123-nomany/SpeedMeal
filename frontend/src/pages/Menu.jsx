import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, Flame, Pizza, Bird, Coffee, Utensils, Fish, IceCream, ShoppingCart, Heart, Search, Plus, Minus, X, MapPin, ChevronRight } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import SectionTitle from '../components/SectionTitle';
import { useCart } from '../context/CartContext';
import logoUrl from '../assets/logo.png';

const API = 'http://localhost:5000/api';

const CATEGORY_ICONS = {
  Burger: Flame, Pizza, Chicken: Bird, Drinks: Coffee,
  Pasta: Utensils, Sushi: Fish, Desserts: IceCream,
  default: ShoppingCart,
};

// Floating Cart Button
const CartButton = ({ count, total, onClick }) => {
  if (count === 0) return null;
  return (
    <motion.button
      initial={{ y: 80 }} animate={{ y: 0 }}
      onClick={onClick}
      style={{
        position: 'fixed', bottom: '30px', left: '50%', transform: 'translateX(-50%)',
        background: '#111', color: '#fff', border: 'none', borderRadius: '999px',
        padding: '16px 32px', fontWeight: '800', fontSize: '15px', cursor: 'pointer',
        display: 'flex', alignItems: 'center', gap: '14px', zIndex: 1000,
        boxShadow: '0 8px 30px rgba(0,0,0,0.3)', minWidth: '280px', justifyContent: 'space-between'
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

// Restaurant Card
const RestaurantCard = ({ restaurant, onSelect }) => (
  <motion.div whileHover={{ y: -6 }} onClick={() => onSelect(restaurant)}
    style={{ background: '#fff', borderRadius: '20px', overflow: 'hidden', cursor: 'pointer', boxShadow: '0 4px 20px rgba(0,0,0,0.06)', border: '1px solid #f0f0f0' }}>
    <div style={{ height: '180px', overflow: 'hidden', position: 'relative', background: '#f5f5f5' }}>
      {restaurant.image_url
        ? <img src={restaurant.image_url} alt={restaurant.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#A51C1C20' }}>
            <ShoppingCart size={48} color="#A51C1C50" />
          </div>
      }
      <span style={{ position: 'absolute', top: '12px', right: '12px', background: restaurant.isOpen ? '#dcfce7' : '#fee2e2', color: restaurant.isOpen ? '#15803d' : '#b91c1c', padding: '4px 10px', borderRadius: '999px', fontSize: '11px', fontWeight: '700' }}>
        {restaurant.isOpen ? '🟢 Ouvert' : '🔴 Fermé'}
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

// Menu Item Card
const MenuItemCard = ({ item, onAdd, onFavorite, isLoggedIn }) => {
  const [added, setAdded] = useState(false);

  const handleAdd = () => {
    onAdd(item);
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} whileHover={{ y: -6 }}
      style={{ background: '#fff', borderRadius: '20px', overflow: 'hidden', boxShadow: '0 4px 20px rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column' }}>
      <div style={{ height: '200px', overflow: 'hidden', position: 'relative', background: '#f5f5f5' }}>
        {item.image_url
          ? <img src={item.image_url} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          : <div style={{ width: '100%', height: '100%', background: 'linear-gradient(135deg, #fff0f0, #fce7e7)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '48px' }}>🍽️</div>
        }
        {item.category && (
          <span style={{ position: 'absolute', top: '12px', left: '12px', background: '#A51C1C', color: '#fff', padding: '4px 10px', borderRadius: '999px', fontSize: '11px', fontWeight: '700' }}>
            {item.category}
          </span>
        )}
        {isLoggedIn && (
          <button onClick={() => onFavorite(item.id)}
            style={{ position: 'absolute', top: '12px', right: '12px', background: 'rgba(255,255,255,0.9)', border: 'none', borderRadius: '50%', padding: '8px', cursor: 'pointer', display: 'flex' }}>
            <Heart size={16} color="#A51C1C" />
          </button>
        )}
      </div>
      <div style={{ padding: '18px 20px', display: 'flex', flexDirection: 'column', flex: 1 }}>
        <h3 style={{ margin: '0 0 4px', fontSize: '16px', fontWeight: '800', color: '#111' }}>{item.name}</h3>
        {item.description && <p style={{ margin: '0 0 12px', color: '#888', fontSize: '13px', lineHeight: 1.5, flex: 1 }}>{item.description.substring(0, 60)}{item.description.length > 60 ? '...' : ''}</p>}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto' }}>
          <span style={{ fontSize: '20px', fontWeight: '900', color: '#A51C1C' }}>{Number(item.price).toFixed(2)} MAD</span>
          <motion.button whileTap={{ scale: 0.9 }} onClick={handleAdd}
            style={{ background: added ? '#22c55e' : '#111', color: '#fff', border: 'none', borderRadius: '12px', padding: '10px 18px', fontWeight: '800', fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', transition: 'background 0.3s' }}>
            {added ? '✓ Ajouté' : <><Plus size={15} /> Ajouter</>}
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
};

// Mini cart sidebar
const CartSidebar = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const { cart, restaurantName, updateQuantity, removeItem, total } = useCart();

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose}
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 2000 }} />
          <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            style={{ position: 'fixed', top: 0, right: 0, bottom: 0, width: '380px', background: '#fff', zIndex: 2001, display: 'flex', flexDirection: 'column', boxShadow: '-10px 0 40px rgba(0,0,0,0.1)' }}>
            <div style={{ padding: '24px', borderBottom: '1px solid #f0f0f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ margin: 0, fontWeight: '900', fontSize: '18px' }}>Mon panier</h3>
                <p style={{ margin: '4px 0 0', color: '#888', fontSize: '13px' }}>{restaurantName}</p>
              </div>
              <button onClick={onClose} style={{ background: '#f5f5f5', border: 'none', borderRadius: '50%', padding: '10px', cursor: 'pointer', display: 'flex' }}>
                <X size={20} />
              </button>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', padding: '16px 24px' }}>
              {cart.length === 0 ? (
                <p style={{ color: '#aaa', textAlign: 'center', padding: '40px 0' }}>Votre panier est vide</p>
              ) : (
                cart.map(item => (
                  <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid #f9f9f9' }}>
                    <div style={{ flex: 1 }}>
                      <p style={{ margin: 0, fontWeight: '700', fontSize: '14px' }}>{item.name}</p>
                      <p style={{ margin: '2px 0 0', color: '#A51C1C', fontWeight: '700', fontSize: '13px' }}>{Number(item.price).toFixed(2)} MAD</p>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <button onClick={() => updateQuantity(item.id, item.quantity - 1)} style={{ background: '#f5f5f5', border: 'none', borderRadius: '6px', width: '28px', height: '28px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Minus size={12} />
                      </button>
                      <span style={{ fontWeight: '800', fontSize: '14px', minWidth: '20px', textAlign: 'center' }}>{item.quantity}</span>
                      <button onClick={() => updateQuantity(item.id, item.quantity + 1)} style={{ background: '#f5f5f5', border: 'none', borderRadius: '6px', width: '28px', height: '28px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Plus size={12} />
                      </button>
                      <button onClick={() => removeItem(item.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#bbb' }}>
                        <X size={14} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {cart.length > 0 && (
              <div style={{ padding: '20px 24px', borderTop: '1px solid #f0f0f0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
                  <span style={{ fontWeight: '900', fontSize: '16px' }}>Total</span>
                  <span style={{ fontWeight: '900', fontSize: '18px', color: '#A51C1C' }}>{total.toFixed(2)} MAD</span>
                </div>
                <button onClick={() => { onClose(); navigate('/checkout'); }}
                  style={{ width: '100%', background: '#A51C1C', color: '#fff', border: 'none', padding: '16px', borderRadius: '14px', fontWeight: '800', fontSize: '15px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                  Commander <ChevronRight size={18} />
                </button>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

const Menu = () => {
  const [restaurants, setRestaurants] = useState([]);
  const [selectedRestaurant, setSelectedRestaurant] = useState(null);
  const [menuItems, setMenuItems] = useState([]);
  const [activeCategory, setActiveCategory] = useState('all');
  const [categories, setCategories] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchCategory, setSearchCategory] = useState('');
  const [loading, setLoading] = useState(true);
  const [cartOpen, setCartOpen] = useState(false);
  const { addItem, count, total } = useCart();
  const token = localStorage.getItem('token');
  const navigate = useNavigate();

  useEffect(() => {
    fetchRestaurants();
    fetchCategories();
  }, []);

  const fetchRestaurants = async () => {
    setLoading(true);
    try {
      const params = {};
      if (searchCategory) params.category = searchCategory;
      if (searchQuery) params.search = searchQuery;
      const { data } = await axios.get(`${API}/restaurants`, { params });
      setRestaurants(data);
    } catch { setRestaurants([]); }
    setLoading(false);
  };

  const fetchCategories = async () => {
    try {
      const { data } = await axios.get(`${API}/restaurants/categories`);
      setCategories(data);
    } catch { setCategories([]); }
  };

  const handleSelectRestaurant = async (restaurant) => {
    setSelectedRestaurant(restaurant);
    setActiveCategory('all');
    try {
      const { data } = await axios.get(`${API}/restaurants/${restaurant.id}`);
      setMenuItems(data.menu || []);
    } catch { setMenuItems([]); }
  };

  const handleAddToCart = (item) => {
    if (!selectedRestaurant) return;
    addItem(item, selectedRestaurant.id, selectedRestaurant.name);
  };

  const handleFavorite = async (itemId) => {
    if (!token) { navigate('/login'); return; }
    try {
      await axios.post(`${API}/favorites/item/${itemId}`, {}, { headers: { Authorization: `Bearer ${token}` } });
    } catch {}
  };

  const handleFavoriteRestaurant = async (e, restaurantId) => {
    e.stopPropagation();
    if (!token) { navigate('/login'); return; }
    try {
      await axios.post(`${API}/favorites/restaurant/${restaurantId}`, {}, { headers: { Authorization: `Bearer ${token}` } });
    } catch {}
  };

  useEffect(() => {
    const timer = setTimeout(fetchRestaurants, 400);
    return () => clearTimeout(timer);
  }, [searchQuery, searchCategory]);

  const filteredMenu = menuItems.filter(item => {
    const matchesCategory = activeCategory === 'all' || item.category === activeCategory;
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const menuCategories = [...new Set(menuItems.map(i => i.category).filter(Boolean))];

  return (
    <div style={{ background: '#A51C1C', minHeight: '100vh', paddingBottom: selectedRestaurant ? '100px' : '60px' }}>
      <CartSidebar isOpen={cartOpen} onClose={() => setCartOpen(false)} />
      <CartButton count={count} total={total} onClick={() => setCartOpen(true)} />

      {/* Hero */}
      <div style={{ padding: '180px 20px 60px' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <SectionTitle title={selectedRestaurant ? selectedRestaurant.name : 'Nos Restaurants'} subtitle={selectedRestaurant ? selectedRestaurant.description || selectedRestaurant.cuisine : 'Découvrez les meilleurs restaurants près de chez vous'} dark={true} />

          <div style={{ position: 'relative', maxWidth: '700px', margin: '40px auto 0' }}>
            <div style={{ display: 'flex', alignItems: 'center', background: '#fff', borderRadius: '999px', padding: '16px 28px', boxShadow: '0 20px 40px rgba(0,0,0,0.15)' }}>
              <Search size={20} style={{ color: '#888', marginRight: '16px' }} />
              <input type="text" placeholder={selectedRestaurant ? 'Rechercher un plat...' : 'Rechercher un restaurant...'} value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                style={{ width: '100%', border: 'none', outline: 'none', fontSize: '16px', fontWeight: '500', background: 'transparent' }}
              />
            </div>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 20px' }}>
        {/* Back button if inside a restaurant */}
        {selectedRestaurant && (
          <button onClick={() => { setSelectedRestaurant(null); setMenuItems([]); setSearchQuery(''); }}
            style={{ background: 'rgba(255,255,255,0.15)', color: '#fff', border: '1px solid rgba(255,255,255,0.3)', padding: '10px 20px', borderRadius: '999px', fontWeight: '700', cursor: 'pointer', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '8px', backdropFilter: 'blur(8px)' }}>
            ← Retour aux restaurants
          </button>
        )}

        {/* Category filter */}
        {!selectedRestaurant && categories.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginBottom: '40px', justifyContent: 'center' }}>
            {['all', ...categories].map(cat => {
              const isActive = searchCategory === (cat === 'all' ? '' : cat);
              return (
                <motion.button key={cat} whileHover={{ y: -3 }} whileTap={{ scale: 0.95 }}
                  onClick={() => setSearchCategory(cat === 'all' ? '' : cat)}
                  style={{ padding: '10px 22px', background: isActive ? '#fff' : 'rgba(255,255,255,0.1)', border: isActive ? 'none' : '1px solid rgba(255,255,255,0.2)', borderRadius: '999px', cursor: 'pointer', color: isActive ? '#A51C1C' : '#fff', fontWeight: '700', fontSize: '14px', backdropFilter: 'blur(8px)' }}>
                  {cat === 'all' ? '🍽️ Tous' : cat}
                </motion.button>
              );
            })}
          </div>
        )}

        {/* Menu category filter (inside restaurant) */}
        {selectedRestaurant && menuCategories.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginBottom: '32px' }}>
            {['all', ...menuCategories].map(cat => {
              const isActive = activeCategory === cat;
              return (
                <button key={cat} onClick={() => setActiveCategory(cat)}
                  style={{ padding: '9px 20px', background: isActive ? '#fff' : 'rgba(255,255,255,0.1)', border: isActive ? 'none' : '1px solid rgba(255,255,255,0.2)', borderRadius: '999px', cursor: 'pointer', color: isActive ? '#A51C1C' : '#fff', fontWeight: '700', fontSize: '13px', backdropFilter: 'blur(8px)' }}>
                  {cat === 'all' ? 'Tous' : cat}
                </button>
              );
            })}
          </div>
        )}

        {/* RESTAURANTS GRID */}
        {!selectedRestaurant && (
          loading ? (
            <div style={{ textAlign: 'center', padding: '80px 0' }}>
              <div style={{ width: '44px', height: '44px', border: '4px solid rgba(255,255,255,0.3)', borderTop: '4px solid #fff', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto' }} />
              <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
            </div>
          ) : restaurants.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '80px', color: 'rgba(255,255,255,0.7)' }}>
              <p style={{ fontSize: '18px', fontWeight: '700' }}>Aucun restaurant trouvé</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '24px', paddingBottom: '60px' }}>
              {restaurants.map(r => (
                <RestaurantCard key={r.id} restaurant={r} onSelect={handleSelectRestaurant} />
              ))}
            </div>
          )
        )}

        {/* MENU GRID */}
        {selectedRestaurant && (
          filteredMenu.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '80px', color: 'rgba(255,255,255,0.7)' }}>
              <p style={{ fontSize: '18px' }}>Aucun plat disponible</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '24px', paddingBottom: '60px' }}>
              {filteredMenu.map(item => (
                <MenuItemCard key={item.id} item={item} onAdd={handleAddToCart} onFavorite={handleFavorite} isLoggedIn={!!token} />
              ))}
            </div>
          )
        )}
      </div>
    </div>
  );
};

export default Menu;
