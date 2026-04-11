import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../src/contexts/ThemeContext';
import { spacing } from '../../src/theme/spacing';
import { apiClient } from '../../src/services/api';
import { ProductImageCarousel } from '../../src/components/products/ProductImageCarousel';
import { Avatar } from '../../src/components/ui/Avatar';
import { Button } from '../../src/components/ui/Button';

export default function ExchangeProductDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadExchangeProduct();
  }, [id]);

  const loadExchangeProduct = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get(`/api/exchange-products/${id}`);
      setData(response.data);
    } catch (error) {
      console.error('Error loading exchange product:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!data?.product) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <Text style={{ color: colors.text }}>Exchange product not found</Text>
      </View>
    );
  }

  const { product, exchange_product } = data;
  const isExchangeOnly = exchange_product?.exchange_type === 'exchange_only';

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <ProductImageCarousel images={product.images?.map((img: any) => img.image_url) || []} />

        <View style={styles.content}>
          <View style={[styles.exchangeHeader, { backgroundColor: isExchangeOnly ? '#FF6B35' : '#4ECDC4' }]}>
            <Ionicons name="swap-horizontal" size={24} color="#FFF" />
            <Text style={styles.exchangeHeaderText}>
              {isExchangeOnly ? 'Exchange Only' : 'Exchange or Purchase'}
            </Text>
          </View>

          <Text style={[styles.title, { color: colors.text }]}>
            {product.title}
          </Text>

          <View style={styles.priceConditionRow}>
            <Text style={[styles.price, { color: colors.primary }]}>
              ¥{product.price}
            </Text>
            {product.condition_level && (
              <View style={[styles.conditionBadge, { backgroundColor: colors.surfaceSecondary }]}>
                <Text style={[styles.conditionText, { color: colors.text }]}>
                  {product.condition_level.name}
                </Text>
              </View>
            )}
          </View>

          {exchange_product?.target_product_title && (
            <View style={[styles.targetSection, { backgroundColor: colors.surfaceSecondary }]}>
              <View style={styles.targetHeader}>
                <Ionicons name="search-circle" size={24} color={colors.primary} />
                <Text style={[styles.targetTitle, { color: colors.text }]}>
                  Looking For
                </Text>
              </View>
              <Text style={[styles.targetProduct, { color: colors.text }]}>
                {exchange_product.target_product_title}
              </Text>
              {exchange_product.target_product_category && (
                <Text style={[styles.targetDetail, { color: colors.textSecondary }]}>
                  Category: {exchange_product.target_product_category.name}
                </Text>
              )}
              {exchange_product.target_product_condition && (
                <Text style={[styles.targetDetail, { color: colors.textSecondary }]}>
                  Condition: {exchange_product.target_product_condition.name}
                </Text>
              )}
            </View>
          )}

          {exchange_product?.expiration_date && (
            <View style={styles.expirationRow}>
              <Ionicons name="time-outline" size={16} color={colors.textSecondary} />
              <Text style={[styles.expirationText, { color: colors.textSecondary }]}>
                Expires: {new Date(exchange_product.expiration_date).toLocaleDateString()}
              </Text>
            </View>
          )}

          <View style={styles.divider} />

          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Description
          </Text>
          <Text style={[styles.description, { color: colors.textSecondary }]}>
            {product.description || 'No description provided'}
          </Text>

          <View style={styles.divider} />

          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Seller
          </Text>
          <TouchableOpacity
            style={styles.sellerRow}
            onPress={() => router.push(`/seller/${product.seller?.id}`)}
          >
            <Avatar
              source={product.seller?.profile_picture ? { uri: product.seller.profile_picture } : undefined}
              name={product.seller?.full_name || product.seller?.username}
              size="lg"
            />
            <View style={styles.sellerInfo}>
              <Text style={[styles.sellerName, { color: colors.text }]}>
                {product.seller?.full_name || product.seller?.username || 'Unknown'}
              </Text>
              <Text style={[styles.sellerLocation, { color: colors.textSecondary }]}>
                {product.dormitory?.dormitory_name || 'Unknown location'}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.textTertiary} />
          </TouchableOpacity>

          <View style={{ height: 100 }} />
        </View>
      </ScrollView>

      <View
        style={[
          styles.bottomActions,
          {
            backgroundColor: colors.card,
            paddingBottom: insets.bottom + spacing.sm,
            borderTopColor: colors.border,
          },
        ]}
      >
        <Button
          title={isExchangeOnly ? "Propose Exchange" : "Message Seller"}
          onPress={() => router.push({
            pathname: `/chat/0`,
            params: {
              receiverId: product.seller?.id,
              receiverName: product.seller?.full_name || product.seller?.username,
              productId: product.id,
            },
          })}
          style={styles.actionButton}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  content: { padding: spacing.screenPadding },
  exchangeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.md,
    borderRadius: spacing.md,
    marginBottom: spacing.lg,
    gap: spacing.sm,
  },
  exchangeHeaderText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: spacing.md,
  },
  priceConditionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
  },
  price: {
    fontSize: 28,
    fontWeight: '700',
  },
  conditionBadge: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: spacing.sm,
  },
  conditionText: {
    fontSize: 14,
    fontWeight: '600',
  },
  targetSection: {
    padding: spacing.lg,
    borderRadius: spacing.md,
    marginBottom: spacing.lg,
  },
  targetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  targetTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  targetProduct: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: spacing.sm,
  },
  targetDetail: {
    fontSize: 14,
    marginTop: spacing.xs,
  },
  expirationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  expirationText: {
    fontSize: 14,
  },
  divider: {
    height: 1,
    backgroundColor: '#E0E0E0',
    marginVertical: spacing.lg,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: spacing.sm,
  },
  description: {
    fontSize: 16,
    lineHeight: 24,
  },
  sellerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sellerInfo: {
    flex: 1,
    marginLeft: spacing.md,
  },
  sellerName: {
    fontSize: 16,
    fontWeight: '600',
  },
  sellerLocation: {
    fontSize: 14,
    marginTop: 2,
  },
  bottomActions: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.screenPadding,
    paddingTop: spacing.md,
    borderTopWidth: 1,
  },
  actionButton: {
    flex: 1,
  },
});
