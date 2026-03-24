/**
 * Switch Component
 * Toggle switch component matching web platform's minimalist design
 */

import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  TouchableOpacity,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { spacing } from '../../theme/spacing';

interface SwitchProps {
  value: boolean;
  onValueChange: (value: boolean) => void;
  disabled?: boolean;
  style?: ViewStyle;
}

export const Switch: React.FC<SwitchProps> = ({
  value,
  onValueChange,
  disabled = false,
  style,
}) => {
  const { colors } = useTheme();
  const translateX = useRef(new Animated.Value(value ? 22 : 2)).current;

  useEffect(() => {
    Animated.spring(translateX, {
      toValue: value ? 22 : 2,
      useNativeDriver: true,
      tension: 100,
      friction: 10,
    }).start();
  }, [value]);

  const backgroundColor = disabled
    ? colors.muted
    : value
    ? colors.primary
    : colors.muted;

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={() => !disabled && onValueChange(!value)}
      disabled={disabled}
      style={[
        styles.container,
        { backgroundColor },
        style,
      ]}
    >
      <Animated.View
        style={[
          styles.thumb,
          {
            transform: [{ translateX }],
            backgroundColor: disabled ? colors.border : '#FFFFFF',
          },
        ]}
      />
    </TouchableOpacity>
  );
};

interface SwitchWithLabelProps {
  value: boolean;
  onValueChange: (value: boolean) => void;
  label: string;
  description?: string;
  disabled?: boolean;
  style?: ViewStyle;
  labelStyle?: TextStyle;
}

export const SwitchWithLabel: React.FC<SwitchWithLabelProps> = ({
  value,
  onValueChange,
  label,
  description,
  disabled = false,
  style,
  labelStyle,
}) => {
  const { colors } = useTheme();

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={() => !disabled && onValueChange(!value)}
      disabled={disabled}
      style={[styles.labelContainer, style]}
    >
      <View style={styles.labelContent}>
        <Text
          style={[
            styles.label,
            { color: disabled ? colors.textTertiary : colors.text },
            labelStyle,
          ]}
        >
          {label}
        </Text>
        {description && (
          <Text style={[styles.description, { color: colors.textSecondary }]}>
            {description}
          </Text>
        )}
      </View>
      <Switch value={value} onValueChange={onValueChange} disabled={disabled} />
    </TouchableOpacity>
  );
};

interface CheckboxProps {
  value: boolean;
  onValueChange: (value: boolean) => void;
  disabled?: boolean;
  style?: ViewStyle;
}

export const Checkbox: React.FC<CheckboxProps> = ({
  value,
  onValueChange,
  disabled = false,
  style,
}) => {
  const { colors } = useTheme();
  const scale = useRef(new Animated.Value(1)).current;

  const handlePress = () => {
    if (disabled) return;
    
    Animated.sequence([
      Animated.spring(scale, {
        toValue: 0.9,
        useNativeDriver: true,
        tension: 300,
        friction: 10,
      }),
      Animated.spring(scale, {
        toValue: 1,
        useNativeDriver: true,
        tension: 300,
        friction: 10,
      }),
    ]).start();

    onValueChange(!value);
  };

  const backgroundColor = disabled
    ? colors.muted
    : value
    ? colors.primary
    : 'transparent';

  const borderColor = disabled
    ? colors.border
    : value
    ? colors.primary
    : colors.border;

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={handlePress}
      disabled={disabled}
      style={[
        styles.checkbox,
        {
          backgroundColor,
          borderColor,
        },
        style,
      ]}
    >
      <Animated.View style={{ transform: [{ scale }] }}>
        {value && (
          <Text style={[styles.checkmark, { color: colors.primaryForeground }]}>
            ✓
          </Text>
        )}
      </Animated.View>
    </TouchableOpacity>
  );
};

interface CheckboxWithLabelProps {
  value: boolean;
  onValueChange: (value: boolean) => void;
  label: string;
  disabled?: boolean;
  style?: ViewStyle;
  labelStyle?: TextStyle;
}

export const CheckboxWithLabel: React.FC<CheckboxWithLabelProps> = ({
  value,
  onValueChange,
  label,
  disabled = false,
  style,
  labelStyle,
}) => {
  const { colors } = useTheme();

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={() => !disabled && onValueChange(!value)}
      disabled={disabled}
      style={[styles.checkboxLabelContainer, style]}
    >
      <Checkbox value={value} onValueChange={onValueChange} disabled={disabled} />
      <Text
        style={[
          styles.checkboxLabel,
          { color: disabled ? colors.textTertiary : colors.text },
          labelStyle,
        ]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    width: 50,
    height: 28,
    borderRadius: 14,
    padding: 2,
  },
  thumb: {
    width: 24,
    height: 24,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  labelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
  },
  labelContent: {
    flex: 1,
    marginRight: spacing.md,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
  },
  description: {
    fontSize: 14,
    marginTop: spacing.xs,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: spacing.xs,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkmark: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  checkboxLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  checkboxLabel: {
    fontSize: 16,
    marginLeft: spacing.md,
  },
});

export default Switch;
