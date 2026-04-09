/**
 * Authentication Service
 * Handles all authentication-related API calls
 */

import { apiClient, storeTokens, clearTokens } from './api';
import type { 
  User, 
  LoginCredentials, 
  SignupData, 
  AuthResponse, 
  University, 
  Dormitory,
  MetaOptionsResponse,
  MetaCategoryOption,
  MetaConditionLevelOption,
  Tag,
} from '../types';

/**
 * Login with email and password
 */
export const login = async (email: string, password: string): Promise<AuthResponse> => {
  const response = await apiClient.post<AuthResponse>('/api/user/login', {
    email,
    password,
  });

  if (response.data.access_token) {
    await storeTokens(response.data.access_token, response.data.token_type);
  }

  return response.data;
};

/**
 * Admin login
 */
export const adminLogin = async (email: string, password: string): Promise<AuthResponse> => {
  const response = await apiClient.post<AuthResponse>('/api/admin/login', {
    email,
    password,
  });

  if (response.data.access_token) {
    await storeTokens(response.data.access_token, response.data.token_type);
  }

  return response.data;
};

/**
 * Signup with user data
 */
export const signup = async (data: SignupData): Promise<AuthResponse> => {
  const response = await apiClient.post<AuthResponse>('/api/user/signup', data);
  return response.data;
};

/**
 * Logout and clear tokens
 */
export const logout = async (): Promise<void> => {
  await clearTokens();
};

/**
 * Update user profile
 * Note: Uses PATCH method matching web platform
 */
export const updateProfile = async (data: Partial<User> & { profile_picture?: string }): Promise<User> => {
  const response = await apiClient.patch<{ message: string; user: User }>('/api/user/settings', data);
  return response.data.user;
};

/**
 * Get university options
 */
export const getUniversityOptions = async (universityId?: number): Promise<{
  current?: { university_id?: number; dormitory_id?: number };
  universities: University[];
  dormitories: Dormitory[];
}> => {
  const params = universityId ? { university_id: universityId } : {};
  const response = await apiClient.get('/api/user/settings/university-options', { params });
  return response.data;
};

/**
 * Update university settings
 */
export const updateUniversitySettings = async (data: { 
  university_id: number; 
  dormitory_id: number 
}): Promise<void> => {
  await apiClient.patch('/api/user/settings/university', data);
};

/**
 * Get meta options (categories, conditions, tags)
 */
export const getMetaOptions = async (): Promise<MetaOptionsResponse> => {
  const response = await apiClient.get<MetaOptionsResponse>('/api/user/meta/options');
  return response.data;
};

/**
 * Get dormitories by university
 */
export const getDormitoriesByUniversity = async (): Promise<{
  dormitories: Dormitory[];
}> => {
  const response = await apiClient.get('/api/user/meta/dormitories/by-university');
  return response.data;
};

/**
 * Update user language preference
 */
export const updateLanguage = async (language: string): Promise<void> => {
  await apiClient.put('/api/user/settings/language', { language });
};

/**
 * Upload profile picture
 */
export const uploadProfilePicture = async (imageUri: string): Promise<string> => {
  const formData = new FormData();
  const filename = imageUri.split('/').pop() || 'profile.jpg';
  const match = /\.(\w+)$/.exec(filename);
  const type = match ? `image/${match[1]}` : 'image/jpeg';

  formData.append('file', {
    uri: imageUri,
    name: filename,
    type,
  } as unknown as Blob);

  const response = await apiClient.post<{ profile_picture: string }>(
    '/api/user/settings/profile-picture',
    formData,
    {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }
  );

  return response.data.profile_picture;
};

