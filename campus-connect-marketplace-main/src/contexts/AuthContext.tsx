import React, { createContext, useContext, useState, useCallback, ReactNode, useEffect, useMemo, useRef } from 'react';
import { User } from '@/lib/mockData';
import { apiUrl, apiPyUrl } from '@/lib/api';
import i18n from '@/i18n';

interface AuthContextType {
  user: User | null;
  accessToken: string | null;
  tokenType: string | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  adminLogin: (email: string, password: string) => Promise<boolean>;
  signup: (data: SignupData) => Promise<SignupResponseBody>;
  logout: () => void;
  updateProfile: (data: Omit<Partial<User>, "profile_picture"> & { profile_picture?: File | string }) => Promise<boolean>;
  getUniversityOptions: (universityId?: number) => Promise<UniversityOptionsResponseBody>;
  updateUniversitySettings: (data: { university_id: number; dormitory_id: number }) => Promise<boolean>;
  getMetaOptions: () => Promise<MetaOptionsResponseBody>;
  getDormitoriesByUniversity: () => Promise<DormitoriesByUniversityResponseBody>;
  getMyProductCards: (params?: { page?: number; page_size?: number }) => Promise<MyProductCardsResponseBody>;
  getSellerProfile: (sellerId: number, params?: { page?: number; page_size?: number }) => Promise<SellerProfileResponseBody>;
  getRecommendedProducts: (params?: {
    page?: number;
    page_size?: number;
    random_count?: number;
    lookback_days?: number;
    seed?: number;
  }) => Promise<RecommendationsResponseBody>;
  getSimilarProducts: (
    productId: number,
    params?: { page?: number; page_size?: number },
  ) => Promise<SimilarProductsResponseBody>;
  getProductDetail: (productId: number) => Promise<ProductDetailResponseBody>;
  getNearby: (params: {
    lat: number;
    lng: number;
    distance_km?: number;
    category_id?: number;
    condition_level_id?: number;
    q?: string;
    location_q?: string;
  }) => Promise<NearbyResponseBody>;
  createProduct: (data: CreateProductInput) => Promise<CreateProductResponseBody>;
  createExchangeProduct: (data: CreateExchangeProductInput) => Promise<CreateExchangeProductResponseBody>;
  createTag: (data: CreateTagInput) => Promise<CreateTagResponseBody>;
  sendMessage: (data: SendMessageInput) => Promise<SendMessageResponseBody>;
  transferMessage: (data: TransferMessageInput) => Promise<TransferMessageResponseBody>;
  createPaymentRequest: (data: CreatePaymentRequestInput) => Promise<CreatePaymentRequestResponseBody>;
  confirmPaymentRequest: (requestId: number) => Promise<ConfirmPaymentRequestResponseBody>;
  createAiSession: (data?: { title?: string | null }) => Promise<CreateAiSessionResponseBody>;
  sendAiSessionMessage: (data: {
    session_id: string;
    message: string;
    message_type?: "text" | "voice";
    audio_duration_seconds?: number;
  }) => Promise<AiSessionMessageResponseBody>;
  getAiHistory: (params?: {
    page?: number;
    page_size?: number;
    include_messages?: boolean;
  }) => Promise<AiHistoryResponseBody>;
  deleteAiHistory: (sessionId: string) => Promise<DeleteAiHistoryResponseBody>;
  renameAiHistory: (data: { session_id: string; title: string }) => Promise<RenameAiHistoryResponseBody>;
  getAiSessionMessages: (sessionId: string) => Promise<AiSessionMessagesResponseBody>;
  getRecommendedExchangeProducts: (params?: {
    page?: number;
    page_size?: number;
    random_count?: number;
    lookback_days?: number;
    seed?: number;
    exchange_type?: "exchange_only" | "exchange_or_purchase";
  }) => Promise<ExchangeRecommendationsResponseBody>;
  getMessageContacts: (params?: { limit?: number }) => Promise<MessageContactsResponseBody>;
  getMessages: (params: { conversation_id: number; limit?: number; before_id?: number }) => Promise<MessageThreadResponseBody>;
  getMessageNotifications: (params?: { limit?: number }) => Promise<MessageNotificationsResponseBody>;
  refreshBalance: (nextBalance?: number | null) => Promise<number | null>;
  getProductSearchSuggestions: (params: {
    q: string;
    suggestions_limit?: number;
  }) => Promise<ProductSearchSuggestionsResponseBody>;
  searchProducts: (params: {
    q: string;
    page?: number;
    page_size?: number;
  }) => Promise<SearchProductsResponseBody>;
  searchVisualProducts: (params: {
    image: File;
    top_k?: number;
  }) => Promise<SearchVisualProductsResponseBody>;
  getProductForEdit: (productId: number) => Promise<GetProductForEditResponseBody>;
  getProductEngagement: (productId: number) => Promise<ProductEngagementResponseBody>;
  updateProduct: (productId: number, data: UpdateProductInput) => Promise<UpdateProductResponseBody>;
  markProductSold: (productId: number) => Promise<MarkProductSoldResponseBody>;
  updateProductImages: (productId: number, data: UpdateProductImagesInput) => Promise<UpdateProductImagesResponseBody>;
}

interface SignupData {
  full_name: string;
  username: string;
  email: string;
  password: string;
  phone_number?: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

type LoginResponse = {
  message?: string;
  access_token?: string;
  token_type?: string;
  account_completed?: boolean;
};

type SignupResponseBody = {
  message?: string;
  user?: User;
  errors?: Record<string, string[]>;
};

type UpdateProfileResponse = {
  message?: string;
  user?: User;
  errors?: Record<string, string[]>;
};

type UserLanguageResponse = {
  message?: string;
  language?: string;
};

type UserProfilePictureResponse = {
  message?: string;
  profile_picture?: string | null;
};

type UniversityOption = {
  id: number;
  name: string;
};

type DormitoryOption = {
  id: number;
  dormitory_name: string;
  is_active?: boolean;
  university_id?: number;
};

type UniversityOptionsResponseBody = {
  message?: string;
  current?: { university_id?: number | null; dormitory_id?: number | null };
  universities?: UniversityOption[];
  dormitories?: DormitoryOption[];
  errors?: Record<string, string[]>;
};

type UpdateUniversitySettingsResponseBody = {
  message?: string;
  user?: { id: number; dormitory_id?: number | null };
  university?: UniversityOption;
  dormitory?: DormitoryOption;
  errors?: Record<string, string[]>;
};

type MetaCategoryOption = {
  id: number;
  name: string;
  description?: string | null;
  parent_id?: number | null;
  icon?: string | null;
  logo?: string | null;
};

type MetaConditionLevelOption = {
  id: number;
  name: string;
  description?: string | null;
  sort_order?: number | null;
};

type MetaTagOption = {
  id: number;
  name: string;
};

type MetaOptionsResponseBody = {
  message?: string;
  categories?: MetaCategoryOption[];
  condition_levels?: MetaConditionLevelOption[];
  tags?: MetaTagOption[];
  errors?: Record<string, string[]>;
};

type RecommendationProductImage = {
  id?: number;
  product_id?: number;
  image_url?: string;
  image_thumbnail_url?: string | null;
  is_primary?: boolean;
};

type RecommendationProduct = {
  id: number;
  title?: string;
  description?: string | null;
  price?: number;
  currency?: string;
  status?: "available" | "sold" | "reserved";
  created_at?: string;
  seller_id?: number;
  seller?: {
    id: number;
    username: string;
    profile_picture?: string;
  };
  dormitory_id?: number | null;
  dormitory?: DormitoryOption;
  category_id?: number;
  category?: MetaCategoryOption;
  condition_level_id?: number;
  condition_level?: MetaConditionLevelOption & { level?: number | null };
  tags?: MetaTagOption[];
  images?: RecommendationProductImage[];
  image_url?: string | null;
  image_thumbnail_url?: string | null;
  primary_image_url?: string | null;
};

type RecommendationsResponseBody = {
  message?: string;
  page?: number;
  page_size?: number;
  random_count?: number;
  last_event_id?: number;
  last_event_at?: string | null;
  last_product_id?: number;
  last_product_at?: string | null;
  products?: RecommendationProduct[];
  detail?: string;
  errors?: Record<string, string[]>;
};

type ExchangeRecommendationItem = {
  exchange_product?: {
    id?: number;
    exchange_type?: "exchange_only" | "exchange_or_purchase";
    exchange_status?: string;
    expiration_date?: string | null;
    target_product_title?: string | null;
    target_product_category?: { id?: number; name?: string };
    target_product_condition?: { id?: number; name?: string; level?: number | null };
  };
  product?: RecommendationProduct;
};

type ExchangeRecommendationsResponseBody = {
  message?: string;
  page?: number;
  page_size?: number;
  random_count?: number;
  last_event_id?: number;
  last_event_at?: string | null;
  last_exchange_product_id?: number;
  last_exchange_product_at?: string | null;
  exchange_products?: ExchangeRecommendationItem[];
  detail?: string;
  errors?: Record<string, string[]>;
};

type SimilarProduct = {
  id?: number;
  product_id?: number;
  title?: string;
  price?: number;
  currency?: string;
  status?: "available" | "sold" | "reserved";
  created_at?: string;
  category_id?: number;
  condition_level_id?: number;
  is_promoted?: number | boolean | null;
  dormitory?: { latitude?: number; longitude?: number };
  condition_level?: MetaConditionLevelOption & { level?: number | null };
  image_thumbnail_url?: string | null;
  tags?: MetaTagOption[];
};

type SimilarProductsResponseBody = {
  message?: string;
  product_id?: number;
  page?: number;
  page_size?: number;
  total?: number;
  total_pages?: number;
  products?: SimilarProduct[];
  detail?: string;
};

type ProductDetailImage = {
  id?: number;
  product_id?: number;
  image_url?: string;
  image_thumbnail_url?: string | null;
  is_primary?: boolean;
};

type ProductDetail = {
  id?: number;
  title?: string;
  description?: string | null;
  price?: number;
  currency?: string;
  status?: "available" | "sold" | "reserved";
  created_at?: string;
  is_promoted?: number | boolean | null;
  seller_id?: number;
  dormitory_id?: number | null;
  dormitory?: DormitoryOption;
  category_id?: number;
  category?: MetaCategoryOption;
  condition_level_id?: number;
  condition_level?: MetaConditionLevelOption & { level?: number | null };
  tags?: MetaTagOption[];
  images?: ProductDetailImage[];
  seller?: User;
  distance_km?: number | null;
};

type ProductDetailResponseBody = {
  message?: string;
  product?: ProductDetail;
  errors?: Record<string, string[]>;
};

type NearbyProductImage = {
  id?: number;
  product_id?: number;
  image_url?: string;
  image_thumbnail_url?: string | null;
  is_primary?: boolean;
};

type NearbyProduct = {
  id?: number;
  seller_id?: number;
  seller?: Partial<User>;
  dormitory_id?: number | null;
  dormitory?: DormitoryOption;
  category_id?: number;
  category?: MetaCategoryOption;
  condition_level_id?: number;
  condition_level?: MetaConditionLevelOption & { level?: number | null };
  title?: string;
  description?: string | null;
  price?: number;
  currency?: string;
  status?: "available" | "sold" | "reserved";
  is_promoted?: number | boolean | null;
  created_at?: string;
  images?: NearbyProductImage[];
  tags?: MetaTagOption[];
  distance_km?: number | null;
};

type NearbyResponseBody = {
  message?: string;
  center?: { lat?: number; lng?: number };
  distance_km?: number;
  products?: NearbyProduct[];
  meta?: {
    categories?: MetaCategoryOption[];
    condition_levels?: MetaConditionLevelOption[];
  };
  errors?: Record<string, string[]>;
};

type MyProductCard = {
  id: number;
  title: string;
  price: number;
  currency?: string;
  status: "available" | "sold" | "reserved";
  created_at: string;
  image_thumbnail_url?: string | null;
  dormitory?: DormitoryOption & { university_id?: number };
  category?: { id: number; name: string; parent_id?: number | null };
  condition_level?: MetaConditionLevelOption;
  exchange_type?: "exchange_only" | "exchange_or_purchase" | null;
  target_product_title?: string | null;
};

type MyProductCardsResponseBody = {
  message?: string;
  page?: number;
  page_size?: number;
  total?: number;
  total_pages?: number;
  products?: MyProductCard[];
  errors?: Record<string, string[]>;
};

type SellerProfileProductLocation = {
  dormitory_name?: string;
  latitude?: number;
  longitude?: number;
};

type SellerProfileProduct = {
  id?: number;
  name?: string;
  price?: number;
  currency?: string;
  condition_name?: string;
  image_thumbnail_url?: string | null;
  location?: SellerProfileProductLocation;
};

type SellerProfileSeller = {
  id?: number;
  name?: string;
  profile_picture?: string | null;
  email_verified?: boolean;
  member_since?: string;
  dorm_name?: string;
  uni_name?: string;
  uni_address?: string;
  bio?: string;
  language?: string;
  timezone?: string;
  last_login?: string;
  listed_products_count?: number;
  sales_count?: number;
  average_condition_level?: number;
};

type SellerProfileResponseBody = {
  message?: string;
  seller?: SellerProfileSeller;
  page?: number;
  page_size?: number;
  total?: number;
  total_pages?: number;
  products?: SellerProfileProduct[];
  errors?: Record<string, string[]>;
};

type DormitoriesByUniversityResponseBody = {
  message?: string;
  university_id?: number;
  dormitories?: DormitoryOption[];
  errors?: Record<string, string[]>;
};

type CreateProductInput = {
  category_id: number;
  condition_level_id: number;
  title: string;
  description?: string | null;
  price: number;
  dormitory_id?: number | null;
  tag_ids?: number[] | null;
  primary_image_index?: number | null;
  images?: File[] | null;
  thumbnail_images?: File[] | null;
  image_urls?: string[] | null;
  image_thumbnail_urls?: string[] | null;
};

type CreateProductResponseBody = {
  message?: string;
  product?: unknown;
  images?: unknown[];
  tag_ids?: number[];
  errors?: Record<string, string[]>;
};

type CreateExchangeProductInput = {
  product_id?: number;
  exchange_type: "exchange_only" | "exchange_or_purchase";
  target_product_category_id?: number;
  target_product_condition_id?: number;
  target_product_title?: string;
  expiration_date?: string;
  category_id?: number;
  condition_level_id?: number;
  title?: string;
  description?: string | null;
  price?: number;
  currency?: string;
  dormitory_id?: number | null;
  tag_ids?: number[] | null;
  primary_image_index?: number | null;
  images?: File[] | null;
  thumbnail_images?: File[] | null;
  image_urls?: string[] | null;
  image_thumbnail_urls?: string[] | null;
};

type CreateExchangeProductResponseBody = {
  message?: string;
  exchange_product?: unknown;
  product?: unknown;
  images?: unknown[];
  errors?: Record<string, string[]>;
};

type CreateTagInput = {
  name: string;
};

type CreateTagResponseBody = {
  message?: string;
  tag?: MetaTagOption;
  errors?: Record<string, string[]>;
};

type SendMessageInput = {
  receiver_id: number;
  message_text: string;
  product_id?: number;
};

type SendMessageResponseBody = {
  message?: string;
  conversation_id?: number;
  message_data?: {
    id?: number;
    sender_id?: number;
    receiver_id?: number;
    message_text?: string;
    message_type?: string;
    message_kind?: string;
    product_id?: number | null;
    created_at?: string;
    status?: string;
  };
  errors?: Record<string, string[]>;
};

type TransferMessageInput = {
  conversation_id: number;
  amount: number;
  currency: string;
  reference?: string;
};

type TransferMessageResponseBody = {
  message?: string;
  transfer?: {
    amount: number;
    currency: string;
    from_wallet_id: number;
    to_wallet_id: number;
    atomic_transaction_id: number;
    reference?: string;
  };
  errors?: Record<string, string[]>;
};

type CreatePaymentRequestInput = {
  conversation_id: number;
  product_id?: number;
  amount: number;
  currency: string;
  message?: string;
  expires_in_hours?: number;
};

type PaymentRequestItem = {
  id?: number;
  conversation_id?: number;
  sender_id?: number;
  sender_username?: string;
  receiver_id?: number;
  product_id?: number | null;
  product_title?: string | null;
  amount?: number;
  currency?: string;
  status?: string;
  message?: string | null;
  expires_at?: string;
  created_at?: string;
};

type CreatePaymentRequestResponseBody = {
  message?: string;
  payment_request?: PaymentRequestItem;
  errors?: Record<string, string[]>;
};

type ConfirmPaymentRequestResponseBody = {
  message?: string;
  payment?: {
    payment_request_id?: number;
    amount?: number;
    currency?: string;
    from_wallet_id?: number;
    to_wallet_id?: number;
    atomic_transaction_id?: number;
    status?: string;
  };
  errors?: Record<string, string[]>;
};

type CreateAiSessionResponseBody = {
  session_id?: string;
  expires_at?: string;
  message?: string;
  errors?: Record<string, string[]>;
};

type AiSessionFunctionCall = {
  name?: string;
  arguments?: Record<string, unknown>;
  result_count?: number;
};

type AiSessionMessageResponseBody = {
  response?: string;
  function_calls?: AiSessionFunctionCall[];
  products?: Array<Record<string, unknown>>;
  message?: string;
  errors?: Record<string, string[]>;
};

type AiSessionStoredMessage = {
  id?: number | string;
  message_type?: string;
  content_type?: string;
  message?: string;
  content?: string;
  response?: string;
  products?: Array<Record<string, unknown>>;
  created_at?: string;
};

type AiSessionMessagesResponseBody = {
  message?: string;
  session_id?: string;
  messages?: AiSessionStoredMessage[];
  errors?: Record<string, string[]>;
};

type AiHistorySession = {
  session_id?: string;
  title?: string | null;
  provider?: string | null;
  model?: string | null;
  created_at?: string;
  updated_at?: string;
  total_messages?: number;
  latest_message?: AiSessionStoredMessage;
  messages?: AiSessionStoredMessage[];
};

type AiHistoryResponseBody = {
  message?: string;
  page?: number;
  page_size?: number;
  total?: number;
  total_pages?: number;
  history?: AiHistorySession[];
  errors?: Record<string, string[]>;
};

type DeleteAiHistoryResponseBody = {
  message?: string;
  session_id?: string;
  errors?: Record<string, string[]>;
};

type RenameAiHistoryResponseBody = {
  message?: string;
  session_id?: string;
  title?: string;
  errors?: Record<string, string[]>;
};

type MessageContactItem = {
  conversation_id?: number;
  user?: { id?: number; username?: string; profile_picture?: string };
  last_message?: { id?: number; message_text?: string; created_at?: string };
};

type MessageContactsResponseBody = {
  message?: string;
  total?: number;
  contacts?: MessageContactItem[];
  errors?: Record<string, string[]>;
};

type MessageThreadItem = {
  id?: number;
  sender_id?: number;
  sender_username?: string;
  message_text?: string;
  message_type?: string;
  message_kind?: string;
  payment_request_status?: string | null;
  transfer_data?: Record<string, unknown>;
  product?: {
    id?: number;
    seller_id?: number;
    title?: string;
    price?: number;
    currency?: string;
    image_thumbnail_url?: string | null;
    cover_image_url?: string | null;
    image_url?: string | null;
  };
  read_at?: string | null;
  created_at?: string;
};

type MessageThreadResponseBody = {
  message?: string;
  conversation?: {
    id?: number;
    current_user_wallet_id?: number | null;
    other_user?: { id?: number; username?: string; wallet_id?: number | null };
  };
  messages?: MessageThreadItem[];
  errors?: Record<string, string[]>;
};

type MessageNotificationItem = {
  id?: number | string;
  conversation_id?: number | null;
  sender_id?: number;
  sender_username?: string;
  sender_profile_picture?: string;
  product_id?: number | null;
  notification_type?: string;
  notification_text?: string;
  notification_count?: number;
  created_at?: string;
  // Transaction fields
  amount?: number;
  currency?: string;
  wallet_id?: number;
  transaction_ledger_id?: number;
};

type MessageNotificationsResponseBody = {
  message?: string;
  total?: number;
  messages?: MessageNotificationItem[];
  errors?: Record<string, string[]>;
};

type ProductSearchSuggestionsResponseBody = {
  message?: string;
  query?: {
    q?: string;
    normalized?: string;
  };
  suggestions?: string[];
  errors?: Record<string, string[]>;
};

type SearchProductItem = {
  id?: number;
  seller?: {
    id?: number;
    full_name?: string;
    username?: string;
    profile_picture?: string;
  };
  dormitory?: {
    id?: number;
    dormitory_name?: string;
    location?: string;
    lat?: number;
    lng?: number;
    is_active?: boolean;
    university_id?: number;
  };
  category?: {
    id?: number;
    name?: string;
    parent_id?: number | null;
    icon?: string | null;
  };
  condition_level?: {
    id?: number;
    name?: string;
    sort_order?: number | null;
  };
  title?: string;
  description?: string;
  price?: number;
  currency?: string;
  status?: "available" | "sold" | "reserved";
  is_promoted?: boolean | number | null;
  created_at?: string;
  images?: Array<{
    id?: number;
    product_id?: number;
    image_url?: string;
    image_thumbnail_url?: string;
    is_primary?: boolean;
  }>;
  tags?: Array<{ id?: number; name?: string }>;
};

type SearchProductsResponseBody = {
  message?: string;
  query?: {
    q?: string;
    normalized?: string;
  };
  page?: number;
  page_size?: number;
  total?: number;
  total_pages?: number;
  products?: SearchProductItem[];
  errors?: Record<string, string[]>;
};

type SearchVisualProductItem = {
  id?: number;
  seller_id?: number;
  category_id?: number;
  condition_level_id?: number;
  title?: string;
  description?: string;
  price?: number;
  currency?: string;
  status?: "available" | "sold" | "reserved";
  is_promoted?: boolean | number | null;
  created_at?: string;
  seller?: {
    id?: number;
    full_name?: string;
    username?: string;
    profile_picture?: string;
  };
  dormitory?: {
    id?: number;
    dormitory_name?: string;
    location?: string;
    address?: string;
    lat?: number;
    lng?: number;
    is_active?: boolean;
    university_id?: number;
  };
  category?: {
    id?: number;
    name?: string;
    parent_id?: number | null;
    icon?: string | null;
  };
  condition_level?: {
    id?: number;
    name?: string;
    sort_order?: number | null;
    level?: number | null;
  };
  image_thumbnail_url?: string;
  images?: Array<{
    id?: number;
    product_id?: number;
    image_url?: string;
    image_thumbnail_url?: string;
    is_primary?: boolean;
  }>;
  tags?: Array<{ id?: number; name?: string }>;
  visual_similarity_score?: number;
};

type SearchVisualProductsResponseBody = {
  message?: string;
  query?: {
    top_k?: number;
    model_name?: string;
    embedding_dim?: number;
  };
  count?: number;
  products?: SearchVisualProductItem[];
  detail?: unknown;
  upstream_status?: number;
  errors?: Record<string, string[]>;
};

type ProductImage = {
  id: number;
  product_id: number;
  image_url: string;
  image_thumbnail_url?: string | null;
  is_primary: boolean;
};

type EditableProduct = {
  id: number;
  seller_id?: number;
  dormitory_id?: number | null;
  dormitory?: DormitoryOption;
  category_id: number;
  category?: MetaCategoryOption & { parent_id?: number | null };
  condition_level_id: number;
  condition_level?: MetaConditionLevelOption;
  title: string;
  description?: string | null;
  price: number;
  currency?: string;
  status: "available" | "sold" | "reserved";
  created_at?: string;
  images?: ProductImage[];
  tags?: MetaTagOption[];
  tag_ids?: number[];
  exchange_type?: "exchange_only" | "exchange_or_purchase" | null;
  target_product_title?: string | null;
  target_product_category_id?: number | null;
  target_product_condition_id?: number | null;
  expiration_date?: string | null;
};

type GetProductForEditResponseBody = {
  message?: string;
  product?: EditableProduct;
  errors?: Record<string, string[]>;
};

type ProductEngagementResponseBody = {
  message?: string;
  product_id?: number;
  views?: number;
  clicks?: number;
  recent_clickers?: Array<{
    id?: number;
    profile_picture?: string | null;
    last_visit_at?: string;
    last_clicked_at?: string;
    clicked_at?: string;
    updated_at?: string;
  }>;
  errors?: Record<string, string[]>;
};

type UpdateProductInput = {
  title?: string;
  description?: string | null;
  price?: number;
  category_id?: number;
  condition_level_id?: number;
  dormitory_id?: number | null;
  tag_ids?: number[];
  exchange_type?: "exchange_only" | "exchange_or_purchase" | null;
  target_product_title?: string | null;
  target_product_category_id?: number | null;
  target_product_condition_id?: number | null;
  expiration_date?: string | null;
};

type UpdateProductResponseBody = {
  message?: string;
  product?: EditableProduct;
  errors?: Record<string, string[]>;
};

type MarkProductSoldResponseBody = {
  message?: string;
  product?: { id: number; status: "sold" | "available" | "reserved" };
  errors?: Record<string, string[]>;
};

type UpdateProductImagesInput = {
  images?: File[] | null;
  thumbnail_images?: File[] | null;
  image_urls?: string[] | null;
  image_thumbnail_urls?: string[] | null;
  primary_image_index?: number | null;
};

type UpdateProductImagesResponseBody = {
  message?: string;
  product_id?: number;
  images?: ProductImage[];
  errors?: Record<string, string[]>;
};

const STORAGE_KEYS = {
  accessToken: "auth.access_token",
  tokenType: "auth.token_type",
  user: "auth.user",
} as const;
const SESSION_KEYS = {
  metaOptions: "auth.meta_options",
} as const;
const META_OPTIONS_TTL_MS = 5 * 60 * 1000;

const readStorage = (key: string): string | null => {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
};

const writeStorage = (key: string, value: string) => {
  try {
    localStorage.setItem(key, value);
  } catch {
    return;
  }
};

const removeStorage = (key: string) => {
  try {
    localStorage.removeItem(key);
  } catch {
    return;
  }
};

const readSessionStorage = (key: string): string | null => {
  try {
    return sessionStorage.getItem(key);
  } catch {
    return null;
  }
};

const writeSessionStorage = (key: string, value: string) => {
  try {
    sessionStorage.setItem(key, value);
  } catch {
    return;
  }
};

const removeSessionStorage = (key: string) => {
  try {
    sessionStorage.removeItem(key);
  } catch {
    return;
  }
};

const deriveUserFromEmail = (email: string, role: User["role"], accountCompleted?: boolean): User => {
  const identifier = (email.split("@")[0] || email).trim() || "user";
  return {
    id: 0,
    full_name: identifier,
    username: identifier,
    email,
    role,
    status: "active",
    account_completed: accountCompleted,
  };
};

const parseJson = <T,>(value: string | null): T | null => {
  if (!value) return null;
  try {
    return JSON.parse(value) as T;
  } catch {
    return null;
  }
};

const removeUndefined = <T extends Record<string, unknown>>(value: T): Partial<T> => {
  const entries = Object.entries(value).filter(([, v]) => v !== undefined);
  return Object.fromEntries(entries) as Partial<T>;
};

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [accessToken, setAccessToken] = useState<string | null>(() => readStorage(STORAGE_KEYS.accessToken));
  const [tokenType, setTokenType] = useState<string | null>(() => readStorage(STORAGE_KEYS.tokenType));
  const [user, setUser] = useState<User | null>(() => parseJson<User>(readStorage(STORAGE_KEYS.user)));
  const metaOptionsCacheRef = useRef<{ scope: string; expiresAt: number; value: MetaOptionsResponseBody } | null>(null);
  const metaOptionsPendingRef = useRef<Promise<MetaOptionsResponseBody> | null>(null);

  useEffect(() => {
    if (user?.language) {
      i18n.changeLanguage(user.language);
    }
  }, [user?.language]);

  const fetchUserLanguage = useCallback(async () => {
    if (!accessToken) return;
    if (user?.role === 'admin') return;

    const response = await fetch(apiUrl("/api/user/settings/language"), {
      method: "GET",
      headers: {
        Accept: "application/json",
        Authorization: `${tokenType || "Bearer"} ${accessToken}`,
      },
    });

    const contentType = response.headers.get("content-type") || "";
    const responseBody = contentType.includes("application/json")
      ? ((await response.json()) as UserLanguageResponse)
      : null;

    if (!response.ok) return;

    const supported = i18n.options.supportedLngs;
    const nextLanguage = responseBody?.language || "en";
    if (Array.isArray(supported) && supported.length > 0 && !supported.includes(nextLanguage)) return;

    if (i18n.resolvedLanguage !== nextLanguage) {
      await i18n.changeLanguage(nextLanguage);
    }

    setUser(prev => {
      if (!prev) return prev;
      if (prev.language === nextLanguage) return prev;
      const nextUser = { ...prev, language: nextLanguage };
      writeStorage(STORAGE_KEYS.user, JSON.stringify(nextUser));
      return nextUser;
    });
  }, [accessToken, tokenType, user?.role]);

  useEffect(() => {
    void fetchUserLanguage();
  }, [fetchUserLanguage]);

  const fetchUserProfilePicture = useCallback(async () => {
    if (!accessToken) return;
    if (user?.role === 'admin') return;

    const response = await fetch(apiUrl("/api/user/settings/profile-picture"), {
      method: "GET",
      headers: {
        Accept: "application/json",
        Authorization: `${tokenType || "Bearer"} ${accessToken}`,
      },
    });

    const contentType = response.headers.get("content-type") || "";
    const responseBody = contentType.includes("application/json")
      ? ((await response.json()) as UserProfilePictureResponse)
      : null;

    if (!response.ok) return;

    const nextProfilePicture = responseBody?.profile_picture ?? undefined;

    setUser(prev => {
      if (!prev) return prev;
      if (prev.profile_picture === nextProfilePicture) return prev;
      const nextUser = { ...prev, profile_picture: nextProfilePicture };
      writeStorage(STORAGE_KEYS.user, JSON.stringify(nextUser));
      return nextUser;
    });
  }, [accessToken, tokenType, user?.role]);

  useEffect(() => {
    void fetchUserProfilePicture();
  }, [fetchUserProfilePicture]);

  const setAuthSession = useCallback((nextUser: User, nextToken: string, nextTokenType: string) => {
    setUser(nextUser);
    setAccessToken(nextToken);
    setTokenType(nextTokenType);
    metaOptionsCacheRef.current = null;
    metaOptionsPendingRef.current = null;
    removeSessionStorage(SESSION_KEYS.metaOptions);
    writeStorage(STORAGE_KEYS.accessToken, nextToken);
    writeStorage(STORAGE_KEYS.tokenType, nextTokenType);
    writeStorage(STORAGE_KEYS.user, JSON.stringify(nextUser));
  }, []);

  const loginWithEndpoint = useCallback(
    async (endpoint: string, email: string, password: string, role: User["role"]): Promise<boolean> => {
      const response = await fetch(apiUrl(endpoint), {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) return false;

      const data = (await response.json()) as LoginResponse;
      const token = data.access_token;
      if (!token) return false;

      const nextTokenType = data.token_type || "Bearer";
      setAuthSession(deriveUserFromEmail(email, role, data.account_completed), token, nextTokenType);
      return true;
    },
    [setAuthSession],
  );

  const login = useCallback(
    async (email: string, password: string): Promise<boolean> => {
      try {
        return await loginWithEndpoint("/api/user/login", email, password, "user");
      } catch {
        return false;
      }
    },
    [loginWithEndpoint],
  );

  const adminLogin = useCallback(
    async (email: string, password: string): Promise<boolean> => {
      try {
        return await loginWithEndpoint("/api/admin/login", email, password, "admin");
      } catch {
        return false;
      }
    },
    [loginWithEndpoint],
  );

  const signup = useCallback(async (data: SignupData): Promise<SignupResponseBody> => {
    const response = await fetch(apiUrl("/api/user/signup"), {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        full_name: data.full_name,
        username: data.username,
        email: data.email,
        password: data.password,
        phone_number: data.phone_number ?? null,
      }),
    });

    const contentType = response.headers.get("content-type") || "";
    const responseBody = contentType.includes("application/json")
      ? ((await response.json()) as SignupResponseBody)
      : null;

    if (responseBody) {
      if (response.status === 422 && responseBody.errors) throw responseBody;
      if (!response.ok) return responseBody;
      return responseBody;
    }

    return { message: "Request failed" };
  }, []);

  const logout = useCallback(() => {
    const currentToken = accessToken;
    const currentTokenType = tokenType || "Bearer";
    const currentRole = user?.role;
    setUser(null);
    setAccessToken(null);
    setTokenType(null);
    removeStorage(STORAGE_KEYS.accessToken);
    removeStorage(STORAGE_KEYS.tokenType);
    removeStorage(STORAGE_KEYS.user);
    metaOptionsCacheRef.current = null;
    metaOptionsPendingRef.current = null;
    removeSessionStorage(SESSION_KEYS.metaOptions);
    if (currentToken && currentRole === "user") {
      void fetch(apiUrl("/api/user/logout"), {
        method: "POST",
        headers: {
          Accept: "application/json",
          Authorization: `${currentTokenType} ${currentToken}`,
        },
      });
    }
    window.location.href = "/";
  }, [accessToken, tokenType, user?.role]);

  const updateProfile = useCallback(async (data: Omit<Partial<User>, "profile_picture"> & { profile_picture?: File | string }): Promise<boolean> => {
    if (!accessToken) return false;

    const hasFile = typeof data.profile_picture !== "string" && data.profile_picture instanceof File;
    const payload = removeUndefined({
      full_name: data.full_name,
      username: data.username,
      email: data.email,
      phone_number: data.phone_number,
      dormitory_id: data.dormitory_id,
      profile_picture: hasFile ? undefined : data.profile_picture,
      student_id: data.student_id,
      bio: data.bio,
      date_of_birth: data.date_of_birth,
      gender: data.gender,
      language: data.language,
      timezone: data.timezone,
    });

    const response = await fetch(apiUrl("/api/user/settings"), {
      method: "PATCH",
      headers: {
        Accept: "application/json",
        ...(hasFile ? {} : { "Content-Type": "application/json" }),
        Authorization: `${tokenType || "Bearer"} ${accessToken}`,
      },
      body: hasFile
        ? (() => {
            const form = new FormData();
            Object.entries(payload).forEach(([key, value]) => {
              if (value === undefined || value === null) return;
              if (typeof value === "number") {
                form.set(key, String(value));
                return;
              }
              form.set(key, String(value));
            });
            form.append("profile_picture", data.profile_picture as File);
            return form;
          })()
        : JSON.stringify(payload),
    });

    const contentType = response.headers.get("content-type") || "";
    const responseBody = contentType.includes("application/json")
      ? ((await response.json()) as UpdateProfileResponse)
      : null;

    if (response.status === 422 && responseBody?.errors) {
      throw responseBody;
    }

    if (!response.ok) return false;

    const updatedUser = responseBody?.user;
    if (updatedUser) {
      setUser(updatedUser);
      writeStorage(STORAGE_KEYS.user, JSON.stringify(updatedUser));
    }

    return true;
  }, [accessToken, tokenType]);

  const getUniversityOptions = useCallback(
    async (universityId?: number): Promise<UniversityOptionsResponseBody> => {
      if (!accessToken) {
        return { message: "Unauthenticated." };
      }

      const url = apiUrl("/api/user/settings/university-options");
      const fullUrl = new URL(url, window.location.origin);
      if (typeof universityId === "number" && Number.isFinite(universityId)) {
        fullUrl.searchParams.set("university_id", String(universityId));
      }

      const response = await fetch(fullUrl.toString(), {
        method: "GET",
        headers: {
          Accept: "application/json",
          Authorization: `${tokenType || "Bearer"} ${accessToken}`,
        },
      });

      const contentType = response.headers.get("content-type") || "";
      const responseBody = contentType.includes("application/json")
        ? ((await response.json()) as UniversityOptionsResponseBody)
        : null;

      if (responseBody) {
        if (response.status === 422 && responseBody.errors) {
          throw responseBody;
        }
        if (response.status === 401) {
          throw responseBody;
        }
        if (response.status === 403) {
          throw responseBody;
        }
        if (!response.ok) return responseBody;
        return responseBody;
      }

      if (response.status === 401) {
        throw { message: "Unauthenticated." } as UniversityOptionsResponseBody;
      }
      if (response.status === 403) {
        throw { message: "Unauthorized: Only users can access this endpoint." } as UniversityOptionsResponseBody;
      }
      return { message: "Request failed" };
    },
    [accessToken, tokenType],
  );

  const updateUniversitySettings = useCallback(
    async (data: { university_id: number; dormitory_id: number }): Promise<boolean> => {
      if (!accessToken) return false;

      const response = await fetch(apiUrl("/api/user/settings/university"), {
        method: "PATCH",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          Authorization: `${tokenType || "Bearer"} ${accessToken}`,
        },
        body: JSON.stringify(data),
      });

      const contentType = response.headers.get("content-type") || "";
      const responseBody = contentType.includes("application/json")
        ? ((await response.json()) as UpdateUniversitySettingsResponseBody)
        : null;

      if (responseBody) {
        if (response.status === 422 && responseBody.errors) {
          throw responseBody;
        }
        if (response.status === 401) {
          throw responseBody;
        }
        if (response.status === 403) {
          throw responseBody;
        }
        if (response.status === 404) {
          throw responseBody;
        }
      }

      if (response.status === 401) {
        throw { message: "Unauthenticated." } as UpdateUniversitySettingsResponseBody;
      }
      if (response.status === 403) {
        throw { message: "Unauthorized: Only users can access this endpoint." } as UpdateUniversitySettingsResponseBody;
      }
      if (response.status === 404) {
        throw { message: "Dormitory not found for the selected university." } as UpdateUniversitySettingsResponseBody;
      }
      if (!response.ok) return false;

      const nextDormitoryId = responseBody?.user?.dormitory_id ?? undefined;
      if (user && typeof nextDormitoryId === "number") {
        const nextUser = { ...user, dormitory_id: nextDormitoryId };
        setUser(nextUser);
        writeStorage(STORAGE_KEYS.user, JSON.stringify(nextUser));
      }

      return true;
    },
    [accessToken, tokenType, user?.role],
  );

  const createExchangeProduct = useCallback(
    async (data: CreateExchangeProductInput): Promise<CreateExchangeProductResponseBody> => {
      if (!accessToken) {
        throw { message: "Unauthenticated." } as CreateExchangeProductResponseBody;
      }
      if (user?.role && user.role !== "user") {
        throw { message: "Unauthorized: Only users can access this endpoint." } as CreateExchangeProductResponseBody;
      }

      const hasFiles = (data.images?.length || 0) > 0 || (data.thumbnail_images?.length || 0) > 0;
      const url = apiUrl("/api/exchange-products");

      const response = await fetch(url, {
        method: "POST",
        headers: hasFiles
          ? {
              Accept: "application/json",
              Authorization: `${tokenType || "Bearer"} ${accessToken}`,
            }
          : {
              Accept: "application/json",
              "Content-Type": "application/json",
              Authorization: `${tokenType || "Bearer"} ${accessToken}`,
            },
        body: hasFiles
          ? (() => {
              const form = new FormData();
              form.set("exchange_type", data.exchange_type);
              if (data.product_id) form.set("product_id", String(data.product_id));
              if (data.target_product_category_id) {
                form.set("target_product_category_id", String(data.target_product_category_id));
              }
              if (data.target_product_condition_id) {
                form.set("target_product_condition_id", String(data.target_product_condition_id));
              }
              if (data.target_product_title) form.set("target_product_title", data.target_product_title);
              if (data.expiration_date) form.set("expiration_date", data.expiration_date);
              if (data.category_id) form.set("category_id", String(data.category_id));
              if (data.condition_level_id) form.set("condition_level_id", String(data.condition_level_id));
              if (data.title) form.set("title", data.title);
              if (data.description) form.set("description", data.description);
              if (typeof data.price === "number") form.set("price", String(data.price));
              if (data.currency) form.set("currency", data.currency);
              if (typeof data.dormitory_id === "number") form.set("dormitory_id", String(data.dormitory_id));
              if (typeof data.primary_image_index === "number") {
                form.set("primary_image_index", String(data.primary_image_index));
              }
              if (Array.isArray(data.tag_ids)) {
                data.tag_ids.forEach((id) => form.append("tag_ids[]", String(id)));
              }
              if (Array.isArray(data.image_urls)) {
                data.image_urls.forEach((imageUrl) => form.append("image_urls[]", imageUrl));
              }
              if (Array.isArray(data.image_thumbnail_urls)) {
                data.image_thumbnail_urls.forEach((thumbnailUrl) => form.append("image_thumbnail_urls[]", thumbnailUrl));
              }
              (data.images || []).forEach((file) => form.append("images[]", file));
              (data.thumbnail_images || []).forEach((file) => form.append("thumbnail_images[]", file));
              return form;
            })()
          : JSON.stringify(
              removeUndefined({
                product_id: data.product_id,
                exchange_type: data.exchange_type,
                target_product_category_id: data.target_product_category_id,
                target_product_condition_id: data.target_product_condition_id,
                target_product_title: data.target_product_title,
                expiration_date: data.expiration_date,
                category_id: data.category_id,
                condition_level_id: data.condition_level_id,
                title: data.title,
                description: data.description || undefined,
                price: data.price,
                currency: data.currency,
                dormitory_id: typeof data.dormitory_id === "number" ? data.dormitory_id : undefined,
                tag_ids: Array.isArray(data.tag_ids) ? data.tag_ids : undefined,
                primary_image_index:
                  typeof data.primary_image_index === "number" ? data.primary_image_index : undefined,
                image_urls: Array.isArray(data.image_urls) ? data.image_urls : undefined,
                image_thumbnail_urls: Array.isArray(data.image_thumbnail_urls) ? data.image_thumbnail_urls : undefined,
              }),
            ),
      });

      const contentType = response.headers.get("content-type") || "";
      const responseBody = contentType.includes("application/json")
        ? ((await response.json()) as CreateExchangeProductResponseBody)
        : null;

      if (responseBody) {
        if (response.status === 422 && responseBody.errors) throw responseBody;
        if (response.status === 401) throw responseBody;
        if (response.status === 403) throw responseBody;
        if (response.status === 404) throw responseBody;
        if (response.status === 409) throw responseBody;
        if (!response.ok) throw responseBody;
        return responseBody;
      }

      if (response.status === 401) throw { message: "Unauthenticated." } as CreateExchangeProductResponseBody;
      if (response.status === 403) {
        throw { message: "Unauthorized: Only users can access this endpoint." } as CreateExchangeProductResponseBody;
      }
      if (response.status === 404) {
        throw { message: "Product not found or not owned by user." } as CreateExchangeProductResponseBody;
      }
      if (response.status === 409) {
        throw { message: "Exchange listing already exists for this product." } as CreateExchangeProductResponseBody;
      }
      return { message: "Request failed" };
    },
    [accessToken, tokenType, user?.role],
  );

  const createProduct = useCallback(
    async (data: CreateProductInput): Promise<CreateProductResponseBody> => {
      if (!accessToken) {
        throw { message: "Unauthenticated." } as CreateProductResponseBody;
      }
      if (user?.role && user.role !== "user") {
        throw { message: "Unauthorized: Only users can access this endpoint." } as CreateProductResponseBody;
      }

      const hasFiles = (data.images?.length || 0) > 0 || (data.thumbnail_images?.length || 0) > 0;
      const url = apiUrl("/api/user/products");

      const response = await fetch(url, {
        method: "POST",
        headers: hasFiles
          ? {
              Accept: "application/json",
              Authorization: `${tokenType || "Bearer"} ${accessToken}`,
            }
          : {
              Accept: "application/json",
              "Content-Type": "application/json",
              Authorization: `${tokenType || "Bearer"} ${accessToken}`,
            },
        body: hasFiles
          ? (() => {
              const form = new FormData();
              form.set("category_id", String(data.category_id));
              form.set("condition_level_id", String(data.condition_level_id));
              form.set("title", data.title);
              form.set("price", String(data.price));
              if (data.description) form.set("description", data.description);
              if (typeof data.dormitory_id === "number") form.set("dormitory_id", String(data.dormitory_id));
              if (typeof data.primary_image_index === "number") {
                form.set("primary_image_index", String(data.primary_image_index));
              }
              if (Array.isArray(data.tag_ids)) {
                data.tag_ids.forEach((id) => form.append("tag_ids[]", String(id)));
              }
              if (Array.isArray(data.image_urls)) {
                data.image_urls.forEach((imageUrl) => form.append("image_urls[]", imageUrl));
              }
              if (Array.isArray(data.image_thumbnail_urls)) {
                data.image_thumbnail_urls.forEach((thumbnailUrl) => form.append("image_thumbnail_urls[]", thumbnailUrl));
              }
              (data.images || []).forEach((file) => form.append("images[]", file));
              (data.thumbnail_images || []).forEach((file) => form.append("thumbnail_images[]", file));
              return form;
            })()
          : JSON.stringify(
              removeUndefined({
                category_id: data.category_id,
                condition_level_id: data.condition_level_id,
                title: data.title,
                description: data.description || undefined,
                price: data.price,
                dormitory_id: typeof data.dormitory_id === "number" ? data.dormitory_id : undefined,
                tag_ids: Array.isArray(data.tag_ids) ? data.tag_ids : undefined,
                primary_image_index:
                  typeof data.primary_image_index === "number" ? data.primary_image_index : undefined,
                image_urls: Array.isArray(data.image_urls) ? data.image_urls : undefined,
                image_thumbnail_urls: Array.isArray(data.image_thumbnail_urls) ? data.image_thumbnail_urls : undefined,
              }),
            ),
      });

      const contentType = response.headers.get("content-type") || "";
      const responseBody = contentType.includes("application/json")
        ? ((await response.json()) as CreateProductResponseBody)
        : null;

      if (responseBody) {
        if (response.status === 422 && responseBody.errors) throw responseBody;
        if (response.status === 401) throw responseBody;
        if (response.status === 403) throw responseBody;
        if (!response.ok) return responseBody;
        return responseBody;
      }

      if (response.status === 401) throw { message: "Unauthenticated." } as CreateProductResponseBody;
      if (response.status === 403) {
        throw { message: "Unauthorized: Only users can access this endpoint." } as CreateProductResponseBody;
      }
      return { message: "Request failed" };
    },
    [accessToken, tokenType, user?.role],
  );

  const createTag = useCallback(
    async (data: CreateTagInput): Promise<CreateTagResponseBody> => {
      if (!accessToken) {
        throw { message: "Unauthenticated." } as CreateTagResponseBody;
      }
      if (user?.role && user.role !== "user") {
        throw { message: "Unauthorized: Only users can access this endpoint." } as CreateTagResponseBody;
      }

      const response = await fetch(apiUrl("/api/user/tags"), {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          Authorization: `${tokenType || "Bearer"} ${accessToken}`,
        },
        body: JSON.stringify({ name: data.name }),
      });

      const contentType = response.headers.get("content-type") || "";
      const responseBody = contentType.includes("application/json")
        ? ((await response.json()) as CreateTagResponseBody)
        : null;

      if (responseBody) {
        if (response.status === 422 && responseBody.errors) throw responseBody;
        if (response.status === 401) throw responseBody;
        if (response.status === 403) throw responseBody;
        if (!response.ok) return responseBody;
        return responseBody;
      }

      if (response.status === 401) throw { message: "Unauthenticated." } as CreateTagResponseBody;
      if (response.status === 403) {
        throw { message: "Unauthorized: Only users can access this endpoint." } as CreateTagResponseBody;
      }
      return { message: "Request failed" };
    },
    [accessToken, tokenType, user?.role],
  );

  const sendMessage = useCallback(
    async (data: SendMessageInput): Promise<SendMessageResponseBody> => {
      if (!accessToken) {
        throw { message: "Unauthenticated." } as SendMessageResponseBody;
      }
      if (user?.role && user.role !== "user") {
        throw { message: "Unauthorized: Only users can access this endpoint." } as SendMessageResponseBody;
      }

      const response = await fetch(apiUrl("/api/user/messages"), {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          Authorization: `${tokenType || "Bearer"} ${accessToken}`,
        },
        body: JSON.stringify(
          removeUndefined({
            receiver_id: data.receiver_id,
            message_text: data.message_text,
            product_id: data.product_id,
          }),
        ),
      });

      const contentType = response.headers.get("content-type") || "";
      const responseBody = contentType.includes("application/json")
        ? ((await response.json()) as SendMessageResponseBody)
        : null;

      if (responseBody) {
        if (response.status === 422 && responseBody.errors) throw responseBody;
        if (response.status === 401) throw responseBody;
        if (response.status === 403) throw responseBody;
        if (!response.ok) return responseBody;
        return responseBody;
      }

      if (response.status === 401) throw { message: "Unauthenticated." } as SendMessageResponseBody;
      if (response.status === 403) {
        throw { message: "Unauthorized: Only users can access this endpoint." } as SendMessageResponseBody;
      }
      return { message: "Request failed" };
    },
    [accessToken, tokenType, user?.role],
  );

  const transferMessage = useCallback(
    async (data: TransferMessageInput): Promise<TransferMessageResponseBody> => {
      if (!accessToken) {
        throw { message: "Unauthenticated." } as TransferMessageResponseBody;
      }
      if (user?.role && user.role !== "user") {
        throw { message: "Unauthorized: Only users can access this endpoint." } as TransferMessageResponseBody;
      }

      const response = await fetch(apiUrl("/api/user/messages/transfer"), {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          Authorization: `${tokenType || "Bearer"} ${accessToken}`,
        },
        body: JSON.stringify({
          conversation_id: data.conversation_id,
          amount: data.amount,
          currency: data.currency,
          reference: data.reference,
        }),
      });

      const contentType = response.headers.get("content-type") || "";
      const responseBody = contentType.includes("application/json")
        ? ((await response.json()) as TransferMessageResponseBody)
        : null;

      if (responseBody) {
        if (response.status === 422 && responseBody.errors) throw responseBody;
        if (response.status === 401) throw responseBody;
        if (response.status === 403) throw responseBody;
        if (response.status === 404) throw responseBody;
        if (response.status === 409) throw responseBody;
        if (!response.ok) return responseBody;
        return responseBody;
      }

      if (response.status === 401) throw { message: "Unauthenticated." } as TransferMessageResponseBody;
      if (response.status === 403) {
        throw { message: "Unauthorized: Only users can access this endpoint." } as TransferMessageResponseBody;
      }
      return { message: "Request failed" };
    },
    [accessToken, tokenType, user?.role],
  );

  const createPaymentRequest = useCallback(
    async (data: CreatePaymentRequestInput): Promise<CreatePaymentRequestResponseBody> => {
      if (!accessToken) {
        throw { message: "Unauthenticated." } as CreatePaymentRequestResponseBody;
      }
      if (user?.role && user.role !== "user") {
        throw { message: "Unauthorized: Only users can access this endpoint." } as CreatePaymentRequestResponseBody;
      }

      const response = await fetch(apiUrl("/api/user/payment-requests"), {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          Authorization: `${tokenType || "Bearer"} ${accessToken}`,
        },
        body: JSON.stringify(
          removeUndefined({
            conversation_id: data.conversation_id,
            product_id: data.product_id,
            amount: data.amount,
            currency: data.currency,
            message: data.message,
            expires_in_hours: data.expires_in_hours,
          }),
        ),
      });

      const contentType = response.headers.get("content-type") || "";
      const responseBody = contentType.includes("application/json")
        ? ((await response.json()) as CreatePaymentRequestResponseBody)
        : null;

      if (responseBody) {
        if (response.status === 422 && responseBody.errors) throw responseBody;
        if (response.status === 401) throw responseBody;
        if (response.status === 403) throw responseBody;
        if (response.status === 404) throw responseBody;
        if (response.status === 409) throw responseBody;
        if (!response.ok) return responseBody;
        return responseBody;
      }

      if (response.status === 401) throw { message: "Unauthenticated." } as CreatePaymentRequestResponseBody;
      if (response.status === 403) {
        throw { message: "Unauthorized: Only users can access this endpoint." } as CreatePaymentRequestResponseBody;
      }
      return { message: "Request failed" };
    },
    [accessToken, tokenType, user?.role],
  );

  const confirmPaymentRequest = useCallback(
    async (requestId: number): Promise<ConfirmPaymentRequestResponseBody> => {
      if (!accessToken) {
        throw { message: "Unauthenticated." } as ConfirmPaymentRequestResponseBody;
      }
      if (user?.role && user.role !== "user") {
        throw { message: "Unauthorized: Only users can access this endpoint." } as ConfirmPaymentRequestResponseBody;
      }

      const normalizedRequestId = Number.isFinite(requestId) ? Math.trunc(requestId) : NaN;
      const response = await fetch(apiUrl(`/api/user/payment-requests/${normalizedRequestId}/confirm`), {
        method: "POST",
        headers: {
          Accept: "application/json",
          Authorization: `${tokenType || "Bearer"} ${accessToken}`,
        },
      });

      const contentType = response.headers.get("content-type") || "";
      const responseBody = contentType.includes("application/json")
        ? ((await response.json()) as ConfirmPaymentRequestResponseBody)
        : null;

      if (responseBody) {
        if (response.status === 422 && responseBody.errors) throw responseBody;
        if (response.status === 401) throw responseBody;
        if (response.status === 403) throw responseBody;
        if (response.status === 404) throw responseBody;
        if (response.status === 409) throw responseBody;
        if (!response.ok) return responseBody;
        return responseBody;
      }

      if (response.status === 401) throw { message: "Unauthenticated." } as ConfirmPaymentRequestResponseBody;
      if (response.status === 403) {
        throw { message: "Unauthorized: Only users can access this endpoint." } as ConfirmPaymentRequestResponseBody;
      }
      return { message: "Request failed" };
    },
    [accessToken, tokenType, user?.role],
  );

  const createAiSession = useCallback(
    async (data?: { title?: string | null }): Promise<CreateAiSessionResponseBody> => {
      if (!accessToken) {
        throw { message: "Unauthenticated." } as CreateAiSessionResponseBody;
      }
      if (user?.role && user.role !== "user") {
        throw { message: "Unauthorized: Only users can access this endpoint." } as CreateAiSessionResponseBody;
      }

      const response = await fetch(apiUrl("/api/ai/sessions"), {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          Authorization: `${tokenType || "Bearer"} ${accessToken}`,
        },
        body: JSON.stringify(removeUndefined({ title: data?.title ?? undefined })),
      });

      const contentType = response.headers.get("content-type") || "";
      const responseBody = contentType.includes("application/json")
        ? ((await response.json()) as CreateAiSessionResponseBody)
        : null;

      if (responseBody) {
        if (response.status === 422 && responseBody.errors) throw responseBody;
        if (response.status === 401) throw responseBody;
        if (response.status === 403) throw responseBody;
        if (!response.ok) throw responseBody;
        return responseBody;
      }

      if (response.status === 401) throw { message: "Unauthenticated." } as CreateAiSessionResponseBody;
      if (response.status === 403) {
        throw { message: "Unauthorized: Only users can access this endpoint." } as CreateAiSessionResponseBody;
      }
      return { message: "Request failed" };
    },
    [accessToken, tokenType, user?.role],
  );

  const sendAiSessionMessage = useCallback(
    async (data: {
      session_id: string;
      message: string;
      message_type?: "text" | "voice";
      audio_duration_seconds?: number;
    }): Promise<AiSessionMessageResponseBody> => {
      if (!accessToken) {
        throw { message: "Unauthenticated." } as AiSessionMessageResponseBody;
      }
      if (user?.role && user.role !== "user") {
        throw { message: "Unauthorized: Only users can access this endpoint." } as AiSessionMessageResponseBody;
      }
      if (!data.session_id) {
        throw {
          message: "Validation Error",
          errors: { session_id: ["session_id is required."] },
        } as AiSessionMessageResponseBody;
      }

      const response = await fetch(apiUrl(`/api/ai/sessions/${data.session_id}/messages`), {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          Authorization: `${tokenType || "Bearer"} ${accessToken}`,
        },
        body: JSON.stringify(
          removeUndefined({
            message: data.message,
            message_type: data.message_type,
            audio_duration_seconds: data.audio_duration_seconds,
          }),
        ),
      });

      const contentType = response.headers.get("content-type") || "";
      const responseBody = contentType.includes("application/json")
        ? ((await response.json()) as AiSessionMessageResponseBody)
        : null;

      if (responseBody) {
        if (response.status === 422 && responseBody.errors) throw responseBody;
        if (response.status === 401) throw responseBody;
        if (response.status === 403) throw responseBody;
        if (response.status === 404) throw responseBody;
        if (response.status === 502) throw responseBody;
        if (!response.ok) throw responseBody;
        return responseBody;
      }

      if (response.status === 401) throw { message: "Unauthenticated." } as AiSessionMessageResponseBody;
      if (response.status === 403) {
        throw { message: "Unauthorized: Only users can access this endpoint." } as AiSessionMessageResponseBody;
      }
      if (response.status === 404) {
        throw { message: "Session not found." } as AiSessionMessageResponseBody;
      }
      if (response.status === 502) {
        throw { message: "AI service unavailable." } as AiSessionMessageResponseBody;
      }
      return { message: "Request failed" };
    },
    [accessToken, tokenType, user?.role],
  );

  const getAiSessionMessages = useCallback(
    async (sessionId: string): Promise<AiSessionMessagesResponseBody> => {
      if (!accessToken) {
        throw { message: "Unauthenticated." } as AiSessionMessagesResponseBody;
      }
      if (user?.role && user.role !== "user") {
        throw { message: "Unauthorized: Only users can access this endpoint." } as AiSessionMessagesResponseBody;
      }
      if (!sessionId) {
        throw {
          message: "Validation Error",
          errors: { session_id: ["session_id is required."] },
        } as AiSessionMessagesResponseBody;
      }

      const response = await fetch(apiUrl(`/api/ai/sessions/${sessionId}/messages`), {
        method: "GET",
        headers: {
          Accept: "application/json",
          Authorization: `${tokenType || "Bearer"} ${accessToken}`,
        },
      });

      const contentType = response.headers.get("content-type") || "";
      const responseBody = contentType.includes("application/json")
        ? ((await response.json()) as AiSessionMessagesResponseBody)
        : null;

      if (responseBody) {
        if (response.status === 401) throw responseBody;
        if (response.status === 403) throw responseBody;
        if (response.status === 404) throw responseBody;
        if (!response.ok) throw responseBody;
        return responseBody;
      }

      if (response.status === 401) throw { message: "Unauthenticated." } as AiSessionMessagesResponseBody;
      if (response.status === 403) {
        throw { message: "Unauthorized: Only users can access this endpoint." } as AiSessionMessagesResponseBody;
      }
      if (response.status === 404) {
        throw { message: "Session not found." } as AiSessionMessagesResponseBody;
      }
      return { message: "Request failed" };
    },
    [accessToken, tokenType, user?.role],
  );

  const getAiHistory = useCallback(
    async (params?: {
      page?: number;
      page_size?: number;
      include_messages?: boolean;
    }): Promise<AiHistoryResponseBody> => {
      if (!accessToken) {
        throw { message: "Unauthenticated." } as AiHistoryResponseBody;
      }
      if (user?.role && user.role !== "user") {
        throw { message: "Unauthorized: Only users can access this endpoint." } as AiHistoryResponseBody;
      }

      const url = apiUrl("/api/ai/history");
      const fullUrl = new URL(url, window.location.origin);
      if (typeof params?.page === "number" && Number.isFinite(params.page)) {
        fullUrl.searchParams.set("page", String(params.page));
      }
      if (typeof params?.page_size === "number" && Number.isFinite(params.page_size)) {
        fullUrl.searchParams.set("page_size", String(params.page_size));
      }
      if (typeof params?.include_messages === "boolean") {
        fullUrl.searchParams.set("include_messages", params.include_messages ? "1" : "0");
      }

      const response = await fetch(fullUrl.toString(), {
        method: "GET",
        headers: {
          Accept: "application/json",
          Authorization: `${tokenType || "Bearer"} ${accessToken}`,
        },
      });

      const contentType = response.headers.get("content-type") || "";
      const responseBody = contentType.includes("application/json")
        ? ((await response.json()) as AiHistoryResponseBody)
        : null;

      if (responseBody) {
        if (response.status === 401) throw responseBody;
        if (response.status === 403) throw responseBody;
        if (response.status === 422 && responseBody.errors) throw responseBody;
        if (!response.ok) throw responseBody;
        return responseBody;
      }

      if (response.status === 401) throw { message: "Unauthenticated." } as AiHistoryResponseBody;
      if (response.status === 403) {
        throw { message: "Unauthorized: Only users can access this endpoint." } as AiHistoryResponseBody;
      }
      return { message: "Request failed" };
    },
    [accessToken, tokenType, user?.role],
  );

  const deleteAiHistory = useCallback(
    async (sessionId: string): Promise<DeleteAiHistoryResponseBody> => {
      if (!accessToken) {
        throw { message: "Unauthenticated." } as DeleteAiHistoryResponseBody;
      }
      if (user?.role && user.role !== "user") {
        throw { message: "Unauthorized: Only users can access this endpoint." } as DeleteAiHistoryResponseBody;
      }
      if (!sessionId) {
        throw {
          message: "Validation Error",
          errors: { session_id: ["session_id is required."] },
        } as DeleteAiHistoryResponseBody;
      }

      const response = await fetch(apiUrl(`/api/ai/history/${sessionId}`), {
        method: "DELETE",
        headers: {
          Accept: "application/json",
          Authorization: `${tokenType || "Bearer"} ${accessToken}`,
        },
      });

      const contentType = response.headers.get("content-type") || "";
      const responseBody = contentType.includes("application/json")
        ? ((await response.json()) as DeleteAiHistoryResponseBody)
        : null;

      if (responseBody) {
        if (response.status === 401) throw responseBody;
        if (response.status === 403) throw responseBody;
        if (response.status === 404) throw responseBody;
        if (!response.ok) throw responseBody;
        return responseBody;
      }

      if (response.status === 401) throw { message: "Unauthenticated." } as DeleteAiHistoryResponseBody;
      if (response.status === 403) {
        throw { message: "Unauthorized: Only users can access this endpoint." } as DeleteAiHistoryResponseBody;
      }
      if (response.status === 404) {
        throw { message: "Session not found." } as DeleteAiHistoryResponseBody;
      }
      return { message: "Request failed" };
    },
    [accessToken, tokenType, user?.role],
  );

  const renameAiHistory = useCallback(
    async (data: { session_id: string; title: string }): Promise<RenameAiHistoryResponseBody> => {
      if (!accessToken) {
        throw { message: "Unauthenticated." } as RenameAiHistoryResponseBody;
      }
      if (user?.role && user.role !== "user") {
        throw { message: "Unauthorized: Only users can access this endpoint." } as RenameAiHistoryResponseBody;
      }
      if (!data.session_id) {
        throw {
          message: "Validation Error",
          errors: { session_id: ["session_id is required."] },
        } as RenameAiHistoryResponseBody;
      }
      if (!data.title.trim()) {
        throw {
          message: "Validation Error",
          errors: { title: ["title is required."] },
        } as RenameAiHistoryResponseBody;
      }

      const response = await fetch(apiUrl(`/api/ai/history/${data.session_id}/rename`), {
        method: "PATCH",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          Authorization: `${tokenType || "Bearer"} ${accessToken}`,
        },
        body: JSON.stringify({ title: data.title }),
      });

      const contentType = response.headers.get("content-type") || "";
      const responseBody = contentType.includes("application/json")
        ? ((await response.json()) as RenameAiHistoryResponseBody)
        : null;

      if (responseBody) {
        if (response.status === 401) throw responseBody;
        if (response.status === 403) throw responseBody;
        if (response.status === 404) throw responseBody;
        if (response.status === 422 && responseBody.errors) throw responseBody;
        if (!response.ok) throw responseBody;
        return responseBody;
      }

      if (response.status === 401) throw { message: "Unauthenticated." } as RenameAiHistoryResponseBody;
      if (response.status === 403) {
        throw { message: "Unauthorized: Only users can access this endpoint." } as RenameAiHistoryResponseBody;
      }
      if (response.status === 404) {
        throw { message: "Session not found." } as RenameAiHistoryResponseBody;
      }
      return { message: "Request failed" };
    },
    [accessToken, tokenType, user?.role],
  );

  const getMessageContacts = useCallback(
    async (params?: { limit?: number }): Promise<MessageContactsResponseBody> => {
      if (!accessToken) {
        throw { message: "Unauthenticated." } as MessageContactsResponseBody;
      }
      if (user?.role && user.role !== "user") {
        throw { message: "Unauthorized: Only users can access this endpoint." } as MessageContactsResponseBody;
      }

      const url = apiUrl("/api/user/messages/contacts");
      const fullUrl = new URL(url, window.location.origin);
      if (typeof params?.limit === "number" && Number.isFinite(params.limit)) {
        fullUrl.searchParams.set("limit", String(params.limit));
      }

      const response = await fetch(fullUrl.toString(), {
        method: "GET",
        headers: {
          Accept: "application/json",
          Authorization: `${tokenType || "Bearer"} ${accessToken}`,
        },
      });

      const contentType = response.headers.get("content-type") || "";
      const responseBody = contentType.includes("application/json")
        ? ((await response.json()) as MessageContactsResponseBody)
        : null;

      if (responseBody) {
        if (response.status === 422 && responseBody.errors) throw responseBody;
        if (response.status === 401) throw responseBody;
        if (response.status === 403) throw responseBody;
        if (!response.ok) return responseBody;
        return responseBody;
      }

      if (response.status === 401) throw { message: "Unauthenticated." } as MessageContactsResponseBody;
      if (response.status === 403) {
        throw { message: "Unauthorized: Only users can access this endpoint." } as MessageContactsResponseBody;
      }
      return { message: "Request failed" };
    },
    [accessToken, tokenType, user?.role],
  );

  const getMessages = useCallback(
    async (params: { conversation_id: number; limit?: number; before_id?: number }): Promise<MessageThreadResponseBody> => {
      if (!accessToken) {
        throw { message: "Unauthenticated." } as MessageThreadResponseBody;
      }
      if (user?.role && user.role !== "user") {
        throw { message: "Unauthorized: Only users can access this endpoint." } as MessageThreadResponseBody;
      }
      if (!params?.conversation_id || !Number.isFinite(params.conversation_id)) {
        throw { message: "Validation Error", errors: { conversation_id: ["Conversation is required."] } } as MessageThreadResponseBody;
      }

      const url = apiUrl("/api/user/messages");
      const fullUrl = new URL(url, window.location.origin);
      fullUrl.searchParams.set("conversation_id", String(params.conversation_id));
      if (typeof params?.limit === "number" && Number.isFinite(params.limit)) {
        fullUrl.searchParams.set("limit", String(params.limit));
      }
      if (typeof params?.before_id === "number" && Number.isFinite(params.before_id)) {
        fullUrl.searchParams.set("before_id", String(params.before_id));
      }

      const response = await fetch(fullUrl.toString(), {
        method: "GET",
        headers: {
          Accept: "application/json",
          Authorization: `${tokenType || "Bearer"} ${accessToken}`,
        },
      });

      const contentType = response.headers.get("content-type") || "";
      const responseBody = contentType.includes("application/json")
        ? ((await response.json()) as MessageThreadResponseBody)
        : null;

      if (responseBody) {
        if (response.status === 422 && responseBody.errors) throw responseBody;
        if (response.status === 401) throw responseBody;
        if (response.status === 403) throw responseBody;
        if (!response.ok) return responseBody;
        return responseBody;
      }

      if (response.status === 401) throw { message: "Unauthenticated." } as MessageThreadResponseBody;
      if (response.status === 403) {
        throw { message: "Unauthorized: Only users can access this endpoint." } as MessageThreadResponseBody;
      }
      return { message: "Request failed" };
    },
    [accessToken, tokenType, user?.role],
  );

  const getMessageNotifications = useCallback(
    async (params?: { limit?: number }): Promise<MessageNotificationsResponseBody> => {
      if (!accessToken) {
        throw { message: "Unauthenticated." } as MessageNotificationsResponseBody;
      }
      if (user?.role && user.role !== "user") {
        throw { message: "Unauthorized: Only users can access this endpoint." } as MessageNotificationsResponseBody;
      }

      const url = apiUrl("/api/user/messages/notification");
      const fullUrl = new URL(url, window.location.origin);
      if (typeof params?.limit === "number" && Number.isFinite(params.limit)) {
        fullUrl.searchParams.set("limit", String(params.limit));
      }

      const response = await fetch(fullUrl.toString(), {
        method: "GET",
        headers: {
          Accept: "application/json",
          Authorization: `${tokenType || "Bearer"} ${accessToken}`,
        },
      });

      const contentType = response.headers.get("content-type") || "";
      const responseBody = contentType.includes("application/json")
        ? ((await response.json()) as MessageNotificationsResponseBody)
        : null;

      if (responseBody) {
        if (response.status === 422 && responseBody.errors) throw responseBody;
        if (response.status === 401) throw responseBody;
        if (response.status === 403) throw responseBody;
        if (!response.ok) return responseBody;
        return responseBody;
      }

      if (response.status === 401) throw { message: "Unauthenticated." } as MessageNotificationsResponseBody;
      if (response.status === 403) {
        throw { message: "Unauthorized: Only users can access this endpoint." } as MessageNotificationsResponseBody;
      }
      return { message: "Request failed" };
    },
    [accessToken, tokenType, user?.role],
  );

  const refreshBalance = useCallback(async (nextBalance?: number | null): Promise<number | null> => {
    if (typeof nextBalance === "number" && Number.isFinite(nextBalance)) {
      setUser((prev) => {
        if (prev && prev.balance !== nextBalance) {
          return { ...prev, balance: nextBalance };
        }
        return prev;
      });
      return nextBalance;
    }

    if (!accessToken || user?.role !== "user") return null;

    try {
      const response = await fetch(apiUrl("/api/wallets"), {
        method: "GET",
        headers: {
          Accept: "application/json",
          Authorization: `${tokenType || "Bearer"} ${accessToken}`,
        },
      });

      if (!response.ok) return null;

      const data = await response.json();
      const wallets = data.wallets || [];
      if (wallets.length === 0) return 0;

      // Use the balance of the first (primary) wallet
      const primaryBalance = parseFloat(wallets[0].balance || "0");
      setUser((prev) => {
        if (prev && prev.balance !== primaryBalance) {
          return { ...prev, balance: primaryBalance };
        }
        return prev;
      });
      return primaryBalance;
    } catch (error) {
      console.error("Error refreshing balance:", error);
      return null;
    }
  }, [accessToken, tokenType, user?.role]);

  const getProductSearchSuggestions = useCallback(
    async (params: { q: string; suggestions_limit?: number }): Promise<ProductSearchSuggestionsResponseBody> => {
      if (!accessToken) {
        throw { message: "Unauthenticated." } as ProductSearchSuggestionsResponseBody;
      }
      if (user?.role && user.role !== "user") {
        throw { message: "Unauthorized: Only users can access this endpoint." } as ProductSearchSuggestionsResponseBody;
      }

      const query = params?.q?.trim() ?? "";
      if (!query) {
        throw {
          message: "Validation Error",
          errors: { q: ["The q field is required."] },
        } as ProductSearchSuggestionsResponseBody;
      }

      if (query.length > 255) {
        throw {
          message: "Validation Error",
          errors: { q: ["The q field must not be greater than 255 characters."] },
        } as ProductSearchSuggestionsResponseBody;
      }

      const url = apiUrl("/api/user/search/products/suggestions");
      const fullUrl = new URL(url, window.location.origin);
      fullUrl.searchParams.set("q", query);
      if (typeof params?.suggestions_limit === "number" && Number.isFinite(params.suggestions_limit)) {
        fullUrl.searchParams.set("suggestions_limit", String(params.suggestions_limit));
      }

      const response = await fetch(fullUrl.toString(), {
        method: "GET",
        headers: {
          Accept: "application/json",
          Authorization: `${tokenType || "Bearer"} ${accessToken}`,
        },
      });

      const contentType = response.headers.get("content-type") || "";
      const responseBody = contentType.includes("application/json")
        ? ((await response.json()) as ProductSearchSuggestionsResponseBody)
        : null;

      if (responseBody) {
        if (response.status === 422 && responseBody.errors) throw responseBody;
        if (response.status === 401) throw responseBody;
        if (response.status === 403) throw responseBody;
        if (!response.ok) return responseBody;
        return responseBody;
      }

      if (response.status === 401) throw { message: "Unauthenticated." } as ProductSearchSuggestionsResponseBody;
      if (response.status === 403) {
        throw { message: "Unauthorized: Only users can access this endpoint." } as ProductSearchSuggestionsResponseBody;
      }
      if (response.status === 422) {
        throw { message: "Validation Error" } as ProductSearchSuggestionsResponseBody;
      }
      return { message: "Request failed" };
    },
    [accessToken, tokenType, user?.role],
  );

  const searchProducts = useCallback(
    async (params: { q: string; page?: number; page_size?: number }): Promise<SearchProductsResponseBody> => {
      if (!accessToken) {
        throw { message: "Unauthenticated." } as SearchProductsResponseBody;
      }
      if (user?.role && user.role !== "user") {
        throw { message: "Unauthorized: Only users can access this endpoint." } as SearchProductsResponseBody;
      }

      const query = params?.q?.trim() ?? "";
      if (!query) {
        throw {
          message: "Validation Error",
          errors: { q: ["The q field is required."] },
        } as SearchProductsResponseBody;
      }
      if (query.length > 255) {
        throw {
          message: "Validation Error",
          errors: { q: ["The q field must not be greater than 255 characters."] },
        } as SearchProductsResponseBody;
      }

      const url = apiUrl("/api/user/search/products");
      const fullUrl = new URL(url, window.location.origin);
      fullUrl.searchParams.set("q", query);
      if (typeof params?.page === "number" && Number.isFinite(params.page)) {
        fullUrl.searchParams.set("page", String(params.page));
      }
      if (typeof params?.page_size === "number" && Number.isFinite(params.page_size)) {
        fullUrl.searchParams.set("page_size", String(params.page_size));
      }

      const response = await fetch(fullUrl.toString(), {
        method: "GET",
        headers: {
          Accept: "application/json",
          Authorization: `${tokenType || "Bearer"} ${accessToken}`,
        },
      });

      const contentType = response.headers.get("content-type") || "";
      const responseBody = contentType.includes("application/json")
        ? ((await response.json()) as SearchProductsResponseBody)
        : null;

      if (responseBody) {
        if (response.status === 422 && responseBody.errors) throw responseBody;
        if (response.status === 401) throw responseBody;
        if (response.status === 403) throw responseBody;
        if (!response.ok) return responseBody;
        return responseBody;
      }

      if (response.status === 401) throw { message: "Unauthenticated." } as SearchProductsResponseBody;
      if (response.status === 403) {
        throw { message: "Unauthorized: Only users can access this endpoint." } as SearchProductsResponseBody;
      }
      if (response.status === 422) {
        throw { message: "Validation Error" } as SearchProductsResponseBody;
      }
      return { message: "Request failed" };
    },
    [accessToken, tokenType, user],
  );

  const searchVisualProducts = useCallback(
    async (params: { image: File; top_k?: number }): Promise<SearchVisualProductsResponseBody> => {
      if (!accessToken) {
        throw { message: "Unauthenticated." } as SearchVisualProductsResponseBody;
      }
      if (user?.role && user.role !== "user") {
        throw { message: "Unauthorized: Only users can access this endpoint." } as SearchVisualProductsResponseBody;
      }

      const image = params?.image;
      if (!(image instanceof File)) {
        throw {
          message: "Validation Error",
          errors: { image: ["The image field is required."] },
        } as SearchVisualProductsResponseBody;
      }

      const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
      if (!allowedTypes.includes(image.type)) {
        throw {
          message: "Validation Error",
          errors: { image: ["The image must be a file of type: jpg, jpeg, png, webp."] },
        } as SearchVisualProductsResponseBody;
      }

      const maxBytes = 8 * 1024 * 1024;
      if (image.size > maxBytes) {
        throw {
          message: "Validation Error",
          errors: { image: ["The image must not be greater than 8192 kilobytes."] },
        } as SearchVisualProductsResponseBody;
      }

      const topK = params?.top_k;
      if (typeof topK === "number" && (!Number.isFinite(topK) || topK < 1 || topK > 50)) {
        throw {
          message: "Validation Error",
          errors: { top_k: ["The top k field must be between 1 and 50."] },
        } as SearchVisualProductsResponseBody;
      }

      const formData = new FormData();
      formData.append("image", image);
      if (typeof topK === "number" && Number.isFinite(topK)) {
        formData.append("top_k", String(topK));
      }

      const response = await fetch(apiUrl("/api/user/search/visual"), {
        method: "POST",
        headers: {
          Accept: "application/json",
          Authorization: `${tokenType || "Bearer"} ${accessToken}`,
        },
        body: formData,
      });

      const contentType = response.headers.get("content-type") || "";
      const responseBody = contentType.includes("application/json")
        ? ((await response.json()) as SearchVisualProductsResponseBody)
        : null;

      if (responseBody) {
        if (response.status === 422 && responseBody.errors) throw responseBody;
        if (response.status === 401) throw responseBody;
        if (response.status === 403) throw responseBody;
        if (response.status === 502) throw responseBody;
        if (!response.ok) return responseBody;
        return responseBody;
      }

      if (response.status === 401) throw { message: "Unauthenticated." } as SearchVisualProductsResponseBody;
      if (response.status === 403) {
        throw { message: "Unauthorized: Only users can access this endpoint." } as SearchVisualProductsResponseBody;
      }
      if (response.status === 422) {
        throw { message: "Validation Error" } as SearchVisualProductsResponseBody;
      }
      if (response.status === 502) {
        throw { message: "AI visual search service unavailable." } as SearchVisualProductsResponseBody;
      }
      return { message: "Request failed" };
    },
    [accessToken, tokenType, user],
  );

  const getMetaOptions = useCallback(async (): Promise<MetaOptionsResponseBody> => {
    if (!accessToken) {
      throw { message: "Unauthenticated." } as MetaOptionsResponseBody;
    }
    if (user?.role && user.role !== "user") {
      throw { message: "Unauthorized: Only users can access this endpoint." } as MetaOptionsResponseBody;
    }

    const cacheScope = `${user?.id ?? "guest"}:${user?.role ?? "guest"}`;
    const now = Date.now();
    const memoryCached = metaOptionsCacheRef.current;
    if (memoryCached && memoryCached.scope === cacheScope && memoryCached.expiresAt > now) {
      return memoryCached.value;
    }

    const rawSessionCached = readSessionStorage(SESSION_KEYS.metaOptions);
    const sessionCached = parseJson<{ scope?: string; expiresAt?: number; value?: MetaOptionsResponseBody }>(rawSessionCached);
    if (
      sessionCached?.scope === cacheScope &&
      typeof sessionCached.expiresAt === "number" &&
      sessionCached.expiresAt > now &&
      sessionCached.value
    ) {
      metaOptionsCacheRef.current = {
        scope: cacheScope,
        expiresAt: sessionCached.expiresAt,
        value: sessionCached.value,
      };
      return sessionCached.value;
    }

    if (metaOptionsPendingRef.current) {
      return await metaOptionsPendingRef.current;
    }

    const request = (async (): Promise<MetaOptionsResponseBody> => {
      const response = await fetch(apiUrl("/api/user/meta/options"), {
        method: "GET",
        headers: {
          Accept: "application/json",
          Authorization: `${tokenType || "Bearer"} ${accessToken}`,
        },
      });

      const contentType = response.headers.get("content-type") || "";
      const responseBody = contentType.includes("application/json")
        ? ((await response.json()) as MetaOptionsResponseBody)
        : null;

      if (responseBody) {
        if (response.status === 401) throw responseBody;
        if (response.status === 403) throw responseBody;
        if (!response.ok) return responseBody;

        const expiresAt = Date.now() + META_OPTIONS_TTL_MS;
        metaOptionsCacheRef.current = {
          scope: cacheScope,
          expiresAt,
          value: responseBody,
        };
        writeSessionStorage(
          SESSION_KEYS.metaOptions,
          JSON.stringify({
            scope: cacheScope,
            expiresAt,
            value: responseBody,
          }),
        );
        return responseBody;
      }

      if (response.status === 401) throw { message: "Unauthenticated." } as MetaOptionsResponseBody;
      if (response.status === 403) {
        throw { message: "Unauthorized: Only users can access this endpoint." } as MetaOptionsResponseBody;
      }
      return { message: "Request failed" };
    })();

    metaOptionsPendingRef.current = request;
    try {
      return await request;
    } finally {
      metaOptionsPendingRef.current = null;
    }
  }, [accessToken, tokenType, user?.id, user?.role]);

  const getMyProductCards = useCallback(
    async (params?: { page?: number; page_size?: number }): Promise<MyProductCardsResponseBody> => {
      if (!accessToken) {
        throw { message: "Unauthenticated." } as MyProductCardsResponseBody;
      }
      if (user?.role && user.role !== "user") {
        throw { message: "Unauthorized: Only users can access this endpoint." } as MyProductCardsResponseBody;
      }

      const url = apiUrl("/api/user/products/cards");
      const fullUrl = new URL(url, window.location.origin);
      if (typeof params?.page === "number" && Number.isFinite(params.page)) {
        fullUrl.searchParams.set("page", String(params.page));
      }
      if (typeof params?.page_size === "number" && Number.isFinite(params.page_size)) {
        fullUrl.searchParams.set("page_size", String(params.page_size));
      }

      const response = await fetch(fullUrl.toString(), {
        method: "GET",
        headers: {
          Accept: "application/json",
          Authorization: `${tokenType || "Bearer"} ${accessToken}`,
        },
      });

      const contentType = response.headers.get("content-type") || "";
      const responseBody = contentType.includes("application/json")
        ? ((await response.json()) as MyProductCardsResponseBody)
        : null;

      if (responseBody) {
        if (response.status === 422 && responseBody.errors) throw responseBody;
        if (response.status === 401) throw responseBody;
        if (response.status === 403) throw responseBody;
        if (!response.ok) return responseBody;
        return responseBody;
      }

      if (response.status === 401) throw { message: "Unauthenticated." } as MyProductCardsResponseBody;
      if (response.status === 403) {
        throw { message: "Unauthorized: Only users can access this endpoint." } as MyProductCardsResponseBody;
      }
      return { message: "Request failed" };
    },
    [accessToken, tokenType, user],
  );

  const getSellerProfile = useCallback(
    async (sellerId: number, params?: { page?: number; page_size?: number }): Promise<SellerProfileResponseBody> => {
      if (!accessToken) {
        throw { message: "Unauthenticated." } as SellerProfileResponseBody;
      }
      if (user?.role && user.role !== "user") {
        throw { message: "Unauthorized: Only users can access this endpoint." } as SellerProfileResponseBody;
      }

      const normalizedSellerId = Number.isFinite(sellerId) ? Math.trunc(sellerId) : NaN;
      const url = apiUrl(`/api/user/sellers/${normalizedSellerId}`);
      const fullUrl = new URL(url, window.location.origin);
      if (typeof params?.page === "number" && Number.isFinite(params.page)) {
        fullUrl.searchParams.set("page", String(params.page));
      }
      if (typeof params?.page_size === "number" && Number.isFinite(params.page_size)) {
        fullUrl.searchParams.set("page_size", String(params.page_size));
      }

      const response = await fetch(fullUrl.toString(), {
        method: "GET",
        headers: {
          Accept: "application/json",
          Authorization: `${tokenType || "Bearer"} ${accessToken}`,
        },
      });

      const contentType = response.headers.get("content-type") || "";
      const responseBody = contentType.includes("application/json")
        ? ((await response.json()) as SellerProfileResponseBody)
        : null;

      if (responseBody) {
        if (response.status === 422 && responseBody.errors) throw responseBody;
        if (response.status === 401) throw responseBody;
        if (response.status === 403) throw responseBody;
        if (response.status === 404) throw responseBody;
        if (!response.ok) return responseBody;
        return responseBody;
      }

      if (response.status === 401) throw { message: "Unauthenticated." } as SellerProfileResponseBody;
      if (response.status === 403) {
        throw { message: "Unauthorized: Only users can access this endpoint." } as SellerProfileResponseBody;
      }
      if (response.status === 404) {
        throw { message: "Seller not found." } as SellerProfileResponseBody;
      }
      if (response.status === 422) {
        throw { message: "Validation Error" } as SellerProfileResponseBody;
      }
      return { message: "Request failed" };
    },
    [accessToken, tokenType, user],
  );

  const getRecommendedProducts = useCallback(
    async (params?: {
      page?: number;
      page_size?: number;
      random_count?: number;
      lookback_days?: number;
      seed?: number;
    }): Promise<RecommendationsResponseBody> => {
      if (!accessToken) {
        throw { detail: "Missing Authorization header" } as RecommendationsResponseBody;
      }
      if (user?.role && user.role !== "user") {
        throw { detail: "Only users can access this endpoint" } as RecommendationsResponseBody;
      }

      const endpoint = apiPyUrl("/py/api/user/recommendations/products");
      const url = new URL(endpoint, window.location.origin);
      if (typeof params?.page === "number" && Number.isFinite(params.page)) {
        url.searchParams.set("page", String(params.page));
      }
      if (typeof params?.page_size === "number" && Number.isFinite(params.page_size)) {
        url.searchParams.set("page_size", String(params.page_size));
      }
      if (typeof params?.random_count === "number" && Number.isFinite(params.random_count)) {
        url.searchParams.set("random_count", String(params.random_count));
      }
      if (typeof params?.lookback_days === "number" && Number.isFinite(params.lookback_days)) {
        url.searchParams.set("lookback_days", String(params.lookback_days));
      }
      if (typeof params?.seed === "number" && Number.isFinite(params.seed)) {
        url.searchParams.set("seed", String(params.seed));
      }

      const response = await fetch(url.toString(), {
        method: "GET",
        headers: {
          Accept: "application/json",
          Authorization: `${tokenType || "Bearer"} ${accessToken}`,
        },
      });

      const contentType = response.headers.get("content-type") || "";
      const responseBody = contentType.includes("application/json")
        ? ((await response.json()) as RecommendationsResponseBody)
        : null;

      if (responseBody) {
        if (response.status === 401) throw responseBody;
        if (response.status === 403) throw responseBody;
        if (!response.ok) return responseBody;
        return responseBody;
      }

      if (response.status === 401) throw { detail: "Missing Authorization header" } as RecommendationsResponseBody;
      if (response.status === 403) {
        throw { detail: "Only users can access this endpoint" } as RecommendationsResponseBody;
      }
      return { detail: "Request failed" };
    },
    [accessToken, tokenType, user],
  );

  const getRecommendedExchangeProducts = useCallback(
    async (params?: {
      page?: number;
      page_size?: number;
      random_count?: number;
      lookback_days?: number;
      seed?: number;
      exchange_type?: "exchange_only" | "exchange_or_purchase";
    }): Promise<ExchangeRecommendationsResponseBody> => {
      if (!accessToken) {
        throw { detail: "Missing Authorization header" } as ExchangeRecommendationsResponseBody;
      }
      if (user?.role && user.role !== "user") {
        throw { detail: "Only users can access this endpoint" } as ExchangeRecommendationsResponseBody;
      }

      const endpoint = apiPyUrl("/py/api/user/recommendations/exchange-products");
      const url = new URL(endpoint, window.location.origin);
      if (typeof params?.page === "number" && Number.isFinite(params.page)) {
        url.searchParams.set("page", String(params.page));
      }
      if (typeof params?.page_size === "number" && Number.isFinite(params.page_size)) {
        url.searchParams.set("page_size", String(params.page_size));
      }
      if (typeof params?.random_count === "number" && Number.isFinite(params.random_count)) {
        url.searchParams.set("random_count", String(params.random_count));
      }
      if (typeof params?.lookback_days === "number" && Number.isFinite(params.lookback_days)) {
        url.searchParams.set("lookback_days", String(params.lookback_days));
      }
      if (typeof params?.seed === "number" && Number.isFinite(params.seed)) {
        url.searchParams.set("seed", String(params.seed));
      }
      if (params?.exchange_type) {
        url.searchParams.set("exchange_type", params.exchange_type);
      }

      const response = await fetch(url.toString(), {
        method: "GET",
        headers: {
          Accept: "application/json",
          Authorization: `${tokenType || "Bearer"} ${accessToken}`,
        },
      });

      const contentType = response.headers.get("content-type") || "";
      const responseBody = contentType.includes("application/json")
        ? ((await response.json()) as ExchangeRecommendationsResponseBody)
        : null;

      if (responseBody) {
        if (response.status === 401) throw responseBody;
        if (response.status === 403) throw responseBody;
        if (response.status === 422) throw responseBody;
        if (response.status === 502) throw responseBody;
        if (response.status === 503) throw responseBody;
        if (!response.ok) return responseBody;
        return responseBody;
      }

      if (response.status === 401) throw { detail: "Missing Authorization header" } as ExchangeRecommendationsResponseBody;
      if (response.status === 403) throw { detail: "Only users can access this endpoint" } as ExchangeRecommendationsResponseBody;
      if (response.status === 422) throw { detail: "Invalid exchange_type" } as ExchangeRecommendationsResponseBody;
      if (response.status === 502) throw { detail: "Could not reach Laravel" } as ExchangeRecommendationsResponseBody;
      if (response.status === 503) throw { detail: "Database unavailable" } as ExchangeRecommendationsResponseBody;
      return { detail: "Request failed" };
    },
    [accessToken, tokenType, user],
  );

  const getNearby = useCallback(
    async (params: {
      lat: number;
      lng: number;
      distance_km?: number;
      category_id?: number;
      condition_level_id?: number;
      q?: string;
      location_q?: string;
    }): Promise<NearbyResponseBody> => {
      if (!accessToken) {
        throw { message: "Unauthenticated." } as NearbyResponseBody;
      }
      if (user?.role && user.role !== "user") {
        throw { message: "Unauthorized: Only users can access this endpoint." } as NearbyResponseBody;
      }

      const url = apiUrl("/api/user/nearby");
      const fullUrl = new URL(url, window.location.origin);
      fullUrl.searchParams.set("lat", String(params.lat));
      fullUrl.searchParams.set("lng", String(params.lng));
      if (typeof params.distance_km === "number" && Number.isFinite(params.distance_km)) {
        fullUrl.searchParams.set("distance_km", String(params.distance_km));
      }
      if (typeof params.category_id === "number" && Number.isFinite(params.category_id)) {
        fullUrl.searchParams.set("category_id", String(params.category_id));
      }
      if (typeof params.condition_level_id === "number" && Number.isFinite(params.condition_level_id)) {
        fullUrl.searchParams.set("condition_level_id", String(params.condition_level_id));
      }
      if (params.q) {
        fullUrl.searchParams.set("q", params.q);
      }
      if (params.location_q) {
        fullUrl.searchParams.set("location_q", params.location_q);
      }

      const response = await fetch(fullUrl.toString(), {
        method: "GET",
        headers: {
          Accept: "application/json",
          Authorization: `${tokenType || "Bearer"} ${accessToken}`,
        },
      });

      const contentType = response.headers.get("content-type") || "";
      const responseBody = contentType.includes("application/json")
        ? ((await response.json()) as NearbyResponseBody)
        : null;

      if (responseBody) {
        if (response.status === 422 && responseBody.errors) throw responseBody;
        if (response.status === 401) throw responseBody;
        if (response.status === 403) throw responseBody;
        if (!response.ok) return responseBody;
        return responseBody;
      }

      if (response.status === 401) throw { message: "Unauthenticated." } as NearbyResponseBody;
      if (response.status === 403) {
        throw { message: "Unauthorized: Only users can access this endpoint." } as NearbyResponseBody;
      }
      return { message: "Request failed" };
    },
    [accessToken, tokenType, user],
  );

  const getSimilarProducts = useCallback(
    async (
      productId: number,
      params?: { page?: number; page_size?: number },
    ): Promise<SimilarProductsResponseBody> => {
      if (!accessToken) {
        throw { detail: "Missing Authorization header" } as SimilarProductsResponseBody;
      }
      if (user?.role && user.role !== "user") {
        throw { detail: "Only users can access this endpoint" } as SimilarProductsResponseBody;
      }

      const normalizedProductId = Number.isFinite(productId) ? Math.trunc(productId) : NaN;
      const page = Number.isFinite(params?.page) ? Math.max(1, Math.trunc(params?.page ?? 1)) : 1;
      const pageSize = Number.isFinite(params?.page_size)
        ? Math.min(50, Math.max(1, Math.trunc(params?.page_size ?? 10)))
        : 10;

      const endpoint = apiPyUrl(`/py/api/user/products/${normalizedProductId}/similar`);
      const url = new URL(endpoint, window.location.origin);
      url.searchParams.set("page", String(page));
      url.searchParams.set("page_size", String(pageSize));

      const response = await fetch(url.toString(), {
        method: "GET",
        headers: {
          Accept: "application/json",
          Authorization: `${tokenType || "Bearer"} ${accessToken}`,
        },
      });

      const contentType = response.headers.get("content-type") || "";
      const responseBody = contentType.includes("application/json")
        ? ((await response.json()) as SimilarProductsResponseBody)
        : null;

      if (responseBody) {
        if (response.status === 401) throw responseBody;
        if (response.status === 403) throw responseBody;
        if (response.status === 404) throw responseBody;
        if (response.status === 502) throw responseBody;
        if (response.status === 503) throw responseBody;
        if (!response.ok) return responseBody;
        return responseBody;
      }

      if (response.status === 401) throw { detail: "Missing Authorization header" } as SimilarProductsResponseBody;
      if (response.status === 403) throw { detail: "Only users can access this endpoint" } as SimilarProductsResponseBody;
      if (response.status === 404) throw { detail: "Product not found" } as SimilarProductsResponseBody;
      if (response.status === 502) throw { detail: "Could not reach Laravel" } as SimilarProductsResponseBody;
      if (response.status === 503) throw { detail: "Database unavailable" } as SimilarProductsResponseBody;
      return { detail: "Request failed" };
    },
    [accessToken, tokenType, user],
  );

  const getProductDetail = useCallback(
    async (productId: number): Promise<ProductDetailResponseBody> => {
      if (!accessToken) {
        throw { message: "Unauthenticated." } as ProductDetailResponseBody;
      }
      if (user?.role && user.role !== "user") {
        throw { message: "Unauthorized: Only users can access this endpoint." } as ProductDetailResponseBody;
      }

      const response = await fetch(apiUrl(`/api/user/get_product/${productId}`), {
        method: "GET",
        headers: {
          Accept: "application/json",
          Authorization: `${tokenType || "Bearer"} ${accessToken}`,
        },
      });

      const contentType = response.headers.get("content-type") || "";
      const responseBody = contentType.includes("application/json")
        ? ((await response.json()) as ProductDetailResponseBody)
        : null;

      if (responseBody) {
        if (response.status === 422 && responseBody.errors) throw responseBody;
        if (response.status === 401) throw responseBody;
        if (response.status === 403) throw responseBody;
        if (response.status === 404) throw responseBody;
        if (!response.ok) return responseBody;
        return responseBody;
      }

      if (response.status === 401) throw { message: "Unauthenticated." } as ProductDetailResponseBody;
      if (response.status === 403) {
        throw { message: "Unauthorized: Only users can access this endpoint." } as ProductDetailResponseBody;
      }
      if (response.status === 404) {
        throw { message: "Product not found." } as ProductDetailResponseBody;
      }
      return { message: "Request failed" };
    },
    [accessToken, tokenType, user],
  );

  const getProductForEdit = useCallback(
    async (productId: number): Promise<GetProductForEditResponseBody> => {
      if (!accessToken) {
        throw { message: "Unauthenticated." } as GetProductForEditResponseBody;
      }
      if (user?.role && user.role !== "user") {
        throw { message: "Unauthorized: Only users can access this endpoint." } as GetProductForEditResponseBody;
      }

      const response = await fetch(apiUrl(`/api/user/products/${productId}/edit`), {
        method: "GET",
        headers: {
          Accept: "application/json",
          Authorization: `${tokenType || "Bearer"} ${accessToken}`,
        },
      });

      const contentType = response.headers.get("content-type") || "";
      const responseBody = contentType.includes("application/json")
        ? ((await response.json()) as GetProductForEditResponseBody)
        : null;

      if (responseBody) {
        if (response.status === 422 && responseBody.errors) throw responseBody;
        if (response.status === 401) throw responseBody;
        if (response.status === 403) throw responseBody;
        if (response.status === 404) throw responseBody;
        if (!response.ok) return responseBody;
        return responseBody;
      }

      if (response.status === 401) throw { message: "Unauthenticated." } as GetProductForEditResponseBody;
      if (response.status === 403) {
        throw { message: "Unauthorized: Only users can access this endpoint." } as GetProductForEditResponseBody;
      }
      if (response.status === 404) {
        throw { message: "Product not found." } as GetProductForEditResponseBody;
      }
      return { message: "Request failed" };
    },
    [accessToken, tokenType, user],
  );

  const updateProduct = useCallback(
    async (productId: number, data: UpdateProductInput): Promise<UpdateProductResponseBody> => {
      if (!accessToken) {
        throw { message: "Unauthenticated." } as UpdateProductResponseBody;
      }
      if (user?.role && user.role !== "user") {
        throw { message: "Unauthorized: Only users can access this endpoint." } as UpdateProductResponseBody;
      }

      const payload = removeUndefined({
        title: data.title,
        description: data.description,
        price: data.price,
        category_id: data.category_id,
        condition_level_id: data.condition_level_id,
        dormitory_id: data.dormitory_id,
        tag_ids: data.tag_ids,
        exchange_type: data.exchange_type,
        target_product_title: data.target_product_title,
        target_product_category_id: data.target_product_category_id,
        target_product_condition_id: data.target_product_condition_id,
        expiration_date: data.expiration_date,
      });

      const response = await fetch(apiUrl(`/api/user/products/${productId}`), {
        method: "PATCH",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          Authorization: `${tokenType || "Bearer"} ${accessToken}`,
        },
        body: JSON.stringify(payload),
      });

      const contentType = response.headers.get("content-type") || "";
      const responseBody = contentType.includes("application/json")
        ? ((await response.json()) as UpdateProductResponseBody)
        : null;

      if (responseBody) {
        if (response.status === 422 && responseBody.errors) throw responseBody;
        if (response.status === 401) throw responseBody;
        if (response.status === 403) throw responseBody;
        if (response.status === 404) throw responseBody;
        if (!response.ok) return responseBody;
        return responseBody;
      }

      if (response.status === 401) throw { message: "Unauthenticated." } as UpdateProductResponseBody;
      if (response.status === 403) {
        throw { message: "Unauthorized: Only users can access this endpoint." } as UpdateProductResponseBody;
      }
      if (response.status === 404) {
        throw { message: "Product not found." } as UpdateProductResponseBody;
      }
      return { message: "Request failed" };
    },
    [accessToken, tokenType, user],
  );

  const getProductEngagement = useCallback(
    async (productId: number): Promise<ProductEngagementResponseBody> => {
      if (!accessToken) {
        throw { message: "Unauthenticated." } as ProductEngagementResponseBody;
      }
      if (user?.role && user.role !== "user") {
        throw { message: "Unauthorized: Only users can access this endpoint." } as ProductEngagementResponseBody;
      }

      const response = await fetch(apiUrl(`/api/user/products/${productId}/engagement`), {
        method: "GET",
        headers: {
          Accept: "application/json",
          Authorization: `${tokenType || "Bearer"} ${accessToken}`,
        },
      });

      const contentType = response.headers.get("content-type") || "";
      const responseBody = contentType.includes("application/json")
        ? ((await response.json()) as ProductEngagementResponseBody)
        : null;

      if (responseBody) {
        if (response.status === 422 && responseBody.errors) throw responseBody;
        if (response.status === 401) throw responseBody;
        if (response.status === 403) throw responseBody;
        if (response.status === 404) throw responseBody;
        if (!response.ok) return responseBody;
        return responseBody;
      }

      if (response.status === 401) throw { message: "Unauthenticated." } as ProductEngagementResponseBody;
      if (response.status === 403) {
        throw { message: "Unauthorized: Only users can access this endpoint." } as ProductEngagementResponseBody;
      }
      if (response.status === 404) {
        throw { message: "Product not found." } as ProductEngagementResponseBody;
      }
      return { message: "Request failed" };
    },
    [accessToken, tokenType, user],
  );

  const markProductSold = useCallback(
    async (productId: number): Promise<MarkProductSoldResponseBody> => {
      if (!accessToken) {
        throw { message: "Unauthenticated." } as MarkProductSoldResponseBody;
      }
      if (user?.role && user.role !== "user") {
        throw { message: "Unauthorized: Only users can access this endpoint." } as MarkProductSoldResponseBody;
      }

      const response = await fetch(apiUrl(`/api/user/products/${productId}/mark-sold`), {
        method: "PATCH",
        headers: {
          Accept: "application/json",
          Authorization: `${tokenType || "Bearer"} ${accessToken}`,
        },
      });

      const contentType = response.headers.get("content-type") || "";
      const responseBody = contentType.includes("application/json")
        ? ((await response.json()) as MarkProductSoldResponseBody)
        : null;

      if (responseBody) {
        if (response.status === 422 && responseBody.errors) throw responseBody;
        if (response.status === 401) throw responseBody;
        if (response.status === 403) throw responseBody;
        if (response.status === 404) throw responseBody;
        if (!response.ok) return responseBody;
        return responseBody;
      }

      if (response.status === 401) throw { message: "Unauthenticated." } as MarkProductSoldResponseBody;
      if (response.status === 403) {
        throw { message: "Unauthorized: Only users can access this endpoint." } as MarkProductSoldResponseBody;
      }
      if (response.status === 404) {
        throw { message: "Product not found." } as MarkProductSoldResponseBody;
      }
      return { message: "Request failed" };
    },
    [accessToken, tokenType, user],
  );

  const updateProductImages = useCallback(
    async (productId: number, data: UpdateProductImagesInput): Promise<UpdateProductImagesResponseBody> => {
      if (!accessToken) {
        throw { message: "Unauthenticated." } as UpdateProductImagesResponseBody;
      }
      if (user?.role && user.role !== "user") {
        throw { message: "Unauthorized: Only users can access this endpoint." } as UpdateProductImagesResponseBody;
      }

      const hasFiles = (data.images?.length || 0) > 0 || (data.thumbnail_images?.length || 0) > 0;
      const response = await fetch(apiUrl(`/api/user/products/${productId}/images`), {
        method: "POST",
        headers: hasFiles
          ? {
              Accept: "application/json",
              Authorization: `${tokenType || "Bearer"} ${accessToken}`,
            }
          : {
              Accept: "application/json",
              "Content-Type": "application/json",
              Authorization: `${tokenType || "Bearer"} ${accessToken}`,
            },
        body: hasFiles
          ? (() => {
              const form = new FormData();
              if (typeof data.primary_image_index === "number") {
                form.set("primary_image_index", String(data.primary_image_index));
              }
              if (Array.isArray(data.image_urls)) {
                data.image_urls.forEach((imageUrl) => form.append("image_urls[]", imageUrl));
              }
              if (Array.isArray(data.image_thumbnail_urls)) {
                data.image_thumbnail_urls.forEach((thumbnailUrl) => form.append("image_thumbnail_urls[]", thumbnailUrl));
              }
              (data.images || []).forEach((file) => form.append("images[]", file));
              (data.thumbnail_images || []).forEach((file) => form.append("thumbnail_images[]", file));
              return form;
            })()
          : JSON.stringify(
              removeUndefined({
                primary_image_index:
                  typeof data.primary_image_index === "number" ? data.primary_image_index : undefined,
                image_urls: Array.isArray(data.image_urls) ? data.image_urls : undefined,
                image_thumbnail_urls: Array.isArray(data.image_thumbnail_urls) ? data.image_thumbnail_urls : undefined,
              }),
            ),
      });

      const contentType = response.headers.get("content-type") || "";
      const responseBody = contentType.includes("application/json")
        ? ((await response.json()) as UpdateProductImagesResponseBody)
        : null;

      if (responseBody) {
        if (response.status === 422 && responseBody.errors) throw responseBody;
        if (response.status === 401) throw responseBody;
        if (response.status === 403) throw responseBody;
        if (response.status === 404) throw responseBody;
        if (!response.ok) return responseBody;
        return responseBody;
      }

      if (response.status === 401) throw { message: "Unauthenticated." } as UpdateProductImagesResponseBody;
      if (response.status === 403) {
        throw { message: "Unauthorized: You can only modify your own products." } as UpdateProductImagesResponseBody;
      }
      if (response.status === 404) {
        throw { message: "Product not found." } as UpdateProductImagesResponseBody;
      }
      return { message: "Request failed" };
    },
    [accessToken, tokenType, user],
  );

  const getDormitoriesByUniversity = useCallback(async (): Promise<DormitoriesByUniversityResponseBody> => {
    if (!accessToken) {
      throw { message: "Unauthenticated." } as DormitoriesByUniversityResponseBody;
    }
    if (user?.role && user.role !== "user") {
      throw { message: "Unauthorized: Only users can access this endpoint." } as DormitoriesByUniversityResponseBody;
    }

    const response = await fetch(apiUrl("/api/user/meta/dormitories/by-university"), {
      method: "GET",
      headers: {
        Accept: "application/json",
        Authorization: `${tokenType || "Bearer"} ${accessToken}`,
      },
    });

    const contentType = response.headers.get("content-type") || "";
    const responseBody = contentType.includes("application/json")
      ? ((await response.json()) as DormitoriesByUniversityResponseBody)
      : null;

    if (responseBody) {
      if (response.status === 401) throw responseBody;
      if (response.status === 403) throw responseBody;
      if (response.status === 404) throw responseBody;
      if (!response.ok) return responseBody;
      return responseBody;
    }

    if (response.status === 401) throw { message: "Unauthenticated." } as DormitoriesByUniversityResponseBody;
    if (response.status === 403) {
      throw { message: "Unauthorized: Only users can access this endpoint." } as DormitoriesByUniversityResponseBody;
    }
    if (response.status === 404) {
      throw { message: "Dormitory not found for the user." } as DormitoriesByUniversityResponseBody;
    }
    return { message: "Request failed" };
  }, [accessToken, tokenType, user?.role]);

  const contextValue = useMemo(() => ({
    user,
    accessToken,
    tokenType,
    isAuthenticated: !!user,
    isAdmin: user?.role === 'admin',
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
    getRecommendedExchangeProducts,
    getNearby,
    getSimilarProducts,
    getProductDetail,
    createProduct,
    createExchangeProduct,
    createTag,
    sendMessage,
    transferMessage,
    createPaymentRequest,
    confirmPaymentRequest,
    createAiSession,
    sendAiSessionMessage,
    getAiHistory,
    deleteAiHistory,
    renameAiHistory,
    getAiSessionMessages,
    getMessageContacts,
    getMessages,
    getMessageNotifications,
    refreshBalance,
    getProductSearchSuggestions,
    searchProducts,
    searchVisualProducts,
    getProductForEdit,
    getProductEngagement,
    updateProduct,
    markProductSold,
    updateProductImages,
  }), [
    user,
    accessToken,
    tokenType,
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
    getRecommendedExchangeProducts,
    getNearby,
    getSimilarProducts,
    getProductDetail,
    createProduct,
    createExchangeProduct,
    createTag,
    sendMessage,
    transferMessage,
    createPaymentRequest,
    confirmPaymentRequest,
    createAiSession,
    sendAiSessionMessage,
    getAiHistory,
    deleteAiHistory,
    renameAiHistory,
    getAiSessionMessages,
    getMessageContacts,
    getMessages,
    getMessageNotifications,
    refreshBalance,
    getProductSearchSuggestions,
    searchProducts,
    searchVisualProducts,
    getProductForEdit,
    getProductEngagement,
    updateProduct,
    markProductSold,
    updateProductImages,
  ]);

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
