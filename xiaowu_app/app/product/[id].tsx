/**
 * Product Detail Screen
 * Detailed view of a product
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../src/contexts/ThemeContext';
import { spacing } from '../../src/theme/spacing';
import { Product } from '../../src/types';
import { ProductImageCarousel } from '../../src/components/products/ProductImageCarousel';
import { Avatar } from '../../src/components/ui/Avatar';
import { Button } from '../../src/components/ui/Button';
import { Badge } from '../../src/components/ui/Badge';
import { Divider } from '../../src/components/ui/Divider';
import { useAuth } from '../../src/contexts/AuthContext';
import { getProductDetail } from '../../src/services/productService';
import { toggleFavorite } from '../../src/services/favoritesService';
import { useToast } from '../../src/hooks/useToast';
import { LoadingFullPage } from '../../src/components/ui/Loading';

// Mock product data for fallback
const mockProduct: Product = {
  id: 1,
  seller_id: 1,
  dormitory_id: 1,
  category_id: 1,
  condition_level_id: 1,
  title: 'Calculus Textbook',
  description: 'Good condition, some highlights. Used for one semester. Great for Calculus I and II courses.',
  price: 45,
  status: 'available',
  created_at: new Date().toISOString(),
  images: [],
  tags: [],
  seller: {
    id: 1,
    full_name: 'John Doe',
    username: 'johndoe',
    profile_picture: undefined,
  },
  condition_level: {
    id: 1,
    name: 'Good',
    description: 'Minor signs of use',
    sort_order: 2,
  },
  dormitory: {
    id: 1,
    dormitory_name: 'Main Campus Dorm',
    domain: 'campus.edu',
    is_active: true,
    university_id: 1,
  },
};

export default function ProductDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { toast } = useToast();
  const [product, setProduct] = useState<Product | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isFavorite, setIsFavorite] = useState(false);

  useEffect(() => {
    const fetchProduct = async () => {
      if (!id) {
        toast({ title: 'Invalid product ID', type: 'error' });
        setIsLoading(false);
        return;
      }

      try {
        const productId = parseInt(id, 10);
        if (isNaN(productId)) {
          toast({ title: 'Invalid product ID format', type: 'error' });
          setIsLoading(false);
          return;
        }

        console.log('Fetching product with ID:', productId);
        const fetchedProduct = await getProductDetail(productId);
        console.log('Received product data:', JSON.stringify(fetchedProduct, null, 2));
        
        setProduct(fetchedProduct);
      } catch (error: any) {
        console.error('Error fetching product:', error);
        
        let errorMessage = 'Failed to load product';
        if (error.response?.status === 404) {
          errorMessage = 'Product not found';
        } else if (error.response?.status === 403) {
          errorMessage = 'Access denied. User access required.';
        } else if (error.message) {
          errorMessage = error.message;
        }
        
        toast({ title: errorMessage, type: 'error' });
        setProduct(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProduct();
  }, [id]);

  const handleFavoritePress = async () => {
    if (!product) return;
    
    try {
      await toggleFavorite(product.id, isFavorite);
      setIsFavorite(!isFavorite);
      toast({ 
        title: isFavorite ? 'Removed from favorites' : 'Added to favorites', 
        type: 'success' 
      });
    } catch (error) {
      console.error('Error toggling favorite:', error);
      toast({ title: 'Failed to update favorite', type: 'error' });
    }
  };

  const handleSellerPress = () => {
    if (product?.seller) {
      router.push(`/seller/${product.seller.id}`);
    }
  };

  const handleMessagePress = () => {
    if (product?.seller) {
      router.push({
        pathname: `/chat/0`,
        params: {
          receiverId: product.seller.id,
          receiverName: product.seller.full_name || product.seller.username,
          productId: product.id,
        },
      });
    }
  };

  if (isLoading) {
    return <LoadingFullPage message="Loading product..." />;
  }

  if (!product) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Text style={{ color: colors.text }}>Product not found</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Image Carousel */}
        <ProductImageCarousel images={product.images?.map(img => img.image_url) || []} />

        {/* Content */}
        <View style={styles.content}>
          {/* Title and Price */}
          <Text style={[styles.title, { color: colors.text }]}>
            {product.title}
          </Text>
          <Text style={[styles.price, { color: colors.primary }]}>
            ¥{typeof product.price === 'number' ? product.price.toFixed(2) : Number(product.price || 0).toFixed(2)}
          </Text>

          {/* Badges */}
          <View style={styles.badgeRow}>
            {product.condition_level && (
              <Badge
                label={product.condition_level.name}
                variant="secondary"
                size="sm"
              />
            )}
            {product.status === 'available' && (
              <Badge
                label="Available"
                variant="success"
                size="sm"
                style={{ marginLeft: spacing.sm }}
              />
            )}
          </View>

          <Divider margin={spacing.lg} />

          {/* Description */}
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Description
          </Text>
          <Text style={[styles.description, { color: colors.textSecondary }]}>
            {product.description || 'No description available'}
          </Text>

          <Divider margin={spacing.lg} />

          {/* Seller Info */}
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Seller
          </Text>
          <TouchableOpacity
            style={styles.sellerRow}
            onPress={handleSellerPress}
          >
            <Avatar
              source={product.seller?.profile_picture ? { uri: product.seller.profile_picture } : undefined}
              name={product.seller?.full_name}
              size="lg"
            />
            <View style={styles.sellerInfo}>
              <Text style={[styles.sellerName, { color: colors.text }]}>
                {product.seller?.full_name || 'Unknown'}
              </Text>
              <Text style={[styles.sellerLocation, { color: colors.textSecondary }]}>
                {product.dormitory?.dormitory_name || 'Unknown location'}
              </Text>
            </View>
            <Text style={[styles.arrow, { color: colors.textTertiary }]}>›</Text>
          </TouchableOpacity>

          <Divider margin={spacing.lg} />

          {/* Location */}
          {product.dormitory && (
            <>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                Location
              </Text>
              <View style={styles.locationRow}>
                <Text style={styles.locationIcon}>📍</Text>
                <Text style={[styles.locationText, { color: colors.textSecondary }]}>
                  {product.dormitory.dormitory_name}
                </Text>
              </View>
              <View style={{ height: 100 }} />
            </>
          )}
        </View>
      </ScrollView>

      {/* Bottom Actions */}
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
        <TouchableOpacity
          style={styles.favoriteButton}
          onPress={handleFavoritePress}
        >
          <Text style={{ fontSize: 24 }}>
            {isFavorite ? '❤️' : '🤍'}
          </Text>
        </TouchableOpacity>
        <Button
          title="Message Seller"
          onPress={handleMessagePress}
          style={styles.messageButton}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: spacing.screenPadding,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: spacing.sm,
  },
  price: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: spacing.md,
  },
  badgeRow: {
    flexDirection: 'row',
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
  arrow: {
    fontSize: 24,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  locationIcon: {
    fontSize: 20,
    marginRight: spacing.sm,
  },
  locationText: {
    fontSize: 16,
  },
  bottomActions: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.screenPadding,
    paddingTop: spacing.md,
    borderTopWidth: 1,
  },
  favoriteButton: {
    padding: spacing.sm,
    marginRight: spacing.md,
  },
  messageButton: {
    flex: 1,
  },
});
