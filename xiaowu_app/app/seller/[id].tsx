/**
 * Seller Profile Screen
 * View seller's profile and listings
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../src/contexts/ThemeContext';
import { spacing } from '../../src/theme/spacing';
import { Product } from '../../src/types';
import { Avatar } from '../../src/components/ui/Avatar';
import { Button } from '../../src/components/ui/Button';
import { ProductGrid } from '../../src/components/products/ProductGrid';
import { LoadingFullPage } from '../../src/components/ui/Loading';
import { getSellerProfile } from '../../src/services/productService';
import { useAuth } from '../../src/contexts/AuthContext';
import { normalizeImageUrl } from '../../src/services/api';

export default function SellerProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { user: currentUser } = useAuth();
  
  const [sellerProfile, setSellerProfile] = useState<any>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSellerProfile = async () => {
    if (!id) return;
    
    try {
      setIsLoading(true);
      setError(null);
      const sellerId = parseInt(id);
      const data = await getSellerProfile(sellerId, { page: 1, page_size: 50 });
      
      setSellerProfile(data.seller);
      setProducts(data.products || []);
    } catch (err: any) {
      console.error('Failed to fetch seller profile:', err);
      setError(err.message || 'Failed to load seller profile');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchSellerProfile();
  }, [id]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchSellerProfile();
  };

  const handleMessagePress = () => {
    if (sellerProfile && currentUser && sellerProfile.id !== currentUser.id) {
      router.push({
        pathname: '/chat/[id]',
        params: {
          id: 'new',
          receiverId: sellerProfile.id,
          receiverName: sellerProfile.name || sellerProfile.username,
        },
      });
    }
  };

  const handleProductPress = (product: Product) => {
    router.push(`/product/${product.id}`);
  };

  if (isLoading) {
    return <LoadingFullPage message="Loading profile..." />;
  }

  if (error || !sellerProfile) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.errorContainer}>
          <Text style={[styles.errorText, { color: colors.textSecondary }]}>
            {error || 'Seller not found'}
          </Text>
          <Button
            title="Retry"
            onPress={fetchSellerProfile}
            style={styles.retryButton}
          />
        </View>
      </View>
    );
  }

  const profilePicture = sellerProfile.profile_picture
    ? { uri: normalizeImageUrl(sellerProfile.profile_picture) }
    : undefined;

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={{ paddingBottom: insets.bottom + spacing['2xl'] }}
      refreshControl={
        <RefreshControl
          refreshing={isRefreshing}
          onRefresh={handleRefresh}
          tintColor={colors.primary}
        />
      }
    >
      {/* Profile Header */}
      <View style={styles.header}>
        <Avatar
          source={profilePicture}
          name={sellerProfile.name || sellerProfile.username}
          size="2xl"
        />
        <Text style={[styles.name, { color: colors.text }]}>
          {sellerProfile.name || 'Unknown'}
        </Text>
        {sellerProfile.username && (
          <Text style={[styles.username, { color: colors.textSecondary }]}>
            @{sellerProfile.username}
          </Text>
        )}
        {sellerProfile.bio && (
          <Text style={[styles.bio, { color: colors.textSecondary }]}>
            {sellerProfile.bio}
          </Text>
        )}
        {sellerProfile.dorm_name && sellerProfile.uni_name && (
          <Text style={[styles.location, { color: colors.textSecondary }]}>
            📍 {sellerProfile.dorm_name} - {sellerProfile.uni_name}
          </Text>
        )}
        {currentUser && sellerProfile.id !== currentUser.id && (
          <Button
            title="Message"
            onPress={handleMessagePress}
            style={styles.messageButton}
          />
        )}
      </View>

      {/* Stats */}
      <View style={styles.statsRow}>
        <View style={styles.stat}>
          <Text style={[styles.statValue, { color: colors.text }]}>
            {sellerProfile.listed_products_count || products.length}
          </Text>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
            Listings
          </Text>
        </View>
        {sellerProfile.sales_count !== undefined && (
          <View style={styles.stat}>
            <Text style={[styles.statValue, { color: colors.text }]}>
              {sellerProfile.sales_count}
            </Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
              Sales
            </Text>
          </View>
        )}
        {sellerProfile.average_condition_level && (
          <View style={styles.stat}>
            <Text style={[styles.statValue, { color: colors.text }]}>
              {sellerProfile.average_condition_level.toFixed(1)}
            </Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
              Avg Condition
            </Text>
          </View>
        )}
        {sellerProfile.email_verified && (
          <View style={styles.stat}>
            <Text style={[styles.statValue, { color: colors.success }]}>
              ✓
            </Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
              Verified
            </Text>
          </View>
        )}
      </View>

      {/* Member Info */}
      {sellerProfile.member_since && (
        <View style={styles.memberInfo}>
          <Text style={[styles.memberText, { color: colors.textSecondary }]}>
            Member since {sellerProfile.member_since}
          </Text>
        </View>
      )}

      {/* Listings */}
      <View style={styles.listingsSection}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          Listings ({products.length})
        </Text>
        {products.length > 0 ? (
          <ProductGrid
            products={products}
            onProductPress={handleProductPress}
            emptyMessage="No listings yet"
            numColumns={2}
          />
        ) : (
          <View style={styles.emptyState}>
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              No listings yet
            </Text>
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    alignItems: 'center',
    padding: spacing.lg,
  },
  name: {
    fontSize: 24,
    fontWeight: '700',
    marginTop: spacing.md,
  },
  username: {
    fontSize: 16,
    marginTop: spacing.xs,
  },
  bio: {
    fontSize: 14,
    textAlign: 'center',
    marginTop: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  location: {
    fontSize: 14,
    textAlign: 'center',
    marginTop: spacing.sm,
    paddingHorizontal: spacing.lg,
  },
  messageButton: {
    marginTop: spacing.lg,
    minWidth: 150,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: spacing.lg,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
  },
  stat: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
  },
  statLabel: {
    fontSize: 12,
    marginTop: spacing.xs,
  },
  memberInfo: {
    padding: spacing.md,
    alignItems: 'center',
  },
  memberText: {
    fontSize: 13,
  },
  listingsSection: {
    padding: spacing.screenPadding,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: spacing.md,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  errorText: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  retryButton: {
    minWidth: 120,
  },
  emptyState: {
    padding: spacing.xl,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
  },
});
