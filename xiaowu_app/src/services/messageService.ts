/**
 * Message Service
 * Handles all messaging-related API calls
 */

import { apiClient, handleApiError } from './api';
import type { Message, Conversation, MessageContact } from '../types';

/**
 * Get message contacts/conversations
 */
export const getMessageContacts = async (params?: {
  limit?: number;
}): Promise<{ messages: MessageContact[]; total: number }> => {
  try {
    const response = await apiClient.get('/api/user/messages/contacts', { params });
    return {
      messages: response.data.messages || [],
      total: response.data.total || 0,
    };
  } catch (error) {
    throw handleApiError(error);
  }
};

/**
 * Get messages for a conversation
 */
export const getMessages = async (params: {
  conversation_id: number;
  limit?: number;
  before_id?: number;
}): Promise<{ messages: Message[]; has_more: boolean }> => {
  try {
    const response = await apiClient.get('/api/user/messages', { params });
    return {
      messages: response.data.messages || [],
      has_more: response.data.has_more || false,
    };
  } catch (error) {
    throw handleApiError(error);
  }
};

/**
 * Send a message
 */
export const sendMessage = async (data: {
  receiver_id: number;
  product_id?: number;
  content?: string;
  image_url?: string;
  message_type?: 'text' | 'image';
}): Promise<Message> => {
  try {
    const response = await apiClient.post('/api/user/messages', data);
    return response.data;
  } catch (error) {
    throw handleApiError(error);
  }
};

/**
 * Upload message image
 */
export const uploadMessageImage = async (imageUri: string): Promise<string> => {
  try {
    const formData = new FormData();
    const filename = imageUri.split('/').pop() || 'message.jpg';
    const match = /\.(\w+)$/.exec(filename);
    const type = match ? `image/${match[1]}` : 'image/jpeg';

    formData.append('file', {
      uri: imageUri,
      name: filename,
      type,
    } as unknown as Blob);

    const response = await apiClient.post<{ url: string }>(
      '/api/user/messages/upload-image',
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );

    return response.data.url;
  } catch (error) {
    throw handleApiError(error);
  }
};

/**
 * Mark messages as read
 */
export const markMessagesAsRead = async (conversationId: number): Promise<void> => {
  try {
    await apiClient.post('/api/user/messages/mark-read', { conversation_id: conversationId });
  } catch (error) {
    throw handleApiError(error);
  }
};

/**
 * Get unread message count
 */
export const getUnreadCount = async (): Promise<{ count: number }> => {
  try {
    const response = await apiClient.get('/api/user/messages/unread-count');
    return { count: response.data.count || 0 };
  } catch (error) {
    throw handleApiError(error);
  }
};
