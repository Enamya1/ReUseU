/**
 * Header Component
 * App header with navigation and actions
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ViewStyle,
  TextStyle,
  StatusBar,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../contexts/ThemeContext';
import { spacing } from '../../theme/spacing';

interface HeaderProps {
  title?: string;
  subtitle?: string;
  leftAction?: React.ReactNode;
  rightAction?: React.ReactNode;
  transparent?: boolean;
  style?: ViewStyle;
  titleStyle?: TextStyle;
}

export const Header: React.FC<HeaderProps> = ({
  title,
  subtitle,
  leftAction,
  rightAction,
  transparent = false,
  style,
  titleStyle,
}) => {
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: transparent ? 'transparent' : colors.background,
          paddingTop: insets.top,
        },
        style,
      ]}
    >
      <StatusBar
        barStyle={isDark ? 'light-content' : 'dark-content'}
        backgroundColor={transparent ? 'transparent' : colors.background}
      />
      
      <View style={styles.content}>
        {/* Left Action */}
        <View style={styles.leftAction}>
          {leftAction || (
            <TouchableOpacity style={styles.backButton}>
              <Text style={{ fontSize: 18 }}>←</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Title */}
        <View style={styles.titleContainer}>
          {title && (
            <Text
              style={[
                styles.title,
                { color: colors.text },
                titleStyle,
              ]}
              numberOfLines={1}
            >
              {title}
            </Text>
          )}
          {subtitle && (
            <Text
              style={[styles.subtitle, { color: colors.textSecondary }]}
              numberOfLines={1}
            >
              {subtitle}
            </Text>
          )}
        </View>

        {/* Right Action */}
        <View style={styles.rightAction}>
          {rightAction}
        </View>
      </View>
    </View>
  );
};

interface SearchHeaderProps {
  value: string;
  onChangeText: (text: string) => void;
  onSearch?: () => void;
  placeholder?: string;
  leftAction?: React.ReactNode;
  rightAction?: React.ReactNode;
  style?: ViewStyle;
}

export const SearchHeader: React.FC<SearchHeaderProps> = ({
  value,
  onChangeText,
  onSearch,
  placeholder = 'Search...',
  leftAction,
  rightAction,
  style,
}) => {
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.background,
          paddingTop: insets.top,
        },
        style,
      ]}
    >
      <StatusBar
        barStyle={isDark ? 'light-content' : 'dark-content'}
        backgroundColor={colors.background}
      />
      
      <View style={styles.searchContent}>
        {leftAction && <View style={styles.leftAction}>{leftAction}</View>}
        
        <View
          style={[
            styles.searchInput,
            { backgroundColor: colors.surfaceSecondary },
          ]}
        >
          <Text style={styles.searchIcon}>🔍</Text>
          <Text
            style={[
              styles.searchText,
              { color: value ? colors.text : colors.textTertiary },
            ]}
          >
            {value || placeholder}
          </Text>
        </View>

        {rightAction && <View style={styles.rightAction}>{rightAction}</View>}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    zIndex: 100,
  },
  content: {
    height: spacing.headerHeight,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.screenPadding,
  },
  leftAction: {
    width: 44,
    alignItems: 'flex-start',
  },
  backButton: {
    padding: spacing.xs,
  },
  titleContainer: {
    flex: 1,
    alignItems: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
  },
  subtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  rightAction: {
    width: 44,
    alignItems: 'flex-end',
  },
  searchContent: {
    height: spacing.headerHeight,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.screenPadding,
  },
  searchInput: {
    flex: 1,
    height: 40,
    borderRadius: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
  },
  searchIcon: {
    fontSize: 16,
    marginRight: spacing.sm,
  },
  searchText: {
    fontSize: 16,
  },
});

export default Header;
