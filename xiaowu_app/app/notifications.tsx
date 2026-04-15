/**
 * Notifications Screen
 * Display and manage user notifications
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useTheme } from '../src/contexts/ThemeContext';
import { spacing } from '../src/theme/spacing';
import { getMessageNotifications } from '../src/services/messageService';
import { Avatar } from '../src/components/ui/Avatar';
import { Divider } from '../src/components/ui/Divider';

interface Notification {
  id: string;
  conversation_id?: number;
  sender_id: number;
  sender_username: string;
  sender_profile_picture?: string;
  notification_type: string;
  notification_text: string;
  notification_count: number;
  created_at: string;
  data?: any;
}

export default function NotificationsScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = async () => {
    try {
      setLoading(true);
      const response = await getMessageNotifications({ limit: 50 });
      setNotifications(response.messages || []);
    } catch (error) {
      console.error('Error loading notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadNotifications();
    setRefreshing(false);
  }, []);

  const handleNotificationPress = (notification: Notification) => {
    if (notification.conversation_id) {
      router.push(`/chat/${notification.conversation_id}`);
    }
  };

  const formatTime = (dateStr: string): string => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const getNotificationIcon = (type: string): string => {
    switch (type) {
      case 'wallet_transfer_received':
        return '💰';
      case 'message':
        return '💬';
      case 'payment_request':
        return '💳';
      default:
        return '🔔';
    }
  };

  const renderNotification = ({ item }: { item: Notification }) => (
    <TouchableOpacity
      style={styles.notificationItem}
      onPress={() => handleNotificationPress(item)}
    >
      <View style={styles.notificationContent}>
        <Avatar
          source={item.sender_profile_picture ? { uri: item.sender_profile_picture } : undefined}
          name={item.sender_username}
          size="md"
        />
        <View style={styles.notificationText}>
          <View style={styles.notificationHeader}>
            <Text style={[styles.notificationTitle, { color: colors.text }]}>
              {getNotificationIcon(item.notification_type)} {item.sender_username}
            </Text>
            {item.notification_count > 1 && (
              <View style={[styles.badge, { backgroundColor: colors.primary }]}>
                <Text style={styles.badgeText}>{item.notification_count}</Text>
              </View>
            )}
          </View>
          <Text style={[styles.notificationMessage, { color: colors.textSecondary }]} numberOfLines={2}>
            {item.notification_text}
          </Text>
          <Text style={[styles.notificationTime, { color: colors.textTertiary }]}>
            {formatTime(item.created_at)}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top }]}>
        <Text style={[styles.title, { color: colors.text }]}>
          Notifications
        </Text>
        {notifications.length > 0 && (
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            {notifications.length} unread
          </Text>
        )}
      </View>

      {/* Notifications List */}
      <FlatList
        data={notifications}
        renderItem={renderNotification}
        keyExtractor={(item) => item.id}
        ItemSeparatorComponent={() => <Divider />}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={colors.primary}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>🔔</Text>
            <Text style={[styles.emptyTitle, { color: colors.text }]}>
              No notifications
            </Text>
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              You're all caught up!
            </Text>
          </View>
        }
        contentContainerStyle={{ paddingBottom: insets.bottom + spacing.lg }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    paddingHorizontal: spacing.screenPadding,
    paddingBottom: spacing.md,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
  },
  subtitle: {
    fontSize: 14,
    marginTop: spacing.xs,
  },
  notificationItem: {
    padding: spacing.md,
    paddingHorizontal: spacing.screenPadding,
  },
  notificationContent: {
    flexDirection: 'row',
  },
  notificationText: {
    flex: 1,
    marginLeft: spacing.md,
  },
  notificationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
  },
  badge: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xs,
  },
  badgeText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '600',
  },
  notificationMessage: {
    fontSize: 14,
    marginBottom: spacing.xs,
  },
  notificationTime: {
    fontSize: 12,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing['2xl'],
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: spacing.md,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  emptyText: {
    fontSize: 14,
  },
});
