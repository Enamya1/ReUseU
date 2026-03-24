/**
 * Messages Screen
 * Conversations list
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useTheme } from '../../src/contexts/ThemeContext';
import { spacing } from '../../src/theme/spacing';
import { Conversation } from '../../src/types';
import { Avatar } from '../../src/components/ui/Avatar';

// Mock data
const mockConversations: Conversation[] = [
  {
    id: 1,
    other_user_id: 2,
    other_user_name: 'John Doe',
    other_user_avatar: undefined,
    last_message: 'Is this still available?',
    last_message_time: new Date().toISOString(),
    unread_count: 2,
    product_id: 1,
    product_title: 'Calculus Textbook',
  },
  {
    id: 2,
    other_user_id: 3,
    other_user_name: 'Jane Smith',
    other_user_avatar: undefined,
    last_message: 'Thanks for the quick response!',
    last_message_time: new Date(Date.now() - 3600000).toISOString(),
    unread_count: 0,
    product_id: 2,
    product_title: 'Desk Lamp',
  },
];

export default function MessagesScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [conversations] = useState<Conversation[]>(mockConversations);

  const handleConversationPress = (conversation: Conversation) => {
    router.push({
      pathname: '/messages',
      params: {
        conversationId: conversation.id,
        receiverId: conversation.other_user_id,
        receiverName: conversation.other_user_name,
      },
    });
  };

  const formatTime = (dateStr: string): string => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / 3600000);
    
    if (hours < 24) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  const renderConversation = ({ item }: { item: Conversation }) => (
    <TouchableOpacity
      style={[styles.conversationItem, { backgroundColor: colors.card }]}
      onPress={() => handleConversationPress(item)}
    >
      <Avatar
        source={item.other_user_avatar ? { uri: item.other_user_avatar } : undefined}
        name={item.other_user_name}
        size="lg"
      />
      <View style={styles.conversationContent}>
        <View style={styles.conversationHeader}>
          <Text style={[styles.userName, { color: colors.text }]}>
            {item.other_user_name}
          </Text>
          <Text style={[styles.time, { color: colors.textTertiary }]}>
            {formatTime(item.last_message_time || '')}
          </Text>
        </View>
        {item.product_title && (
          <Text style={[styles.productTitle, { color: colors.textSecondary }]}>
            {item.product_title}
          </Text>
        )}
        <Text
          style={[styles.lastMessage, { color: colors.textSecondary }]}
          numberOfLines={1}
        >
          {item.last_message}
        </Text>
      </View>
      {item.unread_count && item.unread_count > 0 && (
        <View style={[styles.badge, { backgroundColor: colors.primary }]}>
          <Text style={styles.badgeText}>{item.unread_count}</Text>
        </View>
      )}
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top }]}>
        <Text style={[styles.title, { color: colors.text }]}>
          Messages
        </Text>
      </View>

      {/* Conversations List */}
      <FlatList
        data={conversations}
        renderItem={renderConversation}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>💬</Text>
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              No messages yet
            </Text>
          </View>
        }
      />
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
  productTitle: {
    fontSize: 12,
    marginTop: 2,
  },
  lastMessage: {
    fontSize: 14,
    marginTop: 4,
  },
  badge: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  badgeText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '600',
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
