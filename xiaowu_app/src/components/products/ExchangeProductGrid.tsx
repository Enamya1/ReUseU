import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';
import { spacing } from '../../theme/spacing';
import { normalizeImageUrl } from '../../config/env';
import { apiClientPy } from '../../services/api';

interface ExchangeProductGridProps {
  onProductPress: (item: any) => void;
  onRefresh?: () => void;
  isRefreshing?: boolean;
  onScroll?: any;
}

export const ExchangeProductGrid: React.FC<ExchangeProductGridProps> = ({
  onProductPress,
  onRefresh,
  isRefreshing = false,
  onScroll,
}) => {
  const { colors } = useTheme();
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadExchangeProducts = useCallback(async () => {
    try {
      setLoading(true);
      const response = await apiClientPy.get('/py/api/user/recommendations/exchange-products', {
        params: { page: 1, page_size: 20 },
      });
      setProducts(response.data.exchange_products || []);
    } catch (error) {
      console.error('Error loading exchange products:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadExchangeProducts();
  }, [loadExchangeProducts]);

  const handleRefresh = async () => {
    await loadExchangeProducts();
    onRefresh?.();
  };

  const renderItem = ({ item }: { item: any }) => {
    const product = item.product;
    const exchange = item.exchange_product;
    const imageUrl = product?.images?.[0]?.image_thumbnail_url || product?.images?.[0]?.image_url;

    return (
      <TouchableOpacity
        style={[styles.card, { backgroundColor: colors.card }]}
        onPress={() => onProductPress(item)}
        activeOpacity={0.7}
      >
        <Image
          source={{ uri: normalizeImageUrl(imageUrl) }}
          style={styles.image}
          contentFit="cover"
        />
        
        <View style={[styles.exchangeBadge, { backgroundColor: exchange?.exchange_type === 'exchange_only' ? '#FF6B35' : '#4ECDC4' }]}>
          <Ionicons name="swap-horizontal" size={12} color="#FFF" />
          <Text style={styles.exchangeBadgeText}>
            {exchange?.exchange_type === 'exchange_only' ? 'Exchange Only' : 'Exchange/Buy'}
          </Text>
        </View>

        <View style={styles.content}>
          <Text style={[styles.title, { color: colors.text }]} numberOfLines={2}>
            {product?.title}
          </Text>
          
          <View style={styles.priceRow}>
            <Text style={[styles.price, { color: colors.primary }]}>
              ¥{product?.price}
            </Text>
            {product?.condition_level && (
              <View style={[styles.conditionBadge, { backgroundColor: colors.surfaceSecondary }]}>
                <Text style={[styles.conditionText, { color: colors.textSecondary }]}>
                  {product.condition_level.name}
                </Text>
              </View>
            )}
          </View>

          {exchange?.target_product_title && (
            <View style={[styles.targetBox, { backgroundColor: colors.surfaceSecondary }]}>
              <Ionicons name="search" size={14} color={colors.textSecondary} />
              <Text style={[styles.targetText, { color: colors.textSecondary }]} numberOfLines={1}>
                Looking for: {exchange.target_product_title}
              </Text>
            </View>
          )}

          {product?.seller && (
            <View style={styles.sellerRow}>
              <Ionicons name="person-circle-outline" size={14} color={colors.textTertiary} />
              <Text style={[styles.sellerText, { color: colors.textTertiary }]} numberOfLines={1}>
                {product.seller.username}
              </Text>
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
          Loading exchange items...
        </Text>
      </View>
    );
  }

  return (
    <FlatList
      data={products}
      renderItem={renderItem}
      keyExtractor={(item, index) => `${item.exchange_product?.id || index}`}
      numColumns={2}
      contentContainerStyle={styles.list}
      refreshControl={
        <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />
      }
      onScroll={onScroll}
      scrollEventThrottle={16}
      ListEmptyComponent={
        <View style={styles.empty}>
          <Ionicons name="swap-horizontal-outline" size={64} color={colors.textTertiary} />
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
            No exchange items available
          </Text>
        </View>
      }
    />
  );
};

const styles = StyleSheet.create({
  list: {
    padding: spacing.sm,
  },
  card: {
    flex: 1,
    margin: spacing.sm,
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  image: {
    width: '100%',
    height: 160,
  },
  exchangeBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  exchangeBadgeText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: '700',
  },
  content: {
    padding: 12,
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    lineHeight: 18,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  price: {
    fontSize: 18,
    fontWeight: '700',
  },
  conditionBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  conditionText: {
    fontSize: 10,
    fontWeight: '600',
  },
  targetBox: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    borderRadius: 8,
    gap: 6,
    marginBottom: 8,
  },
  targetText: {
    flex: 1,
    fontSize: 11,
    fontStyle: 'italic',
  },
  sellerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  sellerText: {
    fontSize: 11,
    flex: 1,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing['4xl'],
  },
  loadingText: {
    marginTop: spacing.md,
    fontSize: 14,
  },
  empty: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing['4xl'],
  },
  emptyText: {
    fontSize: 16,
    marginTop: spacing.md,
  },
});
