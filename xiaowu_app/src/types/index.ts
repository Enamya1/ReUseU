/**
 * TypeScript Type Definitions
 * Matching the web platform types from campus-connect-marketplace-main
 */

// ============================================
// User Types
// ============================================

export interface User {
  id: number;
  full_name: string;
  username: string;
  email: string;
  phone_number?: string;
  profile_picture?: string;
  student_id?: string;
  bio?: string;
  date_of_birth?: string;
  gender?: string;
  language?: string;
  timezone?: string;
  dormitory_id?: number;
  account_completed?: boolean;
  role: 'user' | 'admin';
  status: 'active' | 'inactive';
  balance?: number;
}

// ============================================
// University & Dormitory Types
// ============================================

export interface University {
  id: number;
  name: string;
  domain: string;
  location?: string;
  pic?: string;
}

export interface Dormitory {
  id: number;
  dormitory_name: string;
  domain: string;
  location?: string;
  lat?: number;
  lng?: number;
  is_active: boolean;
  university_id: number;
}

// ============================================
// Category & Condition Types
// ============================================

export interface Category {
  id: number;
  name: string;
  parent_id?: number;
  icon?: string;
  logo?: string;
  description?: string;
}

export interface ConditionLevel {
  id: number;
  name: string;
  description?: string;
  sort_order: number;
  level?: number;
}

export interface Tag {
  id: number;
  name: string;
}

// ============================================
// Product Types
// ============================================

export interface ProductImage {
  id: number;
  product_id: number;
  image_url: string;
  image_thumbnail_url?: string;
  is_primary: boolean;
}

export interface Product {
  id: number;
  seller_id: number;
  seller?: {
    id: number;
    username: string;
    full_name?: string;
    profile_picture?: string;
  };
  dormitory_id: number;
  dormitory?: Dormitory | {
    latitude?: number;
    longitude?: number;
    dormitory_name?: string;
  };
  category_id: number;
  category?: Category;
  condition_level_id: number;
  condition_level?: ConditionLevel;
  title: string;
  description?: string;
  price: number;
  currency?: string;
  status: 'available' | 'sold' | 'reserved';
  is_promoted?: boolean;
  created_at: string;
  images: ProductImage[];
  image_thumbnail_url?: string;
  tags: Tag[];
  distance_km?: number;
  exchange_target?: string;
  exchange_type?: 'exchange_only' | 'exchange_or_purchase' | null;
  target_product_title?: string | null;
  target_product_category_id?: number | null;
  target_product_condition_id?: number | null;
  expiration_date?: string | null;
  visual_similarity_score?: number;
}

// ============================================
// Behavioral Event Types
// ============================================

export interface BehavioralEvent {
  id: number;
  user_id: number;
  event_type: 'view' | 'favorite' | 'message' | 'purchase' | 'offer';
  product_id?: number;
  category_id?: number;
  seller_id?: number;
  metadata?: Record<string, unknown>;
  occurred_at: string;
  session_id: string;
}

// ============================================
// Wallet Types
// ============================================

export interface Wallet {
  id: string;
  user_id: number;
  balance: number;
  currency: string;
  status: 'active' | 'frozen' | 'closed';
  is_public?: boolean;
  created_at: string;
  metadata?: Record<string, unknown>;
}

export interface Transaction {
  id: string;
  wallet_id: string;
  type: 'top-up' | 'withdrawal' | 'transfer_in' | 'transfer_out' | 'fee' | 'deposit' | 'initial' | 'transfer' | 'withdraw' | 'unknown';
  amount: number;
  fee: number;
  status: 'pending' | 'completed' | 'failed' | 'cancelled';
  description: string;
  related_wallet_id?: string;
  created_at: string;
}

export interface WalletStatusHistory {
  id: string;
  wallet_id: string;
  old_status: string;
  new_status: string;
  reason: string;
  changed_by: number;
  created_at: string;
}

// ============================================
// Message Types
// ============================================

export interface Message {
  id: number | string;
  conversation_id?: number;
  sender_id: number;
  sender_username?: string;
  receiver_id?: number;
  message_text?: string;
  content?: string;
  message_type?: 'text' | 'payment_request' | 'payment_confirmation' | 'transfer' | 'product_mention';
  message_kind?: 'normal' | 'payment_request_unconfirmed' | 'payment_request_confirmed' | 'transfer' | 'product_mention';
  payment_request_status?: 'pending' | 'paid' | null;
  transfer_data?: any;
  product?: {
    id: number;
    seller_id: number;
    title: string;
    price: number;
    currency: string;
    image_url?: string;
  };
  image_url?: string;
  file_url?: string;
  audio_url?: string;
  audio_duration_seconds?: number;
  read_at?: string;
  status?: 'sent' | 'delivered' | 'read';
  created_at: string;
}

export interface Conversation {
  id: number;
  other_user_id: number;
  other_user_name: string;
  other_user_avatar?: string;
  last_message?: string;
  last_message_time?: string;
  unread_count?: number;
  product_id?: number;
  product_title?: string;
  product_image?: string;
}

export interface MessageContact {
  conversation_id?: number;
  message_id?: number;
  sender_name?: string;
  sender_profile_picture?: string;
  last_message?: string;
  message_time?: string;
}

// ============================================
// AI Types
// ============================================

export interface AiSession {
  id: string;
  title?: string;
  created_at?: string;
  updated_at?: string;
  message_count?: number;
}

export interface AiMessage {
  id: string;
  session_id: string;
  role: 'user' | 'assistant';
  content: string;
  message_type?: 'text' | 'voice';
  audio_duration_seconds?: number;
  created_at: string;
}

// ============================================
// Auth Types
// ============================================

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface SignupData {
  full_name: string;
  username: string;
  email: string;
  password: string;
  phone_number?: string;
}

export interface AuthResponse {
  message?: string;
  access_token?: string;
  token_type?: string;
  account_completed?: boolean;
  user?: User;
  errors?: Record<string, string[]>;
}

// ============================================
// API Response Types
// ============================================

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export interface ApiError {
  message?: string;
  detail?: string;
  errors?: Record<string, string[]>;
  status_code?: number;
}

// ============================================
// Search Types
// ============================================

export interface SearchSuggestion {
  id: string;
  title: string;
}

export interface SearchParams {
  q: string;
  page?: number;
  page_size?: number;
  category_id?: number;
  condition_level_id?: number;
  min_price?: number;
  max_price?: number;
  sort_by?: 'newest' | 'price_asc' | 'price_desc' | 'distance';
}

// ============================================
// Filter Types
// ============================================

export interface ProductFilters {
  search?: string;
  category_ids?: number[];
  condition_ids?: number[];
  tag_ids?: number[];
  min_price?: number;
  max_price?: number;
  status?: 'available' | 'sold' | 'reserved';
  sort_by?: 'newest' | 'price_asc' | 'price_desc' | 'distance';
}

// ============================================
// Form Types
// ============================================

export interface CreateProductInput {
  title: string;
  description?: string;
  price: number;
  currency?: string;
  category_id: number;
  condition_level_id: number;
  dormitory_id?: number;
  tags?: number[];
  images?: string[];
  exchange_type?: 'exchange_only' | 'exchange_or_purchase' | null;
  target_product_title?: string;
  target_product_category_id?: number;
  target_product_condition_id?: number;
  expiration_date?: string;
}

export interface UpdateProductInput extends Partial<CreateProductInput> {
  status?: 'available' | 'sold' | 'reserved';
}

export interface UpdateProfileInput {
  full_name?: string;
  username?: string;
  phone_number?: string;
  bio?: string;
  date_of_birth?: string;
  gender?: string;
  language?: string;
  timezone?: string;
  profile_picture?: string;
}

// ============================================
// Currency Types
// ============================================

export interface CurrencyRate {
  code: string;
  name: string;
  symbol: string;
  rate: number;
}

export interface CurrencyContextType {
  selectedCurrency: string;
  setSelectedCurrency: (currency: string) => void;
  convertPrice: (price: number, fromCurrency?: string) => number;
  formatPrice: (price: number, currency?: string) => string;
  formatWithSelectedCurrency: (price: number, fromCurrency?: string) => string;
  formatSelectedCurrencyParts: (price: number, fromCurrency?: string) => { amount: string; currency: string };
  rates: CurrencyRate[];
  isLoading: boolean;
}

// ============================================
// Navigation Types
// ============================================

export type RootStackParamList = {
  '(tabs)': undefined;
  '(auth)': undefined;
  'product/[id]': { id: string };
  'seller/[id]': { id: string };
  'create-listing': undefined;
  'favorites': undefined;
  'wallet': undefined;
  'my-listings': undefined;
  'my-listings/[id]': { id: string };
  'search': { q?: string; mode?: 'text' | 'visual' };
  'exchange': undefined;
  'ai': undefined;
  'modal': undefined;
};

export type AuthStackParamList = {
  login: undefined;
  signup: undefined;
  onboarding: undefined;
};

export type TabParamList = {
  index: undefined;
  nearby: undefined;
  messages: { conversationId?: number; receiverId?: number; receiverName?: string };
  profile: undefined;
};

// ============================================
// Meta/Options Types
// ============================================

export interface MetaCategoryOption {
  id: number;
  name: string;
  description?: string;
  parent_id?: number;
  icon?: string;
  logo?: string;
}

export interface MetaConditionLevelOption {
  id: number;
  name: string;
  description?: string;
  sort_order?: number;
  level?: number;
}

export interface MetaOptionsResponse {
  categories?: MetaCategoryOption[];
  condition_levels?: MetaConditionLevelOption[];
  tags?: Tag[];
}

// ============================================
// Product Engagement Types
// ============================================

export interface ProductEngagement {
  views: number;
  clicks: number;
  favorites: number;
  messages: number;
  last_visitors?: Array<{
    id: number;
    username?: string;
    profile_picture?: string;
    visited_at?: string;
  }>;
}
