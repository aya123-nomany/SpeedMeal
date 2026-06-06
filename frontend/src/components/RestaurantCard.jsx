import React from 'react';
import { Star, Clock, MapPin } from 'lucide-react';
import { motion } from 'framer-motion';

const RestaurantCard = ({ restaurant }) => {
  return (
    <motion.div 
      className="glass-card" 
      whileHover={{ scale: 1.02 }}
      style={{ overflow: 'hidden', cursor: 'pointer' }}
    >
      <div style={{ position: 'relative', height: '200px' }}>
        <img 
          src={restaurant.image} 
          alt={restaurant.name} 
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        />
        <div style={{ 
          position: 'absolute', 
          top: '12px', 
          right: '12px', 
          background: 'rgba(0,0,0,0.6)', 
          color: 'white', 
          padding: '4px 10px', 
          borderRadius: '20px',
          fontSize: '12px',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          gap: '4px'
        }}>
          <Star size={14} fill="#FFB703" color="#FFB703" />
          {restaurant.rating}
        </div>
      </div>
      <div style={{ padding: '20px' }}>
        <h3 style={{ fontSize: '20px', fontWeight: '700', marginBottom: '8px' }}>{restaurant.name}</h3>
        <p style={{ fontSize: '14px', color: 'var(--text-muted)', marginBottom: '16px' }}>{restaurant.cuisine} • {restaurant.priceRange}</p>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px', fontSize: '13px', color: 'var(--text-muted)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Clock size={16} />
            {restaurant.deliveryTime} mins
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <MapPin size={16} />
            {restaurant.distance} km
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default RestaurantCard;
