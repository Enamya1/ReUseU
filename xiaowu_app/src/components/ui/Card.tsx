/**
 * Card Component
 * Card container matching web platform's minimalist design
 */

import React from 'react';
import {
  View,
  StyleSheet,
  ViewStyle,
  TouchableOpacity,
  TouchableOpacityProps,
} from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { spacing } from '../../theme/spacing';
import { shadows } from '../../theme/shadows';

interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  variant?: 'default' | 'elevated' | 'outlined';
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

export const Card: React.FC<CardProps> = ({
  children,
  style,
  variant = 'default',
  padding = 'md',
}) => {
  const { colors, isDark } = useTheme();
  const themeShadows = isDark ? shadows.dark : shadows.light;

  const getPadding = (): number => {
    switch (padding) {
      case 'none':
        return 0;
      case 'sm':
        return spacing.md;
      case 'lg':
        return spacing['2xl'];
      default:
        return spacing.lg;
    }
  };

  const getStyle = (): ViewStyle => {
    const base: ViewStyle = {
      backgroundColor: colors.card,
      borderRadius: spacing.md,
      padding: getPadding(),
    };

    switch (variant) {
      case 'elevated':
        return {
          ...base,
          ...themeShadows.md,
        };
      case 'outlined':
        return {
          ...base,
          borderWidth: 1,
          borderColor: colors.border,
        };
      default:
        return {
          ...base,
          ...themeShadows.sm,
        };
    }
  };

  return <View style={[getStyle(), style]}>{children}</View>;
};

interface PressableCardProps extends TouchableOpacityProps {
  children: React.ReactNode;
  style?: ViewStyle;
  variant?: 'default' | 'elevated' | 'outlined';
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

export const PressableCard: React.FC<PressableCardProps> = ({
  children,
  style,
  variant = 'default',
  padding = 'md',
  ...props
}) => {
  const { colors, isDark } = useTheme();
  const themeShadows = isDark ? shadows.dark : shadows.light;

  const getPadding = (): number => {
    switch (padding) {
      case 'none':
        return 0;
      case 'sm':
        return spacing.md;
      case 'lg':
        return spacing['2xl'];
      default:
        return spacing.lg;
    }
  };

  const getStyle = (): ViewStyle => {
    const base: ViewStyle = {
      backgroundColor: colors.card,
      borderRadius: spacing.md,
      padding: getPadding(),
    };

    switch (variant) {
      case 'elevated':
        return {
          ...base,
          ...themeShadows.md,
        };
      case 'outlined':
        return {
          ...base,
          borderWidth: 1,
          borderColor: colors.border,
        };
      default:
        return {
          ...base,
          ...themeShadows.sm,
        };
    }
  };

  return (
    <TouchableOpacity style={[getStyle(), style]} activeOpacity={0.7} {...props}>
      {children}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({});

export default Card;
