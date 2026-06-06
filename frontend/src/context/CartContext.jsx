import React, { createContext, useContext, useState, useEffect } from 'react';

const CartContext = createContext(null);

export const CartProvider = ({ children }) => {
  const [cart, setCart] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('cart') || '[]');
    } catch { return []; }
  });
  const [restaurantId, setRestaurantId] = useState(() =>
    localStorage.getItem('cartRestaurantId') || null
  );
  const [restaurantName, setRestaurantName] = useState(() =>
    localStorage.getItem('cartRestaurantName') || ''
  );

  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(cart));
  }, [cart]);

  useEffect(() => {
    if (restaurantId) localStorage.setItem('cartRestaurantId', restaurantId);
    else localStorage.removeItem('cartRestaurantId');
  }, [restaurantId]);

  useEffect(() => {
    if (restaurantName) localStorage.setItem('cartRestaurantName', restaurantName);
    else localStorage.removeItem('cartRestaurantName');
  }, [restaurantName]);

  const addItem = (item, restoId, restoName) => {
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
