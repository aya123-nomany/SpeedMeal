import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { MapPin, Star, Clock, Bike, Search } from 'lucide-react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

export default function NearbyRestaurants() {
  const mapRef = useRef(null);
  const mapInstance = useRef(null);
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCity, setSelectedCity] = useState('Casablanca');
  const [searchQuery, setSearchQuery] = useState('');
  const [userLocation, setUserLocation] = useState(null);
  const [distanceFilter, setDistanceFilter] = useState(null);
  const [useNearMe, setUseNearMe] = useState(false);

  const cities = ['Casablanca', 'Rabat', 'Marrakech', 'Fès', 'Tanger', 'Agadir', 'Meknès', 'Oujda'];
  const distanceOptions = [1, 5, 10];

  // Calculate distance between two coordinates (Haversine formula)
  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  const handleNearMe = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser');
      return;
    }

    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setUserLocation({ lat: latitude, lng: longitude });
        setUseNearMe(true);
        setSelectedCity(''); // Clear city selection when using near me
        setLoading(false);
      },
      (error) => {
        console.error('Error getting location:', error);
        alert('Unable to get your location. Please enable location services.');
        setLoading(false);
      }
    );
  };

  useEffect(() => {
    fetchRestaurants();
  }, [selectedCity, useNearMe]);

  const fetchRestaurants = async () => {
    setLoading(true);
    try {
      let url;
      if (useNearMe && userLocation) {
        // When using near me, fetch from a broader area or use all cities
        url = `http://localhost:5000/api/openmenu/location?country=MA`;
      } else {
        url = `http://localhost:5000/api/openmenu/location?city=${selectedCity}&country=MA`;
      }

      const response = await fetch(url);
      const data = await response.json();

      if (data.response && data.response.items) {
        const formattedRestaurants = data.response.items.map((item, index) => ({
          id: item.restaurant_id || index,
          name: item.restaurant_name || 'Restaurant',
          cuisine: item.cuisine_type || 'Various',
          rating: (Math.random() * (5 - 3.5) + 3.5).toFixed(1),
          deliveryTime: `${Math.floor(Math.random() * 30 + 15)}-${Math.floor(Math.random() * 30 + 35)} min`,
          image: item.logo_url || 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400&h=300&fit=crop',
          distance: `${(Math.random() * 5 + 0.5).toFixed(1)} km`,
          lat: item.lat || 33.5731 + (Math.random() - 0.5) * 0.1,
          lng: item.lng || -7.5898 + (Math.random() - 0.5) * 0.1,
          address: item.address || ''
        }));

        // Calculate real distances if user location is available
        if (userLocation) {
          formattedRestaurants.forEach(r => {
            const realDistance = calculateDistance(userLocation.lat, userLocation.lng, r.lat, r.lng);
            r.distance = `${realDistance.toFixed(1)} km`;
            r.realDistance = realDistance;
          });
        }

        setRestaurants(formattedRestaurants);
      } else {
        setRestaurants([]);
      }
    } catch (error) {
      console.error('Error fetching restaurants:', error);
      setRestaurants([]);
    } finally {
      setLoading(false);
    }
  };

  // Filter restaurants by distance
  const filteredRestaurants = distanceFilter && userLocation
    ? restaurants.filter(r => r.realDistance <= distanceFilter)
    : restaurants;

  useEffect(() => {
    if (!mapInstance.current && mapRef.current) {
      // Initialize map centered on Casablanca
      mapInstance.current = L.map(mapRef.current).setView([33.5731, -7.5898], 13);

      // Add OpenStreetMap tiles
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
      }).addTo(mapInstance.current);

      // Add map movement event listener (disabled for now)
      // mapInstance.current.on('moveend', handleMapMove);
      // mapInstance.current.on('zoomend', handleMapMove);
    }

    return () => {
      if (mapInstance.current) {
        // mapInstance.current.off('moveend', handleMapMove);
        // mapInstance.current.off('zoomend', handleMapMove);
        mapInstance.current.remove();
        mapInstance.current = null;
      }
    };
  }, []);

  const handleMapMove = async () => {
    if (!mapInstance.current) return;

    const center = mapInstance.current.getCenter();
    const zoom = mapInstance.current.getZoom();

    // Only fetch if zoom level is sufficient (>= 12)
    if (zoom < 12) return;

    try {
      const response = await fetch(
        `http://localhost:5000/api/openmenu/nearby?lat=${center.lat}&lng=${center.lng}&radius=${distanceFilter || 5}`
      );
      const data = await response.json();

      if (data.items) {
        const formattedRestaurants = data.items.map((item, index) => ({
          id: item.restaurant_id || index,
          name: item.restaurant_name || 'Restaurant',
          cuisine: item.cuisine_type || 'Various',
          rating: (Math.random() * (5 - 3.5) + 3.5).toFixed(1),
          deliveryTime: `${Math.floor(Math.random() * 30 + 15)}-${Math.floor(Math.random() * 30 + 35)} min`,
          image: item.logo_url || 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400&h=300&fit=crop',
          distance: `${item.distance || (Math.random() * 5 + 0.5).toFixed(1)} km`,
          lat: item.lat || 33.5731 + (Math.random() - 0.5) * 0.1,
          lng: item.lng || -7.5898 + (Math.random() - 0.5) * 0.1,
          address: item.address || ''
        }));

        setRestaurants(formattedRestaurants);
      }
    } catch (error) {
      console.error('Error fetching nearby restaurants:', error);
    }
  };

  // Update map markers when restaurants change
  useEffect(() => {
    if (mapInstance.current) {
      // Clear existing markers
      mapInstance.current.eachLayer((layer) => {
        if (layer instanceof L.Marker) {
          mapInstance.current.removeLayer(layer);
        }
      });

      // Create custom icon for restaurants
      const customIcon = L.divIcon({
        className: 'custom-marker',
        html: `<div style="background: #A51C1C; width: 30px; height: 30px; border-radius: 50% 50% 50% 0; transform: rotate(-45deg); display: flex; align-items: center; justify-content: center; border: 3px solid white; box-shadow: 0 4px 12px rgba(0,0,0,0.3);">
                <div style="width: 8px; height: 8px; background: white; border-radius: 50%;"></div>
              </div>`,
        iconSize: [30, 30],
        iconAnchor: [15, 30]
      });

      // Create custom icon for user location
      const userIcon = L.divIcon({
        className: 'user-marker',
        html: `<div style="background: #3b82f6; width: 20px; height: 20px; border-radius: 50%; border: 4px solid white; box-shadow: 0 4px 12px rgba(59,130,246,0.5); animation: pulse 2s infinite;"></div>`,
        iconSize: [20, 20],
        iconAnchor: [10, 10]
      });

      // Add user location marker if available
      if (userLocation) {
        L.marker([userLocation.lat, userLocation.lng], { icon: userIcon })
          .addTo(mapInstance.current)
          .bindPopup('<b>Your Location</b>');
      }

      // Add markers for each restaurant
      restaurants.forEach(restaurant => {
        L.marker([restaurant.lat, restaurant.lng], { icon: customIcon })
          .addTo(mapInstance.current)
          .bindPopup(`<b>${restaurant.name}</b><br>${restaurant.cuisine}<br>&#9733; ${restaurant.rating}<br>${restaurant.distance}<br>${restaurant.address}`);
      });

      // Center map on user location if near me is active, otherwise fit to all markers
      if (useNearMe && userLocation) {
        mapInstance.current.setView([userLocation.lat, userLocation.lng], 14);
      } else if (restaurants.length > 0) {
        const bounds = L.latLngBounds(restaurants.map(r => [r.lat, r.lng]));
        mapInstance.current.fitBounds(bounds, { padding: [50, 50] });
      }
    }
  }, [restaurants, userLocation, useNearMe]);

  return (
    <div style={{ background: '#fff9e6', minHeight: '100vh', paddingTop: '140px', paddingBottom: '80px' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 20px' }}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          style={{ marginBottom: '40px' }}
        >
          <h1 style={{ fontSize: 'clamp(32px, 5vw, 48px)', fontWeight: '900', color: '#111', marginBottom: '12px' }}>
            Restaurants à proximité
          </h1>
          <p style={{ fontSize: '16px', color: '#666', marginBottom: '24px' }}>
            Découvrez les meilleurs restaurants près de chez vous
          </p>

          {/* City Selector & Near Me */}
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#fff', padding: '8px 16px', borderRadius: '999px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
              <MapPin size={18} color="#A51C1C" />
              <select
                value={selectedCity}
                onChange={(e) => { setSelectedCity(e.target.value); setUseNearMe(false); }}
                disabled={useNearMe}
                style={{ border: 'none', outline: 'none', fontSize: '14px', fontWeight: '600', color: '#111', background: 'transparent', cursor: useNearMe ? 'not-allowed' : 'pointer' }}
              >
                {cities.map(city => (
                  <option key={city} value={city}>{city}</option>
                ))}
              </select>
            </div>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleNearMe}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                background: useNearMe ? '#3b82f6' : '#fff',
                color: useNearMe ? '#fff' : '#3b82f6',
                padding: '8px 20px',
                borderRadius: '999px',
                border: useNearMe ? 'none' : '2px solid #3b82f6',
                fontWeight: '700',
                fontSize: '14px',
                cursor: 'pointer',
                boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
              }}
            >
              <MapPin size={18} />
              Near Me
            </motion.button>
          </div>

          {/* Distance Filter */}
          {useNearMe && userLocation && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '20px' }}
            >
              {distanceOptions.map(dist => (
                <button
                  key={dist}
                  onClick={() => setDistanceFilter(distanceFilter === dist ? null : dist)}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '999px',
                    border: distanceFilter === dist ? 'none' : '2px solid #ddd',
                    background: distanceFilter === dist ? '#A51C1C' : '#fff',
                    color: distanceFilter === dist ? '#fff' : '#666',
                    fontWeight: '700',
                    fontSize: '13px',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                >
                  Within {dist}km
                </button>
              ))}
              {distanceFilter && (
                <button
                  onClick={() => setDistanceFilter(null)}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '999px',
                    border: '2px solid #ddd',
                    background: '#fff',
                    color: '#666',
                    fontWeight: '700',
                    fontSize: '13px',
                    cursor: 'pointer'
                  }}
                >
                  Clear
                </button>
              )}
            </motion.div>
          )}
        </motion.div>

        {/* Map Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          style={{ marginBottom: '40px' }}
        >
          <div
            ref={mapRef}
            style={{
              height: '400px',
              borderRadius: '20px',
              overflow: 'hidden',
              boxShadow: '0 8px 30px rgba(0,0,0,0.1)',
              border: '2px solid #fff'
            }}
          />
        </motion.div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px' }}>
            <div style={{ width: '40px', height: '40px', border: '4px solid rgba(165,28,28,0.2)', borderTop: '4px solid #A51C1C', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 20px' }} />
            <p style={{ color: '#666', fontSize: '16px', fontWeight: '600' }}>Chargement des restaurants...</p>
          </div>
        ) : filteredRestaurants.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px', background: '#fff', borderRadius: '20px', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
            <MapPin size={48} color="#ccc" style={{ marginBottom: '16px' }} />
            <p style={{ color: '#666', fontSize: '18px', fontWeight: '700' }}>Aucun restaurant trouvé</p>
            <p style={{ color: '#999', fontSize: '14px', marginTop: '8px' }}>{useNearMe ? 'Essayez d\'augmenter la distance' : 'Essayez une autre ville'}</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '24px' }}>
            {filteredRestaurants.map((restaurant, index) => (
            <motion.div
              key={restaurant.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ y: -8, boxShadow: '0 20px 40px rgba(0,0,0,0.12)' }}
              style={{
                background: '#fff',
                borderRadius: '20px',
                overflow: 'hidden',
                boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                cursor: 'pointer',
                border: '1px solid #f0f0f0'
              }}
            >
              <div style={{ height: '200px', overflow: 'hidden', position: 'relative' }}>
                <img
                  src={restaurant.image}
                  alt={restaurant.name}
                  style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.4s' }}
                  onMouseEnter={e => e.target.style.transform = 'scale(1.08)'}
                  onMouseLeave={e => e.target.style.transform = 'scale(1)'}
                />
                <div style={{
                  position: 'absolute',
                  top: '12px',
                  right: '12px',
                  background: '#fff',
                  padding: '6px 12px',
                  borderRadius: '999px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
                }}>
                  <Star size={14} color="#ffd700" fill="#ffd700" />
                  <span style={{ fontWeight: '700', fontSize: '13px', color: '#111' }}>{restaurant.rating}</span>
                </div>
              </div>
              <div style={{ padding: '20px' }}>
                <h3 style={{ margin: '0 0 8px', fontSize: '18px', fontWeight: '800', color: '#111' }}>
                  {restaurant.name}
                </h3>
                <p style={{ margin: '0 0 16px', fontSize: '14px', color: '#888' }}>
                  {restaurant.cuisine}
                </p>
                <div style={{ display: 'flex', gap: '16px', fontSize: '13px', color: '#666' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Clock size={14} color="#A51C1C" />
                    {restaurant.deliveryTime}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Bike size={14} color="#A51C1C" />
                    {restaurant.distance}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
          </div>
        )}
      </div>
    </div>
  );
}
