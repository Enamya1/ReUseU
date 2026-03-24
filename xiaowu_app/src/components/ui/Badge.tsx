/**
 * Badge Component
 * Badge/Chip component matching web platform's minimalist design
 */

import React from 'react';
import { View, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { spacing } from '../../theme/spacing';

type BadgeVariant = 'default' | 'primary' | 'secondary' | 'success' | 'warning' | 'destructive' | 'outline';
type BadgeSize = 'sm' | 'md' | 'lg';

interface BadgeProps {
  label: string;
  variant?: BadgeVariant;
  size?: BadgeSize;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export const Badge: React.FC<BadgeProps> = ({
  label,
  variant = 'default',
  size = 'md',
  style,
  textStyle,
}) => {
  const { colors } = useTheme();

  const getBackgroundColor = (): string => {
    switch (variant) {
      case 'primary':
        return colors.primary;
      case 'secondary':
        return colors.secondary;
      case 'success':
        return colors.success;
      case 'warning':
        return colors.warning;
      case 'destructive':
        return colors.destructive;
      case 'outline':
        return 'transparent';
      default:
        return colors.muted;
    }
  };

  const getTextColor = (): string => {
    switch (variant) {
      case 'primary':
        return colors.primaryForeground;
      case 'secondary':
        return colors.secondaryForeground;
      case 'success':
        return colors.successForeground;
      case 'warning':
        return colors.warningForeground;
      case 'destructive':
        return colors.destructiveForeground;
      case 'outline':
        return colors.text;
      default:
        return colors.mutedForeground;
    }
  };

  const getPadding = (): { paddingVertical: number; paddingHorizontal: number } => {
    switch (size) {
      case 'sm':
        return { paddingVertical: 2, paddingHorizontal: spacing.xs };
      case 'lg':
        return { paddingVertical: spacing.xs, paddingHorizontal: spacing.md };
      default:
        return { paddingVertical: 2, paddingHorizontal: spacing.sm };
    }
  };

  const getFontSize = (): number => {
    switch (size) {
      case 'sm':
        return 10;
      case 'lg':
        return 14;
      default:
        return 12;
    }
  };

  const padding = getPadding();
  const backgroundColor = getBackgroundColor();
  const textColor = getTextColor();
  const fontSize = getFontSize();

  return (
    <View
      style={[
        styles.badge,
        {
          backgroundColor,
          borderColor: variant === 'outline' ? colors.border : 'transparent',
          borderWidth: variant === 'outline' ? 1 : 0,
          paddingVertical: padding.paddingVertical,
          paddingHorizontal: padding.paddingHorizontal,
        },
        style,
      ]}
    >
      <Text
        style={[
          styles.text,
          {
            color: textColor,
            fontSize,
          },
          textStyle,
        ]}
      >
        {label}
      </Text>
    </View>
  );
};

interface ChipProps {
  label: string;
  selected?: boolean;
  onPress?: () => void;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  style?: ViewStyle;
}

export const Chip: React.FC<ChipProps> = ({
  label,
  selected = false,
  onPress,
  leftIcon,
  rightIcon,
  style,
}) => {
  const { colors } = useTheme();

  return (
    <View
      style={[
        styles.chip,
        {
          backgroundColor: selected ? colors.primary : colors.card,
          borderColor: selected ? colors.primary : colors.border,
          borderWidth: selected ? 2 : 1,
          shadowColor: selected ? colors.primary : 'transparent',
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: selected ? 0.3 : 0,
          shadowRadius: 2,
          elevation: selected ? 2 : 0,
        },
        style,
      ]}
      onTouchEnd={onPress}
    >
      {leftIcon}
      <Text
        style={[
          styles.chipText,
          {
            color: selected ? colors.primaryForeground : colors.text,
            marginLeft: leftIcon ? spacing.xs : 0,
            marginRight: rightIcon ? spacing.xs : 0,
          },
        ]}
      >
        {label}
      </Text>
      {rightIcon}
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    borderRadius: spacing.radius.sm,
    alignSelf: 'flex-start',
  },
  text: {
    fontWeight: '500',
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: spacing.radius.lg,
    borderWidth: 1,
    minHeight: 40,
  },
  chipText: {
    fontSize: 14,
    fontWeight: '600',
  },
});

export default Badge;
