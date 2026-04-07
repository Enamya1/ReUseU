import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, TextInput, RefreshControl } from 'react-native';
import { useAuth } from '@/src/contexts/AuthContext';
import { useFavorites } from '@/src/contexts/FavoritesContext';
import { useFocusEffect, router } from 'expo-router';
import { Image } from 'expo-image';
import { normalizeImageUrl } from '@/src/config/env';
import { Ionicons } from '@expo/vector-icons';

export default function ProductsScreen() {
  const { getRecommendedProducts } = useAuth();
  const { isFavorite, toggleFavorite } = useFavorites();
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const loadProducts = useCallback(async () => {
    try {
      setLoading(true);
      const response = await getRecommendedProducts({ page: 1, page_size: 50 });
      setProducts(response.products || []);
    } catch (error) {
      console.error('Error loading products:', error);
    } finally {
      setLoading(false);
    }
  }, [getRecommendedProducts]);

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

  const handleSearch = () => {
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const handleFavoriteToggle = async (productId: number) => {
    try {
      await toggleFavorite(productId);
    } catch (error) {
      console.error('Error toggling favorite:', error);
    }
  };

  const renderProduct = ({ item }: any) => {
    const imageUrl = item.images?.[0]?.image_thumbnail_url || item.images?.[0]?.image_url;
    const isFav = isFavorite(item.id);

    return (
      <TouchableOpacity 
        style={styles.card}
        onPress={() => router.push(`/product/${item.id}`)}
      >
        <Image
          source={{ uri: normalizeImageUrl(imageUrl) }}
          style={styles.image}
          contentFit="cover"
        />
        <TouchableOpacity 
          style={styles.favoriteButton}
          onPress={() => handleFavoriteToggle(item.id)}
        >
          <Ionicons 
            name={isFav ? "heart" : "heart-outline"} 
            size={24} 
            color={isFav ? "#FF3B30" : "#FFF"} 
          />
        </TouchableOpacity>
        <View style={styles.info}>
          <Text style={styles.title} numberOfLines={2}>{item.title}</Text>
          <Text style={styles.price}>¥{item.price}</Text>
          {item.seller && (
            <Text style={styles.seller} numberOfLines={1}>{item.seller.username}</Text>
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
      <View style={styles.searchBar}>
        <View style={styles.searchInput}>
          <Ionicons name="search" size={20} color="#999" />
          <TextInput
            style={styles.input}
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search products..."
            onSubmitEditing={handleSearch}
            returnKeyType="search"
          />
        </View>
        <TouchableOpacity style={styles.filterButton}>
          <Ionicons name="options-outline" size={24} color="#0066FF" />
        </TouchableOpacity>
      </View>

      <FlatList
        data={products}
        renderItem={renderProduct}
        keyExtractor={(item) => item.id.toString()}
        numColumns={2}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>No products available</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  searchBar: { flexDirection: 'row', padding: 12, backgroundColor: '#FFF', gap: 8 },
  searchInput: { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: '#F5F5F5', borderRadius: 8, paddingHorizontal: 12, gap: 8 },
  input: { flex: 1, height: 40, fontSize: 15 },
  filterButton: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  list: { padding: 8 },
  card: { flex: 1, margin: 8, backgroundColor: '#FFF', borderRadius: 12, overflow: 'hidden', elevation: 2 },
  image: { width: '100%', height: 150 },
  favoriteButton: { position: 'absolute', top: 8, right: 8, width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(0,0,0,0.3)', justifyContent: 'center', alignItems: 'center' },
  info: { padding: 12 },
  title: { fontSize: 14, fontWeight: '600', marginBottom: 4, color: '#000' },
  price: { fontSize: 18, fontWeight: 'bold', color: '#0066FF', marginBottom: 4 },
  seller: { fontSize: 12, color: '#666' },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 100 },
  emptyText: { fontSize: 16, color: '#999' },
});
