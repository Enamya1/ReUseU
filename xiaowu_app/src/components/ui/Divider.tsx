/**
 * Divider Component
 * Divider/separator component matching web platform's minimalist design
 */

import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { spacing } from '../../theme/spacing';

type DividerOrientation = 'horizontal' | 'vertical';

interface DividerProps {
  orientation?: DividerOrientation;
  thickness?: number;
  color?: string;
  style?: ViewStyle;
  margin?: number;
}

export const Divider: React.FC<DividerProps> = ({
  orientation = 'horizontal',
  thickness = 1,
  color,
  style,
  margin,
}) => {
  const { colors } = useTheme();

  const dividerColor = color || colors.border;

  if (orientation === 'vertical') {
    return (
      <View
        style={[
          {
            width: thickness,
            backgroundColor: dividerColor,
            marginHorizontal: margin || spacing.sm,
            alignSelf: 'stretch',
          },
          style,
        ]}
      />
    );
  }

  return (
    <View
      style={[
        {
          height: thickness,
          backgroundColor: dividerColor,
          marginVertical: margin || spacing.sm,
          width: '100%',
        },
        style,
      ]}
    />
  );
};

interface SectionDividerProps {
  title?: string;
  style?: ViewStyle;
}

export const SectionDivider: React.FC<SectionDividerProps> = ({
  title,
  style,
}) => {
  const { colors } = useTheme();

  if (!title) {
    return <Divider margin={spacing.lg} style={style} />;
  }

  return (
    <View style={[styles.sectionDivider, style]}>
      <View style={[styles.sectionLine, { backgroundColor: colors.border }]} />
      <View style={[styles.sectionTitleContainer, { backgroundColor: colors.background }]}>
        {/* Title would go here if needed */}
      </View>
    </View>
  );
};

interface ListDividerProps {
  inset?: boolean;
  style?: ViewStyle;
}

export const ListDivider: React.FC<ListDividerProps> = ({
  inset = false,
  style,
}) => {
  const { colors } = useTheme();

  return (
    <View
      style={[
        styles.listDivider,
        {
          backgroundColor: colors.borderLight,
          marginLeft: inset ? spacing.lg + 40 + spacing.md : 0,
        },
        style,
      ]}
    />
  );
};

const styles = StyleSheet.create({
  sectionDivider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: spacing.lg,
  },
  sectionLine: {
    flex: 1,
    height: 1,
  },
  sectionTitleContainer: {
    paddingHorizontal: spacing.md,
  },
  listDivider: {
    height: 1,
    width: '100%',
  },
});

export default Divider;
