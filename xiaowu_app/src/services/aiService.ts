/**
 * AI Service
 * Handles AI assistant-related API calls
 */

import { apiClient, handleApiError } from './api';
import type { AiSession, AiMessage } from '../types';

/**
 * Create AI session
 */
export const createAiSession = async (data?: { title?: string | null }): Promise<AiSession> => {
  try {
    const response = await apiClient.post('/api/ai/sessions', data || {});
    return response.data;
  } catch (error) {
    throw handleApiError(error);
  }
};

/**
 * Send message to AI session
 */
export const sendAiSessionMessage = async (data: {
  session_id: string;
  message: string;
  message_type?: 'text' | 'voice';
  audio_duration_seconds?: number;
}): Promise<AiMessage> => {
  try {
    const response = await apiClient.post(`/api/ai/sessions/${data.session_id}/messages`, {
      message: data.message,
      message_type: data.message_type || 'text',
      audio_duration_seconds: data.audio_duration_seconds,
    });
    return response.data;
  } catch (error) {
    throw handleApiError(error);
  }
};

/**
 * Get AI session history
 */
export const getAiHistory = async (params?: {
  page?: number;
  page_size?: number;
  include_messages?: boolean;
}): Promise<{ sessions: AiSession[]; total: number }> => {
  try {
    const response = await apiClient.get('/api/ai/history', { params });
    return {
      sessions: response.data.history || [],
      total: response.data.total || 0,
    };
  } catch (error) {
    throw handleApiError(error);
  }
};

/**
 * Get AI session messages
 */
export const getAiSessionMessages = async (sessionId: string): Promise<AiMessage[]> => {
  try {
    const response = await apiClient.get(`/api/ai/sessions/${sessionId}/messages`);
    return response.data.messages || [];
  } catch (error) {
    throw handleApiError(error);
  }
};

/**
 * Delete AI session
 */
export const deleteAiSession = async (sessionId: string): Promise<void> => {
  try {
    await apiClient.delete(`/api/ai/sessions/${sessionId}`);
  } catch (error) {
    throw handleApiError(error);
  }
};

/**
 * Rename AI session
 */
export const renameAiSession = async (data: {
  session_id: string;
  title: string;
}): Promise<AiSession> => {
  try {
    const response = await apiClient.put(`/api/ai/sessions/${data.session_id}`, {
      title: data.title,
    });
    return response.data;
  } catch (error) {
    throw handleApiError(error);
  }
};

/**
 * Upload voice message for AI
 */
export const uploadAiVoiceMessage = async (audioUri: string): Promise<{
  transcript: string;
  duration_seconds: number;
}> => {
  try {
    const formData = new FormData();
    const filename = audioUri.split('/').pop() || 'voice.m4a';

    formData.append('audio', {
      uri: audioUri,
      name: filename,
      type: 'audio/m4a',
    } as unknown as Blob);

    const response = await apiClient.post<{ 
      transcript: string; 
      duration_seconds: number;
    }>(
      '/api/ai/transcribe',
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );

    return response.data;
  } catch (error) {
    throw handleApiError(error);
  }
};

