/**
 * Visual Search Service
 * Handles image-based product search
 */

import { apiRequest } from './api';
import { Product } from '../types';

export interface VisualSearchRequest {
  image: {
    uri: string;
    name: string;
    type: string;
  };
  top_k?: number;
}

export interface VisualSearchResponse {
  message: string;
  query: {
    top_k: number;
    model_name: string;
    embedding_dim: number;
  };
  count: number;
  products: Product[];
}

/**
 * Search for products using an image
 * POST /api/user/search/visual
 */
export const visualSearch = async (
  request: VisualSearchRequest
): Promise<VisualSearchResponse> => {
  const formData = new FormData();
  
  // Append the image file
  formData.append('image', {
    uri: request.image.uri,
    name: request.image.name,
    type: request.image.type,
  } as any);

  // Append optional top_k parameter
  if (request.top_k) {
    formData.append('top_k', String(request.top_k));
  }

  const response = await apiRequest<VisualSearchResponse>({
    endpoint: '/api/user/search/visual',
    method: 'POST',
    body: formData,
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });

  return response;
};
