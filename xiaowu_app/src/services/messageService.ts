/**
 * Message Service
 * Handles all messaging-related API calls
 */

import { apiClient, handleApiError } from './api';
import type { Message, MessageContact } from '../types';

/**
 * 18a) POST /api/user/messages - Send a message
 */
export const sendMessage = async (data: {
  receiver_id: number;
  message_text: string;
  product_id?: number;
}): Promise<{ message: string; conversation_id: number; message_data: Message }> => {
  try {
    const response = await apiClient.post('/api/user/messages', data);
    return response.data;
  } catch (error) {
    throw handleApiError(error);
  }
};

/**
 * 18b) GET /api/user/messages - Get messages for a conversation
 */
export const getMessages = async (params: {
  conversation_id: number;
  limit?: number;
  before_id?: number;
}): Promise<{ 
  message: string;
  conversation: {
    id: number;
    current_user_wallet_id?: number | null;
    other_user: {
      id: number;
      username: string;
      wallet_id?: number | null;
    };
  };
  messages: Message[];
}> => {
  try {
    const response = await apiClient.get('/api/user/messages', { params });
    return response.data;
  } catch (error) {
    throw handleApiError(error);
  }
};

/**
 * 18c) GET /api/user/messages/notification - Get message notifications
 */
export const getMessageNotifications = async (params?: {
  limit?: number;
}): Promise<{ message: string; total: number; messages: any[] }> => {
  try {
    const response = await apiClient.get('/api/user/messages/notification', { params });
    return response.data;
  } catch (error) {
    throw handleApiError(error);
  }
};

/**
 * 18d) GET /api/user/messages/contacts - Get message contacts
 */
export const getMessageContacts = async (params?: {
  limit?: number;
}): Promise<{ message: string; total: number; contacts: any[] }> => {
  try {
    const response = await apiClient.get('/api/user/messages/contacts', { params });
    return response.data;
  } catch (error) {
    throw handleApiError(error);
  }
};

/**
 * 18e) GET /api/user/messages/view_message - Get latest message per conversation
 */
export const getViewMessages = async (params?: {
  limit?: number;
}): Promise<{ message: string; total: number; messages: MessageContact[] }> => {
  try {
    const response = await apiClient.get('/api/user/messages/view_message', { params });
    return response.data;
  } catch (error) {
    throw handleApiError(error);
  }
};

/**
 * 18f) POST /api/user/messages/transfer - Transfer money in conversation
 */
export const transferMoney = async (data: {
  conversation_id: number;
  amount: number;
  currency: string;
  reference?: string;
}): Promise<{ 
  message: string;
  transfer: {
    amount: number;
    currency: string;
    from_wallet_id: number;
    to_wallet_id: number;
    atomic_transaction_id: number;
    reference?: string;
  };
}> => {
  try {
    const response = await apiClient.post('/api/user/messages/transfer', data);
    return response.data;
  } catch (error) {
    throw handleApiError(error);
  }
};

/**
 * 18g) POST /api/user/payment-requests - Create payment request
 */
export const createPaymentRequest = async (data: {
  conversation_id: number;
  amount: number;
  currency: string;
  product_id?: number;
  message?: string;
  expires_in_hours?: number;
}): Promise<{ 
  message: string;
  payment_request: {
    id: number;
    conversation_id: number;
    sender_id: number;
    sender_username: string;
    receiver_id: number;
    product_id?: number;
    product_title?: string;
    amount: number;
    currency: string;
    status: string;
    message?: string;
    expires_at: string;
    created_at: string;
  };
}> => {
  try {
    const response = await apiClient.post('/api/user/payment-requests', data);
    return response.data;
  } catch (error) {
    throw handleApiError(error);
  }
};

/**
 * 18h) POST /api/user/payment-requests/{request_id}/confirm - Confirm payment request
 */
export const confirmPaymentRequest = async (requestId: number): Promise<{ 
  message: string;
  payment: {
    payment_request_id: number;
    amount: number;
    currency: string;
    from_wallet_id: number;
    to_wallet_id: number;
    atomic_transaction_id: number;
    status: string;
  };
}> => {
  try {
    const response = await apiClient.post(`/api/user/payment-requests/${requestId}/confirm`);
    return response.data;
  } catch (error) {
    throw handleApiError(error);
  }
};