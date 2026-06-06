import React from 'react';
import { motion } from 'framer-motion';
import { Zap, ClipboardList, Map, UtensilsCrossed } from 'lucide-react';

const FeatureItem = ({ icon: Icon, title, description }) => (
  <motion.div 
    initial={{ opacity: 0, y: 20 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    style={{
      textAlign: 'center',
      flex: 1,
      minWidth: '220px',
      padding: '20px'
    }}
  >
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      marginBottom: '25px',
      color: '#A51C1C'
    }}>
      <Icon size={40} strokeWidth={2} />
    </div>
    <h4 style={{ fontSize: '18px', fontWeight: '900', marginBottom: '15px', color: '#111' }}>
      {title}
    </h4>
    <p style={{ fontSize: '13px', color: '#666', lineHeight: '1.6', maxWidth: '200px', margin: '0 auto', fontWeight: '500' }}>
      {description}
    </p>
  </motion.div>
);

const FeaturesSection = () => {
  return (
    <section style={{ padding: '100px 0', background: '#fff9e6', borderRadius: '50px', margin: '0 20px' }}>
      <div className="container">
        <h2 style={{ 
          fontSize: '36px', 
          fontWeight: '950', 
          textAlign: 'center', 
          marginBottom: '80px',
          color: '#111'
        }}>
          Chill At Home We Will <span style={{ color: '#A51C1C' }}>Take Care</span>
        </h2>
        
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '40px',
          justifyItems: 'center'
        }}>
          <FeatureItem 
            icon={Zap}
            title="Fastest Delivery"
            description="The majority have the best quality food and amazing offers."
          />
          <FeatureItem 
            icon={ClipboardList}
            title="Easy to Order"
            description="The majority have the best quality food and amazing offers."
          />
          <FeatureItem 
            icon={Map}
            title="Wide Coverage Map"
            description="The majority have the best quality food and amazing offers."
          />
          <FeatureItem 
            icon={UtensilsCrossed}
            title="More Than 160+ Dish"
            description="The majority have the best quality food and amazing offers."
          />
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
