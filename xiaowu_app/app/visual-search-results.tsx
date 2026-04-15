/**
 * Visual Search Results Screen
 * Display products found by image search
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Image,
  TouchableOpacity,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { useTheme } from '../src/contexts/ThemeContext';
import { spacing } from '../src/theme/spacing';
import { Product } from '../src/types';
import { ProductGrid } from '../src/components/products/ProductGrid';
import { visualSearch } from '../src/services/visualSearchService';

export default function VisualSearchResultsScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams();
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState<Product[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [searchImageUri, setSearchImageUri] = useState<string | null>(null);
  const [searchInfo, setSearchInfo] = useState<{
    model_name: string;
    embedding_dim: number;
    count: number;
  } | null>(null);

  useEffect(() => {
    if (params.imageUri && typeof params.imageUri === 'string') {
      setSearchImageUri(params.imageUri);
      performVisualSearch(params.imageUri);
    }
  }, [params.imageUri]);

  const performVisualSearch = async (imageUri: string) => {
    try {
      setLoading(true);
      setError(null);

      const filename = imageUri.split('/').pop() || 'search.jpg';
      const match = /\.(\w+)$/.exec(filename);
      const type = match ? `image/${match[1]}` : 'image/jpeg';

      const response = await visualSearch({
        image: {
          uri: imageUri,
          name: filename,
          type,
        },
        top_k: 12,
      });

      setProducts(response.products);
      setSearchInfo({
        model_name: response.query.model_name,
        embedding_dim: response.query.embedding_dim,
        count: response.count,
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Visual search failed';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleProductPress = (product: Product) => {
    router.push(`/product/${product.id}`);
  };

  const handleRetry = () => {
    if (searchImageUri) {
      performVisualSearch(searchImageUri);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={[styles.backText, { color: colors.primary }]}>‹ Back</Text>
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]}>
          Visual Search Results
        </Text>
        {searchInfo && (
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            Found {searchInfo.count} similar {searchInfo.count === 1 ? 'product' : 'products'}
          </Text>
        )}
      </View>

      {/* Search Image Preview */}
      {searchImageUri && (
        <View style={[styles.imagePreview, { backgroundColor: colors.card }]}>
          <Text style={[styles.imageLabel, { color: colors.textSecondary }]}>
            Your search image:
          </Text>
          <Image
            source={{ uri: searchImageUri }}
            style={styles.searchImage}
            resizeMode="cover"
          />
          {searchInfo && (
            <Text style={[styles.modelInfo, { color: colors.textTertiary }]}>
              Model: {searchInfo.model_name} • Dim: {searchInfo.embedding_dim}
            </Text>
          )}
        </View>
      )}

      {/* Results */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
            Analyzing image and searching...
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
            onPress={handleRetry}
          >
            <Text style={styles.retryButtonText}>Retry Search</Text>
          </TouchableOpacity>
        </View>
      ) : products.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyIcon}>🔍</Text>
          <Text style={[styles.emptyTitle, { color: colors.text }]}>
            No similar products found
          </Text>
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
            Try taking a clearer photo or searching with different items
          </Text>
          <TouchableOpacity
            style={[styles.retryButton, { backgroundColor: colors.primary }]}
            onPress={() => router.back()}
          >
            <Text style={styles.retryButtonText}>Try Another Image</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ProductGrid
          products={products}
          onProductPress={handleProductPress}
          emptyMessage="No products found"
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
  },
  backButton: {
    marginBottom: spacing.sm,
  },
  backText: {
    fontSize: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontSize: 14,
  },
  imagePreview: {
    marginHorizontal: spacing.screenPadding,
    marginBottom: spacing.lg,
    padding: spacing.md,
    borderRadius: spacing.md,
    alignItems: 'center',
  },
  imageLabel: {
    fontSize: 12,
    marginBottom: spacing.sm,
  },
  searchImage: {
    width: 120,
    height: 120,
    borderRadius: spacing.sm,
    marginBottom: spacing.sm,
  },
  modelInfo: {
    fontSize: 10,
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
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing['4xl'],
    paddingHorizontal: spacing.screenPadding,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: spacing.md,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: spacing.xs,
    textAlign: 'center',
  },
  emptyText: {
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
