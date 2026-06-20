import React, { useState, useEffect } from 'react';
import { Star, MapPin, Utensils, Tag, ChevronRight, Flame, Pizza, Fish, Coffee } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

// Import sample images
import img1 from '../assets/1.jpeg';
import img2 from '../assets/2.jpeg';
import img3 from '../assets/3.jpeg';
import img4 from '../assets/4.jpeg';
import imgBurger from '../assets/burger.png';
import imgPizza from '../assets/pizza.png';

const CUISINE_ICON = {
  american: Flame, italian: Pizza, mexican: Utensils, chinese: Utensils,
  japanese: Fish, thai: Utensils, indian: Utensils, french: Coffee,
  seafood: Fish, pizza: Pizza, burger: Flame, mediterranean: Utensils,
  default: Utensils,
};
const getCuisineIcon = (cuisine = '') => {
  const key = cuisine.toLowerCase();
  return Object.entries(CUISINE_ICON).find(([k]) => key.includes(k))?.[1] || CUISINE_ICON.default;
};

const CARD_BG = ['#fff4ee', '#f0fdf4', '#eff6ff', '#fdf4ff', '#fffbeb', '#f0f9ff'];

// Sample restaurant data for demo
const SAMPLE_RESTAURANTS = [
  { id: 1, name: 'The Burger Company', description: 'Délicieux burgers frais', cuisine: 'burger', address: 'Avenue Hassan II, N°18', image_url: img1 },
  { id: 2, name: 'Pizza Paradise', description: 'Pizzas artisanales', cuisine: 'pizza', address: 'Rue Moulay Youssef, 45', image_url: img2 },
  { id: 3, name: 'Sushi Master', description: 'Fresh sushi and sashimi', cuisine: 'japanese', address: 'Boulevard Mohammed V, 12', image_url: img3 },
  { id: 4, name: 'Taco Fiesta', description: 'Authentic Mexican tacos', cuisine: 'mexican', address: 'Avenue des FAR, 89', image_url: img4 },
  { id: 5, name: 'Burger Hub', description: 'Gourmet burgers', cuisine: 'burger', address: 'Rue Ibn Sina, 34', image_url: imgBurger },
  { id: 6, name: 'Pizza World', description: 'World-famous pizzas', cuisine: 'pizza', address: 'Boulevard Anfa, 67', image_url: imgPizza },
];

const RestaurantCard = ({ restaurant, index }) => {
  const navigate = useNavigate();
  const bg = CARD_BG[index % CARD_BG.length];

  return (
    <div
      onClick={() => navigate(`/menu?restaurant=${restaurant.id}&name=${encodeURIComponent(restaurant.name)}`)}
      style={{
        background: '#fff',
        borderRadius: '24px',
        overflow: 'hidden',
        boxShadow: '0 4px 20px rgba(0,0,0,0.06)',
        border: '1px solid #f0f0f0',
        cursor: 'pointer',
        transition: 'transform 0.2s, box-shadow 0.2s',
        animation: `fadeInUp 0.4s ease ${index * 0.07}s both`,
      }}
      onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-6px)'; e.currentTarget.style.boxShadow = '0 12px 32px rgba(0,0,0,0.1)'; }}
      onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.06)'; }}
    >
      {/* Image or emoji header */}
      <div style={{ height: '200px', background: bg, position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
        {restaurant.image_url
          ? <img src={restaurant.image_url} alt={restaurant.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={e => { e.target.style.display = 'none'; }} />
          : (() => { const Icon = getCuisineIcon(restaurant.cuisine); return <Icon size={52} color="#A51C1C" style={{ opacity: 0.3 }} />; })()
        }
        {restaurant.deals_count > 0 && (
          <div style={{
            position: 'absolute', top: '10px', right: '10px',
            background: '#A51C1C', color: '#fff',
            padding: '4px 10px', borderRadius: '999px',
            fontSize: '11px', fontWeight: '800',
            display: 'flex', alignItems: 'center', gap: '4px',
          }}>
            <Tag size={11} /> {restaurant.deals_count} deal{restaurant.deals_count > 1 ? 's' : ''}
          </div>
        )}
      </div>

      {/* Body */}
      <div style={{ padding: '16px 20px 18px' }}>
        <h3 style={{ margin: '0 0 4px', fontSize: '18px', fontWeight: '800', color: '#111', lineHeight: 1.3 }}>
          {restaurant.name}
        </h3>

        {restaurant.description && (
          <p style={{
            margin: '0 0 10px', color: '#888', fontSize: '14px', lineHeight: 1.5,
            display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
          }}>
            {restaurant.description}
          </p>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
          {restaurant.cuisine && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: '#888' }}>
              <Utensils size={13} color="#A51C1C" />
              {restaurant.cuisine}
            </div>
          )}
          {restaurant.address && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: '#888' }}>
              <MapPin size={13} color="#A51C1C" />
              {restaurant.address}
            </div>
          )}
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '14px' }}>
          <span style={{ color: '#A51C1C', fontWeight: '700', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '4px' }}>
            Voir le menu <ChevronRight size={14} />
          </span>
        </div>
      </div>
    </div>
  );
};

export default function RestaurantsSection() {
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const { data } = await axios.get('https://speedmeal.ayaennoamany.workers.dev/api/restaurants');
        if (data.filter(r => r.isVerified).length > 0) {
          setRestaurants(data.filter(r => r.isVerified));
        } else {
          setRestaurants(SAMPLE_RESTAURANTS);
        }
      } catch (err) {
        setRestaurants(SAMPLE_RESTAURANTS); // Fallback to sample data
      }
      setLoading(false);
    };
    load();
  }, []);

  return (
    <section style={{ padding: '40px 0 60px' }}>
      <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      <div style={{ maxWidth: '1300px', margin: '0 auto', padding: '0 30px' }}>
        {loading && (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '60px 0', gap: '8px', alignItems: 'center' }}>
            <div style={{ width: '32px', height: '32px', border: '3px solid #f3f3f3', borderTop: '3px solid #A51C1C', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
            <span style={{ color: '#888', fontWeight: '600' }}>Chargement des restaurants...</span>
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          </div>
        )}

        {error && (
          <p style={{ textAlign: 'center', color: '#A51C1C', fontWeight: '600', padding: '40px' }}>{error}</p>
        )}

        {!loading && restaurants.length > 0 && (
          <>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
              gap: '24px',
              marginBottom: '40px',
            }}>
              {restaurants.map((r, i) => (
                <RestaurantCard key={r.id} restaurant={r} index={i} />
              ))}
            </div>

            <div style={{ textAlign: 'center' }}>
              <button
                onClick={() => navigate('/menu')}
                style={{
                  background: '#A51C1C', color: '#fff',
                  padding: '15px 40px', borderRadius: '999px',
                  border: 'none', fontWeight: '800', fontSize: '15px', cursor: 'pointer',
                  boxShadow: '0 8px 24px rgba(165,28,28,0.25)',
                  transition: 'transform 0.2s',
                }}
                onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.04)'}
                onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
              >
                Voir tous les restaurants <ChevronRight size={16}/>
              </button>
            </div>
          </>
        )}
      </div>
    </section>
  );
}
