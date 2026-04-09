/**
 * Authentication Context
 * Manages authentication state and provides auth methods
 */

import React, { createContext, useContext, useState, useCallback, useEffect, useRef, ReactNode } from 'react';
import type { User, SignupData, University, Dormitory, MetaOptionsResponse, Product } from '../types';
import * as authService from '../services/authService';
import * as productService from '../services/productService';
import { getAccessToken, apiClient, apiClientPy } from '../services/api';

/**
 * Derive a basic user object from email (matching web platform)
 */
const deriveUserFromEmail = (email: string, role: User['role'], accountCompleted?: boolean): User => {
  const identifier = (email.split('@')[0] || email).trim() || 'user';
  return {
    id: 0,
    full_name: identifier,
    username: identifier,
    email,
    role,
    status: 'active',
    account_completed: accountCompleted,
  };
};

interface AuthContextType {
  user: User | null;
  accessToken: string | null;
  tokenType: string | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  adminLogin: (email: string, password: string) => Promise<boolean>;
  signup: (data: SignupData) => Promise<{ user?: User; message?: string; errors?: Record<string, string[]> }>;
  logout: () => Promise<void>;
  updateProfile: (data: Partial<User> & { profile_picture?: string }) => Promise<boolean>;
  getUniversityOptions: (universityId?: number) => Promise<{ universities: University[]; dormitories: Dormitory[]; current?: { university_id?: number; dormitory_id?: number } }>;
  updateUniversitySettings: (data: { university_id: number; dormitory_id: number }) => Promise<boolean>;
  getMetaOptions: () => Promise<MetaOptionsResponse>;
  getDormitoriesByUniversity: () => Promise<{ dormitories: Dormitory[] }>;
  getMyProductCards: (params?: { page?: number; page_size?: number }) => Promise<{ products: Product[]; total: number }>;
  getSellerProfile: (sellerId: number, params?: { page?: number; page_size?: number }) => Promise<{ seller: { id: number; username: string; profile_picture?: string; bio?: string }; products: Product[]; total: number }>;
  getRecommendedProducts: (params?: { page?: number; page_size?: number; random_count?: number; lookback_days?: number }) => Promise<{ products: Product[]; total: number }>;
  getSimilarProducts: (productId: number, params?: { page?: number; page_size?: number }) => Promise<{ products: Product[]; total: number }>;
  getProductDetail: (productId: number) => Promise<Product>;
  getProductForEdit: (productId: number) => Promise<Product>;
  updateProduct: (productId: number, data: any) => Promise<Product>;
  markProductSold: (productId: number) => Promise<void>;
  getProductEngagement: (productId: number) => Promise<any>;
  createAiSession: (data?: { title?: string | null }) => Promise<any>;
  sendAiSessionMessage: (data: { session_id: string; message: string; message_type?: 'text' | 'voice'; audio_duration_seconds?: number }) => Promise<any>;
  sendAiVoiceCallMessage: (data: { session_id: string; message: string; audio_duration_seconds?: number }) => Promise<any>;
  getAiHistory: (params?: { page?: number; page_size?: number; include_messages?: boolean }) => Promise<any>;
  getAiSessionMessages: (sessionId: string) => Promise<any>;
  deleteAiHistory: (sessionId: string) => Promise<void>;
  renameAiHistory: (sessionId: string, title: string) => Promise<any>;
  getRecommendedExchangeProducts: (params?: { page?: number; page_size?: number }) => Promise<any>;
  refreshBalance: (nextBalance?: number | null) => Promise<number | null>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [tokenType, setTokenType] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const hasInitialized = useRef(false);

  const isAuthenticated = !!user && !!accessToken;
  const isAdmin = user?.role === 'admin';

  // Initialize auth state from stored tokens
  useEffect(() => {
    const initializeAuth = async () => {
      if (hasInitialized.current) return;
      hasInitialized.current = true;

      try {
        const token = await getAccessToken();
        if (token) {
          setAccessToken(token);
          // Note: We don't have a GET profile endpoint
          // User will be set properly after login/signup
          // For app restart, we derive a minimal user from stored data
          setUser({
            id: 0,
            full_name: '',
            username: '',
            email: '',
            role: 'user',
            status: 'active',
          });
        }
      } catch (error) {
        // Token invalid or expired
        setUser(null);
        setAccessToken(null);
        setTokenType(null);
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, []);

  const login = useCallback(async (email: string, password: string): Promise<boolean> => {
    try {
      const response = await authService.login(email, password);
      if (response.access_token) {
        setAccessToken(response.access_token);
        setTokenType(response.token_type || 'Bearer');
        
        // Derive user from email (matching web platform approach)
        const derivedUser = deriveUserFromEmail(email, 'user', response.account_completed);
        setUser(derivedUser);
        return true;
      }
      return false;
    } catch (error) {
      throw error;
    }
  }, []);

  const adminLogin = useCallback(async (email: string, password: string): Promise<boolean> => {
    try {
      const response = await authService.adminLogin(email, password);
      if (response.access_token) {
        setAccessToken(response.access_token);
        setTokenType(response.token_type || 'Bearer');
        
        const derivedUser = deriveUserFromEmail(email, 'admin', response.account_completed);
        setUser(derivedUser);
        return true;
      }
      return false;
    } catch (error) {
      throw error;
    }
  }, []);

  const signup = useCallback(async (data: SignupData) => {
    return authService.signup(data);
  }, []);

  const logout = useCallback(async () => {
    await authService.logout();
    setUser(null);
    setAccessToken(null);
    setTokenType(null);
  }, []);

  const updateProfile = useCallback(async (data: Partial<User> & { profile_picture?: string }): Promise<boolean> => {
    try {
      const updatedUser = await authService.updateProfile(data);
      setUser(updatedUser);
      return true;
    } catch (error) {
      throw error;
    }
  }, []);

  const getUniversityOptions = useCallback(async (universityId?: number) => {
    return authService.getUniversityOptions(universityId);
  }, []);

  const updateUniversitySettings = useCallback(async (data: { university_id: number; dormitory_id: number }): Promise<boolean> => {
    try {
      await authService.updateUniversitySettings(data);
      // Update user with dormitory_id
      setUser(prev => prev ? { ...prev, dormitory_id: data.dormitory_id } : null);
      return true;
    } catch (error) {
      throw error;
    }
  }, []);

  const getMetaOptions = useCallback(async () => {
    return authService.getMetaOptions();
  }, []);

  const getDormitoriesByUniversity = useCallback(async () => {
    return authService.getDormitoriesByUniversity();
  }, []);

  const getMyProductCards = useCallback(async (params?: { page?: number; page_size?: number }) => {
    return productService.getMyProducts(params);
  }, []);

  const getSellerProfile = useCallback(async (sellerId: number, params?: { page?: number; page_size?: number }) => {
    return productService.getSellerProfile(sellerId, params);
  }, []);

  const getRecommendedProducts = useCallback(async (params?: { page?: number; page_size?: number; random_count?: number; lookback_days?: number }) => {
    return productService.getRecommendedProducts(params);
  }, []);

  const getSimilarProducts = useCallback(async (productId: number, params?: { page?: number; page_size?: number }) => {
    return productService.getSimilarProducts(productId, params);
  }, []);

  const getProductDetail = useCallback(async (productId: number) => {
    return productService.getProductById(productId);
  }, []);

  const refreshBalance = useCallback(async (nextBalance?: number | null): Promise<number | null> => {
    if (nextBalance !== undefined && nextBalance !== null) {
      setUser(prev => prev ? { ...prev, balance: nextBalance } : null);
      return nextBalance;
    }
    // Note: We don't have a GET profile endpoint
    // Balance should be fetched from wallet endpoint instead
    return null;
  }, []);

  const getProductForEdit = useCallback(async (productId: number) => {
    return productService.getProductForEdit(productId);
  }, []);

  const updateProduct = useCallback(async (productId: number, data: any) => {
    return productService.updateProduct(productId, data);
  }, []);

  const markProductSold = useCallback(async (productId: number) => {
    return productService.markProductSold(productId);
  }, []);

  const getProductEngagement = useCallback(async (productId: number) => {
    return productService.getProductEngagement(productId);
  }, []);

  const createAiSession = useCallback(async (data?: { title?: string | null }) => {
    const response = await apiClient.post('/api/ai/sessions', data || {});
    return response.data;
  }, []);

  const sendAiSessionMessage = useCallback(async (data: { session_id: string; message: string; message_type?: 'text' | 'voice'; audio_duration_seconds?: number }) => {
    const response = await apiClient.post(`/api/ai/sessions/${data.session_id}/messages`, { message: data.message, message_type: data.message_type || 'text', audio_duration_seconds: data.audio_duration_seconds });
    return response.data;
  }, []);

  const sendAiVoiceCallMessage = useCallback(async (data: { session_id: string; message: string; audio_duration_seconds?: number }) => {
    const response = await apiClient.post(`/api/ai/sessions/${data.session_id}/voice-call`, data);
    return response.data;
  }, []);

  const getAiHistory = useCallback(async (params?: { page?: number; page_size?: number; include_messages?: boolean }) => {
    const response = await apiClient.get('/api/ai/history', { params });
    return {
      history: response.data.history || [],
      total: response.data.total || 0,
      page: response.data.page || 1,
      page_size: response.data.page_size || 20,
      total_pages: response.data.total_pages || 1,
    };
  }, []);

  const getAiSessionMessages = useCallback(async (sessionId: string) => {
    const response = await apiClient.get(`/api/ai/sessions/${sessionId}/messages`);
    return response.data;
  }, []);

  const deleteAiHistory = useCallback(async (sessionId: string) => {
    await apiClient.delete(`/api/ai/history/${sessionId}`);
  }, []);

  const renameAiHistory = useCallback(async (sessionId: string, title: string) => {
    const response = await apiClient.patch(`/api/ai/history/${sessionId}/rename`, { title });
    return response.data;
  }, []);

  const getRecommendedExchangeProducts = useCallback(async (params?: { page?: number; page_size?: number }) => {
    const response = await apiClientPy.get('/py/api/user/recommendations/exchange-products', { params });
    return response.data;
  }, []);

  const refreshUser = useCallback(async () => {
    // Note: We don't have a GET profile endpoint
    // User data is updated through specific endpoints
  }, []);

  const value: AuthContextType = {
    user,
    accessToken,
    tokenType,
    isAuthenticated,
    isAdmin,
    isLoading,
    login,
    adminLogin,
    signup,
    logout,
    updateProfile,
    getUniversityOptions,
    updateUniversitySettings,
    getMetaOptions,
    getDormitoriesByUniversity,
    getMyProductCards,
    getSellerProfile,
    getRecommendedProducts,
    getSimilarProducts,
    getProductDetail,
    getProductForEdit,
    updateProduct,
    markProductSold,
    getProductEngagement,
    createAiSession,
    sendAiSessionMessage,
    sendAiVoiceCallMessage,
    getAiHistory,
    getAiSessionMessages,
    deleteAiHistory,
    renameAiHistory,
    getRecommendedExchangeProducts,
    refreshBalance,
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
