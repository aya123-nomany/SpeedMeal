import React from 'react';
import { motion } from 'framer-motion';

const SparkleIcon = () => (
  <svg 
    width="40" 
    height="40" 
    viewBox="0 0 40 40" 
    fill="none" 
    xmlns="http://www.w3.org/2000/svg"
    style={{ position: 'absolute', top: '-25px', left: '-30px' }}
  >
    <motion.path 
      initial={{ pathLength: 0, opacity: 0 }}
      whileInView={{ pathLength: 1, opacity: 1 }}
      d="M10 25C10 25 8 22 5 22" 
      stroke="#FFC244" 
      strokeWidth="4" 
      strokeLinecap="round"
    />
    <motion.path 
      initial={{ pathLength: 0, opacity: 0 }}
      whileInView={{ pathLength: 1, opacity: 1 }}
      transition={{ delay: 0.1 }}
      d="M12 18C12 18 10 14 8 12" 
      stroke="#FFC244" 
      strokeWidth="4" 
      strokeLinecap="round"
    />
    <motion.path 
      initial={{ pathLength: 0, opacity: 0 }}
      whileInView={{ pathLength: 1, opacity: 1 }}
      transition={{ delay: 0.2 }}
      d="M18 14C18 14 20 10 22 8" 
      stroke="#FFC244" 
      strokeWidth="4" 
      strokeLinecap="round"
    />
  </svg>
);

const SectionTitle = ({ title, subtitle, center = true, dark = false }) => {
  return (
    <div style={{ 
      textAlign: center ? 'center' : 'left', 
      marginBottom: '60px',
      position: 'relative',
      display: 'inline-block',
      width: '100%'
    }}>
      <div style={{ 
        position: 'relative', 
        display: 'inline-block' 
      }}>
        <SparkleIcon />
        <h2 style={{ 
          fontSize: '56px', 
          fontWeight: '900', 
          color: dark ? '#fff' : '#111', 
          lineHeight: '1',
          marginBottom: '16px',
          letterSpacing: '-2px'
        }}>
          {title}
        </h2>
      </div>
      {subtitle && (
        <p style={{ 
          fontSize: '18px', 
          color: dark ? '#aaa' : '#666', 
          maxWidth: '600px', 
          margin: center ? '0 auto' : '0',
          lineHeight: '1.6'
        }}>
          {subtitle}
        </p>
      )}
    </div>
  );
};

export default SectionTitle;
