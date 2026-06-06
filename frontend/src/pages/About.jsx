import React from 'react';
import { motion } from 'framer-motion';
import { Utensils, Users, Star, MapPin, CheckCircle, Heart, Zap, Shield, Target, Search, ArrowRight, ShoppingBag, Bike } from 'lucide-react';
import SectionTitle from '../components/SectionTitle';
import logoUrl from "../assets/logo.png";
import appPromoImg from "../assets/4.jpeg";
import phoneImg from "../assets/1.jpeg";

const StatItem = ({ label, value, icon: Icon }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    whileInView={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.6 }}
    style={{ textAlign: 'center', color: '#fff' }}
  >
    <div style={{ marginBottom: '20px', display: 'flex', justifyContent: 'center' }}>
      <div style={{ position: 'relative' }}>
        <div style={{ width: '30px', height: '30px', background: '#FFC244', borderRadius: '50%', position: 'absolute', top: '10px', left: '10px', zIndex: 0, opacity: 0.8 }}></div>
        <div style={{ position: 'relative', zIndex: 1 }}>
          <Icon size={40} strokeWidth={1.5} color="#fff" />
        </div>
      </div>
    </div>
    <h2 style={{ fontSize: '56px', fontWeight: '950', marginBottom: '5px', letterSpacing: '-2px' }}>{value}</h2>
    <p style={{ fontSize: '16px', fontWeight: '600', opacity: 0.8 }}>{label}</p>
  </motion.div>
);

const FeatureItem = ({ icon: Icon, title, description, highlights }) => {
  // Helper to highlight specific parts of the description
  const renderDescription = () => {
    if (!highlights) return description;
    let parts = [description];
    highlights.forEach(h => {
      const newParts = [];
      parts.forEach(p => {
        if (typeof p === 'string') {
          const split = p.split(h);
          split.forEach((s, i) => {
            newParts.push(s);
            if (i < split.length - 1) newParts.push(<span key={h+i} style={{ background: '#FFC244', padding: '0 4px', borderRadius: '4px', color: '#111' }}>{h}</span>);
          });
        } else {
          newParts.push(p);
        }
      });
      parts = newParts;
    });
    return parts;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      style={{ textAlign: 'center', color: '#fff', display: 'flex', flexDirection: 'column', alignItems: 'center' }}
    >
      <div style={{ position: 'relative', marginBottom: '30px' }}>
        <div style={{ width: '120px', height: '120px', background: '#FFC244', borderRadius: '50%', position: 'absolute', top: '10px', left: '10px', zIndex: 0, opacity: 0.9 }}></div>
        <div style={{ position: 'relative', zIndex: 1, width: '140px', height: '140px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon size={80} strokeWidth={1} color="#111" />
        </div>
      </div>
      <h3 style={{ fontSize: '28px', fontWeight: '900', marginBottom: '20px', color: '#fff' }}>{title}</h3>
      <p style={{ fontSize: '16px', lineHeight: '1.7', opacity: 0.9, maxWidth: '350px' }}>
        {renderDescription()}
      </p>
    </motion.div>
  );
};

const About = () => {
  return (
    <div style={{ background: '#A51C1C', minHeight: '100vh', paddingBottom: '120px' }}>
      {/* Hero Section */}
      <div style={{ padding: '180px 20px 80px' }}>
        <div className="container" style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <SectionTitle 
            title="The SpeedMeal Story"
            subtitle="More than just delivery. We are a community of food lovers dedicated to bringing the world's best flavors to your door."
            dark={true}
          />
        </div>
      </div>

      <div className="container" style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 20px' }}>
        
        {/* 1. Main Content with Featured Image */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', 
          gap: '60px',
          marginBottom: '120px',
          alignItems: 'center'
        }}>
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
          >
            <div style={{ 
              borderRadius: '50px', 
              overflow: 'hidden', 
              boxShadow: '0 50px 100px rgba(0,0,0,0.4)',
              border: '12px solid rgba(255,255,255,0.1)'
            }}>
              <img src={appPromoImg} alt="SpeedMeal Promo" style={{ width: '100%', display: 'block' }} />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            style={{ color: '#fff' }}
          >
            <h2 style={{ fontSize: '52px', fontWeight: '950', lineHeight: '1.05', marginBottom: '30px', letterSpacing: '-2.5px' }}>
              Delivering happiness, <br /> one meal at a time.
            </h2>
            <p style={{ fontSize: '19px', lineHeight: '1.8', opacity: 0.9, marginBottom: '35px' }}>
              At SpeedMeal, we believe that great food should be accessible, reliable, and delightful. 
              Our technology connects you with the best local kitchens, ensuring your favorites arrive fresh and fast.
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '45px' }}>
              {[
                "Ultra-fast Logistics",
                "Verified Restaurants",
                "24/7 Support Team",
                "Safe & Secure Payments"
              ].map((item, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <CheckCircle size={16} color="#A51C1C" />
                  </div>
                  <span style={{ fontWeight: '800', fontSize: '15px' }}>{item}</span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* 2. Glovo-style 3-Column Features Section */}
        <div style={{ marginBottom: '120px' }}>
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', 
            gap: '60px',
            marginTop: '60px'
          }}>
            <FeatureItem 
              icon={Utensils}
              title="Les meilleurs restaurants de votre ville"
              description="Avec un grand choix de restaurants, vous trouverez toujours votre plat préféré et découvrirez de nouveaux restaurants!"
              highlights={["découvrirez de nouveaux restaurants"]}
            />
            <FeatureItem 
              icon={Bike}
              title="Livraison rapide"
              description="Notre rapidité est notre fierté. Commandez ou envoyez ce que vous voulez dans votre ville et on vous livre en quelques minutes."
              highlights={["on vous livre en quelques minutes"]}
            />
            <FeatureItem 
              icon={ShoppingBag}
              title="Vos courses et bien plus"
              description="Trouvez tout ce qu'il vous faut ! Supermarchés, magasins, pharmacies, fleuristes... Si ça se trouve dans votre ville, commandez-le."
              highlights={["Supermarchés, magasins, pharmacies, fleuristes..."]}
            />
          </div>
        </div>



        {/* 5. Impact Numbers Section */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
          gap: '40px',
          padding: '100px 0',
          marginTop: '60px'
        }}>
          <StatItem icon={MapPin} value="23" label="Countries" />
          <StatItem icon={Bike} value="120K" label="Monthly couriers" />
          <StatItem icon={Utensils} value="150K" label="Monthly local stores" />
          <StatItem icon={ShoppingBag} value="3K" label="Employees" />
        </div>

      </div>
    </div>
  );
};

export default About;
