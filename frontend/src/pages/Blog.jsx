import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import SectionTitle from '../components/SectionTitle';
import { Search, Calendar, ChevronRight } from 'lucide-react';
import logoUrl from "../assets/logo.png";

// Our blog posts data with ids
const blogPostsData = [
  {
    id: 1,
    image: "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&q=80&w=1981",
    title: "The Impact of Fast Food Culture Worldwide: Challenges and Opportunities",
    excerpt: "In recent decades, the rise of fast food culture has taken the world by storm, changing how we eat and live. Explore the complex landscape of global fast food.",
    date: "7 June 2024",
    category: "Culture"
  },
  {
    id: 2,
    image: "https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?auto=format&fit=crop&q=80&w=2070",
    title: "Fast Food deliveries still booming despite restaurant reopening",
    excerpt: "People are still ordering millions of fast foods despite restaurants reopening their doors. Discover why convenience remains king.",
    date: "7 June 2024",
    category: "Trends"
  },
  {
    id: 3,
    image: "https://images.unsplash.com/photo-1467003909585-2f8a72700288?auto=format&fit=crop&q=80&w=1974",
    title: "How SpeedMeal Optimizes Real-Time Logistics",
    excerpt: "A behind-the-scenes look at the algorithms that keep your food hot and our riders safe on the road in any weather condition.",
    date: "15 June 2024",
    category: "Tech"
  },
  {
    id: 4,
    image: "https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&q=80&w=2070",
    title: "The Art of Perfect Pizza: A Journey Through Italian Cuisine",
    excerpt: "From Naples to your table, discover what makes a truly exceptional pizza and how to recognize quality ingredients.",
    date: "10 June 2024",
    category: "Food Guide"
  },
  {
    id: 5,
    image: "https://images.unsplash.com/photo-1551782450-17144efb9c50?auto=format&fit=crop&q=80&w=2069",
    title: "Healthy Eating on the Go: Balanced Choices for Busy Lives",
    excerpt: "Eating healthy doesn't mean sacrificing taste. Explore nutritious fast-casual options that fuel your day without slowing you down.",
    date: "12 June 2024",
    category: "Health"
  },
  {
    id: 6,
    image: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&q=80&w=2070",
    title: "Moroccan Street Food: A Culinary Adventure Through the Medina",
    excerpt: "Explore the vibrant world of Moroccan street food, from tagines to pastillas, and discover the stories behind these iconic dishes.",
    date: "18 June 2024",
    category: "Culture"
  },
  {
    id: 7,
    image: "https://as1.ftcdn.net/v2/jpg/07/96/08/70/1000_F_796087085_HQMaexJWZUvAw8GXQfV8uHkB5rvlrXCE.jpg",
    title: "The Future of Food Delivery: AI and Automation Trends",
    excerpt: "From predictive ordering to delivery drones, technology is reshaping how we get our food. Learn what's coming next.",
    date: "20 June 2024",
    category: "Tech"
  },
  {
    id: 8,
    image: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&q=80&w=2080",
    title: "Sustainable Packaging: The Green Revolution in Food Delivery",
    excerpt: "How the industry is moving away from single-use plastics and toward eco-friendly solutions for a greener planet.",
    date: "22 June 2024",
    category: "Sustainability"
  },
  {
    id: 9,
    image: "https://images.unsplash.com/photo-1490645935967-10de6ba17061?auto=format&fit=crop&q=80&w=2053",
    title: "Perfect Coffee Pairings: Elevate Your Food Experience",
    excerpt: "Discover which coffee varieties complement different dishes, from breakfast pastries to dinner desserts.",
    date: "25 June 2024",
    category: "Food Guide"
  }
];

const BlogCard = ({ image, title, excerpt, date, category, id, index }) => {
  const navigate = useNavigate();
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      whileHover={{ y: -10 }}
      onClick={() => navigate(`/blog/${id}`)}
      style={{
        background: '#fff',
        borderRadius: '25px',
        overflow: 'hidden',
        border: '1px solid #E5E7EB',
        boxShadow: '0 10px 30px rgba(0,0,0,0.05)',
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        cursor: 'pointer'
      }}
    >
      <div style={{ height: '240px', overflow: 'hidden', position: 'relative' }}>
        <img src={image} alt={title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        {/* Brand Badge on Image */}
        <div style={{ 
          position: 'absolute', 
          top: '15px', 
          left: '15px', 
          background: '#fff', 
          padding: '5px 12px', 
          borderRadius: '12px',
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          boxShadow: '0 4px 10px rgba(0,0,0,0.1)'
        }}>
          <img src={logoUrl} alt="logo" style={{ height: '18px' }} />
          <span style={{ fontWeight: '800', fontSize: '12px', color: '#111' }}>SpeedMeal</span>
        </div>
        {/* Category Badge */}
        <div style={{ 
          position: 'absolute', 
          top: '15px', 
          right: '15px', 
          background: '#A51C1C', 
          color: '#fff',
          padding: '5px 12px', 
          borderRadius: '12px',
          fontWeight: '800',
          fontSize: '12px'
        }}>
          {category}
        </div>
      </div>
      <div style={{ padding: '25px', display: 'flex', flexDirection: 'column', flex: 1 }}>
        <h3 style={{ 
          fontSize: '22px', 
          fontWeight: '900', 
          color: '#111', 
          marginBottom: '15px', 
          lineHeight: '1.2',
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden'
        }}>
          {title}
        </h3>
        <p style={{ 
          color: '#4B5563', 
          fontSize: '15px', 
          lineHeight: '1.6', 
          marginBottom: '20px',
          display: '-webkit-box',
          WebkitLineClamp: 3,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
          flex: 1
        }}>
          {excerpt}
        </p>
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between'
        }}>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '6px', 
            color: '#A51C1C', 
            fontWeight: '900', 
            fontSize: '15px' 
          }}>
            <Calendar size={16} />
            {date}
          </div>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '4px', 
            color: '#A51C1C', 
            fontWeight: '700', 
            fontSize: '14px' 
          }}>
            Read More
            <ChevronRight size={16} />
          </div>
        </div>
      </div>
    </motion.div>
  );
};

const Blog = () => {
  return (
    <div style={{ background: '#A51C1C', minHeight: '100vh', paddingBottom: '100px' }}>
      {/* Hero Section */}
      <div style={{ padding: '180px 20px 60px' }}>
        <div className="container" style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <SectionTitle 
            title="Blog"
            subtitle="Discover the latest trends in food tech, restaurant guides, and the stories behind your favorite meals."
            dark={true}
          />

          {/* Search Bar - Directly on Red */}
          <div style={{ position: 'relative', maxWidth: '700px', margin: '40px auto 0' }}>
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              background: '#fff', 
              borderRadius: '999px', 
              padding: '18px 30px',
              boxShadow: '0 20px 40px rgba(0,0,0,0.15)'
            }}>
              <Search size={22} style={{ color: '#888', marginRight: '20px' }} />
              <input 
                type="text" 
                placeholder="Search articles, recipes, or guides..." 
                style={{ width: '100%', border: 'none', outline: 'none', fontSize: '18px', fontWeight: '500', background: 'transparent', color: '#111' }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Blog Grid Area */}
      <div className="container" style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 20px' }}>
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', 
          gap: '30px' 
        }}>
          {blogPostsData.map((post, index) => (
            <BlogCard 
              key={post.id}
              id={post.id}
              image={post.image}
              title={post.title}
              excerpt={post.excerpt}
              date={post.date}
              category={post.category}
              index={index}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default Blog;
