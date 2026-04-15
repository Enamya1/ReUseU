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
  Image,
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
import { ImagePickerModal } from '../../src/components/ui/ImagePickerModal';
import { useImagePicker } from '../../src/hooks/useImagePicker';
import { getRecommendedProducts, searchProducts } from '../../src/services/productService';
import { toggleFavorite } from '../../src/services/favoritesService';

const HEADER_EXPANDED_HEIGHT = 100;
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
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [showExchange, setShowExchange] = useState(false);
  const [isSearchExpanded, setIsSearchExpanded] = useState(false);
  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);
  const [showImagePicker, setShowImagePicker] = useState(false);
  const { pickImage, takePhoto, isLoading: imageLoading } = useImagePicker();

  const scrollY = useRef(new Animated.Value(0)).current;
  const searchInputRef = useRef<TextInput>(null);
  
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

  const handleImageSearch = () => {
    setShowImagePicker(true);
  };

  const handleCameraSelect = async () => {
    const result = await takePhoto();
    if (result) {
      router.push({
        pathname: '/visual-search-results',
        params: { imageUri: result.uri },
      });
    }
  };

  const handleGallerySelect = async () => {
    const result = await pickImage();
    if (result) {
      router.push({
        pathname: '/visual-search-results',
        params: { imageUri: result.uri },
      });
    }
  };

  const handleSearchExpand = () => {
    setIsSearchExpanded(true);
    setTimeout(() => {
      searchInputRef.current?.focus();
    }, 100);
  };

  const handleSearchCollapse = () => {
    if (!searchQuery.trim()) {
      setIsSearchExpanded(false);
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

  const handleFavoritePress = async (product: Product) => {
    const isFavorite = favoriteIds.includes(String(product.id));
    
    try {
      await toggleFavorite(product.id, isFavorite);
      
      if (isFavorite) {
        setFavoriteIds(prev => prev.filter(id => id !== String(product.id)));
      } else {
        setFavoriteIds(prev => [...prev, String(product.id)]);
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <TouchableOpacity 
        style={StyleSheet.absoluteFill} 
        activeOpacity={1}
        onPress={() => {
          if (isSearchExpanded) {
            Keyboard.dismiss();
            handleSearchCollapse();
          }
        }}
        disabled={!isSearchExpanded}
      >
        <View pointerEvents="box-none" style={{ flex: 1 }}>
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
            <View style={styles.searchRow}>
              {!isSearchExpanded && (
                <Text style={styles.logoText}>ReUseU</Text>
              )}
              
              {isSearchExpanded ? (
                <View style={styles.searchBar}>
                  <Image 
                    source={require('../../assets/images/icons/search.png')} 
                    style={styles.searchIcon}
                  />
                  <TextInput
                    ref={searchInputRef}
                    style={styles.searchInput}
                    placeholder="Search anything..."
                    placeholderTextColor="#6b6b6b"
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                    onSubmitEditing={handleSearchSubmit}
                    onBlur={handleSearchCollapse}
                    returnKeyType="search"
                  />
                </View>
              ) : (
                <View style={styles.collapsedActions}>
                  <TouchableOpacity
                    style={styles.iconBtn}
                    onPress={handleSearchExpand}
                    activeOpacity={0.7}
                  >
                    <Image 
                      source={require('../../assets/images/icons/search.png')} 
                      style={styles.iconBtnImage}
                    />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.iconBtn}
                    onPress={handleImageSearch}
                    activeOpacity={0.7}
                  >
                    <Image 
                      source={require('../../assets/images/icons/camera.png')} 
                      style={styles.iconBtnImage}
                    />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.iconBtn}
                    onPress={() => router.push('/ai/assistant')}
                    activeOpacity={0.7}
                  >
                    <Image 
                      source={require('../../assets/images/icons/ai.png')} 
                      style={styles.iconBtnImage}
                    />
                  </TouchableOpacity>
                </View>
              )}
            </View>
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
              onFavoritePress={handleFavoritePress}
              favoriteIds={favoriteIds}
              onRefresh={handleRefresh}
              isRefreshing={isRefreshing}
              emptyMessage={searchQuery ? `No results for "${searchQuery}"` : "No products available"}
              onScroll={handleScroll}
            />
          )}
        </View>
      </TouchableOpacity>

      {/* Image Picker Modal */}
      <ImagePickerModal
        visible={showImagePicker}
        onClose={() => setShowImagePicker(false)}
        onCamera={handleCameraSelect}
        onGallery={handleGallerySelect}
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
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 4,
  },
  logoText: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111',
    letterSpacing: -0.5,
  },
  collapsedActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    height: 42,
    borderRadius: 21,
    paddingHorizontal: 14,
    backgroundColor: '#f5f5f5',
  },
  searchIcon: {
    width: 18,
    height: 18,
    marginRight: 8,
    opacity: 0.9,
  },
  searchIconText: {
    fontSize: 16,
    marginRight: 8,
    opacity: 0.9,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    fontWeight: '400',
    paddingVertical: 10,
    color: '#000',
  },
  iconBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  iconBtnImage: {
    width: 20,
    height: 20,
  },
  iconBtnText: {
    fontSize: 18,
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
