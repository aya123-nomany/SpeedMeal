import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Minus } from 'lucide-react';
import SectionTitle from './SectionTitle';

const faqData = [
  {
    question: "Qu'est-ce que SpeedMeal ?",
    answer: "SpeedMeal est la plateforme de livraison leader au Maroc, connectant les meilleurs restaurants locaux avec des clients gourmands en un temps record."
  },
  {
    question: "Quels sont les modes de paiement ?",
    answer: "Nous acceptons le paiement en espèces à la livraison, ainsi que les cartes bancaires nationales et internationales via notre partenaire de paiement sécurisé."
  },
  {
    question: "Comment puis-je devenir livreur ?",
    answer: "C'est très simple ! Cliquez sur le bouton 'Devenir livreur' dans la barre de navigation, remplissez le formulaire et notre équipe vous contactera dans les 24 heures."
  },
  {
    question: "Puis-je suivre ma commande en temps réel ?",
    answer: "Absolument. Une fois votre commande validée, vous pouvez suivre chaque étape, de la préparation en cuisine jusqu'à l'arrivée du livreur à votre porte."
  }
];

const FAQItem = ({ question, answer }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div style={{ 
      background: '#fff', 
      borderRadius: '20px', 
      marginBottom: '15px',
      border: '1px solid #f0f0f0',
      transition: '0.3s'
    }}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        style={{ 
          width: '100%', 
          padding: '20px 25px', 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          background: 'none', 
          border: 'none', 
          cursor: 'pointer',
          textAlign: 'left'
        }}
      >
        <span style={{ fontSize: '15px', fontWeight: '800', color: '#111' }}>
          {question}
        </span>
        <Plus size={18} style={{ 
          transform: isOpen ? 'rotate(45deg)' : 'rotate(0deg)',
          transition: '0.3s',
          color: '#888'
        }} />
      </button>
      
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            style={{ overflow: 'hidden' }}
          >
            <div style={{ padding: '0 25px 20px', color: '#666', fontSize: '14px', lineHeight: '1.6' }}>
              {answer}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const FAQSection = () => {
  return (
    <section style={{ padding: '80px 0', background: '#fff' }}>
      <div className="container">
        <SectionTitle 
          title="Questions Fréquentes"
          subtitle="Tout ce que vous devez savoir sur SpeedMeal et nos services."
        />

        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', 
          gap: '20px',
          marginBottom: '50px'
        }}>
          {faqData.map((item, idx) => (
            <FAQItem key={idx} {...item} />
          ))}
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
            Voir toutes les questions
          </button>
        </div>
      </div>
    </section>
  );
};

export default FAQSection;
