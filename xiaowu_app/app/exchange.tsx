import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, RefreshControl, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useAuth } from '@/src/contexts/AuthContext';
import { useFocusEffect } from 'expo-router';
import { Image } from 'expo-image';
import { normalizeImageUrl } from '@/src/config/env';

export default function ExchangeScreen() {
  const { getRecommendedExchangeProducts } = useAuth();
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadProducts = useCallback(async () => {
    try {
      setLoading(true);
      const response = await getRecommendedExchangeProducts({ page: 1, page_size: 20 });
      setProducts(response.exchange_products || []);
    } catch (error) {
      console.error('Error loading exchange products:', error);
    } finally {
      setLoading(false);
    }
  }, [getRecommendedExchangeProducts]);

  useFocusEffect(
    useCallback(() => {
      loadProducts();
    }, [loadProducts])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await loadProducts();
    setRefreshing(false);
  };

  const renderItem = ({ item }: any) => {
    const product = item.product;
    const exchange = item.exchange_product;
    const imageUrl = product?.images?.[0]?.image_thumbnail_url || product?.images?.[0]?.image_url;

    return (
      <TouchableOpacity style={styles.card}>
        <Image
          source={{ uri: normalizeImageUrl(imageUrl) }}
          style={styles.image}
          contentFit="cover"
        />
        <View style={styles.info}>
          <Text style={styles.title} numberOfLines={2}>{product?.title}</Text>
          <Text style={styles.price}>¥{product?.price}</Text>
          <Text style={styles.exchange}>{exchange?.exchange_type === 'exchange_only' ? 'Exchange Only' : 'Exchange or Purchase'}</Text>
          {exchange?.target_product_title && (
            <Text style={styles.target} numberOfLines={1}>Looking for: {exchange.target_product_title}</Text>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#0066FF" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={products}
        renderItem={renderItem}
        keyExtractor={(item, index) => `${item.product?.id || index}`}
        numColumns={2}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>No exchange products available</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  list: { padding: 8 },
  card: { flex: 1, margin: 8, backgroundColor: '#FFF', borderRadius: 12, overflow: 'hidden', elevation: 2 },
  image: { width: '100%', height: 150 },
  info: { padding: 12 },
  title: { fontSize: 14, fontWeight: '600', marginBottom: 4 },
  price: { fontSize: 16, fontWeight: 'bold', color: '#0066FF', marginBottom: 4 },
  exchange: { fontSize: 12, color: '#666', marginBottom: 4 },
  target: { fontSize: 11, color: '#999', fontStyle: 'italic' },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 100 },
  emptyText: { fontSize: 16, color: '#999' },
});
