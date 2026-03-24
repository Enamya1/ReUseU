/**
 * TabBar Component
 * Custom bottom tab bar
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ViewStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../contexts/ThemeContext';
import { spacing } from '../../theme/spacing';
import { shadows } from '../../theme/shadows';

interface TabItem {
  key: string;
  label: string;
  icon: string;
  activeIcon?: string;
}

interface TabBarProps {
  tabs: TabItem[];
  activeKey: string;
  onTabPress: (key: string) => void;
  style?: ViewStyle;
}

export const TabBar: React.FC<TabBarProps> = ({
  tabs,
  activeKey,
  onTabPress,
  style,
}) => {
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const themeShadows = isDark ? shadows.dark : shadows.light;

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.background,
          paddingBottom: insets.bottom,
          height: spacing.tabBarHeight + insets.bottom,
        },
        themeShadows.sm,
        style,
      ]}
    >
      {tabs.map((tab) => {
        const isActive = tab.key === activeKey;
        return (
          <TouchableOpacity
            key={tab.key}
            style={styles.tab}
            onPress={() => onTabPress(tab.key)}
          >
            <Text style={styles.icon}>
              {isActive ? (tab.activeIcon || tab.icon) : tab.icon}
            </Text>
            <Text
              style={[
                styles.label,
                {
                  color: isActive ? colors.primary : colors.textSecondary,
                  fontWeight: isActive ? '600' : '400',
                },
              ]}
            >
              {tab.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

// Default tabs configuration
export const defaultTabs: TabItem[] = [
  { key: 'index', label: 'Home', icon: '🏠', activeIcon: '🏠' },
  { key: 'nearby', label: 'Nearby', icon: '📍', activeIcon: '📍' },
  { key: 'create', label: 'Sell', icon: '➕', activeIcon: '➕' },
  { key: 'messages', label: 'Messages', icon: '💬', activeIcon: '💬' },
  { key: 'profile', label: 'Profile', icon: '👤', activeIcon: '👤' },
];

interface FloatingTabBarProps {
  tabs: TabItem[];
  activeKey: string;
  onTabPress: (key: string) => void;
  style?: ViewStyle;
}

export const FloatingTabBar: React.FC<FloatingTabBarProps> = ({
  tabs,
  activeKey,
  onTabPress,
  style,
}) => {
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const themeShadows = isDark ? shadows.dark : shadows.light;

  return (
    <View
      style={[
        styles.floatingContainer,
        {
          backgroundColor: colors.card,
          bottom: insets.bottom + spacing.sm,
        },
        themeShadows.lg,
        style,
      ]}
    >
      {tabs.map((tab) => {
        const isActive = tab.key === activeKey;
        return (
          <TouchableOpacity
            key={tab.key}
            style={[
              styles.floatingTab,
              isActive && {
                backgroundColor: colors.surfaceSecondary,
              },
            ]}
            onPress={() => onTabPress(tab.key)}
          >
            <Text style={styles.icon}>
              {isActive ? (tab.activeIcon || tab.icon) : tab.icon}
            </Text>
            <Text
              style={[
                styles.label,
                {
                  color: isActive ? colors.primary : colors.textSecondary,
                  fontWeight: isActive ? '600' : '400',
                },
              ]}
            >
              {tab.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    borderTopWidth: 0,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm,
  },
  icon: {
    fontSize: 24,
    marginBottom: 2,
  },
  label: {
    fontSize: 11,
  },
  floatingContainer: {
    position: 'absolute',
    left: spacing.screenPadding,
    right: spacing.screenPadding,
    flexDirection: 'row',
    borderRadius: spacing.lg,
    paddingVertical: spacing.sm,
  },
  floatingTab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm,
    borderRadius: spacing.md,
  },
});

export default TabBar;
