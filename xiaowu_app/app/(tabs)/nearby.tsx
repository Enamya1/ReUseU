/**
 * Nearby Screen
 * Location-based nearby products view
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  FlatList,
  RefreshControl,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../src/contexts/ThemeContext';
import { spacing } from '../../src/theme/spacing';
import { Product } from '../../src/types';
import { useLocation } from '../../src/hooks/useLocation';
import { getNearbyProducts } from '../../src/services/productService';
import { normalizeImageUrl } from '../../src/config/env';

export default function NearbyScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { location, getCurrentLocation, isLoading: locationLoading } = useLocation();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadNearbyProducts();
  }, [location]);

  const loadNearbyProducts = async () => {
    if (!location) return;
    
    try {
      setLoading(true);
      const response = await getNearbyProducts({
        lat: location.latitude,
        lng: location.longitude,
        distance_km: 10,
      });
      setProducts(response.products);
    } catch (error) {
      console.error('Error loading nearby products:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadNearbyProducts();
    setRefreshing(false);
  };

  const handleProductPress = (product: Product) => {
    router.push(`/product/${product.id}`);
  };

  const renderProduct = ({ item }: { item: Product }) => {
    const imageUrl = item.images?.[0]?.image_thumbnail_url || item.images?.[0]?.image_url;
    return (
      <TouchableOpacity 
        style={[styles.card, { backgroundColor: colors.card }]}
        onPress={() => handleProductPress(item)}
      >
        {imageUrl && (
          <Image
            source={{ uri: normalizeImageUrl(imageUrl) }}
            style={styles.image}
            contentFit="cover"
          />
        )}
        <View style={styles.info}>
          <Text style={[styles.productTitle, { color: colors.text }]} numberOfLines={2}>
            {item.title}
          </Text>
          <Text style={[styles.price, { color: colors.primary }]}>
            ¥{item.price}
          </Text>
          {item.distance_km !== undefined && (
            <View style={styles.distanceRow}>
              <Ionicons name="location-outline" size={14} color={colors.textSecondary} />
              <Text style={[styles.distance, { color: colors.textSecondary }]}>
                {item.distance_km.toFixed(1)} km away
              </Text>
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top }]}>
        <Text style={[styles.title, { color: colors.text }]}>
          Nearby Items
        </Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          Find items close to you
        </Text>
      </View>

      {/* Content */}
      {locationLoading || loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
            Loading nearby items...
          </Text>
        </View>
      ) : !location ? (
        <View style={styles.center}>
          <Ionicons name="location-outline" size={64} color={colors.textTertiary} />
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
            Location permission required
          </Text>
          <TouchableOpacity
            style={[styles.enableButton, { backgroundColor: colors.primary }]}
            onPress={getCurrentLocation}
          >
            <Text style={styles.enableButtonText}>Enable Location</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={products}
          renderItem={renderProduct}
          keyExtractor={(item) => item.id.toString()}
          numColumns={2}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="cube-outline" size={64} color={colors.textTertiary} />
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                No items nearby
              </Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingHorizontal: spacing.screenPadding,
    paddingBottom: spacing.md,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontSize: 16,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.screenPadding,
  },
  loadingText: {
    marginTop: spacing.md,
    fontSize: 16,
  },
  emptyText: {
    fontSize: 16,
    marginTop: spacing.md,
    marginBottom: spacing.lg,
  },
  enableButton: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: spacing.radius.md,
  },
  enableButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  list: {
    padding: spacing.sm,
  },
  card: {
    flex: 1,
    margin: spacing.sm,
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 2,
  },
  image: {
    width: '100%',
    height: 150,
  },
  info: {
    padding: 12,
  },
  productTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  price: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  distanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  distance: {
    fontSize: 12,
  },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 100,
  },
});
