import React, { createContext, useContext, useState, useCallback, ReactNode, useEffect, useRef } from 'react';
import { apiUrl } from '@/lib/api';
import { useAuth } from './AuthContext';
import { Product, ProductImage } from '@/lib/mockData';

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

export const FavoritesProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { accessToken, tokenType, user, isAuthenticated } = useAuth();
  const [favorites, setFavorites] = useState<number[]>([]);
  const [favoriteProducts, setFavoriteProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const hasFetched = useRef(false);

  const fetchFavorites = useCallback(async () => {
    if (!accessToken || !isAuthenticated) {
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
      const response = await fetch(apiUrl('/api/user/get_favorites'), {
        method: 'GET',
        headers: {
          Accept: 'application/json',
          Authorization: `${tokenType || 'Bearer'} ${accessToken}`,
        },
      });

      const contentType = response.headers.get('content-type') || '';
      const responseBody = contentType.includes('application/json')
        ? await response.json()
        : null;

      if (response.ok && responseBody?.products) {
        // Map API response to Product type with proper price handling
        const products: Product[] = (responseBody.products || []).map((item: {
          id?: number;
          title?: string;
          description?: string | null;
          price?: number | string;
          currency?: string;
          status?: 'available' | 'sold' | 'reserved';
          created_at?: string;
          is_promoted?: number | boolean | null;
          seller_id?: number;
          dormitory_id?: number | null;
          category_id?: number;
          condition_level_id?: number;
          exchange_type?: 'exchange_only' | 'exchange_or_purchase' | null;
          target_product_title?: string | null;
          images?: Array<{
            id?: number;
            product_id?: number;
            image_url?: string;
            image_thumbnail_url?: string | null;
            is_primary?: boolean;
          }>;
          tags?: Array<{ id: number; name: string }>;
          distance_km?: number | null;
          seller?: {
            id: number;
            full_name?: string;
            username?: string;
            email?: string;
            profile_picture?: string | null;
          };
          dormitory?: {
            id: number;
            dormitory_name: string;
            domain?: string;
            location?: string;
            lat?: number;
            lng?: number;
            is_active?: boolean;
            university_id?: number;
          };
          category?: {
            id: number;
            name: string;
            parent_id?: number | null;
            icon?: string | null;
          };
          condition_level?: {
            id: number;
            name: string;
            description?: string | null;
            sort_order?: number;
          };
        }) => {
          // Parse price - handle both number and string from API
          const rawPrice = item.price;
          const parsedPrice = typeof rawPrice === 'number' 
            ? rawPrice 
            : typeof rawPrice === 'string' 
              ? parseFloat(rawPrice) || 0 
              : 0;

          // Map images
          const images: ProductImage[] = Array.isArray(item.images)
            ? item.images.map((img, idx) => ({
                id: img.id ?? idx + 1,
                product_id: img.product_id ?? item.id ?? 0,
                image_url: img.image_url ?? '',
                image_thumbnail_url: img.image_thumbnail_url ?? undefined,
                is_primary: img.is_primary ?? false,
              }))
            : [];

          return {
            id: item.id ?? 0,
            title: item.title || 'Untitled',
            description: item.description ?? undefined,
            price: parsedPrice,
            currency: typeof item.currency === 'string' ? item.currency : undefined,
            status: item.status ?? 'available',
            created_at: item.created_at || new Date().toISOString(),
            is_promoted: Boolean(item.is_promoted),
            seller_id: item.seller_id ?? item.seller?.id ?? 0,
            dormitory_id: item.dormitory_id ?? item.dormitory?.id ?? 0,
            category_id: item.category_id ?? item.category?.id ?? 0,
            condition_level_id: item.condition_level_id ?? item.condition_level?.id ?? 0,
            exchange_type: item.exchange_type,
            target_product_title: item.target_product_title ?? undefined,
            images,
            tags: Array.isArray(item.tags) ? item.tags : [],
            distance_km: typeof item.distance_km === 'number' ? item.distance_km : undefined,
            seller: item.seller ? {
              id: item.seller.id,
              full_name: item.seller.full_name || '',
              username: item.seller.username || '',
              email: item.seller.email || '',
              profile_picture: item.seller.profile_picture ?? undefined,
              role: 'user',
              status: 'active',
            } : undefined,
            dormitory: item.dormitory ? {
              id: item.dormitory.id,
              dormitory_name: item.dormitory.dormitory_name,
              domain: item.dormitory.domain || '',
              location: item.dormitory.location,
              lat: item.dormitory.lat,
              lng: item.dormitory.lng,
              is_active: item.dormitory.is_active ?? true,
              university_id: item.dormitory.university_id ?? 0,
            } : undefined,
            category: item.category ? {
              id: item.category.id,
              name: item.category.name,
              parent_id: item.category.parent_id ?? undefined,
              icon: item.category.icon ?? undefined,
            } : undefined,
            condition_level: item.condition_level ? {
              id: item.condition_level.id,
              name: item.condition_level.name,
              description: item.condition_level.description ?? undefined,
              sort_order: item.condition_level.sort_order ?? 0,
            } : undefined,
          };
        });
        setFavoriteProducts(products);
        setFavorites(products.map(p => p.id));
      } else {
        setFavorites([]);
        setFavoriteProducts([]);
      }
    } catch (error) {
      console.error('Error fetching favorites:', error);
      setFavorites([]);
      setFavoriteProducts([]);
    } finally {
      setIsLoading(false);
    }
  }, [accessToken, tokenType, user, isAuthenticated]);

  // Fetch favorites on mount and when auth changes
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
    if (!accessToken || !isAuthenticated) {
      throw new Error('Unauthenticated');
    }
    if (user?.role && user.role !== 'user') {
      throw new Error('Unauthorized: Only users can access this endpoint.');
    }

    // Optimistic update
    setFavorites(prev => (prev.includes(productId) ? prev : [...prev, productId]));

    try {
      const response = await fetch(apiUrl('/api/user/favorites'), {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
          Authorization: `${tokenType || 'Bearer'} ${accessToken}`,
        },
        body: JSON.stringify({ product_id: productId }),
      });

      const contentType = response.headers.get('content-type') || '';
      const responseBody = contentType.includes('application/json')
        ? await response.json()
        : null;

      if (response.status === 201 || response.status === 200) {
        // Success - refresh favorites to get updated list
        await fetchFavorites();
      } else if (response.status === 404) {
        // Product not found - revert optimistic update
        setFavorites(prev => prev.filter(id => id !== productId));
        throw new Error(responseBody?.message || 'Product not found.');
      } else if (response.status === 403) {
        // Unauthorized - revert optimistic update
        setFavorites(prev => prev.filter(id => id !== productId));
        throw new Error(responseBody?.message || 'Unauthorized');
      } else if (response.status === 422 && responseBody?.errors) {
        // Validation error - revert optimistic update
        setFavorites(prev => prev.filter(id => id !== productId));
        throw new Error(Object.values(responseBody.errors).flat().join(', '));
      }
    } catch (error) {
      // Revert optimistic update on error
      setFavorites(prev => prev.filter(id => id !== productId));
      throw error;
    }
  }, [accessToken, tokenType, user, isAuthenticated, fetchFavorites]);

  const removeFavorite = useCallback(async (productId: number) => {
    // For removal, we just update local state since there's no remove endpoint specified
    // If the backend has a remove endpoint, this should be updated
    setFavorites(prev => prev.filter(id => id !== productId));
    setFavoriteProducts(prev => prev.filter(p => p.id !== productId));
  }, []);

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

  return (
    <FavoritesContext.Provider
      value={{
        favorites,
        favoriteProducts,
        isLoading,
        isFavorite,
        toggleFavorite,
        addFavorite,
        removeFavorite,
        refreshFavorites,
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
