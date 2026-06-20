import React from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ChevronLeft, Calendar } from 'lucide-react';

// Our blog posts data (same as in Blog.jsx)
const blogPosts = [
  {
    id: 1,
    image: "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&q=80&w=1981",
    title: "The Impact of Fast Food Culture Worldwide: Challenges and Opportunities",
    excerpt: "In recent decades, the rise of fast food culture has taken the world by storm, changing how we eat and live. Explore the complex landscape of global fast food.",
    date: "7 June 2024",
    category: "Culture",
    content: `
      <p>Fast food has become a global phenomenon, transforming dining habits across continents. What began as a convenient alternative to home cooking has evolved into a cultural force that shapes economies, communities, and health outcomes worldwide.</p>
      <h3>The Global Spread</h3>
      <p>From the bustling streets of New York to the vibrant markets of Marrakech, fast food establishments have become ubiquitous. Brands that started as small local businesses have grown into multinational corporations, adapting their menus to suit local tastes while maintaining their core identities.</p>
      <h3>Challenges and Opportunities</h3>
      <p>The rise of fast food presents both challenges and opportunities. While concerns about nutrition and sustainability persist, there is also innovation in healthier options, local sourcing, and community engagement. The industry continues to evolve, responding to changing consumer preferences and global trends.</p>
      <h3>Looking Ahead</h3>
      <p>As technology advances and consumer awareness grows, the fast food industry faces new opportunities to create positive change. From sustainable packaging to plant-based alternatives, the future promises exciting developments in how we think about fast, convenient food.</p>
    `
  },
  {
    id: 2,
    image: "https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?auto=format&fit=crop&q=80&w=2070",
    title: "Fast Food deliveries still booming despite restaurant reopening",
    excerpt: "People are still ordering millions of fast foods despite restaurants reopening their doors. Discover why convenience remains king.",
    date: "7 June 2024",
    category: "Trends",
    content: `
      <p>The pandemic accelerated the adoption of food delivery services, and this trend shows no signs of slowing down. Even as restaurants reopen their dining rooms, millions of customers continue to order meals to their homes and offices.</p>
      <h3>Why Delivery Remains King</h3>
      <p>Convenience is the primary driver. With busy lifestyles and the ease of ordering with a few taps on a smartphone, delivery has become the preferred choice for many. Additionally, the comfort and safety of home dining continue to appeal to consumers.</p>
      <h3>The Technology Behind It</h3>
      <p>Advancements in logistics technology have made delivery faster and more reliable. From real-time tracking to optimized routing, technology ensures that meals arrive hot and fresh at your doorstep.</p>
    `
  },
  {
    id: 3,
    image: "https://images.unsplash.com/photo-1467003909585-2f8a72700288?auto=format&fit=crop&q=80&w=1974",
    title: "How SpeedMeal Optimizes Real-Time Logistics",
    excerpt: "A behind-the-scenes look at the algorithms that keep your food hot and our riders safe on the road in any weather condition.",
    date: "15 June 2024",
    category: "Tech",
    content: `
      <p>Have you ever wondered how your food arrives so quickly and stays at the perfect temperature? Let's take a behind-the-scenes look at the technology and logistics that power SpeedMeal's delivery service.</p>
      <h3>Real-Time Optimization</h3>
      <p>Our algorithms constantly analyze traffic, weather, and order volume to find the optimal routes for our delivery partners. This ensures that your meal arrives in the shortest time possible while maintaining quality.</p>
      <h3>Safety First</h3>
      <p>Safety is our top priority. We provide our riders with real-time weather updates, safe route suggestions, and comprehensive insurance coverage. Our technology also monitors delivery times to prevent rushing.</p>
    `
  },
  {
    id: 4,
    image: "https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&q=80&w=2070",
    title: "The Art of Perfect Pizza: A Journey Through Italian Cuisine",
    excerpt: "From Naples to your table, discover what makes a truly exceptional pizza and how to recognize quality ingredients.",
    date: "10 June 2024",
    category: "Food Guide",
    content: `
      <p>Pizza is more than just food—it's a cultural icon with a rich history dating back centuries. Let's explore what makes authentic Italian pizza so special and how you can recognize quality.</p>
      <h3>The Neapolitan Tradition</h3>
      <p>Authentic Neapolitan pizza follows strict traditions. From the wood-fired oven to the San Marzano tomatoes and buffalo mozzarella, every detail matters in creating the perfect pie.</p>
      <h3>Modern Interpretations</h3>
      <p>While tradition is important, pizza has evolved to include creative toppings and fusion styles. From Moroccan-spiced pizzas to vegan options, there's something for everyone to enjoy.</p>
    `
  },
  {
    id: 5,
    image: "https://images.unsplash.com/photo-1551782450-17144efb9c50?auto=format&fit=crop&q=80&w=2069",
    title: "Healthy Eating on the Go: Balanced Choices for Busy Lives",
    excerpt: "Eating healthy doesn't mean sacrificing taste. Explore nutritious fast-casual options that fuel your day without slowing you down.",
    date: "12 June 2024",
    category: "Health",
    content: `
      <p>In today's fast-paced world, eating healthy can feel challenging. But with the right choices, you can enjoy nutritious, delicious meals even when you're on the go.</p>
      <h3>Smart Swaps</h3>
      <p>Small changes can make a big difference. Choose grilled over fried, opt for whole grains, and load up on vegetables. Many restaurants now offer lighter menu options that are both satisfying and healthy.</p>
      <h3>Hydration and Balance</h3>
      <p>Remember to stay hydrated and aim for balanced meals that include protein, healthy fats, and complex carbohydrates. This keeps you energized throughout your busy day.</p>
    `
  },
  {
    id: 6,
    image: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&q=80&w=2070",
    title: "Moroccan Street Food: A Culinary Adventure Through the Medina",
    excerpt: "Explore the vibrant world of Moroccan street food, from tagines to pastillas, and discover the stories behind these iconic dishes.",
    date: "18 June 2024",
    category: "Culture",
    content: `
      <p>Moroccan street food is a feast for the senses. The medinas come alive with the aromas of spices, grilled meats, and fresh bread. Let's take a culinary journey through this vibrant food culture.</p>
      <h3>Iconic Dishes</h3>
      <p>From the sizzling harira soup to the sweet and savory pastilla, Moroccan street food offers incredible variety. Don't miss the fresh orange juice stands or the msemen flatbreads cooked on street corners.</p>
      <h3>The Social Aspect</h3>
      <p>Street food in Morocco is more than just food—it's a social experience. Vendors call out their offerings, friends gather to share plates, and the atmosphere is electric with energy and conversation.</p>
    `
  },
  {
    id: 7,
    image: "https://as1.ftcdn.net/v2/jpg/07/96/08/70/1000_F_796087085_HQMaexJWZUvAw8GXQfV8uHkB5rvlrXCE.jpg",
    title: "The Future of Food Delivery: AI and Automation Trends",
    excerpt: "From predictive ordering to delivery drones, technology is reshaping how we get our food. Learn what's coming next.",
    date: "20 June 2024",
    category: "Tech",
    content: `
      <p>Technology is revolutionizing the food delivery industry. Let's look at the innovations that are shaping the future of how we order and receive our meals.</p>
      <h3>Predictive Ordering</h3>
      <p>AI algorithms can now predict what you might want to order before you even open the app. Based on your preferences and order history, these systems offer personalized recommendations.</p>
      <h3>Delivery Innovations</h3>
      <p>From autonomous delivery robots to drone delivery trials, the future promises exciting new ways to get food to your doorstep quickly and efficiently.</p>
    `
  },
  {
    id: 8,
    image: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&q=80&w=2080",
    title: "Sustainable Packaging: The Green Revolution in Food Delivery",
    excerpt: "How the industry is moving away from single-use plastics and toward eco-friendly solutions for a greener planet.",
    date: "22 June 2024",
    category: "Sustainability",
    content: `
      <p>Sustainability is a growing concern in the food industry. Let's explore how delivery services are reducing their environmental impact through innovative packaging solutions.</p>
      <h3>The Problem with Plastic</h3>
      <p>Single-use plastics contribute significantly to pollution. Recognizing this, many restaurants and delivery platforms are seeking alternatives.</p>
      <h3>Green Solutions</h3>
      <p>From compostable containers to reusable packaging programs, innovative solutions are emerging. Some companies are even exploring edible packaging options!</p>
    `
  },
  {
    id: 9,
    image: "https://images.unsplash.com/photo-1490645935967-10de6ba17061?auto=format&fit=crop&q=80&w=2053",
    title: "Perfect Coffee Pairings: Elevate Your Food Experience",
    excerpt: "Discover which coffee varieties complement different dishes, from breakfast pastries to dinner desserts.",
    date: "25 June 2024",
    category: "Food Guide",
    content: `
      <p>Pairing coffee with food is an art. The right combination can elevate both the drink and the meal, creating a memorable dining experience.</p>
      <h3>Breakfast Pairings</h3>
      <p>Start your day right! A bright, acidic Ethiopian pairs beautifully with pastries, while a full-bodied Brazilian complements hearty breakfasts.</p>
      <h3>Dessert Combinations</h3>
      <p>For chocolate desserts, try a rich Sumatran. With fruit-based sweets, a floral Kenyan coffee works wonders.</p>
    `
  }
];

const BlogDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const post = blogPosts.find(p => p.id === Number(id));

  if (!post) {
    return (
      <div style={{ 
        minHeight: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        background: '#fff'
      }}>
        <div style={{ textAlign: 'center' }}>
          <h2 style={{ fontSize: '24px', marginBottom: '16px' }}>Blog post not found</h2>
          <Link to="/blog" style={{ color: '#A51C1C', fontWeight: '700', textDecoration: 'none' }}>
            Back to blog
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div style={{ background: '#fff', minHeight: '100vh' }}>
      {/* Header */}
      <div style={{ 
        background: '#A51C1C', 
        padding: '120px 20px 40px',
        color: '#fff'
      }}>
        <div style={{ maxWidth: '900px', margin: '0 auto' }}>
          <button 
            onClick={() => navigate('/blog')}
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '8px', 
              background: 'transparent', 
              border: 'none', 
              color: '#fff',
              fontWeight: '700',
              cursor: 'pointer',
              marginBottom: '24px'
            }}
          >
            <ChevronLeft size={18} />
            Back to Blog
          </button>
          <div style={{ 
            display: 'flex', 
            gap: '12px', 
            alignItems: 'center', 
            marginBottom: '16px'
          }}>
            <span style={{ 
              background: 'rgba(255,255,255,0.2)', 
              padding: '4px 12px', 
              borderRadius: '999px',
              fontSize: '14px',
              fontWeight: '700'
            }}>
              {post.category}
            </span>
            <span style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '6px',
              opacity: '0.9'
            }}>
              <Calendar size={14} />
              {post.date}
            </span>
          </div>
          <h1 style={{ fontSize: '42px', fontWeight: '900', lineHeight: '1.2', margin: 0 }}>
            {post.title}
          </h1>
        </div>
      </div>

      {/* Content */}
      <div style={{ maxWidth: '900px', margin: '0 auto', padding: '40px 20px' }}>
        <motion.img 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          src={post.image}
          alt={post.title}
          style={{ 
            width: '100%', 
            height: '400px', 
            objectFit: 'cover', 
            borderRadius: '24px', 
            marginBottom: '32px',
            boxShadow: '0 10px 40px rgba(0,0,0,0.1)'
          }}
        />

        <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            style={{ 
                fontSize: '18px', 
                lineHeight: '1.8', 
                color: '#333',
                paddingBottom: '100px'
            }}
            dangerouslySetInnerHTML={{ __html: post.content }}
        />
      </div>
    </div>
  );
};

export default BlogDetail;
