/**
 * Modal Component
 * Modal dialog component matching web platform's minimalist design
 */

import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Dimensions,
  TouchableOpacity,
  TouchableWithoutFeedback,
  KeyboardAvoidingView,
  Platform,
  ViewStyle,
} from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { spacing } from '../../theme/spacing';
import { shadows } from '../../theme/shadows';

interface ModalProps {
  visible: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  showCloseButton?: boolean;
  animationType?: 'fade' | 'slide' | 'none';
  size?: 'sm' | 'md' | 'lg' | 'full';
  position?: 'center' | 'bottom';
  style?: ViewStyle;
}

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

export const Modal: React.FC<ModalProps> = ({
  visible,
  onClose,
  title,
  children,
  showCloseButton = true,
  animationType = 'fade',
  size = 'md',
  position = 'center',
  style,
}) => {
  const { colors, isDark } = useTheme();
  const themeShadows = isDark ? shadows.dark : shadows.light;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(SCREEN_HEIGHT)).current;

  useEffect(() => {
    if (visible) {
      if (animationType === 'fade') {
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }).start();
      } else if (animationType === 'slide') {
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }).start();
      }
    } else {
      if (animationType === 'fade') {
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }).start();
      } else if (animationType === 'slide') {
        Animated.timing(slideAnim, {
          toValue: SCREEN_HEIGHT,
          duration: 300,
          useNativeDriver: true,
        }).start();
      }
    }
  }, [visible]);

  const getWidth = (): number | `${number}%` => {
    switch (size) {
      case 'sm':
        return '60%' as const;
      case 'lg':
        return '90%' as const;
      case 'full':
        return '100%' as const;
      default:
        return '80%' as const;
    }
  };

  const getMaxHeight = (): number => {
    switch (size) {
      case 'sm':
        return SCREEN_HEIGHT * 0.4;
      case 'lg':
        return SCREEN_HEIGHT * 0.8;
      case 'full':
        return SCREEN_HEIGHT;
      default:
        return SCREEN_HEIGHT * 0.6;
    }
  };

  if (!visible) return null;

  const content = (
    <View
      style={[
        position === 'center' ? styles.centered : styles.bottom,
        size === 'full' && styles.fullScreen,
      ]}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={[styles.backdrop, { backgroundColor: colors.overlay }]} />
      </TouchableWithoutFeedback>
      <Animated.View
        style={[
          position === 'center' ? styles.modalCenter : styles.modalBottom,
          size === 'full' && styles.modalFull,
          {
            backgroundColor: colors.card,
            width: getWidth(),
            maxHeight: getMaxHeight(),
          },
          position === 'center' && themeShadows.lg,
          position === 'center' && { opacity: fadeAnim },
          position === 'bottom' && { transform: [{ translateY: slideAnim }] },
          style,
        ]}
      >
        {position === 'bottom' && (
          <View style={styles.handle}>
            <View
              style={[
                styles.handleBar,
                { backgroundColor: colors.border },
              ]}
            />
          </View>
        )}
        {(title || showCloseButton) && (
          <View style={styles.header}>
            {title && (
              <Text style={[styles.title, { color: colors.text }]}>
                {title}
              </Text>
            )}
            {showCloseButton && (
              <TouchableOpacity
                onPress={onClose}
                style={styles.closeButton}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Text style={[styles.closeText, { color: colors.textSecondary }]}>
                  ✕
                </Text>
              </TouchableOpacity>
            )}
          </View>
        )}
        <View style={styles.content}>{children}</View>
      </Animated.View>
    </View>
  );

  if (Platform.OS === 'ios') {
    return (
      <KeyboardAvoidingView behavior="padding" style={styles.overlay}>
        {content}
      </KeyboardAvoidingView>
    );
  }

  return <View style={styles.overlay}>{content}</View>;
};

interface ConfirmModalProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  destructive?: boolean;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  visible,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  destructive = false,
}) => {
  const { colors } = useTheme();

  return (
    <Modal visible={visible} onClose={onClose} title={title} size="sm">
      <Text style={[styles.confirmMessage, { color: colors.textSecondary }]}>
        {message}
      </Text>
      <View style={styles.confirmButtons}>
        <TouchableOpacity
          style={[styles.confirmButton, { backgroundColor: colors.muted }]}
          onPress={onClose}
        >
          <Text style={[styles.confirmButtonText, { color: colors.text }]}>
            {cancelText}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.confirmButton,
            {
              backgroundColor: destructive ? colors.destructive : colors.primary,
            },
          ]}
          onPress={() => {
            onConfirm();
            onClose();
          }}
        >
          <Text style={[styles.confirmButtonText, { color: '#FFFFFF' }]}>
            {confirmText}
          </Text>
        </TouchableOpacity>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1000,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bottom: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  modalCenter: {
    borderRadius: spacing.md,
    overflow: 'hidden',
  },
  modalBottom: {
    borderTopLeftRadius: spacing.lg,
    borderTopRightRadius: spacing.lg,
    overflow: 'hidden',
  },
  modalFull: {
    borderRadius: 0,
  },
  fullScreen: {
    ...StyleSheet.absoluteFillObject,
  },
  handle: {
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  handleBar: {
    width: 36,
    height: 4,
    borderRadius: 2,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    flex: 1,
  },
  closeButton: {
    padding: spacing.xs,
  },
  closeText: {
    fontSize: 18,
  },
  content: {
    padding: spacing.lg,
  },
  confirmMessage: {
    fontSize: 16,
    lineHeight: 24,
    marginBottom: spacing.lg,
  },
  confirmButtons: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  confirmButton: {
    flex: 1,
    paddingVertical: spacing.md,
    borderRadius: spacing.sm,
    alignItems: 'center',
  },
  confirmButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});

export default Modal;
