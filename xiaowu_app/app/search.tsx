/**
 * Search Screen
 * Search products
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useTheme } from '../src/contexts/ThemeContext';
import { spacing } from '../src/theme/spacing';
import { Product } from '../src/types';
import { ProductGrid } from '../src/components/products/ProductGrid';

// Mock data
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

export default function SearchScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [searchQuery, setSearchQuery] = useState('');
  const [products] = useState<Product[]>(mockProducts);

  const handleProductPress = (product: Product) => {
    router.push(`/product/${product.id}`);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Search Header */}
      <View style={[styles.header, { paddingTop: insets.top }]}>
        <View style={styles.searchRow}>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={styles.backIcon}>←</Text>
          </TouchableOpacity>
          <TextInput
            style={[styles.searchInput, { backgroundColor: colors.surfaceSecondary }]}
            placeholder="Search products..."
            placeholderTextColor={colors.textTertiary}
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoFocus
          />
        </View>
      </View>

      {/* Results */}
      <ProductGrid
        products={products}
        onProductPress={handleProductPress}
        emptyMessage={searchQuery ? `No results for "${searchQuery}"` : 'Start typing to search'}
      />
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
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backIcon: {
    fontSize: 24,
    marginRight: spacing.md,
  },
  searchInput: {
    flex: 1,
    height: 44,
    borderRadius: spacing.sm,
    paddingHorizontal: spacing.md,
    fontSize: 16,
  },
});
