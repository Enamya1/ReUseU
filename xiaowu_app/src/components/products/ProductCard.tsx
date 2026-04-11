/**
 * ProductCard Component
 * Product card for displaying product information
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ViewStyle,
  TextStyle,
  TouchableOpacity,
  Image,
} from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { spacing } from '../../theme/spacing';
import { shadows } from '../../theme/shadows';
import { Product } from '../../types';
import { Avatar } from '../ui/Avatar';
import { Badge } from '../ui/Badge';
import { PressableCard } from '../ui/Card';
import { normalizeImageUrl } from '../../config';

interface ProductCardProps {
  product: Product;
  onPress?: () => void;
  onSellerPress?: () => void;
  onFavoritePress?: () => void;
  isFavorite?: boolean;
  variant?: 'default' | 'compact' | 'horizontal';
  style?: ViewStyle;
  hideSeller?: boolean;
  hideLocation?: boolean;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  onPress,
  onSellerPress,
  onFavoritePress,
  isFavorite = false,
  variant = 'default',
  style,
  hideSeller = false,
  hideLocation = false,
}) => {
  const { colors, isDark } = useTheme();
  const themeShadows = isDark ? shadows.dark : shadows.light;

  const formatPrice = (price: number | undefined): string => {
    if (price === undefined || price === null) {
      console.warn('ProductCard - Price is undefined or null');
      return '¥0.00';
    }
    
    // Handle string prices (convert to number)
    const numPrice = typeof price === 'string' ? parseFloat(price) : price;
    
    if (isNaN(numPrice)) {
      console.warn('ProductCard - Price is NaN:', price);
      return '¥0.00';
    }
    
    return `¥${numPrice.toFixed(2)}`;
  };

  const formatTime = (dateStr: string): string => {
    const now = new Date();
    const diff = now.getTime() - new Date(dateStr).getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  const rawImageUrl = product.image_thumbnail_url || product.images?.[0]?.image_thumbnail_url || product.images?.[0]?.image_url;
  const mainImage = normalizeImageUrl(rawImageUrl);
  const sellerAvatar = normalizeImageUrl(product.seller?.profile_picture);
  
  // Debug log for product data
  if (__DEV__) {
    console.log('ProductCard - Product ID:', product.id);
    console.log('ProductCard - Title:', product.title);
    console.log('ProductCard - Price:', product.price);
    console.log('ProductCard - image_thumbnail_url:', product.image_thumbnail_url);
    console.log('ProductCard - images array:', product.images);
    console.log('ProductCard - rawImageUrl:', rawImageUrl);
    console.log('ProductCard - mainImage (normalized):', mainImage);
    console.log('ProductCard - seller:', product.seller);
    console.log('ProductCard - dormitory:', product.dormitory);
    console.log('ProductCard - condition_level:', product.condition_level);
  }

  if (variant === 'horizontal') {
    return (
      <PressableCard
        style={[styles.horizontalCard, style] as any}
        onPress={onPress}
        variant="outlined"
        padding="none"
      >
        <View style={styles.horizontalContent}>
          {mainImage ? (
            <Image
              source={{ uri: mainImage }}
              style={styles.horizontalImage}
              resizeMode="cover"
            />
          ) : (
            <View style={[styles.horizontalImage, { backgroundColor: colors.muted }]} />
          )}
          <View style={styles.horizontalInfo}>
            <Text
              style={[styles.productTitle, { color: colors.text }]}
              numberOfLines={2}
            >
              {product.title}
            </Text>
            <Text style={[styles.productPrice, { color: colors.primary }]}>
              {formatPrice(product.price)}
            </Text>
            <View style={styles.sellerRow}>
              <Avatar
                source={sellerAvatar ? { uri: sellerAvatar } : undefined}
                name={product.seller?.username}
                size="xs"
              />
              <Text style={[styles.sellerName, { color: colors.textSecondary }]}>
                {product.seller?.username || 'Unknown'}
              </Text>
            </View>
          </View>
        </View>
      </PressableCard>
    );
  }

  if (variant === 'compact') {
    return (
      <PressableCard
        style={[styles.compactCard, style] as any}
        onPress={onPress}
        padding="none"
      >
        {mainImage ? (
          <Image
            source={{ uri: mainImage }}
            style={styles.compactImage}
            resizeMode="cover"
          />
        ) : (
          <View style={[styles.compactImage, { backgroundColor: colors.muted }]} />
        )}
        <View style={styles.compactInfo}>
          <Text
            style={[styles.compactTitle, { color: colors.text }]}
            numberOfLines={1}
          >
            {product.title}
          </Text>
          <Text style={[styles.compactPrice, { color: colors.primary }]}>
            {formatPrice(product.price)}
          </Text>
        </View>
      </PressableCard>
    );
  }

  return (
    <PressableCard
      style={[styles.card, style] as any}
      onPress={onPress}
      padding="none"
    >
      {/* Product Image */}
      <View style={styles.imageContainer}>
        {mainImage ? (
          <Image
            source={{ uri: mainImage }}
            style={styles.image}
            resizeMode="cover"
          />
        ) : (
          <View style={[styles.image, { backgroundColor: colors.muted }]} />
        )}
        {/* Badges */}
        <View style={styles.badgeContainer}>
          {product.condition_level && (
            <Badge
              label={product.condition_level.name}
              variant="primary"
              size="sm"
            />
          )}
          {product.exchange_type && (
            <Badge
              label="Exchange"
              variant="secondary"
              size="sm"
              style={{ marginLeft: spacing.xs }}
            />
          )}
        </View>
        {/* Favorite Button */}
        <TouchableOpacity
          style={[styles.favoriteButton, { backgroundColor: colors.card }]}
          onPress={onFavoritePress}
        >
          <Text style={{ fontSize: 16 }}>
            {isFavorite ? '❤️' : '🤍'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Product Info */}
      <View style={styles.info}>
        <Text
          style={[styles.productTitle, { color: colors.text }]}
          numberOfLines={2}
        >
          {product.title}
        </Text>
        <Text style={[styles.productPrice, { color: colors.primary }]}>
          {formatPrice(product.price)}
        </Text>

        {/* Seller Info - Only show if not hidden */}
        {!hideSeller && (
          <TouchableOpacity
            style={styles.sellerRow}
            onPress={onSellerPress}
          >
            <Avatar
              source={sellerAvatar ? { uri: sellerAvatar } : undefined}
              name={product.seller?.username}
              size="xs"
            />
            <Text style={[styles.sellerName, { color: colors.textSecondary }]}>
              {product.seller?.username || 'Unknown'}
            </Text>
            <Text style={[styles.timeAgo, { color: colors.textTertiary }]}>
              • {formatTime(product.created_at)}
            </Text>
          </TouchableOpacity>
        )}

        {/* Location - Only show if not hidden */}
        {!hideLocation && (() => {
          const dorm = product.dormitory;
          if (dorm && 'dormitory_name' in dorm && dorm.dormitory_name) {
            return (
              <View style={styles.locationRow}>
                <Text style={styles.locationIcon}>📍</Text>
                <Text style={[styles.locationText, { color: colors.textTertiary }]} numberOfLines={1}>
                  {dorm.dormitory_name}
                </Text>
              </View>
            );
          }
          return null;
        })()}
      </View>
    </PressableCard>
  );
};

const styles = StyleSheet.create({
  card: {
    flex: 1,
    margin: spacing.xs,
  },
  imageContainer: {
    position: 'relative',
  },
  image: {
    width: '100%',
    aspectRatio: 1,
    borderTopLeftRadius: spacing.md,
    borderTopRightRadius: spacing.md,
  },
  badgeContainer: {
    position: 'absolute',
    top: spacing.sm,
    left: spacing.sm,
    flexDirection: 'row',
  },
  favoriteButton: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  info: {
    padding: spacing.sm,
  },
  productTitle: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: spacing.xs,
    lineHeight: 20,
  },
  productPrice: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: spacing.sm,
  },
  sellerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sellerName: {
    fontSize: 12,
    marginLeft: spacing.xs,
    flex: 1,
  },
  timeAgo: {
    fontSize: 11,
    marginLeft: spacing.xs,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.xs,
  },
  locationIcon: {
    fontSize: 12,
    marginRight: spacing.xs,
  },
  locationText: {
    fontSize: 11,
    flex: 1,
  },
  // Horizontal variant
  horizontalCard: {
    marginHorizontal: spacing.md,
    marginVertical: spacing.xs,
  },
  horizontalContent: {
    flexDirection: 'row',
  },
  horizontalImage: {
    width: 100,
    height: 100,
    borderTopLeftRadius: spacing.md,
    borderBottomLeftRadius: spacing.md,
  },
  horizontalInfo: {
    flex: 1,
    padding: spacing.sm,
    justifyContent: 'space-between',
  },
  // Compact variant
  compactCard: {
    flex: 1,
    margin: spacing.xs,
  },
  compactImage: {
    width: '100%',
    aspectRatio: 1,
    borderTopLeftRadius: spacing.md,
    borderTopRightRadius: spacing.md,
  },
  compactInfo: {
    padding: spacing.xs,
  },
  compactTitle: {
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 2,
  },
  compactPrice: {
    fontSize: 14,
    fontWeight: '700',
  },
});

export default ProductCard;
