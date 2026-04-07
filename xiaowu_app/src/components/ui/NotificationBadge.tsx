import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface NotificationBadgeProps {
  count: number;
  size?: 'sm' | 'md';
}

export const NotificationBadge: React.FC<NotificationBadgeProps> = ({ count, size = 'md' }) => {
  if (count <= 0) return null;

  const displayCount = count > 99 ? '99+' : count.toString();
  const badgeSize = size === 'sm' ? 16 : 20;
  const fontSize = size === 'sm' ? 10 : 12;

  return (
    <View style={[styles.badge, { width: badgeSize, height: badgeSize, minWidth: badgeSize }]}>
      <Text style={[styles.badgeText, { fontSize }]}>{displayCount}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    backgroundColor: '#FF3B30',
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    color: '#FFF',
    fontWeight: '700',
  },
});
