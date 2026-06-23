import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import axios from 'axios';
import API_BASE_URL from '../config/api';

const CategoryItem = ({ name, image, price }) => {
  const navigate = useNavigate();
  const defaultImages = [
    'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=500&q=80',
    'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=500&q=80',
    'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=500&q=80',
    'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=500&q=80',
    'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=500&q=80',
    'https://images.unsplash.com/photo-1563729784474-d77dbb933a9e?w=500&q=80'
  ];

  return (
    <motion.div 
      whileHover={{ y: -10 }}
      style={{ textAlign: 'center', minWidth: '180px', cursor: 'pointer' }}
      onClick={() => navigate(`/menu?category=${encodeURIComponent(name)}`)}
    >
      <div style={{
        position: 'relative',
        width: '160px',
        height: '160px',
        margin: '0 auto 20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div style={{
          position: 'absolute',
          width: '100%',
          height: '100%',
          borderRadius: '50%',
          background: '#fcfcfc',
          border: '1px solid #eee',
          zIndex: 1
        }} />
        <img 
          src={image || defaultImages[Math.floor(Math.random() * defaultImages.length)]} 
          alt={name} 
          style={{ 
            width: '130px', 
            height: '130px', 
            borderRadius: '50%',
            objectFit: 'cover',
            position: 'relative', 
            zIndex: 2,
            filter: 'drop-shadow(0 10px 20px rgba(0,0,0,0.1))'
          }} 
        />
      </div>
      <h3 style={{ fontSize: '18px', fontWeight: '800', marginBottom: '5px', color: '#111' }}>
        {name}
      </h3>
      {price && (
        <p style={{ color: '#A51C1C', fontWeight: '800', fontSize: '15px' }}>
          {Number(price).toFixed(2)} DH
        </p>
      )}
    </motion.div>
  );
};

const CategoriesSection = () => {
  const [categories, setCategories] = useState([]);
  const [showAll, setShowAll] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await axios.get(`${API_BASE_URL}/restaurants/menu-categories`);
        setCategories(data);
      } catch (err) {
        console.error('Failed to load categories:', err);
      }
    };
    load();
  }, []);

  return (
    <section style={{ padding: '80px 0', background: '#fff' }}>
      <div className="container">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '50px', flexWrap: 'wrap', gap: '16px' }}>
          <h2 style={{ fontSize: 'clamp(26px, 4vw, 36px)', fontWeight: '950', color: '#111', lineHeight: '1.2' }}>
            Best <span style={{ color: '#A51C1C' }}>Delivered</span> <br /> Categories
          </h2>
          <p style={{ color: '#888', maxWidth: '200px', fontSize: '13px', textAlign: 'right', fontWeight: '500' }}>
            The best restaurants in your city, delivered to your doorstep.
          </p>
        </div>
        
        <div style={{ 
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
          gap: '24px',
          justifyItems: 'center'
        }}>
          {(showAll ? categories : categories.slice(0, 6)).map((cat, i) => (
            <CategoryItem 
              key={i}
              name={cat.name}
              price={cat.sample_price}
              image={cat.image_url}
            />
          ))}
        </div>
        {categories.length > 6 && (
          <div style={{ textAlign: 'center', marginTop: '40px' }}>
            <button
              onClick={() => setShowAll(!showAll)}
              style={{
                background: '#A51C1C', color: '#fff',
                padding: '12px 32px', borderRadius: '999px',
                border: 'none', fontWeight: '800', fontSize: '14px', cursor: 'pointer',
                boxShadow: '0 6px 20px rgba(165,28,28,0.25)',
                transition: 'transform 0.2s',
                display: 'inline-flex', alignItems: 'center', gap: '8px'
              }}
              onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.04)'}
              onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
            >
              {showAll ? 'Voir moins' : 'Voir plus'} <ChevronRight size={14} />
            </button>
          </div>
        )}
      </div>
    </section>
  );
};

export default CategoriesSection;
