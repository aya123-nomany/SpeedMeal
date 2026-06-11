import React, { useState, useEffect } from 'react';
import { Star, MapPin, Utensils, Tag, ChevronRight, Globe, Flame, Pizza, Fish, Coffee } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { searchOpenMenu, normalizeRestaurant } from '../services/openMenuAPI';

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

const RestaurantCardOM = ({ restaurant, index }) => {
  const navigate = useNavigate();
  const bg = CARD_BG[index % CARD_BG.length];

  return (
    <div
      onClick={() => navigate(`/menu?restaurant=${restaurant.id}&name=${encodeURIComponent(restaurant.name)}&source=openmenu`)}
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
      <div style={{ height: '160px', background: bg, position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
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
        <div style={{
          position: 'absolute', top: '10px', left: '10px',
          background: 'rgba(255,255,255,0.9)',
          padding: '3px 10px', borderRadius: '999px',
          fontSize: '11px', fontWeight: '700', color: '#555',
        }}>
          OpenMenu
        </div>
      </div>

      {/* Body */}
      <div style={{ padding: '16px 20px 18px' }}>
        <h3 style={{ margin: '0 0 4px', fontSize: '16px', fontWeight: '800', color: '#111', lineHeight: 1.3 }}>
          {restaurant.name}
        </h3>

        {restaurant.description && (
          <p style={{
            margin: '0 0 10px', color: '#888', fontSize: '13px', lineHeight: 1.5,
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
          <span style={{ color: '#A51C1C', fontWeight: '700', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '4px' }}>
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
        // 'sample' = sandbox, no credits consumed
        const { restaurants: raw } = await searchOpenMenu('sample');
        setRestaurants(raw.map(normalizeRestaurant));
      } catch (err) {
        setError('Impossible de charger les restaurants.');
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

        {!loading && !error && restaurants.length === 0 && (
          <p style={{ textAlign: 'center', color: '#888', padding: '60px' }}>Aucun restaurant trouvé.</p>
        )}

        {!loading && restaurants.length > 0 && (
          <>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
              gap: '24px',
              marginBottom: '40px',
            }}>
              {restaurants.slice(0, 6).map((r, i) => (
                <RestaurantCardOM key={r.id || i} restaurant={r} index={i} />
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
