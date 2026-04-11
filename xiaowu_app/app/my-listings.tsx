/**
 * My Listings Screen
 * User's own product listings
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useTheme } from '../src/contexts/ThemeContext';
import { spacing } from '../src/theme/spacing';
import { Product } from '../src/types';
import { ProductList } from '../src/components/products/ProductList';
import { Button } from '../src/components/ui/Button';
import { getMyProducts } from '../src/services/productService';

export default function MyListingsScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [listings, setListings] = useState<Product[]>([]);
  const [filter, setFilter] = useState<'all' | 'available' | 'sold'>('all');
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    loadListings();
  }, [filter, page]);

  const loadListings = async () => {
    try {
      setLoading(true);
      const status = filter === 'all' ? undefined : filter;
      const response = await getMyProducts({ page, page_size: 20, status });
      setListings(response.products);
      setTotal(response.total);
    } catch (error) {
      console.error('Error loading listings:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredListings = listings.filter((item) => {
    if (filter === 'all') return true;
    return item.status === filter;
  });

  const handleProductPress = (product: Product) => {
    router.push(`/product/${product.id}`);
  };

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </View>
    );
  }

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
            onPress={() => {
              setFilter(status);
              setPage(1);
            }}
          >
            <Text
              style={[
                styles.filterText,
                { color: filter === status ? '#FFF' : colors.text },
              ]}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)} ({status === 'all' ? total : listings.length})
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Listings */}
      <ProductList
        products={listings}
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
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
