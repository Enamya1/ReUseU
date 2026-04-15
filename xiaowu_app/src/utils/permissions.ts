/**
 * Permissions Utility
 * Handle all permission requests for the app
 */

import { Platform, Alert } from 'react-native';
import * as Location from 'expo-location';
import * as ImagePicker from 'expo-image-picker';

export type PermissionType = 'camera' | 'photos' | 'location' | 'notifications';

export interface PermissionResult {
  granted: boolean;
  canAskAgain: boolean;
  status: 'granted' | 'denied' | 'undetermined';
}

/**
 * Request a specific permission
 */
export async function requestPermission(
  type: PermissionType
): Promise<PermissionResult> {
  try {
    switch (type) {
      case 'camera': {
        const { status, canAskAgain } =
          await ImagePicker.requestCameraPermissionsAsync();
        return {
          granted: status === 'granted',
          canAskAgain,
          status: status as PermissionResult['status'],
        };
      }

      case 'photos': {
        const { status, canAskAgain } =
          await ImagePicker.requestMediaLibraryPermissionsAsync();
        return {
          granted: status === 'granted',
          canAskAgain,
          status: status as PermissionResult['status'],
        };
      }

      case 'location': {
        const { status, canAskAgain } =
          await Location.requestForegroundPermissionsAsync();
        return {
          granted: status === 'granted',
          canAskAgain,
          status: status as PermissionResult['status'],
        };
      }

      case 'notifications': {
        // For notifications, you would use expo-notifications
        // const { status, canAskAgain } = await Notifications.requestPermissionsAsync();
        // For now, return a placeholder
        return {
          granted: true,
          canAskAgain: false,
          status: 'granted',
        };
      }

      default:
        return {
          granted: false,
          canAskAgain: false,
          status: 'denied',
        };
    }
  } catch (error) {
    console.error(`Error requesting ${type} permission:`, error);
    return {
      granted: false,
      canAskAgain: false,
      status: 'denied',
    };
  }
}

/**
 * Check if a permission is already granted
 */
export async function checkPermission(
  type: PermissionType
): Promise<PermissionResult> {
  try {
    switch (type) {
      case 'camera': {
        const { status, canAskAgain } =
          await ImagePicker.getCameraPermissionsAsync();
        return {
          granted: status === 'granted',
          canAskAgain,
          status: status as PermissionResult['status'],
        };
      }

      case 'photos': {
        const { status, canAskAgain } =
          await ImagePicker.getMediaLibraryPermissionsAsync();
        return {
          granted: status === 'granted',
          canAskAgain,
          status: status as PermissionResult['status'],
        };
      }

      case 'location': {
        const { status, canAskAgain } =
          await Location.getForegroundPermissionsAsync();
        return {
          granted: status === 'granted',
          canAskAgain,
          status: status as PermissionResult['status'],
        };
      }

      case 'notifications': {
        // Placeholder for notifications
        return {
          granted: true,
          canAskAgain: false,
          status: 'granted',
        };
      }

      default:
        return {
          granted: false,
          canAskAgain: false,
          status: 'denied',
        };
    }
  } catch (error) {
    console.error(`Error checking ${type} permission:`, error);
    return {
      granted: false,
      canAskAgain: false,
      status: 'denied',
    };
  }
}

/**
 * Show permission denied alert
 */
export function showPermissionDeniedAlert(
  type: PermissionType,
  onOpenSettings?: () => void
) {
  const messages: Record<PermissionType, { title: string; message: string }> = {
    camera: {
      title: 'Camera Access Required',
      message:
        'This app needs camera access to take photos of items you want to sell. Please enable camera access in your device settings.',
    },
    photos: {
      title: 'Photo Library Access Required',
      message:
        'This app needs photo library access to select photos for your listings. Please enable photo library access in your device settings.',
    },
    location: {
      title: 'Location Access Required',
      message:
        'This app needs location access to show you nearby products and help buyers find your listings. Please enable location access in your device settings.',
    },
    notifications: {
      title: 'Notification Access Required',
      message:
        'This app needs notification access to alert you about new messages, sales, and updates. Please enable notifications in your device settings.',
    },
  };

  const { title, message } = messages[type];

  Alert.alert(
    title,
    message,
    [
      {
        text: 'Cancel',
        style: 'cancel',
      },
      {
        text: 'Open Settings',
        onPress: () => onOpenSettings?.(),
      },
    ],
    { cancelable: true }
  );
}

/**
 * Request permission and show alert if denied
 */
export async function requestPermissionWithAlert(
  type: PermissionType,
  onOpenSettings?: () => void
): Promise<boolean> {
  const result = await requestPermission(type);

  if (!result.granted && !result.canAskAgain) {
    showPermissionDeniedAlert(type, onOpenSettings);
    return false;
  }

  return result.granted;
}

/**
 * Request all essential permissions on first app launch
 */
export async function requestEssentialPermissions(
  onOpenSettings?: () => void
): Promise<{
  camera: boolean;
  photos: boolean;
  location: boolean;
}> {
  const [camera, photos, location] = await Promise.all([
    requestPermissionWithAlert('camera', onOpenSettings),
    requestPermissionWithAlert('photos', onOpenSettings),
    requestPermissionWithAlert('location', onOpenSettings),
  ]);

  return { camera, photos, location };
}

/**
 * Open app settings (platform-specific)
 */
export function openAppSettings() {
  // This would need to be implemented with expo-linking or native code
  // For now, just log
  console.log('Opening app settings...');
}
