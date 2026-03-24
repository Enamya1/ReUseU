/**
 * Profile Screen
 * User profile and settings
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useTheme } from '../../src/contexts/ThemeContext';
import { useAuth } from '../../src/contexts/AuthContext';
import { spacing } from '../../src/theme/spacing';
import { Avatar } from '../../src/components/ui/Avatar';
import { Button } from '../../src/components/ui/Button';
import { Divider } from '../../src/components/ui/Divider';

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

  const handleLogout = async () => {
    await logout();
    router.replace('/(auth)/login');
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
        <Avatar
          source={user?.profile_picture ? { uri: user.profile_picture } : undefined}
          name={user?.full_name || user?.username}
          size="xl"
        />
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
      <View style={styles.menuSection}>
        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
          Account
        </Text>
        <View style={[styles.menuCard, { backgroundColor: colors.card }]}>
          <MenuItem
            icon="📦"
            label="My Listings"
            onPress={() => router.push('/my-listings')}
          />
          <Divider />
          <MenuItem
            icon="❤️"
            label="Favorites"
            onPress={() => router.push('/favorites')}
          />
          <Divider />
          <MenuItem
            icon="💳"
            label="Wallet"
            onPress={() => router.push('/wallet')}
          />
        </View>
      </View>

      <View style={styles.menuSection}>
        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
          Settings
        </Text>
        <View style={[styles.menuCard, { backgroundColor: colors.card }]}>
          <MenuItem
            icon="🌐"
            label="Language"
            onPress={() => {}}
            rightElement={<Text style={{ color: colors.textSecondary }}>English</Text>}
          />
          <Divider />
          <MenuItem
            icon="💱"
            label="Currency"
            onPress={() => {}}
            rightElement={<Text style={{ color: colors.textSecondary }}>CNY</Text>}
          />
          <Divider />
          <MenuItem
            icon="🔔"
            label="Notifications"
            onPress={() => {}}
          />
        </View>
      </View>

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
});
