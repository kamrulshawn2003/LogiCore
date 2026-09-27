import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { cartService } from '../services/cartService';

const CartContext = createContext();

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within CartProvider');
  }
  return context;
};

export const CartProvider = ({ children }) => {
  const [count, setCount] = useState(0);
  const { isAuthenticated, user } = useAuth();
  // Only customer/admin have carts; skip the poll for manager/supplier/driver
  // so their layouts don't trigger permission toasts.
  const canHaveCart = !!user && ['customer', 'admin'].includes(user.role);

  const refresh = useCallback(async () => {
    if (!isAuthenticated || !canHaveCart) {
      setCount(0);
      return;
    }
    try {
      const c = await cartService.getCount();
      setCount(c);
    } catch (error) {
      console.error('Failed to load cart count:', error);
    }
  }, [isAuthenticated, canHaveCart]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const value = {
    count,
    refresh,
    setCount,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};
