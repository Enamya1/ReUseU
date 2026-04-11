/**
 * Home Screen
 * Main product browsing screen with animated expandable search
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
  TextInput,
  Keyboard,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useTheme } from '../../src/contexts/ThemeContext';
import { useAuth } from '../../src/contexts/AuthContext';
import { spacing } from '../../src/theme/spacing';
import { Product, MetaCategoryOption } from '../../src/types';
import { ProductGrid } from '../../src/components/products/ProductGrid';
import { ExchangeProductGrid } from '../../src/components/products/ExchangeProductGrid';
import { Chip } from '../../src/components/ui/Badge';
import { getRecommendedProducts, searchProducts } from '../../src/services/productService';

const HEADER_EXPANDED_HEIGHT = 140;
const HEADER_COLLAPSED_HEIGHT = 80;
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
  const [searchExpanded, setSearchExpanded] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [showExchange, setShowExchange] = useState(false);

  const scrollY = useRef(new Animated.Value(0)).current;
  const searchWidth = useRef(new Animated.Value(44)).current;
  const searchOpacity = useRef(new Animated.Value(0)).current;
  const searchInputRef = useRef<TextInput>(null);
  
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

  const handleSearchIconPress = () => {
    setSearchExpanded(true);
    Animated.parallel([
      Animated.spring(searchWidth, {
        toValue: 300,
        useNativeDriver: false,
        tension: 50,
        friction: 7,
      }),
      Animated.timing(searchOpacity, {
        toValue: 1,
        duration: 200,
        useNativeDriver: false,
      }),
    ]).start(() => {
      searchInputRef.current?.focus();
    });
  };

  const handleSearchClose = () => {
    setSearchExpanded(false);
    setSearchQuery('');
    Keyboard.dismiss();
    Animated.parallel([
      Animated.spring(searchWidth, {
        toValue: 44,
        useNativeDriver: false,
        tension: 50,
        friction: 7,
      }),
      Animated.timing(searchOpacity, {
        toValue: 0,
        duration: 150,
        useNativeDriver: false,
      }),
    ]).start();
    if (searchQuery) {
      fetchProducts();
    }
  };

  const handleSearch = useCallback(async (query: string) => {
    if (!query.trim()) {
      fetchProducts();
      return;
    }

    setIsSearching(true);
    setError(null);

    try {
      const response = await searchProducts({
        q: query.trim(),
        page: 1,
        page_size: 20,
      });
      setProducts(response.products);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Search failed';
      setError(errorMessage);
    } finally {
      setIsSearching(false);
    }
  }, [fetchProducts]);

  const handleSearchSubmit = () => {
    if (searchQuery.trim()) {
      handleSearch(searchQuery);
    }
  };

  const handleScroll = Animated.event(
    [{ nativeEvent: { contentOffset: { y: scrollY } } }],
    { useNativeDriver: false }
  );

  const filteredProducts =
    selectedCategory === 'all'
      ? products
      : products.filter((product) => product.category_id === selectedCategory);

  const handleExchangeProductPress = (item: any) => {
    router.push(`/exchange-product/${item.exchange_product?.id || item.product?.id}`);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Animated.View 
        style={[
          styles.header, 
          { 
            paddingTop: insets.top,
            height: headerHeight,
            backgroundColor: colors.background,
          }
        ]}
      >
        <View style={styles.headerTop}>
          <Animated.View style={{
            opacity: headerOpacity,
            transform: [{ translateY: headerTranslateY }],
            flex: 1,
          }}>
            <Text style={[styles.greeting, { color: colors.textSecondary }]}>
              Hello, {user?.full_name || user?.username || 'there'}
            </Text>
            <Text style={[styles.title, { color: colors.text }]}>
              {showExchange ? 'Exchange Items' : 'Discover Items'}
            </Text>
          </Animated.View>
          <TouchableOpacity
            style={[styles.exchangeBtn, { backgroundColor: showExchange ? colors.primary : colors.surfaceSecondary }]}
            onPress={() => setShowExchange(!showExchange)}
          >
            <Text style={[styles.exchangeIcon, { color: showExchange ? '#FFF' : colors.text }]}>🔄</Text>
          </TouchableOpacity>
        </View>
        
        <Animated.View style={[styles.searchContainer, { width: searchWidth }]}>
          {!searchExpanded ? (
            <TouchableOpacity
              style={[styles.searchIconButton, { backgroundColor: colors.surfaceSecondary }]}
              onPress={handleSearchIconPress}
            >
              <Text style={[styles.searchIconText, { color: colors.text }]}>🔍</Text>
            </TouchableOpacity>
          ) : (
            <Animated.View style={[styles.searchBarExpanded, { backgroundColor: colors.surfaceSecondary, opacity: searchOpacity }]}>
              <Text style={[styles.searchIconText, { color: colors.text }]}>🔍</Text>
              <TextInput
                ref={searchInputRef}
                style={[styles.searchInput, { color: colors.text }]}
                placeholder="Search products..."
                placeholderTextColor={colors.textTertiary}
                value={searchQuery}
                onChangeText={setSearchQuery}
                onSubmitEditing={handleSearchSubmit}
                returnKeyType="search"
              />
              <TouchableOpacity onPress={handleSearchClose} style={styles.closeButton}>
                <Text style={[styles.closeIcon, { color: colors.textSecondary }]}>✕</Text>
              </TouchableOpacity>
            </Animated.View>
          )}
        </Animated.View>
      </Animated.View>

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

      {isLoading || isSearching ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
            {isSearching ? 'Searching...' : 'Loading products...'}
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
      ) : showExchange ? (
        <ExchangeProductGrid
          onProductPress={handleExchangeProductPress}
          onRefresh={handleRefresh}
          isRefreshing={isRefreshing}
          onScroll={handleScroll}
        />
      ) : (
        <ProductGrid
          products={filteredProducts}
          onProductPress={handleProductPress}
          onRefresh={handleRefresh}
          isRefreshing={isRefreshing}
          emptyMessage={searchQuery ? `No results for "${searchQuery}"` : "No products available"}
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
  headerTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
  },
  exchangeBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  exchangeIcon: {
    fontSize: 20,
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
  searchContainer: {
    height: 44,
    marginTop: spacing.sm,
  },
  searchIconButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchIconText: {
    fontSize: 18,
  },
  searchBarExpanded: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    height: 44,
    borderRadius: 22,
    paddingHorizontal: spacing.md,
  },

  searchInput: {
    flex: 1,
    fontSize: 16,
    marginLeft: spacing.sm,
    marginRight: spacing.sm,
  },
  closeButton: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeIcon: {
    fontSize: 18,
    fontWeight: '600',
  },
  categoriesList: {
    paddingBottom: spacing.sm,
  },
  categoriesSection: {
    marginBottom: spacing.md,
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
