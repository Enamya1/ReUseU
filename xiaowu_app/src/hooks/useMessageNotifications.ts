import { useState, useEffect, useCallback } from 'react';
import { getMessageNotifications } from '../services/messageService';

export const useMessageNotifications = (pollingInterval: number = 30000) => {
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchNotifications = useCallback(async () => {
    try {
      setLoading(true);
      const response = await getMessageNotifications({ limit: 20 });
      setNotifications(response.messages || []);
      setUnreadCount(response.total || 0);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, pollingInterval);
    return () => clearInterval(interval);
  }, [fetchNotifications, pollingInterval]);

  return {
    unreadCount,
    notifications,
    loading,
    refresh: fetchNotifications,
  };
};
