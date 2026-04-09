/**
 * Tabs Layout
 * Bottom tab navigation for main app sections
 */

import React from 'react';
import { Text, Platform, Dimensions } from 'react-native';
import { Tabs } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../src/contexts/ThemeContext';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const IS_SMALL_DEVICE = SCREEN_WIDTH < 375;

export default function TabLayout() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarStyle: {
          backgroundColor: colors.background,
          borderTopColor: colors.border,
          borderTopWidth: 0.5,
          height: 60 + insets.bottom,
          paddingBottom: insets.bottom,
          paddingTop: 8,
          elevation: 8,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.1,
          shadowRadius: 4,
        },
        tabBarLabelStyle: {
          fontSize: IS_SMALL_DEVICE ? 10 : 11,
          fontWeight: '500',
          marginTop: 4,
        },
        tabBarItemStyle: {
          paddingVertical: 4,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color }) => (
            <Text style={{ fontSize: IS_SMALL_DEVICE ? 20 : 24, color }}>🏠</Text>
          ),
        }}
      />
      <Tabs.Screen
        name="nearby"
        options={{
          title: 'Nearby',
          tabBarIcon: ({ color }) => (
            <Text style={{ fontSize: IS_SMALL_DEVICE ? 20 : 24, color }}>📍</Text>
          ),
        }}
      />
      <Tabs.Screen
        name="create"
        options={{
          title: 'Sell',
          tabBarIcon: ({ color }) => (
            <Text style={{ fontSize: IS_SMALL_DEVICE ? 20 : 24, color }}>➕</Text>
          ),
        }}
      />
      <Tabs.Screen
        name="messages"
        options={{
          title: 'Messages',
          tabBarIcon: ({ color }) => (
            <Text style={{ fontSize: IS_SMALL_DEVICE ? 20 : 24, color }}>💬</Text>
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color }) => (
            <Text style={{ fontSize: IS_SMALL_DEVICE ? 20 : 24, color }}>👤</Text>
          ),
        }}
      />
      <Tabs.Screen
        name="ai"
        options={{
          title: 'AI',
          tabBarIcon: ({ color }) => (
            <Text style={{ fontSize: IS_SMALL_DEVICE ? 20 : 24, color }}>✨</Text>
          ),
        }}
      />
    </Tabs>
  );
}
