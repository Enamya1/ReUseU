import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { mockFavorites } from '@/lib/mockData';

interface FavoritesContextType {
  favorites: number[];
  isFavorite: (productId: number) => boolean;
  toggleFavorite: (productId: number) => void;
  addFavorite: (productId: number) => void;
  removeFavorite: (productId: number) => void;
}

const FavoritesContext = createContext<FavoritesContextType | undefined>(undefined);

export const FavoritesProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [favorites, setFavorites] = useState<number[]>(mockFavorites);

  const isFavorite = useCallback((productId: number): boolean => {
    return favorites.includes(productId);
  }, [favorites]);

  const toggleFavorite = useCallback((productId: number) => {
    setFavorites(prev => 
      prev.includes(productId)
        ? prev.filter(id => id !== productId)
        : [...prev, productId]
    );
  }, []);

  const addFavorite = useCallback((productId: number) => {
    setFavorites(prev => 
      prev.includes(productId) ? prev : [...prev, productId]
    );
  }, []);

  const removeFavorite = useCallback((productId: number) => {
    setFavorites(prev => prev.filter(id => id !== productId));
  }, []);

  return (
    <FavoritesContext.Provider
      value={{
        favorites,
        isFavorite,
        toggleFavorite,
        addFavorite,
        removeFavorite,
      }}
    >
      {children}
    </FavoritesContext.Provider>
  );
};

export const useFavorites = (): FavoritesContextType => {
  const context = useContext(FavoritesContext);
  if (!context) {
    throw new Error('useFavorites must be used within a FavoritesProvider');
  }
  return context;
};
