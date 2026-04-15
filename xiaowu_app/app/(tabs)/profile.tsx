/**
 * Profile Screen
 * User profile and settings
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useTheme } from '../../src/contexts/ThemeContext';
import { useAuth } from '../../src/contexts/AuthContext';
import { spacing } from '../../src/theme/spacing';
import { Avatar } from '../../src/components/ui/Avatar';
import { Button } from '../../src/components/ui/Button';
import { Divider } from '../../src/components/ui/Divider';
import { ImagePickerModal } from '../../src/components/ui/ImagePickerModal';
import { useImagePicker } from '../../src/hooks/useImagePicker';
import { getWallets } from '../../src/services/walletService';
import { getLanguage, updateLanguage, uploadProfilePicture } from '../../src/services/authService';
import { getMyProducts } from '../../src/services/productService';
import { getFavorites } from '../../src/services/favoritesService';
import { getMessageNotifications } from '../../src/services/messageService';

interface MenuItemProps {
  icon: string;
  label: string;
  onPress?: () => void;
  rightElement?: React.ReactNode;
}

const MenuItem: React.FC<MenuItemProps> = ({ icon, label, onPress, rightElement }) => {
  const { colors } = useTheme();
  
  return (
    <TouchableOpacity
      style={styles.menuItem}
      onPress={onPress}
      disabled={!onPress}
    >
      <Text style={styles.menuIcon}>{icon}</Text>
      <Text style={[styles.menuLabel, { color: colors.text }]}>{label}</Text>
      {rightElement || <Text style={[styles.menuArrow, { color: colors.textTertiary }]}>›</Text>}
    </TouchableOpacity>
  );
};

export default function ProfileScreen() {
  const { colors } = useTheme();
  const { user, logout } = useAuth();
  const insets = useSafeAreaInsets();
  const [walletBalance, setWalletBalance] = useState<string>('0.00');
  const [currency, setCurrency] = useState<string>('CNY');
  const [language, setLanguage] = useState<string>('English');
  const [listingsCount, setListingsCount] = useState<number>(0);
  const [favoritesCount, setFavoritesCount] = useState<number>(0);
  const [notificationsCount, setNotificationsCount] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [showImagePicker, setShowImagePicker] = useState(false);
  const [profileImageUri, setProfileImageUri] = useState<string | null>(null);
  const { pickImage, takePhoto, isLoading: imageLoading } = useImagePicker();

  useEffect(() => {
    if (user) {
      loadProfileData();
    }
  }, [user]);

  const loadProfileData = async () => {
    try {
      setLoading(true);
      const [walletsRes, langRes, listingsRes, favoritesRes, notificationsRes] = await Promise.allSettled([
        getWallets(),
        getLanguage(),
        getMyProducts({ page: 1, page_size: 1 }),
        getFavorites(),
        getMessageNotifications({ limit: 1 }),
      ]);

      if (walletsRes.status === 'fulfilled' && walletsRes.value.length > 0) {
        const primaryWallet = walletsRes.value[0];
        setWalletBalance(primaryWallet.balance || '0.00');
        setCurrency(primaryWallet.currency || 'CNY');
      }

      if (langRes.status === 'fulfilled') {
        const langMap: Record<string, string> = { en: 'English', zh: '中文', ar: 'العربية' };
        setLanguage(langMap[langRes.value] || 'English');
      }

      if (listingsRes.status === 'fulfilled') {
        setListingsCount(listingsRes.value.total || 0);
      }

      if (favoritesRes.status === 'fulfilled') {
        setFavoritesCount(favoritesRes.value.total || favoritesRes.value.products?.length || 0);
      }

      if (notificationsRes.status === 'fulfilled') {
        setNotificationsCount(notificationsRes.value.total || 0);
      }
    } catch (error) {
      console.error('Error loading profile data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    router.replace('/(auth)/login');
  };

  const handleAvatarPress = () => {
    setShowImagePicker(true);
  };

  const handleCameraSelect = async () => {
    const result = await takePhoto();
    if (result) {
      setProfileImageUri(result.uri);
      await uploadProfilePictureHandler(result.uri);
    }
  };

  const handleGallerySelect = async () => {
    const result = await pickImage();
    if (result) {
      setProfileImageUri(result.uri);
      await uploadProfilePictureHandler(result.uri);
    }
  };

  const uploadProfilePictureHandler = async (uri: string) => {
    try {
      await uploadProfilePicture(uri);
      // Refresh user data
      await loadProfileData();
    } catch (error) {
      console.error('Error uploading profile picture:', error);
    }
  };

  const handleLanguagePress = () => {
    router.push('/language-settings');
  };

  const handleNotificationPress = () => {
    router.push('/notifications');
  };

  const handleCurrencyPress = () => {
    router.push('/currency-settings');
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={{ paddingBottom: insets.bottom + spacing['2xl'] }}
    >
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top }]}>
        <Text style={[styles.title, { color: colors.text }]}>
          Profile
        </Text>
      </View>

      {/* Profile Card */}
      <View style={[styles.profileCard, { backgroundColor: colors.card }]}>
        <TouchableOpacity onPress={handleAvatarPress} disabled={imageLoading}>
          <Avatar
            source={profileImageUri ? { uri: profileImageUri } : user?.profile_picture ? { uri: user.profile_picture } : undefined}
            name={user?.full_name || user?.username}
            size="xl"
          />
          <View style={[styles.cameraIcon, { backgroundColor: colors.primary }]}>
            <Text style={styles.cameraIconText}>📷</Text>
          </View>
        </TouchableOpacity>
        <Text style={[styles.userName, { color: colors.text }]}>
          {user?.full_name || 'Guest User'}
        </Text>
        <Text style={[styles.userEmail, { color: colors.textSecondary }]}>
          {user?.email || 'Sign in to your account'}
        </Text>
        {!user && (
          <Button
            title="Sign In"
            onPress={() => router.push('/(auth)/login')}
            style={styles.signInButton}
          />
        )}
      </View>

      {/* Menu Sections */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color={colors.primary} />
        </View>
      ) : (
        <>
          <View style={styles.menuSection}>
            <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
              Account
            </Text>
            <View style={[styles.menuCard, { backgroundColor: colors.card }]}>
              <MenuItem
                icon="📦"
                label="My Listings"
                onPress={() => router.push('/my-listings')}
                rightElement={<Text style={{ color: colors.textSecondary }}>{listingsCount}</Text>}
              />
              <Divider />
              <MenuItem
                icon="❤️"
                label="Favorites"
                onPress={() => router.push('/favorites')}
                rightElement={<Text style={{ color: colors.textSecondary }}>{favoritesCount}</Text>}
              />
              <Divider />
              <MenuItem
                icon="💳"
                label="Wallet"
                onPress={() => router.push('/wallet')}
                rightElement={<Text style={{ color: colors.textSecondary }}>{currency} {walletBalance}</Text>}
              />
            </View>
          </View>
        </>
      )}

      {!loading && (
        <View style={styles.menuSection}>
          <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
            Settings
          </Text>
          <View style={[styles.menuCard, { backgroundColor: colors.card }]}>
            <MenuItem
              icon="🌐"
              label="Language"
              onPress={handleLanguagePress}
              rightElement={<Text style={{ color: colors.textSecondary }}>{language}</Text>}
            />
            <Divider />
            <MenuItem
              icon="💱"
              label="Currency"
              onPress={handleCurrencyPress}
              rightElement={<Text style={{ color: colors.textSecondary }}>{currency}</Text>}
            />
            <Divider />
            <MenuItem
              icon="🔔"
              label="Notifications"
              onPress={handleNotificationPress}
              rightElement={notificationsCount > 0 ? <Text style={{ color: colors.destructive }}>{notificationsCount}</Text> : undefined}
            />
          </View>
        </View>
      )}

      <View style={styles.menuSection}>
        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
          Support
        </Text>
        <View style={[styles.menuCard, { backgroundColor: colors.card }]}>
          <MenuItem
            icon="❓"
            label="Help Center"
            onPress={() => {}}
          />
          <Divider />
          <MenuItem
            icon="📄"
            label="Terms of Service"
            onPress={() => {}}
          />
          <Divider />
          <MenuItem
            icon="🔒"
            label="Privacy Policy"
            onPress={() => {}}
          />
        </View>
      </View>

      {/* Logout Button */}
      {user && (
        <View style={styles.logoutSection}>
          <Button
            title="Sign Out"
            variant="outline"
            onPress={handleLogout}
            fullWidth
          />
        </View>
      )}

      {/* App Version */}
      <Text style={[styles.version, { color: colors.textTertiary }]}>
        Version 1.0.0
      </Text>

      {/* Image Picker Modal */}
      <ImagePickerModal
        visible={showImagePicker}
        onClose={() => setShowImagePicker(false)}
        onCamera={handleCameraSelect}
        onGallery={handleGallerySelect}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: spacing.screenPadding,
    paddingBottom: spacing.md,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
  },
  profileCard: {
    alignItems: 'center',
    padding: spacing.lg,
    marginHorizontal: spacing.screenPadding,
    marginBottom: spacing.lg,
    borderRadius: spacing.md,
  },
  userName: {
    fontSize: 20,
    fontWeight: '600',
    marginTop: spacing.md,
  },
  userEmail: {
    fontSize: 14,
    marginTop: spacing.xs,
  },
  signInButton: {
    marginTop: spacing.lg,
    minWidth: 150,
  },
  menuSection: {
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    paddingHorizontal: spacing.screenPadding,
    marginBottom: spacing.sm,
  },
  menuCard: {
    marginHorizontal: spacing.screenPadding,
    borderRadius: spacing.md,
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
  },
  menuIcon: {
    fontSize: 20,
    marginRight: spacing.md,
  },
  menuLabel: {
    flex: 1,
    fontSize: 16,
  },
  menuArrow: {
    fontSize: 20,
  },
  logoutSection: {
    paddingHorizontal: spacing.screenPadding,
    marginTop: spacing.lg,
  },
  version: {
    textAlign: 'center',
    fontSize: 12,
    marginTop: spacing.lg,
  },
  loadingContainer: {
    padding: spacing.lg,
    alignItems: 'center',
  },
  cameraIcon: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cameraIconText: {
    fontSize: 16,
  },
});
