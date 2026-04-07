import axios, { AxiosInstance, AxiosError } from 'axios';
import { API_BASE_URL, API_BASE_URL_PY } from '@/src/config/env';
import { getSecureItem, setSecureItem, deleteSecureItem } from '@/src/utils/storage';

// Storage keys
const TOKEN_KEY = 'auth_token';
const TOKEN_TYPE_KEY = 'auth_token_type';

// Create axios instances
const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

const apiClientPy: AxiosInstance = axios.create({
  baseURL: API_BASE_URL_PY,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

// Request interceptor to add auth token
apiClient.interceptors.request.use(
  async (config) => {
    const token = await getSecureItem(TOKEN_KEY);
    const tokenType = await getSecureItem(TOKEN_TYPE_KEY);
    if (token) {
      config.headers.Authorization = `${tokenType || 'Bearer'} ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

apiClientPy.interceptors.request.use(
  async (config) => {
    const token = await getSecureItem(TOKEN_KEY);
    const tokenType = await getSecureItem(TOKEN_TYPE_KEY);
    if (token) {
      config.headers.Authorization = `${tokenType || 'Bearer'} ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for error handling
export const handleApiError = (error: any): Error => {
  if (error.response) {
    const data: any = error.response.data;
    if (data?.message) {
      return new Error(data.message);
    }
    if (data?.errors) {
      const errorMessages = Object.values(data.errors).flat().join(', ');
      return new Error(errorMessages);
    }
  }
  if (error instanceof Error) {
    return error;
  }
  return new Error('An unexpected error occurred');
};

// Token management helpers
export const storeTokens = async (token: string, tokenType: string = 'Bearer'): Promise<void> => {
  await setSecureItem(TOKEN_KEY, token);
  await setSecureItem(TOKEN_TYPE_KEY, tokenType);
};

export const getAccessToken = async (): Promise<string | null> => {
  return await getSecureItem(TOKEN_KEY);
};

export const clearTokens = async (): Promise<void> => {
  await deleteSecureItem(TOKEN_KEY);
  await deleteSecureItem(TOKEN_TYPE_KEY);
};

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    return Promise.reject(handleApiError(error));
  }
);

apiClientPy.interceptors.response.use(
  (response) => response,
  (error) => {
    return Promise.reject(handleApiError(error));
  }
);

// Auth API
export const authApi = {
  login: async (email: string, password: string) => {
    const response = await apiClient.post('/api/user/login', { email, password });
    return response.data;
  },
  
  adminLogin: async (email: string, password: string) => {
    const response = await apiClient.post('/api/admin/login', { email, password });
    return response.data;
  },
  
  signup: async (data: any) => {
    const response = await apiClient.post('/api/user/signup', data);
    return response.data;
  },
  
  logout: async () => {
    const response = await apiClient.post('/api/user/logout');
    return response.data;
  },
};

// Products API
export const productsApi = {
  getRecommended: async (params?: any) => {
    const response = await apiClientPy.get('/py/api/user/recommendations/products', { params });
    return response.data;
  },
  
  getDetail: async (id: number) => {
    const response = await apiClient.get(`/api/user/get_product/${id}`);
    return response.data;
  },
  
  getSimilar: async (id: number, params?: any) => {
    const response = await apiClientPy.get(`/py/api/user/products/${id}/similar`, { params });
    return response.data;
  },
  
  getNearby: async (params: any) => {
    const response = await apiClient.get('/api/user/nearby', { params });
    return response.data;
  },
  
  search: async (params: any) => {
    const response = await apiClient.get('/api/user/search/products', { params });
    return response.data;
  },
  
  searchSuggestions: async (params: any) => {
    const response = await apiClient.get('/api/user/search/products/suggestions', { params });
    return response.data;
  },
  
  visualSearch: async (formData: FormData) => {
    const response = await apiClient.post('/api/user/search/visual', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },
  
  create: async (formData: FormData) => {
    const response = await apiClient.post('/api/user/products', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },
  
  update: async (id: number, data: any) => {
    const response = await apiClient.patch(`/api/user/products/${id}`, data);
    return response.data;
  },
  
  markSold: async (id: number) => {
    const response = await apiClient.patch(`/api/user/products/${id}/mark-sold`);
    return response.data;
  },
  
  getForEdit: async (id: number) => {
    const response = await apiClient.get(`/api/user/products/${id}/edit`);
    return response.data;
  },
  
  getEngagement: async (id: number) => {
    const response = await apiClient.get(`/api/user/products/${id}/engagement`);
    return response.data;
  },
  
  getMyCards: async (params?: any) => {
    const response = await apiClient.get('/api/user/products/cards', { params });
    return response.data;
  },
};

// Exchange API
export const exchangeApi = {
  getRecommended: async (params?: any) => {
    const response = await apiClientPy.get('/py/api/user/recommendations/exchange-products', { params });
    return response.data;
  },
  
  create: async (formData: FormData) => {
    const response = await apiClient.post('/api/exchange-products', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },
};

// Favorites API
export const favoritesApi = {
  getAll: async () => {
    const response = await apiClient.get('/api/user/get_favorites');
    return response.data;
  },
  
  add: async (productId: number) => {
    const response = await apiClient.post('/api/user/favorites', { product_id: productId });
    return response.data;
  },
};

// Messages API
export const messagesApi = {
  getContacts: async (params?: any) => {
    const response = await apiClient.get('/api/user/messages/contacts', { params });
    return response.data;
  },
  
  getThread: async (params: any) => {
    const response = await apiClient.get('/api/user/messages', { params });
    return response.data;
  },
  
  send: async (data: any) => {
    const response = await apiClient.post('/api/user/messages', data);
    return response.data;
  },
  
  getNotifications: async (params?: any) => {
    const response = await apiClient.get('/api/user/messages/notification', { params });
    return response.data;
  },
  
  transfer: async (data: any) => {
    const response = await apiClient.post('/api/user/messages/transfer', data);
    return response.data;
  },
};

// Wallet API
export const walletApi = {
  getBalance: async () => {
    const response = await apiClient.get('/api/wallets');
    return response.data;
  },
  
  createPaymentRequest: async (data: any) => {
    const response = await apiClient.post('/api/user/payment-requests', data);
    return response.data;
  },
  
  confirmPaymentRequest: async (requestId: number) => {
    const response = await apiClient.post(`/api/user/payment-requests/${requestId}/confirm`);
    return response.data;
  },
};

// AI API
export const aiApi = {
  createSession: async (data?: any) => {
    const response = await apiClient.post('/api/ai/sessions', data);
    return response.data;
  },
  
  sendMessage: async (sessionId: string, data: any) => {
    const response = await apiClient.post(`/api/ai/sessions/${sessionId}/messages`, data);
    return response.data;
  },
  
  sendVoiceMessage: async (sessionId: string, data: any) => {
    const response = await apiClient.post(`/api/ai/sessions/${sessionId}/voice-call`, data);
    return response.data;
  },
  
  getHistory: async (params?: any) => {
    const response = await apiClient.get('/api/ai/history', { params });
    return response.data;
  },
  
  getSessionMessages: async (sessionId: string) => {
    const response = await apiClient.get(`/api/ai/sessions/${sessionId}/messages`);
    return response.data;
  },
  
  deleteHistory: async (sessionId: string) => {
    const response = await apiClient.delete(`/api/ai/history/${sessionId}`);
    return response.data;
  },
  
  renameHistory: async (sessionId: string, title: string) => {
    const response = await apiClient.patch(`/api/ai/history/${sessionId}/rename`, { title });
    return response.data;
  },
};

// User API
export const userApi = {
  getProfile: async () => {
    const response = await apiClient.get('/api/user/settings');
    return response.data;
  },
  
  updateProfile: async (formData: FormData) => {
    const response = await apiClient.patch('/api/user/settings', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },
  
  getUniversityOptions: async (universityId?: number) => {
    const params = universityId ? { university_id: universityId } : {};
    const response = await apiClient.get('/api/user/settings/university-options', { params });
    return response.data;
  },
  
  updateUniversitySettings: async (data: any) => {
    const response = await apiClient.patch('/api/user/settings/university', data);
    return response.data;
  },
  
  getSellerProfile: async (sellerId: number, params?: any) => {
    const response = await apiClient.get(`/api/user/sellers/${sellerId}`, { params });
    return response.data;
  },
};

// Meta API
export const metaApi = {
  getOptions: async () => {
    const response = await apiClient.get('/api/user/meta/options');
    return response.data;
  },
  
  getDormitoriesByUniversity: async () => {
    const response = await apiClient.get('/api/user/meta/dormitories/by-university');
    return response.data;
  },
  
  createTag: async (name: string) => {
    const response = await apiClient.post('/api/user/tags', { name });
    return response.data;
  },
};

export { apiClient, apiClientPy };
