/**
 * Image Picker Modal
 * Modal for selecting image source (camera or gallery)
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Pressable,
} from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { spacing } from '../../theme/spacing';

interface ImagePickerModalProps {
  visible: boolean;
  onClose: () => void;
  onCamera: () => void;
  onGallery: () => void;
}

export const ImagePickerModal: React.FC<ImagePickerModalProps> = ({
  visible,
  onClose,
  onCamera,
  onGallery,
}) => {
  const { colors } = useTheme();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable style={styles.overlay} onPress={onClose}>
        <View style={[styles.content, { backgroundColor: colors.card }]}>
          <Text style={[styles.title, { color: colors.text }]}>
            Choose Image Source
          </Text>
          
          <TouchableOpacity
            style={[styles.option, { borderBottomColor: colors.border }]}
            onPress={() => {
              onCamera();
              onClose();
            }}
          >
            <Text style={styles.optionIcon}>📷</Text>
            <Text style={[styles.optionText, { color: colors.text }]}>
              Take Photo
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.option}
            onPress={() => {
              onGallery();
              onClose();
            }}
          >
            <Text style={styles.optionIcon}>🖼️</Text>
            <Text style={[styles.optionText, { color: colors.text }]}>
              Choose from Gallery
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.cancelButton, { backgroundColor: colors.surfaceSecondary }]}
            onPress={onClose}
          >
            <Text style={[styles.cancelText, { color: colors.text }]}>
              Cancel
            </Text>
          </TouchableOpacity>
        </View>
      </Pressable>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  content: {
    borderTopLeftRadius: spacing.lg,
    borderTopRightRadius: spacing.lg,
    padding: spacing.lg,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: spacing.lg,
    textAlign: 'center',
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.lg,
    borderBottomWidth: 1,
  },
  optionIcon: {
    fontSize: 24,
    marginRight: spacing.md,
  },
  optionText: {
    fontSize: 16,
  },
  cancelButton: {
    marginTop: spacing.md,
    padding: spacing.md,
    borderRadius: spacing.sm,
    alignItems: 'center',
  },
  cancelText: {
    fontSize: 16,
    fontWeight: '500',
  },
});
