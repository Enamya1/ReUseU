/**
 * TextInput Component
 * Form text input with validation support
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

interface TextInputProps extends RNTextInputProps {
  label?: string;
  error?: string;
  hint?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  containerStyle?: ViewStyle;
  inputStyle?: TextStyle;
  disabled?: boolean;
  required?: boolean;
}

export const FormTextInput: React.FC<TextInputProps> = ({
  label,
  error,
  hint,
  leftIcon,
  rightIcon,
  containerStyle,
  inputStyle,
  disabled = false,
  required = false,
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
          {required && <Text style={{ color: colors.destructive }}> *</Text>}
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
          ] as any}
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

interface FormTextAreaProps extends RNTextInputProps {
  label?: string;
  error?: string;
  hint?: string;
  containerStyle?: ViewStyle;
  inputStyle?: TextStyle;
  disabled?: boolean;
  required?: boolean;
  rows?: number;
}

export const FormTextArea: React.FC<FormTextAreaProps> = ({
  label,
  error,
  hint,
  containerStyle,
  inputStyle,
  disabled = false,
  required = false,
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
          {required && <Text style={{ color: colors.destructive }}> *</Text>}
        </Text>
      )}
      <View
        style={[
          styles.textAreaContainer,
          {
            backgroundColor: disabled ? colors.surfaceSecondary : colors.input,
            borderColor: getBorderColor(),
            borderWidth: isFocused ? 2 : 1,
            height: rows * 24 + spacing.lg,
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

interface FormPasswordInputProps extends RNTextInputProps {
  label?: string;
  error?: string;
  hint?: string;
  containerStyle?: ViewStyle;
  inputStyle?: TextStyle;
  disabled?: boolean;
  required?: boolean;
}

export const FormPasswordInput: React.FC<FormPasswordInputProps> = ({
  label,
  error,
  hint,
  containerStyle,
  inputStyle,
  disabled = false,
  required = false,
  ...props
}) => {
  const { colors } = useTheme();
  const [isFocused, setIsFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

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
          {required && <Text style={{ color: colors.destructive }}> *</Text>}
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
        <RNTextInput
          style={[
            styles.input,
            {
              color: disabled ? colors.textTertiary : colors.text,
            },
            { marginRight: spacing.sm },
            inputStyle,
          ]}
          placeholderTextColor={colors.textTertiary}
          editable={!disabled}
          secureTextEntry={!showPassword}
          autoCapitalize="none"
          autoCorrect={false}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          {...props}
        />
        <TouchableOpacity
          style={styles.rightIcon}
          onPress={() => setShowPassword(!showPassword)}
        >
          <Text style={{ fontSize: 16 }}>
            {showPassword ? '👁️' : '👁️‍🗨️'}
          </Text>
        </TouchableOpacity>
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
    marginBottom: spacing.lg,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: spacing.sm,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: spacing.sm,
    paddingHorizontal: spacing.md,
    height: 48,
  },
  input: {
    flex: 1,
    fontSize: 16,
    paddingVertical: spacing.md,
  },
  leftIcon: {
    marginRight: spacing.sm,
  },
  rightIcon: {
    marginLeft: spacing.sm,
  },
  textAreaContainer: {
    borderRadius: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  textArea: {
    flex: 1,
    fontSize: 16,
    textAlignVertical: 'top',
  },
  hint: {
    fontSize: 12,
    marginTop: spacing.xs,
  },
});

export default FormTextInput;
