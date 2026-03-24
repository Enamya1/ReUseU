/**
 * API Client
 * Axios instance with interceptors for authentication and error handling
 */

import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig, AxiosResponse } from 'axios';
import { API_BASE_URL, API_BASE_URL_PY } from '../config';
import * as SecureStore from 'expo-secure-store';

// Token storage keys
const ACCESS_TOKEN_KEY = 'access_token';
const TOKEN_TYPE_KEY = 'token_type';

/**
 * Get stored access token
 */
export const getAccessToken = async (): Promise<string | null> => {
  try {
    return await SecureStore.getItemAsync(ACCESS_TOKEN_KEY);
  } catch {
    return null;
  }
};

/**
 * Get stored token type
 */
export const getTokenType = async (): Promise<string | null> => {
  try {
    return await SecureStore.getItemAsync(TOKEN_TYPE_KEY);
  } catch {
    return null;
  }
};

/**
 * Store authentication tokens
 */
export const storeTokens = async (accessToken: string, tokenType: string = 'Bearer'): Promise<void> => {
  await Promise.all([
    SecureStore.setItemAsync(ACCESS_TOKEN_KEY, accessToken),
    SecureStore.setItemAsync(TOKEN_TYPE_KEY, tokenType),
  ]);
};

/**
 * Clear stored tokens
 */
export const clearTokens = async (): Promise<void> => {
  await Promise.all([
    SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY),
    SecureStore.deleteItemAsync(TOKEN_TYPE_KEY),
  ]);
};

/**
 * Create Axios instance with default config
 */
const createApiClient = (baseURL: string): AxiosInstance => {
  const client = axios.create({
    baseURL,
    timeout: 30000,
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
  });

  // Request interceptor for adding auth token
  client.interceptors.request.use(
    async (config: InternalAxiosRequestConfig) => {
      const token = await getAccessToken();
      const tokenType = await getTokenType();
      
      if (token && config.headers) {
        config.headers.Authorization = `${tokenType || 'Bearer'} ${token}`;
      }
      
      return config;
    },
    (error: AxiosError) => {
      return Promise.reject(error);
    }
  );

  // Response interceptor for error handling
  client.interceptors.response.use(
    (response: AxiosResponse) => response,
    async (error: AxiosError) => {
      if (error.response?.status === 401) {
        // Token expired or invalid - clear tokens
        await clearTokens();
      }
      return Promise.reject(error);
    }
  );

  return client;
};

/**
 * Main API client (Laravel backend)
 * Used for: Authentication, Products, Users, Messages, Wallets, etc.
 */
export const apiClient = createApiClient(API_BASE_URL);

/**
 * Python API client (AI/ML features)
 * Used for: Visual search, AI assistant, etc.
 */
export const apiPyClient = createApiClient(API_BASE_URL_PY);

/**
 * Helper function to handle API errors
 */
export const handleApiError = (error: unknown): { message: string; errors?: Record<string, string[]> } => {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as { message?: string; detail?: string; errors?: Record<string, string[]> } | undefined;
    return {
      message: data?.message || data?.detail || error.message || 'An error occurred',
      errors: data?.errors,
    };
  }
  return {
    message: error instanceof Error ? error.message : 'An unexpected error occurred',
  };
};

/**
 * Export types for convenience
 */
export type { AxiosInstance, AxiosResponse, AxiosError };
