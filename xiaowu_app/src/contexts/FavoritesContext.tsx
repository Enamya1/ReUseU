/**
 * Favorites Context
 * Manages user favorites state
 */

import React, { createContext, useContext, useState, useCallback, useEffect, useRef, ReactNode } from 'react';
import type { Product } from '../types';
import * as favoritesService from '../services/favoritesService';
import { useAuth } from './AuthContext';

interface FavoritesContextType {
  favorites: number[];
  favoriteProducts: Product[];
  isLoading: boolean;
  isFavorite: (productId: number) => boolean;
  toggleFavorite: (productId: number) => Promise<void>;
  addFavorite: (productId: number) => Promise<void>;
  removeFavorite: (productId: number) => Promise<void>;
  refreshFavorites: () => Promise<void>;
}

const FavoritesContext = createContext<FavoritesContextType | undefined>(undefined);

interface FavoritesProviderProps {
  children: ReactNode;
}

export const FavoritesProvider: React.FC<FavoritesProviderProps> = ({ children }) => {
  const { isAuthenticated, user } = useAuth();
  const [favorites, setFavorites] = useState<number[]>([]);
  const [favoriteProducts, setFavoriteProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const hasFetched = useRef(false);

  const fetchFavorites = useCallback(async () => {
    if (!isAuthenticated) {
      setFavorites([]);
      setFavoriteProducts([]);
      return;
    }

    if (user?.role && user.role !== 'user') {
      setFavorites([]);
      setFavoriteProducts([]);
      return;
    }

    setIsLoading(true);
    try {
      const response = await favoritesService.getFavorites();
      const products = response.products || [];
      setFavoriteProducts(products);
      setFavorites(products.map(p => p.id));
    } catch (error) {
      setFavorites([]);
      setFavoriteProducts([]);
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, user?.role]);

  useEffect(() => {
    if (isAuthenticated && !hasFetched.current) {
      hasFetched.current = true;
      fetchFavorites();
    }
    if (!isAuthenticated) {
      hasFetched.current = false;
      setFavorites([]);
      setFavoriteProducts([]);
    }
  }, [isAuthenticated, fetchFavorites]);

  const isFavorite = useCallback((productId: number): boolean => {
    return favorites.includes(productId);
  }, [favorites]);

  const addFavorite = useCallback(async (productId: number) => {
    if (!isAuthenticated) {
      throw new Error('Unauthenticated');
    }

    // Optimistic update
    setFavorites(prev => (prev.includes(productId) ? prev : [...prev, productId]));

    try {
      await favoritesService.addFavorite(productId);
      await fetchFavorites();
    } catch (error) {
      // Revert on error
      setFavorites(prev => prev.filter(id => id !== productId));
      throw error;
    }
  }, [isAuthenticated, fetchFavorites]);

  const removeFavorite = useCallback(async (productId: number) => {
    // Optimistic update
    setFavorites(prev => prev.filter(id => id !== productId));
    setFavoriteProducts(prev => prev.filter(p => p.id !== productId));

    try {
      await favoritesService.removeFavorite(productId);
    } catch (error) {
      // Re-fetch to restore state on error
      await fetchFavorites();
      throw error;
    }
  }, [fetchFavorites]);

  const toggleFavorite = useCallback(async (productId: number) => {
    if (favorites.includes(productId)) {
      await removeFavorite(productId);
    } else {
      await addFavorite(productId);
    }
  }, [favorites, addFavorite, removeFavorite]);

  const refreshFavorites = useCallback(async () => {
    hasFetched.current = false;
    await fetchFavorites();
  }, [fetchFavorites]);

  const value: FavoritesContextType = {
    favorites,
    favoriteProducts,
    isLoading,
    isFavorite,
    toggleFavorite,
    addFavorite,
    removeFavorite,
    refreshFavorites,
  };

  return <FavoritesContext.Provider value={value}>{children}</FavoritesContext.Provider>;
};

export const useFavorites = (): FavoritesContextType => {
  const context = useContext(FavoritesContext);
  if (!context) {
    throw new Error('useFavorites must be used within a FavoritesProvider');
  }
  return context;
};
