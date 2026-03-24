/**
 * Favorites Screen
 * User's favorite products
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useTheme } from '../src/contexts/ThemeContext';
import { spacing } from '../src/theme/spacing';
import { Product } from '../src/types';
import { ProductGrid } from '../src/components/products/ProductGrid';

// Mock data
const mockFavorites: Product[] = [
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

export default function FavoritesScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [favorites] = useState<Product[]>(mockFavorites);

  const handleProductPress = (product: Product) => {
    router.push(`/product/${product.id}`);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ProductGrid
        products={favorites}
        onProductPress={handleProductPress}
        emptyMessage="No favorites yet"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
