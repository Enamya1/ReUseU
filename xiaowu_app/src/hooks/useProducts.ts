/**
 * useProducts Hook
 * Provides product fetching and caching functionality using React Query
 */

import { useQuery, useMutation, useQueryClient, UseQueryOptions } from '@tanstack/react-query';
import * as productService from '../services/productService';
import * as favoritesService from '../services/favoritesService';
import type { Product, CreateProductInput, UpdateProductInput } from '../types';

// Query keys
export const productKeys = {
  all: ['products'] as const,
  lists: () => [...productKeys.all, 'list'] as const,
  list: (filters: Record<string, unknown>) => [...productKeys.lists(), filters] as const,
  details: () => [...productKeys.all, 'detail'] as const,
  detail: (id: number) => [...productKeys.details(), id] as const,
  recommendations: () => [...productKeys.all, 'recommendations'] as const,
  nearby: () => [...productKeys.all, 'nearby'] as const,
  search: () => [...productKeys.all, 'search'] as const,
  myProducts: () => [...productKeys.all, 'my-products'] as const,
  favorites: () => [...productKeys.all, 'favorites'] as const,
};

/**
 * Hook for fetching recommended products
 */
export const useRecommendedProducts = (params?: {
  page?: number;
  page_size?: number;
  random_count?: number;
  lookback_days?: number;
}) => {
  return useQuery({
    queryKey: productKeys.recommendations(),
    queryFn: () => productService.getRecommendedProducts(params),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

/**
 * Hook for fetching a single product
 */
export const useProduct = (productId: number, options?: UseQueryOptions<Product>) => {
  return useQuery({
    queryKey: productKeys.detail(productId),
    queryFn: () => productService.getProductById(productId),
    enabled: !!productId,
    ...options,
  });
};

/**
 * Hook for fetching similar products
 */
export const useSimilarProducts = (productId: number, params?: { page?: number; page_size?: number }) => {
  return useQuery({
    queryKey: [...productKeys.detail(productId), 'similar'],
    queryFn: () => productService.getSimilarProducts(productId, params),
    enabled: !!productId,
  });
};

/**
 * Hook for fetching nearby products
 */
export const useNearbyProducts = (params: {
  lat: number;
  lng: number;
  distance_km?: number;
  category_id?: number;
  condition_level_id?: number;
  q?: string;
}, enabled: boolean = true) => {
  return useQuery({
    queryKey: productKeys.nearby(),
    queryFn: () => productService.getNearbyProducts(params),
    enabled: enabled && !!params.lat && !!params.lng,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
};

/**
 * Hook for searching products
 */
export const useSearchProducts = (query: string, enabled: boolean = true) => {
  return useQuery({
    queryKey: [...productKeys.search(), query],
    queryFn: () => productService.searchProducts({ q: query }),
    enabled: enabled && query.length > 0,
    staleTime: 1 * 60 * 1000, // 1 minute
  });
};

/**
 * Hook for fetching my products
 */
export const useMyProducts = (params?: { page?: number; page_size?: number; status?: string }) => {
  return useQuery({
    queryKey: productKeys.myProducts(),
    queryFn: () => productService.getMyProducts(params),
  });
};

/**
 * Hook for fetching favorites
 */
export const useFavoritesQuery = () => {
  return useQuery({
    queryKey: productKeys.favorites(),
    queryFn: () => favoritesService.getFavorites(),
  });
};

/**
 * Hook for product mutations
 */
export const useProductMutations = () => {
  const queryClient = useQueryClient();

  const createProduct = useMutation({
    mutationFn: (data: CreateProductInput) => productService.createProduct(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: productKeys.lists() });
      queryClient.invalidateQueries({ queryKey: productKeys.myProducts() });
    },
  });

  const updateProduct = useMutation({
    mutationFn: ({ productId, data }: { productId: number; data: UpdateProductInput }) =>
      productService.updateProduct(productId, data),
    onSuccess: (_, { productId }) => {
      queryClient.invalidateQueries({ queryKey: productKeys.detail(productId) });
      queryClient.invalidateQueries({ queryKey: productKeys.myProducts() });
    },
  });

  const markAsSold = useMutation({
    mutationFn: (productId: number) => productService.markProductSold(productId),
    onSuccess: (_, productId) => {
      queryClient.invalidateQueries({ queryKey: productKeys.detail(productId) });
      queryClient.invalidateQueries({ queryKey: productKeys.myProducts() });
    },
  });

  const toggleFavorite = useMutation({
    mutationFn: ({ productId, isFavorite }: { productId: number; isFavorite: boolean }) =>
      favoritesService.toggleFavorite(productId, isFavorite),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: productKeys.favorites() });
    },
  });

  return {
    createProduct,
    updateProduct,
    markAsSold,
    toggleFavorite,
  };
};

/**
 * Hook for getting product search suggestions
 */
export const useProductSearchSuggestions = (query: string, enabled: boolean = true) => {
  return useQuery({
    queryKey: [...productKeys.search(), 'suggestions', query],
    queryFn: () => productService.getProductSearchSuggestions({ q: query, suggestions_limit: 8 }),
    enabled: enabled && query.length >= 2,
    staleTime: 30 * 1000, // 30 seconds
  });
};
