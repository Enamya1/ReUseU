/**
 * Select Component
 * Dropdown select component for forms
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ViewStyle,
  TextStyle,
  Modal,
  FlatList,
  ScrollView,
} from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { spacing } from '../../theme/spacing';
import { shadows } from '../../theme/shadows';

interface SelectOption {
  value: string | number;
  label: string;
}

interface SelectProps {
  options: SelectOption[];
  value?: string | number;
  onChange: (value: string | number) => void;
  label?: string;
  placeholder?: string;
  error?: string;
  disabled?: boolean;
  required?: boolean;
  containerStyle?: ViewStyle;
}

export const Select: React.FC<SelectProps> = ({
  options,
  value,
  onChange,
  label,
  placeholder = 'Select an option',
  error,
  disabled = false,
  required = false,
  containerStyle,
}) => {
  const { colors, isDark } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const themeShadows = isDark ? shadows.dark : shadows.light;

  const selectedOption = options.find((opt) => opt.value === value);

  const handleSelect = (option: SelectOption) => {
    onChange(option.value);
    setIsOpen(false);
  };

  const getBorderColor = (): string => {
    if (error) return colors.destructive;
    if (isOpen) return colors.primary;
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
      <TouchableOpacity
        style={[
          styles.selectButton,
          {
            backgroundColor: disabled ? colors.surfaceSecondary : colors.input,
            borderColor: getBorderColor(),
            borderWidth: isOpen ? 2 : 1,
          },
        ]}
        onPress={() => !disabled && setIsOpen(true)}
        disabled={disabled}
      >
        <Text
          style={[
            styles.selectText,
            {
              color: selectedOption ? colors.text : colors.textTertiary,
            },
          ]}
        >
          {selectedOption?.label || placeholder}
        </Text>
        <Text style={styles.chevron}>▼</Text>
      </TouchableOpacity>
      {error && (
        <Text style={[styles.error, { color: colors.destructive }]}>
          {error}
        </Text>
      )}

      <Modal
        visible={isOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setIsOpen(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setIsOpen(false)}
        >
          <View
            style={[
              styles.modalContent,
              { backgroundColor: colors.card },
              themeShadows.lg,
            ]}
          >
            {label && (
              <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
                <Text style={[styles.modalTitle, { color: colors.text }]}>
                  {label}
                </Text>
                <TouchableOpacity onPress={() => setIsOpen(false)}>
                  <Text style={[styles.closeButton, { color: colors.textSecondary }]}>
                    ✕
                  </Text>
                </TouchableOpacity>
              </View>
            )}
            <FlatList
              data={options}
              keyExtractor={(item) => String(item.value)}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.optionItem,
                    item.value === value && {
                      backgroundColor: colors.surfaceSecondary,
                    },
                  ]}
                  onPress={() => handleSelect(item)}
                >
                  <Text
                    style={[
                      styles.optionText,
                      {
                        color: item.value === value ? colors.primary : colors.text,
                        fontWeight: item.value === value ? '600' : '400',
                      },
                    ]}
                  >
                    {item.label}
                  </Text>
                  {item.value === value && (
                    <Text style={{ color: colors.primary }}>✓</Text>
                  )}
                </TouchableOpacity>
              )}
              style={styles.optionsList}
            />
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

interface MultiSelectProps {
  options: SelectOption[];
  values: (string | number)[];
  onChange: (values: (string | number)[]) => void;
  label?: string;
  placeholder?: string;
  error?: string;
  disabled?: boolean;
  required?: boolean;
  containerStyle?: ViewStyle;
}

export const MultiSelect: React.FC<MultiSelectProps> = ({
  options,
  values,
  onChange,
  label,
  placeholder = 'Select options',
  error,
  disabled = false,
  required = false,
  containerStyle,
}) => {
  const { colors, isDark } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const themeShadows = isDark ? shadows.dark : shadows.light;

  const selectedLabels = options
    .filter((opt) => values.includes(opt.value))
    .map((opt) => opt.label);

  const handleToggle = (value: string | number) => {
    if (values.includes(value)) {
      onChange(values.filter((v) => v !== value));
    } else {
      onChange([...values, value]);
    }
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
      <TouchableOpacity
        style={[
          styles.selectButton,
          {
            backgroundColor: disabled ? colors.surfaceSecondary : colors.input,
            borderColor: error ? colors.destructive : colors.inputBorder,
            borderWidth: 1,
          },
        ]}
        onPress={() => !disabled && setIsOpen(true)}
        disabled={disabled}
      >
        <Text
          style={[
            styles.selectText,
            {
              color: selectedLabels.length > 0 ? colors.text : colors.textTertiary,
            },
          ]}
          numberOfLines={1}
        >
          {selectedLabels.length > 0 ? selectedLabels.join(', ') : placeholder}
        </Text>
        <Text style={styles.chevron}>▼</Text>
      </TouchableOpacity>
      {error && (
        <Text style={[styles.error, { color: colors.destructive }]}>
          {error}
        </Text>
      )}

      <Modal
        visible={isOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setIsOpen(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setIsOpen(false)}
        >
          <View
            style={[
              styles.modalContent,
              { backgroundColor: colors.card },
              themeShadows.lg,
            ]}
          >
            {label && (
              <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
                <Text style={[styles.modalTitle, { color: colors.text }]}>
                  {label}
                </Text>
                <TouchableOpacity onPress={() => setIsOpen(false)}>
                  <Text style={[styles.closeButton, { color: colors.textSecondary }]}>
                    ✕
                  </Text>
                </TouchableOpacity>
              </View>
            )}
            <ScrollView style={styles.optionsList}>
              {options.map((item) => (
                <TouchableOpacity
                  key={String(item.value)}
                  style={[
                    styles.optionItem,
                    values.includes(item.value) && {
                      backgroundColor: colors.surfaceSecondary,
                    },
                  ]}
                  onPress={() => handleToggle(item.value)}
                >
                  <Text
                    style={[
                      styles.optionText,
                      {
                        color: values.includes(item.value) ? colors.primary : colors.text,
                        fontWeight: values.includes(item.value) ? '600' : '400',
                      },
                    ]}
                  >
                    {item.label}
                  </Text>
                  <View
                    style={[
                      styles.checkbox,
                      {
                        borderColor: values.includes(item.value)
                          ? colors.primary
                          : colors.border,
                        backgroundColor: values.includes(item.value)
                          ? colors.primary
                          : 'transparent',
                      },
                    ]}
                  >
                    {values.includes(item.value) && (
                      <Text style={{ color: colors.primaryForeground, fontSize: 12 }}>
                        ✓
                      </Text>
                    )}
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>
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
  selectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: spacing.sm,
    paddingHorizontal: spacing.md,
    height: 48,
  },
  selectText: {
    flex: 1,
    fontSize: 16,
  },
  chevron: {
    fontSize: 12,
    marginLeft: spacing.sm,
  },
  error: {
    fontSize: 12,
    marginTop: spacing.xs,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '80%',
    maxHeight: '60%',
    borderRadius: spacing.md,
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.md,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  closeButton: {
    fontSize: 18,
  },
  optionsList: {
    maxHeight: 300,
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  optionText: {
    fontSize: 16,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default Select;
