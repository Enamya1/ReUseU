/**
 * Product Service
 * Handles all product-related API calls
 */

import { apiClient, apiPyClient, handleApiError } from './api';
import type { 
  Product, 
  ProductImage,
  CreateProductInput, 
  UpdateProductInput,
  ProductEngagement,
  SearchSuggestion,
  PaginatedResponse,
} from '../types';

/**
 * Get recommended products (Python API)
 */
export const getRecommendedProducts = async (params?: {
  page?: number;
  page_size?: number;
  random_count?: number;
  lookback_days?: number;
  seed?: number;
}): Promise<{ 
  products: Product[]; 
  page: number;
  page_size: number;
  random_count: number;
}> => {
  try {
    const response = await apiPyClient.get('/py/api/user/recommendations/products', { params });
    return {
      products: response.data.products || [],
      page: response.data.page || 1,
      page_size: response.data.page_size || 10,
      random_count: response.data.random_count || 3,
    };
  } catch (error) {
    throw handleApiError(error);
  }
};

/**
 * Get product by ID (with behavioral event tracking)
 * Endpoint: GET /api/user/get_product/{product_id}
 * Auth: auth:sanctum, role=user
 * Side effect: creates behavioral_events record with event_type "click"
 */
export const getProductDetail = async (productId: number): Promise<Product> => {
  try {
    const response = await apiClient.get(`/api/user/get_product/${productId}`);
    return response.data.product;
  } catch (error) {
    throw handleApiError(error);
  }
};

/**
 * Get similar products
 */
export const getSimilarProducts = async (
  productId: number,
  params?: { page?: number; page_size?: number }
): Promise<{ products: Product[]; total: number }> => {
  try {
    const response = await apiClient.get(`/api/products/${productId}/similar`, { params });
    return {
      products: response.data.products || [],
      total: response.data.total || 0,
    };
  } catch (error) {
    throw handleApiError(error);
  }
};

/**
 * Get nearby products
 */
export const getNearbyProducts = async (params: {
  lat: number;
  lng: number;
  distance_km?: number;
  category_id?: number;
  condition_level_id?: number;
  q?: string;
  location_q?: string;
}): Promise<{ products: Product[]; total: number }> => {
  try {
    const response = await apiClient.get('/api/products/nearby', { params });
    return {
      products: response.data.products || [],
      total: response.data.total || 0,
    };
  } catch (error) {
    throw handleApiError(error);
  }
};

/**
 * Create a new product
 */
export const createProduct = async (data: CreateProductInput): Promise<Product> => {
  try {
    const response = await apiClient.post('/api/products', data);
    return response.data;
  } catch (error) {
    throw handleApiError(error);
  }
};

/**
 * Create exchange product
 */
export const createExchangeProduct = async (data: CreateProductInput): Promise<Product> => {
  try {
    const response = await apiClient.post('/api/products/exchange', data);
    return response.data;
  } catch (error) {
    throw handleApiError(error);
  }
};

/**
 * Update product
 */
export const updateProduct = async (productId: number, data: UpdateProductInput): Promise<Product> => {
  try {
    const response = await apiClient.put(`/api/products/${productId}`, data);
    return response.data;
  } catch (error) {
    throw handleApiError(error);
  }
};

/**
 * Get product for editing
 */
export const getProductForEdit = async (productId: number): Promise<Product> => {
  try {
    const response = await apiClient.get(`/api/products/${productId}/edit`);
    return response.data;
  } catch (error) {
    throw handleApiError(error);
  }
};

/**
 * Mark product as sold
 */
export const markProductSold = async (productId: number): Promise<void> => {
  try {
    await apiClient.post(`/api/products/${productId}/sold`);
  } catch (error) {
    throw handleApiError(error);
  }
};

/**
 * Update product images
 */
export const updateProductImages = async (
  productId: number,
  images: Array<{ uri: string; is_primary?: boolean }>
): Promise<ProductImage[]> => {
  try {
    const formData = new FormData();
    
    images.forEach((image, index) => {
      const filename = image.uri.split('/').pop() || `image_${index}.jpg`;
      const match = /\.(\w+)$/.exec(filename);
      const type = match ? `image/${match[1]}` : 'image/jpeg';

      formData.append('files', {
        uri: image.uri,
        name: filename,
        type,
      } as unknown as Blob);

      if (image.is_primary) {
        formData.append('primary_index', String(index));
      }
    });

    const response = await apiClient.put<{ images: ProductImage[] }>(
      `/api/products/${productId}/images`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );

    return response.data.images;
  } catch (error) {
    throw handleApiError(error);
  }
};

/**
 * Get product engagement stats
 */
export const getProductEngagement = async (productId: number): Promise<ProductEngagement> => {
  try {
    const response = await apiClient.get(`/api/products/${productId}/engagement`);
    return response.data;
  } catch (error) {
    throw handleApiError(error);
  }
};

/**
 * Get my products (seller's listings)
 */
export const getMyProducts = async (params?: {
  page?: number;
  page_size?: number;
  status?: string;
}): Promise<{ products: Product[]; total: number }> => {
  try {
    const response = await apiClient.get('/api/user/products', { params });
    return {
      products: response.data.products || [],
      total: response.data.total || 0,
    };
  } catch (error) {
    throw handleApiError(error);
  }
};

/**
 * Get seller profile and products
 */
export const getSellerProfile = async (
  sellerId: number,
  params?: { page?: number; page_size?: number }
): Promise<{
  seller: { id: number; username: string; profile_picture?: string; bio?: string };
  products: Product[];
  total: number;
}> => {
  try {
    const response = await apiClient.get(`/api/sellers/${sellerId}`, { params });
    return response.data;
  } catch (error) {
    throw handleApiError(error);
  }
};

/**
 * Get product search suggestions
 */
export const getProductSearchSuggestions = async (params: {
  q: string;
  suggestions_limit?: number;
}): Promise<{ suggestions: string[] }> => {
  try {
    const response = await apiClient.get('/api/products/search/suggestions', { params });
    return {
      suggestions: response.data.suggestions || [],
    };
  } catch (error) {
    throw handleApiError(error);
  }
};

/**
 * Search products
 */
export const searchProducts = async (params: {
  q: string;
  page?: number;
  page_size?: number;
}): Promise<{ products: Product[]; total: number }> => {
  try {
    const response = await apiClient.get('/api/products/search', { params });
    return {
      products: response.data.products || [],
      total: response.data.total || 0,
    };
  } catch (error) {
    throw handleApiError(error);
  }
};

/**
 * Visual search (image-based search)
 */
export const visualSearchProducts = async (imageUri: string, topK?: number): Promise<Product[]> => {
  try {
    const formData = new FormData();
    const filename = imageUri.split('/').pop() || 'search.jpg';
    const match = /\.(\w+)$/.exec(filename);
    const type = match ? `image/${match[1]}` : 'image/jpeg';

    formData.append('image', {
      uri: imageUri,
      name: filename,
      type,
    } as unknown as Blob);

    const response = await apiClient.post<{ products: Product[] }>(
      '/api/products/search/visual',
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        params: topK ? { top_k: topK } : undefined,
      }
    );

    return response.data.products || [];
  } catch (error) {
    throw handleApiError(error);
  }
};

/**
 * Get exchange products
 */
export const getExchangeProducts = async (params?: {
  page?: number;
  page_size?: number;
  random_count?: number;
  lookback_days?: number;
  seed?: number;
  exchange_type?: 'exchange_only' | 'exchange_or_purchase';
}): Promise<{ products: Product[]; total: number }> => {
  try {
    const response = await apiClient.get('/api/exchange-products', { params });
    return {
      products: response.data.products || [],
      total: response.data.total || 0,
    };
  } catch (error) {
    throw handleApiError(error);
  }
};

/**
 * Create tag
 */
export const createTag = async (name: string): Promise<{ id: number; name: string }> => {
  try {
    const response = await apiClient.post('/api/tags', { name });
    return response.data;
  } catch (error) {
    throw handleApiError(error);
  }
};
