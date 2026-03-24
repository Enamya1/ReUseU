/**
 * Loading Component
 * Loading indicators matching web platform's minimalist design
 */

import React from 'react';
import { View, ActivityIndicator, Text, StyleSheet, ViewStyle } from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { spacing } from '../../theme/spacing';

type LoadingSize = 'sm' | 'md' | 'lg';

interface LoadingProps {
  size?: LoadingSize;
  color?: string;
  style?: ViewStyle;
}

export const Loading: React.FC<LoadingProps> = ({
  size = 'md',
  color,
  style,
}) => {
  const { colors } = useTheme();

  const getActivityIndicatorSize = (): 'small' | 'large' | number => {
    switch (size) {
      case 'sm':
        return 'small';
      case 'lg':
        return 36;
      default:
        return 'large';
    }
  };

  return (
    <View style={[styles.container, style]}>
      <ActivityIndicator
        size={getActivityIndicatorSize()}
        color={color || colors.primary}
      />
    </View>
  );
};

interface LoadingOverlayProps {
  visible: boolean;
  message?: string;
}

export const LoadingOverlay: React.FC<LoadingOverlayProps> = ({
  visible,
  message,
}) => {
  const { colors } = useTheme();

  if (!visible) return null;

  return (
    <View style={[styles.overlay, { backgroundColor: colors.overlay }]}>
      <View
        style={[
          styles.overlayContent,
          { backgroundColor: colors.card },
        ]}
      >
        <ActivityIndicator size="large" color={colors.primary} />
        {message && (
          <Text style={[styles.overlayMessage, { color: colors.text }]}>
            {message}
          </Text>
        )}
      </View>
    </View>
  );
};

interface LoadingFullPageProps {
  message?: string;
}

export const LoadingFullPage: React.FC<LoadingFullPageProps> = ({ message }) => {
  const { colors } = useTheme();

  return (
    <View style={[styles.fullPage, { backgroundColor: colors.background }]}>
      <ActivityIndicator size="large" color={colors.primary} />
      {message && (
        <Text style={[styles.fullPageMessage, { color: colors.textSecondary }]}>
          {message}
        </Text>
      )}
    </View>
  );
};

interface SkeletonProps {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: ViewStyle;
}

export const Skeleton: React.FC<SkeletonProps> = ({
  width = '100%',
  height = 20,
  borderRadius,
  style,
}) => {
  const { colors } = useTheme();

  return (
    <View
      style={[
        {
          width: width as any,
          height,
          borderRadius: borderRadius || spacing.xs,
          backgroundColor: colors.muted,
        },
        style,
      ]}
    />
  );
};

interface SkeletonCardProps {
  style?: ViewStyle;
}

export const SkeletonCard: React.FC<SkeletonCardProps> = ({ style }) => {
  const { colors } = useTheme();

  return (
    <View
      style={[
        styles.skeletonCard,
        { backgroundColor: colors.card },
        style,
      ]}
    >
      <Skeleton height={150} borderRadius={spacing.sm} />
      <View style={styles.skeletonContent}>
        <Skeleton width="60%" height={16} />
        <Skeleton width="40%" height={14} style={{ marginTop: spacing.sm }} />
        <View style={styles.skeletonRow}>
          <Skeleton width={24} height={24} borderRadius={12} />
          <Skeleton width="50%" height={12} style={{ marginLeft: spacing.sm }} />
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  },
  overlayContent: {
    padding: spacing['2xl'],
    borderRadius: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  overlayMessage: {
    marginTop: spacing.md,
    fontSize: 16,
    fontWeight: '500',
  },
  fullPage: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fullPageMessage: {
    marginTop: spacing.lg,
    fontSize: 16,
  },
  skeletonCard: {
    borderRadius: spacing.md,
    overflow: 'hidden',
    marginBottom: spacing.lg,
  },
  skeletonContent: {
    padding: spacing.md,
  },
  skeletonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.md,
  },
});

export default Loading;
