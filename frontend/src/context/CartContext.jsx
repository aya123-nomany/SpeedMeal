import React, { createContext, useContext, useState, useEffect } from 'react';
import { useNotification } from './NotificationContext';

const CartContext = createContext(null);

export const CartProvider = ({ children }) => {
  const { showNotification } = useNotification();
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('user'));
    } catch { return null; }
  });

  // Helper to get cart keys based on current user
  const getCartKeys = () => {
    if (currentUser && currentUser.id) {
      return {
        cart: `cart_${currentUser.id}`,
        restaurantId: `cartRestaurantId_${currentUser.id}`,
        restaurantName: `cartRestaurantName_${currentUser.id}`
      };
    }
    return {
      cart: 'cart_guest',
      restaurantId: 'cartRestaurantId_guest',
      restaurantName: 'cartRestaurantName_guest'
    };
  };

  const [cart, setCart] = useState(() => {
    try {
      const keys = getCartKeys();
      return JSON.parse(localStorage.getItem(keys.cart) || '[]');
    } catch { return []; }
  });
  const [restaurantId, setRestaurantId] = useState(() => {
    const keys = getCartKeys();
    return localStorage.getItem(keys.restaurantId) || null;
  });
  const [restaurantName, setRestaurantName] = useState(() => {
    const keys = getCartKeys();
    return localStorage.getItem(keys.restaurantName) || '';
  });

  // Listen for user changes (login/logout)
  useEffect(() => {
    const handleStorageChange = () => {
      try {
        setCurrentUser(JSON.parse(localStorage.getItem('user') || 'null'));
      } catch { setCurrentUser(null); }
    };
    window.addEventListener('storage', handleStorageChange);
    const interval = setInterval(handleStorageChange, 500); // Check for user changes
    return () => { window.removeEventListener('storage', handleStorageChange); clearInterval(interval); };
  }, []);

  // When user changes, load their cart
  useEffect(() => {
    try {
      const keys = getCartKeys();
      const savedCart = JSON.parse(localStorage.getItem(keys.cart) || '[]');
      const savedRestoId = localStorage.getItem(keys.restaurantId);
      const savedRestoName = localStorage.getItem(keys.restaurantName) || '';
      setCart(savedCart);
      setRestaurantId(savedRestoId);
      setRestaurantName(savedRestoName);
    } catch {
      setCart([]);
      setRestaurantId(null);
      setRestaurantName('');
    }
  }, [currentUser?.id]);

  // Save cart to localStorage with user-specific keys
  useEffect(() => {
    const keys = getCartKeys();
    localStorage.setItem(keys.cart, JSON.stringify(cart));
  }, [cart, currentUser?.id]);

  useEffect(() => {
    const keys = getCartKeys();
    if (restaurantId) localStorage.setItem(keys.restaurantId, restaurantId);
    else localStorage.removeItem(keys.restaurantId);
  }, [restaurantId, currentUser?.id]);

  useEffect(() => {
    const keys = getCartKeys();
    if (restaurantName) localStorage.setItem(keys.restaurantName, restaurantName);
    else localStorage.removeItem(keys.restaurantName);
  }, [restaurantName, currentUser?.id]);

  const addItem = (item, restoId, restoName) => {
    const token = localStorage.getItem('token');
    if (!token) {
      showNotification('Veuillez vous inscrire ou vous connecter pour commander !');
      return;
    }
    // If adding from a different restaurant, clear cart first
    if (restaurantId && restaurantId !== String(restoId)) {
      if (!window.confirm(`Votre panier contient des articles de "${restaurantName}". Vider le panier et ajouter ce nouvel article?`)) {
        return;
      }
      setCart([]);
    }

    setRestaurantId(String(restoId));
    setRestaurantName(restoName);

    setCart(prev => {
      const existing = prev.find(i => i.id === item.id);
      if (existing) {
        return prev.map(i => i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i);
      }
      return [...prev, { ...item, quantity: 1 }];
    });
  };

  const removeItem = (itemId) => {
    setCart(prev => {
      const updated = prev.filter(i => i.id !== itemId);
      if (updated.length === 0) {
        setRestaurantId(null);
        setRestaurantName('');
      }
      return updated;
    });
  };

  const updateQuantity = (itemId, qty) => {
    if (qty <= 0) { removeItem(itemId); return; }
    setCart(prev => prev.map(i => i.id === itemId ? { ...i, quantity: qty } : i));
  };

  const clearCart = () => {
    setCart([]);
    setRestaurantId(null);
    setRestaurantName('');
  };

  const total = cart.reduce((sum, i) => sum + Number(i.price) * i.quantity, 0);
  const count = cart.reduce((sum, i) => sum + i.quantity, 0);

  return (
    <CartContext.Provider value={{
      cart, restaurantId, restaurantName,
      addItem, removeItem, updateQuantity, clearCart,
      total, count
    }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
};
