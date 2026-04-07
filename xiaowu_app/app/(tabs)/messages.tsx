import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../src/contexts/ThemeContext';
import { spacing } from '../../src/theme/spacing';
import { Avatar } from '../../src/components/ui/Avatar';
import { NotificationBadge } from '../../src/components/ui/NotificationBadge';
import { getViewMessages, getMessageNotifications } from '../../src/services/messageService';
import type { MessageContact } from '../../src/types';

export default function MessagesScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState<'messages' | 'notifications'>('messages');
  const [conversations, setConversations] = useState<MessageContact[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadConversations = useCallback(async () => {
    try {
      setLoading(true);
      const response = await getViewMessages({ limit: 50 });
      setConversations(response.messages);
    } catch (error) {
      console.error('Error loading conversations:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadNotifications = useCallback(async () => {
    try {
      const response = await getMessageNotifications({ limit: 20 });
      setNotifications(response.messages || []);
      setUnreadCount(response.total || 0);
    } catch (error) {
      console.error('Error loading notifications:', error);
    }
  }, []);

  useEffect(() => {
    loadConversations();
    loadNotifications();
    const interval = setInterval(loadNotifications, 30000);
    return () => clearInterval(interval);
  }, [loadConversations, loadNotifications]);

  const onRefresh = async () => {
    setRefreshing(true);
    if (activeTab === 'messages') {
      await loadConversations();
    } else {
      await loadNotifications();
    }
    setRefreshing(false);
  };

  const handleConversationPress = (conversation: MessageContact) => {
    router.push({
      pathname: `/chat/${conversation.conversation_id}`,
      params: {
        receiverId: conversation.conversation_id,
        receiverName: conversation.sender_name,
      },
    });
  };

  const formatTime = (dateStr?: string): string => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / 3600000);
    
    if (hours < 24) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  const renderConversation = ({ item }: { item: MessageContact }) => (
    <TouchableOpacity
      style={[styles.conversationItem, { backgroundColor: colors.card }]}
      onPress={() => handleConversationPress(item)}
    >
      <Avatar
        source={item.sender_profile_picture ? { uri: item.sender_profile_picture } : undefined}
        name={item.sender_name}
        size="lg"
      />
      <View style={styles.conversationContent}>
        <View style={styles.conversationHeader}>
          <Text style={[styles.userName, { color: colors.text }]}>
            {item.sender_name || 'Unknown'}
          </Text>
          <Text style={[styles.time, { color: colors.textTertiary }]}>
            {formatTime(item.message_time)}
          </Text>
        </View>
        <Text
          style={[styles.lastMessage, { color: colors.textSecondary }]}
          numberOfLines={1}
        >
          {item.last_message || 'No messages'}
        </Text>
      </View>
    </TouchableOpacity>
  );

  const renderNotification = ({ item }: { item: any }) => {
    const handlePress = () => {
      if (item.conversation_id) {
        router.push(`/chat/${item.conversation_id}`);
      } else if (item.notification_type === 'wallet_transfer_received') {
        router.push('/wallet');
      }
    };

    return (
      <TouchableOpacity
        style={[styles.notificationItem, { backgroundColor: colors.card }]}
        onPress={handlePress}
      >
        <Avatar
          source={item.sender_profile_picture ? { uri: item.sender_profile_picture } : undefined}
          name={item.sender_username}
          size="md"
        />
        <View style={styles.notificationContent}>
          <Text style={[styles.notificationText, { color: colors.text }]}>
            {item.notification_text}
          </Text>
          {item.notification_count > 1 && (
            <View style={styles.countBadge}>
              <Text style={styles.countText}>{item.notification_count}</Text>
            </View>
          )}
          <Text style={[styles.notificationTime, { color: colors.textTertiary }]}>
            {formatTime(item.created_at)}
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color={colors.textTertiary} />
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.header, { paddingTop: insets.top }]}>
          <Text style={[styles.title, { color: colors.text }]}>Messages</Text>
        </View>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: insets.top }]}>
        <Text style={[styles.title, { color: colors.text }]}>Messages</Text>
        <View style={styles.tabs}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'messages' && styles.activeTab]}
            onPress={() => setActiveTab('messages')}
          >
            <Text style={[styles.tabText, { color: activeTab === 'messages' ? colors.primary : colors.textSecondary }]}>
              Chats
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'notifications' && styles.activeTab]}
            onPress={() => setActiveTab('notifications')}
          >
            <Text style={[styles.tabText, { color: activeTab === 'notifications' ? colors.primary : colors.textSecondary }]}>
              Notifications
            </Text>
            {unreadCount > 0 && (
              <View style={styles.tabBadge}>
                <NotificationBadge count={unreadCount} size="sm" />
              </View>
            )}
          </TouchableOpacity>
        </View>
      </View>

      {activeTab === 'messages' ? (
        <FlatList
          data={conversations}
          renderItem={renderConversation}
          keyExtractor={(item, index) => `${item.conversation_id || index}`}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyIcon}>💬</Text>
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                No messages yet
              </Text>
            </View>
          }
        />
      ) : (
        <FlatList
          data={notifications}
          renderItem={renderNotification}
          keyExtractor={(item, index) => `${item.id || index}`}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyIcon}>🔔</Text>
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                No notifications
              </Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: spacing.screenPadding,
    paddingBottom: spacing.md,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
  },
  tabs: {
    flexDirection: 'row',
    marginTop: spacing.md,
    gap: spacing.md,
  },
  tab: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
  },
  activeTab: {
    backgroundColor: 'rgba(0, 102, 255, 0.1)',
  },
  tabText: {
    fontSize: 15,
    fontWeight: '600',
  },
  tabBadge: {
    marginLeft: spacing.xs,
  },
  list: {
    paddingVertical: spacing.sm,
  },
  conversationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    marginHorizontal: spacing.screenPadding,
    marginBottom: spacing.sm,
    borderRadius: spacing.md,
  },
  conversationContent: {
    flex: 1,
    marginLeft: spacing.md,
  },
  conversationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
  },
  time: {
    fontSize: 12,
  },
  lastMessage: {
    fontSize: 14,
    marginTop: 4,
  },
  notificationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    marginHorizontal: spacing.screenPadding,
    marginBottom: spacing.sm,
    borderRadius: spacing.md,
  },
  notificationContent: {
    flex: 1,
    marginLeft: spacing.md,
    marginRight: spacing.sm,
  },
  notificationText: {
    fontSize: 14,
    lineHeight: 20,
  },
  notificationTime: {
    fontSize: 12,
    marginTop: 4,
  },
  countBadge: {
    backgroundColor: '#FF3B30',
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    alignSelf: 'flex-start',
    marginTop: 4,
  },
  countText: {
    color: '#FFF',
    fontSize: 11,
    fontWeight: '700',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  empty: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing['4xl'],
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: spacing.md,
  },
  emptyText: {
    fontSize: 16,
  },
});
