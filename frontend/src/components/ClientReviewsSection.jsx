import React, { useState } from 'react';
import { Star, ChevronLeft, ChevronRight, Quote } from 'lucide-react';
import { motion } from 'framer-motion';

// Sample reviews data
const REVIEWS = [
  {
    id: 1,
    name: 'Ahmed Benali',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Ahmed',
    rating: 5,
    text: 'Service incroyable ! La livraison a été super rapide et le burger était délicieux. Je recommande à 100% !',
    restaurant: 'The Burger Company'
  },
  {
    id: 2,
    name: 'Sarah El Amrani',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah',
    rating: 5,
    text: 'Les pizzas sont les meilleures de la ville ! Fraîches et savoureuses. Je commande chaque week-end !',
    restaurant: 'Pizza Paradise'
  },
  {
    id: 3,
    name: 'Youssef Chraibi',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Youssef',
    rating: 4,
    text: 'Très bonne expérience ! Le sushi était frais et le service client très réactif. Je reviendrai !',
    restaurant: 'Sushi Master'
  },
  {
    id: 4,
    name: 'Fatima Zaki',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Fatima',
    rating: 5,
    text: 'Wow ! Les tacos sont absolument délicieux. Livraison en moins de 30 minutes, parfait !',
    restaurant: 'Taco Fiesta'
  },
];

export default function ClientReviewsSection() {
  const [currentIndex, setCurrentIndex] = useState(0);

  const next = () => {
    setCurrentIndex((prev) => (prev + 1) % REVIEWS.length);
  };

  const prev = () => {
    setCurrentIndex((prev) => (prev - 1 + REVIEWS.length) % REVIEWS.length);
  };

  return (
    <section style={{ padding: '80px 20px', background: '#fff4ee' }}>
      <style>{`
        .reviews-nav-btn-left {
          position: absolute;
          top: 50%;
          left: -60px;
          transform: translateY(-50%);
        }
        .reviews-nav-btn-right {
          position: absolute;
          top: 50%;
          right: -60px;
          transform: translateY(-50%);
        }
        @media (max-width: 900px) {
          .reviews-nav-btn-left {
            left: -18px !important;
            width: 38px !important;
            height: 38px !important;
          }
          .reviews-nav-btn-right {
            right: -18px !important;
            width: 38px !important;
            height: 38px !important;
          }
        }
        @media (max-width: 600px) {
          .reviews-card {
            padding: 30px 20px !important;
          }
          .reviews-nav-btn-left, .reviews-nav-btn-right {
            display: none !important;
          }
          .reviews-mobile-nav {
            display: flex !important;
          }
        }
      `}</style>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '50px' }}>
          <h2 style={{ fontSize: 'clamp(26px, 4vw, 48px)', fontWeight: '950', color: '#111', marginBottom: '10px' }}>
            Ce que disent nos clients
          </h2>
          <p style={{ color: '#666', fontSize: '16px' }}>Des expériences réelles, des avis authentiques</p>
        </div>

        <div style={{ position: 'relative', maxWidth: '900px', margin: '0 auto' }}>
          <motion.div
            key={currentIndex}
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            transition={{ duration: 0.4 }}
            className="reviews-card"
            style={{
              background: '#fff',
              borderRadius: '24px',
              padding: '50px',
              boxShadow: '0 10px 40px rgba(0,0,0,0.08)',
              position: 'relative'
            }}
          >
            <Quote size={48} color="#A51C1C" style={{ position: 'absolute', top: '20px', left: '30px', opacity: 0.1 }} />
            
            <div style={{ display: 'flex', justifyContent: 'center', gap: '6px', marginBottom: '24px' }}>
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  size={24}
                  fill={i < REVIEWS[currentIndex].rating ? '#FFD700' : 'none'}
                  color={i < REVIEWS[currentIndex].rating ? '#FFD700' : '#ddd'}
                />
              ))}
            </div>

            <p style={{
              fontSize: 'clamp(15px, 2vw, 20px)',
              lineHeight: '1.7',
              color: '#333',
              marginBottom: '30px',
              fontStyle: 'italic',
              textAlign: 'center'
            }}>
              "{REVIEWS[currentIndex].text}"
            </p>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '16px' }}>
              <img
                src={REVIEWS[currentIndex].avatar}
                alt={REVIEWS[currentIndex].name}
                style={{ width: '60px', height: '60px', borderRadius: '50%', border: '3px solid #A51C1C', flexShrink: 0 }}
              />
              <div style={{ textAlign: 'left' }}>
                <h4 style={{ margin: 0, fontSize: '18px', fontWeight: '800', color: '#111' }}>
                  {REVIEWS[currentIndex].name}
                </h4>
                <p style={{ margin: '4px 0 0', color: '#A51C1C', fontSize: '14px', fontWeight: '600' }}>
                  {REVIEWS[currentIndex].restaurant}
                </p>
              </div>
            </div>
          </motion.div>

          {/* Desktop nav buttons */}
          <button
            onClick={prev}
            className="reviews-nav-btn-left"
            style={{
              background: '#A51C1C', color: '#fff', border: 'none', borderRadius: '50%',
              width: '50px', height: '50px', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 4px 15px rgba(165,28,28,0.3)', transition: 'transform 0.2s'
            }}
          >
            <ChevronLeft size={24} />
          </button>

          <button
            onClick={next}
            className="reviews-nav-btn-right"
            style={{
              background: '#A51C1C', color: '#fff', border: 'none', borderRadius: '50%',
              width: '50px', height: '50px', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 4px 15px rgba(165,28,28,0.3)', transition: 'transform 0.2s'
            }}
          >
            <ChevronRight size={24} />
          </button>

          {/* Mobile nav buttons (visible only on small screens) */}
          <div className="reviews-mobile-nav" style={{
            display: 'none', justifyContent: 'center', gap: '16px', marginTop: '20px'
          }}>
            <button onClick={prev} style={{ background: '#A51C1C', color: '#fff', border: 'none', borderRadius: '50%', width: '44px', height: '44px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ChevronLeft size={20} />
            </button>
            <button onClick={next} style={{ background: '#A51C1C', color: '#fff', border: 'none', borderRadius: '50%', width: '44px', height: '44px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ChevronRight size={20} />
            </button>
          </div>

          {/* Indicators */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', marginTop: '24px' }}>
            {REVIEWS.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentIndex(i)}
                style={{
                  width: i === currentIndex ? '30px' : '10px',
                  height: '10px', borderRadius: '20px', border: 'none',
                  background: i === currentIndex ? '#A51C1C' : '#ddd',
                  cursor: 'pointer', transition: 'all 0.3s'
                }}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
