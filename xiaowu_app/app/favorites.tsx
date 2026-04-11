/**
 * Favorites Screen
 * User's favorite products
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useTheme } from '../src/contexts/ThemeContext';
import { spacing } from '../src/theme/spacing';
import { Product } from '../src/types';
import { ProductGrid } from '../src/components/products/ProductGrid';
import { getFavorites } from '../src/services/favoritesService';

export default function FavoritesScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [favorites, setFavorites] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadFavorites();
  }, []);

  const loadFavorites = async () => {
    try {
      setLoading(true);
      const response = await getFavorites();
      console.log('Favorites API Response:', JSON.stringify(response, null, 2));
      console.log('Number of favorites:', response.products?.length || 0);
      
      if (response.products && response.products.length > 0) {
        console.log('First favorite product:', JSON.stringify(response.products[0], null, 2));
      }
      
      setFavorites(response.products || []);
    } catch (error) {
      console.error('Error loading favorites:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadFavorites();
    setRefreshing(false);
  }, []);

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
      <ProductGrid
        products={favorites}
        onProductPress={handleProductPress}
        onRefresh={handleRefresh}
        isRefreshing={refreshing}
        emptyMessage="No favorites yet"
        hideSeller={true}
      />
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
});
