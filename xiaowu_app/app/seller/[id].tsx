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
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../src/contexts/ThemeContext';
import { spacing } from '../../src/theme/spacing';
import { Product, User } from '../../src/types';
import { Avatar } from '../../src/components/ui/Avatar';
import { Button } from '../../src/components/ui/Button';
import { ProductGrid } from '../../src/components/products/ProductGrid';
import { LoadingFullPage } from '../../src/components/ui/Loading';

// Mock data
const mockSeller: User = {
  id: 1,
  full_name: 'John Doe',
  username: 'johndoe',
  email: 'john@example.com',
  bio: 'Computer Science student selling textbooks and electronics.',
  role: 'user',
  status: 'active',
};

const mockProducts: Product[] = [
  {
    id: 1,
    seller_id: 1,
    dormitory_id: 1,
    category_id: 1,
    condition_level_id: 1,
    title: 'Calculus Textbook',
    description: 'Good condition',
    price: 45,
    status: 'available',
    created_at: new Date().toISOString(),
    images: [],
    tags: [],
  },
];

export default function SellerProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [seller, setSeller] = useState<User | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setTimeout(() => {
      setSeller(mockSeller);
      setProducts(mockProducts);
      setIsLoading(false);
    }, 500);
  }, [id]);

  const handleMessagePress = () => {
    if (seller) {
      router.push({
        pathname: '/messages',
        params: {
          receiverId: seller.id,
          receiverName: seller.full_name,
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

  if (!seller) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Text style={{ color: colors.text }}>Seller not found</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={{ paddingBottom: insets.bottom + spacing['2xl'] }}
    >
      {/* Profile Header */}
      <View style={styles.header}>
        <Avatar
          source={seller.profile_picture ? { uri: seller.profile_picture } : undefined}
          name={seller.full_name}
          size="2xl"
        />
        <Text style={[styles.name, { color: colors.text }]}>
          {seller.full_name}
        </Text>
        <Text style={[styles.username, { color: colors.textSecondary }]}>
          @{seller.username}
        </Text>
        {seller.bio && (
          <Text style={[styles.bio, { color: colors.textSecondary }]}>
            {seller.bio}
          </Text>
        )}
        <Button
          title="Message"
          onPress={handleMessagePress}
          style={styles.messageButton}
        />
      </View>

      {/* Stats */}
      <View style={styles.statsRow}>
        <View style={styles.stat}>
          <Text style={[styles.statValue, { color: colors.text }]}>
            {products.length}
          </Text>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
            Listings
          </Text>
        </View>
        <View style={styles.stat}>
          <Text style={[styles.statValue, { color: colors.text }]}>4.8</Text>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
            Rating
          </Text>
        </View>
        <View style={styles.stat}>
          <Text style={[styles.statValue, { color: colors.text }]}>12</Text>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
            Sold
          </Text>
        </View>
      </View>

      {/* Listings */}
      <View style={styles.listingsSection}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          Listings
        </Text>
        <ProductGrid
          products={products}
          onProductPress={handleProductPress}
          emptyMessage="No listings yet"
          numColumns={2}
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
    fontSize: 14,
    marginTop: spacing.xs,
  },
  listingsSection: {
    padding: spacing.screenPadding,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: spacing.md,
  },
});
