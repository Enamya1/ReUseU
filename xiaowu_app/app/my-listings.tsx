/**
 * My Listings Screen
 * User's own product listings
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useTheme } from '../src/contexts/ThemeContext';
import { spacing } from '../src/theme/spacing';
import { Product } from '../src/types';
import { ProductList } from '../src/components/products/ProductList';
import { Button } from '../src/components/ui/Button';

// Mock data
const myListings: Product[] = [
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
  {
    id: 2,
    seller_id: 1,
    dormitory_id: 1,
    category_id: 2,
    condition_level_id: 2,
    title: 'Desk Lamp',
    description: 'Like new',
    price: 15,
    status: 'sold',
    created_at: new Date(Date.now() - 86400000).toISOString(),
    images: [],
    tags: [],
  },
];

export default function MyListingsScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [listings] = useState<Product[]>(myListings);
  const [filter, setFilter] = useState<'all' | 'available' | 'sold'>('all');

  const filteredListings = listings.filter((item) => {
    if (filter === 'all') return true;
    return item.status === filter;
  });

  const handleProductPress = (product: Product) => {
    router.push(`/product/${product.id}`);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Filter Tabs */}
      <View style={[styles.filterRow, { paddingTop: insets.top }]}>
        {(['all', 'available', 'sold'] as const).map((status) => (
          <TouchableOpacity
            key={status}
            style={[
              styles.filterTab,
              filter === status && { backgroundColor: colors.primary },
            ]}
            onPress={() => setFilter(status)}
          >
            <Text
              style={[
                styles.filterText,
                { color: filter === status ? '#FFF' : colors.text },
              ]}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Listings */}
      <ProductList
        products={filteredListings}
        onProductPress={handleProductPress}
        emptyMessage="No listings found"
      />

      {/* Create Button */}
      <View style={styles.createButton}>
        <Button
          title="+ Create Listing"
          onPress={() => router.push('/create-listing')}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: spacing.screenPadding,
    paddingVertical: spacing.md,
  },
  filterTab: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: spacing.sm,
    marginRight: spacing.sm,
  },
  filterText: {
    fontSize: 14,
    fontWeight: '500',
  },
  createButton: {
    position: 'absolute',
    bottom: spacing.lg,
    left: spacing.screenPadding,
    right: spacing.screenPadding,
  },
});
