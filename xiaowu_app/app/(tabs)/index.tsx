/**
 * Home Screen
 * Main product browsing screen with collapsing header animation
 */

import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Animated,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useTheme } from '../../src/contexts/ThemeContext';
import { useAuth } from '../../src/contexts/AuthContext';
import { spacing } from '../../src/theme/spacing';
import { Product, MetaCategoryOption } from '../../src/types';
import { ProductGrid } from '../../src/components/products/ProductGrid';
import { Chip } from '../../src/components/ui/Badge';
import { getRecommendedProducts } from '../../src/services/productService';

const HEADER_EXPANDED_HEIGHT = 100;
const HEADER_COLLAPSED_HEIGHT = 60;
type HomeCategory = { id: 'all' | number; name: string };

export default function HomeScreen() {
  const { colors } = useTheme();
  const { user, getMetaOptions } = useAuth();
  const insets = useSafeAreaInsets();
  const [selectedCategory, setSelectedCategory] = useState<'all' | number>('all');
  const [categories, setCategories] = useState<HomeCategory[]>([{ id: 'all', name: 'All' }]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [products, setProducts] = useState<Product[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Animation values
  const scrollY = useRef(new Animated.Value(0)).current;
  
  // Header animations - only collapse after scrolling past threshold
  const headerOpacity = scrollY.interpolate({
    inputRange: [0, 20, 80],
    outputRange: [1, 1, 0],
    extrapolate: 'clamp',
  });
  const headerTranslateY = scrollY.interpolate({
    inputRange: [0, 20, 80],
    outputRange: [0, 0, -20],
    extrapolate: 'clamp',
  });
  const headerHeight = scrollY.interpolate({
    inputRange: [0, 80],
    outputRange: [HEADER_EXPANDED_HEIGHT, HEADER_COLLAPSED_HEIGHT],
    extrapolate: 'clamp',
  });

  // Fetch recommended products
  const fetchProducts = useCallback(async (isRefresh = false) => {
    if (isRefresh) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }
    setError(null);

    try {
      const response = await getRecommendedProducts({
        page: 1,
        page_size: 20,
        random_count: 5,
        lookback_days: 30,
      });
      setProducts(response.products);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load products';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  // Initial fetch
  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  useEffect(() => {
    let cancelled = false;

    const fetchCategories = async () => {
      try {
        const data = await getMetaOptions();
        if (cancelled) return;
        const apiCategories = Array.isArray(data.categories) ? data.categories : [];
        const mappedCategories: HomeCategory[] = [
          { id: 'all', name: 'All' },
          ...apiCategories
            .filter((category): category is MetaCategoryOption => typeof category.id === 'number')
            .map((category) => ({
              id: category.id,
              name: category.name || `Category ${category.id}`,
            })),
        ];
        setCategories(mappedCategories);
      } catch {
        if (cancelled) return;
        setCategories([{ id: 'all', name: 'All' }]);
      }
    };

    fetchCategories();
    return () => {
      cancelled = true;
    };
  }, [getMetaOptions]);

  const handleRefresh = useCallback(async () => {
    await fetchProducts(true);
  }, [fetchProducts]);

  const handleProductPress = (product: Product) => {
    router.push(`/product/${product.id}`);
  };

  const handleSearchPress = () => {
    router.push('/search');
  };

  const handleScroll = Animated.event(
    [{ nativeEvent: { contentOffset: { y: scrollY } } }],
    { useNativeDriver: false }
  );

  const filteredProducts =
    selectedCategory === 'all'
      ? products
      : products.filter((product) => product.category_id === selectedCategory);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Animated Header */}
      <Animated.View 
        style={[
          styles.header, 
          { 
            paddingTop: insets.top,
            height: headerHeight,
          }
        ]}
      >
        <Animated.View style={{
          opacity: headerOpacity,
          transform: [{ translateY: headerTranslateY }],
        }}>
          <Text style={[styles.greeting, { color: colors.textSecondary }]}>
            Hello, {user?.full_name || user?.username || 'there'}
          </Text>
          <Text style={[styles.title, { color: colors.text }]}>
            Discover Items
          </Text>
        </Animated.View>
        
        {/* Search Bar - Always visible */}
        <TouchableOpacity
          style={[styles.searchBar, { backgroundColor: colors.surfaceSecondary }]}
          onPress={handleSearchPress}
        >
          <Text style={styles.searchIcon}>🔍</Text>
          <Text style={[styles.searchPlaceholder, { color: colors.textTertiary }]}>
            Search products...
          </Text>
        </TouchableOpacity>
      </Animated.View>

      {/* Categories */}
      <View style={styles.categoriesSection}>
        <FlatList
          horizontal
          data={categories}
          keyExtractor={(item) => String(item.id)}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={[styles.categoriesList, { paddingHorizontal: spacing.screenPadding }]}
          renderItem={({ item }) => (
            <Chip
              label={item.name}
              selected={selectedCategory === item.id}
              onPress={() => setSelectedCategory(item.id)}
              style={{ marginRight: spacing.sm }}
            />
          )}
        />
      </View>

      {/* Loading State */}
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
            Loading products...
          </Text>
        </View>
      ) : error ? (
        <View style={styles.errorContainer}>
          <Text style={styles.errorIcon}>⚠️</Text>
          <Text style={[styles.errorText, { color: colors.textSecondary }]}>
            {error}
          </Text>
          <TouchableOpacity
            style={[styles.retryButton, { backgroundColor: colors.primary }]}
            onPress={() => fetchProducts()}
          >
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        /* Products Grid */
        <ProductGrid
          products={filteredProducts}
          onProductPress={handleProductPress}
          onRefresh={handleRefresh}
          isRefreshing={isRefreshing}
          emptyMessage="No products available"
          onScroll={handleScroll}
        />
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
    overflow: 'hidden',
  },
  greeting: {
    fontSize: 14,
    marginBottom: spacing.xs,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: spacing.md,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 44,
    borderRadius: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  searchIcon: {
    fontSize: 18,
    marginRight: spacing.sm,
  },
  searchPlaceholder: {
    fontSize: 16,
  },
  categoriesList: {
    paddingBottom: spacing.sm,
  },
  categoriesSection: {
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    paddingHorizontal: spacing.screenPadding,
    marginBottom: spacing.sm,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing['4xl'],
  },
  loadingText: {
    marginTop: spacing.md,
    fontSize: 14,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing['4xl'],
    paddingHorizontal: spacing.screenPadding,
  },
  errorIcon: {
    fontSize: 48,
    marginBottom: spacing.md,
  },
  errorText: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  retryButton: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: spacing.radius.md,
  },
  retryButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
});
