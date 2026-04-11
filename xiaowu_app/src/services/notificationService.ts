/**
 * Notification Service
 * Handles notification-related API calls
 */

import { apiClient, handleApiError } from './api';

/**
 * Get notification settings
 */
export const getNotificationSettings = async (): Promise<{
  email_notifications: boolean;
  push_notifications: boolean;
  message_notifications: boolean;
  product_notifications: boolean;
}> => {
  try {
    const response = await apiClient.get('/api/user/settings/notifications');
    return response.data;
  } catch (error) {
    throw handleApiError(error);
  }
};

/**
 * Update notification settings
 */
export const updateNotificationSettings = async (settings: {
  email_notifications?: boolean;
  push_notifications?: boolean;
  message_notifications?: boolean;
  product_notifications?: boolean;
}): Promise<void> => {
  try {
    await apiClient.patch('/api/user/settings/notifications', settings);
  } catch (error) {
    throw handleApiError(error);
  }
};

/**
 * Get all notifications
 */
export const getNotifications = async (params?: {
  page?: number;
  page_size?: number;
  type?: string;
}): Promise<{ notifications: any[]; total: number }> => {
  try {
    const response = await apiClient.get('/api/user/notifications', { params });
    return {
      notifications: response.data.notifications || [],
      total: response.data.total || 0,
    };
  } catch (error) {
    throw handleApiError(error);
  }
};

/**
 * Mark notification as read
 */
export const markNotificationRead = async (notificationId: number): Promise<void> => {
  try {
    await apiClient.patch(`/api/user/notifications/${notificationId}/read`);
  } catch (error) {
    throw handleApiError(error);
  }
};

/**
 * Mark all notifications as read
 */
export const markAllNotificationsRead = async (): Promise<void> => {
  try {
    await apiClient.patch('/api/user/notifications/read-all');
  } catch (error) {
    throw handleApiError(error);
  }
};
