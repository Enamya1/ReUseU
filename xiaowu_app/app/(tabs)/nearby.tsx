/**
 * Nearby Screen
 * Map-based nearby products view
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
import { useTheme } from '../../src/contexts/ThemeContext';
import { spacing } from '../../src/theme/spacing';
import { Product } from '../../src/types';
import { ProductList } from '../../src/components/products/ProductList';
import { Button } from '../../src/components/ui/Button';

// Mock data
const mockProducts: Product[] = [
  {
    id: 1,
    seller_id: 1,
    dormitory_id: 1,
    category_id: 1,
    condition_level_id: 1,
    title: 'Calculus Textbook',
    description: 'Good condition, some highlights',
    price: 45,
    status: 'available',
    created_at: new Date().toISOString(),
    images: [],
    tags: [],
    distance_km: 0.5,
  },
  {
    id: 2,
    seller_id: 2,
    dormitory_id: 1,
    category_id: 2,
    condition_level_id: 2,
    title: 'Desk Lamp',
    description: 'LED desk lamp, barely used',
    price: 15,
    status: 'available',
    created_at: new Date().toISOString(),
    images: [],
    tags: [],
    distance_km: 1.2,
  },
];

export default function NearbyScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [products] = useState<Product[]>(mockProducts);
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');

  const handleProductPress = (product: Product) => {
    router.push(`/product/${product.id}`);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top }]}>
        <Text style={[styles.title, { color: colors.text }]}>
          Nearby Items
        </Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          Find items close to you
        </Text>

        {/* View Toggle */}
        <View style={styles.viewToggle}>
          <TouchableOpacity
            style={[
              styles.toggleButton,
              viewMode === 'list' && { backgroundColor: colors.primary },
            ]}
            onPress={() => setViewMode('list')}
          >
            <Text style={{ color: viewMode === 'list' ? '#FFF' : colors.text }}>
              List
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.toggleButton,
              viewMode === 'map' && { backgroundColor: colors.primary },
            ]}
            onPress={() => setViewMode('map')}
          >
            <Text style={{ color: viewMode === 'map' ? '#FFF' : colors.text }}>
              Map
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Content */}
      {viewMode === 'list' ? (
        <ProductList
          products={products}
          onProductPress={handleProductPress}
          emptyMessage="No items nearby"
        />
      ) : (
        <View style={styles.mapPlaceholder}>
          <Text style={styles.mapIcon}>🗺️</Text>
          <Text style={[styles.mapText, { color: colors.textSecondary }]}>
            Map view coming soon
          </Text>
          <Text style={[styles.mapHint, { color: colors.textTertiary }]}>
            Enable location to see items on the map
          </Text>
        </View>
      )}
    </View>
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
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontSize: 16,
    marginBottom: spacing.md,
  },
  viewToggle: {
    flexDirection: 'row',
    borderRadius: spacing.sm,
    overflow: 'hidden',
  },
  toggleButton: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  mapPlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mapIcon: {
    fontSize: 64,
    marginBottom: spacing.lg,
  },
  mapText: {
    fontSize: 18,
    fontWeight: '500',
    marginBottom: spacing.sm,
  },
  mapHint: {
    fontSize: 14,
  },
});
