import React from 'react';
import { Star } from 'lucide-react';

const RestaurantCard = ({ name, image, rating, time, fee }) => (
  <div style={{ background: '#fff', borderRadius: '30px', overflow: 'hidden', boxShadow: '0 15px 40px rgba(0,0,0,0.04)', border: '1px solid #f5f5f5' }}>
    <div style={{ height: '180px', overflow: 'hidden' }}>
      <img src={image} alt={name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
    </div>
    <div style={{ padding: '25px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
        <h4 style={{ fontSize: '18px', fontWeight: '900', color: '#111' }}>{name}</h4>
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: '#FFC244', fontWeight: '800', fontSize: '14px' }}>
          <Star size={16} fill="#FFC244" /> {rating}
        </div>
      </div>
      <div style={{ display: 'flex', gap: '15px', color: '#888', fontSize: '13px', fontWeight: '600' }}>
        <span>{time}</span>
        <span>•</span>
        <span>{fee}</span>
      </div>
    </div>
  </div>
);

const RestaurantsSection = () => {
  return (
    <section style={{ padding: '60px 0' }}>
      <div className="container">
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', 
          gap: '25px',
          marginBottom: '50px'
        }}>
          <RestaurantCard 
            name="Pizza Hut" 
            rating="4.6" 
            time="30-40 min" 
            fee="15.00 DH"
            image="https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&q=80&w=2000"
          />
          <RestaurantCard 
            name="McDonald's" 
            rating="4.5" 
            time="20-30 min" 
            fee="10.00 DH"
            image="https://images.unsplash.com/photo-1552566626-52f8b828add9?auto=format&fit=crop&q=80&w=2000"
          />
          <RestaurantCard 
            name="KFC" 
            rating="4.4" 
            time="25-35 min" 
            fee="12.00 DH"
            image="https://images.unsplash.com/photo-1623341214825-9f4f963727da?auto=format&fit=crop&q=80&w=2000"
          />
        </div>
        <div style={{ textAlign: 'center' }}>
          <button style={{ 
            background: '#A51C1C', 
            color: '#fff', 
            padding: '15px 40px', 
            borderRadius: '999px', 
            border: 'none', 
            fontWeight: '800', 
            cursor: 'pointer',
            fontSize: '15px'
          }}>
            Voir tous les restaurants
          </button>
        </div>
      </div>
    </section>
  );
};

export default RestaurantsSection;
