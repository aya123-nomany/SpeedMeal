import React from 'react';
import { motion } from 'framer-motion';

const CategoryItem = ({ name, image, price }) => (
  <motion.div 
    whileHover={{ y: -10 }}
    style={{ textAlign: 'center', minWidth: '180px' }}
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
        src={image} 
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
    <p style={{ color: '#A51C1C', fontWeight: '800', fontSize: '15px' }}>
      {price}
    </p>
  </motion.div>
);

const CategoriesSection = () => {
  return (
    <section style={{ padding: '80px 0', background: '#fff' }}>
      <div className="container">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '50px' }}>
          <h2 style={{ fontSize: '36px', fontWeight: '950', color: '#111', lineHeight: '1.2' }}>
            Best <span style={{ color: '#A51C1C' }}>Delivered</span> <br /> Categories
          </h2>
          <p style={{ color: '#888', maxWidth: '200px', fontSize: '13px', textAlign: 'right', fontWeight: '500' }}>
            The best restaurants in your city, delivered to your doorstep.
          </p>
        </div>
        
        <div style={{ 
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
          gap: '30px',
          justifyItems: 'center'
        }}>
          <CategoryItem 
            name="Chicken Burger"
            price="45.00 DH"
            image="https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=500&q=80"
          />
          <CategoryItem 
            name="Chicken Pizza"
            price="65.00 DH"
            image="https://images.unsplash.com/photo-1513104890138-7c749659a591?w=500&q=80"
          />
          <CategoryItem 
            name="French Fries"
            price="20.00 DH"
            image="https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=500&q=80"
          />
          <CategoryItem 
            name="Sushi"
            price="55.00 DH"
            image="https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=500&q=80"
          />
          <CategoryItem 
            name="Tacos"
            price="40.00 DH"
            image="https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=500&q=80"
          />
          <CategoryItem 
            name="Desserts"
            price="30.00 DH"
            image="https://images.unsplash.com/photo-1563729784474-d77dbb933a9e?w=500&q=80"
          />
        </div>
      </div>
    </section>
  );
};

export default CategoriesSection;
