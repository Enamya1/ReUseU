/**
 * Input Component
 * Text input matching web platform's minimalist design
 */

import React, { useState } from 'react';
import {
  View,
  TextInput as RNTextInput,
  Text,
  StyleSheet,
  ViewStyle,
  TextStyle,
  TextInputProps as RNTextInputProps,
  TouchableOpacity,
} from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { spacing } from '../../theme/spacing';

interface InputProps extends RNTextInputProps {
  label?: string;
  error?: string;
  hint?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  containerStyle?: ViewStyle;
  inputStyle?: TextStyle;
  disabled?: boolean;
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  hint,
  leftIcon,
  rightIcon,
  containerStyle,
  inputStyle,
  disabled = false,
  ...props
}) => {
  const { colors } = useTheme();
  const [isFocused, setIsFocused] = useState(false);

  const getBorderColor = (): string => {
    if (error) return colors.destructive;
    if (isFocused) return colors.primary;
    return colors.inputBorder;
  };

  return (
    <View style={[styles.container, containerStyle]}>
      {label && (
        <Text
          style={[
            styles.label,
            {
              color: error ? colors.destructive : colors.text,
            },
          ]}
        >
          {label}
        </Text>
      )}
      <View
        style={[
          styles.inputContainer,
          {
            backgroundColor: disabled ? colors.surfaceSecondary : colors.input,
            borderColor: getBorderColor(),
            borderWidth: isFocused ? 2 : 1,
          },
        ]}
      >
        {leftIcon && <View style={styles.leftIcon}>{leftIcon}</View>}
        <RNTextInput
          style={[
            styles.input,
            {
              color: disabled ? colors.textTertiary : colors.text,
            },
            leftIcon ? { marginLeft: 0 } : undefined,
            rightIcon ? { marginRight: 0 } : undefined,
            inputStyle,
          ]}
          placeholderTextColor={colors.textTertiary}
          editable={!disabled}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          {...props}
        />
        {rightIcon && <View style={styles.rightIcon}>{rightIcon}</View>}
      </View>
      {(error || hint) && (
        <Text
          style={[
            styles.hint,
            {
              color: error ? colors.destructive : colors.textSecondary,
            },
          ]}
        >
          {error || hint}
        </Text>
      )}
    </View>
  );
};

interface TextAreaProps extends RNTextInputProps {
  label?: string;
  error?: string;
  hint?: string;
  containerStyle?: ViewStyle;
  inputStyle?: TextStyle;
  disabled?: boolean;
  rows?: number;
}

export const TextArea: React.FC<TextAreaProps> = ({
  label,
  error,
  hint,
  containerStyle,
  inputStyle,
  disabled = false,
  rows = 4,
  ...props
}) => {
  const { colors } = useTheme();
  const [isFocused, setIsFocused] = useState(false);

  const getBorderColor = (): string => {
    if (error) return colors.destructive;
    if (isFocused) return colors.primary;
    return colors.inputBorder;
  };

  return (
    <View style={[styles.container, containerStyle]}>
      {label && (
        <Text
          style={[
            styles.label,
            {
              color: error ? colors.destructive : colors.text,
            },
          ]}
        >
          {label}
        </Text>
      )}
      <View
        style={[
          styles.textAreaContainer,
          {
            backgroundColor: disabled ? colors.surfaceSecondary : colors.input,
            borderColor: getBorderColor(),
            borderWidth: isFocused ? 2 : 1,
            height: rows * 24 + spacing.md,
          },
        ]}
      >
        <RNTextInput
          style={[
            styles.textArea,
            {
              color: disabled ? colors.textTertiary : colors.text,
            },
            inputStyle,
          ]}
          placeholderTextColor={colors.textTertiary}
          editable={!disabled}
          multiline
          textAlignVertical="top"
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          {...props}
        />
      </View>
      {(error || hint) && (
        <Text
          style={[
            styles.hint,
            {
              color: error ? colors.destructive : colors.textSecondary,
            },
          ]}
        >
          {error || hint}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.md,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: spacing.xs,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: spacing.radius.sm,
    paddingHorizontal: spacing.sm,
    height: 48,
  },
  input: {
    flex: 1,
    fontSize: 16,
    paddingVertical: spacing.sm,
  },
  leftIcon: {
    marginRight: spacing.xs,
  },
  rightIcon: {
    marginLeft: spacing.xs,
  },
  textAreaContainer: {
    borderRadius: spacing.radius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  textArea: {
    flex: 1,
    fontSize: 16,
    textAlignVertical: 'top',
  },
  hint: {
    fontSize: 12,
    marginTop: 2,
  },
});

export default Input;
