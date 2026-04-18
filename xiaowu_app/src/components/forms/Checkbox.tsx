/**
 * FormCheckbox Component
 * Checkbox component for forms
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ViewStyle, TextStyle } from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { spacing } from '../../theme/spacing';

interface FormCheckboxProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  disabled?: boolean;
  style?: ViewStyle;
}

export const FormCheckbox: React.FC<FormCheckboxProps> = ({
  checked,
  onChange,
  label,
  disabled = false,
  style,
}) => {
  const { colors } = useTheme();

  return (
    <TouchableOpacity
      style={[styles.container, style]}
      onPress={() => !disabled && onChange(!checked)}
      disabled={disabled}
      activeOpacity={0.7}
    >
      <View
        style={[
          styles.checkbox,
          {
            borderColor: checked ? colors.primary : colors.border,
            backgroundColor: checked ? colors.primary : 'transparent',
            opacity: disabled ? 0.5 : 1,
          },
        ]}
      >
        {checked && (
          <Text style={[styles.checkmark, { color: colors.primaryForeground }]}>
            ✓
          </Text>
        )}
      </View>
      {label && (
        <Text
          style={[
            styles.label,
            {
              color: disabled ? colors.textTertiary : colors.text,
            },
          ]}
        >
          {label}
        </Text>
      )}
    </TouchableOpacity>
  );
};

interface FormRadioProps {
  selected: boolean;
  onSelect: () => void;
  label?: string;
  disabled?: boolean;
  style?: ViewStyle;
}

export const FormRadio: React.FC<FormRadioProps> = ({
  selected,
  onSelect,
  label,
  disabled = false,
  style,
}) => {
  const { colors } = useTheme();

  return (
    <TouchableOpacity
      style={[styles.container, style]}
      onPress={onSelect}
      disabled={disabled}
      activeOpacity={0.7}
    >
      <View
        style={[
          styles.radio,
          {
            borderColor: selected ? colors.primary : colors.border,
            opacity: disabled ? 0.5 : 1,
          },
        ]}
      >
        {selected && (
          <View
            style={[
              styles.radioInner,
              { backgroundColor: colors.primary },
            ]}
          />
        )}
      </View>
      {label && (
        <Text
          style={[
            styles.label,
            {
              color: disabled ? colors.textTertiary : colors.text,
            },
          ]}
        >
          {label}
        </Text>
      )}
    </TouchableOpacity>
  );
};

interface RadioGroupProps {
  options: { value: string | number; label: string }[];
  value?: string | number;
  onChange: (value: string | number) => void;
  label?: string;
  disabled?: boolean;
  horizontal?: boolean;
  style?: ViewStyle;
}

export const FormRadioGroup: React.FC<RadioGroupProps> = ({
  options,
  value,
  onChange,
  label,
  disabled = false,
  horizontal = false,
  style,
}) => {
  const { colors } = useTheme();

  return (
    <View style={[styles.groupContainer, style]}>
      {label && (
        <Text style={[styles.groupLabel, { color: colors.text }]}>
          {label}
        </Text>
      )}
      <View
        style={[
          styles.radioGroup,
          horizontal && styles.radioGroupHorizontal,
        ]}
      >
        {options.map((option) => (
          <FormRadio
            key={String(option.value)}
            selected={value === option.value}
            onSelect={() => onChange(option.value)}
            label={option.label}
            disabled={disabled}
          />
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: spacing.xs,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 4,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkmark: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  radio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  label: {
    fontSize: 16,
    marginLeft: spacing.sm,
    flex: 1,
  },
  groupContainer: {
    marginBottom: spacing.lg,
  },
  groupLabel: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: spacing.sm,
  },
  radioGroup: {
    flexDirection: 'column',
  },
  radioGroupHorizontal: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
});

export default FormCheckbox;
