/**
 * ProductList Component
 * List layout for displaying products (horizontal variant)
 */

import React from 'react';
import {
  View,
  FlatList,
  StyleSheet,
  ViewStyle,
  RefreshControl,
  ActivityIndicator,
  Text,
} from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { spacing } from '../../theme/spacing';
import { Product } from '../../types';
import { ProductCard } from './ProductCard';

interface ProductListProps {
  products: Product[];
  onProductPress?: (product: Product) => void;
  onSellerPress?: (product: Product) => void;
  onFavoritePress?: (product: Product) => void;
  favoriteIds?: string[];
  onRefresh?: () => void;
  onLoadMore?: () => void;
  isLoading?: boolean;
  isRefreshing?: boolean;
  hasMore?: boolean;
  style?: ViewStyle;
  emptyMessage?: string;
}

export const ProductList: React.FC<ProductListProps> = ({
  products,
  onProductPress,
  onSellerPress,
  onFavoritePress,
  favoriteIds = [],
  onRefresh,
  onLoadMore,
  isLoading = false,
  isRefreshing = false,
  hasMore = true,
  style,
  emptyMessage = 'No products found',
}) => {
  const { colors } = useTheme();

  const renderItem = ({ item }: { item: Product }) => (
    <ProductCard
      product={item}
      onPress={() => onProductPress?.(item)}
      onSellerPress={() => onSellerPress?.(item)}
      onFavoritePress={() => onFavoritePress?.(item)}
      isFavorite={favoriteIds.includes(String(item.id))}
      variant="horizontal"
    />
  );

  const renderFooter = () => {
    if (!isLoading) return null;
    return (
      <View style={styles.footer}>
        <ActivityIndicator size="small" color={colors.primary} />
      </View>
    );
  };

  const renderEmpty = () => {
    if (isLoading && products.length === 0) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      );
    }

    if (products.length === 0) {
      return (
        <View style={styles.emptyContainer}>
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
            {emptyMessage}
          </Text>
        </View>
      );
    }

    return null;
  };

  return (
    <FlatList
      data={products}
      renderItem={renderItem}
      keyExtractor={(item) => String(item.id)}
      contentContainerStyle={[styles.container, style]}
      showsVerticalScrollIndicator={false}
      refreshControl={
        onRefresh ? (
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
          />
        ) : undefined
      }
      onEndReached={hasMore && onLoadMore ? onLoadMore : undefined}
      onEndReachedThreshold={0.5}
      ListFooterComponent={renderFooter}
      ListEmptyComponent={renderEmpty}
    />
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: spacing.sm,
  },
  footer: {
    paddingVertical: spacing.lg,
    alignItems: 'center',
  },
  loadingContainer: {
    paddingVertical: spacing['4xl'],
    alignItems: 'center',
  },
  emptyContainer: {
    paddingVertical: spacing['4xl'],
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
  },
});

export default ProductList;
