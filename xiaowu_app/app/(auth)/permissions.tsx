/**
 * Permissions Screen
 * Screen to request and manage app permissions
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../src/contexts/ThemeContext';
import { spacing } from '../../src/theme/spacing';
import { Button } from '../../src/components/ui/Button';
import {
  checkPermission,
  requestPermission,
  PermissionType,
  openAppSettings,
} from '../../src/utils/permissions';
import { Ionicons } from '@expo/vector-icons';

interface PermissionItem {
  type: PermissionType;
  title: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
}

const PERMISSIONS: PermissionItem[] = [
  {
    type: 'camera',
    title: 'Camera',
    description: 'Take photos of items you want to sell',
    icon: 'camera',
  },
  {
    type: 'photos',
    title: 'Photo Library',
    description: 'Select photos from your library for listings',
    icon: 'images',
  },
  {
    type: 'location',
    title: 'Location',
    description: 'Find nearby products and help buyers locate you',
    icon: 'location',
  },
  {
    type: 'notifications',
    title: 'Notifications',
    description: 'Receive alerts about messages, sales, and updates',
    icon: 'notifications',
  },
];

export default function PermissionsScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [permissions, setPermissions] = useState<
    Record<PermissionType, boolean>
  >({
    camera: false,
    photos: false,
    location: false,
    notifications: false,
  });
  const [loading, setLoading] = useState<Record<PermissionType, boolean>>({
    camera: false,
    photos: false,
    location: false,
    notifications: false,
  });

  useEffect(() => {
    checkAllPermissions();
  }, []);

  const checkAllPermissions = async () => {
    const results: Record<PermissionType, boolean> = {
      camera: false,
      photos: false,
      location: false,
      notifications: false,
    };

    for (const perm of PERMISSIONS) {
      const result = await checkPermission(perm.type);
      results[perm.type] = result.granted;
    }

    setPermissions(results);
  };

  const handleRequestPermission = async (type: PermissionType) => {
    setLoading((prev) => ({ ...prev, [type]: true }));

    const result = await requestPermission(type);

    if (!result.granted && !result.canAskAgain) {
      Alert.alert(
        'Permission Required',
        `This app needs ${type} access to function properly. Please enable it in your device settings.`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Open Settings',
            onPress: () => {
              openAppSettings();
            },
          },
        ]
      );
    }

    setPermissions((prev) => ({ ...prev, [type]: result.granted }));
    setLoading((prev) => ({ ...prev, [type]: false }));
  };

  const handleContinue = () => {
    router.back();
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={{
        paddingBottom: insets.bottom + spacing['2xl'],
      }}
    >
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>
          App Permissions
        </Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          Grant permissions to unlock all features
        </Text>
      </View>

      <View style={styles.permissionsList}>
        {PERMISSIONS.map((perm) => {
          const isGranted = permissions[perm.type];
          const isLoading = loading[perm.type];

          return (
            <View key={perm.type} style={styles.permissionItem}>
              <View style={styles.permissionIcon}>
                <Ionicons
                  name={isGranted ? 'checkmark-circle' : perm.icon}
                  size={32}
                  color={isGranted ? colors.success : colors.primary}
                />
              </View>
              <View style={styles.permissionInfo}>
                <Text style={[styles.permissionTitle, { color: colors.text }]}>
                  {perm.title}
                </Text>
                <Text
                  style={[
                    styles.permissionDescription,
                    { color: colors.textSecondary },
                  ]}
                >
                  {perm.description}
                </Text>
              </View>
              <TouchableOpacity
                style={[
                  styles.permissionButton,
                  {
                    backgroundColor: isGranted
                      ? colors.muted + '20'
                      : colors.primary,
                  },
                ]}
                onPress={() => handleRequestPermission(perm.type)}
                disabled={isLoading}
              >
                <Text
                  style={[
                    styles.permissionButtonText,
                    {
                      color: isGranted ? colors.text : '#FFFFFF',
                    },
                  ]}
                >
                  {isLoading
                    ? 'Requesting...'
                    : isGranted
                    ? 'Granted'
                    : 'Grant'}
                </Text>
              </TouchableOpacity>
            </View>
          );
        })}
      </View>

      <View style={styles.footer}>
        <Text style={[styles.footerText, { color: colors.textSecondary }]}>
          You can always change these permissions later in your device settings.
        </Text>
        <Button
          title="Continue"
          onPress={handleContinue}
          style={styles.continueButton}
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: spacing.screenPadding,
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: spacing.sm,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
  },
  permissionsList: {
    padding: spacing.screenPadding,
  },
  permissionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
    borderRadius: 12,
  },
  permissionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(0,0,0,0.05)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  permissionInfo: {
    flex: 1,
    marginRight: spacing.md,
  },
  permissionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  permissionDescription: {
    fontSize: 14,
  },
  permissionButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 8,
    minWidth: 80,
    alignItems: 'center',
  },
  permissionButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  footer: {
    padding: spacing.screenPadding,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  continueButton: {
    width: '100%',
    maxWidth: 300,
  },
});
