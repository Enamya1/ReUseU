/**
 * Environment Configuration
 * Centralized configuration for API endpoints and keys
 * Values sourced from campus-connect-marketplace-main/.env.local
 */

/**
 * Normalize URL by removing trailing slashes
 */
const normalizeUrl = (value: string): string => value.trim().replace(/\/+$/, '');

/**
 * API Base URL (Main backend - Laravel)
 * Used for: Authentication, Products, Users, Messages, etc.
 */
export const API_BASE_URL = normalizeUrl('http://10.29.14.209:8000');

/**
 * API Base URL Python (Python backend)
 * Used for: AI features, Visual search, etc.
 */
export const API_BASE_URL_PY = normalizeUrl('http://10.29.14.209:8001');

/**
 * AMap JavaScript Key
 * Used for: Map rendering in web version
 * Note: For React Native, we use react-native-maps instead
 */
export const AMAP_JS_KEY = 'e00b7655186023fba1274ba1d9528369';

/**
 * AMap Security Code
 * Used for: AMap API authentication
 */
export const AMAP_SECURITY_CODE = '1ecb3c08792aa9ec7b6732480b6a7a10';

/**
 * Default map center coordinates (China center)
 */
export const DEFAULT_MAP_CENTER = {
  latitude: 35.8617,
  longitude: 104.1954,
};

/**
 * Default map zoom level
 */
export const DEFAULT_MAP_ZOOM = 4;

/**
 * API Configuration object
 */
export const apiConfig = {
  baseURL: API_BASE_URL,
  baseURLPy: API_BASE_URL_PY,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
};

/**
 * Build full API URL
 */
export const apiUrl = (endpoint: string): string => {
  const trimmed = endpoint.trim();
  if (!trimmed) return API_BASE_URL || '/';
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  
  const base = API_BASE_URL ? `${API_BASE_URL}/` : '/';
  const path = trimmed.startsWith('/') ? trimmed.slice(1) : trimmed;
  return `${base}${path}`;
};

/**
 * Build full Python API URL
 */
export const apiPyUrl = (endpoint: string): string => {
  const trimmed = endpoint.trim();
  if (!trimmed) return API_BASE_URL_PY || '/';
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  
  const base = API_BASE_URL_PY ? `${API_BASE_URL_PY}/` : '/';
  const path = trimmed.startsWith('/') ? trimmed.slice(1) : trimmed;
  return `${base}${path}`;
};

/**
 * Normalize image URL for display
 * Handles localhost URLs and relative paths
 * Tries both Laravel and Python API base URLs
 */
export const normalizeImageUrl = (value?: string | null): string | undefined => {
  if (!value) return undefined;
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  if (/^(data:|blob:)/i.test(trimmed)) return trimmed;
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  
  // Try to determine which base URL to use based on the path
  // Storage URLs typically go through Laravel
  if (trimmed.startsWith('/storage/')) {
    return `${API_BASE_URL}${trimmed}`;
  }
  
  // Default to Laravel API URL
  return apiUrl(trimmed);
};

/**
 * Normalize image URL specifically for Python API responses
 */
export const normalizePythonImageUrl = (value?: string | null): string | undefined => {
  if (!value) return undefined;
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  if (/^(data:|blob:)/i.test(trimmed)) return trimmed;
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  
  // Storage URLs
  if (trimmed.startsWith('/storage/')) {
    return `${API_BASE_URL}${trimmed}`;
  }
  
  // Try Laravel API first, then Python API
  return `${API_BASE_URL}${trimmed}`;
};

/**
 * App Configuration
 */
export const appConfig = {
  name: 'Suki',
  version: '1.0.0',
  defaultCurrency: 'CNY',
  supportedCurrencies: ['CNY', 'USD', 'EUR'],
  supportedLanguages: ['en', 'zh', 'ar'],
  defaultLanguage: 'en',
  maxImagesPerProduct: 6,
  maxMessageLength: 1000,
  paginationPageSize: 20,
};
