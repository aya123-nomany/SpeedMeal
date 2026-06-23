import React from 'react';
import { motion } from 'framer-motion';
import SectionTitle from './SectionTitle';
import { ShoppingBag, Bike, Store } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const OpportunityCard = ({ title, description, icon: Icon, buttonText, delay, onClick }) => (
  <motion.div 
    initial={{ opacity: 0, y: 30 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    transition={{ duration: 0.6, delay }}
    style={{
      background: '#fff',
      padding: '50px 40px',
      borderRadius: '35px',
      boxShadow: '0 20px 40px rgba(0,0,0,0.03)',
      textAlign: 'center',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      border: '1px solid #f8f8f8',
      height: '100%',
      transition: '0.3s'
    }}
  >
    <div style={{
      width: '100px',
      height: '100px',
      borderRadius: '50%',
      background: '#FFF9E6',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: '#FFC244',
      marginBottom: '30px',
      border: '1px solid #FFEBB0'
    }}>
      <Icon size={45} />
    </div>
    
    <h3 style={{ fontSize: '24px', fontWeight: '900', marginBottom: '15px', color: '#111' }}>
      {title}
    </h3>
    
    <p style={{ fontSize: '15px', color: '#888', marginBottom: '35px', lineHeight: '1.6', flex: 1 }}>
      {description}
    </p>
    
    <button 
      onClick={onClick}
      style={{ 
        width: '100%',
        backgroundColor: '#A51C1C',
        color: 'white', 
        padding: '18px', 
        borderRadius: '999px',
        fontSize: '15px',
        fontWeight: '800',
        border: 'none',
        cursor: 'pointer',
        transition: '0.3s'
      }}
      onMouseEnter={(e) => e.target.style.background = '#E03E22'}
      onMouseLeave={(e) => e.target.style.background = '#A51C1C'}
    >
      {buttonText}
    </button>
  </motion.div>
);

const PartnerSection = () => {
  const navigate = useNavigate();

  return (
    <section style={{ padding: '80px 0', background: '#fff' }}>
      <div className="container">
        <SectionTitle 
          title="Votre opportunité de réussir"
          subtitle="Vous êtes commerçant, restaurateur ou entrepreneur ? Nous sommes là pour vous accompagner, pas à pas."
        />

        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(min(300px, 100%), 1fr))', 
          gap: '30px'
        }}>
          <OpportunityCard 
            icon={ShoppingBag}
            title="Commandez maintenant"
            description="Faites-vous livrer vos plats préférés et vos courses en un rien de temps."
            buttonText="Commandez maintenant"
            delay={0.1}
            onClick={() => navigate('/menu')}
          />
          <OpportunityCard 
            icon={Bike}
            title="Devenez livreur"
            description="Générez vos propres revenus et choisissez les horaires qui vous conviennent."
            buttonText="Commencez maintenant"
            delay={0.2}
            onClick={() => navigate('/delivery')}
          />
          <OpportunityCard 
            icon={Store}
            title="Devenez partenaire"
            description="Rejoignez SpeedMeal et faites découvrir vos services à encore plus de clients."
            buttonText="Commencez maintenant"
            delay={0.3}
            onClick={() => navigate('/partner')}
          />
        </div>
      </div>
    </section>
  );
};

export default PartnerSection;
