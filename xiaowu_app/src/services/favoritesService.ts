/**
 * Favorites Service
 * Handles favorites-related API calls
 */

import { apiClient, handleApiError } from './api';
import type { Product } from '../types';

/**
 * Get user favorites
 */
export const getFavorites = async (): Promise<{ products: Product[]; total: number }> => {
  try {
    const response = await apiClient.get('/api/user/get_favorites');
    return {
      products: response.data.products || [],
      total: response.data.total || response.data.products?.length || 0,
    };
  } catch (error) {
    throw handleApiError(error);
  }
};

/**
 * Add product to favorites
 */
export const addFavorite = async (productId: number): Promise<void> => {
  try {
    await apiClient.post('/api/user/favorites', { product_id: productId });
  } catch (error) {
    throw handleApiError(error);
  }
};

/**
 * Remove product from favorites
 */
export const removeFavorite = async (productId: number): Promise<void> => {
  try {
    await apiClient.delete(`/api/user/favorites/${productId}`);
  } catch (error) {
    throw handleApiError(error);
  }
};

/**
 * Toggle favorite status
 */
export const toggleFavorite = async (productId: number, isFavorite: boolean): Promise<void> => {
  if (isFavorite) {
    await removeFavorite(productId);
  } else {
    await addFavorite(productId);
  }
};
