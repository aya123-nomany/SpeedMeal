import React from 'react';
import { motion } from 'framer-motion';
import SectionTitle from '../components/SectionTitle';

const Contact = () => {
  return (
    <div style={{ background: '#fff' }}>
      {/* Red Header Section with Form */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        style={{ 
          minHeight: 'auto', 
          background: '#A51C1C', 
          padding: '180px 20px 150px',
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        <div className="container" style={{ position: 'relative', zIndex: 1, maxWidth: '1000px', margin: '0 auto' }}>
          <SectionTitle 
            title="Get in touch"
            subtitle="Contact our dedicated support teams who understand your specific needs and can provide personalized assistance."
            dark={true}
          />

          {/* Form Card */}
          <div style={{ position: 'relative' }}>
            <motion.div
              initial={{ y: 30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              style={{
                background: '#fff',
                borderRadius: '40px',
                padding: '60px',
                border: '2px solid #FFC244', 
                boxShadow: '0 40px 100px rgba(0,0,0,0.1)',
                position: 'relative',
                zIndex: 1
              }}
            >
              <form style={{ display: 'grid', gap: '30px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                  <div>
                    <label style={{ display: 'block', fontWeight: '800', marginBottom: '12px', color: '#1a1a1a' }}>First Name</label>
                    <input 
                      type="text" 
                      placeholder="Enter first name" 
                      style={{ width: '100%', padding: '20px 28px', borderRadius: '999px', border: '1px solid #eee', background: '#fcfcfc', fontSize: '15px', outline: 'none' }} 
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontWeight: '800', marginBottom: '12px', color: '#1a1a1a' }}>Last Name</label>
                    <input 
                      type="text" 
                      placeholder="Enter last name" 
                      style={{ width: '100%', padding: '20px 28px', borderRadius: '999px', border: '1px solid #eee', background: '#fcfcfc', fontSize: '15px', outline: 'none' }} 
                    />
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontWeight: '800', marginBottom: '12px', color: '#1a1a1a' }}>Email Address</label>
                  <input 
                    type="email" 
                    placeholder="Enter email address" 
                    style={{ width: '100%', padding: '20px 28px', borderRadius: '999px', border: '1px solid #eee', background: '#fcfcfc', fontSize: '15px', outline: 'none' }} 
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontWeight: '800', marginBottom: '12px', color: '#1a1a1a' }}>Subject</label>
                  <input 
                    type="text" 
                    placeholder="Enter subject" 
                    style={{ width: '100%', padding: '20px 28px', borderRadius: '999px', border: '1px solid #eee', background: '#fcfcfc', fontSize: '15px', outline: 'none' }} 
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontWeight: '800', marginBottom: '12px', color: '#1a1a1a' }}>Message</label>
                  <textarea 
                    placeholder="Type your message" 
                    style={{ width: '100%', padding: '25px 30px', borderRadius: '35px', border: '1px solid #eee', background: '#fcfcfc', fontSize: '15px', outline: 'none', minHeight: '180px', resize: 'none' }} 
                  ></textarea>
                </div>

                <div style={{ textAlign: 'left' }}>
                  <button style={{ 
                    background: '#A51C1C', 
                    color: '#fff', 
                    padding: '22px 50px', 
                    borderRadius: '999px', 
                    border: 'none', 
                    fontWeight: '950', 
                    fontSize: '18px',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }} onMouseEnter={(e) => e.target.style.transform = 'translateY(-3px)'} onMouseLeave={(e) => e.target.style.transform = 'translateY(0)'}>
                    Submit Message
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        </div>
      </motion.div>

      {/* Map Section - Full Width */}
      <section style={{ padding: '0', background: '#fff' }}>
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          style={{ 
            width: '100%',
            height: '550px',
            overflow: 'hidden'
          }}
        >
          <iframe 
            src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d106362.45733519803!2d-7.669394541796875!3d33.58331180000001!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0xda7cd4778daa113%3A0x1d006e27094612ad!2sCasablanca!5e0!3m2!1sen!2sma!4v1715243500000!5m2!1sen!2sma" 
            width="100%" 
            height="100%" 
            style={{ border: 0 }} 
            allowFullScreen="" 
            loading="lazy" 
            referrerPolicy="no-referrer-when-downgrade"
          ></iframe>
        </motion.div>
      </section>
    </div>
  );
};

export default Contact;
